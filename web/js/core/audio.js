'use strict';
// ── js/core/audio.js ──
// 音频：Web Audio 合成音效 SFX、128 BPM 程序化背景音乐
// ===== audio =====
let ltLast = '';
let AC = null,
  master,
  noiseBuf,
  windG,
  windF,
  rollG,
  squealG,
  squealOsc,
  engG,
  engOsc,
  engF,
  muted = false;
function initAudio() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  if (AC) {
    AC.resume();
    return;
  }
  AC = new C();
  master = AC.createGain();
  master.gain.value = muted ? 0 : 0.9;
  master.connect(AC.destination);
  noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const loopN = () => {
    const s = AC.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    s.start();
    return s;
  };
  windF = AC.createBiquadFilter();
  windF.type = 'bandpass';
  windF.frequency.value = 500;
  windF.Q.value = 0.7;
  windG = AC.createGain();
  windG.gain.value = 0;
  loopN().connect(windF);
  windF.connect(windG);
  windG.connect(master);
  const rf = AC.createBiquadFilter();
  rf.type = 'lowpass';
  rf.frequency.value = 170;
  rollG = AC.createGain();
  rollG.gain.value = 0;
  loopN().connect(rf);
  rf.connect(rollG);
  rollG.connect(master);
  squealOsc = AC.createOscillator();
  squealOsc.type = 'sawtooth';
  squealOsc.frequency.value = 2300;
  const sf = AC.createBiquadFilter();
  sf.type = 'bandpass';
  sf.frequency.value = 2300;
  sf.Q.value = 14;
  squealG = AC.createGain();
  squealG.gain.value = 0;
  squealOsc.connect(sf);
  sf.connect(squealG);
  squealG.connect(master);
  squealOsc.start();
  engOsc = AC.createOscillator();
  engOsc.type = 'sawtooth';
  engOsc.frequency.value = 55;
  engF = AC.createBiquadFilter();
  engF.type = 'lowpass';
  engF.frequency.value = 260;
  engG = AC.createGain();
  engG.gain.value = 0;
  engOsc.connect(engF);
  engF.connect(engG);
  engG.connect(master);
  engOsc.start();
  startMusic();
}
// ===== background music: cheerful procedural loop (C major, 128 BPM) =====
let musG = null,
  musOn = true,
  musStep = 0,
  musNext = 0,
  musTimer = null;
const MBPM = 128,
  MSTEP = 60 / MBPM / 4;
const MCH = [
  [48, [60, 64, 67]],
  [45, [57, 60, 64]],
  [41, [57, 60, 65]],
  [43, [55, 59, 62]],
];
const MEL = [
  72, 0, 76, 0, 79, 0, 76, 0, 77, 76, 74, 0, 72, 0, 0, 0, 69, 0, 72, 0, 76, 0, 74, 72, 71, 0, 72, 0,
  69, 0, 0, 0, 65, 0, 69, 0, 72, 0, 74, 0, 76, 0, 74, 0, 72, 0, 69, 0, 71, 0, 74, 0, 79, 0, 77, 0,
  76, 0, 74, 0, 71, 0, 74, 0, 72, 0, 76, 0, 79, 0, 81, 0, 79, 77, 76, 0, 72, 0, 0, 0, 69, 0, 72, 0,
  76, 0, 77, 76, 74, 0, 72, 0, 69, 0, 72, 0, 65, 0, 69, 0, 72, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0,
  74, 0, 72, 0, 71, 0, 67, 0, 72, 0, 0, 0, 0, 0, 0, 0,
];
const mf = (n) => 440 * Math.pow(2, (n - 69) / 12);
function mNote(type, n, t, dur, vol, dest) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = type;
  o.frequency.value = mf(n);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(dest || musG);
  o.start(t);
  o.stop(t + dur + 0.05);
}
function mNoise(t, dur, vol, ft, fq) {
  const s = AC.createBufferSource();
  s.buffer = noiseBuf;
  const f = AC.createBiquadFilter();
  f.type = ft;
  f.frequency.value = fq;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(musG);
  s.start(t, Math.random() * 1.5);
  s.stop(t + dur + 0.02);
}
function mKick(t) {
  const o = AC.createOscillator(),
    g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(140, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
  g.gain.setValueAtTime(0.55, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
  o.connect(g);
  g.connect(musG);
  o.start(t);
  o.stop(t + 0.2);
}
function mSched(st, t) {
  const bar = Math.floor(st / 16) % 8,
    s = st % 16,
    ch = MCH[bar % 4];
  if (s % 4 === 0) mKick(t);
  if (s === 4 || s === 12) mNoise(t, 0.12, 0.22, 'bandpass', 1800);
  if (s % 2 === 1) mNoise(t, 0.04, 0.07, 'highpass', 7000);
  if (s % 2 === 0) mNote('triangle', ch[0] + (s % 4 === 2 ? 12 : 0), t, MSTEP * 1.8, 0.32);
  if (s === 2 || s === 6 || s === 10 || s === 14)
    ch[1].forEach((n) => mNote('square', n, t, MSTEP * 1.3, 0.028));
  const m = MEL[(bar * 16 + s) % MEL.length];
  if (m) {
    mNote('square', m, t, MSTEP * 1.9, 0.06);
    mNote('triangle', m + 12, t, MSTEP * 1.2, 0.035);
  }
}
function musTick() {
  if (!AC || !musG) return;
  const now = AC.currentTime;
  if (musNext < now) musNext = now + 0.05;
  while (musNext < now + 0.25) {
    if (musOn && !muted && document.visibilityState !== 'hidden') mSched(musStep, musNext);
    musStep++;
    musNext += MSTEP;
  }
}
function startMusic() {
  if (musG) return;
  musG = AC.createGain();
  musG.gain.value = musOn ? 0.55 : 0;
  musG.connect(master);
  musNext = AC.currentTime + 0.1;
  musTimer = setInterval(musTick, 60);
}
function setMusic(on) {
  musOn = on;
  try {
    localStorage.setItem('pel_music', on ? '1' : '0');
  } catch (e) {}
  if (musG) musG.gain.value = on ? 0.55 : 0;
}
try {
  musOn = localStorage.getItem('pel_music') !== '0';
} catch (e) {}

function env(node, t, peak, att, dec) {
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + att + dec);
  node.connect(g);
  g.connect(master);
  return g;
}
const ok = () => AC && !muted;
function osc(type, f, t, peak, att, dec, f2) {
  const o = AC.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + att + dec);
  env(o, t, peak, att, dec);
  o.start(t);
  o.stop(t + att + dec + 0.05);
  return o;
}
function noise(t, dur, type, f, peak) {
  const s = AC.createBufferSource();
  s.buffer = noiseBuf;
  const fl = AC.createBiquadFilter();
  fl.type = type;
  fl.frequency.value = f;
  s.connect(fl);
  env(fl, t, peak, 0.003, dur);
  s.start(t, Math.random(), dur + 0.1);
}
const SFX = {
  tick(v) {
    if (!ok()) return;
    noise(AC.currentTime, 0.025, 'highpass', 3800, v);
  },
  bell() {
    if (!ok()) return;
    const t = AC.currentTime;
    for (const d of [0, 0.16])
      for (const f of [2093, 2637, 3520]) osc('sine', f, t + d, f > 3000 ? 0.05 : 0.15, 0.004, 1.0);
  },
  horn() {
    if (!ok()) return;
    const t = AC.currentTime;
    for (const f of [392, 494]) {
      const o = AC.createOscillator();
      o.type = 'square';
      o.frequency.value = f;
      const fl = AC.createBiquadFilter();
      fl.type = 'lowpass';
      fl.frequency.value = 1400;
      o.connect(fl);
      env(fl, t, 0.09, 0.02, 0.45);
      o.start(t);
      o.stop(t + 0.55);
    }
  },
  bump() {
    if (!ok()) return;
    const t = AC.currentTime;
    osc('sine', 120, t, 0.5, 0.005, 0.18, 45);
    noise(t, 0.12, 'lowpass', 600, 0.3);
  },
  ding() {
    if (!ok()) return;
    const t = AC.currentTime;
    [1047, 1319, 1568].forEach((f, i) => osc('triangle', f, t + i * 0.07, 0.18, 0.005, 0.25));
  },
  power() {
    if (!ok()) return;
    const t = AC.currentTime;
    osc('sawtooth', 300, t, 0.12, 0.01, 0.5, 1400);
  },
  siren() {
    if (!ok()) return;
    const t = AC.currentTime;
    const o = AC.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(700, t);
    o.frequency.linearRampToValueAtTime(1300, t + 0.3);
    o.frequency.linearRampToValueAtTime(700, t + 0.6);
    o.frequency.linearRampToValueAtTime(1300, t + 0.9);
    const fl = AC.createBiquadFilter();
    fl.type = 'lowpass';
    fl.frequency.value = 2200;
    o.connect(fl);
    env(fl, t, 0.08, 0.02, 0.9);
    o.start(t);
    o.stop(t + 1);
  },
  squawk(t) {
    const a = AC.createOscillator(),
      b = AC.createOscillator();
    a.type = 'sawtooth';
    b.type = 'square';
    a.frequency.setValueAtTime(760, t);
    a.frequency.exponentialRampToValueAtTime(330, t + 0.32);
    b.frequency.setValueAtTime(1140, t);
    b.frequency.exponentialRampToValueAtTime(500, t + 0.32);
    const f = AC.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1300;
    f.Q.value = 2;
    a.connect(f);
    b.connect(f);
    env(f, t, 0.3, 0.02, 0.32);
    a.start(t);
    b.start(t);
    a.stop(t + 0.4);
    b.stop(t + 0.4);
  },
  crash() {
    if (!ok()) return;
    const t = AC.currentTime;
    noise(t, 0.8, 'lowpass', 900, 0.9);
    osc('sine', 110, t, 0.9, 0.005, 0.4, 40);
    [
      [420, 0.05],
      [987, 0.09],
      [1310, 0.3],
    ].forEach(([f, d]) => osc('triangle', f, t + d, 0.12, 0.003, 0.35));
    SFX.squawk(t + 0.08);
    SFX.squawk(t + 0.5);
  },
  ring() {
    if (!ok()) return;
    const t = AC.currentTime;
    for (let i = 0; i < 4; i++) {
      osc('square', 1320, t + i * 0.12, 0.05, 0.005, 0.08);
      osc('square', 1760, t + i * 0.12 + 0.06, 0.05, 0.005, 0.06);
    }
  },
  win() {
    if (!ok()) return;
    const t = AC.currentTime;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      osc('triangle', f, t + i * 0.12, 0.2, 0.01, 0.3)
    );
  },
  lose() {
    if (!ok()) return;
    const t = AC.currentTime;
    [392, 330, 262, 196].forEach((f, i) => osc('triangle', f, t + i * 0.18, 0.2, 0.01, 0.35));
  },
};
