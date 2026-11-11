# -*- coding: utf-8 -*-
"""
gen_item_images.py ― 武器・アクセの「仮の絵」を自動で作るツール
=================================================================
・名前とエリア（テーマ）から 色と形を よそうして、ドット絵風の PNG を作ります。
・すでに画像が ある番号は 上書きしません（チームが描いた絵を 守るため）。
    → 全部 作りなおしたいときは  --force
・つかいかた（Python 3 と Pillow が必要： pip install pillow）
    1) ゲームを開いて items.json を作る … tools/asset_checker.html の「📄 アイテム一覧を保存」
       （または このフォルダの items.json をそのまま使う）
    2) python tools/gen_item_images.py tools/items.json
・できる画像： 224×224（56ドット×4倍）の とうめいPNG
"""
import json, sys, os, math, random, hashlib
from PIL import Image, ImageDraw, ImageFilter

G = 56          # ドットの数（たて・よこ）
SS = 8          # 下書きの倍率（なめらかに描いてから ドットに縮める）
OUT_SCALE = 4   # 仕上がりの倍率
S = G * SS      # 下書きの大きさ

# ---------------------------------------------------------------
#  色（素材パレット）： [こい影, 影, ふつう, 明るい, ハイライト]
# ---------------------------------------------------------------
def hx(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def ramp(*hs): return [hx(h) for h in hs]

MAT = {
    'wood':     ramp('#4a2a14', '#6e4220', '#9a6232', '#c48a4e', '#e6b47a'),
    'darkwood': ramp('#2c1a10', '#46281a', '#634030', '#86604a', '#a8826a'),
    'leaf':     ramp('#1f4a1c', '#2f6e2a', '#4e9a3a', '#7cc458', '#b4e88a'),
    'stone':    ramp('#3a3a40', '#56565e', '#7a7a82', '#a2a2aa', '#cfcfd6'),
    'sand':     ramp('#6a4a20', '#946a30', '#c49a4a', '#e2c070', '#f6e2a8'),
    'bone':     ramp('#6a5e48', '#988a6a', '#c6b892', '#e4dabc', '#fff8e6'),
    'bronze':   ramp('#4a2a10', '#7a4a1c', '#a8692e', '#d0904a', '#f0c080'),
    'iron':     ramp('#2e3238', '#4a5058', '#6e7680', '#9aa2ac', '#d0d6de'),
    'steel':    ramp('#30404e', '#4e6476', '#7890a4', '#a8c0d2', '#e2f0fa'),
    'silver':   ramp('#4a4e5a', '#7a8090', '#a8b0c0', '#d0d8e6', '#ffffff'),
    'gold':     ramp('#6a4200', '#a06a08', '#d49a1a', '#f6c840', '#fff2a0'),
    'crystal':  ramp('#1e5a7a', '#2e86aa', '#5ab8dc', '#9ae2f6', '#ecffff'),
    'diamond':  ramp('#5a6a8a', '#8aa2c6', '#bcd6f2', '#e2f2ff', '#ffffff'),
    'coral':    ramp('#7a2a3a', '#b0404e', '#e06a6a', '#f6a09a', '#ffd8d0'),
    'water':    ramp('#123a7a', '#1e5ab0', '#3a86d8', '#6ab8f2', '#c2ecff'),
    'ice':      ramp('#3a6a9a', '#5a96c6', '#8ac2e6', '#bce4fa', '#f2fcff'),
    'fire':     ramp('#6a1206', '#a8260a', '#e04a12', '#f68a2a', '#ffd26a'),
    'magma':    ramp('#2a0a0a', '#5a1410', '#a82a10', '#f0601a', '#ffc040'),
    'obsidian': ramp('#0e0a14', '#1e1828', '#34283e', '#544462', '#8a76a0'),
    'thunder':  ramp('#6a5a00', '#a89000', '#e6cc10', '#fff04a', '#ffffc0'),
    'sky':      ramp('#4a7aa8', '#7aaad6', '#aad2f2', '#d6ecff', '#ffffff'),
    'candy':    ramp('#8a2a5a', '#c04a86', '#ec7ab0', '#ffaed2', '#ffe2f0'),
    'honey':    ramp('#6a3a00', '#a86200', '#e09410', '#f6c040', '#ffe89a'),
    'poison':   ramp('#2a1240', '#4a2070', '#7a3aa8', '#a86ad0', '#d8b0f2'),
    'toxic':    ramp('#1e3a10', '#386a14', '#5ea420', '#94d43a', '#d2f68a'),
    'mush':     ramp('#6a1a1a', '#a02a2a', '#d84a4a', '#f08080', '#ffd0d0'),
    'glow':     ramp('#1a5a4a', '#2a8a6a', '#4ac89a', '#8af2c8', '#e0fff0'),
    'dream':    ramp('#5a2a7a', '#8a4ab0', '#c07ae0', '#e8acf6', '#fbe0ff'),
    'earth':    ramp('#3a2414', '#5e3a1e', '#8a5a30', '#b4844a', '#dcb27a'),
    'amber':    ramp('#5a2a00', '#8a4a06', '#c47a10', '#eaa830', '#ffd880'),
    'ghost':    ramp('#2a2c4a', '#464a78', '#7078aa', '#a2aad6', '#e2e6ff'),
    'shadow':   ramp('#0a0a12', '#181826', '#2a2a40', '#44446a', '#6e6ea0'),
    'brass':    ramp('#4a3008', '#7a5414', '#b08428', '#dab450', '#f6e09a'),
    'neon':     ramp('#0a3a4a', '#105e74', '#1aa0c0', '#4ae0f6', '#c8ffff'),
    'space':    ramp('#0a0a2a', '#1a1a4a', '#2e2e78', '#5a5ab0', '#a8a8f0'),
    'void':     ramp('#06020e', '#140a26', '#2a1448', '#4a2a7a', '#8a5ac0'),
    'magic':    ramp('#3a145a', '#5e2a8a', '#8a4ac0', '#b67ee6', '#e8c8ff'),
    'holy':     ramp('#8a6a20', '#c4a040', '#f0d070', '#fff0b0', '#ffffff'),
    'demon':    ramp('#1a0408', '#3a0a14', '#6a1024', '#a01a34', '#e0485a'),
    'chaos':    ramp('#12041a', '#2a0a34', '#4a1050', '#7a1a6a', '#c04a9a'),
    'orichal':  ramp('#5a1a08', '#9a3a10', '#d8702a', '#f6a85a', '#ffe0b0'),
    'rainbow':  ramp('#7a2a8a', '#c04a6a', '#f0a03a', '#7ad86a', '#8ad6ff'),
}

GEM = {k: v for k, v in {
    'red': '#ff3a4a', 'blue': '#3a8aff', 'green': '#3ae06a', 'yellow': '#ffe03a', 'purple': '#b04aff',
    'cyan': '#4af0ff', 'pink': '#ff7ad0', 'white': '#ffffff', 'orange': '#ff9a2a', 'black': '#4a2a6a'}.items()}

# テーマ → [刃・頭の素材, 持ち手の素材, 宝石の色]
THEME = {
    'grass': ['wood', 'wood', 'pink'], 'forest': ['wood', 'darkwood', 'green'], 'desert': ['sand', 'wood', 'yellow'],
    'mountain': ['stone', 'wood', 'orange'], 'cave': ['iron', 'wood', 'orange'], 'crystal': ['crystal', 'steel', 'cyan'],
    'beach': ['coral', 'wood', 'pink'], 'sea': ['water', 'steel', 'blue'], 'snow': ['ice', 'steel', 'cyan'],
    'volcano': ['fire', 'obsidian', 'red'], 'sky': ['sky', 'silver', 'yellow'], 'sweets': ['candy', 'honey', 'pink'],
    'poison': ['poison', 'darkwood', 'green'], 'bigtree': ['leaf', 'wood', 'green'], 'mushroom': ['mush', 'darkwood', 'cyan'],
    'earth': ['earth', 'darkwood', 'orange'], 'ghost': ['ghost', 'shadow', 'cyan'], 'machine': ['steel', 'brass', 'orange'],
    'space': ['space', 'silver', 'purple'], 'magic': ['magic', 'gold', 'purple'], 'ruins': ['holy', 'steel', 'yellow'],
    'demon': ['demon', 'obsidian', 'red'],
}

# 名前の言葉 → 素材（上ほど 強い）。[言葉…], 刃の素材, 持ち手(None=そのまま), 宝石
KEYWORDS = [
    (['ゆうしゃ', 'ブレイブ'], 'holy', 'steel', 'blue'),
    (['オリハルコン'], 'orichal', 'gold', 'red'),
    (['カオス'], 'chaos', 'obsidian', 'purple'),
    (['まおう', 'まじん', 'あんこく', 'ぜつぼう', 'ヘル', 'まかい', 'のろい', 'しっこく', 'デーモン', '魔王'], 'demon', 'obsidian', 'red'),
    (['にじ', 'レインボー'], 'rainbow', 'silver', 'white'),
    (['きょむ', 'ダークマター', 'しゅうえん', 'ヴォイド', '虚無'], 'void', 'obsidian', 'purple'),
    (['ダークフレア', 'ブラックフレア', 'こくよう', 'くろずみ', 'めつび', '黒曜', '黒炎'], 'obsidian', 'obsidian', 'red'),
    (['ほしくず', 'メテオ', 'りゅうせい', 'うちゅう', 'ぎんが', 'スター', 'ギャラクシー', 'コスモ', '星'], 'space', 'silver', 'yellow'),
    (['プラズマ', 'レーザー', 'ネオメタル', 'きこう', 'メカ', 'ごうきん', 'サイバー'], 'neon', 'steel', 'cyan'),
    (['はぐるま', 'スチーム', 'からくり', 'ギア'], 'brass', 'iron', 'orange'),
    (['くずてつ', 'ジャンク'], 'iron', 'brass', 'orange'),
    (['ゆうれい', 'ゴースト', 'さまよい', 'ひつぎ', 'レクイエム', 'なげき', '霊'], 'ghost', 'shadow', 'cyan'),
    (['かげ', 'シャドウ', 'やみ', 'ダーク', '闇'], 'shadow', 'obsidian', 'purple'),
    (['ホーリー', 'せいなる', 'めがみ', 'エンジェル', 'ヘヴン', 'せいてん', '聖', '天使'], 'holy', 'silver', 'white'),
    (['ミラー', 'むげん', 'ゆがみ'], 'silver', 'magic', 'purple'),
    (['まどう', 'マジック', 'けんじゃ', 'まほう', 'オーブ', 'ルーン', '魔'], 'magic', 'gold', 'purple'),
    (['ぐんよう', 'ウォー', 'しょうぐん', 'とりで', 'ナイト', 'えいゆう', 'ジェネラル', '騎士'], 'steel', 'demon', 'red'),
    (['いなずま', 'サンダー', '雷', 'ボルト'], 'thunder', 'steel', 'yellow'),
    (['スカイ', 'エアリアル', 'くもいと', 'てんくう', 'フェザー', 'ウィング', '空'], 'sky', 'silver', 'yellow'),
    (['マグマ', 'ヴォルカ', 'ようがん'], 'magma', 'obsidian', 'orange'),
    (['フレイム', 'ほむら', 'えんねつ', 'ファイア', '炎', '火', 'ドラゴン'], 'fire', 'obsidian', 'red'),
    (['ぜったいれいど', '零度', 'ゼロ', 'ブリザード', 'アイスバーグ', 'アイス', 'フロスト', '氷', '凍', '雪', 'グラシア'], 'ice', 'steel', 'cyan'),
    (['ポセイドン', 'ネプチューン', '海神', 'オーシャン', 'アクア', '海賊', 'シア'], 'water', 'gold', 'blue'),
    (['サンゴ'], 'coral', 'wood', 'pink'),
    (['魚骨', 'ボーン', '骨', 'ファング', 'キバ'], 'bone', 'wood', 'red'),
    (['ダイヤ'], 'diamond', 'silver', 'white'),
    (['クリスタル', 'ガラス', '水晶'], 'crystal', 'steel', 'cyan'),
    (['プラチナ', 'シルバー', '銀'], 'silver', 'steel', 'blue'),
    (['ゴールド', '金', 'ファラオ', 'ソーラー', 'スフィンクス'], 'gold', 'darkwood', 'red'),
    (['鋼', 'はがね', 'スチール'], 'steel', 'iron', 'blue'),
    (['鉄', 'アイアン'], 'iron', 'wood', 'orange'),
    (['どう', '銅', 'ブロンズ'], 'bronze', 'wood', 'green'),
    (['石', '岩', 'ストーン', 'ロック'], 'stone', 'wood', 'orange'),
    (['あめだま', 'キャンディ', 'ストロベリー', 'スイーツ', 'ケーキ'], 'candy', 'honey', 'pink'),
    (['ハチミツ', 'ハニー', 'メープル', 'パンケーキ'], 'honey', 'darkwood', 'yellow'),
    (['こはく', 'アンバー'], 'amber', 'darkwood', 'orange'),
    (['ヴェノム', 'もうどく', 'ポイズン', 'どく', '毒', 'オロチ'], 'toxic', 'poison', 'purple'),
    (['ぬま', 'スワンプ'], 'poison', 'darkwood', 'green'),
    (['ひかりだけ', 'ルミナス', 'ほたる', 'グロウ'], 'glow', 'darkwood', 'cyan'),
    (['キノコ', 'マッシュ', 'ファンガス'], 'mush', 'darkwood', 'white'),
    (['まどわし', 'トリック', 'ゆめ', 'ドリーム'], 'dream', 'magic', 'pink'),
    (['あかつち', 'アース', 'だいち', 'ちてい', 'かせき', 'グラビティ', 'ディープ', 'そこなし', 'たてあな', 'ガイア', 'コア'], 'earth', 'darkwood', 'orange'),
    (['ユグドラ', 'せかいじゅ', 'せいれい', 'ドリアード', 'ルーツ', 'ねっこ'], 'leaf', 'wood', 'green'),
    (['サボテン'], 'leaf', 'sand', 'pink'),
    (['スコーピオン', 'サソリ', 'コブラ', 'ミイラ'], 'sand', 'darkwood', 'green'),
    (['ひのき', 'ウッド', 'オーク', '流木', 'トネリコ', 'ヤシ', '木'], 'wood', 'wood', 'green'),
]

def palette_for(name, theme):
    m, h, g = THEME.get(theme, THEME['grass'])
    for words, mm, hh, gg in KEYWORDS:
        if any(w in name for w in words):
            m, g = mm, gg
            if hh: h = hh
            break
    return MAT[m], MAT[h], hx(GEM[g]), m

# ---------------------------------------------------------------
#  道具
# ---------------------------------------------------------------
class Pen:
    def __init__(self, size):
        self.im = Image.new('RGBA', (size, size), (0, 0, 0, 0)); self.d = ImageDraw.Draw(self.im); self.size = size
    def poly(self, pts, c): self.d.polygon([(x, y) for x, y in pts], fill=c + (255,))
    def rect(self, x0, y0, x1, y1, c): self.d.rectangle([x0, y0, x1, y1], fill=c + (255,))
    def ell(self, cx, cy, rx, ry, c): self.d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=c + (255,))
    def line(self, pts, c, w): self.d.line(pts, fill=c + (255,), width=int(w), joint='curve')

def shaded_blade(p, cx, top, bot, half, P, shape='straight', rnd=None):
    """たての刃。左半分が明るく、右半分が影、まん中に しのぎ線"""
    pts_l, pts_r = [], []
    n = 24
    for i in range(n + 1):
        t = i / n; y = top + (bot - top) * t
        if t < 0.18: w = half * (t / 0.18) ** 0.8          # 先
        else: w = half
        if shape == 'leaf': w = half * (0.75 + 0.35 * math.sin(min(1, t) * math.pi * 0.9)) * (min(1, t / 0.2) ** 0.8)
        if shape == 'wavy' and t > 0.18: w = half * (1 + 0.22 * math.sin(t * math.pi * 7))
        if shape == 'broad' and t > 0.18: w = half * (1.12 - 0.15 * t)
        if shape == 'zig' and t > 0.18: w = half * (1 + (0.3 if int(t * 9) % 2 else -0.1))
        off = 0
        if shape == 'curve': off = half * 1.4 * (1 - t) ** 2
        pts_l.append((cx - w + off, y)); pts_r.append((cx + w + off, y))
    p.poly(pts_l + pts_r[::-1], P[2])
    # 影（右）
    p.poly([(x - (x - (pts_l[i][0] + pts_r[i][0]) / 2), y) for i, (x, y) in enumerate(pts_r)] + pts_r[::-1], P[1])
    # しのぎ線
    mids = [((pts_l[i][0] + pts_r[i][0]) / 2, y) for i, (x, y) in enumerate(pts_l)]
    p.line(mids[3:], P[4], SS * 0.9)
    # 刃先の光（左のふち）
    p.line([(x + SS * 0.6, y) for x, y in pts_l[4:]], P[3], SS * 0.8)
    if shape == 'serrated':
        for i in range(3, n, 3):
            x, y = pts_r[i]; p.poly([(x - 2, y - SS * 1.5), (x + SS * 1.6, y), (x - 2, y + SS * 1.5)], P[1])

def grip(p, cx, top, bot, w, H, wrap=True):
    p.rect(cx - w, top, cx + w, bot, H[2])
    p.rect(cx + w * 0.2, top, cx + w, bot, H[1])
    p.rect(cx - w, top, cx - w * 0.45, bot, H[3])
    if wrap:
        step = SS * 2.6
        y = top + step * 0.5
        while y < bot - SS:
            p.line([(cx - w, y), (cx + w, y + SS * 1.2)], H[0], SS * 0.8); y += step

def gem(p, cx, cy, r, g, P=None):
    dark = tuple(int(v * 0.55) for v in g); light = tuple(min(255, int(v * 0.5 + 140)) for v in g)
    p.ell(cx, cy, r, r, dark); p.ell(cx - r * 0.12, cy - r * 0.12, r * 0.78, r * 0.78, g)
    p.ell(cx - r * 0.35, cy - r * 0.35, r * 0.3, r * 0.3, light)

def guard(p, cx, y, half, P, style, g, rich):
    t = SS * 2.2
    if style == 'bar':
        p.rect(cx - half, y - t, cx + half, y + t, P[2]); p.rect(cx - half, y, cx + half, y + t, P[1])
    elif style == 'up':
        p.poly([(cx - half, y - t * 2.5), (cx - half * 0.8, y + t), (cx + half * 0.8, y + t), (cx + half, y - t * 2.5), (cx, y - t * 0.4)], P[2])
        p.poly([(cx, y - t * 0.4), (cx + half, y - t * 2.5), (cx + half * 0.8, y + t), (cx, y + t)], P[1])
    elif style == 'down':
        p.poly([(cx - half, y + t * 2.5), (cx - half * 0.8, y - t), (cx + half * 0.8, y - t), (cx + half, y + t * 2.5), (cx, y + t * 0.6)], P[2])
        p.poly([(cx, y + t * 0.6), (cx + half * 0.8, y - t), (cx + half, y + t * 2.5)], P[1])
    elif style == 'wing':
        for sgn in (-1, 1):
            p.poly([(cx, y - t), (cx + sgn * half * 1.15, y - t * 4), (cx + sgn * half * 0.9, y - t * 1.2), (cx + sgn * half * 1.1, y + t * 0.5), (cx, y + t)], P[2] if sgn < 0 else P[1])
    else:  # round
        p.ell(cx, y, half * 0.55, t * 2.2, P[2]); p.ell(cx + half * 0.12, y + t * 0.3, half * 0.4, t * 1.6, P[1])
    if rich: gem(p, cx, y, t * 1.5, g)

def pommel(p, cx, y, r, P, style, g):
    if style == 'gem': p.ell(cx, y, r * 1.1, r * 1.1, P[1]); gem(p, cx, y, r * 0.8, g)
    elif style == 'spike': p.poly([(cx - r, y - r * 0.4), (cx + r, y - r * 0.4), (cx, y + r * 1.8)], P[2])
    elif style == 'ring': p.ell(cx, y + r * 0.4, r * 1.1, r * 1.1, P[2]); p.ell(cx, y + r * 0.4, r * 0.5, r * 0.5, (0, 0, 0))
    else: p.ell(cx, y, r, r, P[2]); p.ell(cx - r * 0.3, y - r * 0.3, r * 0.4, r * 0.4, P[4])

def leaf_deco(p, x, y, size, L, ang=0):
    pts = []
    for i in range(13):
        a = i / 12 * math.pi * 2
        rx, ry = size, size * 0.45
        px, py = rx * math.cos(a), ry * math.sin(a)
        ca, sa = math.cos(ang), math.sin(ang)
        pts.append((x + px * ca - py * sa, y + px * sa + py * ca))
    p.poly(pts, L[3])

# ---------------------------------------------------------------
#  武器（たて向きに描いて、あとで45度かたむける）
# ---------------------------------------------------------------
def draw_weapon(typ, P, H, g, it, rnd):
    C = int(S * 1.45); p = Pen(C); cx = C / 2
    tier = (it['stage'] - 1) / 164                 # 0〜1
    sub = (it['stage'] - 1) % 3                    # エリアの中の 1/2/3 番目
    rich = sub == 2 or it['area'] >= 20
    L = S * (0.98 + 0.12 * tier)                   # 長さ
    top = cx - L / 2; bot = cx + L / 2
    gstyle = rnd.choice(['bar', 'up', 'down', 'round', 'wing'] if tier > 0.3 else ['bar', 'up', 'down', 'round'])
    pstyle = rnd.choice(['ball', 'gem', 'spike', 'ring'] if tier > 0.2 else ['ball', 'ring'])
    bshape = rnd.choice(['straight', 'leaf', 'broad', 'straight', 'serrated', 'wavy'] if tier > 0.25 else ['straight', 'leaf', 'straight'])
    if any(w in it['name'] for w in ['いなずま', 'サンダー', '雷', 'ボルト', 'ジグ']): bshape = 'zig'
    if any(w in it['name'] for w in ['フレイム', 'ほむら', 'ウェーブ', 'なみ']): bshape = 'wavy'
    if 'ドラゴン' in it['name'] or 'エンジェル' in it['name']: gstyle = 'wing'

    if typ == 'ken' or typ == 'taiken' or typ == 'daga':
        k = {'ken': (0.62, 0.075, 0.24), 'taiken': (0.66, 0.12, 0.3), 'daga': (0.46, 0.07, 0.2)}[typ]
        blen = L * k[0]; half = S * k[1] * (1 + 0.15 * tier); ghalf = S * k[2] * (0.9 + 0.2 * tier)
        if typ == 'daga': top += L * 0.22
        gy = top + blen
        if typ == 'daga' and rnd.random() < 0.4: bshape = 'curve'
        shaded_blade(p, cx, top, gy, half, P, bshape, rnd)
        grip(p, cx, gy, bot - S * 0.07, S * (0.035 if typ != 'taiken' else 0.045), H)
        guard(p, cx, gy, ghalf, P if typ != 'daga' else H, gstyle, g, rich)
        pommel(p, cx, bot - S * 0.05, S * 0.045, P, pstyle, g)
    elif typ == 'stick':
        w = S * (0.045 + 0.02 * tier)
        grip(p, cx, top + S * 0.05, bot, w, P if tier > 0.15 else H, wrap=False)
        for k2 in range(1 + int(tier * 4)):
            y = top + L * (0.55 + 0.1 * k2)
            p.rect(cx - w * 1.15, y, cx + w * 1.15, y + SS * 2.5, H[3] if tier < 0.15 else P[4])
        p.ell(cx, top + S * 0.05, w * 1.05, w * 0.8, P[3])
        if tier > 0.05:
            if rich: gem(p, cx, top + S * 0.02, w * 1.6, g)
            else: p.ell(cx, top + S * 0.03, w * 1.4, w * 1.4, P[2])
        if it['theme'] in ('grass', 'forest', 'bigtree'): leaf_deco(p, cx + w * 2.2, top + L * 0.3, w * 1.6, MAT['leaf'], -0.6)
    elif typ == 'tue':
        grip(p, cx, top + S * 0.24, bot, S * 0.035, H, wrap=tier > 0.2)
        hy = top + S * 0.17; r = S * (0.1 + 0.05 * tier)
        hs = rnd.choice(['orb', 'crescent', 'ring', 'star', 'wing'] if tier > 0.2 else ['orb', 'crescent', 'ring'])
        if hs == 'crescent':
            p.ell(cx, hy, r, r, P[2]); p.ell(cx + r * 0.45, hy - r * 0.25, r * 0.85, r * 0.85, (0, 0, 0, 0)[:3]); p.d.ellipse([cx + r * 0.45 - r * 0.85, hy - r * 0.25 - r * 0.85, cx + r * 0.45 + r * 0.85, hy - r * 0.25 + r * 0.85], fill=(0, 0, 0, 0))
            gem(p, cx + r * 0.2, hy + r * 0.2, r * 0.45, g)
        elif hs == 'ring':
            p.ell(cx, hy, r, r, P[2]); p.ell(cx + r * 0.1, hy + r * 0.1, r * 0.75, r * 0.75, P[1]); p.d.ellipse([cx - r * 0.6, hy - r * 0.6, cx + r * 0.6, hy + r * 0.6], fill=(0, 0, 0, 0))
            gem(p, cx, hy, r * 0.42, g)
        elif hs == 'star':
            pts = []
            for i in range(10):
                a = -math.pi / 2 + i * math.pi / 5; rr = r * (1.15 if i % 2 == 0 else 0.5)
                pts.append((cx + rr * math.cos(a), hy + rr * math.sin(a)))
            p.poly(pts, P[2]); gem(p, cx, hy, r * 0.38, g)
        elif hs == 'wing':
            for sgn in (-1, 1):
                p.poly([(cx, hy), (cx + sgn * r * 1.6, hy - r * 1.1), (cx + sgn * r * 1.3, hy - r * 0.2), (cx + sgn * r * 1.5, hy + r * 0.3), (cx, hy + r * 0.6)], P[3] if sgn < 0 else P[2])
            gem(p, cx, hy, r * 0.55, g)
        else:
            p.ell(cx, hy + r * 0.9, r * 0.5, r * 0.35, P[2])
            gem(p, cx, hy, r * 0.8, g)
        p.rect(cx - S * 0.05, top + S * 0.24, cx + S * 0.05, top + S * 0.27, P[2])
    elif typ == 'ono':
        grip(p, cx, top + S * 0.04, bot, S * 0.04, H, wrap=tier > 0.3)
        hy = top + S * 0.2; hw = S * (0.24 + 0.08 * tier); hh = S * (0.2 + 0.05 * tier)
        double = tier > 0.45 and rnd.random() < 0.6
        for sgn in ((-1, 1) if double else (-1,)):
            pts = [(cx, hy - hh * 0.35), (cx + sgn * hw * 0.55, hy - hh * 0.45), (cx + sgn * hw, hy - hh * 0.8), (cx + sgn * hw * 1.05, hy), (cx + sgn * hw, hy + hh * 0.8), (cx + sgn * hw * 0.55, hy + hh * 0.45), (cx, hy + hh * 0.35)]
            p.poly(pts, P[2])
            p.poly([(cx, hy), (cx + sgn * hw * 1.05, hy)] + pts[3:], P[1])
            p.line([(cx + sgn * hw * 0.95, hy - hh * 0.65), (cx + sgn * hw * 1.0, hy + hh * 0.65)], P[4], SS * 1.4)
        p.rect(cx - S * 0.05, hy - hh * 0.4, cx + S * 0.05, hy + hh * 0.4, P[1])
        if rich: gem(p, cx, hy, S * 0.035, g)
        p.ell(cx, top + S * 0.04, S * 0.04, S * 0.03, P[2])
    elif typ == 'mace':
        grip(p, cx, top + S * 0.2, bot, S * 0.035, H)
        hy = top + S * 0.17; r = S * (0.11 + 0.05 * tier)
        spikes = 6 + int(tier * 6)
        if rnd.random() < 0.5 or tier < 0.2:
            for i in range(spikes):
                a = i / spikes * math.pi * 2
                p.poly([(cx + r * 0.7 * math.cos(a + 0.25), hy + r * 0.7 * math.sin(a + 0.25)), (cx + r * 1.45 * math.cos(a), hy + r * 1.45 * math.sin(a)), (cx + r * 0.7 * math.cos(a - 0.25), hy + r * 0.7 * math.sin(a - 0.25))], P[3])
            p.ell(cx, hy, r, r, P[2]); p.ell(cx + r * 0.25, hy + r * 0.25, r * 0.7, r * 0.7, P[1]); p.ell(cx - r * 0.35, hy - r * 0.35, r * 0.3, r * 0.3, P[4])
        else:   # フランジ（板が何枚もついた 形）
            for i in range(4):
                xx = cx + (i - 1.5) * r * 0.55
                p.poly([(xx - r * 0.2, hy - r * 1.2), (xx + r * 0.2, hy - r * 1.2), (xx + r * 0.35, hy + r), (xx - r * 0.35, hy + r)], P[2 + (i % 2)])
            p.rect(cx - r * 0.8, hy - r * 0.2, cx + r * 0.8, hy + r * 0.2, P[1])
        if rich: gem(p, cx, hy, r * 0.4, g)
        pommel(p, cx, bot - S * 0.03, S * 0.04, P, 'ball', g)
    elif typ == 'kama':
        grip(p, cx, top + S * 0.05, bot, S * 0.032, H, wrap=tier > 0.3)
        hy = top + S * 0.1; R = S * (0.28 + 0.06 * tier)
        # 三日月の刃（持ち手の上から 左へ のびて 下に まがる）
        W = S * (0.4 + 0.08 * tier)
        def qb(p0, c, e, n=20): return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t * t * e[0], (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t * t * e[1]) for t in [i / n for i in range(n + 1)]]
        tip = (cx - W, hy + S * 0.24)
        outer = qb((cx + S * 0.03, hy - S * 0.05), (cx - W * 0.85, hy - S * 0.16), tip)
        inner = qb((cx + S * 0.0, hy + S * 0.06), (cx - W * 0.7, hy - S * 0.02), tip)
        p.poly(outer + inner[::-1], P[2])
        p.poly([((x + inner[i][0]) / 2, (y + inner[i][1]) / 2) for i, (x, y) in enumerate(outer)] + inner[::-1], P[1])
        p.line(outer[1:], P[4], SS * 1.2)
        p.rect(cx - S * 0.045, hy, cx + S * 0.045, hy + S * 0.08, P[1])
        if rich: gem(p, cx, hy + S * 0.04, S * 0.03, g)
    elif typ == 'wip' or typ == 'tume':
        pass
    return p.im

def draw_whip(P, H, g, it, rnd):
    p = Pen(S); tier = (it['stage'] - 1) / 164; rich = (it['stage'] - 1) % 3 == 2 or it['area'] >= 20
    # 持ち手（左下）
    hx0, hy0, hx1, hy1 = S * 0.12, S * 0.9, S * 0.3, S * 0.66
    p.line([(hx0, hy0), (hx1, hy1)], H[1], S * 0.075); p.line([(hx0 - 3, hy0 - 3), (hx1 - 3, hy1 - 3)], H[3], S * 0.03)
    p.ell(hx0, hy0, S * 0.04, S * 0.04, P[1])
    if rich: gem(p, hx1, hy1, S * 0.035, g)
    # しなる ひも（ベジェ曲線）
    c1 = (S * (0.55 + rnd.random() * 0.1), S * 0.35); c2 = (S * 0.15, S * 0.25); end = (S * (0.7 + 0.15 * tier), S * 0.12)
    pts = []
    for i in range(41):
        t = i / 40; mt = 1 - t
        x = mt ** 3 * hx1 + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * end[0]
        y = mt ** 3 * hy1 + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * end[1]
        pts.append((x, y))
    for i in range(len(pts) - 1):
        w = S * (0.045 - 0.03 * i / 40)
        p.line([pts[i], pts[i + 1]], P[1], w + SS)
        p.line([pts[i], pts[i + 1]], P[2], w)
    for i in range(2, len(pts) - 2, 4):  # 編み目
        p.ell(pts[i][0] - 2, pts[i][1] - 2, SS * 0.8, SS * 0.8, P[4])
    if tier > 0.3:   # 先の とげ
        x, y = pts[-1]; p.poly([(x - SS * 3, y + SS * 2), (x + SS * 4, y - SS * 3), (x + SS * 1, y + SS * 3)], P[3])
    return p.im

def draw_claw(P, H, g, it, rnd):
    p = Pen(S); tier = (it['stage'] - 1) / 164; rich = (it['stage'] - 1) % 3 == 2 or it['area'] >= 20
    # こぶしの ガントレット
    bx, by = S * 0.36, S * 0.62
    p.ell(bx, by, S * 0.2, S * 0.17, H[1]); p.ell(bx - S * 0.02, by - S * 0.02, S * 0.18, S * 0.14, H[2])
    p.rect(bx - S * 0.2, by + S * 0.05, bx + S * 0.06, by + S * 0.3, H[1]); p.rect(bx - S * 0.18, by + S * 0.05, bx + S * 0.0, by + S * 0.28, H[2])
    for k in range(2): p.rect(bx - S * 0.2, by + S * (0.12 + 0.08 * k), bx + S * 0.06, by + S * (0.14 + 0.08 * k), H[0])
    if rich: gem(p, bx, by, S * 0.05, g)
    n = 3 + (1 if tier > 0.6 else 0)
    ln = S * (0.36 + 0.12 * tier)
    for i in range(n):
        sx = bx + S * 0.08 + i * S * 0.02; sy = by - S * 0.13 + i * S * 0.075
        ang = -0.95 + i * 0.22
        ex, ey = sx + ln * math.cos(ang), sy + ln * math.sin(ang)
        mx, my = (sx + ex) / 2 + S * 0.05, (sy + ey) / 2 + S * 0.03
        w = S * 0.05
        p.poly([(sx, sy - w), (mx, my - w * 0.7), (ex, ey), (mx, my + w * 0.7), (sx, sy + w)], P[2])
        p.poly([(mx, my), (ex, ey), (mx, my + w * 0.7), (sx, sy + w), (sx, sy)], P[1])
        p.line([(sx, sy - w * 0.4), (mx, my - w * 0.4), (ex, ey)], P[4], SS)
    return p.im

# ---------------------------------------------------------------
#  アクセサリー（正面から）
# ---------------------------------------------------------------
def star_pts(cx, cy, r1, r2, n=5, rot=-math.pi / 2):
    return [(cx + (r1 if i % 2 == 0 else r2) * math.cos(rot + i * math.pi / n), cy + (r1 if i % 2 == 0 else r2) * math.sin(rot + i * math.pi / n)) for i in range(n * 2)]

def draw_acc(typ, P, H, g, it, rnd):
    p = Pen(S); t = (it['stage'] - 1) / 54; cx, cy = S / 2, S / 2
    gems = 1 + int(t * 3)
    if typ == 'ring':
        R = S * 0.3
        p.ell(cx, cy + S * 0.08, R, R * 0.92, P[1]); p.ell(cx - SS, cy + S * 0.08 - SS, R * 0.96, R * 0.88, P[2])
        p.d.ellipse([cx - R * 0.72, cy + S * 0.08 - R * 0.66, cx + R * 0.72, cy + S * 0.08 + R * 0.66], fill=(0, 0, 0, 0))
        p.d.arc([cx - R * 0.9, cy + S * 0.08 - R * 0.84, cx + R * 0.9, cy + S * 0.08 + R * 0.8], 200, 330, fill=P[4] + (255,), width=SS * 2)
        # 台座と宝石
        p.poly([(cx - S * 0.13, cy - R * 0.62), (cx + S * 0.13, cy - R * 0.62), (cx + S * 0.08, cy - R * 0.85), (cx - S * 0.08, cy - R * 0.85)], P[3])
        gem(p, cx, cy - R * 1.0, S * (0.1 + 0.03 * t), g)
        if gems > 2:
            gem(p, cx - S * 0.17, cy - R * 0.7, S * 0.045, g); gem(p, cx + S * 0.17, cy - R * 0.7, S * 0.045, g)
    elif typ == 'bangle':
        R = S * 0.36
        p.ell(cx, cy, R, R * 0.62, P[1]); p.ell(cx - SS, cy - SS, R * 0.97, R * 0.58, P[2])
        p.ell(cx, cy - S * 0.03, R * 0.75, R * 0.38, (0, 0, 0)); p.d.ellipse([cx - R * 0.75, cy - S * 0.03 - R * 0.38, cx + R * 0.75, cy - S * 0.03 + R * 0.38], fill=(0, 0, 0, 0))
        p.d.arc([cx - R * 0.92, cy - R * 0.56, cx + R * 0.92, cy + R * 0.56], 20, 160, fill=P[4] + (255,), width=SS * 2)
        for i in range(gems + 1):
            a = math.pi * (0.25 + 0.5 * (i + 0.5) / (gems + 1))
            gem(p, cx + R * 0.86 * math.cos(a), cy + R * 0.52 * math.sin(a), S * 0.045, g)
        if 'ハートの' in it['name']: pass
    elif typ == 'pendant':
        # くさり（V字に たれさがる）
        pcy0 = cy + S * 0.12; r0 = S * (0.16 + 0.04 * t)
        for sgn in (-1, 1):
            pts = []
            for i in range(17):
                u = i / 16
                x = cx + sgn * S * 0.36 * (1 - u) ** 1.2
                y = S * 0.06 + (pcy0 - r0 * 1.15 - S * 0.06) * (u ** 0.7)
                pts.append((x, y))
            p.line(pts, H[1], SS * 2.2); p.line(pts, H[3], SS * 1.1)
            for i in range(0, 17, 2): p.ell(pts[i][0], pts[i][1], SS * 1.3, SS * 1.3, H[2])
        pcy = cy + S * 0.12; shape = rnd.choice(['drop', 'circle', 'star', 'heart', 'shield'] if t > 0.2 else ['drop', 'circle', 'heart'])
        r = S * (0.16 + 0.04 * t)
        p.ell(cx, pcy - r * 1.15, SS * 2.2, SS * 2.2, P[3])
        if shape == 'circle': p.ell(cx, pcy, r, r, P[1]); p.ell(cx - SS, pcy - SS, r * 0.9, r * 0.9, P[2]); gem(p, cx, pcy, r * 0.55, g)
        elif shape == 'star': p.poly(star_pts(cx, pcy, r * 1.25, r * 0.55), P[2]); gem(p, cx, pcy, r * 0.4, g)
        elif shape == 'heart':
            p.ell(cx - r * 0.45, pcy - r * 0.25, r * 0.55, r * 0.55, P[2]); p.ell(cx + r * 0.45, pcy - r * 0.25, r * 0.55, r * 0.55, P[2])
            p.poly([(cx - r, pcy - r * 0.1), (cx + r, pcy - r * 0.1), (cx, pcy + r * 1.05)], P[2]); gem(p, cx, pcy, r * 0.38, g)
        elif shape == 'shield':
            p.poly([(cx - r, pcy - r * 0.9), (cx + r, pcy - r * 0.9), (cx + r * 0.9, pcy + r * 0.3), (cx, pcy + r * 1.1), (cx - r * 0.9, pcy + r * 0.3)], P[2])
            p.poly([(cx, pcy - r * 0.9), (cx + r, pcy - r * 0.9), (cx + r * 0.9, pcy + r * 0.3), (cx, pcy + r * 1.1)], P[1]); gem(p, cx, pcy, r * 0.38, g)
        else:
            p.poly([(cx, pcy - r * 1.1), (cx + r * 0.85, pcy + r * 0.2), (cx, pcy + r * 1.1), (cx - r * 0.85, pcy + r * 0.2)], P[2])
            p.poly([(cx, pcy - r * 1.1), (cx + r * 0.85, pcy + r * 0.2), (cx, pcy + r * 1.1)], P[1]); gem(p, cx, pcy + r * 0.1, r * 0.4, g)
    elif typ == 'earring':
        for sgn in (-1, 1):
            x = cx + sgn * S * 0.17; y0 = S * 0.18
            p.d.arc([x - S * 0.06, y0 - S * 0.06, x + S * 0.06, y0 + S * 0.06], 180, 360 + 90, fill=H[3] + (255,), width=SS * 2)
            p.line([(x + S * 0.06, y0), (x, y0 + S * 0.13)], H[2], SS * 1.6)
            dy = y0 + S * 0.24; r = S * (0.08 + 0.03 * t)
            if sgn < 0 or t < 0.5:
                p.poly([(x, dy - r * 1.4), (x + r, dy), (x, dy + r * 1.6), (x - r, dy)], P[2]); p.poly([(x, dy - r * 1.4), (x + r, dy), (x, dy + r * 1.6)], P[1])
            else:
                p.poly(star_pts(x, dy, r * 1.3, r * 0.6), P[2])
            gem(p, x, dy, r * 0.55, g)
            if t > 0.3: gem(p, x, dy + r * 2.1, r * 0.4, g)
    elif typ == 'badge':
        r = S * (0.26 + 0.05 * t)
        # リボン
        for sgn in (-1, 1):
            p.poly([(cx + sgn * r * 0.2, cy + r * 0.3), (cx + sgn * r * 0.75, cy + r * 1.55), (cx + sgn * r * 0.45, cy + r * 1.35), (cx + sgn * r * 0.25, cy + r * 1.6), (cx - sgn * r * 0.15, cy + r * 0.4)], (tuple(int(v * 0.8) for v in g)))
        style = rnd.choice(['star', 'round', 'shield'] if t > 0.15 else ['round', 'star'])
        if style == 'star': p.poly(star_pts(cx, cy, r * 1.15, r * 0.6, 8 if t > 0.5 else 5), P[1]); p.poly(star_pts(cx - SS, cy - SS, r * 1.05, r * 0.55, 8 if t > 0.5 else 5), P[2])
        elif style == 'shield':
            p.poly([(cx - r, cy - r), (cx + r, cy - r), (cx + r * 0.9, cy + r * 0.35), (cx, cy + r * 1.15), (cx - r * 0.9, cy + r * 0.35)], P[2])
            p.poly([(cx, cy - r), (cx + r, cy - r), (cx + r * 0.9, cy + r * 0.35), (cx, cy + r * 1.15)], P[1])
        else: p.ell(cx, cy, r, r, P[1]); p.ell(cx - SS, cy - SS, r * 0.92, r * 0.92, P[2]); p.ell(cx, cy, r * 0.7, r * 0.7, P[3])
        gem(p, cx, cy, r * 0.42, g)
    return p.im

# ---------------------------------------------------------------
#  ドット絵に しあげる（縮小 → 色を へらす → ふちどり → 光）
# ---------------------------------------------------------------
def finish(big, glow, sparkle):
    small = big.resize((G, G), Image.BOX)
    px = small.load()
    for y in range(G):
        for x in range(G):
            r, gg, b, a = px[x, y]
            if a < 110: px[x, y] = (0, 0, 0, 0)
            else:
                k = 255 / a
                px[x, y] = (min(255, int(r * k)) // 8 * 8, min(255, int(gg * k)) // 8 * 8, min(255, int(b * k)) // 8 * 8, 255)
    out = Image.new('RGBA', (G, G), (0, 0, 0, 0))
    o = out.load(); s = small.load()
    # 光のオーラ（強い武器だけ）
    if glow:
        for y in range(G):
            for x in range(G):
                if s[x, y][3]: continue
                near = any(0 <= x + dx < G and 0 <= y + dy < G and s[x + dx, y + dy][3] for dx in (-2, -1, 0, 1, 2) for dy in (-2, -1, 0, 1, 2) if abs(dx) + abs(dy) <= 3)
                if near: o[x, y] = glow + (90,)
    # ふちどり
    OUT = (26, 16, 32, 255)
    for y in range(G):
        for x in range(G):
            if s[x, y][3]: continue
            if any(0 <= x + dx < G and 0 <= y + dy < G and s[x + dx, y + dy][3] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                o[x, y] = OUT
    out.alpha_composite(small)
    if sparkle:
        rnd = random.Random(sparkle)
        o = out.load()
        for _ in range(2):
            for _try in range(40):
                x, y = rnd.randrange(3, G - 3), rnd.randrange(3, G - 3)
                if s[x, y][3] and s[x, y][3] and sum(s[x, y][:3]) > 300:
                    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)): o[x + dx, y + dy] = (255, 255, 255, 255)
                    break
    return out.resize((G * OUT_SCALE, G * OUT_SCALE), Image.NEAREST)

def fit(im, margin=0.06, grow=1.0):
    """はみ出さないように、まん中に おさめる"""
    bb = im.getbbox()
    if not bb: return Image.new('RGBA', (S, S), (0, 0, 0, 0))
    part = im.crop(bb); w, h = part.size
    lim = S * (1 - margin * 2)
    k = min(grow, lim / w, lim / h)
    if k != 1: part = part.resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
    out = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    out.alpha_composite(part, ((S - part.size[0]) // 2, (S - part.size[1]) // 2))
    return out

def make(it):
    seed = int(hashlib.md5(it['id'].encode()).hexdigest()[:8], 16)
    rnd = random.Random(seed)
    P, H, g, mname = palette_for(it['name'], it['theme'])
    typ = it['type']
    if it['kind'] == 'acc':
        big = fit(draw_acc(typ, P, H, g, it, rnd), 0.08, 1.8)
        strong = it['stage'] >= 30
    else:
        if typ == 'wip': big = fit(draw_whip(P, H, g, it, rnd))
        elif typ == 'tume': big = fit(draw_claw(P, H, g, it, rnd))
        else:
            raw = draw_weapon(typ, P, H, g, it, rnd)
            rot = raw.rotate(-45, resample=Image.BICUBIC)
            big = fit(rot)
        strong = it['area'] >= 37 or ((it['stage'] - 1) % 3 == 2 and it['area'] >= 16)
    glow = g if strong else None
    sparkle = seed if ((it['stage'] - 1) % 3 == 2 or it['kind'] == 'acc') else None
    return finish(big, glow, sparkle)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    force = '--force' in sys.argv
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = args[0] if args else os.path.join(root, 'tools', 'items.json')
    items = json.load(open(src, encoding='utf-8'))
    only = [a.split('=', 1)[1] for a in sys.argv if a.startswith('--only=')]
    made = skipped = 0
    for it in items:
        if only and not any(it['id'].startswith(o) for o in only[0].split(',')): continue
        path = os.path.join(root, it['image'])
        if os.path.exists(path) and not force: skipped += 1; continue
        os.makedirs(os.path.dirname(path), exist_ok=True)
        make(it).save(path, optimize=True)
        made += 1
    print(f'つくった: {made} まい ／ もとからあった（そのまま）: {skipped} まい')

if __name__ == '__main__':
    main()
