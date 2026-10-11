'use strict';
// ── js/entities/traffic.js ──
// 车流：AI 巡航避障、路边停车、抢车与车主追逐
// ===== traffic update =====
const obst = [];
function updTraffic(dt) {
  const want = [7, 15, 24][traffic];
  if (cars.length < want && Math.random() < 0.25) spawnCar();
  for (let i = cars.length - 1; i >= 0; i--) {
    const c = cars[i];
    if (
      c.pos.distanceTo(player.position) > 240 ||
      (cars.length > want + 2 && c.pos.distanceTo(player.position) > 120)
    ) {
      disposeCar(c);
      cars.splice(i, 1);
    }
  }
  obst.length = 0;
  for (const c of cars) {
    obst.push({ p: c.pos, hl: c.hl, hw: c.hw, o: c, f: c.fwd });
    if (c.trg) obst.push({ p: c.trC, hl: 6.7, hw: 1.25, o: c, f: c.trF });
  }
  const pp = player.position,
    pAlive = state === 'ride';
  for (const c of cars) {
    let dist = 1e9;
    let blockedByPlayer = false;
    const rx = -c.fwd.z,
      rz = c.fwd.x;
    if (c.seg === 0) {
      const toStop = c.segLen - c.s;
      const Mx = c.node[0] + D[c.dir][0],
        Mz = c.node[1] + D[c.dir][1];
      const L = light(Mx, Mz, c.dir % 2);
      if (L !== 'g') {
        const canStop = toStop > (c.v * c.v) / (2 * 7) + 0.8;
        if ((L === 'r' && toStop > -0.5) || canStop)
          dist = Math.min(dist, toStop - 0.6 - (c.trg ? 0 : 0));
      }
      if (c.nd !== c.dir && toStop < 35) dist = Math.min(dist, toStop + 4);
    }
    dist = Math.min(dist, pedGap(c, rx, rz));
    for (const o of obst) {
      if (o.o === c) continue;
      const dx = o.p.x - c.pos.x,
        dz = o.p.z - c.pos.z;
      const f = dx * c.fwd.x + dz * c.fwd.z;
      if (f <= 0 || f > 45) continue;
      const lat = Math.abs(dx * rx + dz * rz);
      if (lat > o.hw + 1.1) continue;
      dist = Math.min(dist, f - o.hl - c.hl - 2.2);
    }
    if (pAlive || state === 'crash') {
      const dx = pp.x - c.pos.x,
        dz = pp.z - c.pos.z;
      const f = dx * c.fwd.x + dz * c.fwd.z,
        lat = Math.abs(dx * rx + dz * rz);
      if (f > 0 && f < 40 && lat < c.hw + (drive === 'car' ? 1.6 : 0.9)) {
        const g = f - c.hl - 2.5;
        if (g < dist) {
          dist = g;
          blockedByPlayer = true;
        }
      }
    }
    let vt = Math.min(c.vmax, Math.sqrt(Math.max(0, 2 * 6 * Math.max(0, dist))));
    if (c.seg === 1 && c.nd !== c.dir) vt = Math.min(vt, c.nd === (c.dir + 1) % 4 ? 5.5 : 7.5);
    const dv = vt - c.v;
    c.v += clamp(dv, -10 * dt, 2.8 * dt);
    if (c.v < 0) c.v = 0;
    if (c.bar) {
      const k = ((T * 3) | 0) % 2;
      c.bar[0].emissiveIntensity = k ? 3.5 : 0.2;
      c.bar[1].emissiveIntensity = k ? 0.2 : 3.5;
    }
    const braking = dv < -0.5 || c.v < 0.3;
    c.tail.forEach((m) => (m.emissiveIntensity = braking ? 2.2 : 0.45));
    if (blockedByPlayer && c.v < 0.4) {
      c.stopT += dt;
      if (c.stopT > 2.5) {
        c.stopT = -3;
        if (c.pos.distanceTo(pp) < 35) {
          SFX.horn();
          toast('🚗 嘀嘀！后面的车在按喇叭');
        }
      }
    } else if (c.stopT > 0) c.stopT = 0;
    c.s += c.v * dt;
    while (c.s >= c.segLen) {
      c.s -= c.segLen;
      if (c.seg === 0) setTurn(c);
      else {
        c.node = c.nextNode;
        c.dir = c.nd;
        setStraight(c);
      }
    }
    carPos(c);
    placeCar(c);
    for (const w of c.wheels) w.w.rotation.z -= (c.v * dt) / w.r;
  }
}
function carPlayerInteract(dt) {
  if (state !== 'ride') return;
  const pp = player.position;
  const pf = V(Math.cos(heading), 0, -Math.sin(heading));
  for (const o of obst) {
    const c = o.o;
    const dx = pp.x - o.p.x,
      dz = pp.z - o.p.z;
    const f = dx * o.f.x + dz * o.f.z,
      lat = dx * -o.f.z + dz * o.f.x;
    const ph = drive === 'car' ? 2.5 : drive === 'moto' ? 1.0 : 0.45,
      pw2 = drive === 'car' ? 1.0 : drive === 'moto' ? 0.45 : 0.35;
    if (Math.abs(f) < o.hl + ph && Math.abs(lat) < o.hw + pw2) {
      const rel = Math.abs(c.v - pf.dot(o.f) * v);
      if ((c.v > 2.5 && f > -o.hl * 0.3) || rel > 6) {
        crash('car', c.v > v ? o.f : pf, Math.max(c.v, v));
        return;
      }
      const push = Math.abs(lat) / (o.hw + 0.35) > Math.abs(f) / (o.hl + 0.45);
      if (push) {
        pp.x += -o.f.z * Math.sign(lat) * (o.hw + pw2 + 0.01 - Math.abs(lat));
        pp.z += o.f.x * Math.sign(lat) * (o.hw + pw2 + 0.01 - Math.abs(lat));
      } else {
        v *= 0.3;
      }
      if (bumpCool <= 0) {
        SFX.bump();
        bumpCool = 0.6;
        stats.calm = 0;
        accident();
        delivBump(15);
        if (drive === 'bike') hurt(4, '被车剐蹭');
      }
    } else if (
      o.p === c.pos &&
      c.v > 4 &&
      Math.abs(f) < o.hl &&
      Math.abs(lat) < o.hw + 1.7 &&
      !c.near
    ) {
      c.near = true;
      stats.near++;
      stats.score += 15;
      toast(`😎 擦肩而过！+15`);
    }
    if (o.p === c.pos && Math.abs(f) > o.hl + 6) c.near = false;
    if (o.p === c.pos && mission && mission.k === 'cars' && Math.hypot(dx, dz) < 9) {
      if (c.type === 'pana' && !stats.pana.has(c.id)) {
        stats.pana.add(c.id);
        toast(`🏎️ 帕拉梅拉 ${Math.min(mission.n, stats.pana.size)}/${mission.n}`);
      }
      if (c.type === 'bmw' && !stats.bmw.has(c.id)) {
        stats.bmw.add(c.id);
        toast(`🚘 宝马 ${Math.min(mission.n, stats.bmw.size)}/${mission.n}`);
      }
    }
  }
}

// ===== lane arrows =====
const arrowT = canvasTex(
  320,
  176,
  (x, w, h) => {
    x.clearRect(0, 0, w, h);
    x.fillStyle = 'rgba(245,245,240,.92)';
    const arr = (cx, cy, dir) => {
      x.save();
      x.translate(cx, cy);
      x.scale(dir, 1);
      x.beginPath();
      x.moveTo(-26, -4);
      x.lineTo(8, -4);
      x.lineTo(8, -12);
      x.lineTo(28, 0);
      x.lineTo(8, 12);
      x.lineTo(8, 4);
      x.lineTo(-26, 4);
      x.closePath();
      x.fill();
      x.restore();
    };
    arr(150, ((5.5 + 2.2) / 11) * 176, 1);
    arr(170, ((5.5 - 2.2) / 11) * 176, -1);
    // bike lane icon
    x.strokeStyle = 'rgba(245,245,240,.8)';
    x.lineWidth = 2;
    const bk = (cx, cy) => {
      x.beginPath();
      x.arc(cx - 8, cy, 5, 0, 7);
      x.arc(cx + 8, cy, 5, 0, 7);
      x.stroke();
      x.beginPath();
      x.moveTo(cx - 8, cy);
      x.lineTo(cx, cy - 6);
      x.lineTo(cx + 8, cy);
      x.stroke();
    };
    bk(60, ((5.5 + 4.8) / 11) * 176);
    bk(260, ((5.5 - 4.8) / 11) * 176);
  },
  true
);
arrowT.repeat.set(20, 1);
const arrowM = new THREE.MeshStandardMaterial({
  map: arrowT,
  transparent: true,
  roughness: 0.8,
  depthWrite: false,
  polygonOffset: true,
  polygonOffsetFactor: -1.5,
});
const arrX = [],
  arrZ = [];
for (let k = 0; k < 5; k++) {
  const a = mesh(new THREE.PlaneGeometry(600, 11), arrowM, scene);
  a.rotation.x = -PI / 2;
  a.castShadow = false;
  arrX.push(a);
  const b = mesh(new THREE.PlaneGeometry(600, 11), arrowM, scene);
  b.rotation.set(-PI / 2, 0, PI / 2);
  b.castShadow = false;
  arrZ.push(b);
}
roadX.concat(roadZ, arrX, arrZ).forEach((m) => (m.visible = false)); // 路面标记初始隐藏（roadX/roadZ 来自 world/road.js）
function updArrows(px, pz, ni, nj) {
  for (let k = 0; k < 5; k++) {
    arrX[k].position.set(Math.round(px / B) * B + B / 2, 0.013, (nj - 2 + k) * B);
    arrZ[k].position.set((ni - 2 + k) * B, 0.013, Math.round(pz / B) * B + B / 2);
  }
}

function labelSprite(txt, bg) {
  const t = canvasTex(256, 64, (x, w, h) => {
    x.fillStyle = bg;
    const r = 28;
    x.beginPath();
    x.moveTo(r, 2);
    x.arcTo(w - 2, 2, w - 2, h - 2, r);
    x.arcTo(w - 2, h - 2, 2, h - 2, r);
    x.arcTo(2, h - 2, 2, 2, r);
    x.arcTo(2, 2, w - 2, 2, r);
    x.fill();
    x.fillStyle = '#fff';
    x.font = 'bold 30px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(txt, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: t, depthTest: false, toneMapped: false })
  );
  s.scale.set(3.2, 0.8, 1);
  s.renderOrder = 9;
  return s;
}
function nearRoadSpot(minD, maxD) {
  const pp = player.position;
  for (let t = 0; t < 20; t++) {
    const alongX = Math.random() < 0.5,
      side = Math.random() < 0.5 ? 1 : -1;
    const ri = Math.round(pp.x / B) + Math.floor(rnd(-1, 2)),
      rj = Math.round(pp.z / B) + Math.floor(rnd(-1, 2));
    const a = (alongX ? pp.x : pp.z) + rnd(-maxD, maxD);
    const m = a - Math.round(a / B) * B;
    if (Math.abs(m) < RH + 14) continue;
    let x, z, h;
    if (alongX) {
      z = rj * B + side * (RH - 1.35);
      x = a;
      h = side > 0 ? 0 : PI;
    } else {
      x = ri * B - side * (RH - 1.35);
      z = a;
      h = side > 0 ? -PI / 2 : PI / 2;
    }
    const d = Math.hypot(x - pp.x, z - pp.z);
    if (d < minD || d > maxD) continue;
    return { x, z, h, alongX, side, c: alongX ? rj * B : ri * B };
  }
  return null;
}
// --- parked cars & stealing ---
const parked = [];
let stolen = null,
  chase = null,
  stolenKeep = false;
const keyMark = labelSprite('🔑 空闲车辆', 'rgba(30,150,80,.92)');
keyMark.visible = false;
scene.add(keyMark);
function spawnParked() {
  const s = nearRoadSpot(50, 170);
  if (!s) return;
  if (parked.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 20)) return;
  const type = pick(['sedan', 'bmw', 'hatch', 'suv', 'pana']);
  const b = buildCar(type);
  b.g.position.set(s.x, 0, s.z);
  b.g.rotation.y = s.h;
  scene.add(b.g);
  parked.push({ ...s, type, b });
}
function dropParked(p) {
  scene.remove(p.b.g);
  parked.splice(parked.indexOf(p), 1);
}
// ===== v0.1.10 抢车：走过去上车 → 车主步行/打车追 → 30 秒放弃 =====
// chaser: 车主（跑步 / 拦出租车）
const chaser = new THREE.Group();
const chaserRun = new THREE.Group(),
  chaserTaxi = new THREE.Group();
(function () {
  const pp = makePed(false);
  scene.remove(pp.g);
  chaserRun.add(pp.g);
  chaser.ped = pp;
  chaser.add(chaserRun);
  const oc = CARS.sedan.cols;
  CARS.sedan.cols = [0xf2c200];
  const tx = buildCar('sedan');
  CARS.sedan.cols = oc;
  chaserTaxi.add(tx.g);
  const tl = labelSprite('🚕 车主打车追你', 'rgba(210,140,0,.92)');
  tl.position.y = 3.2;
  chaserTaxi.add(tl);
  chaserTaxi.visible = false;
  chaser.add(chaserTaxi);
  const tag = labelSprite('😡 车主在追你！', 'rgba(210,40,40,.92)');
  tag.position.y = 2.6;
  chaserRun.add(tag);
})();
chaser.visible = false;
scene.add(chaser);
// 你的自行车：抢车时留在原地，需要走回去取
let leftBike = null,
  board = null,
  stolenWreck = null;
const bikeMark = labelSprite('🚲 你的自行车', 'rgba(40,120,220,.92)');
bikeMark.visible = false;
scene.add(bikeMark);
const CHASE_MAX = 30;
function stealCar(p) {
  if (stolen || board || state !== 'ride') return;
  parked.splice(parked.indexOf(p), 1);
  // 鹈鹕下车，走到驾驶门
  pel.updateMatrixWorld(true);
  scene.attach(pel);
  pel.quaternion.identity();
  pel.position.y = 1.12;
  const lx = Math.cos(p.h + PI / 2),
    lz = -Math.sin(p.h + PI / 2);
  const door = V(
    p.x + lx * 1.35 + Math.cos(p.h) * 0.3,
    1.12,
    p.z + lz * 1.35 - Math.sin(p.h) * 0.3
  );
  board = { p, door, t: 0, ph: 'walk', ft: 0 };
  state = 'board';
  v = 0;
  gas = false;
  $('act').style.display = 'none';
  // 车主从附近冲出来
  const sx = p.x + Math.cos(p.h) * 14 + lx * 6,
    sz = p.z - Math.sin(p.h) * 14 + lz * 6;
  chase = { t: 0, x: sx, z: sz, v: 0, far: 0, taxi: false, run: 0 };
  chaser.visible = true;
  chaserRun.visible = true;
  chaserTaxi.visible = false;
  chaser.position.set(sx, 0, sz);
  say('车主：喂！那是我的车！！');
}
function updBoard(dt) {
  if (!board) return;
  const b = board,
    P = pel.position;
  b.t += dt;
  const dx = b.door.x - P.x,
    dz = b.door.z - P.z,
    d = Math.hypot(dx, dz);
  if (b.ph === 'walk') {
    if (d > 0.12 && b.t < 6) {
      const st = Math.min(d, 2.6 * dt);
      P.x += (dx / d) * st;
      P.z += (dz / d) * st;
      pel.rotation.set(0, Math.atan2(-dz, dx), 0);
      b.ft += dt * 2.6 * 3.2;
      updLegs(b.ft);
      P.y = 1.12 + Math.abs(Math.sin(b.ft)) * 0.05;
    } else {
      b.ph = 'in';
      b.t = 0;
      pel.rotation.set(0, b.p.h, 0);
      SFX.tick(0.2);
    }
  } else if (b.t > 0.45) finishBoard();
}
function finishBoard() {
  const p = board.p;
  board = null;
  // 自行车留在原地
  bike.updateMatrixWorld(true);
  leftBike = { g: bike.clone(true), x: player.position.x, z: player.position.z, h: heading };
  bike.matrixWorld.decompose(leftBike.g.position, leftBike.g.quaternion, leftBike.g.scale);
  scene.add(leftBike.g);
  stolen = p;
  stolenKeep = false;
  if (p.fuel == null) p.fuel = rnd(20, 35);
  setModel('pana');
  pcar.g.visible = false;
  scene.remove(p.b.g);
  player.add(p.b.g);
  p.b.g.position.copy(pcar.g.position);
  p.b.g.rotation.copy(pcar.g.rotation);
  p.b.g.scale.copy(pcar.g.scale);
  player.position.set(p.x, 0, p.z);
  heading = p.h;
  player.rotation.y = heading;
  lean.rotation.x = 0;
  lean.attach(pel);
  pel.position.copy(PCAR);
  pel.quaternion.identity();
  pel.scale.set(1, 1, 1);
  v = 0;
  belt = true;
  setModel('pana');
  pcar.g.visible = false;
  refreshDriveUI();
  state = 'ride';
  camInit = false;
  SFX.horn();
  unlock('steal');
  toast(`🚗 上车了！油量只剩 ${Math.round(p.fuel)}%，偷来的车没法加油`, 2800);
}
// 换车后统一刷新驾驶 UI（挡杆、安全带、喇叭/车铃、转向灯、油门文字）
function refreshDriveUI() {
  const motor = drive !== 'bike';
  if (!padOn) $('gas').textContent = motor ? '油门' : '蹬车';
  $('bell').innerHTML = motor ? '<i class="ico i-horn"></i>' : '<i class="ico i-bell"></i>';
  $('bell').setAttribute('aria-label', motor ? '喇叭' : '车铃');
  $('sig').style.display = motor ? 'flex' : 'none';
  $('gear').style.display = drive === 'car' ? 'block' : 'none';
  $('beltB').style.display = drive === 'car' && !exam ? 'block' : 'none';
  $('beltB').classList.toggle('on2', belt);
  if (window.updShift) updShift();
  updSigUI();
}
function releaseStolen() {
  if (!stolen) return;
  player.remove(stolen.b.g);
  stolen = null;
  stolenKeep = false;
  applyEquip();
}
// 离开偷来的车：kind = return(还车) | scrap(没油报废) | caught(被车主抓到)
function exitStolen(kind) {
  if (!stolen) return;
  const p = stolen;
  const lx = Math.cos(heading + PI / 2),
    lz = -Math.sin(heading + PI / 2);
  const door = V(player.position.x + lx * 1.5, 1.12, player.position.z + lz * 1.5);
  // 车留在原地（世界坐标）
  p.b.g.updateMatrixWorld(true);
  scene.attach(p.b.g);
  p.x = player.position.x;
  p.z = player.position.z;
  p.h = heading;
  stolen = null;
  stolenKeep = false;
  endChase();
  if (kind === 'return') parked.push(p);
  else {
    if (stolenWreck) scene.remove(stolenWreck.p.b.g);
    stolenWreck = { p, t: kind === 'scrap' ? 90 : 6, kind };
    if (kind === 'scrap') unlock('scrap');
    if (kind === 'scrap')
      p.b.g.traverse((o) => {
        if (o.isMesh && o.material && o.material.color) {
          o.material = o.material.clone();
          o.material.color.multiplyScalar(0.45);
        }
      });
  }
  const canFoot = state === 'ride';
  v = 0;
  if (canFoot) startFoot();
  if (leftBike) {
    player.position.set(leftBike.x, 0, leftBike.z);
    heading = leftBike.h;
    player.rotation.y = heading;
    scene.remove(leftBike.g);
    leftBike = null;
  }
  applyEquip();
  if (canFoot) {
    pel.position.copy(door);
    FOOT.yaw = heading;
    camInit = false;
  }
}
function endChase() {
  chase = null;
  chaser.visible = false;
}
function crimeReset() {
  endChase();
  if (board) {
    board = null;
    if (state === 'board') state = 'ride';
  }
  releaseStolen();
  if (leftBike) {
    scene.remove(leftBike.g);
    leftBike = null;
  }
  parked.slice().forEach(dropParked);
}
function updChase(dt, t) {
  const pp = player.position;
  chase.t += dt;
  const tx = board ? board.door.x : pp.x,
    tz = board ? board.door.z : pp.z;
  const dx = tx - chase.x,
    dz = tz - chase.z,
    d = Math.hypot(dx, dz) || 1e-4;
  const ped = chaser.ped;
  if (!chase.taxi && d > 45 && chase.t > 4 && stolen) {
    chase.taxi = true;
    chaserRun.visible = false;
    chaserTaxi.visible = true;
    chase.v = Math.max(chase.v, 6);
    say('车主：师傅！跟上前面那辆车！');
  }
  const top = chase.taxi ? Math.max(14, Math.min(26, v + 3.5)) : 8.2;
  chase.v = Math.min(top, chase.v + (chase.taxi ? 7 : 5) * dt);
  const st = Math.min(Math.max(0, d - 2.2), chase.v * dt);
  chase.x += (dx / d) * st;
  chase.z += (dz / d) * st;
  chaser.position.set(chase.x, 0, chase.z);
  chaser.rotation.y = Math.atan2(-dz, dx);
  if (!chase.taxi) {
    chase.run += dt * chase.v * 1.7;
    const s = Math.sin(chase.run);
    ped.legs.forEach((l, i) => (l.rotation.z = (i ? 1 : -1) * s * 0.85));
    ped.arms.forEach((a, i) => (a.rotation.z = (i ? -1 : 1) * s * 0.9));
    ped.g.position.y = Math.abs(Math.cos(chase.run)) * 0.08;
  }
  if (!stolen) return;
  if (d < (chase.taxi ? 4.5 : 3.2) && v < 4 && state === 'ride') {
    coins = Math.max(0, coins - 200);
    saveCoins();
    SFX.lose();
    say('车主：抓到你了！车还我，再赔 200 块！');
    toast('🚔 被车主抓到：车被收回，罚 🪙200。自行车还在原地，走回去取吧', 3600);
    exitStolen('caught');
    return;
  }
  if (d > 200) {
    chase.far += dt;
    if (chase.far > 2) {
      endChase();
      stolenKeep = true;
      SFX.win();
      toast('😎 甩掉车主了！这辆车今天归你开', 3000);
      unlock('escape');
      return;
    }
  } else chase.far = 0;
  if (chase.t > CHASE_MAX) {
    const wasTaxi = chase.taxi;
    endChase();
    stolenKeep = true;
    SFX.win();
    say(
      wasTaxi
        ? '出租车司机：小伙子，追不上了，打表 86 块……'
        : '车主追了 30 秒，累得蹲在路边喘气，放弃了'
    );
    toast('😮‍💨 车主追了 30 秒放弃了，这辆车暂时归你', 3000);
    unlock('escape');
  }
}
function updCrime(dt, t) {
  const pp = player.position;
  if (!freeMode() || fieldOn) {
    parked.forEach((p) => (p.b.g.visible = false));
    keyMark.visible = false;
    bikeMark.visible = false;
    if (chase || stolen || board || leftBike) crimeReset();
    return;
  }
  parked.forEach((p) => (p.b.g.visible = true));
  for (const p of parked.slice()) if (Math.hypot(p.x - pp.x, p.z - pp.z) > 240) dropParked(p);
  if (parked.length < 4 && Math.random() < 0.02) spawnParked();
  if (stolenWreck) {
    const w = stolenWreck;
    w.t -= dt;
    const far = Math.hypot(w.p.x - pel.position.x, w.p.z - pel.position.z) > 220;
    if (w.kind === 'scrap' && Math.random() < dt * 6) puffSmoke(w.p.x, w.p.z);
    if (w.t <= 0 || far) {
      scene.remove(w.p.b.g);
      stolenWreck = null;
    }
  }
  let near = null,
    nd = 1e9;
  for (const p of parked) {
    const d = Math.hypot(p.x - pp.x, p.z - pp.z);
    if (d < nd) {
      nd = d;
      near = p;
    }
  }
  keyMark.visible = !!near && nd < 45 && drive === 'bike' && !stolen && !board && state === 'ride';
  if (keyMark.visible) keyMark.position.set(near.x, 3.2 + Math.sin(t * 3) * 0.15, near.z);
  // 自行车位置提示（步行时）
  bikeMark.visible = state === 'foot' && !stolen && drive === 'bike' && player.visible;
  if (bikeMark.visible) bikeMark.position.set(pp.x, 2.6 + Math.sin(t * 3) * 0.12, pp.z);
  if (board) updBoard(dt);
  if (chase && state !== 'paused') updChase(dt, t);
  if (
    state === 'ride' &&
    !chase &&
    !stolen &&
    !board &&
    drive === 'bike' &&
    near &&
    nd < 6 &&
    v < 1.2
  )
    return { key: 'steal' + near.x, label: '🚗 下车去抢这辆空闲的车', fn: () => stealCar(near) };
  if (state === 'ride' && stolen && stolenKeep && v < 0.5)
    return { key: 'ret', label: '🅿️ 还车（下车走回去取自行车）', fn: () => exitStolen('return') };
  return null;
}
// 报废车冒烟
const smokeM = new THREE.MeshBasicMaterial({
  color: 0x555555,
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
});
const smokes = [];
function puffSmoke(x, z) {
  let s = smokes.find((q) => !q.visible);
  if (!s) {
    if (smokes.length > 24) return;
    s = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), smokeM);
    scene.add(s);
    smokes.push(s);
  }
  s.visible = true;
  s.position.set(x + rnd(-0.6, 0.6), 1.2, z + rnd(-0.6, 0.6));
  s.userData.t = 0;
}
function updSmoke(dt) {
  for (const s of smokes)
    if (s.visible) {
      s.userData.t += dt;
      s.position.y += dt * 1.4;
      s.scale.setScalar(1 + s.userData.t * 1.2);
      if (s.userData.t > 2.2) s.visible = false;
    }
}
// --- snow ---
