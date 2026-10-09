#!/usr/bin/env python3
"""Lay the recorded or synthesised voice-over onto the film.

Expects one file per line of cues.json["vo"], in order, in vo/<lang>/NN.(wav|mp3|m4a)
(NN = 00, 01, …). Each line is trimmed of silence, levelled, fitted to its slot
(a gentle speed-up only if it overruns the next line), placed on its cue, and the
sound layer is ducked under it. The result is mastered for social (−14 LUFS,
−1 dBTP) and muxed onto the master: ../kizzo-film-v4-<LANG>-9x16-VO.mp4

  python3 mix_vo.py fr [--video ../kizzo-film-v4-FR-9x16.mp4]
"""
import glob, json, os, subprocess, sys, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
SR = 48000
Q = json.load(open(os.path.join(HERE, 'cues.json')))
VO = Q['vo']

def decode(path, tempo=1.0):
    af = ['silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02',
          'areverse', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06', 'areverse',
          'highpass=f=70', 'acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2']
    if abs(tempo - 1) > 1e-3: af.append(f'atempo={tempo:.4f}')
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-af', ','.join(af), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, '<f4').astype(np.float64)

def read_wav(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, w.getnchannels()) / 32767
    return x

def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else 'fr'
    video = sys.argv[sys.argv.index('--video') + 1] if '--video' in sys.argv else os.path.join(OUT, f'kizzo-film-v4-{lang.upper()}-9x16.mp4')
    files = sorted(glob.glob(os.path.join(HERE, 'vo', lang, '[0-9][0-9].*')))
    assert len(files) == len(VO), f'{len(files)} files for {len(VO)} lines in vo/{lang}/'
    bed = read_wav(os.path.join(HERE, 'build', 'kizzo-sfx-stem.wav'))           # the sound layer, not yet ducked
    N = len(bed); voice = np.zeros(N); duck = np.zeros(N)
    for i, (v, f) in enumerate(zip(VO, files)):
        x = decode(f)
        nxt = VO[i + 1]['t'] if i + 1 < len(VO) else Q['duration'] - .4
        slot = nxt - v['t'] - .08
        if len(x) / SR > slot:                                                   # overruns: speed up a little, never more than 18 %
            x = decode(f, min(1.18, len(x) / SR / slot))
        rms = np.sqrt(np.mean(x ** 2)) + 1e-9
        x *= 10 ** (-18 / 20) / rms                                              # level every line the same
        i0 = int(v['t'] * SR); x = x[:N - i0]
        voice[i0:i0 + len(x)] += x
        duck[max(0, i0 - int(.12 * SR)):i0 + len(x) + int(.2 * SR)] = 1
        print(f"{i:02d} {v['t']:5.2f}s  {len(x) / SR:4.2f}s / slot {slot:4.2f}s  {v.get(lang, v['fr'])}")
    k = np.ones(int(.15 * SR)) / int(.15 * SR); duck = np.convolve(duck, k, mode='same')
    mix = bed * (1 - .65 * duck)[:, None] + voice[:, None] * np.array([1, 1])     # the bed dips about 9 dB under the voice
    tmp = os.path.join(HERE, 'build', f'mix-{lang}.wav')
    with wave.open(tmp, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(mix / max(1.0, np.abs(mix).max()), -1, 1) * 32767).astype('<i2').tobytes())
    # master: two-pass loudness to −14 LUFS integrated, −1 dBTP
    meas = subprocess.run(['ffmpeg', '-hide_banner', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'],
                          capture_output=True, text=True).stderr
    m = json.loads(meas[meas.rindex('{'):meas.rindex('}') + 1])
    ln = (f"loudnorm=I=-14:TP=-1:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    dst = os.path.join(OUT, f'kizzo-film-v4-{lang.upper()}-9x16-VO.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-i', tmp, '-map', '0:v', '-map', '1:a',
                    '-af', ln, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', dst], check=True)
    print('wrote', dst)

if __name__ == '__main__':
    main()
