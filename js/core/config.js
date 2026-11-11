/* ==========================================================
   config.js  ―  ゲーム全体の「設定」と「種類の一覧」
   ----------------------------------------------------------
   ・バージョン番号を上げるときは GAME.version と sw.js の CACHE_NAME を両方変える
   ・武器やアクセの「種類」を増やすときは WEAPON_TYPES / ACC_TYPES に1行足して、
     data/weapons/◯◯.js（または data/accessories/◯◯.js）を作り、index.html に1行足す
   ========================================================== */

const GAME = {
  title: '爆打錬成！武器鍛冶クラフター',
  version: 'v1.0.0',
  saveKey: 'bakuda_craft_v2',   // セーブデータの名前（変えると全員のデータがリセット扱いになるので注意）
  oldSaveKey: 'bakuda_craft_save',

  ALLOW_PLACEHOLDER_CRAFT: false, // true：まだ名前が決まっていない段階も作れる（テスト用）

  AREA_COUNT: 55,               // エリアの数
  STAGES_PER_AREA: 3,           // 武器：1エリアあたりの段階数（55×3＝165段階）
  ACC_STAGES_PER_AREA: 1,       // アクセ：1エリアあたりの段階数（55×1＝55段階）
  ACC_SLOTS: 3,                 // アクセサリーの装備枠
  FINAL_BOSS: 'mon_275'         // たおすとエンディングになるモンスター（monsters.js の No.275 まおうゼノグリム）
};
GAME.STAGE_COUNT = GAME.AREA_COUNT * GAME.STAGES_PER_AREA;          // 武器 165
GAME.ACC_STAGE_COUNT = GAME.AREA_COUNT * GAME.ACC_STAGES_PER_AREA;   // アクセ 55
/* 種類(kind)ごとの段階数 */
GAME.perArea = (kind) => kind === 'acc' ? GAME.ACC_STAGES_PER_AREA : GAME.STAGES_PER_AREA;
GAME.stageCount = (kind) => kind === 'acc' ? GAME.ACC_STAGE_COUNT : GAME.STAGE_COUNT;

/* ----------------------------------------------------------
   武器の種類（id は画像フォルダ名・ファイル名にも使われます）
   画像：assets/images/weapon/{id}/{id}_001.png 〜 {id}_165.png
   ---------------------------------------------------------- */
const WEAPON_TYPES = [
  { id: 'stick',  name: 'スティック', icon: '🪵', atkMul: 1.00, color: '#b7884d' },
  { id: 'tue',    name: '杖',         icon: '🪄', atkMul: 0.95, color: '#9a6bd8' },
  { id: 'wip',    name: '鞭',         icon: '➰', atkMul: 1.00, color: '#c2577a' },
  { id: 'daga',   name: '短剣',       icon: '🔪', atkMul: 0.90, color: '#7fa7c9' },
  { id: 'ken',    name: '剣',         icon: '🗡️', atkMul: 1.05, color: '#5a8de0' },
  { id: 'tume',   name: '爪',         icon: '🐾', atkMul: 0.95, color: '#d98c3a' },
  { id: 'ono',    name: '斧',         icon: '🪓', atkMul: 1.15, color: '#b5523b' },
  { id: 'mace',   name: 'メイス',     icon: '🔨', atkMul: 1.10, color: '#8a8f99' },
  { id: 'kama',   name: '鎌',         icon: '🌙', atkMul: 1.05, color: '#5b9c6a' },
  { id: 'taiken', name: '大剣',       icon: '⚔️', atkMul: 1.25, color: '#c9a227' }
];

/* アクセサリーの種類（画像：assets/images/acc/{id}/{id}_001.png 〜 _055.png） */
const ACC_TYPES = [
  { id: 'ring',    name: '指輪',       icon: '💍', atkMul: 0.30, color: '#e0b84a' },
  { id: 'bangle',  name: '腕輪',       icon: '📿', atkMul: 0.35, color: '#9a7b5a' },
  { id: 'pendant', name: 'ペンダント', icon: '🏅', atkMul: 0.40, color: '#d8664a' },
  { id: 'earring', name: 'イヤリング', icon: '💎', atkMul: 0.30, color: '#5ac0d8' },
  { id: 'badge',   name: 'バッジ',     icon: '🎖️', atkMul: 0.35, color: '#6a7fd8' }
];

/* ----------------------------------------------------------
   エリアの「テーマ」：鍛冶マップの島の色・背景・BGMの初期値
   エリア個別に bg / bgm を指定すると、そちらが優先されます
   ---------------------------------------------------------- */
const AREA_THEMES = {
  grass:    { label: '草原',   icon: '🌱', color: '#8fd16a', dark: '#4f8f34', bg: 'assets/images/bg/bg_plain.png', bgm: 'assets/bgm/field_plain.mp3' },
  forest:   { label: '森',     icon: '🌲', color: '#5fae55', dark: '#2f6b2a' },
  desert:   { label: '砂漠',   icon: '🏜️', color: '#f0c86a', dark: '#b88a2a' },
  mountain: { label: '山',     icon: '⛰️', color: '#c2a98a', dark: '#7d6548' },
  cave:     { label: '洞窟',   icon: '⛏️', color: '#9a8a78', dark: '#5a4d40', bg: 'assets/images/bg/bg_cave.png', bgm: 'assets/bgm/field_cave.mp3' },
  crystal:  { label: '水晶',   icon: '💠', color: '#a6dcf2', dark: '#4f97b8' },
  beach:    { label: '海辺',   icon: '🏖️', color: '#ffe39a', dark: '#d8a83a' },
  sea:      { label: '海',     icon: '🌊', color: '#5aa6e6', dark: '#24609e' },
  snow:     { label: '雪',     icon: '❄️', color: '#e6f3ff', dark: '#8fb2d4' },
  volcano:  { label: '火山',   icon: '🌋', color: '#f07a4a', dark: '#a0361a' },
  sky:      { label: '空',     icon: '☁️', color: '#c6e8ff', dark: '#6aa6d8' },
  sweets:   { label: 'おかし', icon: '🍭', color: '#ffbcd9', dark: '#d8679a' },
  poison:   { label: '毒',     icon: '☠️', color: '#b48ae0', dark: '#6a3fa0' },
  bigtree:  { label: '巨大樹', icon: '🌳', color: '#8cc864', dark: '#4a7f2a' },
  mushroom: { label: 'キノコ', icon: '🍄', color: '#f4a3a3', dark: '#b8504f' },
  earth:    { label: '大地',   icon: '🕳️', color: '#b08a68', dark: '#6a4a30' },
  ghost:    { label: '霊',     icon: '👻', color: '#8f93bd', dark: '#4a4d78' },
  machine:  { label: '機械',   icon: '⚙️', color: '#a9b4bc', dark: '#5f6b74' },
  space:    { label: '宇宙',   icon: '🌠', color: '#6a6ab8', dark: '#2e2e70' },
  magic:    { label: '魔法',   icon: '🔮', color: '#c08ef0', dark: '#7a45b0' },
  ruins:    { label: '遺跡',   icon: '🏛️', color: '#d6c79c', dark: '#8f7f52' },
  demon:    { label: '魔王城', icon: '🏰', color: '#9a3f63', dark: '#4f1530' }
};

/* ----------------------------------------------------------
   鍛冶ワールドマップの並べ方（数字を変えるとマップの形が変わります）
   ---------------------------------------------------------- */
const FORGE_LAYOUT = {
  randomShape: true,    // true：武器・アクセの種類ごとに、島の並び・道のジグザグがランダムに変わる（毎回同じ形）
  islandsPerRow: 5,     // 1行に並ぶ島（エリア）の数（randomShape のときは 4〜5 から自動）
  islandW: 380,         // 島1つ分の横幅（ワールド座標）
  islandH: 330,         // 島1つ分の高さ
  nodeSize: 88,         // 武器アイコンの丸の直径
  startFromBottom: true,// true：1段目が一番下（魔王城に向かって登っていく）
  minScale: 0.14,       // いちばん引いたときの倍率
  maxScale: 1.8,        // いちばん寄ったときの倍率
  lodScale: 0.42,       // これより小さい倍率では画像を読まず「点」で表示（軽量化）
  showFutureImages: false // true：まだ作れない先の武器の画像も見せる（ネタバレ＆読み込み増）
};
