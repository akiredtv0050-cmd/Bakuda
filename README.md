# 爆打錬成！武器鍛冶クラフター（v1.0.0）

連打で素材を集めて、武器10種（各165段階）・アクセ5種（各55段階）を鍛えるWebゲームです。
前作「爆釣一閃！おさかな一本勝負」と同じく、**index.html をダブルクリックするだけ**で遊べます（インストール不要）。

---

## 📁 フォルダ構成

```
爆打錬成！武器鍛冶クラフター/
├─ index.html            … ゲーム本体（画面の部品）
├─ manifest.json / sw.js … スマホの「ホーム画面に追加」用（PWA）
├─ README.md             … このファイル
│
├─ css/                  … 見た目
│   ├─ base.css          … 色・文字・ボタン・ウィンドウ（色を変えるならここの :root）
│   ├─ screens.css       … タイトル・メニュー・ぼうけん・ポップアップ
│   ├─ forge.css         … 鍛冶屋（ワールドマップ）
│   ├─ zukan.css         … 図鑑
│   ├─ story.css         … ストーリー・実績・エンディング
│   └─ minigame.css      … 武器をふる演出・ハンマー演出・ミニゲーム
│
├─ js/                   … しくみ（プログラム）
│   ├─ core/config.js    … ★設定：バージョン・武器/アクセの種類・エリアのテーマ・マップの形
│   ├─ core/registry.js  … データの受け取り口（画像パス・攻撃力などを自動で埋める）
│   ├─ core/save.js      … セーブデータ
│   ├─ core/player.js    … ルール（作れるか・攻撃力の合計など）
│   ├─ core/audio.js     … BGM・効果音
│   ├─ core/ui.js        … 画面切りかえ・ポップアップ・確認ダイアログ
│   ├─ screens/          … メニュー・ぼうけん・そうび・設定・ストーリー・実績・エンディング
│   ├─ forge/mapView.js  … Googleマップ風の「ドラッグ＆ズーム」エンジン
│   ├─ forge/forge.js    … 鍛冶屋の画面（ハンマー演出・「完成！」）
│   ├─ forge/minigames.js … 鍛冶のミニゲーム8種（成功×1.5・大成功×2）
│   ├─ zukan/zukan.js    … 図鑑
│   └─ main.js           … 起動
│
├─ data/                 … ★中身（チームで一番さわる場所）
│   ├─ balance.js        … 数値バランスの式（攻撃力・HP・値段など）
│   ├─ areas.js          … エリア55か所
│   ├─ regions.js        … 地方（3エリアずつのまとまり。エリア移動と名前の公開に使う）
│   ├─ materials.js      … 素材
│   ├─ monsters.js       … モンスター
│   ├─ objects.js        … オブジェクト
│   ├─ weapons/          … 武器：1種類＝1ファイル（stick.js, ken.js …）各165段階
│   ├─ accessories/      … アクセ：1種類＝1ファイル（ring.js …）各55段階（1エリアに1つ）
│   ├─ changelog.js      … 設定画面の「アプデじょうほう」
│   ├─ secret_codes.js   … 隠しコマンド
│   ├─ story.js          … ストーリー（全41シーン）・エンディングのスタッフロール
│   └─ achievements.js   … 実績
│
├─ assets/               … 画像と音
│   ├─ images/weapon/{種類}/{種類}_001.png 〜 _165.png
│   ├─ images/acc/{種類}/{種類}_001.png 〜 _055.png
│   ├─ images/monster/ object/ mat/ bg/ ui/ icon/ trophy/ area/ effects/
│   ├─ bgm/              … BGM（mp3）
│   └─ se/               … 効果音（mp3）※無ければ電子音で代用
│
├─ tools/                … チーム用の便利ツール（ダブルクリックで開く）
│   ├─ csv_converter.html … スプレッドシート → data ファイルに変換
│   ├─ asset_checker.html … 足りない画像・音、大きすぎる画像を一覧表示（仮の絵ツール用の一覧も保存）
│   ├─ gen_item_images.py   … 武器・アクセの 仮の絵を 自動で作る
│   ├─ gen_target_images.py … モンスター・オブジェクト・素材の 仮の絵を 自動で作る
│   ├─ gen_bg_images.py     … エリア背景の 仮の絵を 自動で作る
│   └─ gen_audio.py         … 効果音・BGM の 仮の音を 自動で作る
│
└─ docs/                 … 説明書
    ├─ データの追加ガイド.md
    ├─ 背景画像の追加ガイド.md
    ├─ 画像と音の命名ルール.md
    └─ 必要なファイル一覧.md
```

## 🛠 よくある作業 → さわるファイル

| やりたいこと | さわるところ |
|---|---|
| 武器の名前・説明を増やす | スプレッドシート → `tools/csv_converter.html` → `data/weapons/` に上書き |
| 武器の画像を足す | `assets/images/weapon/ken/ken_016.png` のように **番号の名前で置くだけ** |
| モンスターを増やす | `data/monsters.js` に1行（画像は `assets/images/monster/`） |
| 武器の種類を増やす | `js/core/config.js` の `WEAPON_TYPES` に1行 ＋ `data/weapons/{id}.js` を作る |
| 強さ・レベルの調整 | `data/balance.js`（エリアのレベル間隔は `areaLevelStep`） |
| 色やボタンの見た目 | `css/base.css` の `:root` |
| バージョンを上げる | `js/core/config.js` の `version` と `sw.js` の `CACHE_NAME` と `data/changelog.js` |
| 地方のまとめ方・名前 | `data/regions.js` |
| ストーリー・スタッフロール | `data/story.js` |
| 足りない音を 仮の音で うめる | `tools/gen_audio.py` |
| 足りない絵を 仮の絵で うめる | `tools/gen_*.py`（`docs/データの追加ガイド.md` 12.9） |
| 背景画像を足す | `assets/images/bg/bg_{テーマ}.png` を置くだけ（`docs/背景画像の追加ガイド.md`） |
| 実績 | `data/achievements.js` |
| 鍛冶マップの形（ランダムのON/OFF） | `js/core/config.js` の `FORGE_LAYOUT.randomShape` |
| 鍛冶ミニゲームの追加・むずかしさ | `js/forge/minigames.js`（倍率は `js/core/player.js` の `QUALITY`） |
| たたいたときの武器のふりかた | `js/screens/adventure.js` の `SWING_STYLE` |

レベルの上がり方は **`docs/レベルの上がり方.md`**。モンスター・素材・武器などの追加方法は **`docs/データの追加ガイド.md`（くわしく版）** を見てください。

## 🧪 テストのコツ
- `GAME.ALLOW_PLACEHOLDER_CRAFT = true` にすると、名前が未定の段階も作れます（マップの奥まで試したいとき）。
- 画像が無い所は絵文字で代わりに表示されるので、絵がそろう前でも遊べます。
