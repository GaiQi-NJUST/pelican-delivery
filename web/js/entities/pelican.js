'use strict';
// ── js/entities/pelican.js ──
// 鹈鹕：骑行模型、腿部 IK、喉囊、服饰配件 outfit
// ===== player: pelican on bicycle =====
const player = new THREE.Group();
scene.add(player);
const lean = new THREE.Group();
lean.scale.setScalar(0.82);
player.add(lean);
const bike = new THREE.Group();
lean.add(bike);
const red = M(0xc41e3a, { metalness: 0.55, roughness: 0.3 }),
  chrome = M(0xe0e0e0, { metalness: 1, roughness: 0.18 }),
  blackM = M(0x161616, { roughness: 0.8 }),
  rubber = M(0x1b1b1b, { roughness: 0.95 }),
  whiteP = M(0xffffff, { roughness: 0.4 });
const RW = V(-0.56, 0.36),
  FW = V(0.58, 0.36),
  BB = V(0, 0.33),
  ST = V(-0.17, 0.93),
  HT = V(0.43, 0.92),
  HB = V(0.48, 0.7);
tube(BB, ST, 0.028, 0.024, red, bike);
tube(BB, HB, 0.035, 0.03, red, bike);
tube(ST.clone().add(V(0.01, -0.03)), HT, 0.025, 0.023, red, bike);
tube(HB, HT, 0.033, 0.033, red, bike);
tube(BB.clone().lerp(HB, 0.42), BB.clone().lerp(HB, 0.6), 0.0355, 0.0335, whiteP, bike);
for (const z of [-0.065, 0.065]) {
  tube(V(BB.x, BB.y, z * 0.5), V(RW.x, RW.y, z), 0.015, 0.011, red, bike);
  tube(V(ST.x + 0.015, ST.y - 0.06, z * 0.4), V(RW.x, RW.y, z), 0.012, 0.01, red, bike);
  mesh(
    taper(
      new THREE.QuadraticBezierCurve3(
        V(HB.x, HB.y, z * 0.45),
        V(0.53, 0.5, z),
        V(FW.x, FW.y, z * 0.9)
      ),
      10,
      0.019,
      0.011,
      8
    ),
    red,
    bike
  );
}
tube(ST, ST.clone().add(V(-0.025, 0.11)), 0.014, 0.014, chrome, bike);
tube(HT, V(0.45, 1.0), 0.017, 0.017, chrome, bike);
tube(V(0.45, 1.0), V(0.53, 1.01), 0.015, 0.015, chrome, bike);
const tape = M(0x101010, { roughness: 0.6 });
tube(V(0.53, 1.01, -0.2), V(0.53, 1.01, 0.2), 0.013, 0.013, tape, bike);
for (const s of [-1, 1])
  mesh(
    taper(
      new THREE.CubicBezierCurve3(
        V(0.53, 1.01, s * 0.2),
        V(0.68, 1.01, s * 0.21),
        V(0.7, 0.86, s * 0.215),
        V(0.57, 0.85, s * 0.22)
      ),
      14,
      0.0135,
      0.013,
      8
    ),
    tape,
    bike
  );
const shp = new THREE.Shape();
shp.moveTo(-0.13, 0.07);
shp.quadraticCurveTo(-0.16, 0, -0.13, -0.07);
shp.lineTo(0, -0.05);
shp.quadraticCurveTo(0.15, -0.02, 0.16, 0);
shp.quadraticCurveTo(0.15, 0.02, 0, 0.05);
shp.closePath();
const saddle = mesh(
  new THREE.ExtrudeGeometry(shp, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.014,
    bevelSize: 0.014,
    bevelSegments: 3,
    curveSegments: 8,
  }),
  M(0x202020, { roughness: 0.5 }),
  bike
);
saddle.rotation.x = PI / 2;
saddle.position.set(-0.2, 1.075, 0);
const spokeG = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 4);
function wheel(c) {
  const g = new THREE.Group();
  g.position.copy(c);
  bike.add(g);
  mesh(new THREE.TorusGeometry(0.345, 0.028, 12, 56), rubber, g);
  mesh(new THREE.TorusGeometry(0.322, 0.011, 8, 56), chrome, g);
  const hub = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.11, 12), chrome, g);
  hub.rotation.x = PI / 2;
  const sp = new THREE.InstancedMesh(spokeG, chrome, 28);
  sp.castShadow = true;
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * PI * 2,
      z = i % 2 ? 0.034 : -0.034,
      o = i % 2 ? 0.2 : -0.2;
    seg(
      dummy,
      V(Math.cos(a + o) * 0.03, Math.sin(a + o) * 0.03, z),
      V(Math.cos(a) * 0.318, Math.sin(a) * 0.318, z * 0.15)
    );
    dummy.updateMatrix();
    sp.setMatrixAt(i, dummy.matrix);
  }
  g.add(sp);
  return g;
}
const wR = wheel(RW),
  wF = wheel(FW);
const crank = new THREE.Group();
crank.position.copy(BB);
bike.add(crank);
const ring = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.006, 36), chrome, crank);
ring.rotation.x = PI / 2;
ring.position.z = 0.075;
const teeth = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.014, 0.005), chrome, 40);
for (let i = 0; i < 40; i++) {
  const a = (i / 40) * PI * 2;
  dummy.position.set(Math.cos(a) * 0.106, Math.sin(a) * 0.106, 0.075);
  dummy.rotation.set(0, 0, a);
  dummy.scale.set(1, 1, 1);
  dummy.updateMatrix();
  teeth.setMatrixAt(i, dummy.matrix);
}
crank.add(teeth);
const pedals = [];
for (const s of [1, -1]) {
  const z = s * 0.1;
  const end = V(s * 0.17, 0, z);
  tube(V(0, 0, z), end, 0.014, 0.011, chrome, crank);
  const pd = new THREE.Group();
  pd.position.copy(end);
  crank.add(pd);
  mesh(new THREE.BoxGeometry(0.09, 0.018, 0.07), blackM, pd).position.z = s * 0.04;
  pedals.push(pd);
}
for (let i = 0; i < 4; i++) {
  const c = mesh(
    new THREE.CylinderGeometry(0.045 - i * 0.006, 0.045 - i * 0.006, 0.004, 20),
    chrome,
    bike
  );
  c.rotation.x = PI / 2;
  c.position.set(RW.x, RW.y, 0.06 + i * 0.006);
}
const cR = 0.1,
  cr = 0.045,
  CZ = 0.075;
const cTop = [V(BB.x, BB.y + cR), V(RW.x, RW.y + cr)],
  cBot = [V(RW.x, RW.y - cr), V(BB.x, BB.y - cR)];
const L1 = cTop[0].distanceTo(cTop[1]),
  A1 = PI * cr,
  L2 = cBot[0].distanceTo(cBot[1]),
  A2 = PI * cR,
  CL = L1 + A1 + L2 + A2;
function chainPt(s) {
  s = ((s % CL) + CL) % CL;
  if (s < L1) return cTop[0].clone().lerp(cTop[1], s / L1);
  s -= L1;
  if (s < A1) {
    const a = PI / 2 + s / cr;
    return V(RW.x + Math.cos(a) * cr, RW.y + Math.sin(a) * cr);
  }
  s -= A1;
  if (s < L2) return cBot[0].clone().lerp(cBot[1], s / L2);
  s -= L2;
  const a = -PI / 2 + s / cR;
  return V(BB.x + Math.cos(a) * cR, BB.y + Math.sin(a) * cR);
}
const CN = 70;
const chain = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.019, 0.008, 0.012),
  M(0x6e6e6e, { metalness: 0.9, roughness: 0.35 }),
  CN
);
bike.add(chain);
function updChain(off) {
  for (let i = 0; i < CN; i++) {
    const s = off + (i / CN) * CL;
    const p = chainPt(s),
      q = chainPt(s + 0.004);
    dummy.position.set(p.x, p.y, CZ);
    dummy.rotation.set(0, 0, Math.atan2(q.y - p.y, q.x - p.x));
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    chain.setMatrixAt(i, dummy.matrix);
  }
  chain.instanceMatrix.needsUpdate = true;
}
const lampGlass = mesh(
  new THREE.CircleGeometry(0.03, 14),
  M(0xffffff, { emissive: 0xfff2c0, emissiveIntensity: 0 }),
  bike
);
lampGlass.rotation.y = PI / 2;
lampGlass.position.set(0.63, 0.98, 0);
mesh(new THREE.CylinderGeometry(0.032, 0.026, 0.05, 12), chrome, bike).position.set(0.6, 0.98, 0);
const headL = new THREE.SpotLight(0xfff0c8, 0, 45, 0.45, 0.5, 1.2);
headL.position.set(0.63, 0.98, 0);
headL.target.position.set(8, 0, 0);
bike.add(headL);
bike.add(headL.target);
// pelican
const pel = new THREE.Group();
const PC = V(-0.1, 1.3);
pel.position.copy(PC);
lean.add(pel);
const pin = new THREE.Group();
pin.position.set(-PC.x, -PC.y, 0);
pel.add(pin);
const featherW = M(0xf8f5ee, { roughness: 0.85 }),
  orange = M(0xf28c28, { roughness: 0.5 });
const body = mesh(
  new THREE.LatheGeometry(
    [
      [0, -0.52],
      [0.1, -0.5],
      [0.18, -0.42],
      [0.24, -0.28],
      [0.28, -0.1],
      [0.29, 0.06],
      [0.27, 0.22],
      [0.22, 0.36],
      [0.13, 0.46],
      [0, 0.5],
    ].map((p) => new THREE.Vector2(p[0], p[1])),
    40
  ),
  featherW,
  pin
);
body.rotation.z = -PI / 2 + 0.42;
body.position.set(-0.1, 1.33, 0);
body.scale.set(0.95, 1.1, 0.86);
mesh(new THREE.SphereGeometry(0.25, 20, 14), M(0xece6dc, { roughness: 0.9 }), pin).position.set(
  0.05,
  1.28,
  0
);
const upper = new THREE.Group();
upper.position.set(0.28, 1.55, 0);
pin.add(upper);
const up = new THREE.Group();
up.position.set(-0.28, -1.55, 0);
upper.add(up);
mesh(
  taper(
    new THREE.CatmullRomCurve3([
      V(0.24, 1.5),
      V(0.42, 1.76),
      V(0.3, 2.0),
      V(0.29, 2.18),
      V(0.37, 2.33),
    ]),
    36,
    0.13,
    0.068,
    16
  ),
  M(0xf8f5ee, { roughness: 0.85, side: THREE.DoubleSide }),
  up
);
const skull = mesh(new THREE.SphereGeometry(0.125, 24, 18), featherW, up);
skull.position.set(0.41, 2.38, 0);
skull.scale.set(1.25, 0.95, 0.9);
const crestM = M(0xf3d77a, { roughness: 0.8 });
const crest = [];
for (let i = 0; i < 6; i++) {
  const c = mesh(new THREE.ConeGeometry(0.018, 0.17 - i * 0.012, 6), crestM, up);
  crest.push(c);
  c.position.set(0.33 - i * 0.012, 2.46 - i * 0.008, (i % 2 ? 1 : -1) * 0.012 * i * 0.4);
  c.rotation.z = (PI / 2) * 0.62 + i * 0.07;
}
// v1.6 detail: helmet, tail fan, chest plumage, neck ruff
const defHelm = new THREE.Group();
{
  const hm = defHelm;
  hm.position.set(0.4, 2.43, 0);
  hm.rotation.z = -0.18;
  up.add(hm);
  const hY = M(0xffc61a, { roughness: 0.35, metalness: 0.05 });
  const sh_ = mesh(new THREE.SphereGeometry(0.152, 24, 14, 0, PI * 2, 0, PI * 0.5), hY, hm);
  sh_.scale.set(1.18, 0.82, 0.98);
  for (const z of [-0.05, 0, 0.05]) {
    const r = mesh(new THREE.BoxGeometry(0.24, 0.018, 0.022), M(0x222222, { roughness: 0.5 }), hm);
    r.position.set(-0.01, 0.105, z);
    r.rotation.z = 0.05;
  }
  const rim = mesh(
    new THREE.TorusGeometry(0.152, 0.011, 6, 28),
    M(0x333333, { roughness: 0.6 }),
    hm
  );
  rim.rotation.x = PI / 2;
  rim.scale.set(1.18, 0.98, 1);
  for (const s of [-1, 1]) {
    const st = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 5), M(0x333333), hm);
    st.position.set(0.03, -0.09, s * 0.135);
    st.rotation.x = s * 0.15;
  }
  const vis = mesh(new THREE.BoxGeometry(0.07, 0.012, 0.2), hY, hm);
  vis.position.set(0.17, -0.005, 0);
  vis.rotation.z = -0.25;
}
{
  const tf = new THREE.Group();
  tf.position.set(-0.62, 1.2, 0);
  tf.rotation.z = 0.35;
  pin.add(tf);
  const tg = new THREE.ConeGeometry(0.045, 0.3, 8);
  tg.scale(1, 1, 0.35);
  for (let i = 0; i < 7; i++) {
    const f = mesh(tg, M(i % 2 ? 0xe9e4da : 0xf8f5ee, { roughness: 0.85 }), tf);
    const a = (i - 3) * 0.13;
    f.rotation.set(a, 0, PI / 2 + 0.1);
    f.position.set(-0.1, 0, a * 0.35);
  }
}
{
  const ch = mesh(new THREE.SphereGeometry(0.16, 18, 12), M(0xf6e3a8, { roughness: 0.9 }), pin);
  ch.position.set(0.2, 1.36, 0);
  ch.scale.set(0.6, 1.05, 1.05);
  const rG = new THREE.ConeGeometry(0.03, 0.09, 5);
  const rM = M(0xf3efe6, { roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * PI * 2;
    const r = mesh(rG, rM, up);
    r.position.set(0.3 + Math.cos(a) * 0.06, 1.98, Math.sin(a) * 0.065);
    r.rotation.set(Math.sin(a) * 0.6, 0, PI + Math.cos(a) * 0.6);
  }
}
const lids = [];
for (const s of [-1, 1]) {
  const e = new THREE.Group();
  e.position.set(0.46, 2.415, s * 0.092);
  up.add(e);
  mesh(new THREE.SphereGeometry(0.026, 14, 10), M(0xffffff, { roughness: 0.3 }), e);
  mesh(new THREE.SphereGeometry(0.019, 12, 8), M(0x7a5520, { roughness: 0.3 }), e).position.set(
    0.008,
    0,
    s * 0.013
  );
  mesh(
    new THREE.SphereGeometry(0.011, 10, 8),
    M(0x050505, { roughness: 0.05, metalness: 0.2 }),
    e
  ).position.set(0.012, 0, s * 0.02);
  mesh(
    new THREE.SphereGeometry(0.004, 6, 6),
    M(0xffffff, { emissive: 0xffffff, emissiveIntensity: 1 }),
    e
  ).position.set(0.017, 0.007, s * 0.024);
  mesh(
    new THREE.TorusGeometry(0.029, 0.0055, 6, 20),
    M(0xf2a0a6, { roughness: 0.6 }),
    e
  ).position.z = s * 0.006;
  const lid = mesh(new THREE.SphereGeometry(0.031, 14, 10), featherW, e);
  lid.visible = false;
  lids.push(lid);
}
const beak = new THREE.Group();
beak.position.set(0.52, 2.37, 0);
beak.rotation.z = -0.3;
up.add(beak);
const bG = new THREE.LatheGeometry(
  [
    [0.047, 0],
    [0.046, 0.08],
    [0.04, 0.3],
    [0.03, 0.55],
    [0.018, 0.73],
    [0.004, 0.79],
    [0, 0.795],
  ].map((p) => new THREE.Vector2(p[0], p[1])),
  20
);
const ub = mesh(bG, M(0xf39a3a, { roughness: 0.42 }), beak);
ub.rotation.z = -PI / 2;
ub.scale.set(0.55, 1, 1.15);
ub.position.y = 0.014;
mesh(new THREE.SphereGeometry(0.022, 10, 8), M(0xd5401a, { roughness: 0.4 }), beak).position.set(
  0.78,
  0,
  0
);
const lb = mesh(bG, M(0xe0701c, { roughness: 0.5 }), beak);
lb.rotation.z = -PI / 2;
lb.scale.set(0.25, 0.96, 1.02);
lb.position.y = -0.022;
const pouchG = new THREE.SphereGeometry(1, 28, 18);
const pB = pouchG.attributes.position.array.slice();
for (let i = 1; i < pB.length; i += 3) if (pB[i] > 0) pB[i] *= 0.25;
const pouch = mesh(
  pouchG,
  new THREE.MeshPhysicalMaterial({
    color: 0xf5b13d,
    roughness: 0.42,
    transmission: 0.3,
    thickness: 0.08,
    clearcoat: 0.4,
  }),
  beak
);
pouch.position.set(0.37, -0.03, 0);
pouch.scale.set(0.34, 0.14, 0.085);
let pouchFill = 0;
function wobblePouch(t, amp) {
  const a = pouchG.attributes.position.array,
    f = 1 + pouchFill * 0.12;
  for (let i = 0; i < a.length; i += 3) {
    const x = pB[i],
      y = pB[i + 1],
      z = pB[i + 2];
    if (y < 0) {
      const w = Math.sin(t * 9 + x * 5) * amp * -y;
      a[i] = x + w * 0.25;
      a[i + 1] = y * (1 + w * 0.35) * f;
      a[i + 2] = z * (1 + pouchFill * 0.06);
    } else {
      a[i] = x;
      a[i + 1] = y;
      a[i + 2] = z;
    }
  }
  pouchG.attributes.position.needsUpdate = true;
  pouchG.computeVertexNormals();
}
const fG = new THREE.SphereGeometry(0.5, 8, 5);
fG.translate(0, 0.5, 0);
const fM = M(0xffffff, { roughness: 0.85, side: THREE.DoubleSide });
const wings = [];
for (const s of [-1, 1]) {
  const sh = V(0.1, 1.5, s * 0.245),
    gr = V(0.62, 0.99, s * 0.215);
  const w = new THREE.Group();
  w.position.copy(sh);
  pin.add(w);
  const arm = gr.clone().sub(sh);
  mesh(taper(new THREE.LineCurve3(V(0, 0, 0), arm), 5, 0.07, 0.025, 10), featherW, w);
  const rows = [
    [11, 0.17, 0.055, 0xf6f3ec, 0.03, 0, 1],
    [11, 0.3, 0.06, 0xbfc2c8, 0.018, 0.05, 1],
    [8, 0.4, 0.055, 0x1f1f22, 0.006, 0.1, 0.45],
  ];
  let n = 0;
  rows.forEach((r) => (n += r[0]));
  const im = new THREE.InstancedMesh(fG, fM, n);
  im.castShadow = true;
  let k = 0;
  for (const [cnt, len, wd, col, zo, drop, from] of rows) {
    for (let i = 0; i < cnt; i++) {
      const u = 1 - from + (i / (cnt - 1)) * from;
      const p = arm.clone().multiplyScalar(u * 0.95);
      p.y -= drop * (1 - u * 0.4);
      p.z += s * zo;
      dummy.position.copy(p);
      dummy.quaternion.setFromUnitVectors(UP, V(-1, 0.28 - 0.35 * u, s * 0.04).normalize());
      dummy.scale.set(wd * (1 + 0.3 * Math.random()), len * (0.9 + 0.25 * u), 0.018);
      dummy.updateMatrix();
      im.setMatrixAt(k, dummy.matrix);
      im.setColorAt(k, new THREE.Color(col));
      k++;
    }
  }
  w.add(im);
  wings.push(w);
}
const tail = new THREE.InstancedMesh(fG, fM, 7);
tail.castShadow = true;
for (let i = 0; i < 7; i++) {
  const a = (i - 3) / 3;
  dummy.position.set(-0.55, 1.14, a * 0.06);
  dummy.quaternion.setFromUnitVectors(UP, V(-1, 0.05, a * 0.45).normalize());
  dummy.scale.set(0.06, 0.24 - Math.abs(a) * 0.05, 0.015);
  dummy.updateMatrix();
  tail.setMatrixAt(i, dummy.matrix);
  tail.setColorAt(i, new THREE.Color(i % 2 ? 0xe9e6df : 0xf8f5ee));
}
pin.add(tail);
const fs = new THREE.Shape();
fs.moveTo(0, 0);
fs.lineTo(0.02, -0.055);
fs.quadraticCurveTo(0.08, -0.07, 0.13, -0.06);
fs.quadraticCurveTo(0.1, -0.035, 0.15, -0.01);
fs.quadraticCurveTo(0.12, 0, 0.15, 0.012);
fs.quadraticCurveTo(0.1, 0.035, 0.13, 0.06);
fs.quadraticCurveTo(0.08, 0.07, 0.02, 0.055);
fs.closePath();
const footG = new THREE.ExtrudeGeometry(fs, {
  depth: 0.008,
  bevelEnabled: false,
  curveSegments: 5,
});
const legs = [];
for (const s of [1, -1]) {
  const th = mesh(new THREE.CylinderGeometry(0.045, 0.065, 1, 10), featherW, pin),
    sn = mesh(new THREE.CylinderGeometry(0.016, 0.02, 1, 8), orange, pin),
    kn = mesh(new THREE.SphereGeometry(0.024, 8, 6), orange, pin),
    ft = mesh(footG, orange, pin);
  ft.rotation.x = PI / 2;
  legs.push({ s, th, sn, kn, ft });
}
function ik(h, t, a1, a2) {
  const dx = t.x - h.x,
    dy = t.y - h.y;
  const d = Math.min(Math.hypot(dx, dy), a1 + a2 - 0.001);
  const a = Math.atan2(dy, dx);
  const b = Math.acos(clamp((a1 * a1 + d * d - a2 * a2) / (2 * a1 * d), -1, 1));
  const z = (h.z + t.z) / 2;
  const k1 = V(h.x + a1 * Math.cos(a + b), h.y + a1 * Math.sin(a + b), z),
    k2 = V(h.x + a1 * Math.cos(a - b), h.y + a1 * Math.sin(a - b), z);
  return k1.x > k2.x ? k1 : k2;
}
function updLegs(th) {
  for (const L of legs) {
    const ang = -th + (L.s > 0 ? 0 : PI);
    const ped = V(BB.x + Math.cos(ang) * 0.17, BB.y + Math.sin(ang) * 0.17, L.s * 0.14);
    const ank = ped.clone().add(V(-0.03, 0.05, 0));
    const hip = V(-0.12, 1.13, L.s * 0.13);
    const kn = ik(hip, ank, 0.46, 0.47);
    seg(L.th, hip, kn);
    seg(L.sn, kn, ank);
    L.kn.position.copy(kn);
    L.ft.position.set(ped.x - 0.04, ped.y + 0.022, ped.z);
  }
}
const LF = 40;
const loose = new THREE.InstancedMesh(fG, fM, LF);
scene.add(loose);
const lfs = [];
for (let i = 0; i < LF; i++) {
  lfs.push({ p: V(0, -9, 0), v: V(), r: Math.random() * 6, w: rnd(2, 6) });
  loose.setColorAt(i, new THREE.Color(i % 4 ? 0xf8f5ee : 0xbfc2c8));
}
loose.visible = false;

// outfits on head
const outfit = {};
(function () {
  const hg = new THREE.Group();
  up.add(hg);
  const helm = new THREE.Group();
  hg.add(helm);
  const hm = mesh(
    new THREE.SphereGeometry(0.17, 24, 12, 0, PI * 2, 0, PI / 2),
    M(0x2f7de1, { metalness: 0.3, roughness: 0.35 }),
    helm
  );
  hm.scale.set(1.35, 0.95, 1.05);
  hm.position.set(0.39, 2.43, 0);
  for (let i = -1; i <= 1; i++) {
    const st = mesh(new THREE.BoxGeometry(0.32, 0.025, 0.03), M(0xffffff), helm);
    st.position.set(0.38, 2.58, i * 0.07);
  }
  const visor = mesh(new THREE.BoxGeometry(0.1, 0.015, 0.2), M(0x111111), helm);
  visor.position.set(0.6, 2.44, 0);
  visor.rotation.z = -0.2;
  outfit.helmet = helm;
  const straw = new THREE.Group();
  hg.add(straw);
  const sm = M(0xe6c77a, { roughness: 0.95 });
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 28), sm, straw).position.set(0.38, 2.48, 0);
  mesh(new THREE.CylinderGeometry(0.13, 0.15, 0.13, 20), sm, straw).position.set(0.38, 2.55, 0);
  mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.035, 20), M(0xc0392b), straw).position.set(
    0.38,
    2.51,
    0
  );
  outfit.straw = straw;
  const crown = new THREE.Group();
  hg.add(crown);
  const gm = M(0xffc93c, { metalness: 1, roughness: 0.2 });
  const band = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.07, 20, 1, true), gm, crown);
  band.position.set(0.37, 2.52, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    const sp = mesh(new THREE.ConeGeometry(0.03, 0.09, 6), gm, crown);
    sp.position.set(0.37 + Math.cos(a) * 0.1, 2.6, Math.sin(a) * 0.1);
    const gem = mesh(
      new THREE.SphereGeometry(0.018, 8, 6),
      M(i % 2 ? 0xe0115f : 0x1e90ff, { emissive: i % 2 ? 0x550022 : 0x002255 }),
      crown
    );
    gem.position.set(0.37 + Math.cos(a) * 0.112, 2.52, Math.sin(a) * 0.112);
  }
  outfit.crown = crown;
  const gl = new THREE.Group();
  hg.add(gl);
  const lensM = M(0x0a0a0a, { metalness: 0.8, roughness: 0.05 });
  for (const s of [-1, 1]) {
    const l = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.012, 18), lensM, gl);
    l.rotation.x = PI / 2;
    l.position.set(0.47, 2.415, s * 0.112);
  }
  const br = mesh(new THREE.BoxGeometry(0.012, 0.012, 0.2), lensM, gl);
  br.position.set(0.52, 2.43, 0);
  outfit.glasses = gl;
  const sc = new THREE.Group();
  hg.add(sc);
  const scM = M(0xd62828, { roughness: 0.8 });
  const t = mesh(new THREE.TorusGeometry(0.13, 0.05, 10, 24), scM, sc);
  t.position.set(0.37, 1.88, 0);
  t.rotation.x = PI / 2;
  t.rotation.y = 0.35;
  const tl = mesh(new THREE.BoxGeometry(0.08, 0.32, 0.03), scM, sc);
  tl.position.set(0.2, 1.72, 0.12);
  tl.rotation.z = 0.5;
  outfit.scarf = sc;
  const G = () => {
    const x = new THREE.Group();
    hg.add(x);
    return x;
  };
  {
    const c = G();
    const w = M(0xffffff, { roughness: 0.9 });
    mesh(new THREE.CylinderGeometry(0.115, 0.12, 0.14, 20), w, c).position.set(0.38, 2.56, 0);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      mesh(new THREE.SphereGeometry(0.085, 12, 10), w, c).position.set(
        0.38 + Math.cos(a) * 0.07,
        2.67,
        Math.sin(a) * 0.07
      );
    }
    mesh(new THREE.SphereGeometry(0.09, 12, 10), w, c).position.set(0.38, 2.71, 0);
    outfit.chef = c;
  }
  {
    const c = G();
    const br = M(0x8b5a2b, { roughness: 0.8 });
    const brim = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.02, 28), br, c);
    brim.position.set(0.38, 2.49, 0);
    brim.scale.set(1, 1, 0.85);
    mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.15, 20), br, c).position.set(0.38, 2.57, 0);
    mesh(new THREE.CylinderGeometry(0.142, 0.142, 0.03, 20), M(0x3b2414), c).position.set(
      0.38,
      2.52,
      0
    );
    outfit.cowboy = c;
  }
  {
    const c = G();
    const pu = M(0x6c3fc8, { roughness: 0.6 });
    mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.015, 28), pu, c).position.set(0.38, 2.49, 0);
    const cn = mesh(new THREE.ConeGeometry(0.15, 0.42, 20), pu, c);
    cn.position.set(0.35, 2.69, 0);
    cn.rotation.z = 0.22;
    mesh(
      new THREE.CylinderGeometry(0.152, 0.152, 0.04, 20),
      M(0xffc93c, { metalness: 0.7, roughness: 0.3 }),
      c
    ).position.set(0.38, 2.52, 0);
    for (const p of [
      [0.43, 2.66, 0.1],
      [0.3, 2.75, -0.06],
      [0.4, 2.6, -0.12],
    ])
      mesh(
        new THREE.OctahedronGeometry(0.025),
        M(0xffd43b, { emissive: 0x664400 }),
        c
      ).position.set(...p);
    outfit.wizard = c;
  }
  {
    const c = G();
    const cn = mesh(new THREE.ConeGeometry(0.09, 0.26, 16), M(0xff5c8a, { roughness: 0.5 }), c);
    cn.position.set(0.38, 2.61, 0);
    cn.rotation.z = -0.15;
    mesh(new THREE.TorusGeometry(0.065, 0.012, 6, 16), M(0x4dabf7), c).position.set(0.383, 2.56, 0)
      .constructor;
    c.children[1].rotation.x = PI / 2;
    mesh(new THREE.SphereGeometry(0.035, 10, 8), M(0xffd43b), c).position.set(0.4, 2.75, 0);
    outfit.party = c;
  }
  {
    const c = G();
    const rd = M(0xd62828, { roughness: 0.4 });
    const band = mesh(new THREE.TorusGeometry(0.155, 0.018, 8, 24, PI), rd, c);
    band.position.set(0.4, 2.4, 0);
    band.rotation.y = PI / 2;
    for (const s of [-1, 1]) {
      const cup = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.045, 16), rd, c);
      cup.rotation.x = PI / 2;
      cup.position.set(0.4, 2.38, s * 0.135);
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.05, 14), M(0x222222), c).position.set(
        0.4,
        2.38,
        s * 0.13
      ).constructor;
      c.children[c.children.length - 1].rotation.x = PI / 2;
    }
    outfit.phones = c;
  }
  {
    const c = G();
    const bk = M(0x151515, { roughness: 0.5 });
    for (const s of [-1, 1]) {
      const w = mesh(new THREE.ConeGeometry(0.045, 0.09, 4), bk, c);
      w.rotation.x = (s * PI) / 2;
      w.position.set(0.47, 1.86, s * 0.045);
    }
    mesh(new THREE.SphereGeometry(0.022, 8, 6), bk, c).position.set(0.47, 1.86, 0);
    outfit.bowtie = c;
  }
  {
    const c = G();
    const t = mesh(
      new THREE.TorusGeometry(0.135, 0.022, 8, 28),
      M(0xffc93c, { metalness: 1, roughness: 0.2 }),
      c
    );
    t.position.set(0.37, 1.86, 0);
    t.rotation.x = PI / 2;
    t.rotation.y = 0.35;
    mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.015, 12),
      M(0xffd700, { metalness: 1, roughness: 0.15 }),
      c
    ).position.set(0.47, 1.8, 0);
    c.children[1].rotation.z = PI / 2;
    outfit.chain = c;
  }
  {
    const c = new THREE.Group();
    pin.add(c);
    const bl = M(0x2f7de1, { roughness: 0.6 });
    const bx = mesh(new THREE.BoxGeometry(0.32, 0.13, 0.3), bl, c);
    bx.position.set(-0.22, 1.6, 0);
    bx.rotation.z = 0.42;
    const pk = mesh(new THREE.BoxGeometry(0.18, 0.05, 0.22), M(0x1d5fb8, { roughness: 0.6 }), c);
    pk.position.set(-0.25, 1.67, 0);
    pk.rotation.z = 0.42;
    mesh(new THREE.BoxGeometry(0.04, 0.02, 0.05), M(0xd4a531, { metalness: 0.7 }), c).position.set(
      -0.2,
      1.71,
      0
    );
    outfit.backpack = c;
  }
  Object.values(outfit).forEach((o) => (o.visible = false));
})();
