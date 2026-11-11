/* ==========================================================
   minigames.js  ―  鍛冶のミニゲーム（前作「おさかな一本勝負」の特別な戦いと同じしくみ）
   ----------------------------------------------------------
   ・鍛冶で「きたえる！」を押すと、ランダムで1つ遊ぶ
   ・けっか：fail（失敗＝ふつう）／ good（成功＝ATK×1.5）／ great（大成功＝ATK×2）
   ・むずかしさ P.d は 1.0（はじめのエリア）〜 1.6（魔王城）
   ・はじめて遊ぶゲームはルール説明つき。2回目からは みじかい説明だけ
   ・新しいゲームを足すときは MINIGAMES に1つ足すだけ（start が game を返す）
       game.update(dt) … 毎フレーム   game.act() … タップ（PCはスペース/Z）
       game.down(x,y) / move(x,y) / up() … 長おし・なぞり用
       a.end('fail' | 'good' | 'great') でおわり
   ========================================================== */

const GRADES = {
  fail:  { label: '失敗…',     sub: 'ふつうの できばえ',  mult: 1,   color: '#c9ced6' },
  good:  { label: '成功！',     sub: 'ATK ×1.5',          mult: 1.5, color: '#9fe0ff' },
  great: { label: '大成功！！', sub: 'ATK ×2',            mult: 2,   color: '#ffd84a' },
  skip:  { label: 'ふつう',     sub: 'ミニゲームなし',     mult: 1,   color: '#c9ced6' }
};

const rnd = (n) => Math.floor(Math.random() * n);
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const hearts = (n, max) => '❤'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n));

const MINIGAMES = {
  /* ---------------- 1. 打ちこみタイミング ---------------- */
  strike: {
    ico: '🔨', name: '打ちこみタイミング', short: '黄色い所で タップ！ PERFECT 4回で大成功',
    rule: '左右に動く<b>白い線</b>が、<b>オレンジの所</b>に来たらタップ！<br>まん中の<b>黄色</b>なら PERFECT。<br>5回うてたら 成功、そのうち <b>PERFECT 4回</b>で 大成功！<br>ミス2回で 失敗。',
    start(a, P) {
      const BW = a.W - 40, need = 5;
      a.el({ left: '50%', top: '18%', transform: 'translateX(-50%)', fontSize: '64px' }).textContent = '🗡️';
      const bar = a.el({ left: '20px', top: (a.H * 0.58 - 24) + 'px', width: BW + 'px', height: '48px', background: '#2a1a10', border: '3px solid #ffd84a', borderRadius: '10px', overflow: 'hidden' });
      const zone = a.el({ top: 0, bottom: 0, background: 'rgba(255,130,40,.65)' }, bar);
      const perf = a.el({ top: 0, bottom: 0, background: '#ffe95a' }, bar);
      const mk = a.el({ top: 0, bottom: 0, width: '6px', marginLeft: '-3px', background: '#fff', boxShadow: '0 0 10px #fff' }, bar);
      let x = 0, dir = 1, hits = 0, perfects = 0, lives = 2, zx, zw, px, pw;
      const speed = BW / 0.85 * P.d;
      const newZone = () => {
        zw = Math.max(30, BW * (0.22 - hits * 0.018) / Math.sqrt(P.d)); zx = Math.random() * (BW - zw);
        pw = Math.max(12, zw * 0.35); px = zx + (zw - pw) / 2;
        Object.assign(zone.style, { left: zx + 'px', width: zw + 'px' }); Object.assign(perf.style, { left: px + 'px', width: pw + 'px' });
      };
      newZone(); a.hud(hearts(lives, 2)); a.say(`あと ${need} 回 うとう！`);
      return {
        update(dt) { x += dir * speed * (1 + hits * 0.1) * dt; if (x >= BW) { x = BW; dir = -1; } if (x <= 0) { x = 0; dir = 1; } mk.style.left = x + 'px'; },
        act() {
          if (x >= px && x <= px + pw) { perfects++; hits++; a.flash('PERFECT!', '#ffe95a'); Audio2.se('craft'); }
          else if (x >= zx && x <= zx + zw) { hits++; a.flash('GOOD', '#9fe0ff'); Audio2.se('hit'); }
          else { lives--; a.hud(hearts(lives, 2)); a.flash('ミス…', '#ff7777'); Audio2.se('error'); if (lives <= 0) return a.end('fail'); return; }
          a.prog(hits / need); a.say(`あと ${need - hits} 回（PERFECT ${perfects}）`);
          if (hits >= need) return a.end(perfects >= 4 ? 'great' : 'good');
          newZone();
        }
      };
    }
  },

  /* ---------------- 2. 火加減キープ ---------------- */
  heat: {
    ico: '🔥', name: '火加減キープ', short: '長おしで ほのおを 上げて、緑の中を キープ！',
    rule: '画面を<b>長おし</b>すると ふいごで 火が強くなり、はなすと 弱くなるよ。<br>温度計の 赤い線を、うごく<b>緑のはんい</b>の中に たもとう！<br>10秒のうち <b>55%</b>入っていれば 成功、<b>80%</b>で 大成功！',
    start(a, P) {
      const TH = a.H - 50, X = a.W / 2 - 22;
      const tube = a.el({ left: X + 'px', top: '25px', width: '44px', height: TH + 'px', background: '#2a1a10', border: '3px solid #fff', borderRadius: '22px', overflow: 'hidden' });
      const band = a.el({ left: 0, right: 0, background: 'rgba(80,230,120,.55)', borderTop: '2px solid #7f7', borderBottom: '2px solid #7f7' }, tube);
      const fill = a.el({ left: 0, right: 0, bottom: 0, background: 'linear-gradient(0deg,#ff3b00,#ffb000)' }, tube);
      const fire = a.el({ left: (X + 70) + 'px', top: (TH / 2) + 'px', fontSize: '50px', transition: 'transform .1s' }); fire.textContent = '🔥';
      a.el({ left: (X - 70) + 'px', top: (TH / 2) + 'px', fontSize: '44px' }).textContent = '🌬️';
      let t = 0.2, v = 0, hold = false, time = 0, inT = 0, c = 0.5, cv = 0;
      const DUR = 10, bh = 0.2 / Math.sqrt(P.d);
      a.hud('⏱ 10.0');
      return {
        down() { hold = true; }, up() { hold = false; },
        update(dt) {
          time += dt;
          v += (hold ? 1.7 : -1.5) * dt * P.d; v = Math.max(-0.75, Math.min(0.75, v)); t += v * dt;
          if (t < 0) { t = 0; v = 0; } if (t > 1) { t = 1; v = 0; }
          cv += (Math.random() - 0.5) * 2.6 * dt * P.d; cv = Math.max(-0.28, Math.min(0.28, cv)) * 0.995; c += cv * dt;
          if (c < bh / 2 + 0.05) { c = bh / 2 + 0.05; cv = Math.abs(cv); } if (c > 0.95 - bh / 2) { c = 0.95 - bh / 2; cv = -Math.abs(cv); }
          const inside = Math.abs(t - c) <= bh / 2;
          if (inside) inT += dt;
          band.style.bottom = ((c - bh / 2) * 100) + '%'; band.style.height = (bh * 100) + '%';
          fill.style.height = (t * 100) + '%'; fill.style.filter = inside ? 'brightness(1.3)' : 'none';
          fire.style.transform = `scale(${0.6 + t})`;
          const r = inT / Math.max(time, 0.01);
          a.prog(time / DUR); a.hud('⏱ ' + Math.max(0, DUR - time).toFixed(1)); a.say(`キープ率 ${Math.round(inT / DUR * 100)}%`);
          if (time >= DUR) { const k = inT / DUR; a.end(k >= 0.8 ? 'great' : k >= 0.55 ? 'good' : 'fail'); }
        }
      };
    }
  },

  /* ---------------- 3. 焼き入れ ---------------- */
  quench: {
    ico: '💧', name: '焼き入れ', short: 'お手本と 同じ色の しゅんかんに タップ！',
    rule: '熱した 金属の 色が、<b>赤→オレンジ→黄→白</b>と どんどん変わるよ。<br>上の<b>お手本の色</b>と 同じになった しゅんかんに タップして 水に入れよう！<br>3回 成功で 成功、<b>ぴったり2回＆ミスなし</b>で 大成功。ミス2回で 失敗。',
    start(a, P) {
      const STOPS = [[60, 8, 0], [200, 20, 0], [255, 90, 0], [255, 170, 20], [255, 235, 120], [255, 255, 235]];
      const colAt = (p) => { const f = p * (STOPS.length - 1), i = Math.min(STOPS.length - 2, Math.floor(f)), k = f - i; const c = STOPS[i].map((v, j) => Math.round(v + (STOPS[i + 1][j] - v) * k)); return `rgb(${c})`; };
      a.el({ left: '50%', top: '6px', transform: 'translateX(-50%)', fontSize: '13px', fontWeight: 900, color: '#fff' }).textContent = 'お手本';
      const sw = a.el({ left: '50%', top: '26px', width: '90px', height: '36px', marginLeft: '-45px', border: '3px solid #fff', borderRadius: '8px' });
      const metal = a.el({ left: '50%', top: (a.H * 0.42) + 'px', width: '200px', height: '56px', marginLeft: '-100px', borderRadius: '10px 40px 40px 10px', border: '3px solid #222', boxShadow: '0 0 30px rgba(255,140,0,.6)' });
      const strip = a.el({ left: '20px', right: '20px', bottom: '24px', height: '14px', borderRadius: '7px', background: `linear-gradient(90deg,${[0, .2, .4, .6, .8, 1].map(colAt).join(',')})`, border: '2px solid #fff' });
      const arrow = a.el({ bottom: '40px', fontSize: '16px', marginLeft: '-8px' }, null); arrow.textContent = '▼';
      a.el({ left: '50%', top: (a.H * 0.42 + 64) + 'px', transform: 'translateX(-50%)', fontSize: '40px' }).textContent = '🪣';
      let ph = 0, target = 0, round = 0, ok = 0, perf = 0, miss = 0, cool = 0;
      const period = 1.5 / P.d;
      const next = () => { target = 0.15 + Math.random() * 0.8; sw.style.background = colAt(target); arrow.style.left = `calc(20px + (100% - 40px) * ${target})`; };
      next(); a.hud(hearts(2 - miss, 2)); a.say('お手本の色で タップ！ 3回');
      return {
        p: 0,
        update(dt) {
          if (cool > 0) { cool -= dt; return; }
          ph = (ph + dt / period) % 2; const p = ph < 1 ? ph : 2 - ph;
          this.p = p; metal.style.background = colAt(p); metal.style.boxShadow = `0 0 ${20 + p * 40}px ${colAt(p)}`;
        },
        act() {
          if (cool > 0) return;
          const err = Math.abs(this.p - target);
          if (err <= 0.035) { ok++; perf++; a.flash('ぴったり！', '#ffe95a'); Audio2.se('craft'); }
          else if (err <= 0.085) { ok++; a.flash('OK', '#9fe0ff'); Audio2.se('hit'); }
          else { miss++; a.hud(hearts(2 - miss, 2)); a.flash('ミス…', '#ff7777'); Audio2.se('error'); if (miss >= 2) return a.end('fail'); }
          metal.style.background = '#556'; cool = 0.6; round++;
          a.prog(ok / 3); a.say(`あと ${3 - ok} 回`);
          if (ok >= 3) return a.end(perf >= 2 && miss === 0 ? 'great' : 'good');
          next();
        }
      };
    }
  },

  /* ---------------- 4. ルーン記憶 ---------------- */
  rune: {
    ico: '🔮', name: 'ルーンの記憶', short: '光った じゅんばんを おぼえて タップ！',
    rule: '9つの<b>ルーン文字</b>が じゅんばんに 光るよ。<br>光った<b>じゅんばん どおり</b>に タップしよう！ だんだん長くなる（3ラウンド）。<br>ミス1回までなら 成功、<b>ミスなし</b>で 大成功。',
    start(a, P) {
      const GL = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ'];
      const S = Math.min(a.W, a.H - 20) / 3 - 10, ox = (a.W - (S + 10) * 3) / 2 + 5, oy = 10;
      const cells = GL.map((g, i) => {
        const c = a.el({ left: (ox + (i % 3) * (S + 10)) + 'px', top: (oy + Math.floor(i / 3) * (S + 10)) + 'px', width: S + 'px', height: S + 'px', borderRadius: '14px', background: '#2b2f6b', border: '3px solid #8ea0ff', color: '#cfd8ff', fontSize: (S * 0.5) + 'px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .1s, transform .1s' });
        c.textContent = g; c.dataset.i = i; return c;
      });
      const lens = [4, 5, 6].map(n => n + (P.d > 1.3 ? 1 : 0));
      let round = 0, seq = [], pos = 0, showing = true, miss = 0;
      const light = (i, on) => { cells[i].style.background = on ? '#ffd84a' : '#2b2f6b'; cells[i].style.color = on ? '#23163a' : '#cfd8ff'; cells[i].style.transform = on ? 'scale(1.08)' : ''; };
      const show = () => {
        showing = true; pos = 0; a.say('よく見て…'); let k = 0;
        const step = 0.48 / Math.pow(P.d, 0.4);
        const tick = () => {
          if (k > 0) light(seq[k - 1], false);
          if (k >= seq.length) { showing = false; a.say(`じゅんばんに タップ！（${seq.length}こ）`); return; }
          setTimeout(() => { light(seq[k], true); Audio2.se('tap'); k++; a.timer(tick, step * 1000); }, 110);
        };
        a.timer(tick, 600);
      };
      const newRound = () => { seq = []; for (let i = 0; i < lens[round]; i++) { let n; do { n = rnd(9); } while (n === seq[i - 1]); seq.push(n); } show(); };
      a.hud(hearts(2 - miss, 2)); newRound();
      return {
        down(x, y) {
          if (showing) return;
          const t = document.elementFromPoint(a.rect().left + x, a.rect().top + y);
          const c = t && t.closest && t.closest('[data-i]'); if (!c) return;
          const i = Number(c.dataset.i);
          light(i, true); setTimeout(() => light(i, false), 140);
          if (i === seq[pos]) { pos++; Audio2.se('hit'); if (pos >= seq.length) { round++; a.prog(round / 3); a.flash('クリア！', '#7fff7f'); if (round >= 3) return a.end(miss === 0 ? 'great' : 'good'); a.timer(newRound, 500); showing = true; } }
          else { miss++; a.hud(hearts(2 - miss, 2)); a.flash('ちがう！', '#ff7777'); Audio2.se('error'); if (miss >= 2) return a.end('fail'); showing = true; a.timer(show, 600); }
        }
      };
    }
  },

  /* ---------------- 5. リズム鍛造 ---------------- */
  rhythm: {
    ico: '🎵', name: 'リズム鍛造', short: '輪が 金床に かさなった しゅんかんに タップ！',
    rule: 'ちぢんでくる<b>光の輪</b>が、まん中の<b>金床</b>に ぴったり かさなった しゅんかんに タップ！<br>全部で8回。ミス3回で 失敗。<br><b>PERFECT 6回以上＆ミスなし</b>で 大成功！',
    start(a, P) {
      const cx = a.W / 2, cy = a.H / 2, R0 = 38, R1 = Math.min(a.W, a.H) / 2 - 8;
      a.el({ left: (cx - R0) + 'px', top: (cy - R0) + 'px', width: R0 * 2 + 'px', height: R0 * 2 + 'px', borderRadius: '50%', background: 'radial-gradient(circle,#777,#333)', border: '4px solid #ffd84a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px' }).textContent = '🔨';
      const N = 8, travel = 1.15 / Math.pow(P.d, 0.6);
      let t = 0, notes = [], tt = 1.0, perf = 0, good = 0, miss = 0, done = 0;
      for (let i = 0; i < N; i++) { notes.push({ at: tt, el: null, judged: false }); tt += (0.5 + Math.random() * 0.45) / Math.pow(P.d, 0.5); }
      const judge = (n, kind) => {
        n.judged = true; done++; if (n.el) n.el.remove();
        if (kind === 'p') { perf++; a.flash('PERFECT!', '#ffe95a'); Audio2.se('craft'); }
        else if (kind === 'g') { good++; a.flash('GOOD', '#9fe0ff'); Audio2.se('hit'); }
        else { miss++; a.hud(hearts(3 - miss, 3)); a.flash('ミス…', '#ff7777'); Audio2.se('error'); }
        a.prog(done / N); a.say(`PERFECT ${perf} ／ GOOD ${good}`);
        if (miss >= 3) return a.end('fail');
        if (done >= N) return a.end(perf >= 6 && miss === 0 ? 'great' : 'good');
      };
      a.hud(hearts(3, 3)); a.say('リズムよく タップ！');
      return {
        update(dt) {
          t += dt;
          notes.forEach(n => {
            if (n.judged) return;
            const k = (n.at - t) / travel;               // 1 → 0 で金床に
            if (k > 1) return;
            if (!n.el) n.el = a.el({ borderRadius: '50%', border: '5px solid #fff', boxShadow: '0 0 10px #9fe0ff', pointerEvents: 'none' });
            const r = R0 + (R1 - R0) * Math.max(k, -0.3);
            Object.assign(n.el.style, { left: (cx - r) + 'px', top: (cy - r) + 'px', width: r * 2 + 'px', height: r * 2 + 'px', opacity: k < 0 ? 0.4 : 1 });
            if (t - n.at > 0.14) judge(n, 'm');
          });
        },
        act() {
          const n = notes.find(x => !x.judged); if (!n) return;
          const d = Math.abs(t - n.at);
          if (d > 0.35) return;                          // まだ遠い：むし
          judge(n, d <= 0.06 ? 'p' : d <= 0.13 ? 'g' : 'm');
        }
      };
    }
  },

  /* ---------------- 6. 不純物はじき ---------------- */
  whack: {
    ico: '⛏️', name: '不純物はじき', short: '黒い石だけ タップ！ 宝石は さわらない',
    rule: '穴から 出てくる<b>黒い不純物 🪨</b>だけを タップして はじきとばそう！<br><b>宝石 💎</b>を さわると ミス。<br>14秒で 12こ はじけば 成功、<b>ミスなし＆3秒あまり</b>で 大成功。ミス3回で 失敗。',
    start(a, P) {
      const S = Math.min(a.W, a.H) / 3 - 12, ox = (a.W - (S + 12) * 3) / 2 + 6, oy = (a.H - (S + 12) * 3) / 2 + 6;
      const holes = Array.from({ length: 9 }, (_, i) => {
        const h = a.el({ left: (ox + (i % 3) * (S + 12)) + 'px', top: (oy + Math.floor(i / 3) * (S + 12)) + 'px', width: S + 'px', height: S + 'px', borderRadius: '50%', background: 'radial-gradient(circle at 50% 60%,#1a0f08,#5a3a20 70%)', border: '3px solid #8a6a40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (S * 0.6) + 'px' });
        h.dataset.i = i; return { el: h, kind: null, life: 0 };
      });
      const NEED = 12, LIM = 14;
      let time = 0, got = 0, miss = 0, spawn = 0;
      a.hud(hearts(3, 3));
      return {
        update(dt) {
          time += dt; spawn -= dt;
          holes.forEach(h => { if (h.kind) { h.life -= dt; if (h.life <= 0) { h.kind = null; h.el.textContent = ''; } } });
          if (spawn <= 0) {
            spawn = (0.42 + Math.random() * 0.25) / P.d;
            const free = holes.filter(h => !h.kind); if (free.length) {
              const h = free[rnd(free.length)]; h.kind = Math.random() < 0.68 ? 'slag' : 'gem'; h.life = 0.85 / P.d;
              h.el.textContent = h.kind === 'slag' ? '🪨' : '💎'; h.el.style.animation = 'none'; void h.el.offsetWidth; h.el.style.animation = 'mgPop .15s ease-out';
            }
          }
          a.prog(got / NEED); a.say(`はじいた ${got} / ${NEED}　⏱ ${Math.max(0, LIM - time).toFixed(1)}`);
          if (time >= LIM) a.end('fail');
        },
        down(x, y) {
          const t = document.elementFromPoint(a.rect().left + x, a.rect().top + y);
          const c = t && t.closest && t.closest('[data-i]'); if (!c) return;
          const h = holes[Number(c.dataset.i)]; if (!h.kind) return;
          if (h.kind === 'slag') { got++; a.flash('バシッ！', '#ffe95a'); Audio2.se('hit'); }
          else { miss++; a.hud(hearts(3 - miss, 3)); a.flash('宝石が…！', '#ff7777'); Audio2.se('error'); }
          h.kind = null; h.el.textContent = '💥'; setTimeout(() => { if (!h.kind) h.el.textContent = ''; }, 120);
          if (miss >= 3) return a.end('fail');
          if (got >= NEED) return a.end(miss === 0 && LIM - time >= 3 ? 'great' : 'good');
        }
      };
    }
  },

  /* ---------------- 7. ぴったり配合 ---------------- */
  gauge: {
    ico: '⚗️', name: 'ぴったり配合', short: '長おしで そそいで、線ぴったりで はなす！',
    rule: '画面を<b>長おし</b>すると、とかした 金属が ビーカーに たまっていく（だんだん はやくなる！）。<br><b>赤い線</b>ぴったりで 指を はなそう。1回おしたら やりなおし できないよ。<br>3はい中、ミス1回までで 成功、<b>ぴったり2回＆ミスなし</b>で 大成功。',
    start(a, P) {
      const BH = a.H - 60, BW = 110, X = a.W / 2 - BW / 2;
      const beaker = a.el({ left: X + 'px', top: '40px', width: BW + 'px', height: BH + 'px', border: '4px solid #cfe6ff', borderTop: 'none', borderRadius: '0 0 18px 18px', background: 'rgba(255,255,255,.08)', overflow: 'hidden' });
      const liq = a.el({ left: 0, right: 0, bottom: 0, height: 0, background: 'linear-gradient(0deg,#ff7a00,#ffd84a)' }, beaker);
      const line = a.el({ left: '-10px', right: '-10px', height: '3px', background: '#ff3b3b', boxShadow: '0 0 6px #f33' }, beaker);
      a.el({ left: (X + BW / 2 - 20) + 'px', top: 0, fontSize: '34px' }).textContent = '🫗';
      let f = 0, v = 0, hold = false, used = false, target = 0, round = 0, perf = 0, miss = 0, wait = 0;
      const next = () => { f = 0; v = 0; used = false; hold = false; target = 0.45 + Math.random() * 0.42; line.style.bottom = (target * 100) + '%'; liq.style.height = '0'; };
      const judge = () => {
        const e = Math.abs(f - target);
        if (e <= 0.02) { perf++; a.flash('ぴったり！', '#ffe95a'); Audio2.se('craft'); }
        else if (e <= 0.055) { a.flash('OK', '#9fe0ff'); Audio2.se('hit'); }
        else { miss++; a.hud(hearts(2 - miss, 2)); a.flash(f > target ? 'いれすぎ！' : 'たりない！', '#ff7777'); Audio2.se('error'); }
        round++; a.prog(round / 3);
        if (miss >= 2) return a.end('fail');
        if (round >= 3) return a.end(perf >= 2 && miss === 0 ? 'great' : 'good');
        wait = 0.7;
      };
      next(); a.hud(hearts(2, 2)); a.say('長おしで そそぐ → 線で はなす');
      return {
        down() { if (!used && wait <= 0) { hold = true; used = true; } },
        up() { if (hold) { hold = false; judge(); } },
        update(dt) {
          if (wait > 0) { wait -= dt; if (wait <= 0) next(); return; }
          if (hold) { v += 0.55 * P.d * dt; f += (0.12 + v) * dt; if (f >= 1) { f = 1; hold = false; judge(); } liq.style.height = (f * 100) + '%'; }
        }
      };
    }
  },

  /* ---------------- 8. 刻印あわせ ---------------- */
  pairs: {
    ico: '🃏', name: '刻印あわせ', short: '同じ 刻印の カードを 2まいずつ そろえよう',
    rule: 'さいしょに 1.5秒だけ カードの<b>刻印</b>が 見えるよ。おぼえてね！<br>同じ刻印の <b>2まい</b>を めくって、6組 そろえよう。<br>まちがい5回まで・時間内で 成功、<b>まちがい2回以下</b>で 大成功。',
    start(a, P) {
      const SY = ['🗡️', '🛡️', '💎', '🔥', '⚡', '🌙'];
      const deck = shuffle([...SY, ...SY]);
      const C = 4, R = 3, G = 8, CW = (a.W - G * (C + 1)) / C, CH = Math.min((a.H - 30 - G * (R + 1)) / R, CW * 1.3);
      const oy = 4;
      const cards = deck.map((s, i) => {
        const el = a.el({ left: (G + (i % C) * (CW + G)) + 'px', top: (oy + G + Math.floor(i / C) * (CH + G)) + 'px', width: CW + 'px', height: CH + 'px', borderRadius: '10px', border: '3px solid #ffd84a', background: '#fff6dc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: (CW * 0.5) + 'px', transition: 'transform .15s' });
        el.dataset.i = i; el.textContent = s; return { s, el, open: true, done: false };
      });
      const hide = (c) => { c.open = false; c.el.textContent = '？'; c.el.style.background = 'linear-gradient(#5a3a1a,#3a2410)'; c.el.style.color = '#ffd84a'; };
      const show = (c) => { c.open = true; c.el.textContent = c.s; c.el.style.background = '#fff6dc'; };
      const LIM = 32 / Math.pow(P.d, 0.4);
      let time = -1.5, first = null, lock = true, miss = 0, pairs = 0;
      a.timer(() => { cards.forEach(hide); lock = false; }, 1500);
      a.hud('まちがい 0/5');
      return {
        update(dt) {
          time += dt; if (time < 0) { a.say('おぼえて！'); return; }
          a.say(`⏱ ${Math.max(0, LIM - time).toFixed(1)}　そろった ${pairs} / 6`);
          if (time >= LIM) a.end('fail');
        },
        down(x, y) {
          if (lock) return;
          const t = document.elementFromPoint(a.rect().left + x, a.rect().top + y);
          const e = t && t.closest && t.closest('[data-i]'); if (!e) return;
          const c = cards[Number(e.dataset.i)]; if (c.open || c.done) return;
          show(c); Audio2.se('tap');
          if (!first) { first = c; return; }
          if (first.s === c.s) { first.done = c.done = true; [first, c].forEach(k => { k.el.style.background = '#c8f7c0'; }); pairs++; a.prog(pairs / 6); a.flash('そろった！', '#7fff7f'); Audio2.se('hit'); first = null; if (pairs >= 6) a.end(miss <= 2 ? 'great' : 'good'); return; }
          miss++; a.hud(`まちがい ${miss}/5`); Audio2.se('error'); lock = true;
          const f = first; first = null;
          a.timer(() => { hide(f); hide(c); lock = false; }, 550);
          if (miss > 5) a.end('fail');
        }
      };
    }
  }
};

/* ==========================================================
   ミニゲームの進行（カード → プレイ → けっか）
   ========================================================== */
const MG = {
  game: null, raf: 0, last: 0, resolve: null, kind: null, P: null, timers: [], lastKind: null,

  init() {
    const st = byId('mg-stage');
    const pos = (e) => { const r = st.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    st.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (!this.game) return;
      try { st.setPointerCapture(e.pointerId); } catch (_) { }
      const [x, y] = pos(e);
      if (this.game.down) this.game.down(x, y); else if (this.game.act) this.game.act();
    });
    st.addEventListener('pointermove', (e) => { if (this.game && this.game.move) { const [x, y] = pos(e); this.game.move(x, y); } });
    const up = () => { if (this.game && this.game.up) this.game.up(); };
    st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
    document.addEventListener('keydown', (e) => {
      if (!UI.isOpen('mg-layer') || e.repeat) return;
      if (e.code === 'Space' || e.code === 'KeyZ' || e.code === 'Enter') {
        e.preventDefault();
        if (!this.game) { if (byId('mg-card').classList.contains('on')) this.begin(); return; }
        if (this.game.down) this.game.down(-1, -1); else if (this.game.act) this.game.act();
      }
    });
    document.addEventListener('keyup', (e) => { if (UI.isOpen('mg-layer') && (e.code === 'Space' || e.code === 'KeyZ') && this.game && this.game.up) this.game.up(); });
    byId('mg-start').onclick = () => this.begin();
    byId('mg-skip').onclick = () => { Audio2.se('close'); this.finish(this.reforge ? 'cancel' : 'skip'); };
  },

  /* item をきたえるときに よぶ → Promise<'fail'|'good'|'great'|'skip'> */
  /* opt.reforge … 打ち込みやり直し（「やめる」で 素材を へらさずに もどる → 'cancel'） */
  play(item, forceKind, opt) {
    opt = opt || {};
    this.reforge = !!opt.reforge;
    byId('mg-skip').textContent = this.reforge ? 'やめる（そざいは へらないよ）' : 'ミニゲームなしで きたえる（ふつう）';
    const keys = Object.keys(MINIGAMES);
    let kind = MINIGAMES[forceKind] ? forceKind : null;
    while (!kind || (keys.length > 1 && kind === this.lastKind && !forceKind)) kind = keys[rnd(keys.length)];
    this.lastKind = kind; this.kind = kind;
    this.P = { d: 1 + (item.area - 1) / 54 * 0.6, item };
    const info = MINIGAMES[kind];
    byId('mg-title').textContent = `${info.ico} ${info.name}`;
    byId('mg-item').textContent = this.reforge
      ? `🔁 打ち込みやり直し：「${item.name}」（いまは ${QUALITY[Player.quality(item.id)].name}）`
      : `${item.typeName} No.${item.stage}「${item.name}」を きたえる！`;
    byId('mg-stage').innerHTML = ''; this.say(''); this.prog(0); this.hud('');
    const first = !S.mgSeen[kind];
    byId('mg-card-ico').textContent = info.ico;
    byId('mg-card-name').textContent = info.name;
    byId('mg-card-rule').innerHTML = first ? info.rule : `<b>${info.short}</b>`;
    byId('mg-card').classList.add('on');
    UI.open('mg-layer');
    return new Promise(res => { this.resolve = res; });
  },
  begin() {
    if (this.game) return;
    S.mgSeen[this.kind] = true; Save.write();
    byId('mg-card').classList.remove('on');
    Audio2.se('open');
    this.timers = [];
    this.game = MINIGAMES[this.kind].start(this.api, this.P);
    this.last = 0; cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame((t) => this.tick(t));
  },
  tick(t) {
    if (!this.game) return;
    const dt = this.last ? Math.min((t - this.last) / 1000, 0.05) : 0.016;
    this.last = t;
    if (this.game.update) this.game.update(dt);
    if (this.game) this.raf = requestAnimationFrame((tt) => this.tick(tt));
  },
  end(grade) {
    if (!this.game) return;
    this.game = null; cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout); this.timers = [];
    const g = GRADES[grade];
    const big = byId('mg-result');
    big.innerHTML = `<b style="color:${g.color}">${g.label}</b><small>${g.sub}</small>`;
    big.className = 'mg-result on ' + grade;
    Audio2.se(grade === 'fail' ? 'timeover' : 'levelup');
    setTimeout(() => this.finish(grade), 1300);
  },
  finish(grade) {
    this.game = null; cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout); this.timers = [];
    byId('mg-result').className = 'mg-result';
    byId('mg-card').classList.remove('on');
    UI.close('mg-layer', true);
    const r = this.resolve; this.resolve = null;
    if (r) r(grade);
  },

  say(t) { byId('mg-say').innerHTML = t; },
  prog(p) { byId('mg-prog').style.width = Math.max(0, Math.min(100, p * 100)) + '%'; },
  hud(t) { byId('mg-hud').textContent = t; },

  /* ゲームから使う道具 */
  get api() {
    const self = this, st = byId('mg-stage');
    return {
      stage: st,
      get W() { return st.clientWidth || 320; },
      get H() { return st.clientHeight || 300; },
      rect() { return st.getBoundingClientRect(); },
      el(css, parent) { const e = document.createElement('div'); e.style.position = 'absolute'; Object.assign(e.style, css || {}); (parent || st).appendChild(e); return e; },
      say: (t) => self.say(t), prog: (p) => self.prog(p), hud: (t) => self.hud(t),
      flash(t, c) { const f = byId('mg-flash'); f.textContent = t; f.style.color = c || '#fff'; f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); },
      timer(fn, ms) { self.timers.push(setTimeout(() => { if (self.game) fn(); }, ms)); },
      end: (g) => self.end(g)
    };
  }
};
