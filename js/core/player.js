/* ==========================================================
   player.js  ―  プレイヤーのルール（持っているか・作れるか・攻撃力など）
   ========================================================== */

/* できばえの表（数字を変えれば 倍率を調整できます） */
const QUALITY = {
  normal: { name: 'ふつう', mult: 1,   mark: '' },
  good:   { name: '成功',   mult: 1.5, mark: '★' },
  great:  { name: '大成功', mult: 2,   mark: '★★' }
};

const Player = {
  progressOf(kind, typeId) { return (kind === 'weapon' ? S.forge : S.accForge)[typeId] || 0; },
  setProgress(kind, typeId, v) { (kind === 'weapon' ? S.forge : S.accForge)[typeId] = v; },

  /* そのアイテムを作ったことがあるか */
  owns(id) {
    const it = Data.item(id);
    return !!it && this.progressOf(it.kind, it.type) >= it.stage;
  },
  areaUnlocked(no) {
    const a = Data.area(no);
    return !!a && S.tapLevel >= a.reqLevel;
  },
  /* 地方が見えているか：地方の最初のエリアに行けるようになったら、その地方のエリア名が全部見える */
  regionRevealed(regionNo) {
    const r = Data.region(regionNo);
    return !!r && this.areaUnlocked(r.areas[0]);
  },
  areaNameVisible(areaNo) {
    const a = Data.area(areaNo);
    return !!a && this.regionRevealed(a.region);
  },

  /* 鍛冶の状態：done(作成済) / next(次に作る) / locked(先の段階) */
  nodeState(item) {
    const p = this.progressOf(item.kind, item.type);
    if (item.stage <= p) return 'done';
    if (item.stage === p + 1) return 'next';
    return 'locked';
  },
  /* 作れない理由（作れるときは null） */
  craftBlock(item) {
    const st = this.nodeState(item);
    if (st === 'done') return 'もう作ったよ';
    if (st === 'locked') return 'ひとつ前の段階を先に作ろう';
    if (!item.registered && !GAME.ALLOW_PLACEHOLDER_CRAFT) return 'じゅんび中（まだデータがありません）';
    if (!this.areaUnlocked(item.area)) return `タップLv.${Data.area(item.area).reqLevel} で解放`;
    if (!item.costMats.length) return 'ひつような そざい が まだ決まっていません';
    for (const c of item.costMats) if ((S.materials[c.id] || 0) < c.n) return '素材が足りない';
    return null;
  },
  /* grade：鍛冶ミニゲームのけっか（'fail' / 'good' / 'great' / 'skip'） */
  craft(item, grade) {
    if (this.craftBlock(item)) return false;
    item.costMats.forEach(c => { S.materials[c.id] -= c.n; });
    this.setProgress(item.kind, item.type, item.stage);
    S.stats.crafts++;
    if (grade && grade !== 'skip') S.stats.mgPlays++;
    if (grade === 'good' || grade === 'great') { S.quality[item.id] = grade; S.stats[grade + 's']++; }
    else delete S.quality[item.id];
    this.markSeen(item.id);
    // 作ったら自動で装備（武器は攻撃力が上がるときだけ）
    if (item.kind === 'weapon') {
      const cur = Data.item(S.equip.weapon);
      if (!cur || this.atkOf(item) >= this.atkOf(cur)) S.equip.weapon = item.id;
    } else {
      const empty = S.equip.acc.indexOf(null);
      if (empty !== -1) S.equip.acc[empty] = item.id;
    }
    Save.write();
    return true;
  },

  /* ---------- 打ち込みやり直し（作ったアイテムを、同じ素材で もういちど きたえる） ---------- */
  /* できるか：作ってある ＆ まだ大成功じゃない ＆ 同じ素材が そろっている */
  canReforge(item) {
    if (!item || !item.registered || !this.owns(item.id) || this.quality(item.id) === 'great') return false;
    if (!item.costMats.length) return false;
    return item.costMats.every(c => (S.materials[c.id] || 0) >= c.n);
  },
  /* grade：ミニゲームのけっか。いまより よいときだけ できばえが 上がる（下がることは ない）
     もどり値 { improved: 上がったか, before: まえの できばえ } */
  reforge(item, grade) {
    if (!this.canReforge(item)) return null;
    item.costMats.forEach(c => { S.materials[c.id] -= c.n; });
    S.stats.reforges = (S.stats.reforges || 0) + 1;
    S.stats.mgPlays++;
    const before = this.quality(item.id);
    const RANK = { normal: 0, fail: 0, skip: 0, good: 1, great: 2 };
    const improved = RANK[grade] > RANK[before];
    if (grade === 'good' || grade === 'great') S.stats[grade + 's']++;
    if (improved) {
      S.quality[item.id] = grade;
      // 武器なら、いまの武器より強くなったら 自動で持ちかえる
      if (item.kind === 'weapon') { const cur = Data.item(S.equip.weapon); if (!cur || this.atkOf(item) > this.atkOf(cur)) S.equip.weapon = item.id; }
    }
    Save.write();
    return { improved, before };
  },

  weapon() { return Data.item(S.equip.weapon) || Data.item('stick_001'); },
  /* できばえ（ミニゲームのけっか）：ふつう ×1 / 成功 ×1.5 / 大成功 ×2 */
  quality(id) { return S.quality[id] || 'normal'; },
  mult(id) { return QUALITY[this.quality(id)].mult; },
  atkOf(item) { return item ? Math.round(item.atk * this.mult(item.id)) : 0; },
  /* 名前の横につける しるし（★＝成功 / ★★＝大成功） */
  qMark(id) { const q = QUALITY[this.quality(id)]; return q.mark ? `<span class="q-mark q-${this.quality(id)}">${q.mark}</span>` : ''; },
  totalAtk() {
    let atk = this.atkOf(this.weapon());
    S.equip.acc.forEach(id => { const a = Data.item(id); if (a) atk += this.atkOf(a); });
    return atk;
  },
  nextExp() { return BALANCE.nextTapExp(S.tapLevel); },
  /* EXPを足す。レベルが上がったら上がった数を返す */
  addExp(n) {
    S.tapExp += n;
    let up = 0;
    while (S.tapExp >= this.nextExp()) { S.tapExp -= this.nextExp(); S.tapLevel++; up++; }
    return up;
  },
  addMat(id, n) { S.materials[id] = (S.materials[id] || 0) + n; this.markSeen(id); },

  /* 図鑑用：見つけた記録 */
  markSeen(id) {
    const r = S.seen[id];
    if (r) r.n++;
    else S.seen[id] = { n: 1, isNew: true };
  },
  seen(id) { return !!S.seen[id]; },
  isNew(id) { return !!(S.seen[id] && S.seen[id].isNew); }
};
