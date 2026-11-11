/* ==========================================================
   forge.js  ―  鍛冶屋（ワールドマップ型の強化ツリー）
   ----------------------------------------------------------
   ・55エリア＝55の「島」。武器は1つの島に3段階（165段階）、アクセは1段階（55段階）
   ・島はヘビのように折り返して並び、道（すごろく）でつながる
   ・形は種類ごとにランダム（シード固定なので毎回同じ形）
   ・島の名前は「地方」ごとに公開（regions.js）。まだの地方は ？？？
   ・並べ方は config.js の FORGE_LAYOUT で変えられます
   ========================================================== */

const Forge = {
  view: null,
  kind: 'weapon',
  type: 'stick',
  layout: null,       // { W, H, islands:[], nodes:[], nodeById:{} }
  selected: null,

  init() {
    this.view = new MapView({
      viewport: byId('forge-viewport'),
      world: byId('forge-world'),
      minimap: byId('forge-minimap'),
      minScale: FORGE_LAYOUT.minScale,
      maxScale: FORGE_LAYOUT.maxScale,
      lodScale: FORGE_LAYOUT.lodScale,
      onTap: (id) => this.tap(id),
      onCamera: (cam) => { S.forgeView.cams[this.kind + ':' + this.type] = cam; Save.write(); },
      drawMini: (ctx, k) => this.drawMini(ctx, k)
    });

    $$('.forge-kind-tabs .wk-tab').forEach(b => b.onclick = () => {
      if (b.dataset.kind === this.kind) return;
      Audio2.se('change');
      const first = Data.typeList(b.dataset.kind)[0].id;
      this.select(b.dataset.kind, S.forgeView['last_' + b.dataset.kind] || first);
    });
    byId('forge-zoom-in').onclick = () => this.view.zoomSmooth(1.5);
    byId('forge-zoom-out').onclick = () => this.view.zoomSmooth(1 / 1.5);
    byId('forge-zoom-all').onclick = () => this.view.fitAll();
    byId('forge-jump-next').onclick = () => { Audio2.se('tap'); this.jumpNext(true); };
    byId('forge-panel-close').onclick = () => this.closePanel();
    byId('fp-craft').onclick = () => this.craft();
    byId('fp-reforge').onclick = () => this.reforge();
    byId('forge-back').onclick = () => { Audio2.se('close'); this.closePanel(true); Menu.show(); };
    $$('.forge-zoom-btns button, #forge-jump-next, #forge-minimap').forEach(el => el.setAttribute('data-ui', ''));
  },

  open() {
    UI.show('forge');
    Audio2.playBgm(BGM.forge);
    this.select(S.forgeView.kind || 'weapon', S.forgeView.type || 'stick', true);
  },

  /* ---------- 地図の形を作る ----------
     種類ごとに「種(シード)」を決めてランダムに形を作るので、
     剣と斧でちがう形になり、しかも毎回同じ形になります（セーブしたカメラ位置もずれない） */
  layouts: {},
  getLayout(kind, typeId) {
    const key = kind + ':' + typeId;
    if (!this.layouts[key]) this.layouts[key] = this.buildLayout(kind, typeId);
    return this.layouts[key];
  },
  buildLayout(kind, typeId) {
    const L = FORGE_LAYOUT;
    const rnd = L.randomShape ? seededRandom(key2seed(kind + ':' + typeId)) : () => 0.5;
    const jit = (amp) => (rnd() - 0.5) * 2 * amp;
    const P = L.randomShape ? (rnd() < 0.5 ? 4 : 5) : L.islandsPerRow;   // 1回の折り返しまでの島の数
    const per = GAME.perArea(kind);
    const margin = 140, top = 170, sway = L.randomShape ? 70 : 0;
    const firstForward = L.randomShape ? rnd() < 0.5 : true;

    // 島の中の丸の並び方（左→右に進むときの形。右→左のときは左右反転）
    const PATTERNS = per === 1
      ? [[[0.5, 0.56]], [[0.42, 0.62]], [[0.58, 0.5]], [[0.5, 0.66]]]
      : [
        [[0.2, 0.66], [0.5, 0.38], [0.8, 0.66]],   // 山なり
        [[0.2, 0.40], [0.5, 0.70], [0.8, 0.40]],   // 谷
        [[0.2, 0.72], [0.5, 0.55], [0.8, 0.38]],   // 右上がり
        [[0.2, 0.38], [0.5, 0.55], [0.8, 0.72]],   // 右下がり
        [[0.22, 0.42], [0.3, 0.72], [0.8, 0.56]],  // カギ型
        [[0.2, 0.62], [0.62, 0.36], [0.8, 0.70]],  // ジグザグ
        [[0.25, 0.38], [0.7, 0.44], [0.55, 0.74]]  // まわりこみ
      ];

    const islands = [], nodes = [];
    // 道の向き：横にジグザグ（行ごとに折り返す）か、縦にジグザグ（列ごとに折り返す）かもランダム
    const vertical = L.randomShape && rnd() < 0.5;
    const lines = Math.ceil(GAME.AREA_COUNT / P);           // 折り返しの回数
    const cols = vertical ? lines : P, rowsN = vertical ? P : lines;
    const shift = Array.from({ length: lines }, () => jit(sway));
    for (let i = 0; i < GAME.AREA_COUNT; i++) {
      const line = Math.floor(i / P), pos = i % P;
      const forward = (line % 2 === 0) === firstForward;     // 折り返すたびに向きが反対
      const along = forward ? pos : P - 1 - pos;
      let col, vRow, dx = 0, dy = 0;
      if (vertical) { col = line; vRow = rowsN - 1 - along; dx = shift[line] * 0.5; }
      else { col = along; vRow = L.startFromBottom ? rowsN - 1 - line : line; dx = shift[line]; }
      const cellX = margin + sway + col * L.islandW + dx, cellY = top + vRow * L.islandH + dy;
      // 島そのもの：少しずらして大きさもバラバラに
      const sc = L.randomShape ? 0.86 + rnd() * 0.12 : 0.92;
      const iw = L.islandW * sc, ih = L.islandH * sc;
      const x = cellX + (L.islandW - iw) / 2 + jit(18), y = cellY + (L.islandH - ih) / 2 + jit(18);
      const area = DB.areas[i];
      islands.push({ id: `isl_${i + 1}`, kind: 'island', area, x, y, w: iw, h: ih, shape: Math.floor(rnd() * 4) });
      const pat = PATTERNS[Math.floor(rnd() * PATTERNS.length)];
      for (let k = 0; k < per; k++) {
        const p = pat[k % pat.length];
        let fx, fy;
        if (vertical) {        // 縦に進む：パターンを90度まわす（上へ進むときは下から上へ）
          fx = p[1];
          fy = 0.36 + (forward ? 1 - p[0] : p[0]) * 0.46;
        } else {
          fx = forward ? p[0] : 1 - p[0];
          fy = p[1];
        }
        fx = Math.min(0.85, Math.max(0.15, fx + jit(0.04)));
        fy = Math.min(0.80, Math.max(0.34, fy + jit(0.04)));
        let cx = x + fx * iw, cy = y + fy * ih;
        // 同じ島の丸どうしが近すぎたら、はなす（重なり防止）
        for (let t = 0; t < 4; t++) {
          for (let j = nodes.length - k; j < nodes.length; j++) {
            const o = nodes[j], ddx = cx - o.cx, ddy = cy - o.cy, d = Math.hypot(ddx, ddy) || 1;
            if (d < L.nodeSize * 1.25) { const push = (L.nodeSize * 1.25 - d); cx += ddx / d * push; cy += ddy / d * push; }
          }
        }
        cx = Math.min(x + iw * 0.86, Math.max(x + iw * 0.14, cx));
        cy = Math.min(y + ih * 0.82, Math.max(y + ih * 0.32, cy));
        const stage = i * per + k + 1;
        nodes.push({ id: `n_${stage}`, kind: 'node', stage, cx, cy, x: cx - L.nodeSize / 2, y: cy - L.nodeSize / 2, w: L.nodeSize, h: L.nodeSize + 26 });
      }
    }
    const nodeByStage = {};
    nodes.forEach(n => { nodeByStage[n.stage] = n; });
    const W = cols * L.islandW + margin * 2 + sway * 2, H = rowsN * L.islandH + margin + top;
    const last = nodes[nodes.length - 1];
    const goal = { id: 'goal', kind: 'goal', x: last.cx - 70, y: Math.max(10, last.cy - L.islandH * 0.62 - 60), w: 140, h: 90 };
    return { W, H, islands, nodes, nodeByStage, goal, count: GAME.stageCount(kind) };
  },

  /* ---------- 種類をえらぶ ---------- */
  select(kind, type, first) {
    this.kind = kind; this.type = type;
    S.forgeView.kind = kind; S.forgeView.type = type; S.forgeView['last_' + kind] = type;
    $$('.forge-kind-tabs .wk-tab').forEach(b => b.classList.toggle('active', b.dataset.kind === kind));
    this.renderChips();
    this.closePanel(true);
    this.updateMats();
    this.line = Data.line(kind, type);
    const lay = this.layout = this.getLayout(kind, type);
    this.view.setContent({
      width: lay.W, height: lay.H,
      items: [...lay.islands, ...lay.nodes, lay.goal],
      render: (it, el, low) => this.renderItem(it, el, low)
    });
    this.drawRoad();
    this.updatePill();
    const cam = S.forgeView.cams[kind + ':' + type];
    // 画面サイズが決まってからカメラを置く
    requestAnimationFrame(() => {
      if (cam) this.view.setCamera(cam.x, cam.y, cam.s);
      else this.jumpNext(false);
    });
    if (!first) Save.write();
  },

  renderChips() {
    const box = byId('forge-type-chips');
    box.innerHTML = Data.typeList(this.kind).map(t => {
      const p = Player.progressOf(this.kind, t.id);
      return `<button class="chip ${t.id === this.type ? 'active' : ''}" data-t="${t.id}">${t.icon} ${esc(t.name)} <small>${p}/${GAME.stageCount(this.kind)}</small></button>`;
    }).join('');
    $$('.chip', box).forEach(c => c.onclick = () => { if (c.dataset.t !== this.type) { Audio2.se('change'); this.select(this.kind, c.dataset.t); } });
    const act = $('.chip.active', box);
    if (act) act.scrollIntoView({ inline: 'center', block: 'nearest' });
  },

  updateMats() { byId('forge-mats').textContent = fmt(Object.values(S.materials).reduce((a, b) => a + b, 0)); },

  updatePill() {
    const p = Player.progressOf(this.kind, this.type);
    const t = Data.typeInfo(this.kind, this.type);
    byId('forge-progress-pill').innerHTML = `${t.icon} ${esc(t.name)}：<b>${p}</b> / ${GAME.stageCount(this.kind)}`;
  },

  /* ---------- 1つずつの見た目 ---------- */
  renderItem(it, el, low) {
    if (it.kind === 'island') return this.renderIsland(it, el, low);
    if (it.kind === 'goal') { el.className = 'f-goal'; el.innerHTML = `<div class="goal-flag">🏁</div><div class="f-label">GOAL</div>`; return; }
    const item = this.line[it.stage - 1];
    const st = Player.nodeState(item);
    const block = st === 'next' ? Player.craftBlock(item) : 'x';
    const areaLock = !Player.areaUnlocked(item.area);
    const cls = ['fnode', st];
    if (st === 'next' && !block) cls.push('can');
    if (!item.registered) cls.push('unreg');
    if (areaLock && st !== 'done') cls.push('area-lock');
    if (this.selected === item.id) cls.push('selected');
    el.className = cls.join(' ');
    if (low) { el.innerHTML = '<div class="fn-dot"></div>'; return; }
    const showImg = item.registered && (st === 'done' || st === 'next' || FORGE_LAYOUT.showFutureImages);
    const inner = showImg ? Img.html(item.image, item.icon, 'fn-pic') : `<span class="fn-q">${!item.registered ? '…' : areaLock ? '🔒' : '？'}</span>`;
    el.innerHTML = `<div class="fn-ring">${inner}${st === 'done' ? '<span class="fn-check">✔</span>' : ''}${st === 'next' && !block ? '<span class="fn-bang">!</span>' : ''}</div>
      <div class="fn-no">${item.stage}</div>`;
  },

  renderIsland(it, el, low) {
    const a = it.area, th = AREA_THEMES[a.theme];
    const unlocked = Player.areaUnlocked(a.no);
    const known = Player.areaNameVisible(a.no);        // 地方が公開されていれば名前が見える
    el.className = `f-island shape${it.shape || 0} ${unlocked ? '' : 'locked'} ${known ? '' : 'unknown'}`;
    el.style.setProperty('--c', th.color);
    el.style.setProperty('--d', th.dark);
    const art = (!low && a.mapImage && known) ? `<img class="isl-art" src="${esc(a.mapImage)}" alt="" onerror="this.remove()">` : '';
    if (low) {   // 引いたときは番号だけ（地図のラベルと同じ考え方）
      el.innerHTML = `<div class="f-label lod"><span class="isl-no">${unlocked ? a.no : '🔒' + a.no}</span></div>`;
      return;
    }
    const label = known ? esc(a.name) + (unlocked ? '' : ` <small>🔒Lv.${a.reqLevel}</small>`) : '？？？';
    el.innerHTML = `${art}<div class="isl-deco">${known ? th.icon : '❔'}</div>
      <div class="f-label"><span class="isl-no">${a.no}</span>${label}</div>`;
  },

  /* ---------- 道（すごろくの線） ---------- */
  drawRoad() {
    const lay = this.layout;
    let svg = byId('forge-road');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'forge-road';
      byId('forge-world').prepend(svg);
    }
    svg.setAttribute('width', lay.W); svg.setAttribute('height', lay.H);
    svg.setAttribute('viewBox', `0 0 ${lay.W} ${lay.H}`);
    const pts = lay.nodes.map(n => [n.cx, n.cy]);
    const full = smoothPath(pts);
    const p = Player.progressOf(this.kind, this.type);
    const done = p >= 1 ? smoothPath(pts.slice(0, Math.min(pts.length, p + 1))) : '';
    svg.innerHTML = `
      <path d="${full}" class="road-edge"/>
      <path d="${full}" class="road-base"/>
      ${done ? `<path d="${done}" class="road-done"/>` : ''}`;
  },

  drawMini(ctx, k) {
    const lay = this.layout;
    lay.islands.forEach(i => {
      ctx.fillStyle = Player.areaUnlocked(i.area.no) ? AREA_THEMES[i.area.theme].color : '#6b6f86';
      ctx.fillRect(i.x * k, i.y * k, Math.max(1, i.w * k), Math.max(1, i.h * k));
    });
    const p = Player.progressOf(this.kind, this.type);
    ctx.fillStyle = '#ffd84a';
    lay.nodes.forEach(n => { if (n.stage <= p) ctx.fillRect(n.cx * k - 1.5, n.cy * k - 1.5, 3, 3); });
    const nx = lay.nodeByStage[Math.min(lay.count, p + 1)];
    if (nx && p < lay.count) { ctx.fillStyle = '#ff3b3b'; ctx.beginPath(); ctx.arc(nx.cx * k, nx.cy * k, 3.5, 0, Math.PI * 2); ctx.fill(); }
  },

  /* ---------- 操作 ---------- */
  jumpNext(animate) {
    const p = Player.progressOf(this.kind, this.type);
    const n = this.layout.nodeByStage[Math.min(this.layout.count, p + 1)];
    if (!n) return;
    if (animate) this.view.flyTo(n.cx, n.cy, 1); else this.view.centerOn(n.cx, n.cy, 0.9);
  },

  tap(id) {
    if (!id) { this.closePanel(); return; }
    if (!id.startsWith('n_')) {
      if (id.startsWith('isl_')) {          // 島をタップ → その島に寄る
        const isl = this.layout.islands.find(i => i.id === id);
        if (this.view.s < FORGE_LAYOUT.lodScale) { Audio2.se('tap'); this.view.flyTo(isl.x + isl.w / 2, isl.y + isl.h / 2, 0.9); }
        else this.closePanel();
      }
      return;
    }
    const stage = Number(id.slice(2));
    const item = this.line[stage - 1];
    if (this.view.s < FORGE_LAYOUT.lodScale) {      // 引きすぎのときは、まず寄る
      const n = this.layout.nodeByStage[stage];
      this.view.flyTo(n.cx, n.cy, 0.9);
    }
    Audio2.se('tap');
    this.openPanel(item);
  },

  openPanel(item) {
    const prevSel = this.selected;
    this.selected = item.id;
    if (prevSel) this.view.refreshItem('n_' + Data.item(prevSel).stage);
    this.view.refreshItem('n_' + item.stage);

    const st = Player.nodeState(item);
    const block = Player.craftBlock(item);
    const showImg = item.registered && (st !== 'locked' || FORGE_LAYOUT.showFutureImages);
    byId('fp-img').innerHTML = showImg ? Img.html(item.image, item.icon).replace('<img ', `<img data-zoom="${esc(item.name)}" `) : `<span class="img-fb">${item.registered ? '？' : '…'}</span>`;
    const area = Data.area(item.area);
    byId('fp-stage').textContent = `${item.typeName} No.${item.stage} ・ ${Player.areaNameVisible(area.no) ? area.name : '？？？'}`;
    byId('fp-name').textContent = st === 'locked' && !FORGE_LAYOUT.showFutureImages ? (item.registered ? '？？？' : 'じゅんび中') : (item.registered ? item.name : 'じゅんび中');
    const shownAtk = st === 'done' ? Player.atkOf(item) : item.atk;
    byId('fp-atk').innerHTML = fmt(shownAtk) + (st === 'done' ? Player.qMark(item.id) : '');
    const cur = item.kind === 'weapon' ? Player.weapon() : null;
    const diff = cur ? item.atk - Player.atkOf(cur) : 0;
    byId('fp-atk-diff').innerHTML = (cur && st !== 'done' && diff !== 0 ? `<span class="${diff > 0 ? 'up' : 'down'}">(${diff > 0 ? '+' : ''}${fmt(diff)})</span>` : '')
      + (st === 'next' ? `<span class="fp-mg-hint">ミニゲームで 最大 ×2！</span>` : '');
    byId('fp-desc').textContent = st === 'locked' ? 'ひとつ前の段階を作ると、くわしく見られるよ。' : (item.desc || (item.registered ? '' : 'この段階のデータはまだありません（スプレッドシートで募集中！）'));

    // 必要なもの
    const costEl = byId('fp-cost');
    const matRows = () => item.costMats.map(c => {
      const m = Data.mat(c.id), have = S.materials[c.id] || 0, ok = have >= c.n;
      return `<div class="cost-row ${ok ? 'ok' : 'ng'}"><span class="cost-img">${Img.html(m.image, m.icon)}</span><span class="cost-name">${esc(m.name)}</span><b>${fmt(have)} / ${fmt(c.n)}</b></div>`;
    }).join('');
    const q = Player.quality(item.id);
    if (st === 'done') {
      // 作ったあと：できばえ と、打ち込みやり直しの 案内
      const qtxt = q === 'normal' ? 'できばえ：ふつう' : `できばえ：${QUALITY[q].mark} ${QUALITY[q].name}（ATK ×${QUALITY[q].mult}）`;
      costEl.innerHTML = `<div class="fp-done">✔ つくった！ <small class="q-${q}">${qtxt}</small></div>`
        + (q === 'great' ? `<div class="fp-reforge-note great">★★ 大成功！ これ以上 きたえられないよ</div>`
          : `<div class="fp-reforge-note">${Player.canReforge(item) ? '同じ そざいで もういちど ミニゲームに ちょうせんできるよ（よいけっかの時だけ 上がる）' : '同じ そざいが そろうと「打ち込みやり直し」が できるよ'}</div>` + matRows());
    } else {
      const mats = item.costMats.map(c => {
        const m = Data.mat(c.id), have = S.materials[c.id] || 0, ok = have >= c.n;
        return `<div class="cost-row ${ok ? 'ok' : 'ng'}"><span class="cost-img">${Img.html(m.image, m.icon)}</span><span class="cost-name">${esc(m.name)}</span><b>${fmt(have)} / ${fmt(c.n)}</b></div>`;
      }).join('');
      costEl.innerHTML = mats || `<div class="cost-row ng"><span class="cost-img"><span class="img-fb">🚧</span></span><span class="cost-name">ひつような そざい は じゅんび中</span></div>`;
    }
    const btn = byId('fp-craft');
    btn.style.display = st === 'done' ? 'none' : '';
    btn.disabled = !!block;
    btn.innerHTML = block ? esc(block) : '🔨 きたえる！';
    // 打ち込みやり直し：作ってある ＆ 大成功じゃない ＆ 同じ素材が ある ときだけ 見える
    byId('fp-reforge').style.display = st === 'done' && Player.canReforge(item) ? '' : 'none';
    byId('forge-panel').classList.add('open');
  },
  closePanel(silent) {
    byId('forge-panel').classList.remove('open');
    if (this.selected) {
      const it = Data.item(this.selected);
      this.selected = null;
      if (it && it.kind === this.kind && it.type === this.type) this.view.refreshItem('n_' + it.stage);
    }
  },

  /* きたえる → ミニゲーム → ハンマーの演出 → 「◯◯ 完成！」（ブラウザの通知やポップアップは使わない） */
  async craft() {
    if (this.busy) return;
    const item = Data.item(this.selected);
    if (!item || Player.craftBlock(item)) return;
    this.busy = true;
    try {
      const grade = await MG.play(item);
      if (Player.craftBlock(item)) return;           // 念のため（ミニゲーム中に状態が変わったとき）
      const prevAtk = item.kind === 'weapon' ? Player.atkOf(Player.weapon()) : 0;
      if (!Player.craft(item, grade)) return;
      this.updateMats();
      this.drawRoad(); this.updatePill(); this.renderChips();
      this.view.refresh();
      Menu.update();
      this.closePanel(true);
      this.showResult(item, prevAtk, grade);
      const got = Achv.check();
      this.pendingAchv = got;
    } finally { this.busy = false; }
  },

  /* 打ち込みやり直し → ミニゲーム → ハンマー → けっか */
  async reforge(itemArg) {
    if (this.busy) return;
    const item = itemArg || Data.item(this.selected);
    if (!item || !Player.canReforge(item)) return;
    this.busy = true;
    try {
      const grade = await MG.play(item, null, { reforge: true });
      if (grade === 'cancel' || !Player.canReforge(item)) return;      // やめた → 素材は そのまま
      const prevAtk = Player.atkOf(item);
      const r = Player.reforge(item, grade);
      if (!r) return;
      this.updateMats(); this.view.refreshItem('n_' + item.stage);
      Menu.update();
      this.closePanel(true);
      this.pendingAchv = Achv.check();
      this.showResult(item, prevAtk, grade, r);
    } finally { this.busy = false; }
  },

  /* 「できた！」画面：① ハンマーで カンカン（約2.5秒・タップでとばせる）→ ② アイテムが光って「◯◯ 完成！」 */
  showResult(item, prevAtk, grade, re) {
    this.re = re || null;           // 打ち込みやり直しのとき { improved, before }
    const box = $('#craft-result-modal .modal-box');
    const ham = byId('cr-hammer');
    const sil = byId('crh-item');
    const q = Player.quality(item.id);
    box.classList.remove('play', 'reveal', 'q-good', 'q-great', 'q-normal');
    box.classList.add('forging');
    sil.innerHTML = Img.html(item.image, item.icon);
    byId('crh-text').textContent = '';
    ham.classList.remove('done');
    UI.open('craft-result-modal');

    const timers = [];
    const STRIKES = 4, GAP = 520;
    for (let i = 0; i < STRIKES; i++) {
      timers.push(setTimeout(() => {
        const hm = byId('crh-hammer');
        hm.classList.remove('hit'); void hm.offsetWidth; hm.classList.add('hit');
        timers.push(setTimeout(() => {
          Audio2.se('anvil'); Audio2.vibe(25);
          sil.style.setProperty('--heat', (i + 1) / STRIKES);
          ham.classList.remove('shake'); void ham.offsetWidth; ham.classList.add('shake');
          const t = byId('crh-text'); t.textContent = i === STRIKES - 1 ? 'カーン！！' : ['カン！', 'カン！', 'カーン！'][i];
          t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
          for (let k = 0; k < 10; k++) {
            const sp = document.createElement('i'); sp.className = 'crh-spark';
            const ang = -Math.PI * (0.1 + Math.random() * 0.8), dist = 50 + Math.random() * 70;
            sp.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); sp.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
            ham.appendChild(sp); setTimeout(() => sp.remove(), 650);
          }
        }, 160));
      }, 250 + i * GAP));
    }
    const reveal = () => {
      if (box.classList.contains('reveal')) return;
      timers.forEach(clearTimeout);
      ham.onclick = null;
      box.classList.remove('forging');
      const same = this.re && !this.re.improved;
      box.classList.add('reveal', 'q-' + (same ? 'normal' : q));
      void box.offsetWidth; box.classList.add('play');
      Audio2.se(same ? 'timeover' : q === 'normal' ? 'craft' : 'levelup'); Audio2.vibe(40);
      this.fillResult(item, prevAtk, grade);
    };
    timers.push(setTimeout(reveal, 250 + STRIKES * GAP + 350));
    ham.onclick = reveal;                                  // タップで とばせる
  },

  /* 「完成！」を とじたあとの おはなし（はじめての かじ ／ はじめての 大成功） */
  async afterStory() {
    if (S.stats.crafts > 0) await Story.playOnce('first_craft');
    if ((S.stats.greats || 0) > 0) await Story.playOnce('first_great');
  },

  fillResult(item, prevAtk, grade) {
    const q = Player.quality(item.id), Q = QUALITY[q];
    const equipped = item.kind === 'weapon' ? S.equip.weapon === item.id : S.equip.acc.includes(item.id);
    const re = this.re, GN = { fail: '失敗', skip: 'ふつう', good: '成功', great: '大成功' };
    byId('cr-title').innerHTML = !re ? `<span class="cr-tname">${esc(item.name)}</span>完成！`
      : re.improved ? `<span class="cr-tname">${esc(item.name)}</span>打ち直し 完成！` : `<span class="cr-tname">${esc(item.name)}</span>ざんねん…`;
    byId('cr-new').style.display = re ? 'none' : '';
    byId('cr-img').innerHTML = Img.html(item.image, item.icon).replace('<img ', `<img data-zoom="${esc(item.name)}" `);
    byId('cr-stage').textContent = `${item.typeName} No.${item.stage}`;
    byId('cr-grade').className = 'cr-grade g-' + q;
    byId('cr-grade').innerHTML = re
      ? (re.improved ? `${QUALITY[re.before].name} → ${Q.mark} ${Q.name}！ ATK ×${Q.mult}`
        : `けっか：${GN[grade] || grade}　できばえは ${Q.mark}${Q.name} の まま`)
      : grade === 'skip' ? 'ふつうに きたえた' : (q === 'normal' ? 'ミニゲーム 失敗… ふつうの できばえ' : `${Q.mark} ${Q.name}！ ATK ×${Q.mult} ${Q.mark}`);
    const atk = Player.atkOf(item);
    byId('cr-atk').textContent = fmt(atk);
    const diff = atk - prevAtk;
    byId('cr-diff').innerHTML = item.kind === 'weapon' && diff > 0 ? `<span class="up">(+${fmt(diff)})</span>` : '';
    byId('cr-equip').innerHTML = (re ? (re.improved && equipped ? '🛡️ そうび中！ こうげき力が 上がった！' : (re.improved ? '' : 'そざいは つかったけど、できばえは さがらないよ'))
      : equipped ? '🛡️ そうび しました！' : (item.kind === 'acc' ? 'アクセのわくが いっぱい（そうび画面で つけかえてね）' : ''))
      + (this.pendingAchv || []).map(a => `<div class="cr-achv">🏆 実績「${esc(a.name)}」達成！</div>`).join('');
    this.pendingAchv = null;
    const next = this.line[item.stage];
    const nb = byId('cr-next');
    if (re) {
      // やり直しのあと：まだ大成功じゃなくて 素材があれば「もういちど」
      const again = Player.canReforge(item);
      nb.style.display = again ? '' : 'none';
      nb.textContent = '🔁 もういちど';
      nb.onclick = () => { UI.close('craft-result-modal', true); Audio2.se('tap'); this.afterStory().then(() => this.reforge(item)); };
      byId('cr-close').onclick = () => { UI.close('craft-result-modal'); this.afterStory().then(() => { if (this.kind === item.kind && this.type === item.type) this.openPanel(item); }); };
      return;
    }
    nb.textContent = '▶ つぎの強化へ';
    nb.style.display = next ? '' : 'none';
    nb.onclick = () => {
      UI.close('craft-result-modal', true); Audio2.se('tap');
      const nn = this.layout.nodeByStage[next.stage];
      this.view.flyTo(nn.cx, nn.cy, Math.max(this.view.s, 0.8));
      this.afterStory().then(() => this.openPanel(next));
    };
    byId('cr-close').onclick = () => { UI.close('craft-result-modal'); this.afterStory(); };
    // マップの上でも キラッ
    const n = this.layout.nodeByStage[item.stage];
    if (n) {
      const fx = document.createElement('div');
      fx.className = 'craft-burst'; fx.style.left = n.cx + 'px'; fx.style.top = n.cy + 'px';
      byId('forge-world').appendChild(fx); setTimeout(() => fx.remove(), 900);
    }
  }
};

/* 点の列をなめらかな曲線(SVG path)にする */
function smoothPath(pts) {
  if (!pts.length) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t, c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t, c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/* シード付き乱数（同じ文字からは、いつも同じ乱数の列が出る） */
function key2seed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function seededRandom(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
