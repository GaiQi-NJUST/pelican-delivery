'use strict';
// ── js/config/constants.js ──
// 世界常量：街区/道路尺寸、红绿灯计算、坐标环绕
const B = 120,
  RH = 9,
  R = 11,
  LO = 5.25;
const D = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
];
function hash(i, j) {
  const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
let T = 0;
function light(i, j, ax) {
  const ph = (T + hash(i, j) * 24) % 24;
  if (ax === 0) return ph < 9 ? 'g' : ph < 11 ? 'y' : 'r';
  return ph >= 12 && ph < 21 ? 'g' : ph >= 21 && ph < 23 ? 'y' : 'r';
}
function lightLeft(i, j, ax) {
  const ph = (T + hash(i, j) * 24) % 24;
  if (ax === 0) return ph < 9 ? 9 - ph : ph < 11 ? 11 - ph : 24 - ph;
  return ph < 12 ? 12 - ph : ph < 21 ? 21 - ph : ph < 23 ? 23 - ph : 36 - ph;
}
function wrap(b, c, s) {
  return c + ((((b - c) % s) + s * 1.5) % s) - s / 2;
}
