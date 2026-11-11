/* ==========================================================
   registry.js  ―  データの受け取り口（データベース）
   ----------------------------------------------------------
   data/ フォルダのファイルは、ここにある register◯◯() を呼ぶだけ。
   空欄の項目（画像パス・攻撃力・必要素材など）はここで自動で埋まります。

   ▼ 画像パスの自動ルール（image を書かなかったとき）
     武器   assets/images/weapon/{種類}/{種類}_{段階3桁}.png   例) weapon/ken/ken_016.png
     アクセ assets/images/acc/{種類}/{種類}_{段階3桁}.png      例) acc/ring/ring_001.png
     モンスター assets/images/monster/monster_{No3桁}.png
     オブジェクト assets/images/object/object_{No3桁}.png
     素材   assets/images/mat/mat_{No3桁}.png
   ▼ image に「ファイル名だけ」を書いた場合は、そのカテゴリのフォルダから探します
   ========================================================== */

const pad3 = (n) => String(n).padStart(3, '0');

const DB = {
  areas: [],          // [0]=エリア1 … [54]=エリア55
  regions: [],        // 地方（3エリアずつのまとまり）
  materials: [],      // 素材の一覧
  matById: {}, matByName: {},
  targets: [],        // モンスター＋オブジェクト
  targetById: {},
  lines: { weapon: {}, acc: {} },   // lines.weapon.ken = [165段階ぶん]
  itemById: {},
  warnings: [],       // データの書きまちがいなど（コンソールと画像チェッカーに表示）
  _raw: { areas: [], regions: [], materials: [], monsters: [], objects: [], weapon: {}, acc: {} },
  _finalized: false
};

/* ---------------- 受け取り口（data/*.js から呼ぶ） ---------------- */
function registerAreas(list)      { DB._raw.areas.push(...list); }
function registerRegions(list)    { DB._raw.regions.push(...list); }
function registerMaterials(list)  { DB._raw.materials.push(...list); }
function registerMonsters(list)   { DB._raw.monsters.push(...list); }
function registerObjects(list)    { DB._raw.objects.push(...list); }
function registerWeapons(typeId, list)     { (DB._raw.weapon[typeId] = DB._raw.weapon[typeId] || []).push(...list); }
function registerAccessories(typeId, list) { (DB._raw.acc[typeId] = DB._raw.acc[typeId] || []).push(...list); }

function warn(msg) { DB.warnings.push(msg); console.warn('[データ]', msg); }

/* 画像パスを決める */
function resolveImage(image, folder, autoName) {
  if (image === false || image === '') return null;
  if (!image) return `assets/images/${folder}/${autoName}.png`;
  if (image.includes('/')) return image;               // フルパス
  return `assets/images/${folder}/${image}`;            // ファイル名だけ
}

/* "ヒノキの木材×3, ヒノキのつる×2" や { ヒノキの木材: 3 } を [{id, n}] に変換 */
function parseCost(cost, where) {
  if (!cost) return null;
  let pairs = [];
  if (typeof cost === 'string') {
    cost.split(/[,、，\/\n]+/).map(s => s.trim()).filter(Boolean).forEach(part => {
      const m = part.match(/^(.+?)\s*[×xX\*✕]\s*(\d+)$/);
      if (m) pairs.push([m[1].trim(), Number(m[2])]);
      else pairs.push([part, 1]);
    });
  } else {
    pairs = Object.entries(cost);
  }
  const out = [];
  pairs.forEach(([name, n]) => {
    const mat = DB.matByName[name] || DB.matById[name];
    if (!mat) { warn(`${where}：素材「${name}」が素材データにありません`); return; }
    out.push({ id: mat.id, n: Number(n) || 1 });
  });
  return out;
}

/* ---------------- 組み立て（main.js から1回だけ呼ぶ） ---------------- */
DB.finalize = function () {
  if (DB._finalized) return;
  DB._finalized = true;

  /* --- エリア --- */
  const rawAreas = {};
  DB._raw.areas.forEach(a => { rawAreas[a.no] = a; });
  for (let no = 1; no <= GAME.AREA_COUNT; no++) {
    const r = rawAreas[no] || {};
    const theme = AREA_THEMES[r.theme] ? r.theme : 'grass';
    const th = AREA_THEMES[theme];
    DB.areas.push({
      no,
      name: r.name || `エリア${no}`,
      desc: r.desc || '',
      theme,
      reqLevel: r.level != null && r.level !== '' ? Number(r.level) : BALANCE.areaReqLevel(no),
      bg: r.bg || th.bg || `assets/images/bg/bg_${theme}.png`,
      bgm: r.bgm || th.bgm || `assets/bgm/field_${theme}.mp3`,
      mapImage: r.mapImage || null,        // 鍛冶マップの島イラスト（任意）
      targets: []
    });
  }
  /* --- 地方（エリアのまとまり）。データが無いエリアは3つずつ自動でまとめる --- */
  const used = new Set();
  DB._raw.regions.forEach((r, i) => {
    const areas = (r.areas || []).map(Number).filter(n => DB.areas[n - 1] && !used.has(n));
    if (!areas.length) { warn(`地方「${r.name}」にエリアがありません`); return; }
    areas.forEach(n => used.add(n));
    const first = DB.areas[areas[0] - 1];
    DB.regions.push({ no: r.no || i + 1, name: r.name || `${first.name}地方`, theme: AREA_THEMES[r.theme] ? r.theme : first.theme, desc: r.desc || '', areas });
  });
  let rest = DB.areas.map(a => a.no).filter(n => !used.has(n));
  while (rest.length) {
    const areas = rest.splice(0, 3), first = DB.areas[areas[0] - 1];
    DB.regions.push({ no: DB.regions.length + 1, name: `${first.name}地方`, theme: first.theme, desc: '', areas });
  }
  DB.regions.sort((a, b) => a.areas[0] - b.areas[0]);
  DB.regions.forEach(r => r.areas.forEach(n => { DB.areas[n - 1].region = r.no; }));

  const areaOf = (no, where) => {
    const a = DB.areas[(Number(no) || 1) - 1];
    if (!a) { warn(`${where}：エリア番号 ${no} がありません`); return DB.areas[0]; }
    return a;
  };

  /* --- 素材 --- */
  DB._raw.materials.forEach(r => {
    const id = r.id || `mat_${pad3(r.no)}`;
    if (DB.matById[id]) { warn(`素材 No.${r.no} が2回登録されています`); return; }
    const mat = {
      id, no: r.no, name: r.name, desc: r.desc || '',
      area: Number(r.area) || 1,
      icon: r.icon || '📦',
      image: resolveImage(r.image, 'mat', `mat_${pad3(r.no)}`),
      sources: []     // 落とすモンスター（あとで自動）
    };
    DB.materials.push(mat);
    DB.matById[id] = mat;
    DB.matByName[mat.name] = mat;
  });

  /* --- モンスター / オブジェクト --- */
  const addTargets = (list, kind) => {
    const prefix = kind === 'monster' ? 'mon' : 'obj';
    const folder = kind === 'monster' ? 'monster' : 'object';
    list.forEach(r => {
      const id = r.id || `${prefix}_${pad3(r.no)}`;
      const area = areaOf(r.area, `${kind} No.${r.no}`);
      const idxInArea = area.targets.filter(t => t.kind === kind).length;
      const drop = r.drop ? (DB.matByName[r.drop] || DB.matById[r.drop]) : null;
      if (r.drop && !drop) warn(`${r.name}：ドロップ素材「${r.drop}」が素材データにありません`);
      const t = {
        id, no: r.no, kind, name: r.name, desc: r.desc || '',
        area: area.no,
        sprite: r.sprite || (kind === 'monster' ? '👾' : '📦'),
        image: resolveImage(r.image, folder, `${folder}_${pad3(r.no)}`),
        hp: r.hp || BALANCE.targetHp(area.no, idxInArea),
        time: kind === 'monster' ? (r.time != null ? r.time : BALANCE.monsterTime) : 0,
        drop: drop ? drop.id : null,
        isBoss: !!r.boss || /のぬし/.test(r.desc || '')      // エリアの「ぬし」（desc に「◯◯のぬし」とあるか boss: true）
      };
      if (drop && !drop.sources.includes(t.id)) drop.sources.push(t.id);
      DB.targets.push(t);
      DB.targetById[id] = t;
      area.targets.push(t);
    });
  };
  addTargets(DB._raw.monsters, 'monster');
  addTargets(DB._raw.objects, 'object');

  /* --- 武器・アクセ（全165段階を必ず作る。データが無い段階は「準備中」） --- */
  const buildLine = (kind, type) => {
    const raw = {};
    (DB._raw[kind][type.id] || []).forEach(r => {
      if (raw[r.no]) warn(`${type.name} No.${r.no} が2回登録されています`);
      raw[r.no] = r;
    });
    const folder = kind === 'weapon' ? `weapon/${type.id}` : `acc/${type.id}`;
    const line = [];
    const per = GAME.perArea(kind), count = GAME.stageCount(kind);
    for (let stage = 1; stage <= count; stage++) {
      const r = raw[stage] || {};
      const areaNo = Number(r.area) || Math.ceil(stage / per);
      const slot = (stage - 1) % per;
      const id = `${type.id}_${pad3(stage)}`;
      const registered = !!r.name;
      const where = `${type.name} No.${stage}`;
      const item = {
        id, kind, type: type.id, typeName: type.name, stage, area: areaNo, slot,
        name: r.name || '？？？',
        desc: r.desc || '',
        registered,
        icon: r.icon || type.icon,
        image: resolveImage(r.image, folder, id),
        atk: r.atk != null && r.atk !== ''
          ? Number(r.atk)
          : (kind === 'weapon' ? BALANCE.weaponAtk(stage, type.atkMul) : BALANCE.accAtk(stage, type.atkMul)),
        costMats: parseCost(r.cost, where)       // null のときは下で自動
      };
      if (!item.costMats) item.costMats = autoCost(areaNo, slot);
      line.push(item);
      DB.itemById[id] = item;
    }
    Object.keys(raw).forEach(no => { if (no > count) warn(`${type.name}：段階 ${no} は上限 ${count} をこえています`); });
    DB.lines[kind][type.id] = line;
  };
  WEAPON_TYPES.forEach(t => buildLine('weapon', t));
  ACC_TYPES.forEach(t => buildLine('acc', t));

  Object.keys(DB._raw.weapon).forEach(k => { if (!WEAPON_TYPES.some(t => t.id === k)) warn(`武器の種類「${k}」が config.js の WEAPON_TYPES にありません`); });
  Object.keys(DB._raw.acc).forEach(k => { if (!ACC_TYPES.some(t => t.id === k)) warn(`アクセの種類「${k}」が config.js の ACC_TYPES にありません`); });
};

/* 必要素材を自動で決める：そのエリアで「手に入る」素材から選ぶ。無ければ空（＝まだ作れない） */
function autoCost(areaNo, slot) {
  const mats = DB.materials.filter(m => m.area === areaNo && m.sources.length > 0);
  if (!mats.length) return [];
  const n = BALANCE.craftMatCount(areaNo, slot);
  const out = [{ id: mats[slot % mats.length].id, n }];
  if (mats.length > 1) out.push({ id: mats[(slot + 1) % mats.length].id, n: Math.max(1, Math.floor(n / 2)) });
  return out;
}

/* ---------------- よく使う取り出し関数 ---------------- */
const Data = {
  typeList(kind) { return kind === 'weapon' ? WEAPON_TYPES : ACC_TYPES; },
  typeInfo(kind, typeId) { return this.typeList(kind).find(t => t.id === typeId); },
  line(kind, typeId) { return DB.lines[kind][typeId] || []; },
  item(id) { return DB.itemById[id] || null; },
  area(no) { return DB.areas[no - 1] || null; },
  region(no) { return DB.regions.find(r => r.no === no) || null; },
  regionOfArea(areaNo) { const a = this.area(areaNo); return a ? this.region(a.region) : null; },
  mat(id) { return DB.matById[id] || null; },
  target(id) { return DB.targetById[id] || null; },
  /* 登録済み（名前がある）数 */
  registeredCount(kind, typeId) { return this.line(kind, typeId).filter(i => i.registered).length; }
};
