/* ==========================================================
   story.js  ―  会話シーンの再生（画面の中のRPG風メッセージウィンドウ）
   ・タップで次へ（文字が出ている途中なら、いっきに全部表示）
   ・右上の「スキップ」で最後まで飛ばす
   ・Story.play('prologue') は Promise を返すので、終わったら次の処理ができる
   ========================================================== */

const Story = {
  queue: [], idx: 0, scene: null, typing: null, resolve: null, full: '',

  init() {
    byId('story-modal').addEventListener('click', (e) => {
      if (e.target.closest('#story-skip')) return;
      this.advance();
    });
    byId('story-skip').onclick = (e) => { e.stopPropagation(); Audio2.se('close'); this.finish(); };
  },
  seen(key) { return !!S.story.seen[key]; },

  /* 未読のときだけ流す */
  playOnce(key) { return this.seen(key) ? Promise.resolve() : this.play(key); },

  play(key) {
    const sc = STORY[key];
    if (!sc) return Promise.resolve();
    S.story.seen[key] = true; Save.write();
    this.scene = sc; this.idx = -1;
    const m = byId('story-modal');
    this.setBg(key, sc);
    byId('story-title').innerHTML = esc(sc.title || '') + (sc.sub ? `<small>${esc(sc.sub)}</small>` : '');
    m.classList.remove('fx-dark', 'fx-glow', 'fx-big');
    m.classList.remove('show-title'); void m.offsetWidth; m.classList.add('show-title', 'open');
    byId('story-box').classList.add('hide');
    Audio2.se('open');
    return new Promise(res => {
      this.resolve = res;
      // タイトルを少し見せてから最初のセリフ
      this.titleTimer = setTimeout(() => { byId('story-box').classList.remove('hide'); this.advance(); }, sc.title ? 1300 : 0);
    });
  },

  advance() {
    if (this.titleTimer && this.idx < 0) { clearTimeout(this.titleTimer); this.titleTimer = null; byId('story-box').classList.remove('hide'); }
    if (this.typing) { this.stopTyping(true); return; }   // 途中なら全部表示
    this.idx++;
    const line = this.scene.lines[this.idx];
    if (!line) { this.finish(); return; }
    const [who, text, fx] = line;
    this.fx(fx || '');
    const c = STORY_CHARS[who] || { name: who, icon: '' };
    const face = byId('story-face');
    face.innerHTML = c.image ? Img.html(c.image, c.icon) : (c.icon || '');
    face.style.display = c.icon || c.image ? '' : 'none';
    byId('story-name').textContent = c.name || '';
    byId('story-name').style.display = c.name ? '' : 'none';
    byId('story-box').classList.toggle('narr', !who);
    this.full = text.replace(/\{weapon\}/g, Player.weapon().name).replace(/\{name\}/g, 'きみ');
    this.type();
    if (!/shake|flash/.test(fx || '')) Audio2.se('tap');
  },
  /* ---------- 背景：その おはなしの エリアの背景を うしろに出す ----------
     ・region_N … その地方の さいしょのエリア   clear_N … その地方の さいごのエリア
     ・シーンに area: 番号 か bg: '画像' を書けば、そちらが優先
     ・STORY_BG（data/story.js）に書いた シーンは その画像（かじや など）
     ・bg: 'none' … 背景なし（エンディングのように、うしろの画面を見せたいとき） */
  bgFor(key, sc) {
    let area = null;
    if (sc.bg) return sc.bg === 'none' ? null : { img: sc.bg, place: sc.place || '' };
    if (sc.area) area = Data.area(sc.area);
    else if (STORY_BG[key] !== undefined) { const b = STORY_BG[key]; return b ? { img: b.img, place: b.place || '' } : null; }
    else {
      const m = /^(region|clear)_(\d+)$/.exec(key);
      const r = m && Data.region(Number(m[2]));
      if (r) area = Data.area(m[1] === 'region' ? r.areas[0] : r.areas[r.areas.length - 1]);
    }
    if (!area) return null;
    const ok = Player.areaNameVisible(area.no) || this.seen(key);
    const th = AREA_THEMES[area.theme] || AREA_THEMES.grass;
    return { img: area.bg, theme: th, place: ok ? `${th.icon} ${area.name}` : '' };
  },
  setBg(key, sc) {
    const m = byId('story-modal'), bg = byId('story-bg'), pl = byId('story-place');
    const b = this.bgFor(key, sc);
    m.classList.toggle('has-bg', !!b);
    // 画像が まだ無いときは、テーマの色の グラデーション（火山なら赤、雪なら白…）
    const th = (b && b.theme) || AREA_THEMES.grass;
    bg.style.backgroundImage = b ? `url('${b.img}'), linear-gradient(180deg, ${th.color}, ${th.dark})` : 'none';
    bg.style.animation = 'none'; void bg.offsetWidth; bg.style.animation = '';
    pl.textContent = b && b.place ? (/^\p{Extended_Pictographic}/u.test(b.place) ? b.place : '📍 ' + b.place) : '';
    pl.style.display = b && b.place ? '' : 'none';
  },

  /* 演出：shake ゆれる / flash 光る / dark 暗く赤く / glow あたたかく / big 文字を大きく */
  fx(list) {
    const m = byId('story-modal'), box = byId('story-box');
    m.classList.toggle('fx-dark', /dark/.test(list));
    m.classList.toggle('fx-glow', /glow/.test(list));
    m.classList.toggle('fx-big', /big/.test(list));
    if (/shake/.test(list)) { box.classList.remove('fx-shake'); void box.offsetWidth; box.classList.add('fx-shake'); Audio2.se('hit'); Audio2.vibe(60); }
    if (/flash/.test(list)) { const f = byId('story-flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); if (!/shake/.test(list)) Audio2.se('craft'); }
  },
  type() {
    const el = byId('story-text');
    let i = 0;
    el.textContent = '';
    byId('story-next').classList.remove('on');
    this.typing = setInterval(() => {
      i += 1;
      el.textContent = this.full.slice(0, i);
      if (i >= this.full.length) this.stopTyping(false);
    }, 38);
  },
  stopTyping(showAll) {
    clearInterval(this.typing); this.typing = null;
    if (showAll) byId('story-text').textContent = this.full;
    byId('story-next').classList.add('on');
  },
  finish() {
    this.stopTyping(false);
    clearTimeout(this.titleTimer); this.titleTimer = null;
    byId('story-modal').classList.remove('open', 'show-title', 'fx-dark', 'fx-glow', 'fx-big');
    const r = this.resolve; this.resolve = null;
    if (r) r();
  },

  /* その地方の さいごのエリアの「ぬし」（章のおわりの合図） */
  regionBoss(no) {
    const r = Data.region(no); if (!r) return null;
    const a = Data.area(r.areas[r.areas.length - 1]); if (!a) return null;
    return a.targets.find(t => t.isBoss && t.id !== GAME.FINAL_BOSS) || null;
  },
  /* たおした ぬし が 章のおわりなら、その章の おわりの おはなし の名前を返す */
  clearKeyFor(target) {
    if (!target || !target.isBoss) return null;
    const a = Data.area(target.area); if (!a) return null;
    const b = this.regionBoss(a.region);
    return b && b.id === target.id && STORY['clear_' + a.region] ? 'clear_' + a.region : null;
  },
  /* 見られるか（見た ／ 条件を みたしている） */
  canView(t) { return this.seen(t.key) || (t.unlock ? !!t.unlock() : false); },

  /* ---------- 「📜 おはなし」：見たシーンを見なおす（章ごとに まとめて表示） ---------- */
  openLog() {
    const rows = [];
    let total = 0, opened = 0;
    STORY_TRIGGERS.filter(t => STORY[t.key]).forEach(t => {
      const sc = STORY[t.key], ok = this.canView(t), fresh = ok && !this.seen(t.key);
      total++; if (ok) opened++;
      const isClear = t.key.startsWith('clear_');
      const label = ok ? `${esc(sc.title)}${sc.sub ? `<small>${esc(sc.sub)}</small>` : ''}` : '？？？';
      rows.push(`<button class="storylog-row ${ok ? '' : 'locked'} ${isClear ? 'sub' : ''}" data-k="${t.key}"><span>${ok ? (isClear ? '⭐' : '📜') : '🔒'}</span><b>${label}</b>${fresh ? '<i class="storylog-new">NEW</i>' : ''}</button>`);
    });
    byId('storylog-list').innerHTML = `<div class="storylog-count">見つけた おはなし　<b>${opened} / ${total}</b></div>` + rows.join('')
      + (S.cleared ? `<button class="storylog-row ending" data-k="__ending"><span>🎬</span><b>エンディングを もういちど みる</b></button>` : '');
    $$('#storylog-list .storylog-row').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      if (k === '__ending') { UI.close('storylog-modal', true); Ending.play(true); return; }
      const t = STORY_TRIGGERS.find(x => x.key === k);
      if (!t || !this.canView(t)) { Audio2.se('error'); return; }
      this.play(k).then(() => { if (UI.isOpen('storylog-modal')) this.openLog(); });
    });
    UI.open('storylog-modal');
  }
};
