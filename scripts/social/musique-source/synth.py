import numpy as np, wave, sys
SR = 44100
rng = np.random.default_rng(7)

def note(n): return 440.0 * 2 ** ((n - 69) / 12)
def env(length, a=0.01, d=0.3, s=0.6, r=0.3):
    t = np.arange(length) / SR; L = length / SR
    e = np.where(t < a, t / a, np.where(t < a + d, 1 - (1 - s) * (t - a) / d, s))
    rel = np.clip((L - t) / r, 0, 1)
    return e * rel

def pad(freq, dur, bright=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for det in (-0.06, 0.0, 0.07):
        f = freq * 2 ** (det / 12)
        ph = rng.uniform(0, 6.28)
        out += np.sin(2*np.pi*f*t + ph) + bright*np.sin(4*np.pi*f*t + ph) + bright*0.4*np.sin(6*np.pi*f*t)
    return out / 3 * env(n, a=0.8, d=0.5, s=0.85, r=0.9)

def keys(freq, dur, decay=1.6, bright=0.5):
    # piano / Rhodes : partiels qui décroissent
    n = int(dur * SR); t = np.arange(n) / SR
    out = np.zeros(n)
    for k, amp in enumerate([1, bright, bright*0.5, bright*0.25, bright*0.12], 1):
        out += amp * np.sin(2*np.pi*freq*k*t * (1 + 0.0004*k*k)) * np.exp(-t * decay * (1 + 0.6*k))
    out *= np.minimum(1, t / 0.004)
    return out * np.clip((dur - t) / 0.08, 0, 1)

def pluck(freq, dur):
    # Karplus-Strong
    n = int(dur * SR); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out

def bass(freq, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    s = np.sin(2*np.pi*freq*t) + 0.25*np.sin(4*np.pi*freq*t)
    return s * env(n, a=0.01, d=0.2, s=0.7, r=0.08)

def kick(dur=0.35):
    n = int(dur * SR); t = np.arange(n) / SR
    f = 45 + 90 * np.exp(-t * 30)
    return np.sin(2*np.pi*np.cumsum(f)/SR) * np.exp(-t * 9)

def hat(dur=0.06, level=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.normal(0, 1, n); x = np.diff(np.concatenate([[0], x]))
    return x * np.exp(-t * 70) * 0.25 * level

def clap(dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.normal(0, 1, n)
    e = np.exp(-t * 25) + 0.6*np.exp(-np.abs(t - 0.012) * 300)
    return x * e * 0.35

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y

def reverb(x, mix=0.25):
    out = np.zeros(len(x) + SR * 2)
    for d, g in ((1557, .80), (1617, .79), (1491, .81), (1422, .78), (1277, .80), (1356, .79)):
        y = np.zeros(len(out)); y[:len(x)] = x
        for i in range(d, len(out), d):  # peigne approximé par blocs
            pass
        # peigne : y[n] += g*y[n-d], par blocs vectorisés
        for s in range(d, len(out), d):
            e = min(s + d, len(out)); y[s:e] += g * y[s - d:e - d]
        out += y
    wet = out / 6
    dry = np.zeros(len(out)); dry[:len(x)] = x
    return dry * (1 - mix) + wet * mix * 0.35

def place(track, sig, t, gain=1.0):
    i = int(t * SR); e = min(len(track), i + len(sig))
    if i < len(track): track[i:e] += sig[:e - i] * gain

def chord(root, kind):
    return [root + i for i in {'maj7': (0, 4, 7, 11), 'm7': (0, 3, 7, 10), '6': (0, 4, 7, 9), 'add9': (0, 4, 7, 14), 'sus2': (0, 2, 7, 12), 'm9': (0, 3, 7, 14)}[kind]]

def song(name, bpm, prog, bars, style):
    beat = 60 / bpm; bar = 4 * beat; total = bars * bar
    L = int((total + 2) * SR)
    music = np.zeros(L); drums = np.zeros(L)
    for b in range(bars):
        root, kind = prog[b % len(prog)]
        notes = chord(root, kind); t0 = b * bar
        intro = b < 2
        if style in ('lumiere', 'calme', 'matin'):
            for n_ in notes: place(music, pad(note(n_), bar + 0.4, 0.2 if style != 'calme' else 0.1), t0, 0.10)
        if style == 'lumiere':
            arp = notes + [notes[1] + 12, notes[2] + 12, notes[1] + 12]
            for k in range(8):
                place(music, lowpass(pluck(note(arp[k % len(arp)] + 12), beat), 0.35), t0 + k * beat / 2, 0.30)
        if style == 'matin':
            for k, off in enumerate((0, 1.5, 2, 3)):
                n_ = notes[(k + b) % len(notes)] + 12
                place(music, keys(note(n_), beat * 1.6, decay=1.2), t0 + off * beat, 0.20)
        if style == 'calme':
            for k, off in enumerate((0, 0.75, 2, 2.5)):
                n_ = notes[k % len(notes)]
                place(music, keys(note(n_ + 12), beat * 2, decay=0.9, bright=0.3), t0 + off * beat, 0.22)
        if style == 'elan':
            for k in range(8):
                n_ = notes[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12
                place(music, keys(note(n_), beat * 0.5, decay=4, bright=0.7), t0 + k * beat / 2, 0.16)
            for n_ in notes[:3]: place(music, pad(note(n_), bar + 0.2, 0.35), t0, 0.06)
        # basse
        if not intro or style == 'elan':
            pat = {'lumiere': (0, 2.5), 'matin': (0, 2), 'calme': (0, 1.5, 2.5), 'elan': (0, 0.5, 1.5, 2, 2.5, 3.5)}[style]
            for off in pat: place(music, bass(note(root - 24 if root >= 48 else root - 12), beat * 0.9), t0 + off * beat, 0.32)
        # batterie
        if not intro:
            kicks = {'lumiere': (0, 2), 'matin': (0, 2.5), 'calme': (0, 2.25), 'elan': (0, 1, 2, 3)}[style]
            for off in kicks: place(drums, kick(), t0 + off * beat, 0.55)
            for k in range(8 if style != 'elan' else 16):
                step = beat / 2 if style != 'elan' else beat / 4
                place(drums, hat(level=0.8 if k % 2 else 0.45), t0 + k * step + (0.02 if style == 'calme' and k % 2 else 0), 0.7)
            if style in ('elan', 'lumiere'):
                for off in (1, 3): place(drums, clap(), t0 + off * beat, 0.5 if style == 'elan' else 0.25)
            if style == 'calme':
                for off in (1, 3): place(drums, clap(), t0 + off * beat, 0.18)
    music = reverb(music, 0.35 if style != 'elan' else 0.2)[:L]
    if style == 'calme':
        music = lowpass(music, 0.25)
    mix = music + drums * 0.9
    n = int(total * SR) + int(1.0 * SR)
    mix = mix[:n]
    mix[-int(1.5*SR):] *= np.linspace(1, 0, int(1.5*SR))
    mix = np.tanh(mix / (np.abs(mix).max() + 1e-9) * 1.6) * 0.85
    st = np.stack([mix, np.roll(mix, 220) * 0.98], 1)
    with wave.open(f'{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((st * 32767).astype(np.int16).tobytes())
    print(name, round(n / SR, 1), 's')

which = sys.argv[1]
if which == 'lumiere': song('lumiere', 100, [(60, 'maj7'), (57, 'm7'), (53, 'maj7'), (55, '6')], 18, 'lumiere')
if which == 'matin':   song('matin', 88, [(62, 'add9'), (59, 'm7'), (55, 'maj7'), (57, 'sus2')], 15, 'matin')
if which == 'elan':    song('elan', 116, [(53, 'maj7'), (55, '6'), (57, 'm7'), (52, 'm7')], 20, 'elan')
if which == 'calme':   song('calme', 78, [(57, 'm9'), (50, 'm7'), (55, 'maj7'), (52, 'm7')], 13, 'calme')
