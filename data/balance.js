/* ==========================================================
   balance.js  ―  数値バランス（自動計算の式）
   ----------------------------------------------------------
   データファイルで atk / hp / cost を空欄にした場合、ここの式で自動計算されます。
   データ側に数字を書けば、そちらが優先されます。
   ========================================================== */

const BALANCE = {
  /* 武器の攻撃力：段階(stage 1〜165)と種類の倍率から計算 */
  weaponAtk(stage, typeMul) {
    const s = stage - 1;
    return Math.max(1, Math.round(typeMul * (1 + s * 1.2 + Math.pow(s, 1.9) * 0.35)));
  },

  /* アクセサリーの攻撃力（アクセは1エリア1段階なので、エリアの強さに合わせて3倍の段階として計算） */
  accAtk(stage, typeMul) {
    const s = (stage - 1) * 3;
    return Math.max(1, Math.round(typeMul * (2 + s * 1.5 + Math.pow(s, 1.85) * 0.3)));
  },

  /* 鍛冶に必要な素材の個数 */
  craftMatCount(areaNo, slotInArea) {
    return 2 + slotInArea + Math.floor(areaNo / 4);
  },

  /* エリアに入れるタップレベル（エリア番号 1〜55）
     エリア1＝0、エリア2＝15、エリア3＝30 … エリア55＝810（15ずつ上がる） */
  areaLevelStep: 15,
  areaReqLevel(areaNo) {
    return (areaNo - 1) * this.areaLevelStep;
  },

  /* モンスター・オブジェクトのHP（エリア番号と、エリア内の並び順）
     「そのエリアに来たころの武器の攻撃力」×「たたく回数（6回＋並び順×2回）」
     → どのエリアでも、ちょうどよい武器なら 6〜16回くらいで倒せる */
  targetHp(areaNo, indexInArea) {
    const atk = this.weaponAtk((areaNo - 1) * 3 + 1, 1);
    return Math.max(5, Math.round(atk * (6 + indexInArea * 2)));
  },

  /* モンスターの制限時間（秒）。オブジェクトは 0（無制限） */
  monsterTime: 10,

  /* タップレベル：次のレベルまでのEXP */
  nextTapExp(level) {
    return Math.floor(10 + level * 3);      // Lv.1→13、Lv.100→310、Lv.500→1510
  },

  /* 倒したときのボーナスEXP（1タップ＝1EXP とは別に入る） */
  defeatExp(areaNo) {
    return 5 + areaNo * 5;
  },

  /* 1回倒したときにもらえる素材の数（最小〜最大） */
  dropMin: 1,
  dropMax: 2
};
