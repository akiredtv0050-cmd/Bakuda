/* ==========================================================
   menu.js  ―  タイトル画面・メインメニュー・もちもの・エリア移動
   ========================================================== */

const Menu = {
  init() {
    byId('version-label').textContent = GAME.version;
    byId('title-screen').addEventListener('click', () => this.start());
    byId('btn-adventure').onclick = () => { Audio2.se('tap'); Adventure.open(); };
    byId('btn-forge').onclick = () => { Audio2.se('tap'); Forge.open(); };
    byId('btn-equip').onclick = () => Equip.open();
    byId('btn-zukan').onclick = () => Zukan.open('menu');
    byId('btn-items').onclick = () => this.openItems();
    byId('btn-howto').onclick = () => { byId('btn-howto').classList.remove('highlight'); UI.open('howto-modal'); };
    byId('btn-config').onclick = () => Settings.open();
    byId('btn-achv').onclick = () => Achv.open();
    byId('btn-story').onclick = () => Story.openLog();
  },
  start() {
    if (UI.current !== 'title') return;
    Audio2.unlock();
    Audio2.se('tap');
    Audio2.playBgm(BGM.menu);
    // はじめての人には プロローグ
    Story.playOnce('prologue').then(() => this.show());
  },
  show() {
    UI.show('menu');
    Audio2.playBgm(BGM.menu);
    // はじめての人には「あそびかた」を目立たせる
    byId('btn-howto').classList.toggle('highlight', S.playSec < 30 && S.kills.monster + S.kills.object === 0);
    this.update();
  },
  update() {
    const w = Player.weapon();
    byId('menu-weapon-img').innerHTML = Img.html(w.image, w.icon);
    byId('menu-weapon-name').textContent = w.name;
    byId('menu-atk').textContent = fmt(Player.totalAtk());
    byId('menu-level').textContent = S.tapLevel;
    byId('menu-exp').textContent = fmt(S.tapExp);
    byId('menu-next').textContent = fmt(Player.nextExp());
    byId('menu-exp-bar').style.width = `${Math.min(100, S.tapExp / Player.nextExp() * 100)}%`;
    byId('menu-mats').textContent = fmt(Object.values(S.materials).reduce((a, b) => a + b, 0));
    byId('menu-kill-m').textContent = fmt(S.kills.monster);
    byId('menu-kill-o').textContent = fmt(S.kills.object);
    byId('menu-crafted').textContent = fmt(Object.values(S.forge).reduce((a, b) => a + b, 0) + Object.values(S.accForge).reduce((a, b) => a + b, 0));
    this.updateTime();
    byId('menu-clear-star').hidden = !S.cleared;
    Achv.updateBadge();
  },
  updateTime() {
    const h = Math.floor(S.playSec / 3600), m = Math.floor(S.playSec / 60) % 60;
    byId('menu-time').textContent = `${h}時間${String(m).padStart(2, '0')}分`;
  },

  /* ---------- もちもの（図鑑と同じ「エリアえらび」と「並べ替え」つき） ---------- */
  ITEM_SORTS: { no: '番号順', many: '多い順', few: '少ない順', kana: '五十音順' },
  openItems() {
    this.renderItems();
    UI.open('items-modal');
  },
  renderItems() {
    const owned = DB.materials.filter(m => (S.materials[m.id] || 0) > 0);
    const st = S.items;
    if (st.filter !== 'all' && !owned.some(m => String(m.area) === st.filter)) st.filter = 'all';
    const areaLabel = (k) => k === 'all' ? 'すべて' : `${k}. ${Player.areaNameVisible(Number(k)) ? Data.area(Number(k)).name : '？？？'}`;
    const sortKey = this.ITEM_SORTS[st.sort] ? st.sort : 'no';
    byId('items-filter').innerHTML = `
      <button class="zukan-pick-btn" id="it-pick">📍 エリア：<b>${esc(areaLabel(st.filter))}</b> ▼</button>
      <button class="zukan-sort-btn" id="it-sort">↕ <b>${this.ITEM_SORTS[sortKey]}</b></button>`;
    byId('it-pick').onclick = () => {
      const keys = ['all', ...[...new Set(owned.map(m => String(m.area)))].sort((a, b) => a - b)];
      UI.pick({
        title: '📍 エリアを えらぶ',
        rows: keys.map(k => {
          const l = k === 'all' ? owned : owned.filter(m => String(m.area) === k);
          return { key: k, label: esc(areaLabel(k)), sub: `${l.length}しゅるい`, active: st.filter === k };
        }),
        onPick: (k) => { st.filter = k; Save.write(); this.renderItems(); }
      });
    };
    byId('it-sort').onclick = () => {
      const ks = Object.keys(this.ITEM_SORTS);
      st.sort = ks[(ks.indexOf(sortKey) + 1) % ks.length]; Save.write();
      Audio2.se('tap'); this.renderItems();
    };
    let list = st.filter === 'all' ? owned.slice() : owned.filter(m => String(m.area) === st.filter);
    const n = (m) => S.materials[m.id] || 0;
    if (sortKey === 'many') list.sort((a, b) => n(b) - n(a) || a.no - b.no);
    else if (sortKey === 'few') list.sort((a, b) => n(a) - n(b) || a.no - b.no);
    else if (sortKey === 'kana') list.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    else list.sort((a, b) => a.area - b.area || a.no - b.no);
    byId('items-list').innerHTML = list.length ? list.map(m => `
      <div class="mat-card">
        <span class="mat-n">×${fmt(n(m))}</span>
        <div class="mat-img">${Img.html(m.image, m.icon).replace('<img ', `<img data-zoom="${esc(m.name)}" `)}</div>
        <div>${esc(m.name)}</div>
      </div>`).join('')
      : '<div class="empty-msg">まだ そざい を もっていません。<br>ぼうけん で あつめよう！</div>';
    byId('items-list').scrollTop = 0;
  },

  /* ---------- エリア移動（地方の島 → エリアの島 の2段階） ---------- */
  openMap() {
    byId('map-back').onclick = () => { Audio2.se('close'); this.renderRegions(); };
    this.renderRegions();
    UI.open('map-modal');
  },
  renderRegions() {
    byId('map-title').textContent = '🗺️ どの地方へ いく？';
    byId('map-sub').textContent = '島をえらぶと、その中のエリアが見られるよ';
    byId('map-back').hidden = true;
    const curRegion = Data.area(S.areaNo).region;
    const list = byId('map-list');
    list.className = 'modal-scroll map-sea region-grid';
    list.innerHTML = DB.regions.map((r, i) => {
      const th = AREA_THEMES[r.theme];
      const open = Player.regionRevealed(r.no);
      const opened = r.areas.filter(n => Player.areaUnlocked(n)).length;
      const lv = Data.area(r.areas[0]).reqLevel;
      return `<button class="region-isl shape${i % 4} ${open ? '' : 'locked'} ${r.no === curRegion ? 'current' : ''}" data-r="${r.no}" style="--c:${th.color};--d:${th.dark}">
        ${r.no === curRegion ? '<span class="isl-here">いまここ</span>' : ''}
        <span class="ri-icon">${open ? th.icon : '❔'}</span>
        <span class="ri-name">${open ? esc(r.name) : '？？？'}</span>
        <span class="ri-sub">${open ? `🗺️ ${opened} / ${r.areas.length} エリア` : `🔒 タップLv.${lv}`}</span>
      </button>`;
    }).join('');
    $$('.region-isl', list).forEach(b => b.onclick = () => {
      const r = Data.region(Number(b.dataset.r));
      if (!Player.regionRevealed(r.no)) { Audio2.se('error'); return; }
      Audio2.se('tap'); this.renderAreas(r);
    });
    const cur = $('.region-isl.current', list);
    if (cur) cur.scrollIntoView({ block: 'center' });
  },
  renderAreas(r) {
    const th = AREA_THEMES[r.theme];
    byId('map-title').textContent = `${th.icon} ${r.name}`;
    byId('map-sub').textContent = r.desc;
    byId('map-back').hidden = false;
    const list = byId('map-list');
    list.className = 'modal-scroll map-sea area-path';
    list.innerHTML = r.areas.map((n, i) => {
      const a = Data.area(n), at = AREA_THEMES[a.theme];
      const unlocked = Player.areaUnlocked(n), ready = a.targets.length > 0, cur = S.areaNo === n;
      const tag = cur ? 'いまここ' : !unlocked ? `🔒 Lv.${a.reqLevel}` : !ready ? 'じゅんび中' : 'いく！';
      return `${i ? '<div class="path-dots"></div>' : ''}
        <button class="area-isl shape${(n + 1) % 4} ${unlocked ? '' : 'locked'} ${ready ? '' : 'empty'} ${cur ? 'current' : ''} ${i % 2 ? 'right' : 'left'}" data-a="${n}" style="--c:${at.color};--d:${at.dark}">
          <span class="ai-no">${n}</span>
          <span class="ai-icon">${at.icon}</span>
          <span class="ai-body"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span>
          <span class="ai-tag">${tag}</span>
        </button>`;
    }).join('');
    $$('.area-isl', list).forEach(b => b.onclick = () => {
      const n = Number(b.dataset.a), a = Data.area(n);
      if (!Player.areaUnlocked(n)) { Audio2.se('error'); return; }
      if (S.areaNo === n) return;
      if (!a.targets.length) { Audio2.se('error'); UI.alert('🚧 じゅんび中', `「${esc(a.name)}」には まだ モンスターが いません。<br>もうすこし まってね！`); return; }
      S.areaNo = n; Save.write();
      Audio2.se('change');
      UI.close('map-modal', true);
      Adventure.loadArea();
    });
    list.scrollTop = 0;
  }
};
