# -*- coding: utf-8 -*-
"""
gen_bg_images.py ― エリアの背景（テーマごと）の「仮の絵」を自動で作るツール
=================================================================
・空 → 遠くの山や建物 → 近くの丘 → 地面 → 小物（木・岩・結晶など）の じゅんに重ねて、
  ドット絵風の 896×1200 の背景を作ります（224×300 ドット × 4倍）。
・小物の形は Noto Color Emoji（Apache License 2.0）を ドット絵に ぬりなおしたもの。
・すでに画像が ある テーマは 上書きしません。 全部 作りなおす → --force
・つかいかた： python tools/gen_bg_images.py
"""
import os, sys, math, random
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
from gen_target_images import emoji, recolor, EF
from gen_item_images import hx

W, H, K = 224, 300, 4
HORIZON = 0.56          # 地面の はじまり（上から の わりあい）

# 空(上), 空(下), 遠景, 中景, 地面(上), 地面(下), 遠景の形, 小物, 光の粒, 小物の色ぬり
T = {
    'forest':   ('#7ec8f0', '#d6f0ff', '#4f8f6a', '#3a7a3a', '#5aa83a', '#2f6e24', 'trees',     ['🌳', '🌲', '🌳', '🍄', '🌿', '🪵'], None, None),
    'desert':   ('#f2b25a', '#ffe7a8', '#d89a5a', '#e2b26a', '#f0cc80', '#c8964a', 'dunes',     ['🌵', '🌵', '🪨', '🦴', '🌴'], None, None),
    'mountain': ('#8ec4ee', '#e2f2ff', '#7a8aa8', '#7a7468', '#9a8a6a', '#6a5a44', 'mountains', ['🪨', '🪨', '🌲', '⛏️'], None, None),
    'crystal':  ('#1e1a3a', '#3a3a6a', '#2e3a5a', '#3a4a6a', '#4a5470', '#2a2e44', 'crystals',  ['💎', '🔮', '💎', '🪨'], 'sparkle', 'crystal'),
    'beach':    ('#5ac0f6', '#c8f0ff', '#3a9ad8', '#62c0e8', '#f6e2a8', '#e2c070', 'sea',       ['🌴', '🐚', '🦀', '⛱️', '🪸'], None, None),
    'sea':      ('#0a2a5a', '#1e5ab0', '#123a7a', '#1a4a8a', '#2a5a8a', '#123462', 'reef',      ['🪸', '🐚', '🌿', '🪨', '🫧'], 'bubble', None),
    'snow':     ('#a8c8e8', '#eef6ff', '#bcd6ee', '#dce8f6', '#f6faff', '#c8dcee', 'mountains', ['🌲', '⛄', '🧊', '🌲'], 'snow', 'ice'),
    'volcano':  ('#3a0a0a', '#a8341a', '#2a1410', '#4a1e14', '#5a2a1a', '#2a100a', 'volcano',   ['🔥', '🪨', '🌋', '🔥'], 'ember', None),
    'sky':      ('#6ab0f0', '#e8f6ff', '#ffffff', '#d8ecff', '#a8d878', '#6aa04a', 'clouds',    ['☁️', '🌳', '🏛️', '🪶'], None, None),
    'sweets':   ('#ffb6d8', '#fff0f6', '#f6a0c8', '#ffd0e4', '#ffe6a0', '#e8a860', 'candy',     ['🍭', '🍬', '🧁', '🍩', '🍓'], 'sparkle', None),
    'poison':   ('#2a1a3a', '#6a4a8a', '#3a2a4a', '#4a3a5a', '#4a6a3a', '#2a3a1e', 'trees',     ['🍄', '🌿', '🪵', '🫧', '💀'], 'bubble', 'poison'),
    'bigtree':  ('#7ac0e0', '#d8f2d0', '#4a3a24', '#5a9a3a', '#6a9a3a', '#3a5a20', 'bigtree',   ['🌿', '🍄', '🍎', '🌱'], 'leaf', None),
    'mushroom': ('#1a2a3a', '#3a5a6a', '#2a3a4a', '#344a54', '#3a5a4a', '#1e3428', 'mushrooms', ['🍄', '🍄', '🌿', '🍄'], 'firefly', None),
    'earth':    ('#3a2414', '#6a4024', '#4a2e1a', '#5a3a20', '#7a5030', '#3a2414', 'cliffs',    ['🪨', '💎', '🦴', '⛏️'], 'dust', None),
    'ghost':    ('#0e1028', '#2a2c5a', '#1a1c38', '#24264a', '#2e3044', '#14162a', 'graves',    ['🪦', '🪦', '🕯️', '🌳', '💀'], 'wisp', 'ghost'),
    'machine':  ('#3a3028', '#8a6a4a', '#4a4038', '#5a5048', '#6a5e50', '#3a342c', 'factory',   ['⚙️', '🔩', '🛢️', '⚙️'], 'steam', None),
    'space':    ('#05051a', '#1a1a4a', '#2a2a5a', '#3a3a6a', '#4a4a6a', '#22223a', 'planets',   ['🪨', '⭐', '☄️', '🛸'], 'stars', None),
    'magic':    ('#2a1a5a', '#8a5ac0', '#3a2a6a', '#4a3a7a', '#5a4a8a', '#2a2048', 'city',      ['🔮', '📚', '🕯️', '✨'], 'sparkle', None),
    'ruins':    ('#c8a878', '#f6e8c8', '#a8987a', '#b8a888', '#9a8a6a', '#6a5a44', 'ruins',     ['🏛️', '🪨', '🛡️', '🌿'], 'dust', None),
    'demon':    ('#1a0408', '#5a0a1a', '#120408', '#2a0a12', '#2a1418', '#10060a', 'castle',    ['🔥', '⛓️', '💀', '🕯️'], 'ember', None),
}

def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make(theme, spec, rnd):
    sky0, sky1, far, mid, g0, g1, shape, props, parts, ptint = spec
    sky0, sky1, far, mid, g0, g1 = map(hx, (sky0, sky1, far, mid, g0, g1))
    im = Image.new('RGBA', (W, H), (0, 0, 0, 255)); d = ImageDraw.Draw(im)
    hy = int(H * HORIZON)
    for y in range(H):                                        # 空（ぼかさず 段々に）
        t = min(1, y / hy); t = round(t * 10) / 10
        d.line([(0, y), (W, y)], fill=lerp(sky0, sky1, t))
    # 太陽・月
    if theme in ('desert', 'beach', 'sky', 'forest', 'mountain', 'bigtree', 'snow', 'sweets', 'ruins'):
        cx, cy, r = rnd.randint(30, W - 30), rnd.randint(18, 50), rnd.randint(9, 13)
        d.ellipse([cx - r - 3, cy - r - 3, cx + r + 3, cy + r + 3], fill=lerp(sky1, (255, 255, 220), 0.6)); d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 250, 210))
    elif theme in ('ghost', 'demon', 'space', 'magic', 'mushroom', 'poison'):
        cx, cy, r = rnd.randint(30, W - 30), rnd.randint(20, 55), rnd.randint(8, 12)
        col = {'demon': (220, 60, 60), 'magic': (230, 200, 255), 'poison': (200, 255, 150)}.get(theme, (240, 240, 210))
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col); d.ellipse([cx - r + 5, cy - r - 2, cx + r + 5, cy + r - 2], fill=lerp(sky0, sky1, (cy - r) / hy))
    # 遠景
    def ridge(base, amp, freq, col, jag=False, seed=0):
        r2 = random.Random(seed); ph = r2.random() * 10
        pts = [(0, H)]
        for x in range(0, W + 4, 4 if jag else 2):
            if jag: y = base - amp * abs(math.sin(x * freq + ph)) - r2.randint(0, int(amp * 0.4))
            else: y = base - amp * (0.5 + 0.5 * math.sin(x * freq + ph)) - amp * 0.3 * math.sin(x * freq * 2.7 + ph * 2)
            pts.append((x, y))
        pts.append((W, H)); d.polygon(pts, fill=col)
    if shape in ('mountains', 'volcano', 'cliffs'):
        ridge(hy - 20, 55, 0.045, far, True, 1)
        if shape == 'mountains':                               # 雪の ぼうし
            pass
        if shape == 'volcano':
            cx = rnd.randint(70, 150); d.polygon([(cx - 70, hy), (cx - 14, hy - 110), (cx + 14, hy - 110), (cx + 70, hy)], fill=lerp(far, (0, 0, 0), 0.2))
            d.polygon([(cx - 14, hy - 110), (cx + 14, hy - 110), (cx + 6, hy - 90), (cx - 8, hy - 96)], fill=(255, 120, 30))
            for i in range(6): d.line([(cx + rnd.randint(-6, 6), hy - 110 + i * 14), (cx + rnd.randint(-10, 10), hy - 96 + i * 14)], fill=(255, 90 + i * 10, 20), width=2)
        ridge(hy + 4, 26, 0.07, mid, False, 2)
    elif shape == 'dunes':
        ridge(hy - 5, 30, 0.03, far, False, 3); ridge(hy + 8, 22, 0.05, mid, False, 4)
        cx = rnd.randint(40, 180); d.polygon([(cx - 40, hy - 4), (cx, hy - 50), (cx + 40, hy - 4)], fill=lerp(far, (120, 80, 40), 0.3)); d.polygon([(cx, hy - 50), (cx + 40, hy - 4), (cx + 8, hy - 4)], fill=lerp(far, (80, 50, 30), 0.4))
    elif shape in ('trees', 'bigtree'):
        for layer, (col, base, sz) in enumerate([(far, hy - 8, 12), (mid, hy + 6, 16)]):
            x = -10
            while x < W + 10:
                r = sz + rnd.randint(-3, 5); d.ellipse([x - r, base - r * 2.2, x + r, base], fill=col); d.rectangle([x - 2, base - 6, x + 2, base + 8], fill=lerp(col, (40, 25, 15), 0.5)); x += r + rnd.randint(2, 8)
        if shape == 'bigtree':
            tx = W // 2 + rnd.randint(-40, 40)
            d.rectangle([tx - 26, 0, tx + 26, hy + 10], fill=hx('#5a3a20')); d.rectangle([tx - 26, 0, tx - 12, hy + 10], fill=hx('#7a5230'))
            for i in range(6): d.line([(tx - 20 + i * 8, 0), (tx - 22 + i * 8, hy)], fill=hx('#4a2e18'), width=1)
            d.ellipse([tx - 120, -60, tx + 120, 60], fill=hx('#3a7a2a')); d.ellipse([tx - 90, -50, tx + 60, 40], fill=hx('#4e9a3a'))
    elif shape == 'sea':
        d.rectangle([0, hy - 30, W, hy], fill=far); d.rectangle([0, hy - 30, W, hy - 26], fill=lerp(far, (255, 255, 255), 0.4))
        for i in range(8): x = rnd.randint(0, W); d.line([(x, hy - 20 + rnd.randint(0, 15)), (x + 10, hy - 20 + rnd.randint(0, 15))], fill=lerp(far, (255, 255, 255), 0.5))
        ridge(hy + 6, 10, 0.05, mid, False, 5)
    elif shape == 'reef':
        for i in range(5):                                      # 光の すじ
            x = rnd.randint(0, W); d.polygon([(x, 0), (x + 10, 0), (x + 40, hy), (x + 26, hy)], fill=lerp(sky0, (120, 200, 255), 0.25))
        ridge(hy - 10, 30, 0.05, far, True, 6); ridge(hy + 6, 18, 0.07, mid, False, 7)
    elif shape == 'crystals':
        ridge(hy - 10, 30, 0.05, far, True, 8)
        for i in range(9):
            x = rnd.randint(0, W); h = rnd.randint(30, 80); w = rnd.randint(8, 16); c = rnd.choice([(90, 200, 240), (180, 120, 255), (120, 240, 220)])
            d.polygon([(x - w, hy + 4), (x, hy - h), (x + w, hy + 4)], fill=c); d.polygon([(x, hy - h), (x + w, hy + 4), (x + 2, hy + 4)], fill=lerp(c, (0, 0, 0), 0.3))
        ridge(hy + 8, 12, 0.07, mid, False, 9)
    elif shape == 'clouds':
        for i in range(10):
            x, y, r = rnd.randint(-20, W + 20), rnd.randint(hy - 70, hy + 5), rnd.randint(14, 28)
            d.ellipse([x - r * 1.6, y - r, x + r * 1.6, y + r], fill=far); d.ellipse([x - r * 1.4, y - r + 6, x + r * 1.2, y + r - 2], fill=mid)
        # 浮かぶ島
        cx, cy = rnd.randint(50, 170), rnd.randint(60, 110)
        d.polygon([(cx - 40, cy), (cx + 40, cy), (cx + 20, cy + 26), (cx, cy + 40), (cx - 22, cy + 22)], fill=hx('#8a6a4a')); d.rectangle([cx - 40, cy - 6, cx + 40, cy], fill=hx('#7ac85a'))
        d.rectangle([cx - 6, cy - 34, cx + 6, cy - 6], fill=hx('#e8e8f2')); d.polygon([(cx - 9, cy - 34), (cx, cy - 46), (cx + 9, cy - 34)], fill=hx('#5a7ad8'))
    elif shape == 'candy':
        ridge(hy - 4, 26, 0.04, far, False, 10)
        for i in range(6):
            x = rnd.randint(10, W - 10); h = rnd.randint(40, 80); c = rnd.choice([(255, 120, 170), (120, 200, 255), (255, 220, 90), (150, 230, 140)])
            d.rectangle([x - 2, hy - h, x + 2, hy], fill=(255, 255, 255)); d.ellipse([x - 12, hy - h - 12, x + 12, hy - h + 12], fill=c); d.ellipse([x - 6, hy - h - 6, x + 6, hy - h + 6], fill=(255, 255, 255))
        ridge(hy + 8, 14, 0.06, mid, False, 11)
    elif shape == 'mushrooms':
        for i in range(7):
            x = rnd.randint(0, W); h = rnd.randint(40, 110); r = rnd.randint(18, 36); c = rnd.choice([(80, 200, 220), (120, 240, 160), (190, 120, 240), (240, 120, 160)])
            d.rectangle([x - 4, hy - h, x + 4, hy], fill=(200, 200, 180)); d.ellipse([x - r, hy - h - r * 0.6, x + r, hy - h + r * 0.5], fill=c)
            d.ellipse([x - r * 0.4, hy - h - r * 0.4, x - r * 0.1, hy - h - r * 0.1], fill=(255, 255, 255))
        ridge(hy + 8, 14, 0.06, mid, False, 12)
    elif shape == 'graves':
        ridge(hy - 6, 20, 0.04, far, False, 13)
        for i in range(3):                                     # 枯れ木
            x = rnd.randint(10, W - 10); d.line([(x, hy), (x, hy - 50)], fill=lerp(far, (0, 0, 0), 0.4), width=4)
            for j in range(4): y = hy - 20 - j * 8; d.line([(x, y), (x + rnd.choice([-1, 1]) * rnd.randint(8, 18), y - rnd.randint(5, 12))], fill=lerp(far, (0, 0, 0), 0.4), width=2)
        ridge(hy + 8, 12, 0.07, mid, False, 14)
    elif shape in ('factory', 'city', 'castle', 'ruins'):
        x = -4
        while x < W:
            w = rnd.randint(14, 30); h = rnd.randint(40, 120); col = far
            if shape == 'ruins' and rnd.random() < 0.5: h //= 2
            d.rectangle([x, hy - h, x + w, hy + 4], fill=col)
            if shape == 'castle': [d.rectangle([x + i, hy - h - 5, x + i + 3, hy - h], fill=col) for i in range(0, w, 6)]; d.polygon([(x - 2, hy - h), (x + w // 2, hy - h - 26), (x + w + 2, hy - h)], fill=lerp(col, (120, 0, 20), 0.4)) if rnd.random() < 0.5 else None
            if shape == 'city': d.polygon([(x, hy - h), (x + w // 2, hy - h - 20), (x + w, hy - h)], fill=lerp(col, (180, 120, 255), 0.3))
            if shape == 'factory' and rnd.random() < 0.5: d.rectangle([x + w // 2 - 3, hy - h - 30, x + w // 2 + 3, hy - h], fill=lerp(col, (0, 0, 0), 0.3))
            if shape == 'ruins': d.line([(x + 3, hy - h), (x + 3, hy)], fill=lerp(col, (255, 255, 255), 0.2)); d.line([(x + w - 3, hy - h), (x + w - 3, hy)], fill=lerp(col, (0, 0, 0), 0.2))
            for _ in range(rnd.randint(1, 5)):                 # 窓の あかり
                wx, wy = x + rnd.randint(3, max(4, w - 5)), hy - rnd.randint(10, max(11, h - 6))
                wc = {'factory': (255, 200, 90), 'city': (200, 160, 255), 'castle': (255, 80, 60), 'ruins': lerp(col, (0, 0, 0), 0.4)}[shape]
                d.rectangle([wx, wy, wx + 2, wy + 3], fill=wc)
            x += w + rnd.randint(0, 6)
        ridge(hy + 8, 10, 0.06, mid, False, 15)
    elif shape == 'planets':
        for i in range(2):
            cx, cy, r = rnd.randint(20, W - 20), rnd.randint(40, hy - 40), rnd.randint(14, 30); c = rnd.choice([(200, 120, 255), (120, 180, 255), (255, 160, 120)])
            d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c); d.ellipse([cx - r + 6, cy - r + 4, cx + r, cy + r], fill=lerp(c, (0, 0, 0), 0.25)); d.ellipse([cx - r * 1.7, cy - 3, cx + r * 1.7, cy + 3], outline=(240, 220, 180))
        ridge(hy + 6, 18, 0.05, mid, True, 16)
    # 地面
    for y in range(hy + 6, H):
        t = (y - hy) / (H - hy); t = round(t * 8) / 8
        d.line([(0, y), (W, y)], fill=lerp(g0, g1, t))
    ridge(hy + 12, 6, 0.08, g0, False, 17)
    # 地面の もよう
    for _ in range(140):
        x, y = rnd.randint(0, W), rnd.randint(hy + 14, H)
        d.point((x, y), fill=lerp(lerp(g0, g1, (y - hy) / (H - hy)), (0, 0, 0) if rnd.random() < 0.6 else (255, 255, 255), 0.18))
    if theme == 'beach':
        d.polygon([(0, hy + 12), (W, hy + 2), (W, hy + 16), (0, hy + 22)], fill=lerp(g0, (255, 255, 255), 0.5))
    if theme in ('ghost', 'demon', 'poison', 'volcano', 'machine', 'ruins', 'magic', 'earth', 'sea'):
        # 道
        d.polygon([(W * 0.42, hy + 10), (W * 0.58, hy + 10), (W * 0.8, H), (W * 0.2, H)], fill=lerp(g0, g1, 0.5))
    else:
        d.polygon([(W * 0.45, hy + 10), (W * 0.55, hy + 10), (W * 0.72, H), (W * 0.28, H)], fill=lerp(g0, (230, 210, 160) if theme not in ('snow', 'crystal', 'space') else (255, 255, 255), 0.35))
    # 光の粒
    if parts == 'stars' or theme in ('ghost', 'demon', 'magic', 'crystal'):
        for _ in range(70 if parts == 'stars' else 30):
            x, y = rnd.randint(0, W), rnd.randint(0, hy - 20); d.point((x, y), fill=(255, 255, 240)) if rnd.random() < 0.8 else d.line([(x - 1, y), (x + 1, y)], fill=(255, 255, 255))
    # 小物（奥は小さく、手前は大きく。まん中の 下は あける＝モンスターが 立つところ）
    items = []
    for i in range(14):
        y = rnd.randint(hy + 8, H - 10); depth = (y - hy) / (H - hy)
        x = rnd.choice([rnd.randint(-8, int(W * 0.3)), rnd.randint(int(W * 0.7), W + 8)]) if depth > 0.25 else rnd.randint(-8, W + 8)
        items.append((y, x, depth))
    for y, x, depth in sorted(items):
        ch = rnd.choice(props); sz = int(14 + depth * 34)
        e = emoji(ch)
        if ptint: e = recolor(e, ptint, 0.45)
        if rnd.random() < 0.5: e = e.transpose(Image.FLIP_LEFT_RIGHT)
        w, h = e.size; k = sz / max(w, h); e = e.resize((max(1, int(w * k)), max(1, int(h * k))), Image.BOX)
        a = np.asarray(e).copy(); a[..., 3] = np.where(a[..., 3] > 120, 255, 0); e = Image.fromarray(a)
        # かげ と ふち
        sh = Image.new('RGBA', (e.size[0] + 2, e.size[1] + 2), (0, 0, 0, 0)); m = np.asarray(e)[..., 3] > 0
        o = np.zeros((e.size[1] + 2, e.size[0] + 2, 4), np.uint8)
        for dy, dx in ((0, 1), (2, 1), (1, 0), (1, 2)): o[dy:dy + e.size[1], dx:dx + e.size[0]][m] = (26, 16, 32, 255)
        sh = Image.fromarray(o); sh.alpha_composite(e, (1, 1))
        dd = ImageDraw.Draw(im); dd.ellipse([x - sz * 0.4, y - 2, x + sz * 0.4, y + 3], fill=lerp(g1, (0, 0, 0), 0.3))
        im.alpha_composite(sh, (int(x - sh.size[0] / 2), int(y - sh.size[1])))
    # まえの 粒
    pd = ImageDraw.Draw(im)
    for _ in range(40):
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        if parts == 'snow': pd.point((x, y), fill=(255, 255, 255)); pd.point((x + 1, y), fill=(230, 240, 255))
        elif parts == 'ember' and y > 40: pd.point((x, y), fill=rnd.choice([(255, 160, 40), (255, 90, 30)]))
        elif parts == 'bubble' and rnd.random() < 0.5: pd.ellipse([x, y, x + 3, y + 3], outline=(200, 230, 255))
        elif parts == 'sparkle' and rnd.random() < 0.4: pd.line([(x - 1, y), (x + 1, y)], fill=(255, 255, 255)); pd.line([(x, y - 1), (x, y + 1)], fill=(255, 255, 255))
        elif parts == 'firefly' and rnd.random() < 0.5: pd.point((x, y), fill=(200, 255, 140))
        elif parts == 'wisp' and rnd.random() < 0.25: pd.ellipse([x, y, x + 3, y + 4], fill=(150, 210, 255))
        elif parts == 'leaf' and rnd.random() < 0.3: pd.point((x, y), fill=(120, 200, 80))
        elif parts == 'steam' and y < hy and rnd.random() < 0.3: pd.ellipse([x, y, x + 6, y + 4], fill=(200, 190, 180))
        elif parts == 'dust' and rnd.random() < 0.3: pd.point((x, y), fill=(230, 210, 170))
    return im.convert('RGB').resize((W * K, H * K), Image.NEAREST)

def main():
    force = '--force' in sys.argv
    made = 0
    for theme, spec in T.items():
        path = os.path.join(ROOT, 'assets', 'images', 'bg', f'bg_{theme}.png')
        if os.path.exists(path) and not force: continue
        make(theme, spec, random.Random(theme)).save(path, optimize=True); made += 1
    print(f'つくった: {made} まい')

if __name__ == '__main__':
    main()
