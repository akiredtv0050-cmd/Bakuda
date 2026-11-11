/* ==========================================================
   zukan.js  ―  図鑑（前作「おさかな絵巻」と同じしくみ）
   ----------------------------------------------------------
   タブ → コンプリート率 → [エリア/種類えらび][NEWを消す][並べ替え] → 3列のカード → くわしく
   ※ 武器・アクセは「名前が登録されている段階」だけが図鑑にのります
   ========================================================== */

const ZUKAN_TABS = {
  monster:  { label: 'モンスター', filter: 'area', hint: '⚔️ たたかう で であえる' },
  object:   { label: 'オブジェ',   filter: 'area', hint: '⛏️ さがす で みつかる' },
  weapon:   { label: 'ぶき',       filter: 'type', hint: '🔨 かじや で つくれる' },
  acc:      { label: 'アクセ',     filter: 'type', hint: '🔨 かじや で つくれる' },
  material: { label: 'そざい',     filter: 'area', hint: '🎒 たおすと 手に入る' }
};
const ZUKAN_SORTS = {
  no:      { label: '番号順' },
  noRev:   { label: '番号の逆順' },
  kana:    { label: '五十音順' },
  kanaRev: { label: '五十音の逆順' }
};

const Zukan = {
  returnTo: 'menu',

  init() {
    $$('#zukan-tabs .zukan-main-tab').forEach(b => b.onclick = () => {
      if (S.zukan.tab === b.dataset.tab) return;
      Audio2.se('change');
      this.saveScroll();
      S.zukan.tab = b.dataset.tab; Save.write();
      this.render(true);
    });
    byId('zukan-close').onclick = () => this.close();
  },

  open(from) {
    this.returnTo = from || 'menu';
    if (from === 'adventure') Adventure.stopTimer();
    UI.show('zukan');
    Audio2.se('open');
    if (!ZUKAN_TABS[S.zukan.tab]) S.zukan.tab = 'monster';
    this.render(false);
    byId('zukan-grid').scrollTop = S.zukan.scroll || 0;
  },
  close() {
    this.saveScroll();
    Audio2.se('close');
    if (this.returnTo === 'adventure') { UI.show('adventure'); Adventure.updateHeader(); }
    else Menu.show();
  },
  saveScroll() { S.zukan.scroll = byId('zukan-grid').scrollTop; Save.write(); },

  /* ---------- データの取り出し ---------- */
  /* 今のタブの「全部」 */
  allEntries(tab) {
    switch (tab) {
      case 'monster': return DB.targets.filter(t => t.kind === 'monster');
      case 'object':  return DB.targets.filter(t => t.kind === 'object');
      case 'material': return DB.materials.slice();
      case 'weapon': case 'acc': {
        const out = [];
        Data.typeList(tab).forEach(t => Data.line(tab, t.id).forEach(i => { if (i.registered) out.push(i); }));
        return out;
      }
    }
    return [];
  },
  isFound(tab, e) {
    if (tab === 'weapon' || tab === 'acc') return Player.owns(e.id);
    if (tab === 'material') return Player.seen(e.id) || (S.materials[e.id] || 0) > 0;
    return Player.seen(e.id);
  },
  filterKey(e, tab) { return ZUKAN_TABS[tab].filter === 'type' ? e.type : String(e.area); },
  currentFilter() {
    const tab = S.zukan.tab;
    const f = (S.zukan.filter || {})[tab];
    if (f) return f;
    return ZUKAN_TABS[tab].filter === 'type' ? Data.typeList(tab)[0].id : 'all';
  },
  filterLabel(tab, key) {
    if (key === 'all') return 'すべて';
    if (ZUKAN_TABS[tab].filter === 'type') { const t = Data.typeInfo(tab, key); return t ? `${t.icon} ${t.name}` : key; }
    const a = Data.area(Number(key)); return a ? `${a.no}. ${Player.areaNameVisible(a.no) ? a.name : '？？？'}` : key;
  },
  sortKey() { return ZUKAN_SORTS[S.zukan.sort] ? S.zukan.sort : 'no'; },
  numOf(e) { return e.stage || e.no || 0; },

  /* ---------- 描画 ---------- */
  render(resetScroll) {
    const tab = S.zukan.tab;
    $$('#zukan-tabs .zukan-main-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));

    const all = this.allEntries(tab);
    const got = all.filter(e => this.isFound(tab, e)).length;
    const pct = all.length ? Math.floor(got / all.length * 100) : 0;
    byId('zukan-progress-num').textContent = `${pct}% (${got}/${all.length})`;
    byId('zukan-progress-bar').style.width = pct + '%';

    this.renderFilter(all);
    this.renderGrid(all);
    if (resetScroll) byId('zukan-grid').scrollTop = 0;
  },

  renderFilter(all) {
    const tab = S.zukan.tab, box = byId('zukan-filter');
    const f = this.currentFilter();
    const isType = ZUKAN_TABS[tab].filter === 'type';
    const newCount = all.filter(e => Player.isNew(e.id)).length;
    const done = f !== 'all' && (() => { const l = all.filter(e => this.filterKey(e, tab) === f); return l.length && l.every(e => this.isFound(tab, e)); })();
    box.innerHTML = `
      <button class="zukan-pick-btn" id="zk-pick">${isType ? '🗂️ しゅるい' : '📍 エリア'}：<b>${esc(this.filterLabel(tab, f))}${done ? ' ✅' : ''}</b> ▼</button>
      <button class="zukan-newclear-btn" id="zk-new" ${newCount ? '' : 'disabled'}>${newCount ? `✔ NEWを消す<small>(${newCount})</small>` : '✔ NEWなし'}</button>
      <button class="zukan-sort-btn" id="zk-sort">↕ 並べ替え：<b>${ZUKAN_SORTS[this.sortKey()].label}</b></button>`;
    byId('zk-pick').onclick = () => this.openPicker(all);
    byId('zk-new').onclick = () => { all.forEach(e => { if (S.seen[e.id]) S.seen[e.id].isNew = false; }); Save.write(); Audio2.se('tap'); this.render(false); };
    byId('zk-sort').onclick = () => {
      const ks = Object.keys(ZUKAN_SORTS);
      S.zukan.sort = ks[(ks.indexOf(this.sortKey()) + 1) % ks.length]; Save.write();
      Audio2.se('tap'); this.render(true);
    };
  },

  renderGrid(all) {
    const tab = S.zukan.tab, f = this.currentFilter();
    let list = f === 'all' ? all.slice() : all.filter(e => this.filterKey(e, tab) === f);
    const key = this.sortKey();
    if (key.startsWith('kana')) list.sort((a, b) => a.name.localeCompare(b.name, 'ja') || this.numOf(a) - this.numOf(b));
    else {
      const tIdx = (e) => Data.typeList(tab === 'acc' ? 'acc' : 'weapon').findIndex(t => t.id === e.type);
      list.sort((a, b) => (tab === 'weapon' || tab === 'acc' ? tIdx(a) - tIdx(b) : a.area - b.area) || this.numOf(a) - this.numOf(b));
    }
    if (key.endsWith('Rev')) list.reverse();

    const grid = byId('zukan-grid');
    if (!list.length) { grid.innerHTML = `<div class="zukan-empty">まだ ここには なにも 登録されていません。<br><small>（データを追加すると ここに ならびます）</small></div>`; return; }
    // 見出し：エリア別（番号順のときだけ）
    const heads = !key.startsWith('kana') && f === 'all';
    let lastHead = null, html = '';
    list.forEach(e => {
      if (heads) {
        const h = ZUKAN_TABS[tab].filter === 'type' ? e.type : e.area;
        if (h !== lastHead) { lastHead = h; html += `<div class="zukan-sec-head">${esc(this.filterLabel(tab, String(h)))}</div>`; }
      }
      const found = this.isFound(tab, e);
      const num = pad3(this.numOf(e));
      if (found) {
        html += `<div class="zukan-card found" data-id="${e.id}">
          ${Player.isNew(e.id) ? '<span class="zukan-new-badge">NEW</span>' : ''}
          <span class="zk-num">${num}</span>
          <div class="zk-img">${Img.html(e.image, e.icon || e.sprite)}</div>
          <div class="zk-name">${esc(e.name)}</div></div>`;
      } else {
        html += `<div class="zukan-card" data-id="${e.id}">
          <span class="zk-num">${num}</span>
          <div class="zk-img"><span class="zk-q">？</span></div>
          <div class="zk-name unknown">${ZUKAN_TABS[tab].hint}</div></div>`;
      }
    });
    grid.innerHTML = html;
    $$('.zukan-card.found', grid).forEach(c => c.onclick = () => this.openDetail(c.dataset.id));
  },

  /* ---------- エリア / 種類えらび ---------- */
  openPicker(all) {
    const tab = S.zukan.tab, isType = ZUKAN_TABS[tab].filter === 'type';
    const keys = ['all'].concat(isType ? Data.typeList(tab).map(t => t.id) : [...new Set(all.map(e => String(e.area)))].sort((a, b) => a - b));
    const cur = this.currentFilter();
    UI.pick({
      title: isType ? '🗂️ しゅるいを えらぶ' : '📍 エリアを えらぶ',
      rows: keys.map(k => {
        const l = k === 'all' ? all : all.filter(e => this.filterKey(e, tab) === k);
        const got = l.filter(e => this.isFound(tab, e)).length;
        const done = k !== 'all' && l.length && got >= l.length;
        return { key: k, label: esc(this.filterLabel(tab, k)) + (done ? ' ✅' : ''), sub: `${got}/${l.length}`, active: cur === k, done };
      }),
      onPick: (k) => {
        S.zukan.filter = S.zukan.filter || {};
        S.zukan.filter[tab] = k; Save.write();
        this.render(true);
      }
    });
  },

  /* ---------- くわしく ---------- */
  openDetail(id) {
    const tab = S.zukan.tab;
    const e = tab === 'material' ? Data.mat(id) : (tab === 'weapon' || tab === 'acc') ? Data.item(id) : Data.target(id);
    if (!e) return;
    byId('zd-no').textContent = (tab === 'weapon' || tab === 'acc') ? `${e.typeName} No.${pad3(e.stage)}` : `No.${pad3(e.no)}`;
    byId('zd-title').textContent = `【${e.name}】`;
    byId('zd-img').innerHTML = Img.html(e.image, e.icon || e.sprite).replace('<img ', `<img data-zoom="${esc(e.name)}" `);
    byId('zd-desc').textContent = e.desc || '（せつめいは まだありません）';
    const area = Data.area(e.area);
    const rows = [];
    if (tab === 'monster' || tab === 'object') {
      rows.push(['📍 でるところ', area ? area.name : '-'], ['❤️ HP', fmt(e.hp)]);
      if (e.time) rows.push(['⏱️ せいげん時間', `${e.time} 秒`]);
      rows.push(['🎁 おとすもの', e.drop ? Data.mat(e.drop).name : 'なし'], [tab === 'monster' ? '⚔️ たおした数' : '⛏️ こわした数', `${fmt((S.seen[e.id] || {}).n || 0)} 回`]);
    } else if (tab === 'material') {
      rows.push(['📍 おもなエリア', area ? area.name : '-'],
        ['🎯 てにいれかた', e.sources.length ? e.sources.map(s => Player.seen(s) ? Data.target(s).name : '？？？').join('、') : 'まだ わからない'],
        ['🎒 もっている数', `${fmt(S.materials[e.id] || 0)} こ`]);
    } else {
      rows.push(['⚔️ こうげき力', Player.owns(e.id) && Player.quality(e.id) !== 'normal' ? `ATK ${fmt(Player.atkOf(e))}（${QUALITY[Player.quality(e.id)].name} ×${Player.mult(e.id)}）` : `ATK ${fmt(e.atk)}`], ['📍 エリア', area ? area.name : '-'],
        ['🔨 ざいりょう', e.costMats.length ? e.costMats.map(c => `${Data.mat(c.id).name}×${c.n}`).join('、') : 'じゅんび中']);
    }
    byId('zd-stats').innerHTML = rows.map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('');
    if (S.seen[id] && S.seen[id].isNew) { S.seen[id].isNew = false; Save.write(); this.render(false); }
    UI.open('zukan-detail-modal');
  }
};
