'use strict';
// ── js/systems/fuel.js ──
// v0.1.10：油量（自己的车可加油，偷来的车不能加、没油就报废）、加油站、拟真汽车引擎声

// ===== 油量数据 =====
// 自己的车：SAVE.fuel = { pana, moto }，百分比。偷来的车：stolen.fuel（20%–35%）
if (!SAVE.fuel) SAVE.fuel = { pana: 100, moto: 100 };
const FUEL_FULL_PRICE = 150; // 0% → 100% 的价格
let fuelOut = false,
  fuelWarned = false,
  fuelScrapT = 0,
  fuelTruck = 0;
function fuelKey() {
  if (exam || fieldOn) return null;
  if (stolen) return 'stolen';
  if (drive === 'car' && curCar === pcar) return 'pana';
  if (drive === 'moto') return 'moto';
  return null;
}
function getFuel() {
  const k = fuelKey();
  if (!k) return null;
  if (k === 'stolen') return stolen.fuel;
  if (SAVE.fuel[k] == null) SAVE.fuel[k] = 100;
  return SAVE.fuel[k];
}
function setFuel(f) {
  const k = fuelKey();
  if (!k) return;
  f = clamp(f, 0, 100);
  if (k === 'stolen') stolen.fuel = f;
  else SAVE.fuel[k] = f;
}
// 耗油：100% 约够开 2–3 个游戏日（现实 25–35 分钟连续驾驶）
function fuelRate() {
  const base = 0.01 + 0.0038 * v;
  return (drive === 'moto' ? 0.6 : 1) * base * (gas ? 1.15 : 1);
}

// ===== 加油站（很稀少：每 6×6 个街区一座）=====
const GAS_EVERY = 6,
  GAS_OFF = 3;
const md = (a, n) => ((a % n) + n) % n;
function isGasBlock(bi, bj) {
  return md(bi, GAS_EVERY) === GAS_OFF && md(bj, GAS_EVERY) === GAS_OFF && !isSchool(bi, bj);
}
// 加油站占用街区 side 0 的中间地块（poiAt 在这里返回 null）
function gasAt(bi, bj) {
  if (!isGasBlock(bi, bj)) return null;
  const [dx, dz] = D[0];
  const cx = (bi + 0.5) * B,
    cz = (bj + 0.5) * B;
  return {
    key: bi + ',' + bj,
    nx: dx,
    nz: dz,
    x: cx + dx * (FRONT - 6),
    z: cz + dz * (FRONT - 6),
    px: cx + dx * (B / 2 - RH + 2.2),
    pz: cz + dz * (B / 2 - RH + 2.2),
  };
}
function nearestGas(x, z) {
  const bi = Math.floor(x / B),
    bj = Math.floor(z / B);
  let best = null,
    bd = 1e9;
  for (let a = -GAS_EVERY; a <= GAS_EVERY; a++)
    for (let b = -GAS_EVERY; b <= GAS_EVERY; b++) {
      const g = gasAt(bi + a, bj + b);
      if (!g) continue;
      const d = Math.hypot(g.px - x, g.pz - z);
      if (d < bd) {
        bd = d;
        best = g;
      }
    }
  return best ? { g: best, d: bd } : null;
}
// 加油站模型（模板，克隆复用）
const gasTpl = new THREE.Group();
(function () {
  const pad = M(0x9aa0a6, { roughness: 0.9 }),
    white = M(0xf5f5f2, { roughness: 0.5 }),
    red = M(0xd8312a, { roughness: 0.45 }),
    yel = M(0xffc928, { roughness: 0.5 }),
    dark = M(0x2b2f36, { roughness: 0.6 }),
    glass = M(0x9fd3ea, { roughness: 0.15, metalness: 0.3 });
  // 局部坐标：+x 朝向马路
  mesh(new THREE.BoxGeometry(14, 0.12, 18), pad, gasTpl).position.set(0, 0.07, 0);
  // 罩棚
  const roof = mesh(new THREE.BoxGeometry(9, 0.7, 14), white, gasTpl);
  roof.position.set(2.5, 5.4, 0);
  for (const s of [-1, 1]) {
    mesh(new THREE.BoxGeometry(9.05, 0.32, 0.05), red, gasTpl).position.set(2.5, 5.35, s * 7.02);
  }
  mesh(new THREE.BoxGeometry(0.05, 0.32, 14.05), red, gasTpl).position.set(7.02, 5.35, 0);
  for (const [x, z] of [
    [0, -4],
    [0, 4],
    [5, -4],
    [5, 4],
  ])
    mesh(new THREE.CylinderGeometry(0.22, 0.22, 5.1, 10), white, gasTpl).position.set(x, 2.6, z);
  // 加油机 ×2
  for (const z of [-2.6, 2.6]) {
    mesh(new THREE.BoxGeometry(1.4, 0.25, 2.4), dark, gasTpl).position.set(2.5, 0.2, z);
    const p = mesh(new THREE.BoxGeometry(0.8, 1.7, 1.1), red, gasTpl);
    p.position.set(2.5, 1.15, z);
    const sc = mesh(new THREE.BoxGeometry(0.82, 0.45, 0.7), glass, gasTpl);
    sc.position.set(2.5, 1.55, z);
    mesh(new THREE.BoxGeometry(0.85, 0.18, 1.12), yel, gasTpl).position.set(2.5, 2.05, z);
    const h = mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 12, PI), dark, gasTpl);
    h.position.set(2.95, 1.1, z + 0.35);
    h.rotation.y = PI / 2;
  }
  // 便利店
  const shopB = mesh(new THREE.BoxGeometry(5, 3.4, 9), white, gasTpl);
  shopB.position.set(-4.3, 1.75, 0);
  const win = mesh(new THREE.BoxGeometry(0.06, 1.8, 6.5), glass, gasTpl);
  win.position.set(-1.78, 1.6, 0);
  mesh(new THREE.BoxGeometry(5.1, 0.5, 9.1), red, gasTpl).position.set(-4.3, 3.35, 0);
  const shopSign = textPlane2('鹈鹕便利店 · 大水 2 元', 6, 0.7, '#ffffff', '#d8312a');
  shopSign.position.set(-1.74, 2.85, 0);
  shopSign.rotation.y = PI / 2;
  gasTpl.add(shopSign);
  // 高杆价格牌（远处就能看到）
  mesh(new THREE.CylinderGeometry(0.18, 0.18, 9, 8), dark, gasTpl).position.set(6.2, 4.5, 8);
  const sign = textPlane2('⛽ 鹈鹕加油站', 4.2, 1.6, '#ffffff', '#d8312a');
  sign.position.set(6.2, 9.4, 8);
  sign.rotation.y = PI / 2;
  gasTpl.add(sign);
  const sign2 = sign.clone();
  sign2.rotation.y = -PI / 2;
  gasTpl.add(sign2);
  const price = textPlane2('92# 7.66 元/升', 4.2, 0.9, '#3d2400', '#ffc928');
  price.position.set(6.25, 8.15, 8);
  price.rotation.y = PI / 2;
  gasTpl.add(price);
  const canT = textPlane2('加油站', 3.2, 0.7, '#d8312a', '#ffffff');
  canT.position.set(7.08, 5.4, 0);
  canT.rotation.y = PI / 2;
  gasTpl.add(canT);
})();
const gasPool = [];
let gasBI = 1e9,
  gasBJ = 1e9;
function updGasStations(px, pz) {
  const bi = Math.floor(px / B),
    bj = Math.floor(pz / B);
  if (bi === gasBI && bj === gasBJ) return;
  gasBI = bi;
  gasBJ = bj;
  let k = 0;
  for (let a = -3; a <= 3; a++)
    for (let b = -3; b <= 3; b++) {
      const g = gasAt(bi + a, bj + b);
      if (!g) continue;
      let o = gasPool[k];
      if (!o) {
        o = gasTpl.clone();
        scene.add(o);
        gasPool.push(o);
      }
      o.visible = true;
      o.position.set(g.x, 0, g.z);
      o.rotation.y = Math.atan2(-g.nz, g.nx);
      k++;
    }
  for (; k < gasPool.length; k++) gasPool[k].visible = false;
}

// ===== 油量提示（仪表盘下方小胶囊）=====
const fuelHint = document.createElement('div');
fuelHint.id = 'fuelHint';
fuelHint.className = 'glass dark';
document.body.appendChild(fuelHint);
let fuelHintLast = '';
function fuelHintUpd() {
  const f = getFuel();
  let txt = '',
    cls = '';
  if (f != null && (state === 'ride' || state === 'crash') && !INT.on) {
    if (stolen) {
      txt = `<i class="ico i-fuel"></i>${Math.round(f)}% · 偷来的车不能加油`;
      cls = f < 10 ? 'empty' : f < 20 ? 'low' : '';
    } else if (f < 30) {
      const n = nearestGas(player.position.x, player.position.z);
      txt = `<i class="ico i-fuel"></i>${Math.round(f)}%${n ? ` · 最近加油站 ${n.d > 1000 ? (n.d / 1000).toFixed(1) + ' km' : Math.round(n.d) + ' m'}` : ''}`;
      cls = f <= 0 ? 'empty' : 'low';
    }
  }
  const key = txt + cls;
  if (key === fuelHintLast) return;
  fuelHintLast = key;
  fuelHint.innerHTML = txt;
  fuelHint.className = 'glass dark ' + cls;
  fuelHint.style.display = txt ? 'flex' : 'none';
}

// ===== 每帧 =====
function fuelUpdate(dt) {
  updGasStations(player.position.x, player.position.z);
  const f = getFuel();
  fuelOut = f != null && f <= 0;
  if (f != null && state === 'ride' && !INT.on) {
    if (v > 0.2 || gas) setFuel(f - fuelRate() * dt);
    const nf = getFuel();
    if (!fuelWarned && nf < 15 && nf > 0) {
      fuelWarned = true;
      toast(
        stolen
          ? `⛽ 油量只剩 ${Math.round(nf)}%！偷来的车加不了油，油用光就报废`
          : `⛽ 油量只剩 ${Math.round(nf)}%，快去加油站`,
        3000
      );
    }
    if (nf >= 15) fuelWarned = false;
    if (nf <= 0) {
      v = Math.max(0, v - 2.4 * dt); // 熄火后发动机拖滞，车很快停下
      if (stolen) {
        fuelScrapT += dt;
        if (fuelScrapT > 0.1 && fuelScrapT - dt <= 0.1) {
          SFX.lose();
          say('⛽ 油用光了，这辆车直接报废了！');
        }
        if (v < 0.6 && fuelScrapT > 1.2) {
          fuelScrapT = 0;
          toast('🚲 车报废了。自行车还停在你抢车的地方，走回去取吧', 3600);
          exitStolen('scrap');
        }
      }
    } else fuelScrapT = 0;
  }
  if (fuelTruck > 0) {
    fuelTruck -= dt;
    if (fuelTruck <= 0) {
      setFuel((getFuel() || 0) + 20);
      SFX.ding();
      toast('🚚 送油车到了：油量 +20%', 2400);
    }
  }
  fuelHintUpd();
}
// 互动按钮：加油 / 叫送油车
function fuelAct() {
  if (state !== 'ride' || v > 0.6) return null;
  const k = fuelKey();
  if (!k) return null;
  const f = getFuel();
  const n = nearestGas(player.position.x, player.position.z);
  const atGas = n && n.d < 11;
  if (k === 'stolen') {
    if (atGas)
      return {
        key: 'gas-no',
        label: '⛽ 这不是你的车，加不了油',
        fn: () => {
          say('加油站员工：这车的车主刚报警说车被偷了……你确定要加？算了吧');
        },
      };
    return null;
  }
  if (atGas && f < 99) {
    const cost = Math.max(1, Math.ceil(((100 - f) / 100) * FUEL_FULL_PRICE));
    return {
      key: 'gas-' + Math.round(f),
      label: `⛽ 加满油（🪙${cost}）`,
      fn: () => {
        if (coins < cost) {
          toast(`🪙 不够：加满需要 ${cost}，你只有 ${coins}`, 2400);
          return;
        }
        coins -= cost;
        setFuel(100);
        saveCoins();
        SFX.ding();
        fuelWarned = false;
        toast(`⛽ 加满了！花了 🪙${cost}，够开两三天`, 2600);
        if (typeof achCount === 'function') achCount('gas', 1);
      },
    };
  }
  if (f <= 0 && fuelTruck <= 0)
    return {
      key: 'gas-truck',
      label: '📞 没油了：叫送油车（🪙80，+20%）',
      fn: () => {
        if (coins < 80) {
          toast('🪙 不够 80，只能下车走路了', 2400);
          return;
        }
        coins -= 80;
        saveCoins();
        fuelTruck = 4;
        toast('🚚 送油车 4 秒后到', 2000);
      },
    };
  return null;
}

// ===== 汽车音量（设置里的滑条，默认 0 = 关闭）=====
let carVol = 0;
try {
  const cv = localStorage.getItem('pel_carvol');
  carVol = cv == null ? 0 : clamp(+cv || 0, 0, 1);
} catch (e) {}
(function () {
  const r = $('carVol');
  if (!r) return;
  r.value = Math.round(carVol * 100);
  r.addEventListener('input', () => {
    carVol = clamp(+r.value / 100, 0, 1);
    try {
      localStorage.setItem('pel_carvol', '' + carVol);
    } catch (e) {}
  });
})();

// ===== 拟真引擎声：转速随车速/挡位变化，自动换挡，油门有负载感 =====
let CE = null;
function carAudioInit() {
  if (CE || !AC) return;
  const mk = (type, f) => {
    const o = AC.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.start();
    return o;
  };
  const out = AC.createGain();
  out.gain.value = 0;
  out.connect(master);
  const lp = AC.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  lp.Q.value = 2.2;
  lp.connect(out);
  // 点火频率 + 半次谐波（低沉的突突声）+ 二次谐波
  const o1 = mk('sawtooth', 30),
    o2 = mk('square', 15),
    o3 = mk('triangle', 60);
  const g1 = AC.createGain(),
    g2 = AC.createGain(),
    g3 = AC.createGain();
  g1.gain.value = 0.5;
  g2.gain.value = 0.35;
  g3.gain.value = 0.25;
  o1.connect(g1).connect(lp);
  o2.connect(g2).connect(lp);
  o3.connect(g3).connect(lp);
  // 进气噪声
  const nb = AC.createBufferSource();
  const buf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  nb.buffer = buf;
  nb.loop = true;
  const bp = AC.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 900;
  bp.Q.value = 0.8;
  const ng = AC.createGain();
  ng.gain.value = 0;
  nb.connect(bp).connect(ng).connect(out);
  nb.start();
  // 抖动（怠速不稳）
  const lfo = mk('sine', 7),
    lfg = AC.createGain();
  lfg.gain.value = 1.2;
  lfo.connect(lfg);
  lfg.connect(o1.frequency);
  lfg.connect(o2.frequency);
  CE = { out, lp, o1, o2, o3, ng, bp, rpm: 800, gearN: 1, shiftT: 0 };
}
const GEARS = [0, 5, 10, 16, 23, 31]; // 自动挡换挡点（m/s）
function engineRpm(dt) {
  const s = Math.abs(v),
    moto = drive === 'moto';
  let g = 1;
  while (g < GEARS.length - 1 && s > GEARS[g]) g++;
  if (g !== CE.gearN) {
    CE.shiftT = 0.18;
    CE.gearN = g;
  }
  const lo = GEARS[g - 1],
    hi = GEARS[g];
  const k = clamp((s - lo) / (hi - lo), 0, 1);
  const idle = moto ? 1300 : 780,
    red = moto ? 9000 : 6000;
  let want = s < 0.4 ? idle + (gas ? 900 : 0) : 1400 + k * (red * 0.72 - 1400) + (gas ? 250 : 0);
  if (CE.shiftT > 0) {
    CE.shiftT -= dt;
    want *= 0.82;
  }
  CE.rpm += (want - CE.rpm) * Math.min(1, dt * (want > CE.rpm ? 6 : 4));
  return CE.rpm;
}
function updCarAudio(t, dt) {
  if (!AC) return;
  carAudioInit();
  const n = AC.currentTime;
  const on =
    drive !== 'bike' &&
    !muted &&
    carVol > 0 &&
    (state === 'ride' || state === 'crash') &&
    !INT.on &&
    !fuelOut &&
    document.visibilityState !== 'hidden';
  const rpm = engineRpm(dt || 1 / 60);
  const cyl = drive === 'moto' ? 2 : 4;
  const fire = (rpm / 60) * (cyl / 2);
  const load = clamp((gas ? 0.6 : 0.15) + (CE.shiftT > 0 ? -0.1 : 0), 0, 1);
  CE.o1.frequency.setTargetAtTime(fire, n, 0.05);
  CE.o2.frequency.setTargetAtTime(fire / 2, n, 0.05);
  CE.o3.frequency.setTargetAtTime(fire * 2, n, 0.05);
  CE.lp.frequency.setTargetAtTime(180 + rpm * 0.12 + load * 900, n, 0.08);
  CE.bp.frequency.setTargetAtTime(500 + rpm * 0.25, n, 0.1);
  CE.ng.gain.setTargetAtTime(on ? load * 0.25 : 0, n, 0.08);
  CE.out.gain.setTargetAtTime(on ? carVol * (0.08 + 0.1 * load + rpm / 60000) : 0, n, 0.12);
}
