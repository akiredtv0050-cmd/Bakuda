/* ==========================================================
   achievements.js  ―  実績のチェックと「🏆 じっせき」画面
   ・Achv.check() を、たおした／きたえた／レベルアップ などのあとに呼ぶ
   ・新しく達成したら、いまの画面の中で知らせる（ブラウザの通知は使わない）
   ========================================================== */

const Achv = {
  tab: 'all',
  TROPHY: { copper: 'assets/images/trophy/trophy_copper.png', silver: 'assets/images/trophy/trophy_silver.png', gold: 'assets/images/trophy/trophy_gold.png' },
  TROPHY_FB: { copper: '🥉', silver: '🥈', gold: '🥇' },

  value(a) { const f = ACHV_STATS[a.stat]; try { return f ? f() : 0; } catch (e) { return 0; } },
  done(a) { return !!S.achv[a.id]; },

  /* 達成したものを記録して、新しく達成したものを返す */
  check(silent) {
    const got = [];
    ACHIEVEMENTS.forEach(a => {
      if (this.done(a)) return;
      if (this.value(a) >= a.goal) { S.achv[a.id] = { at: Date.now(), isNew: !silent }; got.push(a); }
    });
    if (got.length) { Save.write(); this.updateBadge(); }
    return got;
  },
  /* いまの画面に合わせて知らせる */
  announce(list) {
    if (!list || !list.length) return;
    Audio2.se('get');
    if (UI.current === 'adventure') {
      list.forEach((a, i) => setTimeout(() => Adventure.notify(`実績「<b>${esc(a.name)}</b>」達成！`, '🏆', 'gold'), 400 + i * 500));
    } else {
      this.popup(list);
    }
  },
  /* 画面の中央下に出るカード（タップで閉じる・自動で消える） */
  popup(list) {
    const box = byId('achv-pop');
    box.innerHTML = list.slice(0, 3).map(a => `<div class="achv-pop-card">${Img.html(this.TROPHY[a.tier], this.TROPHY_FB[a.tier], 'achv-pop-img')}
      <div><small>🏆 実績を 達成！</small><b>${esc(a.name)}</b></div></div>`).join('');
    box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
    clearTimeout(this._popT);
    this._popT = setTimeout(() => box.classList.remove('show'), 2600);
    box.onclick = () => box.classList.remove('show');
  },
  newCount() { return Object.values(S.achv).filter(r => r.isNew).length; },
  updateBadge() {
    const n = this.newCount(), b = byId('achv-badge');
    if (b) { b.textContent = n; b.hidden = !n; }
  },

  /* ---------- 画面 ---------- */
  open() {
    this.check(true);
    this.render();
    UI.open('achv-modal');
  },
  render() {
    const cats = ['all', ...new Set(ACHIEVEMENTS.map(a => a.cat))];
    const total = ACHIEVEMENTS.length, got = ACHIEVEMENTS.filter(a => this.done(a)).length;
    const pct = Math.floor(got / total * 100);
    byId('achv-progress-num').textContent = `${pct}% (${got}/${total})`;
    byId('achv-progress-bar').style.width = pct + '%';
    byId('achv-tabs').innerHTML = cats.map(c => {
      const l = c === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.cat === c);
      const g = l.filter(a => this.done(a)).length;
      return `<button class="chip ${this.tab === c ? 'active' : ''}" data-c="${esc(c)}">${c === 'all' ? 'すべて' : esc(c)} <small>${g}/${l.length}</small></button>`;
    }).join('');
    $$('#achv-tabs .chip').forEach(b => b.onclick = () => { this.tab = b.dataset.c; Audio2.se('change'); this.render(); });
    const list = this.tab === 'all' ? ACHIEVEMENTS : ACHIEVEMENTS.filter(a => a.cat === this.tab);
    byId('achv-list').innerHTML = list.map(a => {
      const ok = this.done(a), rec = S.achv[a.id];
      const hide = a.hidden && !ok;
      const v = Math.min(a.goal, this.value(a));
      const p = Math.floor(v / a.goal * 100);
      return `<div class="achv-card ${ok ? 'done' : ''} tier-${a.tier}">
        ${rec && rec.isNew ? '<span class="zukan-new-badge">NEW</span>' : ''}
        <div class="achv-icon">${ok ? Img.html(this.TROPHY[a.tier], this.TROPHY_FB[a.tier]) : '<span class="achv-lock">🔒</span>'}</div>
        <div class="achv-body">
          <b>${hide ? '？？？' : esc(a.name)}</b>
          <small>${hide ? 'ひみつの 実績。どうすれば いいかな…？' : esc(a.desc)}</small>
          ${ok ? `<div class="achv-date">✔ たっせい！</div>` : hide ? '' : `<div class="bar-outer achv-bar"><div class="bar-inner is-zukan" style="width:${p}%"></div></div><div class="achv-num">${fmt(v)} / ${fmt(a.goal)}</div>`}
        </div></div>`;
    }).join('');
    // 見たら NEW を消す
    list.forEach(a => { if (S.achv[a.id]) S.achv[a.id].isNew = false; });
    Save.write(); this.updateBadge();
  }
};
