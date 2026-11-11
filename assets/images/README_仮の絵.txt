このフォルダの「仮の絵」について
=================================

次の画像は、名前とエリアから 形と色を よそうして 自動で作った「仮の絵」です。
チームの絵ができたら、同じ名前で 上書きしてください（ツールは 上書きしません）。

  weapon/  acc/       … tools/gen_item_images.py   （プログラムで ドット絵を 描いています）
  monster/ object/ mat/ … tools/gen_target_images.py （絵文字を ドット絵に ぬりなおしたもの＋スライム・ゴーレムは 一から描画）
  bg/bg_{テーマ}.png  … tools/gen_bg_images.py     （空・山・地面を 描いて、絵文字の小物を おいたもの）
  ※ もとからあった絵（stick_001.png、target_slime1.png、bg_plain.png など）は そのままです

■ ライセンス
  monster / object / mat / bg の仮の絵には、Google の「Noto Color Emoji」の絵文字の形を使っています。
  Noto Color Emoji は Apache License 2.0 で公開されていて、加工・ゲームでの利用・配布ができます。
  ゲームを公開するときは、エンディングのスタッフロール（data/story.js の ENDING_CREDITS）にある
  「仮の絵の もと Noto Color Emoji（Google／Apache License 2.0）」の行を 残してください。
  https://github.com/googlefonts/noto-emoji

■ 作りなおすとき（Python 3 ＋ Pillow ＋ numpy）
  python tools/gen_item_images.py   tools/items.json     … 武器・アクセ（足りない番号だけ）
  python tools/gen_target_images.py tools/targets.json   … モンスター・オブジェクト・素材
  python tools/gen_bg_images.py                          … エリアの背景
  ・--force をつけると 全部 作りなおします（チームの絵も 上書きされるので注意！）
  ・items.json / targets.json は、データ（data/*.js）を変えたら 作りなおしてください
    （tools/asset_checker.html を開くと、作りなおし用の 一覧を 保存できます）
