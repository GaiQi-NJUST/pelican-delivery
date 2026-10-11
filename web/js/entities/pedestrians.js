'use strict';
// ── js/entities/pedestrians.js ──
// 行人：学校区域、行人生成与横穿马路
// ===== schools =====
const isSchool = (bi, bj) =>
  hash(bi * 0.913 + 7.7, bj * 1.37 - 2.2) < 0.09 && Math.abs(bi) + Math.abs(bj) > 1;
const SCHN = ['鹈鹕实验小学', '海鸥幼儿园', '翡翠湖中学', '南理工附属小学'];
function inSchool(x, z) {
  const r = roadInfo(x, z);
  if (r.along == null) return false;
  if (r.ax === 0) {
    const bi = Math.floor(x / B),
      nj = Math.round(z / B);
    return isSchool(bi, nj - 1) || isSchool(bi, nj);
  }
  const bj = Math.floor(z / B),
    ni = Math.round(x / B);
  return isSchool(ni - 1, bj) || isSchool(ni, bj);
}
// v0.1.10：自动缩放字号的文字牌（fg 字色, bg 底色）
function textPlane2(txt, w, h, fg, bg) {
  const cw = 512,
    ch = Math.round((512 * h) / w);
  const n = [...txt].reduce((a, c) => a + (/[\x00-\xff]/.test(c) ? 0.58 : 1), 0);
  const fs = Math.max(10, Math.min(ch * 0.62, (cw * 0.9) / Math.max(1, n)));
  return textPlane(txt, w, h, bg, fg, `900 ${Math.round(fs)}px sans-serif`);
}
function textPlane(txt, w, h, bg, fg, font) {
  const t = canvasTex(512, Math.round((512 * h) / w), (x, cw, ch) => {
    if (bg) {
      x.fillStyle = bg;
      x.fillRect(0, 0, cw, ch);
    } else x.clearRect(0, 0, cw, ch);
    x.fillStyle = fg;
    x.font = font || `900 ${Math.round(ch * 0.62)}px sans-serif`;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(txt, cw / 2, ch / 2 + 2);
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({ map: t, transparent: !bg, toneMapped: false, depthWrite: !!bg })
  );
}
const limitT = canvasTex(128, 128, (x) => {
  x.fillStyle = '#fff';
  x.beginPath();
  x.arc(64, 64, 62, 0, 7);
  x.fill();
  x.lineWidth = 14;
  x.strokeStyle = '#d61f1f';
  x.beginPath();
  x.arc(64, 64, 54, 0, 7);
  x.stroke();
  x.fillStyle = '#111';
  x.font = '900 56px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('30', 64, 68);
});
const kidT = canvasTex(128, 128, (x) => {
  x.fillStyle = '#f5c400';
  x.beginPath();
  x.moveTo(64, 6);
  x.lineTo(124, 118);
  x.lineTo(4, 118);
  x.closePath();
  x.fill();
  x.lineWidth = 7;
  x.strokeStyle = '#111';
  x.stroke();
  x.font = '54px sans-serif';
  x.textAlign = 'center';
  x.fillText('🚸', 64, 92);
});
function schoolGroup() {
  const g = new THREE.Group();
  const cream = M(0xf3e6cf, { roughness: 0.8 }),
    orange = M(0xe8743b, { roughness: 0.7 });
  const bld = mesh(new THREE.BoxGeometry(64, 15, 13), cream, g);
  bld.position.set(0, 7.6, 0);
  for (let f = 0; f < 3; f++) {
    const s = mesh(new THREE.BoxGeometry(64.2, 0.5, 13.2), orange, g);
    s.position.set(0, 4.5 + f * 4.5, 0);
  }
  const winM = M(0x7fa6c2, { roughness: 0.2, metalness: 0.3 });
  for (let f = 0; f < 3; f++)
    for (let i = -6; i <= 6; i++) {
      const w = mesh(new THREE.BoxGeometry(2.6, 1.8, 0.1), winM, g);
      w.position.set(i * 4.8, 2.6 + f * 4.5, 6.55);
    }
  const sign = textPlane('鹈鹕实验小学', 22, 2.4, '#b3261e', '#ffe9a8');
  sign.position.set(0, 13.2, 6.62);
  g.add(sign);
  g.userData.sign = sign;
  for (const s of [-1, 1]) {
    const p = mesh(new THREE.BoxGeometry(1.2, 4.2, 1.2), M(0xb3261e), g);
    p.position.set(s * 5, 2.1, 12);
  }
  const gate = textPlane('欢迎同学们', 10.6, 1.3, '#b3261e', '#fff');
  gate.position.set(0, 3.8, 12.62);
  g.add(gate);
  const track = mesh(new THREE.RingGeometry(14, 19, 40), M(0xb8452f, { roughness: 0.95 }), g);
  track.rotation.x = -PI / 2;
  track.scale.set(1.5, 1, 1);
  track.position.set(0, 0.18, -30);
  track.castShadow = false;
  const field = mesh(new THREE.CircleGeometry(14, 40), M(0x3f9a4a, { roughness: 1 }), g);
  field.rotation.x = -PI / 2;
  field.scale.set(1.5, 1, 1);
  field.position.set(0, 0.19, -30);
  field.castShadow = false;
  tube(V(14, 0, 6), V(14, 12, 6), 0.12, 0.08, M(0xdddddd, { metalness: 0.6 }), g, 8);
  const flag = mesh(
    new THREE.PlaneGeometry(3, 2),
    M(0xde2910, { side: THREE.DoubleSide, emissive: 0x400000 }),
    g
  );
  flag.position.set(15.5, 11, 6);
  g.userData.flag = flag;
  return g;
}
const schools = [];
for (let i = 0; i < 4; i++) {
  const g = schoolGroup();
  g.visible = false;
  scene.add(g);
  schools.push(g);
}
const zoneDecals = [],
  zoneSigns = [];
for (let i = 0; i < 16; i++) {
  const p = textPlane('学校区域 慢行', 8, 2.6, null, 'rgba(255,240,180,.95)');
  p.rotation.x = -PI / 2;
  const g = new THREE.Group();
  g.add(p);
  g.visible = false;
  scene.add(g);
  zoneDecals.push(g);
}
for (let i = 0; i < 16; i++) {
  const g = new THREE.Group();
  tube(V(0, 0, 0), V(0, 2.9, 0), 0.06, 0.06, poleM, g, 6);
  const a = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 24),
    new THREE.MeshBasicMaterial({ map: limitT, toneMapped: false })
  );
  a.position.set(0, 2.55, 0.07);
  g.add(a);
  const b = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({ map: kidT, transparent: true, toneMapped: false })
  );
  b.position.set(0, 1.6, 0.07);
  g.add(b);
  g.visible = false;
  scene.add(g);
  zoneSigns.push(g);
}
function updSchools(ni, nj) {
  let s = 0,
    d = 0,
    z = 0;
  const bi0 = Math.floor(player.position.x / B),
    bj0 = Math.floor(player.position.z / B);
  for (let a = -2; a <= 2; a++)
    for (let b = -2; b <= 2; b++) {
      const bi = bi0 + a,
        bj = bj0 + b;
      if (!isSchool(bi, bj)) continue;
      if (s < schools.length) {
        const g = schools[s++];
        g.visible = true;
        g.position.set((bi + 0.5) * B, 0, (bj + 1) * B - RH - 3.2 - 12.5);
        const nm = SCHN[Math.floor(hash(bi + 0.5, bj + 0.5) * SCHN.length * 5) % SCHN.length];
        if (g.userData.nm !== nm) {
          g.userData.nm = nm;
          const old = g.userData.sign;
          g.remove(old);
          const sg = textPlane(nm, 22, 2.4, '#b3261e', '#ffe9a8');
          sg.position.copy(old.position);
          g.add(sg);
          g.userData.sign = sg;
        }
      }
      // adjacent four road segments: decals for each travel direction + signs
      const segs = [
        [0, (bi + 0.5) * B, bj * B],
        [0, (bi + 0.5) * B, (bj + 1) * B],
        [1, bi * B, (bj + 0.5) * B],
        [1, (bi + 1) * B, (bj + 0.5) * B],
      ];
      for (const [ax, cx, cz] of segs)
        for (const dir of [1, -1]) {
          const f = ax === 0 ? V(dir, 0, 0) : V(0, 0, dir),
            rt = V(-f.z, 0, f.x);
          if (d < zoneDecals.length) {
            const g = zoneDecals[d++];
            g.visible = true;
            g.position.set(
              cx - f.x * (SEGL / 2 - 20) + rt.x * 3.5,
              0.014,
              cz - f.z * (SEGL / 2 - 20) + rt.z * 3.5
            );
            g.rotation.y = Math.atan2(-f.x, -f.z);
          }
          if (z < zoneSigns.length) {
            const g = zoneSigns[z++];
            g.visible = true;
            g.position.set(
              cx - f.x * (SEGL / 2 - 8) + rt.x * (RH + 0.8),
              0.16,
              cz - f.z * (SEGL / 2 - 8) + rt.z * (RH + 0.8)
            );
            g.rotation.y = Math.atan2(-f.x, -f.z);
          }
        }
    }
  for (; s < schools.length; s++) schools[s].visible = false;
  for (; d < zoneDecals.length; d++) zoneDecals[d].visible = false;
  for (; z < zoneSigns.length; z++) zoneSigns[z].visible = false;
}

// ===== pedestrians =====
const SW = RH + 1.4,
  peds = [];
const shirtC = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0xecf0f1, 0x34495e, 0xe67e22],
  skinC = [0xf1c9a5, 0xe0b48f, 0xc99a72],
  pantC = [0x2c3e50, 0x1f3a5f, 0x5d4037, 0x333333];
const PG = {
  leg: new THREE.CylinderGeometry(0.075, 0.06, 0.46, 10),
  shin: new THREE.CylinderGeometry(0.062, 0.052, 0.44, 10),
  shoe: new THREE.BoxGeometry(0.24, 0.09, 0.11),
  torso: new THREE.LatheGeometry(
    [
      [0, -0.33],
      [0.17, -0.32],
      [0.19, -0.2],
      [0.2, 0],
      [0.22, 0.18],
      [0.2, 0.27],
      [0.12, 0.32],
      [0, 0.33],
    ].map((p) => new THREE.Vector2(p[0], p[1])),
    16
  ),
  hip: new THREE.CylinderGeometry(0.19, 0.18, 0.16, 14),
  uarm: new THREE.CylinderGeometry(0.058, 0.05, 0.32, 8),
  farm: new THREE.CylinderGeometry(0.047, 0.04, 0.3, 8),
  hand: new THREE.SphereGeometry(0.05, 10, 8),
  neck: new THREE.CylinderGeometry(0.055, 0.06, 0.1, 10),
  head: new THREE.SphereGeometry(0.125, 20, 16),
  eye: new THREE.SphereGeometry(0.018, 8, 6),
  pup: new THREE.SphereGeometry(0.009, 6, 5),
  nose: new THREE.ConeGeometry(0.022, 0.05, 8),
  ear: new THREE.SphereGeometry(0.03, 8, 6),
  hairS: new THREE.SphereGeometry(0.135, 18, 12, 0, PI * 2, 0, PI * 0.55),
  hairL: new THREE.CylinderGeometry(0.13, 0.12, 0.28, 14, 1, true, PI * 0.6, PI * 1.8),
  pony: new THREE.SphereGeometry(0.06, 10, 8),
  cap: new THREE.SphereGeometry(0.138, 16, 10, 0, PI * 2, 0, PI / 2),
  brim: new THREE.BoxGeometry(0.14, 0.015, 0.2),
  collar: new THREE.TorusGeometry(0.085, 0.022, 6, 16),
  brow: new THREE.BoxGeometry(0.01, 0.012, 0.045),
  mouth: new THREE.BoxGeometry(0.01, 0.01, 0.05),
  skirt: new THREE.CylinderGeometry(0.19, 0.27, 0.36, 16, 1, true),
};
const PMC = {};
const PM = (c, r) =>
  PMC[c + '_' + (r || 0.8)] || (PMC[c + '_' + (r || 0.8)] = M(c, { roughness: r || 0.8 }));
const hairC = [0x1b130d, 0x2a1d14, 0x4a2f1e, 0x6b4a2b, 0x8a8a8a, 0xc9a26b];
function makePed(kid) {
  const g = new THREE.Group();
  const sk = PM(pick(skinC), 0.65),
    sh = PM(kid ? 0xffffff : pick(shirtC), 0.8),
    pa = PM(kid ? 0x1f3a8a : pick(pantC), 0.85),
    shoe = PM(pick([0x222222, 0xffffff, 0x6b3e26, 0xd04040]), 0.6);
  const fem = !kid && Math.random() < 0.45;
  const legs = [],
    arms = [];
  for (const s of [-1, 1]) {
    const l = new THREE.Group();
    l.position.set(0, 0.9, s * 0.1);
    g.add(l);
    mesh(PG.leg, pa, l).position.y = -0.22;
    const sn = mesh(PG.shin, pa, l);
    sn.position.y = -0.66;
    const so = mesh(PG.shoe, shoe, l);
    so.position.set(0.05, -0.86, 0);
    legs.push(l);
    const a = new THREE.Group();
    a.position.set(0, 1.44, s * 0.235);
    g.add(a);
    mesh(PG.uarm, sh, a).position.y = -0.15;
    const fa = mesh(PG.farm, sk, a);
    fa.position.y = -0.45;
    mesh(PG.hand, sk, a).position.y = -0.62;
    arms.push(a);
  }
  mesh(PG.hip, pa, g).position.y = 0.95;
  const tor = mesh(PG.torso, sh, g);
  tor.position.y = 1.24;
  tor.scale.set(0.85, 1, 1.15);
  if (fem && Math.random() < 0.5) {
    const sk_ = mesh(PG.skirt, pa, g);
    sk_.position.y = 0.82;
  }
  const col = mesh(PG.collar, sh, g);
  col.rotation.x = PI / 2;
  col.position.y = 1.55;
  mesh(PG.neck, sk, g).position.y = 1.6;
  const hd = new THREE.Group();
  hd.position.y = 1.76;
  g.add(hd);
  const h = mesh(PG.head, sk, hd);
  h.scale.set(1, 1.08, 0.95);
  const ey = PM(0xffffff, 0.3),
    pu = PM(0x111111, 0.2),
    hc = PM(pick(hairC), 0.7);
  for (const s of [-1, 1]) {
    mesh(PG.eye, ey, hd).position.set(0.105, 0.02, s * 0.045);
    mesh(PG.pup, pu, hd).position.set(0.12, 0.02, s * 0.045);
    mesh(PG.ear, sk, hd).position.set(0, 0, s * 0.125);
    const b = mesh(PG.brow, hc, hd);
    b.position.set(0.112, 0.06, s * 0.045);
  }
  const no = mesh(PG.nose, sk, hd);
  no.rotation.z = -PI / 2;
  no.position.set(0.13, -0.02, 0);
  mesh(PG.mouth, PM(0xa0453a, 0.6), hd).position.set(0.112, -0.065, 0);
  const style = kid ? 0 : Math.floor(Math.random() * (fem ? 3 : 3));
  if (fem) {
    mesh(PG.hairS, hc, hd).position.y = 0.01;
    if (style !== 1) {
      const hl = mesh(PG.hairL, hc, hd);
      hl.position.set(-0.02, -0.12, 0);
    } else {
      mesh(PG.pony, hc, hd).position.set(-0.15, 0.02, 0);
    }
  } else if (style === 2) {
    mesh(PG.cap, PM(pick([0xd32f2f, 0x1565c0, 0x2e7d32, 0x111111]), 0.7), hd).position.y = 0.02;
    const br = mesh(PG.brim, PM(0x222222), hd);
    br.position.set(0.15, 0.05, 0);
  } else {
    const hs = mesh(PG.hairS, hc, hd);
    hs.position.set(-0.01, 0.015, 0);
    hs.scale.set(1.02, 0.95, 1.02);
  }
  if (kid) {
    const bp = mesh(
      new THREE.BoxGeometry(0.22, 0.34, 0.32),
      M(pick([0xe74c3c, 0x2e86de, 0xff6fb1])),
      g
    );
    bp.position.set(-0.24, 1.22, 0);
    mesh(PG.cap, PM(0xffd800, 0.6), hd).position.y = 0.02;
    g.scale.setScalar(0.66);
  }
  g.traverse((o) => {
    if (o.isMesh) {
      o.receiveShadow = false;
    }
  });
  scene.add(g);
  return { g, legs, arms, kid };
}

for (let i = 0; i < 24; i++) {
  const p = makePed(i % 4 === 0);
  p.g.visible = false;
  p.alive = false;
  peds.push(p);
}
function spawnPed(p) {
  const px = player.position.x,
    pz = player.position.z;
  for (let t = 0; t < 12; t++) {
    const ax = Math.random() < 0.5 ? 0 : 1;
    const other = ax === 0 ? pz : px,
      mine = ax === 0 ? px : pz;
    const c = (Math.round(other / B) + Math.floor(rnd(-1, 2))) * B;
    let a = mine + rnd(-140, 140);
    const m = a - Math.round(a / B) * B;
    if (Math.abs(m) < SW + 1) continue;
    const s = Math.random() < 0.5 ? -1 : 1;
    const x = ax === 0 ? a : c + s * SW,
      z = ax === 0 ? c + s * SW : a;
    const d = Math.hypot(x - px, z - pz);
    if (d < 35 || d > 160) continue;
    const nearSch = inSchool(ax === 0 ? a : c, ax === 0 ? c : a);
    if (p.kid && !nearSch && Math.random() < 0.7) continue;
    Object.assign(p, {
      alive: true,
      ax,
      c,
      s,
      a,
      dir: Math.random() < 0.5 ? -1 : 1,
      st: 'walk',
      t: 0,
      spd: p.kid ? rnd(1, 1.4) : rnd(1.1, 1.6),
      cool: 0,
      fan: Math.random() < 0.04,
      fanDone: false,
    });
    p.nodeA = p.dir > 0 ? Math.ceil(p.a / B) * B : Math.floor(p.a / B) * B;
    p.g.visible = true;
    p.g.rotation.set(0, 0, 0);
    return;
  }
  p.alive = false;
  p.g.visible = false;
}
function pedPos(p, out) {
  if (p.ax === 0) out.set(p.a, 0, p.c + p.s * SW);
  else out.set(p.c + p.s * SW, 0, p.a);
  return out;
}
const pTmp = V();
function pedGap(c, rx, rz) {
  let best = 1e9;
  for (const p of peds) {
    if (!p.alive || (p.st !== 'cross' && p.st !== 'down')) continue;
    pedPos(p, pTmp);
    const dx = pTmp.x - c.pos.x,
      dz = pTmp.z - c.pos.z;
    const f = dx * c.fwd.x + dz * c.fwd.z;
    if (f <= 0 || f > 35) continue;
    if (Math.abs(dx * rx + dz * rz) > c.hw + 1.6) continue;
    best = Math.min(best, f - c.hl - 2.5);
  }
  return best;
}
let zebraC = 0;
function updPeds(dt, t) {
  if (fieldOn) {
    peds.forEach((p) => (p.g.visible = false));
    return;
  }
  zebraC -= dt;
  const pp = player.position;
  for (const p of peds) {
    if (!p.alive) {
      if (Math.random() < 0.05) spawnPed(p);
      continue;
    }
    pedPos(p, pTmp);
    const dist = Math.hypot(pTmp.x - pp.x, pTmp.z - pp.z);
    if (dist > 200) {
      spawnPed(p);
      continue;
    }
    p.t += dt;
    let moving = false;
    if (p.st === 'walk') {
      p.a += p.dir * p.spd * dt;
      moving = true;
      if (p.dir * (p.nodeA - p.a) <= SW) {
        if (Math.random() < 0.5) {
          p.st = 'wait';
          p.a = p.nodeA - p.dir * SW;
        } else {
          const na = p.c + p.s * SW;
          p.s = -p.dir;
          p.dir = Math.sign(na - p.c) || 1;
          p.c = p.nodeA;
          p.a = na;
          p.ax = 1 - p.ax;
          p.nodeA = p.dir > 0 ? Math.ceil((p.a + 0.01) / B) * B : Math.floor((p.a - 0.01) / B) * B;
        }
      }
    } else if (p.st === 'wait') {
      const i = p.ax === 0 ? p.nodeA / B : p.c / B,
        j = p.ax === 0 ? p.c / B : p.nodeA / B,
        ax = 1 - p.ax;
      if (light(i, j, ax) === 'r' && lightLeft(i, j, ax) > 7) p.st = 'cross';
    } else if (p.st === 'cross') {
      p.a += p.dir * p.spd * 1.15 * dt;
      moving = true;
      if (p.dir * (p.a - p.nodeA) >= SW) {
        p.st = 'walk';
        p.nodeA = p.dir > 0 ? Math.ceil((p.a + 0.01) / B) * B : Math.floor((p.a - 0.01) / B) * B;
      }
    } else if (p.st === 'down') {
      if (p.t > 6) {
        p.st = 'walk';
        p.g.rotation.set(0, 0, 0);
        p.spd *= 0.6;
      }
    }
    pedPos(p, pTmp);
    p.g.position.set(pTmp.x, p.st === 'cross' || p.st === 'down' ? 0 : 0.16, pTmp.z);
    if (p.st !== 'down') {
      const fx = p.ax === 0 ? p.dir : 0,
        fz = p.ax === 0 ? 0 : p.dir;
      p.g.rotation.y = Math.atan2(-fz, fx);
      const sw = moving ? Math.sin(p.t * p.spd * 5.5) * 0.55 : 0;
      p.legs[0].rotation.z = sw;
      p.legs[1].rotation.z = -sw;
      p.arms[0].rotation.z = -sw * 0.7;
      p.arms[1].rotation.z = sw * 0.7;
    }
    if (state === 'ride' && p.st !== 'down') {
      const hitR = drive === 'car' ? 1.7 : drive === 'moto' ? 0.95 : 0.7;
      if (dist < hitR && v > 1.2 && !(p.dodgeT > 0)) hitPed(p, pTmp);
      else if (p.fan && !p.fanDone && dist < 5 && v < 0.3) {
        p.fanDone = true;
        coins += 20;
        saveCoins();
        SFX.ding();
        say('路人：哇，是鹈鹕外卖员！可以合个影吗？📸');
        toast('📸 和粉丝合影 · 🪙+20', 2600);
        unlock('fan');
      }
    }
    if (
      p.st === 'cross' &&
      drive !== 'bike' &&
      state === 'ride' &&
      v > 2 &&
      zebraC <= 0 &&
      !exam &&
      dist < 9
    ) {
      const r = roadInfo(pp.x, pp.z);
      if (r.inter) {
        zebraC = 20;
        ticket('机动车行经人行横道未礼让行人', 200, 3, 0);
      }
    }
  }
}
function hitPed(p, pos) {
  p.st = 'down';
  p.t = 0;
  p.g.rotation.set((PI / 2) * (Math.random() < 0.5 ? 1 : -1), p.g.rotation.y, 0);
  p.g.position.y = 0.15;
  SFX.crash();
  SFX.squawk && SFX.squawk();
  blood(pos.x, pos.z, 1.4);
  const sp = v;
  v *= 0.3;
  delivBump(20);
  hurt(drive === 'bike' ? 8 + sp : 3, '撞到行人');
  if (!exam) {
    const motor = drive !== 'bike';
    ticket(
      p.kid ? '撞伤儿童（负全部责任），赔偿医药费' : '撞伤行人（负全部责任），赔偿医药费',
      p.kid ? 1500 : 800,
      0,
      p.kid ? 400 : 200
    );
    if (motor) {
      acc.t = 5;
      acc.cool = 8;
      setTimeout(() => {
        if (acc.t > 0) toast('⚠️ 撞到人了！5 秒内必须停车，否则算肇事逃逸', 3000);
      }, 4300);
    }
  } else if (exam.kind === 3) examFail('发生交通事故（撞到行人）');
}
