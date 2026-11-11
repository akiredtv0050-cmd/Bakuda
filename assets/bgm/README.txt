BGM（mp3）の置き場所です。
BGM は ファイルが大きいので、別の zip（…_音.zip）に 入っています。同じフォルダに 解凍してください。

  title_bgm.mp3   … タイトル・メニュー・図鑑
  craft_bgm.mp3   … 鍛冶屋
  ending.mp3      … エンディング（仮の曲）
  field_{テーマ}.mp3 … エリアの曲（plain＝草原、cave＝洞窟 は もとからの曲。ほかは 仮の曲）
     forest desert mountain crystal beach sea snow volcano sky sweets
     poison bigtree mushroom earth ghost machine space magic ruins demon

仮の曲は tools/gen_audio.py で 自動で作ったものです（ぜんぶ プログラムで 計算した音。借りものの素材は ありません）。
チームの曲ができたら、同じ名前で 上書きしてください。ツールは すでにある曲を 上書きしません。
無い曲があるときは、エリアは 草原の曲、エンディングは タイトルの曲が 流れます。
