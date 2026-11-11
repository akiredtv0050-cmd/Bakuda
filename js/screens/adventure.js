/* ==========================================================
   adventure.js  ―  ぼうけん（連打バトル）画面
   ========================================================== */

/* 武器の種類 → ふりかた（swing ふりおろし / smash たたきつけ / stab つき / claw ひっかき / magic まほう / whip しなる）
   新しい武器の種類を足したら ここに1行（書かなければ swing） */
const SWING_STYLE = { stick: 'swing', tue: 'magic', wip: 'whip', daga: 'stab', ken: 'swing', tume: 'claw', ono: 'smash', mace: 'smash', kama: 'swing', taiken: 'smash' };

const Adventure = {
  target: null,
  hp: 0,
  timeLeft: 0,
  timerId: null,
  started: false,

  init() {
    byId('adv-home').onclick = () => { this.stopTimer(); Audio2.se('close'); Menu.show(); };
    byId('adv-map').onclick = () => Menu.openMap();
    byId('adv-zukan').onclick = () => Zukan.open('adventure');
    byId('adv-items').onclick = () => Menu.openItems();
    byId('adv-sound-btn').onclick = () => Settings.muteBgm();
    byId('btn-skip').onclick = (e) => { e.stopPropagation(); Audio2.se('change'); this.next(); };
    $$('.tool-mode-btn').forEach(b => b.onclick = () => {
      if (S.advMode === b.dataset.mode) return;
      S.advMode = b.dataset.mode; Save.write();
      Audio2.se('change');
      this.next();
    });
    const hit = (e) => { e.preventDefault(); this.attack(e); };
    byId('tap-area').addEventListener('pointerdown', hit);
    byId('target-stage').addEventListener('pointerdown', hit);
  },

  open() {
    UI.show('adventure');
    this.loadArea();
  },
  area() { return Data.area(S.areaNo) || DB.areas[0]; },

  loadArea() {
    const a = this.area();
    byId('adventure-screen').style.backgroundImage = `url('${a.bg}'), url('${AREA_THEMES.grass.bg}')`;
    byId('adv-area-name').textContent = `${AREA_THEMES[a.theme].icon} ${a.name}`;
    Audio2.playBgm(a.bgm);
    this.next();
    // はじめての地方なら ストーリー
    Story.playOnce('region_' + a.region);
  },

  /* つぎのターゲットをランダムで出す */
  next() {
    this.stopTimer();
    $$('.tool-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === S.advMode));
    const list = this.area().targets.filter(t => t.kind === S.advMode);
    byId('adv-empty').hidden = list.length > 0;
    byId('battle-card').style.visibility = list.length ? '' : 'hidden';
    if (!list.length) { this.target = null; this.updateHeader(); return; }
    let t = list[Math.floor(Math.random() * list.length)];
    if (list.length > 1 && this.target && t.id === this.target.id) t = list[(list.indexOf(t) + 1) % list.length];
    this.target = t;
    this.hp = t.hp;
    this.timeLeft = t.time;
    byId('target-name').textContent = t.name;
    byId('target-visual').innerHTML = Img.html(t.image, t.sprite);
    const w = Player.weapon();
    byId('tap-weapon').innerHTML = Img.html(w.image, w.icon);
    this.updateHp(); this.updateTimer(); this.updateHeader();
    byId('battle-card').classList.toggle('final-boss', t.id === GAME.FINAL_BOSS);
    // まおうが はじめて出たら ストーリー
    if (t.id === GAME.FINAL_BOSS) Story.playOnce('boss');
  },

  attack(e) {
    if (!this.target || this.hp <= 0) return;
    Audio2.unlock();
    if (!this.started && this.target.time > 0) this.startTimer();
    const atk = Player.totalAtk();
    const crit = Math.random() < 0.08;
    const dmg = crit ? atk * 2 : atk;
    S.stats.taps++; if (crit) S.stats.crits++;
    this.hp = Math.max(0, this.hp - dmg);

    // 見た目
    const vis = byId('target-visual');
    vis.classList.add('hit'); setTimeout(() => vis.classList.remove('hit'), 60);
    const tw = byId('tap-weapon');
    tw.classList.remove('swing'); void tw.offsetWidth; tw.classList.add('swing');
    this.swingFx(crit);
    const stage = byId('target-stage');
    UI.popText(stage, (crit ? 'かいしん！' : '') + dmg, stage.clientWidth / 2 + (Math.random() * 80 - 40), 60, crit ? 'crit' : '');
    Audio2.vibe(10);

    const up = Player.addExp(1);
    if (up) { Audio2.se('levelup'); this.notify(`タップLv.<b>${S.tapLevel}</b> に あがった！`, '⚡', 'gold'); this.checkNewArea(); Achv.announce(Achv.check()); }
    else Audio2.se('hit');

    this.updateHp(); this.updateHeader();
    if (this.hp <= 0) this.defeat();
  },

  /* そうび中の武器を、てきの上で ふる（武器の種類で ふりかたが かわる） */
  swingFx(crit) {
    const stage = byId('target-stage');
    const live = stage.querySelectorAll('.swing-fx');
    if (live.length >= 3) live[0].remove();               // れんだしすぎても 重くならないように
    const w = Player.weapon();
    const style = SWING_STYLE[w.type] || 'swing';
    const fx = document.createElement('div');
    fx.className = `swing-fx st-${style}${crit ? ' crit' : ''}`;
    // 少しだけ 位置と向きを ばらつかせる
    const flip = Math.random() < 0.5 && (style === 'swing' || style === 'whip') ? -1 : 1;
    fx.style.transform = `translate(${(Math.random() * 30 - 15)}px, ${(Math.random() * 20 - 10)}px) scaleX(${flip})${crit ? ' scale(1.35)' : ''}`;
    fx.innerHTML = `<div class="sw-slash"></div><div class="sw-arm"><div class="sw-wpn">${Img.html(w.image, w.icon)}</div></div>`;
    stage.appendChild(fx);
    setTimeout(() => fx.remove(), 420);
  },

  defeat() {
    const t = this.target;
    this.stopTimer();
    Audio2.se('defeat');
    S.kills[t.kind]++;
    Player.markSeen(t.id);
    let msg = `${esc(t.name)} を ${t.kind === 'monster' ? 'たおした' : 'こわした'}！`;
    if (t.drop) {
      const n = BALANCE.dropMin + Math.floor(Math.random() * (BALANCE.dropMax - BALANCE.dropMin + 1));
      Player.addMat(t.drop, n);
      const m = Data.mat(t.drop);
      msg += `　${Img.html(m.image, m.icon, 'log-img')}${esc(m.name)}×${n}`;
    }
    this.notify(msg, t.kind === 'monster' ? '⚔️' : '⛏️');
    const up = Player.addExp(BALANCE.defeatExp(t.area));
    if (up) { Audio2.se('levelup'); this.notify(`タップLv.<b>${S.tapLevel}</b> に あがった！`, '⚡', 'gold'); this.checkNewArea(); }
    Save.write();
    // まおうゼノグリムを はじめて たおした → エンディング
    if (t.id === GAME.FINAL_BOSS && !S.cleared) {
      Achv.check();
      setTimeout(() => Ending.play(false), 400);
      return;
    }
    Achv.announce(Achv.check());
    // 地方の さいごの「ぬし」を はじめて たおした → 章のおわりの おはなし
    const ck = Story.clearKeyFor(t);
    if (ck && !Story.seen(ck)) { setTimeout(() => Story.play(ck).then(() => this.next()), 500); return; }
    setTimeout(() => this.next(), 250);
  },

  checkNewArea() {
    const a = DB.areas.find(x => x.reqLevel === S.tapLevel);
    if (a) setTimeout(() => this.notify(`「<b>${esc(a.name)}</b>」に 行けるようになった！`, '🗺️', 'gold'), 600);
  },

  /* ---------- 通知（バトル枠の下にふわっと出る。画面上は邪魔なのでここに） ---------- */
  notify(html, icon, cls) {
    const log = byId('adv-log');
    const el = document.createElement('div');
    el.className = 'log-item ' + (cls || '');
    el.innerHTML = `<span class="log-ico">${icon || '✨'}</span><span>${html}</span>`;
    log.appendChild(el);
    while (log.children.length > 3) log.firstChild.remove();   // 3つまで
    setTimeout(() => el.classList.add('out'), 1500);
    setTimeout(() => el.remove(), 1900);
  },

  /* ---------- 制限時間 ---------- */
  startTimer() {
    this.stopTimer();
    this.started = true;
    this.timerId = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - 0.1);
      this.updateTimer();
      if (this.timeLeft <= 0) {               // 時間切れ：HPが全快
        this.stopTimer();
        Audio2.se('timeover');
        this.notify('じかんぎれ！ HPが もとに もどった…', '⏰', 'red');
        this.hp = this.target.hp;
        this.timeLeft = this.target.time;
        this.updateHp(); this.updateTimer();
      }
    }, 100);
  },
  stopTimer() { clearInterval(this.timerId); this.timerId = null; this.started = false; },

  /* ---------- 表示更新 ---------- */
  updateHp() {
    if (!this.target) return;
    byId('hp-bar').style.width = `${this.hp / this.target.hp * 100}%`;
    byId('hp-cur').textContent = fmt(this.hp);
    byId('hp-max').textContent = fmt(this.target.hp);
  },
  updateTimer() {
    const t = this.target;
    const show = t && t.time > 0;
    byId('timer-wrap').style.visibility = show ? '' : 'hidden';
    if (!show) return;
    byId('timer-bar').style.width = `${this.timeLeft / t.time * 100}%`;
    byId('timer-text').innerHTML = `のこり <b>${this.timeLeft.toFixed(1)}</b> 秒`;
  },
  updateHeader() {
    byId('adv-level').textContent = S.tapLevel;
    byId('adv-exp-bar').style.width = `${Math.min(100, S.tapExp / Player.nextExp() * 100)}%`;
    byId('adv-atk').textContent = fmt(Player.totalAtk());
  }
};
