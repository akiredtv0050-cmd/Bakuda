/* ==========================================================
   audio.js  ―  BGM と 効果音
   ----------------------------------------------------------
   ・効果音は assets/se/ に同じ名前の mp3 を置くと、そちらが鳴ります
     （例：assets/se/hit.mp3）。ファイルが無いときは電子音で代用します。
   ・効果音の名前一覧は SE_LIST を見てください
   ========================================================== */

const BGM = {
  title: 'assets/bgm/title_bgm.mp3',
  menu: 'assets/bgm/title_bgm.mp3',
  forge: 'assets/bgm/craft_bgm.mp3',
  zukan: 'assets/bgm/title_bgm.mp3',
  ending: 'assets/bgm/ending.mp3',          // 無ければタイトルの曲
  fallbackField: 'assets/bgm/field_plain.mp3'
};
const BGM_VOLUME = 0.4;   // 音量5のときのBGMの大きさ（0〜1）
const SE_VOLUME = 0.8;    // 音量5のときの効果音の大きさ
const VOL_STEPS = 5;      // 音量の段階（0＝消音 〜 5）
const volOf = (key) => Math.max(0, Math.min(VOL_STEPS, S.settings[key] ?? 3)) / VOL_STEPS;

/* 効果音の名前 → 代用の電子音 [波形, 開始Hz, 終了Hz, 長さ秒, 音量] */
const SE_LIST = {
  tap:     ['sine', 800, 400, 0.05, 0.12],
  open:    ['sine', 440, 880, 0.08, 0.12],
  close:   ['sine', 600, 300, 0.06, 0.12],
  change:  ['triangle', 500, 700, 0.08, 0.10],
  hit:     ['square', 150, 40, 0.08, 0.14],
  defeat:  ['triangle', 300, 100, 0.20, 0.20],
  craft:   ['arp', 523, 1046, 0.35, 0.20],
  levelup: ['arp', 440, 880, 0.40, 0.20],
  timeover:['sawtooth', 150, 90, 0.25, 0.18],
  error:   ['square', 220, 160, 0.15, 0.12],
  get:     ['arp', 660, 990, 0.18, 0.15],
  anvil:   ['square', 1400, 700, 0.12, 0.16]    // 鍛冶のハンマー「カン！」
};

const Audio2 = {
  ctx: null,
  player: null,
  current: '',
  fileOK: {},    // SEファイルがあるか（一度調べたら覚える）

  init() {
    this.player = document.getElementById('bgm-player');
    if (this.player) {
      this.player.volume = BGM_VOLUME * volOf('bgmVol');
      this.player.addEventListener('error', () => {
        // エリア専用BGMが無いときは草原の曲にする
        if (this.current && this.current !== BGM.fallbackField && this.current.includes('/field_')) this.playBgm(BGM.fallbackField, true);
        else if (this.current === BGM.ending) this.playBgm(BGM.title, true);
      });
    }
  },
  unlock() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!this.ctx && AC) this.ctx = new AC();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  playBgm(path, force) {
    if (!this.player) return;
    if (!path) path = BGM.menu;
    if (this.current !== path || force) {
      this.current = path;
      this.player.src = path;
    }
    if (volOf('bgmVol') <= 0) { this.player.pause(); return; }
    this.player.volume = BGM_VOLUME * volOf('bgmVol');
    this.player.play().catch(() => { });
  },
  stopBgm() { if (this.player) this.player.pause(); },
  /* 音量を変えたとき */
  applyVolume() {
    if (!this.player) return;
    const v = volOf('bgmVol');
    this.player.volume = BGM_VOLUME * v;
    if (v <= 0) this.player.pause();
    else if (this.current && this.player.paused && UI.current !== 'title') this.player.play().catch(() => { });
  },

  se(name) {
    const v = volOf('seVol');
    if (v <= 0) return;
    const ok = this.fileOK[name];
    if (ok) { const a = new Audio(`assets/se/${name}.mp3`); a.volume = SE_VOLUME * v; a.play().catch(() => { }); return; }
    if (ok === undefined) {           // はじめての音：ファイルがあるか調べる
      this.fileOK[name] = false;
      const probe = new Audio();
      probe.addEventListener('canplaythrough', () => { this.fileOK[name] = true; }, { once: true });
      probe.src = `assets/se/${name}.mp3`;
    }
    this.synth(name);
  },
  synth(name) {
    const d = SE_LIST[name]; if (!d) return;
    this.unlock(); if (!this.ctx) return;
    const [type, f1, f2, len, vol] = d;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.connect(g); g.connect(this.ctx.destination);
    if (type === 'arp') {
      osc.type = 'sine';
      const steps = 4;
      for (let i = 0; i < steps; i++) osc.frequency.setValueAtTime(f1 * Math.pow(f2 / f1, i / (steps - 1)), now + (len / steps) * i);
    } else {
      osc.type = type;
      osc.frequency.setValueAtTime(f1, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + len);
    }
    g.gain.setValueAtTime(vol * volOf('seVol') * 1.25, now);
    g.gain.linearRampToValueAtTime(0.001, now + len);
    osc.start(now); osc.stop(now + len + 0.02);
  },
  vibe(ms) {
    if (S.settings.vibe && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } }
  }
};
