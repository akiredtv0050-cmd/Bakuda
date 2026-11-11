# -*- coding: utf-8 -*-
"""
gen_audio.py ― 効果音（SE）と エリアのBGM の「仮の音」を 自動で作るツール
=================================================================
・ぜんぶ プログラムで 波形を 計算して作る チップチューン風の音です（素材の 借りものは ありません）。
・すでに ある ファイルは 上書きしません。 全部 作りなおす → --force
・つかいかた（Python 3 ＋ numpy ＋ ffmpeg が必要）
    python tools/gen_audio.py            … 足りない SE と BGM を作る
    python tools/gen_audio.py --only=se  … 効果音だけ
    python tools/gen_audio.py --only=bgm … BGM だけ
・BGM は ループ（くりかえし）しても つなぎめが わからないように 作っています。
・曲の ふんいき（テンポ・調・楽器）は 下の SONGS を書きかえると 変えられます。
"""
import os, sys, math, random, subprocess, tempfile, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 44100

# ================================================================
#  音の部品
# ================================================================
def t_arr(dur): return np.arange(int(SR * dur)) / SR

def env(n, a=0.005, d=0.08, s=0.6, r=0.05, hold=None):
    """ADSR（立ち上がり・へり・のこり・きえる）"""
    e = np.ones(n, np.float32)
    A, D, R = int(a * SR), int(d * SR), int(r * SR)
    H = n - R if hold is None else int(hold * SR)
    H = max(1, min(H, n))
    if A: e[:min(A, n)] = np.linspace(0, 1, min(A, n))
    if D and A < H: seg = e[A:min(A + D, H)]; e[A:min(A + D, H)] = np.linspace(1, s, len(seg))
    e[min(A + D, H):H] = s
    if H < n: e[H:] = np.linspace(e[H - 1] if H > 0 else s, 0, n - H)
    return e

def osc(kind, freq, dur, duty=0.5, vib=0.0, vib_rate=5.5, vib_delay=0.15):
    t = t_arr(dur)
    f = freq * (1 + vib * np.sin(2 * np.pi * vib_rate * t) * np.clip((t - vib_delay) / 0.2, 0, 1)) if vib else np.full_like(t, freq)
    ph = np.cumsum(f) / SR
    p = ph % 1.0
    if kind == 'sine': return np.sin(2 * np.pi * ph)
    if kind == 'tri': return 2 * np.abs(2 * p - 1) - 1
    if kind == 'saw': return 2 * p - 1
    if kind == 'pulse': return np.where(p < duty, 1.0, -1.0) * 0.8
    if kind == 'noise': return np.random.uniform(-1, 1, len(t))
    raise ValueError(kind)

def lowpass(x, cutoff):
    a = math.exp(-2 * math.pi * cutoff / SR)        # 1次の ローパス
    from scipy.signal import lfilter
    return lfilter([1 - a], [1, -a], x).astype(np.float32)

def highpass(x, cutoff): return (x - lowpass(x, cutoff)).astype(np.float32)

def fm_bell(freq, dur, ratio=3.5, index=2.5, decay=2.5):
    t = t_arr(dur); e = np.exp(-t * decay)
    return np.sin(2 * np.pi * freq * t + index * e * np.sin(2 * np.pi * freq * ratio * t)) * e

def pluck(freq, dur, bright=0.5):
    """カープラス・ストロング（ハープ・ギター風）"""
    n = int(SR * dur); N = max(2, int(SR / freq))
    buf = np.random.uniform(-1, 1, N) * 0.8
    buf = lowpass(buf.astype(np.float32), 2000 + 6000 * bright)
    out = np.empty(n, np.float32)
    # まとめて計算：周期ごとに 平均化
    cur = buf.copy(); i = 0
    while i < n:
        k = min(N, n - i); out[i:i + k] = cur[:k]; i += k
        cur = 0.996 * 0.5 * (cur + np.roll(cur, -1))
    return out

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def reverb(x, mix=0.25, size=1.0):
    y = x.copy()
    for d, g in ((0.0297, 0.5), (0.0371, 0.45), (0.0411, 0.42), (0.0437, 0.4), (0.089, 0.3), (0.131, 0.22), (0.173, 0.16)):
        n = int(d * size * SR)
        if n < len(x): y[n:] += x[:-n] * g * mix
    return y

def echo(x, sec, fb=0.35, mix=0.35):
    y = x.copy(); n = int(sec * SR)
    k = 1
    while k < 5 and n * k < len(x):
        y[n * k:] += x[:-n * k] * (fb ** (k - 1)) * mix; k += 1
    return y

# ================================================================
#  楽器（1音を 作る）
# ================================================================
def inst(name, midi, dur, vel=1.0):
    f = mtof(midi); n = int(SR * dur)
    if name == 'lead':      s = osc('pulse', f, dur, 0.25, vib=0.006) * env(n, 0.004, 0.08, 0.55, 0.06)
    elif name == 'lead2':   s = osc('pulse', f, dur, 0.125, vib=0.006) * env(n, 0.004, 0.06, 0.5, 0.05)
    elif name == 'flute':   s = (osc('tri', f, dur, vib=0.008) * 0.9 + osc('sine', f * 2, dur) * 0.15) * env(n, 0.03, 0.1, 0.8, 0.08)
    elif name == 'bell':    s = fm_bell(f, dur + 0.6, 3.5, 2.0, 3.0)[:n] if dur > 0 else np.zeros(0)
    elif name == 'glock':   s = fm_bell(f * 2, dur, 5.0, 1.2, 6.0)
    elif name == 'harp':    s = pluck(f, dur, 0.4) * 1.3
    elif name == 'guitar':  s = np.tanh(pluck(f, dur, 0.8) * 3) * 0.7
    elif name == 'organ':   s = (osc('sine', f, dur) + 0.5 * osc('sine', f * 2, dur) + 0.3 * osc('sine', f * 3, dur) + 0.2 * osc('sine', f * 4, dur)) * 0.5 * env(n, 0.02, 0.1, 0.9, 0.08)
    elif name == 'brass':   s = lowpass((osc('saw', f, dur, vib=0.005) * env(n, 0.04, 0.1, 0.8, 0.06)).astype(np.float32), 1800) * 1.4
    elif name == 'strings': s = lowpass(((osc('saw', f * 1.003, dur, vib=0.004) + osc('saw', f * 0.997, dur, vib=0.004)) * 0.5 * env(n, 0.15, 0.2, 0.85, 0.25)).astype(np.float32), 2600)
    elif name == 'pad':     s = lowpass(((osc('saw', f * 1.004, dur) + osc('saw', f * 0.996, dur) + osc('tri', f / 2, dur)) * 0.35 * env(n, 0.3, 0.3, 0.8, 0.4)).astype(np.float32), 1200)
    elif name == 'bass':    s = osc('tri', f, dur) * env(n, 0.003, 0.1, 0.8, 0.03)
    elif name == 'pbass':   s = osc('pulse', f, dur, 0.5) * 0.6 * env(n, 0.003, 0.08, 0.6, 0.03)
    elif name == 'arp':     s = osc('pulse', f, dur, 0.125) * env(n, 0.002, 0.05, 0.25, 0.02)
    elif name == 'sinarp':  s = osc('sine', f, dur) * env(n, 0.002, 0.15, 0.2, 0.05)
    elif name == 'dist':    s = np.tanh(osc('saw', f, dur) * 4 + osc('saw', f * 1.5, dur) * 2) * 0.45 * env(n, 0.005, 0.1, 0.8, 0.05)
    else: raise ValueError(name)
    return (s * vel).astype(np.float32)

def drum(kind, vel=1.0):
    if kind == 'k':
        dur = 0.22; t = t_arr(dur); f = 110 * np.exp(-t * 28) + 42
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    elif kind == 's':
        dur = 0.18; t = t_arr(dur)
        s = highpass(osc('noise', 1, dur).astype(np.float32), 1200) * np.exp(-t * 22) * 0.8 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.5
    elif kind == 'h':
        dur = 0.05; t = t_arr(dur); s = highpass(osc('noise', 1, dur).astype(np.float32), 7000) * np.exp(-t * 80) * 0.6
    elif kind == 'o':
        dur = 0.2; t = t_arr(dur); s = highpass(osc('noise', 1, dur).astype(np.float32), 6000) * np.exp(-t * 14) * 0.45
    elif kind == 't':   # タム
        dur = 0.25; t = t_arr(dur); f = 160 * np.exp(-t * 10) + 70
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 10)
    elif kind == 'c':   # シンバル
        dur = 1.0; t = t_arr(dur); s = highpass(osc('noise', 1, dur).astype(np.float32), 5000) * np.exp(-t * 4) * 0.35
    elif kind == 'b':   # かね（ボン）
        dur = 0.6; s = fm_bell(mtof(84), dur, 1.4, 3, 6) * 0.4
    elif kind == 'w':   # 木の音（カッ）
        dur = 0.06; t = t_arr(dur); s = np.sin(2 * np.pi * 1100 * t) * np.exp(-t * 90)
    else: raise ValueError(kind)
    return (s * vel).astype(np.float32)

# ================================================================
#  作曲（調・コード・メロディ）
# ================================================================
SCALES = {
    'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10],
    'hminor': [0, 2, 3, 5, 7, 8, 11], 'phrygian': [0, 1, 3, 5, 7, 8, 10], 'lydian': [0, 2, 4, 6, 7, 9, 11],
    'mixo': [0, 2, 4, 5, 7, 9, 10],
}

def chord_notes(root, scale, deg, octave=0):
    """deg（0=I）の 3和音（スケールの 1つとばし）"""
    sc = SCALES[scale]
    out = []
    for k in (0, 2, 4):
        i = deg + k; out.append(root + sc[i % 7] + 12 * (i // 7) + 12 * octave)
    return out

def scale_note(root, scale, idx):
    sc = SCALES[scale]; return root + sc[idx % 7] + 12 * (idx // 7)

RHYTHMS_44 = [  # 1小節ぶんの リズム（拍）。 負の数＝休み
    [1, 1, 1, 1], [1.5, 0.5, 1, 1], [0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 2], [2, 1, 1], [0.5, 0.5, 0.5, 0.5, 1, 1],
    [1.5, 0.5, 2], [1, 1, 2], [0.75, 0.25, 0.5, 0.5, 1, 1], [-0.5, 0.5, 1, 1, 1], [3, 1], [0.5, 1, 0.5, 1, 1],
]
RHYTHMS_34 = [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [0.5, 0.5, 1, 1], [3], [1, 0.5, 0.5, 1]]

def melody_bar(rnd, root, scale, deg, beats, prev_idx, rhythm, lo, hi, end_tonic=False, target=None):
    """1小節の メロディ。強い拍は コードの音、弱い拍は 目標（target）へ むかって すすむ"""
    notes = []; pos = 0.0; idx = prev_idx; same = 0
    ch = [(deg + k) for k in (0, 2, 4)]                  # コードの音（スケール番号）
    if target is None: target = rnd.randint(lo + 1, hi - 1)
    for i, r in enumerate(rhythm):
        if r < 0: notes.append((pos, -r, None)); pos += -r; continue
        strong = abs(pos - round(pos)) < 1e-6 and (round(pos) % 2 == 0)
        last = i == len(rhythm) - 1
        if end_tonic and last:
            cands = [7 * o for o in range(-1, 3) if lo <= 7 * o <= hi]
            nxt = min(cands, key=lambda c: abs(c - idx))
        elif strong or r >= 1.5:                          # 強い拍・長い音：コードの音（目標に ちかい方）
            cands = [c + 7 * o for c in ch for o in range(-1, 3) if lo <= c + 7 * o <= hi]
            nxt = min(cands, key=lambda c: abs(c - target) * 0.7 + abs(c - idx) * 0.5 + rnd.random() * 2)
        else:                                             # 弱い拍：目標へ 1〜2歩
            d = 1 if target > idx else -1 if target < idx else rnd.choice([-1, 1])
            nxt = idx + d * (2 if rnd.random() < 0.25 else 1)
            if rnd.random() < 0.15: nxt = idx - d          # たまに もどる
        nxt = max(lo, min(hi, nxt))
        if nxt == idx:
            same += 1
            if same >= 2: nxt = max(lo, min(hi, idx + rnd.choice([-1, 1, 2]))); same = 0
        else: same = 0
        idx = nxt
        if abs(idx - target) <= 1: target = rnd.randint(lo + 1, hi - 1)
        notes.append((pos, r, scale_note(root, scale, idx))); pos += r
    return notes, idx

# ================================================================
#  曲の設計図
#    key: 主音(MIDI)  scale  bpm  meter(3 or 4)
#    prog: A のコード（スケールの度数 0=I）  progB: B のコード
#    lead / lead2(2回目): 楽器   bass: 'bass'|'pbass'  bstyle: ベースの動き
#    drums: リズムの型   arp / pad / bells: あり・なし   rev: ひびき
# ================================================================
SONGS = {
    'field_forest':   dict(key=62, scale='dorian', bpm=112, meter=4, prog=[0, 6, 3, 0], progB=[3, 4, 0, 4], lead='flute', lead2='harp', bass='bass', bstyle='walk', drums='light', arp='harp', pad=True, rev=0.35),
    'field_desert':   dict(key=62, scale='hminor', bpm=118, meter=4, prog=[0, 0, 6, 0], progB=[3, 6, 4, 4], lead='lead2', lead2='flute', bass='pbass', bstyle='pulse8', drums='arab', arp=None, pad=False, rev=0.25),
    'field_mountain': dict(key=60, scale='major', bpm=104, meter=4, prog=[0, 4, 5, 3], progB=[3, 0, 3, 4], lead='brass', lead2='flute', bass='bass', bstyle='root58', drums='march', arp=None, pad=True, rev=0.4),
    'field_crystal':  dict(key=64, scale='lydian', bpm=96, meter=4, prog=[0, 1, 0, 1], progB=[5, 4, 3, 1], lead='glock', lead2='bell', bass='bass', bstyle='long', drums='none', arp='sinarp', pad=True, rev=0.6),
    'field_beach':    dict(key=65, scale='major', bpm=128, meter=4, prog=[0, 3, 4, 0], progB=[5, 3, 1, 4], lead='lead', lead2='guitar', bass='pbass', bstyle='bounce', drums='pop', arp='guitar', pad=False, rev=0.25),
    'field_sea':      dict(key=63, scale='dorian', bpm=88, meter=4, prog=[0, 3, 0, 3], progB=[5, 6, 3, 4], lead='bell', lead2='flute', bass='bass', bstyle='long', drums='none', arp='sinarp', pad=True, rev=0.7, echo=0.34),
    'field_snow':     dict(key=67, scale='major', bpm=92, meter=3, prog=[0, 5, 3, 4], progB=[1, 4, 0, 4], lead='glock', lead2='flute', bass='bass', bstyle='waltz', drums='waltz', arp='sinarp', pad=True, rev=0.55),
    'field_volcano':  dict(key=57, scale='phrygian', bpm=150, meter=4, prog=[0, 1, 0, 6], progB=[5, 6, 1, 0], lead='dist', lead2='lead', bass='pbass', bstyle='drive', drums='rock', arp=None, pad=False, rev=0.2),
    'field_sky':      dict(key=69, scale='lydian', bpm=120, meter=4, prog=[0, 1, 4, 3], progB=[5, 1, 3, 4], lead='flute', lead2='glock', bass='bass', bstyle='root58', drums='light', arp='arp', pad=True, rev=0.45),
    'field_sweets':   dict(key=67, scale='major', bpm=138, meter=4, prog=[0, 5, 3, 4], progB=[3, 4, 2, 5], lead='glock', lead2='lead', bass='pbass', bstyle='bounce', drums='pop', arp='arp', pad=False, rev=0.25),
    'field_poison':   dict(key=58, scale='hminor', bpm=100, meter=4, prog=[0, 5, 1, 4], progB=[3, 0, 5, 4], lead='lead2', lead2='organ', bass='bass', bstyle='creep', drums='swamp', arp=None, pad=True, rev=0.4),
    'field_bigtree':  dict(key=60, scale='mixo', bpm=108, meter=4, prog=[0, 6, 3, 0], progB=[3, 6, 0, 4], lead='flute', lead2='harp', bass='bass', bstyle='walk', drums='tribal', arp='harp', pad=True, rev=0.4),
    'field_mushroom': dict(key=62, scale='dorian', bpm=116, meter=3, prog=[0, 3, 0, 4], progB=[5, 3, 1, 4], lead='bell', lead2='lead2', bass='pbass', bstyle='waltz', drums='waltz', arp='sinarp', pad=True, rev=0.5),
    'field_earth':    dict(key=55, scale='minor', bpm=96, meter=4, prog=[0, 5, 6, 0], progB=[3, 4, 5, 4], lead='brass', lead2='organ', bass='bass', bstyle='root58', drums='heavy', arp=None, pad=True, rev=0.5),
    'field_ghost':    dict(key=61, scale='hminor', bpm=84, meter=3, prog=[0, 3, 4, 0], progB=[5, 1, 4, 4], lead='organ', lead2='bell', bass='bass', bstyle='waltz', drums='ghost', arp='sinarp', pad=True, rev=0.75),
    'field_machine':  dict(key=57, scale='minor', bpm=132, meter=4, prog=[0, 5, 6, 4], progB=[3, 0, 6, 4], lead='lead', lead2='lead2', bass='pbass', bstyle='pulse8', drums='machine', arp='arp', pad=False, rev=0.2),
    'field_space':    dict(key=60, scale='lydian', bpm=100, meter=4, prog=[0, 1, 5, 4], progB=[3, 1, 0, 1], lead='bell', lead2='flute', bass='bass', bstyle='long', drums='space', arp='sinarp', pad=True, rev=0.7, echo=0.45),
    'field_magic':    dict(key=64, scale='hminor', bpm=112, meter=3, prog=[0, 3, 4, 0], progB=[5, 3, 1, 4], lead='harp', lead2='glock', bass='bass', bstyle='waltz', drums='waltz', arp='harp', pad=True, rev=0.55),
    'field_ruins':    dict(key=62, scale='minor', bpm=90, meter=4, prog=[0, 6, 5, 4], progB=[3, 0, 3, 4], lead='strings', lead2='brass', bass='bass', bstyle='long', drums='march', arp='harp', pad=True, rev=0.65),
    'field_demon':    dict(key=57, scale='hminor', bpm=156, meter=4, prog=[0, 5, 3, 4], progB=[0, 1, 5, 4], lead='organ', lead2='dist', bass='pbass', bstyle='drive', drums='rock', arp='arp', pad=True, rev=0.3),
    'ending':         dict(key=65, scale='major', bpm=84, meter=4, prog=[0, 4, 5, 3], progB=[3, 4, 2, 5, 1, 4, 0, 0], lead='flute', lead2='strings', bass='bass', bstyle='long', drums='ballad', arp='harp', pad=True, rev=0.6, bars=32),
}

DRUMS = {   # 1小節（16分 or 12分）の パターン。文字＝音、'.'＝なし
    'none':   [],
    'light':  ['k.......k.......', '....s.......s...', 'h.h.h.h.h.h.h.h.'],
    'pop':    ['k.......k.k.....', '....s.......s...', 'h.hhh.hhh.hhh.hh'],
    'rock':   ['k.k...k.k.k...k.', '....s.......s..s', 'hhhhhhhhhhhhhhhh'],
    'march':  ['k.......k.......', '....s.s.....s.ss', '..........t.t...'],
    'arab':   ['k..k..k...k.....', '....w.......w.w.', 't.....t...t.t...'],
    'swamp':  ['k.....k...k.....', '....w.......w...', '..h...h...h...h.'],
    'tribal': ['k...t...k..tt...', '..w...w...w...w.', ''],
    'heavy':  ['k.......k..k....', '........s.......', 'o...o...o...o...'],
    'ghost':  ['k...........', '......w.....', 'b...........'],
    'waltz':  ['k...........', '....s...s...', 'h.h.h.h.h.h.'],
    'machine':['k...k...k...k...', '....s.......s...', 'hhohhhohhhohhhoh'],
    'space':  ['k.......k.......', '............s...', '..h...h...h...h.'],
    'ballad': ['k.......k.......', '....s.......s...', 'h...h...h...h...'],
}

def mix_into(buf, s, start):
    i = int(start * SR)
    if i >= len(buf): return
    n = min(len(s), len(buf) - i)
    buf[i:i + n] += s[:n]

def compose(name, cfg):
    rnd = random.Random(name)
    np.random.seed(abs(hash(name)) % (2 ** 31))
    root, scale, bpm, meter = cfg['key'], cfg['scale'], cfg['bpm'], cfg['meter']
    beat = 60.0 / bpm; bar = beat * meter
    bars = cfg.get('bars', 16)
    progA, progB = cfg['prog'], cfg['progB']
    # A A' B A'' の 16小節 × 2回目は 楽器を かえて もう1周
    form = []
    for sec in ('A', 'A2', 'B', 'A3'):
        p = progB if sec == 'B' else progA
        for i in range(4): form.append((sec, p[i % len(p)] if len(p) == 4 else p[(i + (4 if sec == 'A3' else 0)) % len(p)]))
    if bars == 32:   # エンディングは 長め
        form2 = []
        for sec in ('A', 'A2', 'B', 'B2', 'A3', 'A4'):
            p = progB if sec.startswith('B') else progA
            for i in range(4 if sec[0] == 'A' else 8): form2.append((sec, p[i % len(p)]))
        form = form2[:32]
    passes = 2
    total = bar * len(form) * passes
    tail = 3.0
    L = int(SR * (total + tail))
    lead = np.zeros(L, np.float32); harm = np.zeros(L, np.float32); bass = np.zeros(L, np.float32)
    drm = np.zeros(L, np.float32); arp = np.zeros(L, np.float32); pad = np.zeros(L, np.float32)
    rhythms = RHYTHMS_34 if meter == 3 else RHYTHMS_44
    motifs = {s: [rnd.choice(rhythms) for _ in range(4)] for s in ('A', 'B')}
    lo, hi = 2, 11                                   # メロディの音域（スケール番号）
    base = root + 12 if root < 60 else root          # メロディは 中音域
    melody = []                                      # 1周ぶんの メロディを 先に決める
    idx = 4
    for bi, (sec, deg) in enumerate(form):
        key = 'B' if sec.startswith('B') else 'A'
        rh = motifs[key][bi % 4]
        if sec in ('A2', 'A3', 'A4') and bi % 4 == 3: rh = [2, 2] if meter == 4 else [3]
        arc = [5, 8, 10, 6] if key == 'A' else [9, 11, 8, 7]       # フレーズの 山（上がって 下がる）
        notes, idx = melody_bar(rnd, base, scale, deg, meter, idx, rh, lo, hi, end_tonic=(bi % 4 == 3 and sec != 'B'), target=arc[bi % 4] + rnd.randint(-1, 1))
        melody.append(notes)
    for ps in range(passes):
        off0 = ps * bar * len(form)
        L1 = cfg['lead'] if ps == 0 else cfg['lead2']
        for bi, (sec, deg) in enumerate(form):
            t0 = off0 + bi * bar
            ch = chord_notes(root, scale, deg)
            # メロディ
            for pos, dur, m in melody[bi]:
                if m is None: continue
                mm = m + (12 if (ps == 1 and L1 in ('glock', 'bell', 'flute') and m < 76) else 0)
                mix_into(lead, inst(L1, mm, dur * beat * 0.95, 0.55), t0 + pos * beat)
                if ps == 1 and rnd.random() < 0.6:   # 2回目は ハモり
                    mix_into(harm, inst('flute' if L1 != 'flute' else 'harp', mm - 4 if mm - 4 in [scale_note(root, scale, i) for i in range(-14, 30)] else mm - 3, dur * beat * 0.9, 0.18), t0 + pos * beat)
            # ベース
            bl = cfg['bstyle']; r0 = ch[0] - 24 if ch[0] - 24 >= 33 else ch[0] - 12
            if bl == 'walk':     seq = [(0, r0), (1, r0 + 7), (2, r0 + 12), (3, r0 + 7)]
            elif bl == 'pulse8': seq = [(i * 0.5, r0 + (12 if i % 4 == 3 else 0)) for i in range(meter * 2)]
            elif bl == 'root58': seq = [(0, r0), (1.5, r0 + 7), (2, r0), (3, r0 + 7)]
            elif bl == 'bounce': seq = [(0, r0), (1, r0 + 12), (1.5, r0 + 7), (2, r0), (3, r0 + 12), (3.5, r0 + 7)]
            elif bl == 'drive':  seq = [(i * 0.5, r0) for i in range(8)]
            elif bl == 'creep':  seq = [(0, r0), (1, r0 + 1), (2, r0 + 3), (3, r0 + 1)]
            elif bl == 'waltz':  seq = [(0, r0)]
            else:                seq = [(0, r0)]
            seq = [(p, m) for p, m in seq if p < meter]
            for j, (p, m) in enumerate(seq):
                nxt = seq[j + 1][0] if j + 1 < len(seq) else meter
                mix_into(bass, inst(cfg['bass'], m, (nxt - p) * beat * 0.9, 0.5), t0 + p * beat)
            # 和音（ワルツは 2・3拍目に 刻む）
            if cfg['bstyle'] == 'waltz':
                for p in (1, 2):
                    for m in ch: mix_into(arp, inst('harp' if cfg.get('arp') == 'harp' else 'sinarp', m, beat * 0.8, 0.12), t0 + p * beat)
            # アルペジオ
            a = cfg.get('arp')
            if a and cfg['bstyle'] != 'waltz':
                step = 0.5 if bpm < 120 else 0.25 if a == 'arp' else 0.5
                pat = ch + [ch[1] + 12, ch[0] + 12, ch[1]] if a != 'harp' else ch + [ch[0] + 12]
                k = 0; p = 0.0
                while p < meter - 1e-6:
                    m = pat[k % len(pat)] + (12 if a in ('sinarp', 'arp') else 0)
                    mix_into(arp, inst(a, m, step * beat * 1.6 if a != 'arp' else step * beat * 0.9, 0.14 if a != 'harp' else 0.22), t0 + p * beat)
                    p += step; k += 1
            # パッド
            if cfg.get('pad'):
                for m in ch: mix_into(pad, inst('pad', m, bar * 1.02, 0.1), t0)
            # ドラム
            pat = DRUMS.get(cfg['drums'], [])
            if pat and not (ps == 0 and bi < 2 and cfg['drums'] not in ('rock', 'machine')):
                steps = len(pat[0]) if pat[0] else 16
                for line in pat:
                    for si, chs in enumerate(line):
                        if chs == '.': continue
                        v = 0.7 if chs in 'hwo' else 0.9
                        mix_into(drm, drum(chs, v * (0.8 + 0.2 * rnd.random())), t0 + si * bar / steps)
                if bi % 8 == 7 and cfg['drums'] in ('rock', 'pop', 'march', 'heavy', 'machine'):
                    for si in range(4): mix_into(drm, drum('t' if si < 3 else 's', 0.7), t0 + (meter - 1 + si * 0.25) * beat)
                if bi == 0 and cfg['drums'] in ('rock', 'pop', 'ballad', 'heavy'): mix_into(drm, drum('c', 0.8), t0)
    # まとめる
    rv = cfg.get('rev', 0.3)
    leadfx = lead + harm
    if cfg.get('echo'): leadfx = echo(leadfx, cfg['echo'] * 60 / bpm * 2, 0.4, 0.3)
    leadfx = reverb(leadfx, rv, 1.2)
    out = leadfx * 0.9 + reverb(arp, rv, 1.0) * 0.9 + reverb(pad, rv, 1.5) * 0.9 + lowpass(bass, 1500) * 1.0 + drm * 0.55
    # ループの つなぎめ：あまった おわりの ひびきを 頭に かさねる
    N = int(SR * total)
    loop = out[:N].copy(); loop[:L - N] += out[N:]
    loop = highpass(loop, 30)
    peak = np.max(np.abs(loop)) + 1e-9
    loop = np.tanh(loop / peak * 1.4) / np.tanh(1.4) * 0.78
    return loop

# ================================================================
#  効果音
# ================================================================
def build_se():
    S = {}
    def seq(notes, kind='pulse', duty=0.25, gap=None, decay=0.08):
        parts = []
        for m, d in notes:
            n = int(SR * d)
            if kind == 'bell': s = fm_bell(mtof(m), d, 3.5, 1.8, 7)
            else: s = osc(kind, mtof(m), d, duty) * env(n, 0.002, decay, 0.4, 0.02)
            parts.append(s)
        return np.concatenate(parts)
    t = t_arr
    # tap：ポッ
    n = int(SR * 0.06); f = 1500 * np.exp(-t(0.06) * 40) + 600
    S['tap'] = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.05, 0, 0.005) * 0.7
    # open：ピロン↑
    S['open'] = seq([(76, 0.06), (83, 0.12)], 'pulse', 0.25) * 0.5
    # close：ポロン↓
    S['close'] = seq([(79, 0.06), (72, 0.1)], 'pulse', 0.25) * 0.45
    # change：カチッ
    S['change'] = seq([(84, 0.03), (91, 0.06)], 'pulse', 0.125, decay=0.03) * 0.4
    # hit：バシッ（ノイズ＋低音）
    d = 0.12; n = int(SR * d); tt = t(d)
    S['hit'] = (highpass(osc('noise', 1, d).astype(np.float32), 900) * np.exp(-tt * 35) * 0.9 + np.sin(2 * np.pi * np.cumsum(180 * np.exp(-tt * 20) + 50) / SR) * np.exp(-tt * 18) * 0.8)
    # defeat：ドカーン＋キラッ
    d = 0.5; tt = t(d)
    boom = lowpass(osc('noise', 1, d).astype(np.float32), 1500) * np.exp(-tt * 7) + np.sin(2 * np.pi * np.cumsum(120 * np.exp(-tt * 6) + 40) / SR) * np.exp(-tt * 6)
    kira = np.pad(seq([(84, 0.07), (88, 0.07), (91, 0.12)], 'bell'), (int(SR * 0.08), 0)); kira = np.pad(kira, (0, max(0, len(boom) - len(kira))))[:len(boom)]
    S['defeat'] = boom * 0.8 + kira * 0.35
    # craft：キラキラ アルペジオ
    S['craft'] = seq([(72, 0.07), (76, 0.07), (79, 0.07), (84, 0.3)], 'bell') * 0.7
    # levelup：ファンファーレ
    S['levelup'] = seq([(72, 0.08), (76, 0.08), (79, 0.08), (84, 0.08), (79, 0.06), (84, 0.34)], 'pulse', 0.25, decay=0.15) * 0.45
    # timeover：ブブー
    S['timeover'] = seq([(52, 0.18), (47, 0.32)], 'saw', decay=0.3) * 0.35
    # error：ブッ
    S['error'] = seq([(45, 0.12)], 'pulse', 0.5, decay=0.1) * 0.35
    # get：ピコン
    S['get'] = seq([(81, 0.05), (88, 0.12)], 'pulse', 0.125) * 0.45
    # anvil：カーン！（金属の ひびき）
    d = 0.6; tt = t(d)
    ring = sum(np.sin(2 * np.pi * f * tt) * a * np.exp(-tt * k) for f, a, k in ((1480, 0.5, 6), (2210, 0.35, 8), (3520, 0.25, 11), (5090, 0.15, 14)))
    clank = highpass(osc('noise', 1, d).astype(np.float32), 2500) * np.exp(-tt * 60)
    S['anvil'] = ring * 0.7 + clank * 0.6
    out = {}
    for k, v in S.items():
        v = np.asarray(v, np.float32); v = v / (np.max(np.abs(v)) + 1e-9) * 0.85
        fade = min(len(v), int(SR * 0.01)); v[-fade:] *= np.linspace(1, 0, fade)
        out[k] = v
    return out

# ================================================================
def write_mp3(path, x, kbps):
    x = np.clip(x, -1, 1)
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf: wpath = tf.name
    with wave.open(wpath, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wpath, '-codec:a', 'libmp3lame', '-b:a', f'{kbps}k', '-ac', '1', path], check=True)
    os.remove(wpath)

def main():
    force = '--force' in sys.argv
    only = [a.split('=', 1)[1] for a in sys.argv if a.startswith('--only=')]
    only = only[0] if only else 'se,bgm'
    made = []
    if 'se' in only:
        for k, v in build_se().items():
            p = os.path.join(ROOT, 'assets', 'se', f'{k}.mp3')
            if os.path.exists(p) and not force: continue
            write_mp3(p, v, 96); made.append(p)
    if 'bgm' in only:
        for name, cfg in SONGS.items():
            p = os.path.join(ROOT, 'assets', 'bgm', f'{name}.mp3')
            if os.path.exists(p) and not force: continue
            write_mp3(p, compose(name, cfg), 64); made.append(p)
            print('  ♪', name)
    print(f'つくった: {len(made)} こ')

if __name__ == '__main__':
    main()
