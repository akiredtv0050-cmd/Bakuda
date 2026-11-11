/* ==========================================================
   save.js  ―  セーブデータ（ブラウザの localStorage に保存）
   ----------------------------------------------------------
   ・新しい項目を増やしたら defaultState() に初期値を足すだけでOK
     （古いセーブデータには自動で初期値が補われます）
   ・アイテムは「ID」で保存するので、データの順番を入れ替えても壊れません
   ========================================================== */

function defaultState() {
  const forge = {}, accForge = {}, cam = {};
  WEAPON_TYPES.forEach(t => { forge[t.id] = 0; });
  ACC_TYPES.forEach(t => { accForge[t.id] = 0; });
  forge.stick = 1;                             // 最初から「ひのきのぼう」を持っている
  return {
    ver: GAME.version,
    tapLevel: 1, tapExp: 0,
    playSec: 0,
    kills: { monster: 0, object: 0 },
    materials: {},                             // { mat_001: 3, ... }
    forge,                                     // 武器：種類ごとに「何段階まで作ったか」
    accForge,                                  // アクセ：同上
    equip: { weapon: 'stick_001', acc: Array(GAME.ACC_SLOTS).fill(null) },
    areaNo: 1,
    advMode: 'monster',                        // monster / object
    seen: {},                                  // 図鑑：{ id: { n: 回数, isNew: true } }
    zukan: { tab: 'monster', filter: {}, sort: 'no', scroll: 0 },
    items: { filter: 'all', sort: 'no' },        // もちもの の絞り込み・並べ替え
    usedCodes: [],                               // 使った隠しコマンド
    stats: { taps: 0, crits: 0, crafts: 0, goods: 0, greats: 0, mgPlays: 0 },  // 実績用の記録
    quality: {},                                 // 鍛冶ミニゲームのできばえ { アイテムid: 'good' | 'great' }
    mgSeen: {},                                  // ルール説明を見たミニゲーム
    achv: {},                                    // 達成した実績 { id: { at, isNew } }
    story: { seen: {} },                         // 見たストーリー
    cleared: false, clearSec: 0,                 // まおうを たおしたか
    forgeView: { kind: 'weapon', type: 'stick', cams: cam },
    settings: { bgmVol: 3, seVol: 3, vibe: true }   // 音量は 0（消音）〜5
  };
}

let S = defaultState();   // ← ゲーム中はどこからでも S.tapLevel のように使う

/* 足りない項目を初期値で埋める（新しい項目を増やしたとき用） */
function fillDefaults(target, def) {
  Object.keys(def).forEach(k => {
    if (target[k] === undefined || target[k] === null && def[k] !== null) target[k] = def[k];
    else if (def[k] && typeof def[k] === 'object' && !Array.isArray(def[k]) && typeof target[k] === 'object') fillDefaults(target[k], def[k]);
  });
  return target;
}

const Save = {
  write() {
    try { localStorage.setItem(GAME.saveKey, JSON.stringify(S)); } catch (e) { /* 容量オーバーやプライベートモード */ }
  },
  load() {
    let raw = null;
    try { raw = localStorage.getItem(GAME.saveKey); } catch (e) { }
    if (raw) {
      try { S = fillDefaults(JSON.parse(raw), defaultState()); } catch (e) { console.error(e); S = defaultState(); }
    } else {
      S = defaultState();
      Save.migrateOld();
    }
    // 装備が存在しないIDになっていたら外す
    if (!Data.item(S.equip.weapon) || !Player.owns(S.equip.weapon)) S.equip.weapon = 'stick_001';
    S.equip.acc = S.equip.acc.map(id => (id && Data.item(id) && Player.owns(id)) ? id : null);
    if (!Data.area(S.areaNo)) S.areaNo = 1;
    delete S.gold;                              // v2.2.0 でお金を廃止
    // 前のバージョン（ON/OFFだけ）の音設定を音量に変換
    if (S.settings.bgm === false) S.settings.bgmVol = 0;
    if (S.settings.se === false) S.settings.seVol = 0;
    delete S.settings.bgm; delete S.settings.se;
    // アクセが55段階になったので、はみ出た進み具合を直す
    Object.keys(S.accForge).forEach(k => { S.accForge[k] = Math.min(S.accForge[k], GAME.ACC_STAGE_COUNT); });
  },
  reset() {
    try { localStorage.removeItem(GAME.saveKey); localStorage.removeItem(GAME.oldSaveKey); } catch (e) { }
    S = defaultState();
  },
  /* 旧版（Gemini版 v1.x）のセーブを引き継ぐ（レベル・素材・撃破数） */
  migrateOld() {
    let old = null;
    try { old = JSON.parse(localStorage.getItem(GAME.oldSaveKey) || 'null'); } catch (e) { }
    if (!old || !old.state) return;
    const o = old.state;
    S.tapLevel = o.tapLevel || 1;
    S.playSec = o.elapsedSeconds || 0;
    S.kills.monster = o.monsterKills || 0;
    S.kills.object = o.objectKills || 0;
    Object.entries(o.materials || {}).forEach(([name, n]) => {
      const m = DB.matByName[name];
      if (m && n > 0) S.materials[m.id] = n;
    });
    console.log('旧セーブデータを引き継ぎました');
  }
};
