'use strict';
// ── js/world/scenery.js ──
// 景物：实例化对象池、商家/居民楼/招牌、视觉精细化补丁
// ===== scenery (instanced, wraps every 3 blocks) =====
const TILE = 3 * B;
const treeTrunk = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.14, 0.2, 1, 6),
  M(0x6b4a2e, { roughness: 0.95 }),
  260
);
const treeTop = new THREE.InstancedMesh(
  new THREE.IcosahedronGeometry(1, 0),
  M(0xffffff, { flatShading: true, roughness: 0.85 }),
  260
);
const houseB = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  M(0xffffff, { roughness: 0.8 }),
  90
);
const roofG = new THREE.ConeGeometry(0.72, 1, 4);
roofG.rotateY(PI / 4);
const houseR = new THREE.InstancedMesh(
  roofG,
  M(0xffffff, { roughness: 0.7, flatShading: true }),
  90
);
const winT = canvasTex(
  64,
  128,
  (x, w, h) => {
    x.fillStyle = '#d9d4cc';
    x.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++)
      for (let c = 0; c < 4; c++) {
        x.fillStyle = Math.random() < 0.3 ? '#ffe9a8' : '#5d7488';
        x.fillRect(4 + c * 15, 6 + r * 15, 10, 10);
      }
  },
  true
);
const towers = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  M(0xffffff, { map: winT, roughness: 0.6 }),
  24
);
[treeTrunk, treeTop, houseB, houseR, towers].forEach((m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
});
const scen = { trees: [], houses: [], towers: [] };
const inBlock = (v) => {
  const m = ((v % B) + B) % B;
  return m > RH + 5 && m < B - RH - 5;
};
while (scen.trees.length < 260) {
  const x = rnd(0, TILE),
    z = rnd(0, TILE);
  if (!inBlock(x) || !inBlock(z)) continue;
  const lx = ((x % B) + B) % B,
    lz = ((z % B) + B) % B;
  if (lx < RH + 17 || lx > B - RH - 17 || lz < RH + 17 || lz > B - RH - 17) continue;
  scen.trees.push({
    x,
    z,
    s: rnd(0.8, 1.6),
    c: new THREE.Color().setHSL(rnd(0.22, 0.32), rnd(0.45, 0.6), rnd(0.3, 0.42)),
  });
}
const houseCols = [0xf2e2c4, 0xe8c9b0, 0xc9dbe8, 0xf0d0d0, 0xd9e8c9, 0xffffff, 0xe6dcf2];
const roofCols = [0xa0442e, 0x5a3a2e, 0x3f5872, 0x7a2f2f, 0x4b4b4b];
for (let bi = 0; bi < 3; bi++)
  for (let bj = 0; bj < 3; bj++) {
    const cx = bi * B + B / 2,
      cz = bj * B + B / 2;
    for (let side = 0; side < 4; side++)
      for (let n = 0; n < 2; n++) {
        const along = rnd(-35, 35);
        const off = B / 2 - RH - 14;
        const [dx, dz] = D[side];
        const x = cx + dx * off + (dz !== 0 ? along : 0),
          z = cz + dz * off + (dx !== 0 ? along : 0);
        if (Math.random() < 0.18 && scen.towers.length < 24)
          scen.towers.push({ x, z, w: rnd(10, 14), h: rnd(14, 30), d: rnd(10, 14) });
        else
          scen.houses.push({
            x,
            z,
            w: rnd(7, 10),
            h: rnd(3.5, 5.5),
            d: rnd(7, 10),
            rot: side % 2 ? 0 : PI / 2,
            c: new THREE.Color(pick(houseCols)),
            rc: new THREE.Color(pick(roofCols)),
          });
      }
  }
scen.houses.length = 0;
scen.towers.length = 0;
scen.trees.forEach((t, i) => {
  treeTop.setColorAt(i, t.c);
});
scen.houses.forEach((h, i) => {
  houseB.setColorAt(i, h.c);
  houseR.setColorAt(i, h.rc);
});
treeTrunk.count = scen.trees.length;
treeTop.count = scen.trees.length;
houseB.count = houseR.count = scen.houses.length;
towers.count = scen.towers.length;
let scenX = 1e9,
  scenZ = 1e9;
function updScenery(px, pz) {
  if (Math.abs(px - scenX) < 6 && Math.abs(pz - scenZ) < 6) return;
  scenX = px;
  scenZ = pz;
  scen.trees.forEach((t, i) => {
    const x = wrap(t.x, px, TILE),
      z = wrap(t.z, pz, TILE);
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(x, 0.9 * t.s + 0.16, z);
    dummy.scale.set(t.s, 1.8 * t.s, t.s);
    dummy.updateMatrix();
    treeTrunk.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, 2.6 * t.s + 0.16, z);
    dummy.scale.set(1.6 * t.s, 1.5 * t.s, 1.6 * t.s);
    dummy.updateMatrix();
    treeTop.setMatrixAt(i, dummy.matrix);
  });
  scen.houses.forEach((h, i) => {
    const x = wrap(h.x, px, TILE),
      z = wrap(h.z, pz, TILE);
    dummy.rotation.set(0, h.rot, 0);
    dummy.position.set(x, h.h / 2 + 0.16, z);
    dummy.scale.set(h.w, h.h, h.d);
    dummy.updateMatrix();
    houseB.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, h.h + 0.16 + h.w * 0.22, z);
    dummy.scale.set(h.w * 1.08, h.w * 0.45, h.d * 1.08);
    dummy.updateMatrix();
    houseR.setMatrixAt(i, dummy.matrix);
  });
  scen.towers.forEach((h, i) => {
    dummy.rotation.set(0, 0, 0);
    dummy.position.set(wrap(h.x, px, TILE), h.h / 2 + 0.16, wrap(h.z, pz, TILE));
    dummy.scale.set(h.w, h.h, h.d);
    dummy.updateMatrix();
    towers.setMatrixAt(i, dummy.matrix);
  });
  [treeTrunk, treeTop, houseB, houseR, towers].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
  });
}
// clouds / stars / hills
const cloudM = M(0xffffff, { roughness: 1, flatShading: true, emissive: 0x332211 });
const clouds = [];
for (let i = 0; i < 12; i++) {
  const g = new THREE.Group();
  for (let k = 0; k < 5; k++) {
    const c = mesh(new THREE.IcosahedronGeometry(1, 1), cloudM, g);
    c.castShadow = false;
    c.position.set(k * 2 - 4 + Math.random(), Math.random(), Math.random() * 1.5);
    c.scale.setScalar(rnd(1.6, 3));
  }
  g.userData = { x: rnd(-250, 250), z: rnd(-250, 250), y: rnd(40, 60) };
  scene.add(g);
  clouds.push(g);
}
const sg = new THREE.BufferGeometry();
const sp = [];
for (let i = 0; i < 900; i++) {
  const u = Math.random() * PI * 2,
    w = rnd(0.08, 0.95),
    c = Math.cos(Math.asin(w)),
    r = 400;
  sp.push(Math.cos(u) * c * r, w * r, Math.sin(u) * c * r);
}
sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
const stars = new THREE.Points(
  sg,
  new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false, fog: false })
);
stars.visible = false;
scene.add(stars);
// ===== roadside shops & homes =====
const SHOPX = {
  鹈鹕炸鸡: { s: '炸鸡不炸鹈鹕', bg: '#d94f3d' },
  老王海鲜: { s: '今日到货：皮皮虾', bg: '#2f7dd1' },
  张姐麻辣烫: { s: '变态辣 敢挑战吗', bg: '#c0392b' },
  渔港寿司: { s: '新鲜三文鱼 每日空运', bg: '#e8743b' },
  阿婆奶茶: { s: '阿婆亲手煮珍珠', bg: '#8e44ad' },
  深夜烧烤: { s: '晚上八点才开门', bg: '#3b2b20' },
  鲜果切: { s: '保熟！不熟不要钱', bg: '#29a35a' },
  兰州牛肉面: { s: '一清二白三红四绿', bg: '#f2a71b' },
  小笼包铺: { s: '先开窗 后喝汤', bg: '#a0522d' },
  汉堡工坊: { s: '隐藏款：鹈鹕堡', bg: '#e67e22' },
  披萨小站: { s: '榴莲披萨 敢点吗', bg: '#16a085' },
  金陵盐水鸭: { s: '南京人的灵魂', bg: '#b9770e' },
  鸭血粉丝汤: { s: '香菜管够', bg: '#7f8c8d' },
  黄焖鸡米饭: { s: '正宗第 10086 家', bg: '#d4ac0d' },
  煎饼果子: { s: '加俩蛋 不加钱？', bg: '#ca6f1e' },
  海鸥咖啡: { s: '店长是一只海鸥', bg: '#5d6d7e' },
};
const SHOPS = [
  ['🍗', '鹈鹕炸鸡'],
  ['🦞', '老王海鲜'],
  ['🌶️', '张姐麻辣烫'],
  ['🍣', '渔港寿司'],
  ['🧋', '阿婆奶茶'],
  ['🍢', '深夜烧烤'],
  ['🍉', '鲜果切'],
  ['🍜', '兰州牛肉面'],
  ['🥟', '小笼包铺'],
  ['🍔', '汉堡工坊'],
  ['🍕', '披萨小站'],
  ['🦆', '金陵盐水鸭'],
  ['🥣', '鸭血粉丝汤'],
  ['🍚', '黄焖鸡米饭'],
  ['🥞', '煎饼果子'],
  ['☕', '海鸥咖啡'],
];
const HOMES = [
  '翡翠湖小区',
  '海鸥公寓',
  '鹭岛花园',
  '渔人码头',
  '星河湾',
  '梧桐里',
  '云锦苑',
  '南理工宿舍',
  '紫金山庄',
  '秦淮人家',
];
const SHOPC = [0xd94f3d, 0x2f7dd1, 0x29a35a, 0xf2a71b, 0x8e44ad, 0xe8743b, 0x16a085, 0xc0392b];
const ALONG = [-28, 0, 28],
  FRONT = B / 2 - RH - 3.2;
function poiAt(bi, bj, side, slot) {
  if (isSchool(bi, bj)) return null;
  // v0.1.10：加油站地块（每 6×6 街区一座，见 systems/fuel.js）
  if (side === 0 && slot === 1 && ((bi % 6) + 6) % 6 === 3 && ((bj % 6) + 6) % 6 === 3) return null;
  const h = hash(bi * 3.17 + side * 17.3 + slot * 5.71, bj * 2.73 - side * 4.13 + slot * 11.37);
  if (h < 0.1) return null;
  const h2 = hash(bi * 9.1 + side * 2.3 + slot * 7.7 + 1.3, bj * 5.3 + slot * 3.1 - side * 8.9),
    [dx, dz] = D[side],
    tx = -dz,
    tz = dx,
    al = ALONG[slot];
  const cx = (bi + 0.5) * B,
    cz = (bj + 0.5) * B,
    shop = h < 0.48;
  const w = shop ? 12 : 14,
    d = shop ? 9 : 12,
    ht = shop ? 4.6 + h2 * 2.5 : 13 + h2 * 20;
  const door = V(cx + dx * FRONT + tx * al, 0, cz + dz * FRONT + tz * al),
    park = V(cx + dx * (B / 2 - RH + 1.4) + tx * al, 0, cz + dz * (B / 2 - RH + 1.4) + tz * al);
  const ctr = V(cx + dx * (FRONT - d / 2) + tx * al, 0, cz + dz * (FRONT - d / 2) + tz * al);
  const key = `${bi},${bj},${side},${slot}`;
  if (shop) {
    const s = SHOPS[Math.floor(h2 * SHOPS.length * 7) % SHOPS.length];
    return {
      key,
      shop: true,
      e: s[0],
      name: s[1],
      w,
      d,
      ht,
      door,
      park,
      ctr,
      side,
      n: V(dx, 0, dz),
      col: SHOPC[Math.floor(h * 97) % SHOPC.length],
    };
  }
  const nm = HOMES[Math.floor(h2 * HOMES.length * 13) % HOMES.length],
    no = 1 + Math.floor(hash(bi + side * 0.37, bj + slot * 0.71) * 9);
  return {
    key,
    shop: false,
    e: '🏢',
    name: `${nm} ${no}栋`,
    w,
    d,
    ht,
    door,
    park,
    ctr,
    side,
    n: V(dx, 0, dz),
    col: 0xffffff,
  };
}
function poisOfBlock(bi, bj) {
  const r = [];
  for (let s = 0; s < 4; s++)
    for (let k = 0; k < 3; k++) {
      const p = poiAt(bi, bj, s, k);
      if (p) r.push(p);
    }
  return r;
}
const shopFrontT = canvasTex(128, 128, (x, w, h) => {
  x.fillStyle = '#f4efe6';
  x.fillRect(0, 0, w, h);
  x.fillStyle = '#9fc3d6';
  x.fillRect(8, 58, 50, 60);
  x.fillRect(70, 58, 50, 60);
  x.fillStyle = '#5b4636';
  x.fillRect(56, 50, 16, 78);
  x.fillStyle = 'rgba(0,0,0,.15)';
  x.fillRect(0, 0, w, 10);
});
const NPOI = 320;
const shopB = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  M(0xffffff, { map: shopFrontT, roughness: 0.8 }),
  NPOI
);
const awnB = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  M(0xffffff, { roughness: 0.6 }),
  NPOI
);
const resT = canvasTex(64, 128, (x, w, h) => {
  x.fillStyle = '#e7e1d6';
  x.fillRect(0, 0, w, h);
  for (let r = 0; r < 10; r++)
    for (let c = 0; c < 4; c++) {
      x.fillStyle = Math.random() < 0.25 ? '#ffe3a0' : '#6a8299';
      x.fillRect(5 + c * 15, 4 + r * 12.6, 9, 7);
    }
  x.fillStyle = '#8a7a68';
  x.fillRect(24, 116, 16, 12);
});
const resB = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  M(0xffffff, { map: resT, roughness: 0.7 }),
  NPOI
);
const roofB = new THREE.InstancedMesh(
  new THREE.BoxGeometry(1, 1, 1),
  M(0x6f6a64, { roughness: 0.9 }),
  NPOI
);
const roofSignMats = {},
  boardMats = {};
function roofSignMat(p) {
  const k = p.name;
  if (roofSignMats[k]) return roofSignMats[k];
  const X = SHOPX[p.name] || { bg: '#d94f3d' };
  const t = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = X.bg;
    x.beginPath();
    x.arc(w / 2, h / 2, 120, 0, 7);
    x.fill();
    x.lineWidth = 10;
    x.strokeStyle = '#fff';
    x.stroke();
    x.font = '150px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(p.e, w / 2, h / 2 + 10);
  });
  return (roofSignMats[k] = new THREE.MeshBasicMaterial({
    map: t,
    transparent: true,
    alphaTest: 0.3,
    side: THREE.DoubleSide,
    toneMapped: false,
  }));
}
function boardMat(p) {
  const k = p.name;
  if (boardMats[k]) return boardMats[k];
  const X = SHOPX[p.name] || { s: '欢迎光临' };
  const t = canvasTex(128, 192, (x, w, h) => {
    x.fillStyle = '#6b4a2f';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#22312a';
    x.fillRect(8, 8, w - 16, h - 16);
    x.fillStyle = '#fff';
    x.textAlign = 'center';
    x.font = 'bold 20px sans-serif';
    x.fillText('今日推荐', w / 2, 34);
    x.fillStyle = '#ffe28a';
    x.font = 'bold 17px sans-serif';
    const t2 = X.s;
    const half = Math.ceil(t2.length / 2);
    x.fillText(t2.slice(0, half), w / 2, 84);
    x.fillText(t2.slice(half), w / 2, 110);
    x.font = '40px sans-serif';
    x.fillText(p.e, w / 2, 162);
  });
  return (boardMats[k] = M(0xffffff, { map: t, roughness: 0.9 }));
}
const roofSigns = [],
  boards = [];
for (let i = 0; i < 40; i++) {
  const g = new THREE.Group();
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), M(0xffffff));
  pl.position.y = 1.9;
  g.add(pl);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 6), M(0x555555));
  pole.position.y = 0.6;
  g.add(pole);
  g.visible = false;
  scene.add(g);
  roofSigns.push({ g, pl });
  const b = new THREE.Group();
  const geo = new THREE.BoxGeometry(0.8, 1.15, 0.06);
  const f1 = new THREE.Mesh(geo, M(0xffffff));
  f1.position.set(0, 0.55, 0.16);
  f1.rotation.x = -0.25;
  const f2 = f1.clone();
  f2.position.z = -0.16;
  f2.rotation.x = 0.25;
  b.add(f1, f2);
  b.visible = false;
  scene.add(b);
  boards.push({ g: b, f1, f2 });
}
[shopB, awnB, resB, roofB].forEach((m) => {
  m.castShadow = true;
  m.receiveShadow = true;
  m.count = 0;
  scene.add(m);
});
const signMats = {};
function signMat(p) {
  const k = p.name + p.e;
  if (signMats[k]) return signMats[k];
  const t = canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = p.shop ? '#' + p.col.toString(16).padStart(6, '0') : '#24364d';
    x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,.85)';
    x.lineWidth = 6;
    x.strokeRect(5, 5, w - 10, h - 10);
    x.fillStyle = '#fff';
    x.font = 'bold 62px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(p.name, w / 2, h / 2 + 3);
  });
  return (signMats[k] = new THREE.MeshBasicMaterial({ map: t, toneMapped: false }));
}
const signG = new THREE.PlaneGeometry(1, 1);
const signs = [];
for (let i = 0; i < 120; i++) {
  const s = new THREE.Mesh(signG, signMats.x || M(0xffffff));
  s.visible = false;
  scene.add(s);
  signs.push(s);
}
const curPOI = [];
let poiBI = 1e9,
  poiBJ = 1e9;
function updPOI(px, pz) {
  const bi = Math.floor(px / B),
    bj = Math.floor(pz / B);
  if (bi === poiBI && bj === poiBJ) return;
  poiBI = bi;
  poiBJ = bj;
  curPOI.length = 0;
  let ns = 0,
    nr = 0,
    sg = 0,
    rs = 0;
  for (let a = -2; a <= 2; a++)
    for (let b = -2; b <= 2; b++)
      for (const p of poisOfBlock(bi + a, bj + b)) {
        curPOI.push(p);
        const alongX = p.n.z !== 0;
        const sx = alongX ? p.w : p.d,
          sz = alongX ? p.d : p.w;
        if (p.shop && ns < NPOI) {
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(p.ctr.x, p.ht / 2 + 0.16, p.ctr.z);
          dummy.scale.set(sx, p.ht, sz);
          dummy.updateMatrix();
          shopB.setMatrixAt(ns, dummy.matrix);
          dummy.position.set(p.door.x + p.n.x * 0.9, 2.9, p.door.z + p.n.z * 0.9);
          dummy.scale.set(alongX ? p.w * 0.9 : 1.8, 0.25, alongX ? 1.8 : p.w * 0.9);
          dummy.updateMatrix();
          awnB.setMatrixAt(ns, dummy.matrix);
          awnB.setColorAt(ns, new THREE.Color(p.col));
          ns++;
        } else if (!p.shop && nr < NPOI) {
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(p.ctr.x, p.ht / 2 + 0.16, p.ctr.z);
          dummy.scale.set(sx, p.ht, sz);
          dummy.updateMatrix();
          resB.setMatrixAt(nr, dummy.matrix);
          dummy.position.set(p.ctr.x, p.ht + 0.4, p.ctr.z);
          dummy.scale.set(sx + 0.6, 0.5, sz + 0.6);
          dummy.updateMatrix();
          roofB.setMatrixAt(nr, dummy.matrix);
          nr++;
        }
        if (p.shop && Math.abs(a) <= 1 && Math.abs(b) <= 1 && rs < roofSigns.length) {
          const r = roofSigns[rs],
            bd = boards[rs];
          rs++;
          const ry = Math.atan2(p.n.x, p.n.z),
            tx = -p.n.z,
            tz = p.n.x;
          r.pl.material = roofSignMat(p);
          r.g.position.set(
            p.ctr.x + p.n.x * (p.d / 2 - 1.2),
            p.ht + 0.16,
            p.ctr.z + p.n.z * (p.d / 2 - 1.2)
          );
          r.g.rotation.set(0, ry, 0);
          r.g.visible = true;
          const bm = boardMat(p);
          bd.f1.material = bm;
          bd.f2.material = bm;
          bd.g.position.set(
            p.door.x + p.n.x * 2.2 + tx * (p.w * 0.32),
            0,
            p.door.z + p.n.z * 2.2 + tz * (p.w * 0.32)
          );
          bd.g.rotation.set(0, ry + PI / 2, 0);
          bd.g.visible = true;
        }
        if (Math.abs(a) <= 1 && Math.abs(b) <= 1 && sg < signs.length) {
          const s = signs[sg++];
          s.material = signMat(p);
          s.visible = true;
          const y = p.shop ? 3.75 : Math.min(p.ht - 1.5, 6.5);
          s.position.set(p.door.x + p.n.x * 0.06, y, p.door.z + p.n.z * 0.06);
          s.rotation.set(0, Math.atan2(p.n.x, p.n.z), 0);
          s.scale.set(p.shop ? p.w * 0.75 : 7, p.shop ? 1.6 : 1.4, 1);
        }
      }
  for (let i = sg; i < signs.length; i++) signs[i].visible = false;
  for (let i = rs; i < roofSigns.length; i++) {
    roofSigns[i].g.visible = false;
    boards[i].g.visible = false;
  }
  shopB.count = awnB.count = ns;
  resB.count = roofB.count = nr;
  [shopB, awnB, resB, roofB].forEach((m) => {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
}
// ===== visual detail pass: facades, rooftops, trees, plates =====
(function () {
  const AN = renderer.capabilities.getMaxAnisotropy
    ? Math.min(8, renderer.capabilities.getMaxAnisotropy())
    : 1;
  const hiTex = (w, h, fn) => {
    const t = canvasTex(w, h, fn, true);
    t.anisotropy = AN;
    t.needsUpdate = true;
    return t;
  };
  // residential facade (neutral, tinted per instance)
  const res2 = hiTex(256, 512, (x, w, h) => {
    x.fillStyle = '#f3f1ec';
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      x.fillStyle = `rgba(0,0,0,${Math.random() * 0.035})`;
      x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    const rows = 10,
      rh = (h - 56) / rows;
    for (let r = 0; r < rows; r++) {
      const y = 6 + r * rh;
      x.fillStyle = 'rgba(0,0,0,.10)';
      x.fillRect(0, y + rh - 5, w, 4);
      x.fillStyle = 'rgba(255,255,255,.6)';
      x.fillRect(0, y + rh - 6, w, 1.5);
      for (let c = 0; c < 4; c++) {
        const wx = 12 + c * 61,
          wy = y + 8,
          ww = 40,
          wh = rh - 22;
        x.fillStyle = '#d9d6cf';
        x.fillRect(wx - 3, wy - 3, ww + 6, wh + 6);
        const lit = Math.random() < 0.22;
        const g = x.createLinearGradient(wx, wy, wx + ww, wy + wh);
        if (lit) {
          g.addColorStop(0, '#ffe9b0');
          g.addColorStop(1, '#f3c871');
        } else {
          g.addColorStop(0, '#8fb3cc');
          g.addColorStop(0.55, '#4f6f88');
          g.addColorStop(1, '#3b556b');
        }
        x.fillStyle = g;
        x.fillRect(wx, wy, ww, wh);
        x.fillStyle = 'rgba(255,255,255,.28)';
        x.beginPath();
        x.moveTo(wx + 4, wy + wh);
        x.lineTo(wx + ww * 0.45, wy);
        x.lineTo(wx + ww * 0.62, wy);
        x.lineTo(wx + ww * 0.17, wy + wh);
        x.fill();
        x.fillStyle = '#e8e5df';
        x.fillRect(wx + ww / 2 - 1.5, wy, 3, wh);
        x.fillRect(wx, wy + wh * 0.38, ww, 2.5);
        if (c % 2 === 1) {
          x.fillStyle = 'rgba(60,60,60,.55)';
          for (let k = 0; k < ww + 10; k += 5)
            x.fillRect(wx - 5 + k, wy + wh * 0.55, 1.6, wh * 0.45 + 3);
          x.fillRect(wx - 6, wy + wh * 0.55, ww + 12, 2.5);
          x.fillRect(wx - 6, wy + wh + 2, ww + 12, 3);
        } else if (Math.random() < 0.5) {
          x.fillStyle = '#e9e9e6';
          x.fillRect(wx + ww + 4, wy + wh - 12, 11, 10);
          x.fillStyle = '#9a9a96';
          x.fillRect(wx + ww + 6, wy + wh - 10, 7, 6);
        }
        if (!lit && Math.random() < 0.35) {
          x.fillStyle = pick(['#c96b5a', '#e2b65b', '#7d9c6b', '#d8d0c0']);
          x.fillRect(wx + 2, wy + 2, ww * 0.3, wh - 4);
        }
      }
    }
    x.fillStyle = '#b9b1a6';
    x.fillRect(0, h - 50, w, 50);
    x.fillStyle = '#6d5d4c';
    x.fillRect(w / 2 - 18, h - 46, 36, 46);
    x.fillStyle = '#9cc0d6';
    x.fillRect(w / 2 - 14, h - 42, 28, 26);
    x.fillStyle = '#d24a3a';
    x.fillRect(w / 2 - 20, h - 50, 40, 5);
    x.fillStyle = 'rgba(0,0,0,.18)';
    x.fillRect(0, h - 52, w, 3);
  });
  resB.material.map = res2;
  resB.material.color.set(0xffffff);
  resB.material.roughness = 0.75;
  resB.material.needsUpdate = true;
  // shop front
  const shop2 = hiTex(256, 256, (x, w, h) => {
    x.fillStyle = '#efe8dc';
    x.fillRect(0, 0, w, h);
    x.fillStyle = '#e2d9ca';
    for (let y = 0; y < h; y += 12) x.fillRect(0, y, w, 1);
    x.fillStyle = '#3a3f45';
    x.fillRect(10, 104, 236, 146);
    const g = x.createLinearGradient(0, 108, 0, 246);
    g.addColorStop(0, '#bcd6e4');
    g.addColorStop(1, '#6f93a8');
    x.fillStyle = g;
    x.fillRect(16, 110, 224, 134);
    x.fillStyle = 'rgba(255,240,200,.55)';
    x.fillRect(22, 170, 70, 60);
    x.fillRect(164, 170, 70, 60);
    x.fillStyle = 'rgba(255,255,255,.35)';
    x.beginPath();
    x.moveTo(30, 244);
    x.lineTo(90, 110);
    x.lineTo(112, 110);
    x.lineTo(52, 244);
    x.fill();
    x.fillStyle = '#3a3f45';
    [96, 160].forEach((v) => x.fillRect(v, 110, 5, 134));
    x.fillRect(16, 160, 224, 4);
    x.fillStyle = '#2b2f33';
    x.fillRect(103, 140, 54, 104);
    x.fillStyle = '#9ec3d8';
    x.fillRect(107, 144, 22, 96);
    x.fillRect(131, 144, 22, 96);
    x.fillStyle = '#d8d8d8';
    x.fillRect(126, 186, 3, 18);
    x.fillRect(131, 186, 3, 18);
    x.fillStyle = '#8b7f70';
    x.fillRect(0, 246, w, 10);
    x.fillStyle = '#d9cfbf';
    for (let c = 0; c < 3; c++) {
      x.fillRect(22 + c * 80, 18, 58, 58);
    }
    x.fillStyle = '#7896aa';
    for (let c = 0; c < 3; c++) x.fillRect(27 + c * 80, 23, 48, 48);
  });
  shopB.material.map = shop2;
  shopB.material.needsUpdate = true;
  const awT = hiTex(128, 32, (x, w, h) => {
    for (let i = 0; i < 8; i++) {
      x.fillStyle = i % 2 ? '#ffffff' : '#c9c9c9';
      x.fillRect(i * 16, 0, 16, h);
    }
    x.fillStyle = 'rgba(0,0,0,.18)';
    x.fillRect(0, h - 4, w, 4);
  });
  awnB.material.map = awT;
  awnB.material.needsUpdate = true;
  roofB.material.color.set(0x8c857c);
  // rooftop props
  const acG = new THREE.BoxGeometry(1, 1, 1),
    tankG = new THREE.CylinderGeometry(0.5, 0.5, 1, 14);
  const acB = new THREE.InstancedMesh(
      acG,
      M(0xd6d6d2, { roughness: 0.6, metalness: 0.2 }),
      NPOI * 2
    ),
    tankB = new THREE.InstancedMesh(tankG, M(0x9fb4c4, { roughness: 0.4, metalness: 0.5 }), NPOI),
    stairB = new THREE.InstancedMesh(acG, M(0xbdb5aa, { roughness: 0.85 }), NPOI);
  [acB, tankB, stairB].forEach((m) => {
    m.castShadow = true;
    m.count = 0;
    scene.add(m);
  });
  for (let i = 0; i < NPOI; i++) resB.setColorAt(i, new THREE.Color(0xffffff));
  resB.instanceColor.needsUpdate = true;
  resB.material.needsUpdate = true;
  const _up = updPOI;
  updPOI = function (px, pz) {
    const b0 = poiBI,
      b1 = poiBJ;
    _up(px, pz);
    if (b0 === poiBI && b1 === poiBJ) return;
    let na = 0,
      nt = 0,
      ns = 0,
      nr = 0;
    for (const p of curPOI) {
      const h = hash(p.ctr.x * 0.13, p.ctr.z * 0.17);
      if (!p.shop) {
        if (nr < NPOI) {
          resB.setColorAt(
            nr,
            new THREE.Color().setHSL(0.05 + h * 0.55, 0.18 + h * 0.15, 0.82 + h * 0.08)
          );
          nr++;
        }
        const top = p.ht + 0.65,
          alongX = p.n.z !== 0,
          sx = alongX ? p.w : p.d,
          sz = alongX ? p.d : p.w;
        if (nt < NPOI) {
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(p.ctr.x + sx * 0.22, top + 0.9, p.ctr.z - sz * 0.2);
          dummy.scale.set(1.6, 1.8, 1.6);
          dummy.updateMatrix();
          tankB.setMatrixAt(nt++, dummy.matrix);
        }
        if (ns < NPOI) {
          dummy.position.set(p.ctr.x - sx * 0.25, top + 0.9, p.ctr.z + sz * 0.18);
          dummy.scale.set(2.4, 1.8, 2.2);
          dummy.updateMatrix();
          stairB.setMatrixAt(ns++, dummy.matrix);
        }
        for (let k = 0; k < 2 && na < NPOI * 2; k++) {
          dummy.position.set(
            p.ctr.x + (k ? -0.15 : 0.25) * sx,
            top + 0.35,
            p.ctr.z + (k ? -0.3 : 0.3) * sz
          );
          dummy.scale.set(1.1, 0.7, 0.8);
          dummy.updateMatrix();
          acB.setMatrixAt(na++, dummy.matrix);
        }
      } else if (na < NPOI * 2) {
        const alongX = p.n.z !== 0,
          sx = alongX ? p.w : p.d,
          sz = alongX ? p.d : p.w;
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(p.ctr.x + sx * 0.2, p.ht + 0.55, p.ctr.z);
        dummy.scale.set(1.2, 0.75, 0.9);
        dummy.updateMatrix();
        acB.setMatrixAt(na++, dummy.matrix);
      }
    }
    acB.count = na;
    tankB.count = nt;
    stairB.count = ns;
    [acB, tankB, stairB].forEach((m) => (m.instanceMatrix.needsUpdate = true));
    if (resB.instanceColor) resB.instanceColor.needsUpdate = true;
  };
  poiBI = 1e9;
  // fluffier trees: clustered canopy
  function merge(list) {
    let n = 0;
    list.forEach((g) => (n += g.attributes.position.count));
    const pos = new Float32Array(n * 3),
      nor = new Float32Array(n * 3);
    let o = 0;
    list.forEach((g) => {
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      o += g.attributes.position.count;
    });
    const r = new THREE.BufferGeometry();
    r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    return r;
  }
  const parts = [
    [0, 0, 0, 0.85],
    [0.5, -0.15, 0.25, 0.6],
    [-0.45, -0.2, -0.2, 0.62],
    [0.1, 0.45, -0.1, 0.58],
    [-0.15, -0.3, 0.5, 0.55],
    [0.2, -0.25, -0.5, 0.55],
  ].map(([a, b, c, s]) => {
    const g = new THREE.IcosahedronGeometry(s, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const k = 1 + Math.sin(p.getX(i) * 13 + p.getY(i) * 7 + p.getZ(i) * 5) * 0.08;
      p.setXYZ(i, p.getX(i) * k + a, p.getY(i) * k + b, p.getZ(i) * k + c);
    }
    g.computeVertexNormals();
    return g;
  });
  treeTop.geometry = merge(parts);
  treeTrunk.geometry = new THREE.CylinderGeometry(0.12, 0.2, 1, 8);
})();
