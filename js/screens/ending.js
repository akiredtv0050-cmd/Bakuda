/* ==========================================================
   ending.js  ―  エンディング（まおうゼノグリムを たおしたとき）
   演出の順番：
     1. 白いフラッシュ＋画面がゆれる「まおうゼノグリムを たおした！」
     2. エンディングの会話（data/story.js の ending）
     3. 夜明けの空にスタッフロール＋きみの冒険の記録（流れ星・キラキラつき）
     4. エピローグ（data/story.js の epilogue）
     5. THE END ／ CLEAR のハンコ ／ メニューへ
   ・BGM は assets/bgm/ending.mp3 があればそれ、無ければタイトルの曲
   ========================================================== */

const Ending = {
  timers: [],
  later(fn, ms) { this.timers.push(setTimeout(fn, ms)); },
  clear() { this.timers.forEach(clearTimeout); this.timers = []; },

  init() {
    byId('ending-skip').onclick = () => { Audio2.se('tap'); this.showEnd(); };
    byId('ending-menu').onclick = () => { Audio2.se('tap'); this.close(); };
  },

  async play(replay) {
    Adventure.stopTimer();
    const scr = byId('ending-screen');
    // まだクリアしていなければ記録
    if (!S.cleared) { S.cleared = true; S.clearSec = S.playSec; Save.write(); }
    this.clear(); this.ending = false;
    scr.className = 'screen';                 // 演出の状態をリセット
    byId('ending-credits').innerHTML = this.creditsHTML();
    byId('ending-end').hidden = true;
    byId('ending-skip').hidden = true;
    UI.show('ending');

    // 1. たおした！（くりかえし見るときは 省略）
    if (!replay) {
      scr.classList.add('phase-defeat');
      Audio2.stopBgm(); Audio2.se('defeat'); Audio2.vibe([80, 60, 200]);
      await this.wait(2600);
      scr.classList.remove('phase-defeat');
    }
    // 2. 会話
    scr.classList.add('phase-dawn');
    Audio2.playBgm(BGM.ending, true);
    await this.wait(900);
    await Story.play('ending');
    // 3. スタッフロール
    scr.classList.add('phase-roll');
    byId('ending-skip').hidden = false;
    const roll = byId('ending-credits');
    roll.style.animation = 'none'; void roll.offsetWidth; roll.style.animation = '';
    this.later(() => this.showEnd(), 26000);
    // 作ったぶきが 空を ながれていく
    this.parade();
  },
  wait(ms) { return new Promise(r => this.later(r, ms)); },

  creditsHTML() {
    const crafted = Object.values(S.forge).reduce((a, b) => a + b, 0) + Object.values(S.accForge).reduce((a, b) => a + b, 0);
    const zk = DB.targets.filter(t => Player.seen(t.id)).length;
    const sec = S.clearSec || S.playSec, h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60;
    const achv = ACHIEVEMENTS.filter(a => S.achv[a.id]).length;
    const w = Player.weapon();
    return `<div class="cr-logo"><img src="assets/images/ui/logo_title.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'cr-logo-text',textContent:'爆打錬成！武器鍛冶クラフター'}))"></div>
      <div class="cr-sec">STAFF</div>
      ${ENDING_CREDITS.map(([role, name]) => `<div class="cr-row"><small>${esc(role)}</small><b>${esc(name)}</b></div>`).join('')}
      <div class="cr-sec">きみの ぼうけんの きろく</div>
      <div class="cr-stats">
        <div><small>クリアまでの時間</small><b>${h}時間${String(m).padStart(2, '0')}分</b></div>
        <div><small>たたいた回数</small><b>${fmt(S.stats.taps)}回</b></div>
        <div><small>たおした モンスター</small><b>${fmt(S.kills.monster)}体</b></div>
        <div><small>こわした オブジェクト</small><b>${fmt(S.kills.object)}こ</b></div>
        <div><small>きたえた ぶき・アクセ</small><b>${fmt(crafted)}こ</b></div>
        <div><small>ずかん（モンスター・オブジェ）</small><b>${zk} / ${DB.targets.length}</b></div>
        <div><small>実績</small><b>${achv} / ${ACHIEVEMENTS.length}</b></div>
        <div><small>さいごの ぶき</small><b>${esc(w.name)}</b></div>
      </div>
      <div class="cr-thanks">あそんでくれて ありがとう！</div>`;
  },

  parade() {
    const sky = byId('ending-parade');
    sky.innerHTML = '';
    const owned = [];
    WEAPON_TYPES.forEach(t => { const p = Player.progressOf('weapon', t.id); if (p) owned.push(Data.line('weapon', t.id)[p - 1]); });
    ACC_TYPES.forEach(t => { const p = Player.progressOf('acc', t.id); if (p) owned.push(Data.line('acc', t.id)[p - 1]); });
    owned.forEach((it, i) => this.later(() => {
      const el = document.createElement('div');
      el.className = 'parade-item';
      el.style.top = (12 + Math.random() * 60) + '%';
      el.style.animationDuration = (7 + Math.random() * 4) + 's';
      el.innerHTML = Img.html(it.image, it.icon);
      sky.appendChild(el);
      setTimeout(() => el.remove(), 12000);
    }, 1500 + i * 1800));
  },

  async showEnd() {
    if (this.ending) return;
    this.ending = true;
    this.clear();
    byId('ending-skip').hidden = true;
    // スタッフロールのあとの エピローグ
    if (STORY.epilogue) { await Story.play('epilogue'); }
    this.ending = false;
    byId('ending-screen').classList.add('phase-end');
    byId('ending-end').hidden = false;
    Audio2.se('levelup');
    const got = Achv.check(); if (got.length) Achv.popup(got);
  },
  close() {
    this.clear();
    byId('ending-screen').className = 'screen';
    Menu.show();
  }
};
