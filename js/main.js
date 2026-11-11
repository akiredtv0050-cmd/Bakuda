/* ==========================================================
   main.js  ―  起動（いちばん最後に読み込まれる）
   ========================================================== */
window.addEventListener('DOMContentLoaded', () => {
  DB.finalize();            // データを組み立てる
  Save.load();              // セーブを読み込む
  Audio2.init();

  Menu.init();
  Adventure.init();
  Settings.init();
  MG.init();
  Forge.init();
  Zukan.init();
  Story.init();
  Ending.init();
  Achv.check(true);           // これまでの記録で達成しているものを記録（お知らせはしない）
  Achv.updateBadge();
  Settings.refresh();
  $$('.chip-row').forEach(r => UI.slider(r));   // 種類チップを横にスライドできるように

  // プレイ時間（タイトル画面以外で数える）＋ 定期セーブ
  setInterval(() => {
    if (UI.current === 'title') return;
    S.playSec++;
    if (UI.current === 'menu') Menu.updateTime();
    if (S.playSec % 5 === 0) Save.write();
  }, 1000);
  window.addEventListener('pagehide', () => Save.write());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Save.write(); Audio2.stopBgm(); }
    else if (UI.current !== 'title') Audio2.playBgm(Audio2.current);
  });

  // PC用キー操作：Esc で戻る
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const open = $$('.modal.open');
    if (open.length) {
      const top = open[open.length - 1];
      if (top.id === 'mg-layer') return;                                   // ミニゲーム中は Esc で 閉じない
      if (top.id === 'craft-result-modal' && top.querySelector('.forging')) return;
      if (top.id !== 'dialog-modal') UI.close(top.id); return;
    }
    if (UI.current === 'zukan') Zukan.close();
    else if (UI.current === 'adventure' || UI.current === 'forge') { Adventure.stopTimer(); Menu.show(); }
  });

  if (DB.warnings.length) console.info(`データの注意 ${DB.warnings.length} 件（tools/asset_checker.html で一覧できます）`);
});

/* PWA（ホーム画面に追加）用。file:// で開いたときは何もしない */
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => { }));
}
