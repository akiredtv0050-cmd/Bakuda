/* ==========================================================
   settings.js  ―  設定（音量・バイブ・アップデート情報・データ削除）
   ========================================================== */

const Settings = {
  init() {
    $$('.vol-steps').forEach(box => {
      const key = box.dataset.key;
      box.innerHTML = `<button class="vol-mute" data-v="0" aria-label="消音">🔇</button>` +
        Array.from({ length: VOL_STEPS }, (_, i) => `<button class="vol-bar" data-v="${i + 1}" style="--h:${40 + i * 15}%" aria-label="音量${i + 1}"></button>`).join('') +
        `<span class="vol-num"></span>`;
      box.onclick = (e) => {
        const b = e.target.closest('[data-v]'); if (!b) return;
        this.setVol(key, Number(b.dataset.v));
      };
    });
    byId('cfg-vibe').onclick = () => this.toggleVibe();
    byId('cfg-version').textContent = GAME.version;
    byId('update-list').innerHTML = CHANGELOG.map((v, i) => `<div class="update-card ${i === 0 ? 'latest' : ''}">
        <div class="update-head"><b>${esc(v.version)}</b><small>${esc(v.date)}</small>${i === 0 ? '<span class="update-new">さいしん</span>' : ''}</div>
        <ul>${v.items.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>`).join('');
    byId('cfg-update').onclick = () => UI.open('update-modal');
    byId('cfg-secret').onclick = () => this.openSecret();
    byId('secret-ok').onclick = () => this.useSecret();
    byId('secret-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.useSecret(); });
    byId('cfg-reset').onclick = () => this.reset();
  },
  open() { this.refresh(); UI.open('config-modal'); },
  refresh() {
    $$('.vol-steps').forEach(box => {
      const v = S.settings[box.dataset.key];
      $$('[data-v]', box).forEach(b => b.classList.toggle('on', Number(b.dataset.v) <= v && Number(b.dataset.v) > 0));
      box.querySelector('.vol-mute').classList.toggle('muted', v === 0);
      box.querySelector('.vol-num').textContent = v === 0 ? 'OFF' : v;
    });
    byId('adv-sound-img').src = `assets/images/ui/${S.settings.bgmVol > 0 ? 'supika_o' : 'supika_x'}.png`;
    const vb = byId('cfg-vibe');
    vb.textContent = S.settings.vibe ? 'ON' : 'OFF';
    vb.className = `btn-rpg xs ${S.settings.vibe ? 'is-green' : 'is-gray'}`;
  },
  setVol(key, v) {
    S.settings[key] = v;
    Save.write();
    if (key === 'bgmVol') { if (v > 0) S.settings.lastBgmVol = v; Audio2.applyVolume(); }
    Audio2.se('tap');           // 今の音量で鳴らして確認
    this.refresh();
  },
  /* ぼうけん画面のスピーカー：BGMを消す / 元に戻す */
  muteBgm() {
    this.setVol('bgmVol', S.settings.bgmVol > 0 ? 0 : (S.settings.lastBgmVol || 3));
  },
  toggleVibe() {
    S.settings.vibe = !S.settings.vibe;
    Save.write();
    Audio2.se('tap');
    if (S.settings.vibe) Audio2.vibe(30);
    this.refresh();
  },
  /* ---------- 隠しコマンド（画面の中で入力。ブラウザのポップアップは使わない） ---------- */
  normCode(s) {
    return String(s || '').normalize('NFKC').trim().toUpperCase().replace(/\s+/g, '')
      .replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));   // カタカナ→ひらがな
  },
  openSecret() {
    byId('secret-input').value = '';
    const r = byId('secret-result'); r.textContent = ''; r.className = 'secret-result';
    UI.open('secret-modal');
    setTimeout(() => byId('secret-input').focus(), 100);
  },
  useSecret() {
    const input = this.normCode(byId('secret-input').value);
    const r = byId('secret-result');
    const show = (text, cls) => { r.textContent = text; r.className = 'secret-result ' + cls; void r.offsetWidth; r.classList.add('pop'); };
    if (!input) return;
    const c = SECRET_CODES.find(x => this.normCode(x.code) === input);
    if (!c) { Audio2.se('error'); show('…なにも おこらなかった。', 'ng'); return; }
    const key = this.normCode(c.code);
    if (c.once && S.usedCodes.includes(key)) { Audio2.se('error'); show('このコマンドは もう つかったよ！', 'ng'); return; }
    const rw = c.reward || {};
    if (typeof rw.mats === 'number') DB.materials.forEach(m => Player.addMat(m.id, rw.mats));
    else if (rw.mats) Object.entries(rw.mats).forEach(([name, n]) => { const m = DB.matByName[name]; if (m) Player.addMat(m.id, n); });
    if (rw.level) S.tapLevel += rw.level;
    if (c.once) S.usedCodes.push(key);
    Save.write();
    Audio2.se('levelup');
    show('✨ ' + (c.msg || 'なにかを もらった！'), 'ok');
    Achv.announce(Achv.check());
    byId('secret-input').value = '';
    Menu.update();
  },

  async reset() {
    const ok = await UI.confirm({ title: '⚠️ データを けす', html: 'ぜんぶの セーブデータ を けして<br>さいしょから に もどします。<br><b>もとには もどせません！</b>', ok: 'けす', cancel: 'やめる', danger: true });
    if (!ok) return;
    Save.reset();
    location.reload();
  }
};
