/* ==========================================================
   equip.js  ―  そうび画面（武器1つ＋アクセ3つ）
   ========================================================== */

const Equip = {
  kind: 'weapon',     // 下の一覧に出すもの weapon / acc
  type: null,         // 種類（null = 作ったものがある最初の種類）
  accSlot: null,      // アクセ枠を選んで開いたときの枠番号

  open() {
    this.kind = 'weapon'; this.type = null; this.accSlot = null;
    this.render();
    UI.open('equip-modal');
  },

  render() {
    const w = Player.weapon();
    byId('equip-total').textContent = fmt(Player.totalAtk());
    const ws = byId('equip-weapon-slot');
    ws.innerHTML = `<div class="eq-img">${Img.html(w.image, w.icon)}</div>
      <div><small>${esc(w.typeName)} No.${w.stage}</small><div class="eq-name">${esc(w.name)}${Player.qMark(w.id)}</div><small>ATK +${fmt(Player.atkOf(w))}</small></div>`;
    ws.onclick = () => { this.kind = 'weapon'; this.accSlot = null; Audio2.se('change'); this.render(); };

    const row = byId('equip-acc-row');
    row.innerHTML = '';
    S.equip.acc.forEach((id, i) => {
      const a = Data.item(id);
      const d = document.createElement('div');
      d.className = `acc-slot ${a ? 'filled' : ''} ${this.accSlot === i ? 'picking' : ''}`;
      d.innerHTML = a ? `${Img.html(a.image, a.icon)}<span>${esc(a.name)}</span><button class="x" aria-label="はずす">✖</button>` : `<span style="font-size:20px">＋</span><span>アクセ${i + 1}</span>`;
      d.onclick = (e) => {
        if (e.target.classList.contains('x')) { S.equip.acc[i] = null; Save.write(); Audio2.se('close'); this.render(); return; }
        this.kind = 'acc'; this.accSlot = i; Audio2.se('change'); this.render();
      };
      if (this.accSlot === i) d.style.outline = '3px solid var(--gold)';
      row.appendChild(d);
    });

    // 種類チップ（作ったことがある種類だけ）
    const types = Data.typeList(this.kind).filter(t => Player.progressOf(this.kind, t.id) > 0);
    if (!this.type || !types.some(t => t.id === this.type)) this.type = types[0] ? types[0].id : null;
    byId('equip-list-title').textContent = this.kind === 'weapon' ? 'もっている ぶき（タップでそうび）' : `アクセ${(this.accSlot ?? 0) + 1} に つける アクセ`;
    byId('equip-type-chips').innerHTML = types.map(t =>
      `<button class="chip ${t.id === this.type ? 'active' : ''}" data-t="${t.id}">${t.icon} ${esc(t.name)} <small>${Player.progressOf(this.kind, t.id)}</small></button>`).join('');
    $$('#equip-type-chips .chip').forEach(c => c.onclick = () => { this.type = c.dataset.t; Audio2.se('change'); this.render(); });

    const list = byId('equip-list');
    if (!this.type) { list.innerHTML = `<div class="empty-msg">まだ ${this.kind === 'weapon' ? 'ぶき' : 'アクセ'} を つくっていません。<br>🔨 かじや で つくろう！</div>`; return; }
    const owned = Data.line(this.kind, this.type).slice(0, Player.progressOf(this.kind, this.type)).reverse(); // 強い順
    list.innerHTML = owned.map(it => {
      const on = this.kind === 'weapon' ? S.equip.weapon === it.id : S.equip.acc.includes(it.id);
      return `<div class="equip-row ${on ? 'on' : ''}" data-id="${it.id}">
        <div class="er-img">${Img.html(it.image, it.icon)}</div>
        <div class="er-name"><small>No.${it.stage}</small>${esc(it.name)}${Player.qMark(it.id)}<small>ATK +${fmt(Player.atkOf(it))}</small></div>
        <button class="btn-rpg xs ${on ? 'is-gray' : 'is-orange'}" ${on ? 'disabled' : ''}>${on ? 'そうび中' : 'そうび'}</button></div>`;
    }).join('');
    $$('#equip-list .equip-row button').forEach(b => b.onclick = () => this.equip(b.closest('.equip-row').dataset.id));
  },

  equip(id) {
    const it = Data.item(id);
    if (!it || !Player.owns(id)) return;
    if (it.kind === 'weapon') S.equip.weapon = id;
    else {
      let slot = this.accSlot;
      if (slot == null) slot = S.equip.acc.indexOf(null);
      if (slot == null || slot < 0) slot = 0;
      S.equip.acc[slot] = id;
    }
    Save.write();
    Audio2.se('tap');
    this.render();
    Menu.update();
    Achv.announce(Achv.check());
  }
};
