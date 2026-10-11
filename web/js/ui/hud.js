'use strict';
// ── js/ui/hud.js ──
// HUD：仪表盘/罗盘、触控按键/摇杆、互动按钮、摄像机
// ===== gauge =====
const gc = $('gauge'),
  gx = gc.getContext('2d');
const GD = Math.min(window.devicePixelRatio || 1, 2);
gc.width = gc.height = 84 * GD;
let gaugeOn = true;
function drawGauge() {
  if (!gaugeOn) return;
  const s = 176,
    c = s / 2;
  gx.setTransform((GD * 84) / 176, 0, 0, (GD * 84) / 176, 0, 0);
  gx.clearRect(0, 0, s, s);
  const a0 = PI * 0.75,
    a1 = PI * 2.25,
    MAXK = drive !== 'bike' ? 160 : 60,
    kmh = v * 3.6;
  gx.lineCap = 'round';
  gx.lineWidth = 10;
  gx.strokeStyle = 'rgba(255,255,255,.18)';
  gx.beginPath();
  gx.arc(c, c, 70, a0, a1);
  gx.stroke();
  const ar = (k) => a0 + (a1 - a0) * clamp(k / MAXK, 0, 1);
  if (drive === 'car') {
    gx.font = '900 22px -apple-system,sans-serif';
    gx.fillStyle = { D: '#7cf2ff', R: '#ff6a6a', N: '#ffd34d', P: '#c9c9c9' }[gearMode];
    gx.textAlign = 'center';
    gx.fillText(gearMode, c, c - 30);
  }
  if (drive === 'bike') {
    gx.strokeStyle = 'rgba(255,70,70,.55)';
    gx.beginPath();
    gx.arc(c, c, 70, ar(30), a1);
    gx.stroke();
  }
  const grd = gx.createLinearGradient(20, 0, 156, 0);
  grd.addColorStop(0, '#7cf2ff');
  grd.addColorStop(1, '#ffb347');
  gx.strokeStyle = grd;
  gx.beginPath();
  gx.arc(c, c, 70, a0, ar(kmh));
  gx.stroke();
  gx.lineWidth = 1.6;
  gx.strokeStyle = 'rgba(255,255,255,.85)';
  gx.fillStyle = 'rgba(255,255,255,.9)';
  gx.font = '600 10px -apple-system,sans-serif';
  gx.textAlign = 'center';
  gx.textBaseline = 'middle';
  for (let k = 0; k <= MAXK; k += 10) {
    const a = ar(k),
      L = k % 10 ? 5 : 9;
    gx.beginPath();
    gx.moveTo(c + Math.cos(a) * (62 - L), c + Math.sin(a) * (62 - L));
    gx.lineTo(c + Math.cos(a) * 62, c + Math.sin(a) * 62);
    gx.stroke();
  }
  const na = ar(kmh);
  gx.strokeStyle = '#ff6a2b';
  gx.lineWidth = 5;
  gx.beginPath();
  gx.moveTo(c - Math.cos(na) * 8, c - Math.sin(na) * 8);
  gx.lineTo(c + Math.cos(na) * 60, c + Math.sin(na) * 60);
  gx.stroke();
  gx.fillStyle = '#fff';
  gx.beginPath();
  gx.arc(c, c, 5, 0, PI * 2);
  gx.fill();
  gx.font = '800 46px -apple-system,sans-serif';
  gx.fillText(Math.round(kmh), c, c + 30);
  gx.font = '700 17px -apple-system,sans-serif';
  gx.fillStyle = 'rgba(255,255,255,.85)';
  gx.fillText('km/h', c, c + 56);
  // stamina arc (bottom)
  const sa0 = PI * 0.32,
    sa1 = PI * 0.68;
  gx.lineWidth = 9;
  gx.strokeStyle = 'rgba(255,255,255,.18)';
  gx.beginPath();
  gx.arc(c, c, 80, sa1, sa0, true);
  gx.stroke();
  const sc = stamina > 50 ? '#5ef08a' : stamina > 20 ? '#ffd34d' : '#ff5a5a';
  gx.strokeStyle = boostT > 0 ? '#6ad1ff' : sc;
  gx.beginPath();
  gx.arc(c, c, 80, sa1, sa1 - ((sa1 - sa0) * stamina) / 100, true);
  gx.stroke();
}

// ===== physics helpers =====
function onRoad(x, z) {
  const m = drive === 'car' ? 1.05 : drive === 'moto' ? 0.45 : 0.3;
  const rx = x - Math.round(x / B) * B,
    rz = z - Math.round(z / B) * B;
  return Math.abs(rz) <= RH - m || Math.abs(rx) <= RH - m;
}
function clampRoad() {
  const p = player.position;
  if (onRoad(p.x, p.z)) return false;
  const nz = Math.round(p.z / B) * B,
    nx = Math.round(p.x / B) * B,
    rz = p.z - nz,
    rx = p.x - nx;
  const mm = drive === 'car' ? 1.1 : drive === 'moto' ? 0.5 : 0.35;
  const cz = nz + Math.sign(rz) * (RH - mm),
    cx = nx + Math.sign(rx) * (RH - mm);
  if (Math.abs(p.z - cz) < Math.abs(p.x - cx)) p.z = cz;
  else p.x = cx;
  return true;
}
function crash(kind, dir, spd) {
  if (state !== 'ride') return;
  state = 'crash';
  crashT = 0;
  SFX.crash();
  crashDir.copy(dir || V(Math.cos(heading), 0, -Math.sin(heading))).normalize();
  pel.updateMatrixWorld(true);
  scene.attach(pel);
  const sp = spd || v;
  pv.copy(crashDir)
    .multiplyScalar(Math.max(4, sp * 0.85))
    .add(V(0, kind === 'car' ? 6 : 3.6, 0));
  pw.set(crashDir.z, 0, -crashDir.x).multiplyScalar(-7);
  bikeV = sp * 0.5;
  fallTo = (steer >= 0 ? -1 : 1) * 1.42;
  loose.visible = true;
  const P = pel.position;
  for (const f of lfs) {
    f.p.copy(P).add(V(rnd(-0.2, 0.2), rnd(0, 0.4), rnd(-0.2, 0.2)));
    f.v
      .copy(crashDir)
      .multiplyScalar(rnd(2, 6))
      .add(V(rnd(-1.5, 1.5), rnd(2, 5), rnd(-1.5, 1.5)));
  }
  stats.calm = 0;
  hurt(kind === 'car' ? 14 + sp * 1.6 : 6 + sp * 0.6, kind === 'car' ? '被车撞了' : '摔倒了');
  if (kind === 'car' && exam) examEnd(false, '发生碰撞事故');
  else if (kind === 'car' && !(mission && mission.k === 'free')) {
    accident();
    finish(false, 'car');
  } else {
    if (kind === 'car') accident();
    delivBump(kind === 'car' ? 60 : 40);
    stamina = Math.max(0, stamina - 25);
    $('crashMsg').textContent =
      kind === 'car'
        ? `被车撞倒了！时速 ${Math.round(sp * 3.6)} km/h。体力 -25${orders.some((o) => o.phase === 'carry') ? '，外卖也洒了' : ''}`
        : `刹车时速度 ${Math.round(sp * 3.6)} km/h，超过了 ${rainT > 0 ? '雨天安全速度' : '30 km/h'}。体力 -25`;
    setTimeout(() => {
      if (state === 'crash') $('crashed').style.display = 'flex';
    }, 1500);
  }
  v = 0;
}
function standUp() {
  if (fieldOn) {
    lean.attach(pel);
    pel.position.copy(drive === 'car' ? PCAR : PC);
    pel.quaternion.identity();
    pel.scale.set(1, 1, 1);
    lean.rotation.x = 0;
    lean.position.y = 0;
    v = 0;
    steer = 0;
    loose.visible = false;
    $('crashed').style.display = 'none';
    state = 'ride';
    return;
  }
  lean.attach(pel);
  pel.position.copy(drive === 'car' ? PCAR : PC);
  pel.quaternion.identity();
  pel.scale.set(1, 1, 1);
  lean.rotation.x = 0;
  lean.position.y = 0;
  v = 0;
  steer = 0;
  loose.visible = false;
  $('crashed').style.display = 'none';
  clampRoad();
  state = 'ride';
}
function hardReset() {
  try {
    crimeReset();
    stopSnow();
    if (INT.on) {
      INT.on = false;
      intRoot.visible = false;
      intUI.style.display = 'none';
      intHud.style.display = 'none';
    }
    if (state === 'foot' || padOn) {
      try {
        lean.attach(pel);
        pel.position.copy(drive === 'car' ? PCAR : PC);
        pel.quaternion.identity();
      } catch (_) {}
      setPad(false);
    }
    closePhone();
    thief = null;
    thiefPed.g.visible = false;
    player.visible = true;
    modal.style.display = 'none';
    mdlResume = null;
  } catch (e) {}
  hp = 100;
  ufo.visible = false;
  orders.length = 0;
  if (offer) closeOffer();
  walk = null;
  actO = null;
  $('act').style.display = 'none';
  bag.visible = false;
  rainT = 0;
  flatT = 0;
  $('choice').style.display = 'none';
  acc.t = 0;
  phone.ring = 0;
  if ($('phone')) closePhone();
  CALL = null;
  ERR = null;
  if (pel.parent !== lean) standUp();
  loose.visible = false;
  state = 'menu';
  v = 0;
  stamina = 100;
  exhausted = false;
  boostT = 0;
  pouchFill = 0;
}

// ===== camera =====
let camInit = false;
const prevP = V(),
  tmp = V(),
  tmp2 = V(),
  fv = V();
function updCamera(dt) {
  const offs = [V(-5.6, 2.7, 0.9), V(-11, 6.5, 1.2), V(0.4, 1.9, 6.5)];
  if (camMode === 3 && controls) {
    controls.target.add(tmp.subVectors(player.position, prevP));
    camera.position.add(tmp);
    controls.update();
    return;
  }
  const o = (camTop ? V(-3, 14, 0) : offs[Math.min(camMode, 2)].clone()).applyAxisAngle(
    UP,
    heading
  );
  const want = tmp2.copy(player.position).add(o);
  if (!camInit) {
    camera.position.copy(want);
    camInit = true;
  }
  camera.position.lerp(want, Math.min(1, dt * 3.2));
  const focus =
    state === 'crash'
      ? fv.copy(pel.position)
      : fv.set(
          player.position.x + Math.cos(heading) * 2,
          1.2,
          player.position.z - Math.sin(heading) * 2
        );
  camera.lookAt(focus);
}
const act2 = document.createElement('button');
act2.className = 'glass pill primary';
act2.id = 'act2';
document.body.appendChild(act2);
let act2Fn = null,
  act2Key = '';
function setAct2(key, label, fn) {
  if (key === act2Key) return;
  act2Key = key;
  act2Fn = fn;
  if (fn) {
    act2.textContent = label;
    act2.style.display = 'block';
  } else act2.style.display = 'none';
}
act2.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  initAudio();
  const f = act2Fn;
  setAct2('', null, null);
  if (f) f();
});
function hold(id, set) {
  const el = $(id);
  const on = (e) => {
    e.preventDefault();
    initAudio();
    set(true);
    el.classList.add('down');
    try {
      el.setPointerCapture(e.pointerId);
    } catch (_) {}
  };
  const off = () => {
    set(false);
    el.classList.remove('down');
  };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('lostpointercapture', off);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
}
hold('gas', (b) => (gas = b));
hold('brake', (b) => (braking = b));
hold('kL', (b) => (kL = b));
hold('kR', (b) => (kR = b));
$('bell').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  initAudio();
  ringBell();
});
function ringBell() {
  if (drive !== 'bike') {
    SFX.horn();
    if (!exam && state === 'ride') {
      const n = performance.now();
      rule.horns = (rule.horns || []).filter((x) => n - x < 5000);
      rule.horns.push(n);
      if (rule.horns.length >= 3 && rule.hornC <= 0) {
        rule.hornC = 30;
        rule.horns = [];
        ticket('违反禁止鸣喇叭规定（连续鸣笛）', 100, 0, 0);
      }
    }
  } else {
    SFX.bell();
    bellEgg();
  }
  if (inInter && state === 'ride') {
    const k = inInter.join(',');
    if (!stats.bells.has(k)) {
      stats.bells.add(k);
      if (mission && mission.k === 'bell') toast(`🔔 叮铃铃！(${stats.bells.size}/${mission.n})`);
    }
  }
}
addEventListener('keydown', (e) => {
  initAudio();
  const c = e.code;
  if (c === 'ArrowUp' || c === 'KeyW') gas = true;
  if (c === 'ArrowDown' || c === 'KeyS' || c === 'Space') braking = true;
  if (c === 'ArrowLeft' || c === 'KeyA') kL = true;
  if (c === 'ArrowRight' || c === 'KeyD') kR = true;
  if (c === 'KeyB') ringBell();
});
addEventListener('keyup', (e) => {
  const c = e.code;
  if (c === 'ArrowUp' || c === 'KeyW') gas = false;
  if (c === 'ArrowDown' || c === 'KeyS' || c === 'Space') braking = false;
  if (c === 'ArrowLeft' || c === 'KeyA') kL = false;
  if (c === 'ArrowRight' || c === 'KeyD') kR = false;
});
function showSteer() {
  $('steer').style.display = gyroMode || steerStyle === 1 ? 'none' : 'flex';
  $('bar').style.display = !gyroMode && steerStyle === 1 ? 'flex' : 'none';
}
segCtl('sgSteer', ['按键', '车把'], 0, (i) => {
  steerStyle = i;
  barVal = 0;
  showSteer();
});
segCtl('sgGauge', ['显示', '隐藏'], 0, (i) => {
  gaugeOn = i === 0;
  $('gaugeW').style.display = gaugeOn ? 'block' : 'none';
});
(function () {
  const el = $('bar'),
    svg = $('barSvg');
  let x0 = null,
    pid = null;
  const set = (val) => {
    barVal = val;
    svg.style.transform = `rotate(${-val * 32}deg)`;
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    initAudio();
    x0 = e.clientX;
    pid = e.pointerId;
    try {
      el.setPointerCapture(pid);
    } catch (_) {}
  });
  el.addEventListener('pointermove', (e) => {
    if (x0 === null || e.pointerId !== pid) return;
    set(clamp(-(e.clientX - x0) / 55, -1, 1));
  });
  const up = (e) => {
    if (e.pointerId !== pid) return;
    x0 = null;
    pid = null;
    set(0);
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
})();
let cardTimer = null;
function peekCard() {
  const c = $('mcard');
  c.classList.remove('mini');
  clearTimeout(cardTimer);
  cardTimer = setTimeout(() => c.classList.add('mini'), 3000);
}
$('mcard').addEventListener('click', () => peekCard());
