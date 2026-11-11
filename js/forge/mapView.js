/* ==========================================================
   mapView.js  ―  Googleマップのように「ドラッグ・ズーム」できる表示エンジン
   ----------------------------------------------------------
   ・1本指ドラッグ / マウスドラッグ … 移動（はなすと慣性でスーッと動く）
   ・2本指ピンチ / マウスホイール … ズーム
   ・画面に映っている物だけを作る（仮想描画）… 2000個以上あっても軽い
   ・引いたとき(lodScale未満)は画像を読まずに「点」で表示 … 通信量も節約
   ・ミニマップ（右上）をタップするとその場所へ飛ぶ

   使い方（forge.js 参照）:
     const view = new MapView({ viewport, world, minimap, ... });
     view.setContent({ width, height, items:[{id,x,y,w,h,...}], render(item, el, lowLod) });
   ========================================================== */

class MapView {
  constructor(opt) {
    this.vp = opt.viewport;          // 外わく（見える範囲）
    this.world = opt.world;          // 中身（大きな地図）
    this.mini = opt.minimap || null; // ミニマップ canvas
    this.minScale = opt.minScale || 0.2;
    this.maxScale = opt.maxScale || 2;
    this.lodScale = opt.lodScale || 0.4;
    this.onTap = opt.onTap || (() => { });
    this.onCamera = opt.onCamera || (() => { });
    this.drawMini = opt.drawMini || null;   // (ctx, k) ミニマップに描く関数

    this.x = 0; this.y = 0; this.s = 1;     // カメラ（ワールドの左上が画面のどこにあるか＋倍率）
    this.W = 1000; this.H = 1000;
    this.items = [];
    this.live = new Map();                  // いま画面に出ている要素 id → element
    this.lowLod = null;
    this.pointers = new Map();
    this.vel = { x: 0, y: 0 };
    this._raf = 0; this._anim = 0; this._inertia = 0;
    this._bind();
  }

  /* ---------- 中身をセット ---------- */
  setContent({ width, height, items, render }) {
    this.W = width; this.H = height;
    this.items = items;
    this.renderItem = render;
    this.world.style.width = width + 'px';
    this.world.style.height = height + 'px';
    this.live.forEach(el => el.remove());
    this.live.clear();
    this.lowLod = null;
    this.requestRender();
  }
  /* 表示中の要素を作り直す（状態が変わったとき） */
  refresh() {
    this.live.forEach(el => el.remove());
    this.live.clear();
    this.requestRender();
  }
  refreshItem(id) {
    const el = this.live.get(id);
    if (el) { el.remove(); this.live.delete(id); }
    this.requestRender();
  }

  /* ---------- カメラ ---------- */
  vpSize() { return { w: this.vp.clientWidth, h: this.vp.clientHeight }; }
  clamp() {
    const { w, h } = this.vpSize();
    this.s = Math.min(this.maxScale, Math.max(this.minScale, this.s));
    const pad = 80;
    const cw = this.W * this.s, ch = this.H * this.s;
    this.x = cw + pad * 2 <= w ? (w - cw) / 2 : Math.min(pad, Math.max(w - cw - pad, this.x));
    this.y = ch + pad * 2 <= h ? (h - ch) / 2 : Math.min(pad, Math.max(h - ch - pad, this.y));
  }
  setCamera(x, y, s) { this.x = x; this.y = y; this.s = s; this.clamp(); this.requestRender(); this._camChanged(); }
  /* ワールド座標 (wx, wy) が画面の中心に来るように */
  centerOn(wx, wy, s) {
    const { w, h } = this.vpSize();
    s = s || this.s;
    this.setCamera(w / 2 - wx * s, h / 2 - wy * s, s);
  }
  /* なめらかに飛ぶ */
  flyTo(wx, wy, s, ms = 450) {
    cancelAnimationFrame(this._anim); cancelAnimationFrame(this._inertia);
    const { w, h } = this.vpSize();
    s = Math.min(this.maxScale, Math.max(this.minScale, s || this.s));
    const from = { x: this.x, y: this.y, s: this.s };
    // 目的地も枠内におさめておく
    const save = { x: this.x, y: this.y, s: this.s };
    this.x = w / 2 - wx * s; this.y = h / 2 - wy * s; this.s = s; this.clamp();
    const to = { x: this.x, y: this.y, s: this.s };
    Object.assign(this, save);
    const t0 = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    const step = (now) => {
      const t = Math.min(1, (now - t0) / ms), e = ease(t);
      // 倍率は掛け算で補間（ズーム感が自然になる）
      this.s = from.s * Math.pow(to.s / from.s, e);
      this.x = from.x + (to.x - from.x) * e;
      this.y = from.y + (to.y - from.y) * e;
      this.requestRender();
      if (t < 1) this._anim = requestAnimationFrame(step); else this._camChanged();
    };
    this._anim = requestAnimationFrame(step);
  }
  fitAll() {
    const { w, h } = this.vpSize();
    const s = Math.min(w / this.W, h / this.H) * 0.96;
    this.flyTo(this.W / 2, this.H / 2, s);
  }
  zoomAt(factor, sx, sy) {
    const { w, h } = this.vpSize();
    if (sx == null) { sx = w / 2; sy = h / 2; }
    const ns = Math.min(this.maxScale, Math.max(this.minScale, this.s * factor));
    const wx = (sx - this.x) / this.s, wy = (sy - this.y) / this.s;
    this.s = ns;
    this.x = sx - wx * ns; this.y = sy - wy * ns;
    this.clamp(); this.requestRender(); this._camChanged();
  }
  zoomSmooth(factor) {
    const { w, h } = this.vpSize();
    const wx = (w / 2 - this.x) / this.s, wy = (h / 2 - this.y) / this.s;
    this.flyTo(wx, wy, this.s * factor, 250);
  }
  _camChanged() {
    clearTimeout(this._camTimer);
    this._camTimer = setTimeout(() => this.onCamera({ x: this.x, y: this.y, s: this.s }), 300);
  }

  /* ---------- 描画（1フレームに1回だけ） ---------- */
  requestRender() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => { this._raf = 0; this.render(); });
  }
  render() {
    this.world.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${this.s})`;
    // ラベルは引いたときに大きくする（読めるように）
    this.world.style.setProperty('--label-scale', Math.min(3.2, Math.max(1, 0.62 / this.s)).toFixed(3));

    const low = this.s < this.lodScale;
    if (low !== this.lowLod) {               // 表示モードが変わったら作り直し
      this.lowLod = low;
      this.world.classList.toggle('lod-low', low);
      this.live.forEach(el => el.remove()); this.live.clear();
    }

    // 画面に映っている範囲（少し広め）
    const { w, h } = this.vpSize();
    const m = 160 / this.s;
    const L = -this.x / this.s - m, T = -this.y / this.s - m;
    const R = L + w / this.s + m * 2, B = T + h / this.s + m * 2;

    const keep = new Set();
    for (const it of this.items) {
      if (it.x + it.w < L || it.x > R || it.y + it.h < T || it.y > B) continue;
      keep.add(it.id);
      if (!this.live.has(it.id)) {
        const el = document.createElement('div');
        el.dataset.id = it.id;
        el.style.left = it.x + 'px'; el.style.top = it.y + 'px';
        el.style.width = it.w + 'px'; el.style.height = it.h + 'px';
        this.renderItem(it, el, low);
        this.world.appendChild(el);
        this.live.set(it.id, el);
      }
    }
    // 画面外に出たものは消す（メモリ節約）
    this.live.forEach((el, id) => { if (!keep.has(id)) { el.remove(); this.live.delete(id); } });
    this.drawMinimap();
  }

  drawMinimap() {
    if (!this.mini || !this.drawMini) return;
    const c = this.mini, ctx = c.getContext('2d');
    const k = Math.min(c.width / this.W, c.height / this.H);
    const ox = (c.width - this.W * k) / 2, oy = (c.height - this.H * k) / 2;
    this._miniK = { k, ox, oy };
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.save(); ctx.translate(ox, oy);
    this.drawMini(ctx, k);
    // いま見ている範囲
    const { w, h } = this.vpSize();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.strokeRect(-this.x / this.s * k, -this.y / this.s * k, w / this.s * k, h / this.s * k);
    ctx.strokeStyle = '#23163a'; ctx.lineWidth = 1;
    ctx.strokeRect(-this.x / this.s * k - 1.5, -this.y / this.s * k - 1.5, w / this.s * k + 3, h / this.s * k + 3);
    ctx.restore();
  }

  /* ---------- 操作 ---------- */
  _bind() {
    const vp = this.vp;
    vp.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-ui]')) return;            // ボタン類はスルー
      cancelAnimationFrame(this._anim); cancelAnimationFrame(this._inertia);
      try { vp.setPointerCapture(e.pointerId); } catch (_) { }
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        this._down = { x: e.clientX, y: e.clientY, t: performance.now(), target: e.target, moved: false };
        this._last = { x: e.clientX, y: e.clientY, t: performance.now() };
        this.vel = { x: 0, y: 0 };
      } else if (this.pointers.size === 2) {
        this._pinchStart();
      }
    });
    vp.addEventListener('pointermove', (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const prev = this.pointers.get(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 1) {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
        if (this._down && Math.hypot(e.clientX - this._down.x, e.clientY - this._down.y) > 8) this._down.moved = true;
        if (this._down && !this._down.moved) return;
        this.x += dx; this.y += dy; this.clamp();
        const now = performance.now(), dt = Math.max(1, now - this._last.t);
        this.vel = { x: 0.8 * (dx / dt) + 0.2 * this.vel.x, y: 0.8 * (dy / dt) + 0.2 * this.vel.y };
        this._last = { x: e.clientX, y: e.clientY, t: now };
        this.requestRender();
      } else if (this.pointers.size === 2) {
        this._pinchMove();
      }
    });
    const up = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const wasPinch = this.pointers.size >= 2;
      this.pointers.delete(e.pointerId);
      if (wasPinch) { this._down = null; if (this.pointers.size === 1) { const p = [...this.pointers.values()][0]; this._last = { x: p.x, y: p.y, t: performance.now() }; } this._camChanged(); return; }
      if (this.pointers.size > 0) return;
      const d = this._down; this._down = null;
      if (d && !d.moved && performance.now() - d.t < 500) {
        const hit = d.target.closest && d.target.closest('[data-id]');
        this.onTap(hit ? hit.dataset.id : null, e);
        return;
      }
      // 慣性（はなした後もスーッと動く）
      if (performance.now() - this._last.t < 80) this._startInertia(); else this._camChanged();
    };
    vp.addEventListener('pointerup', up);
    vp.addEventListener('pointercancel', up);
    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      const r = vp.getBoundingClientRect();
      this.zoomAt(Math.exp(-e.deltaY * 0.0016), e.clientX - r.left, e.clientY - r.top);
    }, { passive: false });
    window.addEventListener('resize', () => { this.clamp(); this.requestRender(); });

    if (this.mini) {
      const jump = (e) => {
        e.stopPropagation(); e.preventDefault();
        if (!this._miniK) return;
        const r = this.mini.getBoundingClientRect();
        const px = (e.clientX - r.left) * (this.mini.width / r.width), py = (e.clientY - r.top) * (this.mini.height / r.height);
        const { k, ox, oy } = this._miniK;
        this.flyTo((px - ox) / k, (py - oy) / k, Math.max(this.s, this.lodScale + 0.1), 350);
      };
      this.mini.addEventListener('pointerdown', jump);
    }
  }
  _pinchStart() {
    const [a, b] = [...this.pointers.values()];
    const r = this.vp.getBoundingClientRect();
    this._pinch = {
      dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, s: this.s,
      wx: (((a.x + b.x) / 2 - r.left) - this.x) / this.s,
      wy: (((a.y + b.y) / 2 - r.top) - this.y) / this.s
    };
    if (this._down) this._down.moved = true;
  }
  _pinchMove() {
    const [a, b] = [...this.pointers.values()];
    const r = this.vp.getBoundingClientRect();
    const p = this._pinch; if (!p) return;
    const ns = Math.min(this.maxScale, Math.max(this.minScale, p.s * Math.hypot(a.x - b.x, a.y - b.y) / p.dist));
    const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
    this.s = ns; this.x = mx - p.wx * ns; this.y = my - p.wy * ns;
    this.clamp(); this.requestRender();
  }
  _startInertia() {
    let vx = this.vel.x * 16, vy = this.vel.y * 16;   // px/フレーム
    const step = () => {
      vx *= 0.92; vy *= 0.92;
      this.x += vx; this.y += vy; this.clamp(); this.render();
      if (Math.abs(vx) + Math.abs(vy) > 0.4) this._inertia = requestAnimationFrame(step); else this._camChanged();
    };
    this._inertia = requestAnimationFrame(step);
  }
}
