// ==========================================
// 1. アセット & マスターデータ設定
// ==========================================
const ASSETS = {
  titleBgm: 'assets/bgm/title_bgm.mp3',
  craftBgm: 'assets/bgm/craft_bgm.mp3',
  titleLogo: 'assets/images/logo_title.png',
  backgrounds: {
    title: 'assets/images/bg/bg_title.png',
    menu: 'assets/images/bg/bg_menu.png',
    adventure: 'assets/images/bg/bg_adventure.png',
    craft: 'assets/images/bg/bg_craft.png',
    zukan: 'assets/images/bg/bg_zukan.png'
  }
};

// ------------------------------------------
// 【素材マスター（新規追加ドロップ分を補完）】
// ------------------------------------------
const MATERIALS = {
  'やくそう': { icon: '🌿', image: 'assets/images/mat/mat_grass.png', desc: '傷を癒す緑色の薬草。錬金材料にもなる。' },
  'じょうぶな木': { icon: '🪵', image: 'assets/images/mat/mat_wood1.png', desc: '加工しやすい硬めの木材。' },
  'てっこうせき': { icon: '🪨', image: 'assets/images/mat/mat_iron.png', desc: '硬い金属を含んだ鉱石。' },
  'たまはがね': { icon: '💎', image: 'assets/images/mat/mat_steel.png', desc: '強固な武器を作る極上の鋼。' },
  'ネズミのしっぽ': { icon: '🐭', image: 'assets/images/mat/mat_tail1.png', desc: 'しなやかなネズミのしっぽ。紐の代わりに。' },
  'ひよこの羽毛': { icon: '🪶', image: 'assets/images/mat/mat_feather1.png', desc: 'フワフワした小さな羽毛。' },
  'ハチのつり針': { icon: '🐝', image: 'assets/images/mat/mat_stinger1.png', desc: '小さく鋭いハチの針。' },
  'どんぐり': { icon: '🌰', image: 'assets/images/mat/mat_acorn1.png', desc: '硬い殻に包まれたどんぐり。' },
  'キレイな貝がら': { icon: '🐚', image: 'assets/images/mat/mat_shell1.png', desc: '川辺で拾った綺麗な貝殻。' },
  'コウモリのフン': { icon: '🦇', image: 'assets/images/mat/mat_dung1.png', desc: '乾燥したフン。錬金用の触媒になる。' },
  'かたい小石': { icon: '🪨', image: 'assets/images/mat/mat_pebble1.png', desc: 'どこにでもある小さな石ころ。' },
  'ツタのつる': { icon: '🌱', image: 'assets/images/mat/mat_vine1.png', desc: '丈夫に絡みつく緑のツタ。' },
  'あかいキノコ': { icon: '🍄', image: 'assets/images/mat/mat_mushroom1.png', desc: '少し怪しい赤色をしたキノコ。' }
};

// ------------------------------------------
// 【エリア＆ターゲットマスター】
// ------------------------------------------
const AREAS = [
  {
    id: 0,
    name: "始まりの平原",
    reqLevel: 1,
    bgm: 'assets/bgm/field_plain.mp3',
    bg: 'assets/images/bg/bg_plain.png',
    targets: [
      // === モンスター9種（弱めの敵設定） ===
      { id: 't1', name: 'スライム', sprite: '👾', image: 'assets/images/monster/target_slime1.png', type: 'モンスター', hp: 8, timeLimit: 12, drop: 'やくそう', gold: 3, desc: '弱くて柔らかい生き物。初心者向け。', defeated: false },
      { id: 't_m2', name: 'のらネズミ', sprite: '🐀', image: 'assets/images/monster/target_rat1.png', type: 'モンスター', hp: 12, timeLimit: 10, drop: 'ネズミのしっぽ', gold: 4, desc: 'チョロチョロ動き回るすばしっこいネズミ。', defeated: false },
      { id: 't_m3', name: 'ミニひよこ', sprite: '🐤', image: 'assets/images/monster/target_chick1.png', type: 'モンスター', hp: 15, timeLimit: 10, drop: 'ひよこの羽毛', gold: 5, desc: 'よちよち歩く可愛いひよこ。害はない。', defeated: false },
      { id: 't_m4', name: 'みつばち', sprite: '🐝', image: 'assets/images/monster/target_bee1.png', type: 'モンスター', hp: 18, timeLimit: 8, drop: 'ハチのつり針', gold: 6, desc: 'お尻の針で威嚇してくる大きなハチ。', defeated: false },
      { id: 't_m5', name: 'いたずらリス', sprite: '🐿️', image: 'assets/images/monster/target_squirrel1.png', type: 'モンスター', hp: 22, timeLimit: 10, drop: 'どんぐり', gold: 7, desc: '木の上からどんぐりを投げてくるリス。', defeated: false },
      { id: 't_m6', name: 'メガヤドカリ', sprite: '🐚', image: 'assets/images/monster/target_crab1.png', type: 'モンスター', hp: 28, timeLimit: 12, drop: 'キレイな貝がら', gold: 9, desc: '川辺の浅瀬に生息している大きなヤドカリ。', defeated: false },
      { id: 't_m7', name: 'あなコウモリ', sprite: '🦇', image: 'assets/images/monster/target_bat1.png', type: 'モンスター', hp: 32, timeLimit: 8, drop: 'コウモリのフン', gold: 10, desc: '日陰を好む夜行性の小さなコウモリ。', defeated: false },
      { id: 't_m8', name: 'のうさぎ', sprite: '🐇', image: 'assets/images/monster/target_rabbit1.png', type: 'モンスター', hp: 38, timeLimit: 10, drop: 'やくそう', gold: 12, desc: '跳ね回るうさぎ。倒すのは少し気が引ける。', defeated: false },
      { id: 't_m9', name: 'おばけカボチャ', sprite: '🎃', image: 'assets/images/monster/target_pumpkin1.png', type: 'モンスター', hp: 45, timeLimit: 12, drop: 'あかいキノコ', gold: 15, desc: '平原の畑で勝手に意思を持ったカボチャ。', defeated: false },

      { id: 't2', name: 'オークの原木', sprite: '🪵', image: 'assets/images/object/target_tree1.png', type: 'オブジェクト', hp: 15, timeLimit: 0, drop: 'じょうぶな木', gold: 5, desc: '丈夫な木材が手に入る小さな樹木。', defeated: false },
      { id: 't_o2', name: '河原の小石山', sprite: '🪨', image: 'assets/images/object/target_pebbles1.png', type: 'オブジェクト', hp: 20, timeLimit: 0, drop: 'かたい小石', gold: 6, desc: '川沿いに溜まった小石の山。', defeated: false },
      { id: 't_o3', name: '野生の薬草群', sprite: '🌱', image: 'assets/images/object/target_grass1.png', type: 'オブジェクト', hp: 25, timeLimit: 0, drop: 'やくそう', gold: 7, desc: '青々と茂った自然の薬草群。', defeated: false },
      { id: 't_o4', name: 'ツタの茂み', sprite: '🌿', image: 'assets/images/object/target_vines1.png', type: 'オブジェクト', hp: 30, timeLimit: 0, drop: 'ツタのつる', gold: 8, desc: '絡み合った丈夫なツタの茂み。', defeated: false },
      { id: 't_o5', name: '古びた木の箱', sprite: '📦', image: 'assets/images/object/target_box1.png', type: 'オブジェクト', hp: 35, timeLimit: 0, drop: 'じょうぶな木', gold: 10, desc: '平原に放置された木箱。中に何かあるかも。', defeated: false },
      { id: 't_o6', name: 'どくキノコの株', sprite: '🍄', image: 'assets/images/object/target_mushroom1.png', type: 'オブジェクト', hp: 40, timeLimit: 0, drop: 'あかいキノコ', gold: 12, desc: '湿地帯に生えた不気味な色のキノコ。', defeated: false },
      { id: 't_o7', name: '風化した道しるべ', sprite: '🪧', image: 'assets/images/object/target_sign1.png', type: 'オブジェクト', hp: 50, timeLimit: 0, drop: 'じょうぶな木', gold: 14, desc: '誰も使わなくなった古い木製の看板。', defeated: false },
      { id: 't_o8', name: '苔むした丸太', sprite: '🪵', image: 'assets/images/object/target_log1.png', type: 'オブジェクト', hp: 60, timeLimit: 0, drop: 'じょうぶな木', gold: 16, desc: '表面にコケが生えた湿った丸太。', defeated: false },
      { id: 't_o9', name: '放置された壺', sprite: '🏺', image: 'assets/images/object/target_pot1.png', type: 'オブジェクト', hp: 70, timeLimit: 0, drop: 'かたい小石', gold: 20, desc: '素焼きの壺。割ると少しのゴールドが手に入る。', defeated: false }
    ]
  },
  {
    id: 1,
    name: "鉱山の洞窟",
    reqLevel: 3,
    bgm: 'assets/bgm/field_cave.mp3',
    bg: 'assets/images/bg/bg_cave.png',
    targets: [
      { id: 't3', name: '鉄の原鉱石', sprite: '🪨', image: 'assets/images/object/target_ironore.png', type: 'オブジェクト', hp: 100, timeLimit: 0, drop: 'てっこうせき', gold: 25, desc: '鉄分を豊富に含んだ鉱石。', defeated: false },
      { id: 't4', name: 'ゴーレム', sprite: '🗿', image: 'assets/images/monster/target_golem1.png', type: 'モンスター', hp: 150, timeLimit: 20, drop: 'たまはがね', gold: 50, desc: '岩石でできた動く守護者。', defeated: false }
    ]
  }
];

// ------------------------------------------
// 【武器マスター】
// ------------------------------------------
const WEAPONS = [
  // 剣系統
  { id: 'w_sword1', name: 'ひのきのぼう', cat: 'sword', rank: 1, req: null, icon: '🥖', image: 'assets/images/weapon/weapon_stick1.png', atk: 1, cost: {}, unlocked: true, desc: '木の枝を削った素朴な棒。' },
  { id: 'w_sword2', name: 'どうのつるぎ', cat: 'sword', rank: 2, req: 'w_sword1', icon: '🗡️', image: 'assets/images/weapon/weapon_copper_sword.png', atk: 4, cost: { 'じょうぶな木': 3, 'てっこうせき': 1 }, unlocked: false, desc: '銅で作られた扱いやすい標準的な剣。' },
  { id: 'w_sword3', name: 'はがねのつるぎ', cat: 'sword', rank: 3, req: 'w_sword2', icon: '⚔️', image: 'assets/images/weapon/weapon_steel_sword.png', atk: 15, cost: { 'てっこうせき': 5, 'たまはがね': 2 }, unlocked: false, desc: '鍛え上げられた鋼の剣。' },
  { id: 'w_sword4', name: 'ほむらのつるぎ', cat: 'sword', rank: 4, req: 'w_sword3', icon: '🔥', image: 'assets/images/weapon/weapon_flame_sword.png', atk: 50, cost: { 'たまはがね': 10, 'やくそう': 10 }, unlocked: false, desc: '熱い炎を宿す伝説の剣。' },
  { id: 'w_sword5', name: 'ドラゴンスレイヤー', cat: 'sword', rank: 5, req: 'w_sword4', icon: '🐉', image: 'assets/images/weapon/weapon_dragon_sword.png', atk: 120, cost: { 'たまはがね': 20, 'てっこうせき': 20 }, unlocked: false, desc: '竜の鱗をも易々と断ち切る神話の剣。' },

  // 斧系統
  { id: 'w_axe1', name: 'てつのオノ', cat: 'axe', rank: 1, req: 'w_sword2', icon: '🪓', image: 'assets/images/weapon/weapon_axe1.png', atk: 10, cost: { 'てっこうせき': 5, 'じょうぶな木': 5 }, unlocked: false, desc: '重量があり高威力を誇る斧。' },
  { id: 'w_axe2', name: 'グレートアックス', cat: 'axe', rank: 2, req: 'w_axe1', icon: '🪓', image: 'assets/images/weapon/weapon_axe2.png', atk: 30, cost: { 'たまはがね': 6, 'てっこうせき': 8 }, unlocked: false, desc: '両手で振り下ろす大斧。' },

  // 鎌系統 (※タイポ「たまは发ね」を「たまはがね」に修正)
  { id: 'w_sickle1', name: 'はがねのカマ', cat: 'sickle', rank: 1, req: 'w_sword3', icon: '🌾', image: 'assets/images/weapon/weapon_sickle1.png', atk: 25, cost: { 'てっこうせき': 5, 'たまはがね': 4 }, unlocked: false, desc: '草木も敵もなぎ払う鋭い鎌。' },
  { id: 'w_sickle2', name: 'デスサイズ', cat: 'sickle', rank: 2, req: 'w_sickle1', icon: '☠️', image: 'assets/images/weapon/weapon_sickle2.png', atk: 65, cost: { 'たまはがね': 12, 'やくそう': 15 }, unlocked: false, desc: '死神の影がチラつく大鎌。' }
];

// ------------------------------------------
// 【アクセサリーマスター】
// ------------------------------------------
const ACCESSORIES = [
  // 指輪ルート
  { id: 'a_ring1', name: '銅の指輪', cat: 'ring', rank: 1, req: null, icon: '💍', image: 'assets/images/acc/acc_ring1.png', atk: 2, cost: { 'てっこうせき': 2 }, unlocked: false, desc: '攻撃力がほんのり上がる指輪。' },
  { id: 'a_ring2', name: '銀の指輪', cat: 'ring', rank: 2, req: 'a_ring1', icon: '💍', image: 'assets/images/acc/acc_ring2.png', atk: 6, cost: { 'てっこうせき': 5 }, unlocked: false, desc: '美しく磨かれた銀の指輪。' },
  { id: 'a_ring3', name: '力の指輪', cat: 'ring', rank: 3, req: 'a_ring2', icon: '💎', image: 'assets/images/acc/acc_ring3.png', atk: 14, cost: { 'たまはがね': 4 }, unlocked: false, desc: '秘められた力が溢れ出る指輪。' },

  // 腕輪ルート
  { id: 'a_bangle1', name: '鉄の腕輪', cat: 'bangle', rank: 1, req: 'a_ring1', icon: '📿', image: 'assets/images/acc/acc_amulet1.png', atk: 4, cost: { 'てっこうせき': 4, 'じょうぶな木': 2 }, unlocked: false, desc: '攻撃力を高める強固な腕輪。' },
  { id: 'a_bangle2', name: '鋼の腕輪', cat: 'bangle', rank: 2, req: 'a_bangle1', icon: '📿', image: 'assets/images/acc/acc_amulet2.png', atk: 10, cost: { 'たまはがね': 3, 'てっこうせき': 4 }, unlocked: false, desc: 'ずっしりと重い鋼鉄の腕輪。' },

  // ペンダントルート
  { id: 'a_pendant1', name: '剛力のアミュレット', cat: 'pendant', rank: 1, req: 'a_bangle1', icon: '🏅', image: 'assets/images/acc/acc_pendant1.png', atk: 18, cost: { 'たまはがね': 6, 'てっこうせき': 6 }, unlocked: false, desc: '強い力が湧き出るペンダント。' }
];

// ==========================================
// 2. 動的参照ヘルパー
// ==========================================
function getMaterialSources(matName) {
  const sources = [];
  AREAS.forEach(area => {
    area.targets.forEach(target => {
      if (target.drop === matName && !sources.includes(target.name)) {
        sources.push(target.name);
      }
    });
  });
  return sources.length > 0 ? sources.join(', ') : '不明';
}

function renderMaterialZukanList(list) {
  for (const [name, info] of Object.entries(MATERIALS)) {
    const isDiscovered = (state.materials[name] > 0) || AREAS.some(a => a.targets.some(t => t.defeated && t.drop === name));
    const card = document.createElement('div');
    card.className = `zukan-card ${isDiscovered ? '' : 'unknown'}`;
    
    if (isDiscovered) {
      const iconHTML = info.image ? `<img src="${info.image}" class="zukan-img" alt="${name}">` : (info.icon || '📦');
      const sourcesText = getMaterialSources(name);
      
      card.innerHTML = `
        <div class="zukan-icon">${iconHTML}</div>
        <div class="zukan-info">
          <div class="zukan-title">${name}</div>
          <div class="zukan-desc">${info.desc || ''}</div>
          <div class="zukan-sub">入手元: ${sourcesText}</div>
        </div>
      `;
      if (info.image) {
        card.querySelector('.zukan-img')?.addEventListener('click', (e) => {
          e.stopPropagation(); openImagePreview(info.image, name);
        });
      }
    } else {
      card.innerHTML = `
        <div class="zukan-icon">❓</div>
        <div class="zukan-info">
          <div class="zukan-title">未知の素材</div>
          <div class="zukan-desc">入手またはドロップ元を撃破で解放。</div>
        </div>
      `;
    }
    list.appendChild(card);
  }
}

const CHANGELOG = [
  { version: 'v1.4.0', date: '2026-09-16', detail: '設定音切換、時間切れ復旧処理、装備画像表示保証、レイアウト共通化対応。' },
  { version: 'v1.3.3', date: '2026-09-16', detail: '画面初期化および図鑑モーダルの重なり不具合を修正。' }
];

// --- ゲーム状態 ---
let state = {
  currentAreaIdx: 0,
  currentTargetIdx: 0,
  adventureMode: 'モンスター',
  targetHp: 10,
  targetMaxHp: 10,
  materials: { 'やくそう': 0, 'じょうぶな木': 0, 'てっこうせき': 0, 'たまはがね': 0 },
  equippedWeapon: WEAPONS[0],
  equippedAccessories: [null, null, null],
  activeZukanTab: 'monster',
  activeEquipTab: 'weapon',
  activeCraftTab: 'weapon',
  
  seEnabled: true,
  bgmEnabled: true,

  gold: 0,
  elapsedSeconds: 0,
  monsterKills: 0,
  objectKills: 0,
  tapLevel: 1,
  tapExp: 0,
  tapNextExp: 10,

  battleTimeLeft: 10,
  battleTimeMax: 10,
  battleTimerId: null,
  battleStarted: false
};

function getWeaponAtk() { return state.equippedWeapon ? state.equippedWeapon.atk : 1; }
function getAccTotalAtk() {
  let accAtk = 0;
  state.equippedAccessories.forEach(acc => { if (acc) accAtk += acc.atk || 0; });
  return accAtk;
}
function getTotalAtk() { return getWeaponAtk() + getAccTotalAtk(); }

// ==========================================
// 3. 音声・BGM処理
// ==========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let seEnabled = true;
let bgmEnabled = true;
let currentBgmPath = '';
const bgmPlayer = document.getElementById('bgm-player');

if (bgmPlayer) bgmPlayer.volume = 0.15;

function initAudio() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playBGM(bgmPath) {
  if (!bgmEnabled || !bgmPlayer) return;
  const path = bgmPath || ASSETS.titleBgm;
  
  if (currentBgmPath !== path) {
    currentBgmPath = path;
    bgmPlayer.src = path;
    bgmPlayer.volume = 0.15;
    bgmPlayer.play().catch(() => {});
  } else if (bgmPlayer.paused) {
    bgmPlayer.play().catch(() => {});
  }
}

function stopBGM() {
  if (bgmPlayer) bgmPlayer.pause();
}

function playSound(type) {
  if (!seEnabled) return;
  initAudio();
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  switch (type) {
    case 'hit':
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
      break;
    case 'defeat':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
      break;
    case 'craft':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.08);
      osc.frequency.setValueAtTime(783.99, now + 0.16);
      osc.frequency.setValueAtTime(1046.50, now + 0.24);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
      break;
    case 'btn':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.05);
      osc.start(now); osc.stop(now + 0.05);
      break;
    case 'open':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
      break;
    case 'close':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.06);
      osc.start(now); osc.stop(now + 0.06);
      break;
    case 'change':
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.setValueAtTime(700, now + 0.04);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
      break;
    case 'levelup':
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(554.37, now + 0.1);
      osc.frequency.setValueAtTime(659.25, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
      osc.start(now); osc.stop(now + 0.35);
      break;
    case 'timeover':
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.setValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
      osc.start(now); osc.stop(now + 0.25);
      break;
  }
}

// ==========================================
// 4. DOM要素 & セーブ・ロード処理
// ==========================================
const screens = {
  title: document.getElementById('screen-title'),
  menu: document.getElementById('screen-menu'),
  adventure: document.getElementById('screen-adventure'),
  craft: document.getElementById('screen-craft')
};

const overlays = {
  zukan: document.getElementById('screen-zukan'),
  items: document.getElementById('modal-items'),
  equip: document.getElementById('modal-equip'),
  map: document.getElementById('modal-map'),
  settings: document.getElementById('modal-settings'),
  changelog: document.getElementById('modal-changelog')
};

function saveGame() {
  localStorage.setItem('bakuda_craft_save', JSON.stringify({
    state: state,
    weaponsUnlocked: WEAPONS.map(w => ({ id: w.id, unlocked: w.unlocked })),
    accessoriesUnlocked: ACCESSORIES.map(a => ({ id: a.id, unlocked: a.unlocked })),
    targetsDefeated: AREAS.map(a => a.targets.map(t => ({ id: t.id, defeated: t.defeated })))
  }));
}

function loadGame() {
  const saved = localStorage.getItem('bakuda_craft_save');
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    Object.assign(state, data.state);
    
    if (state.seEnabled !== undefined) seEnabled = state.seEnabled;
    if (state.bgmEnabled !== undefined) bgmEnabled = state.bgmEnabled;

    if (data.weaponsUnlocked) {
      data.weaponsUnlocked.forEach(savedW => {
        const w = WEAPONS.find(item => item.id === savedW.id);
        if (w) w.unlocked = savedW.unlocked;
      });
    }

    if (state.equippedWeapon && state.equippedWeapon.id) {
      const realWeapon = WEAPONS.find(w => w.id === state.equippedWeapon.id);
      if (realWeapon) {
        state.equippedWeapon = realWeapon;
      }
    }

    if (state.equippedAccessories && Array.isArray(state.equippedAccessories)) {
      state.equippedAccessories = state.equippedAccessories.map(acc => {
        if (!acc) return null;
        return ACCESSORIES.find(a => a.id === acc.id) || null;
      });
    }

    if (data.accessoriesUnlocked) {
      data.accessoriesUnlocked.forEach(savedA => {
        const a = ACCESSORIES.find(item => item.id === savedA.id);
        if (a) a.unlocked = savedA.unlocked;
      });
    }
    if (data.targetsDefeated) {
      data.targetsDefeated.forEach((savedArea, aIdx) => {
        savedArea.forEach(savedT => {
          const t = AREAS[aIdx].targets.find(item => item.id === savedT.id);
          if (t) t.defeated = savedT.defeated;
        });
      });
    }
    
    updateSettingsUI();
  } catch (e) { console.error(e); }
}

function updateSettingsUI() {
  const imgSe = document.getElementById('img-se-status');
  if (imgSe) imgSe.src = seEnabled ? 'assets/images/supika_o.png' : 'assets/images/supika_x.png';
  
  const imgBgm = document.getElementById('img-bgm-status');
  if (imgBgm) imgBgm.src = bgmEnabled ? 'assets/images/supika_o.png' : 'assets/images/supika_x.png';
}

window.addEventListener('click', () => {
  if (screens.title && !screens.title.classList.contains('hidden')) {
    initAudio();
    playBGM(ASSETS.titleBgm);
  }
}, { once: true });

window.addEventListener('DOMContentLoaded', () => {
  loadGame();
  applyAssets();
});

function applyAssets() {
  if (ASSETS.backgrounds.title && screens.title) screens.title.style.backgroundImage = `url('${ASSETS.backgrounds.title}')`;
  if (ASSETS.backgrounds.menu && screens.menu) screens.menu.style.backgroundImage = `url('${ASSETS.backgrounds.menu}')`;
  if (ASSETS.backgrounds.craft && screens.craft) screens.craft.style.backgroundImage = `url('${ASSETS.backgrounds.craft}')`;
  if (ASSETS.backgrounds.zukan && overlays.zukan) overlays.zukan.style.backgroundImage = `url('${ASSETS.backgrounds.zukan}')`;
}

setInterval(() => {
  if (screens.title && !screens.title.classList.contains('hidden')) return;
  state.elapsedSeconds++;
  updateMenuUI();
  saveGame();
}, 1000);

function showScreen(screenKey) {
  Object.values(screens).forEach(s => s?.classList.add('hidden'));
  screens[screenKey]?.classList.remove('hidden');
}

function openOverlay(overlayKey) {
  playSound('open');
  overlays[overlayKey]?.classList.remove('hidden');
}

function closeOverlay(overlayKey) {
  playSound('close');
  overlays[overlayKey]?.classList.add('hidden');
}

// ==========================================
// 5. イベント登録
// ==========================================
const startTitleGame = (e) => {
  if (e) e.stopPropagation();
  if (screens.title && screens.title.classList.contains('hidden')) return;

  initAudio();
  playSound('btn');
  playBGM(ASSETS.titleBgm);
  showScreen('menu');
  updateMenuUI();
};

document.getElementById('screen-title')?.addEventListener('click', startTitleGame);
document.getElementById('btn-start-game')?.addEventListener('click', startTitleGame);

document.getElementById('btn-menu-adventure')?.addEventListener('click', (e) => {
  e.stopPropagation();
  playSound('open');
  showScreen('adventure');
  loadTarget();
});

document.getElementById('btn-unequip-acc0')?.addEventListener('click', (e) => { e.stopPropagation(); unequipAccessory(0); });
document.getElementById('btn-unequip-acc1')?.addEventListener('click', (e) => { e.stopPropagation(); unequipAccessory(1); });
document.getElementById('btn-unequip-acc2')?.addEventListener('click', (e) => { e.stopPropagation(); unequipAccessory(2); });

document.getElementById('btn-menu-equip')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('equip');
  renderEquipList();
});

document.getElementById('btn-menu-craft')?.addEventListener('click', (e) => {
  e.stopPropagation();
  playSound('open');
  playBGM(ASSETS.craftBgm);
  showScreen('craft');
  renderCraftList();
});

document.getElementById('btn-menu-zukan')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('zukan');
  renderZukan();
});

document.getElementById('btn-settings-open')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('settings');
});

document.querySelectorAll('.back-to-menu-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('close');
    stopBattleTimer();
    playBGM(ASSETS.titleBgm);
    showScreen('menu');
    updateMenuUI();
  });
});

document.getElementById('btn-adv-items')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('items');
  renderMaterials();
});

document.getElementById('btn-adv-zukan')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('zukan');
  renderZukan();
});

document.getElementById('btn-open-map')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('map');
  renderMapList();
});

document.getElementById('btn-zukan-close')?.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay('zukan'); });
document.getElementById('btn-items-close')?.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay('items'); });
document.getElementById('btn-equip-close')?.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay('equip'); });
document.getElementById('btn-map-close')?.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay('map'); });
document.getElementById('btn-settings-close')?.addEventListener('click', (e) => { e.stopPropagation(); closeOverlay('settings'); });

document.getElementById('tab-mode-battle')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.adventureMode === 'モンスター') return;
  playSound('change');
  state.adventureMode = 'モンスター';
  updateModeTabs();
  saveGame();
  loadTarget();
});

document.getElementById('tab-mode-explore')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state.adventureMode === 'オブジェクト') return;
  playSound('change');
  state.adventureMode = 'オブジェクト';
  updateModeTabs();
  saveGame();
  loadTarget();
});

function updateModeTabs() {
  const tabBattle = document.getElementById('tab-mode-battle');
  const tabExplore = document.getElementById('tab-mode-explore');
  if (tabBattle) tabBattle.classList.toggle('active', state.adventureMode === 'モンスター');
  if (tabExplore) tabExplore.classList.toggle('active', state.adventureMode === 'オブジェクト');
}

document.getElementById('btn-open-changelog')?.addEventListener('click', (e) => {
  e.stopPropagation();
  openOverlay('changelog');
  renderChangelog();
});

document.getElementById('btn-changelog-close')?.addEventListener('click', (e) => {
  e.stopPropagation();
  closeOverlay('changelog');
});

document.getElementById('btn-delete-data')?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (confirm('すべてのセーブデータを削除して初期化しますか？')) {
    localStorage.removeItem('bakuda_craft_save');
    playSound('defeat');
    location.reload();
  }
});

document.getElementById('btn-toggle-se')?.addEventListener('click', (e) => {
  e.stopPropagation();
  seEnabled = !seEnabled;
  state.seEnabled = seEnabled;
  saveGame();
  if (seEnabled) playSound('btn');
  updateSettingsUI();
});

document.getElementById('btn-toggle-bgm')?.addEventListener('click', (e) => {
  e.stopPropagation();
  bgmEnabled = !bgmEnabled;
  state.bgmEnabled = bgmEnabled;
  saveGame();
  updateSettingsUI();

  if (bgmEnabled) {
    const currentBgm = screens.adventure && !screens.adventure.classList.contains('hidden') ? 
      AREAS[state.currentAreaIdx].bgm : 
      (screens.craft && !screens.craft.classList.contains('hidden') ? ASSETS.craftBgm : ASSETS.titleBgm);
    playBGM(currentBgm);
  } else {
    stopBGM();
  }
});

function openImagePreview(src, caption) {
  const popup = document.getElementById('modal-img-preview');
  const img = document.getElementById('preview-img');
  const cap = document.getElementById('preview-caption');
  if (popup && img && cap) {
    img.src = src;
    cap.textContent = caption;
    popup.classList.remove('hidden');
    playSound('open');
  }
}

const closePreviewHandler = (e) => {
  if (e) e.stopPropagation();
  const popup = document.getElementById('modal-img-preview');
  if (popup) {
    popup.classList.add('hidden');
    playSound('close');
  }
};

document.getElementById('btn-preview-close')?.addEventListener('click', closePreviewHandler);
document.getElementById('modal-img-preview')?.addEventListener('click', closePreviewHandler);

// ==========================================
// 6. 戦闘・タイマー処理
// ==========================================
function startBattleTimer() {
  stopBattleTimer();
  if (state.battleTimeMax <= 0) return;

  state.battleStarted = true;
  state.battleTimerId = setInterval(() => {
    state.battleTimeLeft = Math.max(0, state.battleTimeLeft - 0.1);
    updateTimerUI();

    if (state.battleTimeLeft <= 0) {
      stopBattleTimer();
      playSound('timeover');
      state.targetHp = state.targetMaxHp;
      updateBattleUI();
    }
  }, 100);
}

function stopBattleTimer() {
  if (state.battleTimerId) {
    clearInterval(state.battleTimerId);
    state.battleTimerId = null;
  }
  state.battleStarted = false;
}

function updateTimerUI() {
  const timerWrapper = document.getElementById('timer-wrapper');
  if (!timerWrapper) return;
  if (state.battleTimeMax <= 0) {
    timerWrapper.style.display = 'none';
    return;
  }
  timerWrapper.style.display = 'block';
  const percent = (state.battleTimeLeft / state.battleTimeMax) * 100;
  const timerBar = document.getElementById('timer-bar');
  if (timerBar) timerBar.style.width = `${percent}%`;
  const timerText = document.getElementById('timer-text');
  if (timerText && timerText.querySelector('span')) {
    timerText.querySelector('span').textContent = state.battleTimeLeft.toFixed(1);
  }
}

function attack() {
  if (!state.battleStarted && state.targetHp > 0 && state.battleTimeMax > 0) {
    startBattleTimer();
  }

  const damage = getTotalAtk();
  state.targetHp = Math.max(0, state.targetHp - damage);

  state.tapExp++;
  if (state.tapExp >= state.tapNextExp) {
    state.tapLevel++;
    state.tapExp -= state.tapNextExp;
    state.tapNextExp = Math.floor(state.tapNextExp * 1.5);
    playSound('levelup');
  } else {
    playSound('hit');
  }

  const spriteEl = document.getElementById('target-sprite');
  const imgEl = document.getElementById('target-image');
  if (spriteEl) spriteEl.classList.add('hit');
  if (imgEl) imgEl.classList.add('hit');
  setTimeout(() => {
    if (spriteEl) spriteEl.classList.remove('hit');
    if (imgEl) imgEl.classList.remove('hit');
  }, 50);

  if (state.targetHp === 0) defeatTarget();
  updateBattleUI();
  updateMenuUI();
}

document.getElementById('click-area')?.addEventListener('click', attack);
document.getElementById('target-sprite-container')?.addEventListener('click', attack);

function defeatTarget() {
  stopBattleTimer();
  playSound('defeat');
  const currentArea = AREAS[state.currentAreaIdx];
  
  // 現在のモード（モンスター or オブジェクト）に該当するリストを抽出
  const filteredTargets = currentArea.targets.filter(t => t.type === state.adventureMode);
  
  if (filteredTargets.length > 0) {
    const currentTarget = filteredTargets[state.currentTargetIdx % filteredTargets.length];
    currentTarget.defeated = true;

    // ドロップ獲得 & 統計更新
    if (state.adventureMode === 'モンスター') state.monsterKills++;
    else state.objectKills++;

    const count = Math.floor(Math.random() * 2) + 1;
    state.materials[currentTarget.drop] = (state.materials[currentTarget.drop] || 0) + count;
    state.gold += currentTarget.gold;

    // 次のインデックスへ進める
    state.currentTargetIdx = (state.currentTargetIdx + 1) % filteredTargets.length;
  }

  saveGame();
  loadTarget();
}

function loadTarget() {
  stopBattleTimer();
  const currentArea = AREAS[state.currentAreaIdx];
  playBGM(currentArea.bgm);

  updateModeTabs();

  const bgPath = currentArea.bg || ASSETS.backgrounds.adventure;
  if (bgPath && screens.adventure) {
    screens.adventure.style.backgroundImage = `url('${bgPath}')`;
  }

  const target = currentArea.targets.find(t => t.type === state.adventureMode) || currentArea.targets[0];
  
  state.targetMaxHp = target.hp;
  state.targetHp = target.hp;
  state.battleTimeMax = target.timeLimit || 0;
  state.battleTimeLeft = state.battleTimeMax;

  const areaNameEl = document.getElementById('area-name');
  if (areaNameEl) areaNameEl.textContent = currentArea.name;
  const targetNameEl = document.getElementById('target-name');
  if (targetNameEl) targetNameEl.textContent = target.name;
  
  const targetImg = document.getElementById('target-image');
  const targetSprite = document.getElementById('target-sprite');
  if (target.image && targetImg && targetSprite) {
    targetImg.src = target.image;
    targetImg.classList.remove('hidden');
    targetSprite.classList.add('hidden');
    targetImg.onclick = null;
  } else if (targetSprite && targetImg) {
    targetSprite.textContent = target.sprite;
    targetSprite.classList.remove('hidden');
    targetImg.classList.add('hidden');
  }

  const weaponImg = document.getElementById('weapon-image');
  const weaponIcon = document.getElementById('weapon-icon');
  if (state.equippedWeapon.image && weaponImg && weaponIcon) {
    weaponImg.src = state.equippedWeapon.image;
    weaponImg.classList.remove('hidden');
    weaponIcon.classList.add('hidden');
    weaponImg.onclick = null;
  } else if (weaponIcon && weaponImg) {
    weaponIcon.textContent = state.equippedWeapon.icon;
    weaponIcon.classList.remove('hidden');
    weaponImg.classList.add('hidden');
  }

  updateTimerUI();
  updateBattleUI();
}

function updateBattleUI() {
  const hpPercent = (state.targetHp / state.targetMaxHp) * 100;
  const hpBar = document.getElementById('hp-bar');
  if (hpBar) hpBar.style.width = `${hpPercent}%`;
  const curHpEl = document.getElementById('current-hp');
  if (curHpEl) curHpEl.textContent = state.targetHp;
  const maxHpEl = document.getElementById('max-hp');
  if (maxHpEl) maxHpEl.textContent = state.targetMaxHp;
}

function updateMenuUI() {
  const totalAtk = getTotalAtk();
  const menuWeaponEl = document.getElementById('menu-equipped-weapon');
  if (menuWeaponEl) menuWeaponEl.textContent = `${state.equippedWeapon.icon} ${state.equippedWeapon.name} (合計ATK: ${totalAtk})`;

  const tapLevelEl = document.getElementById('menu-tap-level');
  if (tapLevelEl) tapLevelEl.textContent = `Lv.${state.tapLevel}`;
  const tapExpEl = document.getElementById('menu-tap-exp-text');
  if (tapExpEl) tapExpEl.textContent = `${state.tapExp} / ${state.tapNextExp} EXP`;
  const expPercent = (state.tapExp / state.tapNextExp) * 100;
  const tapExpBar = document.getElementById('menu-tap-exp-bar');
  if (tapExpBar) tapExpBar.style.width = `${expPercent}%`;

  const goldEl = document.getElementById('menu-gold');
  if (goldEl) goldEl.textContent = `${state.gold} G`;

  const totalKills = state.monsterKills + state.objectKills;
  const killsEl = document.getElementById('menu-stats-kills');
  if (killsEl) killsEl.textContent = `撃破:${state.monsterKills} / 破壊:${state.objectKills} (計:${totalKills})`;

  const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0');
  const secs = String(state.elapsedSeconds % 60).padStart(2, '0');
  const playtimeEl = document.getElementById('menu-playtime');
  if (playtimeEl) playtimeEl.textContent = `${mins}:${secs}`;
}

// ==========================================
// 7. 画面レンダリング系
// ==========================================

// --- 錬金ツリー画面描画 ---
document.querySelectorAll('.craft-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('change');
    state.activeCraftTab = e.target.dataset.ctab;
    saveGame();
    renderCraftList();
  });
});

function renderCraftList() {
  const container = document.getElementById('craft-list');
  if (!container) return;
  container.innerHTML = '';

  const tab = state.activeCraftTab || 'weapon';

  document.querySelectorAll('.craft-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ctab === tab);
  });

  const isWeapon = (tab === 'weapon');
  const items = isWeapon ? WEAPONS : ACCESSORIES;
  
  const categories = isWeapon 
    ? [ { id: 'sword', name: '🗡️ 剣系統' }, { id: 'axe', name: '🪓 斧系統' }, { id: 'sickle', name: '🌾 鎌系統' } ]
    : [ { id: 'ring', name: '💍 指輪系統' }, { id: 'bangle', name: '📿 腕輪系統' }, { id: 'pendant', name: '🏅 ペンダント系統' } ];

  const treeWrapper = document.createElement('div');
  treeWrapper.className = 'craft-tree-wrapper';

  categories.forEach(cat => {
    const catItems = items.filter(i => i.cat === cat.id).sort((a, b) => a.rank - b.rank);
    if (catItems.length === 0) return;

    const rowEl = document.createElement('div');
    rowEl.className = 'tree-row';

    const labelEl = document.createElement('div');
    labelEl.className = 'tree-cat-label';
    labelEl.textContent = cat.name;
    rowEl.appendChild(labelEl);

    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'tree-nodes-container';

    catItems.forEach((item, index) => {
      if (index > 0) {
        const lineEl = document.createElement('div');
        const prevItem = catItems[index - 1];
        lineEl.className = `tree-line ${prevItem.unlocked ? 'active' : ''}`;
        nodesContainer.appendChild(lineEl);
      }

      const reqItem = items.find(i => i.id === item.req);
      const isReqMet = !item.req || (reqItem && reqItem.unlocked);

      let canCraft = isReqMet && !item.unlocked;
      let costArr = [];
      for (const [mat, amount] of Object.entries(item.cost)) {
        costArr.push(`${mat}×${amount}`);
        if ((state.materials[mat] || 0) < amount) canCraft = false;
      }

      const nodeEl = document.createElement('div');
      nodeEl.className = `tree-node ${item.unlocked ? 'unlocked' : (canCraft ? 'craftable' : (isReqMet ? 'locked' : 'hidden-node'))}`;

      const iconHTML = item.image 
        ? `<img src="${item.image}" class="tree-node-img" alt="${item.name}">`
        : `<span class="tree-node-icon">${item.icon}</span>`;

      nodeEl.innerHTML = `
        <div class="node-icon-box">${iconHTML}</div>
        ${item.unlocked ? '<div class="node-status">✓</div>' : ''}
      `;
      
      nodeEl.onclick = (e) => {
        e.stopPropagation();
        if (item.unlocked) {
          alert(`【${item.name}】\n攻撃力: +${item.atk}\n説明: ${item.desc}\n(作成済み)`);
        } else if (!isReqMet) {
          alert(`前段階のアイテムを作成すると解放されます。`);
        } else {
          showCraftConfirmModal(item, canCraft, costArr);
        }
      };

      nodesContainer.appendChild(nodeEl);
    });

    rowEl.appendChild(nodesContainer);
    treeWrapper.appendChild(rowEl);
  });

  container.appendChild(treeWrapper);
}

function showCraftConfirmModal(item, canCraft, costArr) {
  const costText = costArr.length > 0 ? costArr.join('\n') : 'なし';
  const msg = `【${item.name}】を錬金しますか？\n\n[必要素材]\n${costText}\n\n[ステータス] ATK +${item.atk}`;
  
  if (!canCraft) {
    alert(`${msg}\n\n※素材が不足しています。`);
    return;
  }

  if (confirm(msg)) {
    for (const [mat, amount] of Object.entries(item.cost)) {
      state.materials[mat] -= amount;
    }
    item.unlocked = true;
    
    if (state.activeCraftTab === 'weapon') {
      state.equippedWeapon = item;
    } else {
      const emptyIdx = state.equippedAccessories.findIndex(a => a === null);
      if (emptyIdx !== -1) state.equippedAccessories[emptyIdx] = item;
    }

    playSound('craft');
    saveGame();
    renderCraftList();
    renderEquipList();
    updateMenuUI();
  }
}

// --- エリアマップ描画 ---
function renderMapList() {
  const list = document.getElementById('map-area-list');
  if (!list) return;
  list.innerHTML = '';
  AREAS.forEach((area, idx) => {
    const isUnlocked = state.tapLevel >= area.reqLevel;
    const isCurrent = state.currentAreaIdx === idx;
    const card = document.createElement('div');
    card.className = `map-card ${isUnlocked ? '' : 'locked'}`;
    card.innerHTML = `
      <div class="map-info">
        <div class="map-title" style="font-weight:bold; font-size:13px;">${area.name}</div>
        ${!isUnlocked ? `<div class="map-req" style="font-size:10px; color:#e74c3c;">🔒 Tap Lv.${area.reqLevel} 以上で解放</div>` : ''}
      </div>
    `;
    const btn = document.createElement('button');
    btn.className = 'map-btn rpg-btn-sm';
    btn.textContent = isCurrent ? '滞在中' : (isUnlocked ? '移動' : 'ロック');
    btn.disabled = !isUnlocked || isCurrent;
    btn.onclick = (e) => {
      e.stopPropagation();
      state.currentAreaIdx = idx;
      playSound('change');
      saveGame();
      loadTarget();
      closeOverlay('map');
    };
    card.appendChild(btn);
    list.appendChild(card);
  });
}

// --- 所持素材描画 ---
function renderMaterials() {
  const grid = document.getElementById('material-grid');
  if (!grid) return;
  grid.innerHTML = '';
  let hasItem = false;
  for (const [name, info] of Object.entries(MATERIALS)) {
    const count = state.materials[name] || 0;
    if (count > 0) {
      hasItem = true;
      const card = document.createElement('div');
      card.className = 'mat-card';
      const iconHTML = info.image ? `<img src="${info.image}" class="mat-img" alt="${name}">` : (info.icon || '📦');
      card.innerHTML = `
        <div class="mat-icon">${iconHTML}</div>
        <div>
          <div style="font-weight:bold; font-size:12px;">${name}</div>
          <div style="color:#f1c40f; font-size:11px;">所持数: ${count}</div>
        </div>
      `;
      if (info.image) {
        card.querySelector('.mat-img')?.addEventListener('click', (e) => {
          e.stopPropagation(); openImagePreview(info.image, name);
        });
      }
      grid.appendChild(card);
    }
  }
  if (!hasItem) grid.innerHTML = '<div class="empty-msg">所持している素材はありません</div>';
}

// --- 装備画面描画（安全なUI連動） ---
document.querySelectorAll('.equip-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('change');
    state.activeEquipTab = e.target.dataset.etab;
    saveGame();
    renderEquipList();
  });
});

function renderEquipList() {
  const list = document.getElementById('equip-list');
  if (!list) return;
  list.innerHTML = '';

  let tab = state.activeEquipTab || 'weapon';
  document.querySelectorAll('.equip-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.etab === tab);
  });

  const slotWeaponEl = document.getElementById('slot-weapon-name');
  if (slotWeaponEl && state.equippedWeapon) {
    slotWeaponEl.textContent = `${state.equippedWeapon.name} (+${state.equippedWeapon.atk})`;
  }

  const acc0Btn = document.getElementById('btn-unequip-acc0');
  const acc1Btn = document.getElementById('btn-unequip-acc1');
  const acc2Btn = document.getElementById('btn-unequip-acc2');

  const slotAcc0El = document.getElementById('slot-acc0-name');
  if (slotAcc0El) {
    const item = state.equippedAccessories[0];
    slotAcc0El.textContent = item ? `${item.name} (+${item.atk})` : 'なし';
    if (acc0Btn) acc0Btn.classList.toggle('hidden', !item);
  }

  const slotAcc1El = document.getElementById('slot-acc1-name');
  if (slotAcc1El) {
    const item = state.equippedAccessories[1];
    slotAcc1El.textContent = item ? `${item.name} (+${item.atk})` : 'なし';
    if (acc1Btn) acc1Btn.classList.toggle('hidden', !item);
  }

  const slotAcc2El = document.getElementById('slot-acc2-name');
  if (slotAcc2El) {
    const item = state.equippedAccessories[2];
    slotAcc2El.textContent = item ? `${item.name} (+${item.atk})` : 'なし';
    if (acc2Btn) acc2Btn.classList.toggle('hidden', !item);
  }

  if (tab === 'weapon') {
    WEAPONS.forEach(w => {
      if (!w.unlocked) return;
      const card = document.createElement('div');
      card.className = 'equip-card';
      const isEquipped = state.equippedWeapon && state.equippedWeapon.id === w.id;
      const iconHTML = w.image ? `<img src="${w.image}" class="equip-img" alt="${w.name}">` : w.icon;
      
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="equip-icon">${iconHTML}</div>
          <div>
            <div style="font-size:13px; font-weight:bold;">${w.name}</div>
            <div style="font-size:10px; color:#aaa;">攻撃力: +${w.atk}</div>
          </div>
        </div>
      `;
      const btn = document.createElement('button');
      btn.className = `equip-btn rpg-btn-sm ${isEquipped ? 'equipped' : ''}`;
      btn.textContent = isEquipped ? '装備中' : '装備';
      btn.disabled = isEquipped;

      btn.onclick = (e) => {
        e.stopPropagation();
        state.equippedWeapon = w;
        playSound('btn');
        saveGame();
        renderEquipList();
        updateMenuUI();
      };

      if (w.image) {
        card.querySelector('.equip-img')?.addEventListener('click', (e) => {
          e.stopPropagation(); openImagePreview(w.image, w.name);
        });
      }
      card.appendChild(btn);
      list.appendChild(card);
    });
  } else if (tab === 'accessory') {
    ACCESSORIES.forEach(a => {
      if (!a.unlocked) return;
      const card = document.createElement('div');
      card.className = 'equip-card';
      const isEquipped = state.equippedAccessories.some(acc => acc && acc.id === a.id);
      const iconHTML = a.image ? `<img src="${a.image}" class="equip-img" alt="${a.name}">` : a.icon;
      
      card.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          <div class="equip-icon">${iconHTML}</div>
          <div>
            <div style="font-size:13px; font-weight:bold;">${a.name}</div>
            <div style="font-size:10px; color:#aaa;">攻撃力: +${a.atk}</div>
          </div>
        </div>
      `;
      const btn = document.createElement('button');
      btn.className = `equip-btn rpg-btn-sm ${isEquipped ? 'equipped' : ''}`;
      btn.textContent = isEquipped ? '装備中' : '装備';
      btn.disabled = isEquipped;

      btn.onclick = (e) => {
        e.stopPropagation();
        const emptyIdx = state.equippedAccessories.findIndex(acc => acc === null);
        if (emptyIdx !== -1) {
          state.equippedAccessories[emptyIdx] = a;
          playSound('btn');
          saveGame();
          renderEquipList();
          updateMenuUI();
        } else {
          alert('アクセサリ枠が満杯です！いずれかを外してください。');
        }
      };

      if (a.image) {
        card.querySelector('.equip-img')?.addEventListener('click', (e) => {
          e.stopPropagation(); openImagePreview(a.image, a.name);
        });
      }
      card.appendChild(btn);
      list.appendChild(card);
    });
  }
}

function unequipAccessory(slotIdx) {
  state.equippedAccessories[slotIdx] = null;
  playSound('close');
  saveGame();
  renderEquipList();
  updateMenuUI();
}

// --- 図鑑画面描画 ---
document.querySelectorAll('.zukan-tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    playSound('change');
    state.activeZukanTab = e.target.dataset.ztab;
    saveGame();
    renderZukan();
  });
});

function renderZukan() {
  const list = document.getElementById('zukan-list');
  if (!list) return;
  list.innerHTML = '';
  
  let tab = state.activeZukanTab || 'monster';
  if (!['monster', 'object', 'weapon', 'accessory', 'material'].includes(tab)) {
    tab = 'monster'; state.activeZukanTab = 'monster';
  }

  document.querySelectorAll('.zukan-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.ztab === tab);
  });

  if (tab === 'monster' || tab === 'object') {
    const targetType = (tab === 'monster') ? 'モンスター' : 'オブジェクト';
    AREAS.forEach(area => {
      area.targets.forEach(t => {
        if (t.type !== targetType) return;
        const card = document.createElement('div'); card.className = `zukan-card ${t.defeated ? '' : 'unknown'}`;
        if (t.defeated) {
          const iconHTML = t.image ? `<img src="${t.image}" class="zukan-img" alt="${t.name}">` : t.sprite;
          card.innerHTML = `<div class="zukan-icon">${iconHTML}</div><div class="zukan-info"><div class="zukan-title">${t.name}</div><div class="zukan-desc">${t.desc}</div><div class="zukan-sub">ドロップ: ${t.drop} | 所持金: +${t.gold}G</div></div>`;
          if (t.image) { card.querySelector('.zukan-img')?.addEventListener('click', (e) => { e.stopPropagation(); openImagePreview(t.image, t.name); }); }
        } else {
          card.innerHTML = `<div class="zukan-icon">❓</div><div class="zukan-info"><div class="zukan-title">未発見</div><div class="zukan-desc">？？？で遭遇すると解放されます。</div></div>`;
        }
        list.appendChild(card);
      });
    });
  } else if (tab === 'weapon') {
    WEAPONS.forEach(w => {
      const card = document.createElement('div'); card.className = `zukan-card ${w.unlocked ? '' : 'unknown'}`;
      if (w.unlocked) {
        const iconHTML = w.image ? `<img src="${w.image}" class="zukan-img" alt="${w.name}">` : w.icon;
        card.innerHTML = `<div class="zukan-icon">${iconHTML}</div><div class="zukan-info"><div class="zukan-title">${w.name} (ATK: ${w.atk})</div><div class="zukan-desc">${w.desc}</div></div>`;
        if (w.image) { card.querySelector('.zukan-img')?.addEventListener('click', (e) => { e.stopPropagation(); openImagePreview(w.image, w.name); }); }
      } else {
        card.innerHTML = `<div class="zukan-icon">❓</div><div class="zukan-info"><div class="zukan-title">未作成の武器</div><div class="zukan-desc">錬金に成功すると解放されます。</div></div>`;
      }
      list.appendChild(card);
    });
  } else if (tab === 'accessory') {
    ACCESSORIES.forEach(a => {
      const card = document.createElement('div'); card.className = `zukan-card ${a.unlocked ? '' : 'unknown'}`;
      if (a.unlocked) {
        const iconHTML = a.image ? `<img src="${a.image}" class="zukan-img" alt="${a.name}">` : a.icon;
        card.innerHTML = `<div class="zukan-icon">${iconHTML}</div><div class="zukan-info"><div class="zukan-title">${a.name} (ATK: +${a.atk})</div><div class="zukan-desc">${a.desc}</div></div>`;
        if (a.image) { card.querySelector('.zukan-img')?.addEventListener('click', (e) => { e.stopPropagation(); openImagePreview(a.image, a.name); }); }
      } else {
        card.innerHTML = `<div class="zukan-icon">❓</div><div class="zukan-info"><div class="zukan-title">未作成のアクセ</div><div class="zukan-desc">錬金に成功すると解放されます。</div></div>`;
      }
      list.appendChild(card);
    });
  } else if (tab === 'material') {
    renderMaterialZukanList(list);
  }
}

// --- アプデログ描画 ---
function renderChangelog() {
  const list = document.getElementById('changelog-list');
  if (!list) return;
  list.innerHTML = '';
  CHANGELOG.forEach(log => {
    const item = document.createElement('div');
    item.className = 'changelog-item';
    item.innerHTML = `
      <div class="changelog-version">${log.version} <small style="color:#aaa;">(${log.date})</small></div>
      <div>${log.detail}</div>
    `;
    list.appendChild(item);
  });
}