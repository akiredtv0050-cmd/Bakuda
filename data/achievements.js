/* ==========================================================
   achievements.js  ―  実績（メインメニュー →「🏆 じっせき」）
   ----------------------------------------------------------
   id     : ほかと重ならない英数字（セーブに使うので、あとから変えない）
   name   : 実績の名前   desc : 達成する方法
   tier   : copper（銅）/ silver（銀）/ gold（金）… トロフィーの画像
   cat    : 分類（画面のタブ）
   stat   : 何を数えるか（下の ACHV_STATS の名前）   goal : いくつで達成か
   hidden : true なら 達成するまで ？？？ で かくす
   ========================================================== */

/* 数えるもの（S はセーブデータ） */
const ACHV_STATS = {
  monsterKills: () => S.kills.monster,
  objectKills:  () => S.kills.object,
  taps:         () => S.stats.taps,
  crits:        () => S.stats.crits,
  level:        () => S.tapLevel,
  crafts:       () => S.stats.crafts,
  goods:        () => S.stats.goods + S.stats.greats,   // 成功以上
  greats:       () => S.stats.greats,                   // 大成功
  mgKinds:      () => Object.keys(S.mgSeen).length,     // あそんだミニゲームの種類
  bossKills:    () => DB.targets.filter(t => t.isBoss && Player.seen(t.id)).length,
  topArea:      () => DB.areas.filter(a => Player.areaUnlocked(a.no)).length,
  weaponTypes:  () => WEAPON_TYPES.filter(t => Player.progressOf('weapon', t.id) > 0).length,
  bestWeapon:   () => Math.max(...WEAPON_TYPES.map(t => Player.progressOf('weapon', t.id))),
  maxWeapons:   () => WEAPON_TYPES.filter(t => Player.progressOf('weapon', t.id) >= GAME.STAGE_COUNT).length,
  accTotal:     () => ACC_TYPES.reduce((n, t) => n + Player.progressOf('acc', t.id), 0),
  accEquipped:  () => S.equip.acc.filter(Boolean).length,
  bestAcc:      () => Math.max(...ACC_TYPES.map(t => Player.progressOf('acc', t.id))),
  zukanMonster: () => DB.targets.filter(t => t.kind === 'monster' && Player.seen(t.id)).length,
  zukanObject:  () => DB.targets.filter(t => t.kind === 'object' && Player.seen(t.id)).length,
  zukanMat:     () => DB.materials.filter(m => Player.seen(m.id)).length,
  cleared:      () => S.cleared ? 1 : 0,
  codes:        () => S.usedCodes.length
};

const ACHIEVEMENTS = [
  // ---- ぼうけん ----
  { id: 'kill1',    cat: 'ぼうけん', tier: 'copper', name: 'はじめての いちげき', desc: 'モンスターを 1体 たおす', stat: 'monsterKills', goal: 1 },
  { id: 'kill100',  cat: 'ぼうけん', tier: 'copper', name: 'モンスターハンター',  desc: 'モンスターを 100体 たおす', stat: 'monsterKills', goal: 100 },
  { id: 'kill1000', cat: 'ぼうけん', tier: 'silver', name: 'いくさの たつじん',    desc: 'モンスターを 1,000体 たおす', stat: 'monsterKills', goal: 1000 },
  { id: 'kill5000', cat: 'ぼうけん', tier: 'gold',   name: 'でんせつの せんし',    desc: 'モンスターを 5,000体 たおす', stat: 'monsterKills', goal: 5000 },
  { id: 'obj1',     cat: 'ぼうけん', tier: 'copper', name: 'こわしや みならい',    desc: 'オブジェクトを 1こ こわす', stat: 'objectKills', goal: 1 },
  { id: 'obj100',   cat: 'ぼうけん', tier: 'copper', name: 'こわしや',            desc: 'オブジェクトを 100こ こわす', stat: 'objectKills', goal: 100 },
  { id: 'obj1000',  cat: 'ぼうけん', tier: 'silver', name: 'はかいおう',          desc: 'オブジェクトを 1,000こ こわす', stat: 'objectKills', goal: 1000 },
  // ---- ぬし ----
  { id: 'boss1',    cat: 'ぬし', tier: 'copper', name: 'ぬし たいじ',         desc: 'エリアの「ぬし」を 1体 たおす', stat: 'bossKills', goal: 1 },
  { id: 'boss18',   cat: 'ぬし', tier: 'silver', name: 'ぬしハンター',        desc: 'ぬしを 18体 たおす', stat: 'bossKills', goal: 18 },
  { id: 'boss55',   cat: 'ぬし', tier: 'gold',   name: 'ぬし コンプリート',    desc: '55体の ぬしを ぜんぶ たおす', stat: 'bossKills', goal: 55 },
  // ---- れんだ ----
  { id: 'tap1000',  cat: 'れんだ', tier: 'copper', name: 'れんだ みならい',   desc: '1,000回 たたく', stat: 'taps', goal: 1000 },
  { id: 'tap10000', cat: 'れんだ', tier: 'silver', name: 'れんだ めいじん',   desc: '10,000回 たたく', stat: 'taps', goal: 10000 },
  { id: 'tap50000', cat: 'れんだ', tier: 'gold',   name: 'ゴッドハンド',      desc: '50,000回 たたく', stat: 'taps', goal: 50000 },
  { id: 'crit100',  cat: 'れんだ', tier: 'silver', name: 'かいしんの いちげき', desc: 'かいしんを 100回 だす', stat: 'crits', goal: 100, hidden: true },
  // ---- レベル ----
  { id: 'lv15',     cat: 'レベル', tier: 'copper', name: 'はじめの いっぽ',   desc: 'タップLv.15 になる', stat: 'level', goal: 15 },
  { id: 'lv100',    cat: 'レベル', tier: 'copper', name: 'いちにんまえ',      desc: 'タップLv.100 になる', stat: 'level', goal: 100 },
  { id: 'lv300',    cat: 'レベル', tier: 'silver', name: 'ベテラン',          desc: 'タップLv.300 になる', stat: 'level', goal: 300 },
  { id: 'lv810',    cat: 'レベル', tier: 'gold',   name: 'さいきょうの うで',  desc: 'タップLv.810 になる', stat: 'level', goal: 810 },
  // ---- たび ----
  { id: 'area4',    cat: 'たび', tier: 'copper', name: 'さばくへ',          desc: '砂漠の地方に 行けるように なる', stat: 'topArea', goal: 4 },
  { id: 'area16',   cat: 'たび', tier: 'silver', name: 'ほのおの むこうへ', desc: '火山の地方に 行けるように なる', stat: 'topArea', goal: 16 },
  { id: 'area34',   cat: 'たび', tier: 'silver', name: 'ちのそこへ',        desc: '大地の裂け目に 行けるように なる', stat: 'topArea', goal: 34 },
  { id: 'area52',   cat: 'たび', tier: 'gold',   name: 'まおうじょう とうちゃく', desc: '魔王城に 行けるように なる', stat: 'topArea', goal: 52 },
  // ---- かじ ----
  { id: 'craft1',   cat: 'かじ', tier: 'copper', name: 'はじめての かじ',    desc: 'ぶきか アクセを 1回 きたえる', stat: 'crafts', goal: 1 },
  { id: 'craft50',  cat: 'かじ', tier: 'copper', name: 'かじや みならい',    desc: '50回 きたえる', stat: 'crafts', goal: 50 },
  { id: 'craft300', cat: 'かじ', tier: 'silver', name: 'かじや',            desc: '300回 きたえる', stat: 'crafts', goal: 300 },
  { id: 'craft1000',cat: 'かじ', tier: 'gold',   name: 'めいこう',          desc: '1,000回 きたえる', stat: 'crafts', goal: 1000 },
  { id: 'good1',    cat: 'かじ', tier: 'copper', name: 'いい うでまえ',      desc: 'かじの ミニゲームで はじめて 成功する', stat: 'goods', goal: 1 },
  { id: 'great1',   cat: 'かじ', tier: 'silver', name: 'かんぺきな 一打',    desc: 'かじの ミニゲームで はじめて 大成功する', stat: 'greats', goal: 1 },
  { id: 'great30',  cat: 'かじ', tier: 'silver', name: 'たくみの わざ',      desc: '大成功を 30回 だす', stat: 'greats', goal: 30 },
  { id: 'great200', cat: 'かじ', tier: 'gold',   name: 'でんせつの かじや',  desc: '大成功を 200回 だす', stat: 'greats', goal: 200, hidden: true },
  { id: 'mgall',    cat: 'かじ', tier: 'silver', name: 'なんでも こなす',    desc: 'かじの ミニゲームを 8しゅるい ぜんぶ あそぶ', stat: 'mgKinds', goal: 8 },
  { id: 'wtype10',  cat: 'かじ', tier: 'silver', name: 'ぶきの コレクター',  desc: '10しゅるい ぜんぶの ぶきを 1つ以上 つくる', stat: 'weaponTypes', goal: 10 },
  { id: 'wmax1',    cat: 'かじ', tier: 'gold',   name: 'ゆうしゃの ぶき',    desc: 'どれか1しゅるいの ぶきを 165だんかいまで きたえる', stat: 'bestWeapon', goal: 165 },
  { id: 'wmax10',   cat: 'かじ', tier: 'gold',   name: 'かじの かみさま',    desc: '10しゅるい ぜんぶを 165だんかいまで きたえる', stat: 'maxWeapons', goal: 10, hidden: true },
  // ---- アクセ ----
  { id: 'acc1',     cat: 'アクセ', tier: 'copper', name: 'おしゃれ はじめ',  desc: 'アクセを 1つ つくる', stat: 'accTotal', goal: 1 },
  { id: 'acc3eq',   cat: 'アクセ', tier: 'copper', name: 'フルそうび',      desc: 'アクセを 3つ そうびする', stat: 'accEquipped', goal: 3 },
  { id: 'acc100',   cat: 'アクセ', tier: 'silver', name: 'アクセ コレクター', desc: 'アクセを ぜんぶで 100こ つくる', stat: 'accTotal', goal: 100 },
  { id: 'accmax',   cat: 'アクセ', tier: 'gold',   name: 'ほうせきの おう',  desc: 'どれか1しゅるいの アクセを 55だんかいまで つくる', stat: 'bestAcc', goal: 55 },
  // ---- ずかん ----
  { id: 'zm50',     cat: 'ずかん', tier: 'copper', name: 'モンスター はかせ', desc: 'モンスターずかんに 50体 のせる', stat: 'zukanMonster', goal: 50 },
  { id: 'zm275',    cat: 'ずかん', tier: 'gold',   name: 'モンスター だいはかせ', desc: 'モンスターずかんを コンプリート', stat: 'zukanMonster', goal: 275 },
  { id: 'zo275',    cat: 'ずかん', tier: 'gold',   name: 'ものしり はかせ',  desc: 'オブジェずかんを コンプリート', stat: 'zukanObject', goal: 275 },
  { id: 'zt100',    cat: 'ずかん', tier: 'copper', name: 'そざい あつめ',    desc: 'そざいを 100しゅるい みつける', stat: 'zukanMat', goal: 100 },
  { id: 'zt275',    cat: 'ずかん', tier: 'gold',   name: 'そざい マスター',  desc: 'そざいを 275しゅるい ぜんぶ みつける', stat: 'zukanMat', goal: 275 },
  // ---- クリア ----
  { id: 'clear',    cat: 'クリア', tier: 'gold',   name: 'せかいを すくった かじや', desc: 'まおうゼノグリムを たおす', stat: 'cleared', goal: 1 },
  // ---- ひみつ ----
  { id: 'code1',    cat: 'ひみつ', tier: 'copper', name: 'ひみつの ことば',  desc: 'かくしコマンドを つかう', stat: 'codes', goal: 1, hidden: true }
];
