'use strict';
// ── js/systems/delivery.js ──
// 外卖：接单/取送餐、时限评分、连单、小费，途中拾取
// ===== pickups =====
const fishes = [];
const fishBodyM = M(0x8fb6d6, { metalness: 0.6, roughness: 0.25 }),
  finM = M(0xff8a3c, { roughness: 0.5 }),
  ringM = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.55 });
function makeFish() {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(0.3, 14, 10), fishBodyM, g);
  b.scale.set(1.3, 0.6, 0.4);
  const t = mesh(new THREE.ConeGeometry(0.18, 0.3, 4), finM, g);
  t.rotation.z = PI / 2;
  t.position.x = -0.48;
  t.scale.set(1, 1, 0.3);
  mesh(new THREE.SphereGeometry(0.04, 8, 6), darkM, g).position.set(0.28, 0.06, 0.1);
  const r = mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 28), ringM, g);
  r.rotation.x = PI / 2;
  r.position.y = -0.55;
  r.castShadow = false;
  g.userData.ring = r;
  scene.add(g);
  return g;
}
function makeCan() {
  const g = new THREE.Group();
  mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.46, 16),
    M(0x1e90ff, { metalness: 0.7, roughness: 0.25 }),
    g
  );
  mesh(
    new THREE.CylinderGeometry(0.165, 0.165, 0.12, 16),
    M(0xffd400, { metalness: 0.5, roughness: 0.3 }),
    g
  );
  const r = mesh(
    new THREE.TorusGeometry(0.62, 0.035, 6, 28),
    new THREE.MeshBasicMaterial({ color: 0x6ad1ff, transparent: true, opacity: 0.6 }),
    g
  );
  r.rotation.x = PI / 2;
  r.position.y = -0.55;
  r.castShadow = false;
  scene.add(g);
  return g;
}
for (let i = 0; i < 12; i++) fishes.push({ g: makeFish(), kind: 'fish', p: V(), alive: false });
for (let i = 0; i < 3; i++) fishes.push({ g: makeCan(), kind: 'can', p: V(), alive: false });
function placePickup(f) {
  const pi = Math.round(player.position.x / B),
    pj = Math.round(player.position.z / B);
  for (let t = 0; t < 10; t++) {
    const i = pi + Math.floor(rnd(-1, 1.99)),
      j = pj + Math.floor(rnd(-1, 1.99));
    const along = rnd(R + 4, B - R - 4),
      lat = rnd(-(RH - 1), RH - 1);
    const p =
      Math.random() < 0.5 ? V(i * B + along, 0, j * B + lat) : V(i * B + lat, 0, j * B + along);
    const d = p.distanceTo(player.position);
    if (d < 25 || d > 150) continue;
    f.p.copy(p);
    f.alive = true;
    f.g.visible = true;
    return;
  }
  f.alive = false;
  f.g.visible = false;
}

// ===== destination beacon =====
const beacon = new THREE.Group();
scene.add(beacon);
const beamM = new THREE.MeshBasicMaterial({
  color: 0xffd34d,
  transparent: true,
  opacity: 0.28,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
});
const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 60, 24, 1, true), beamM);
beam.position.y = 30;
beacon.add(beam);
const bring = new THREE.Mesh(
  new THREE.TorusGeometry(3, 0.14, 8, 40),
  new THREE.MeshBasicMaterial({ color: 0xffd34d })
);
bring.rotation.x = PI / 2;
bring.position.y = 0.2;
beacon.add(bring);
let labelTex = null;
const label = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
label.scale.set(9, 2.25, 1);
label.position.y = 7;
beacon.add(label);
function setLabel(txt) {
  labelTex && labelTex.dispose();
  labelTex = canvasTex(512, 128, (x, w, h) => {
    x.fillStyle = 'rgba(20,22,32,.72)';
    x.beginPath();
    x.roundRect ? x.roundRect(4, 4, w - 8, h - 8, 40) : x.rect(4, 4, w - 8, h - 8);
    x.fill();
    x.fillStyle = '#fff';
    x.font = 'bold 58px sans-serif';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(txt, w / 2, h / 2 + 2);
  });
  label.material.map = labelTex;
  label.material.needsUpdate = true;
}
beacon.visible = false;

// ===== job / delivery =====
const JOB = Object.assign(
  {
    co: '鹈鹕外卖',
    r: [5, 5, 5, 5, 5],
    low: 0,
    fired: false,
    black: [],
    n: 0,
    earn: 0,
    tips: 0,
    urg: 0,
    five: 0,
    clean: 0,
    revs: [],
  },
  SAVE.job || {}
);
SAVE.job = JOB;
const ACH = (SAVE.ach = SAVE.ach || {});
const rating = () => {
  const r = JOB.r.slice(-50);
  return r.reduce((a, b) => a + b, 0) / r.length;
};
const rMult = (r) => (r >= 4.8 ? 1.5 : r >= 4.5 ? 1.2 : r >= 3.5 ? 1 : 0.8);
const rTier = (r) =>
  r >= 4.8 ? '🥇 金牌骑手' : r >= 4.5 ? '🥈 银牌骑手' : r >= 3.5 ? '🥉 普通骑手' : '⚠️ 观察期';
const coOf = () => COS.find((c) => c.n === JOB.co) || COS[0];
const orders = [];
let offer = null,
  offerT = 10,
  oid = 0,
  evT = rnd(70, 130),
  walk = null,
  flatT = 0,
  boostOrders = 0,
  wrongPick = null;
const FOODS = {
  鹈鹕炸鸡: '炸鸡全家桶',
  老王海鲜: '椒盐皮皮虾',
  张姐麻辣烫: '麻辣烫（微辣）',
  渔港寿司: '三文鱼寿司拼盘',
  阿婆奶茶: '珍珠奶茶 ×2',
  深夜烧烤: '烤串 30 串',
  鲜果切: '西瓜果切',
  兰州牛肉面: '牛肉面加蛋',
  小笼包铺: '蟹黄小笼包',
  汉堡工坊: '双层牛肉堡',
  披萨小站: '榴莲披萨',
  金陵盐水鸭: '盐水鸭半只',
  鸭血粉丝汤: '鸭血粉丝汤',
  黄焖鸡米饭: '黄焖鸡米饭',
  煎饼果子: '煎饼果子加肠',
  海鸥咖啡: '冰美式 ×3',
};
const PERS = [
  ['普通', 0.55],
  ['挑剔', 0.15],
  ['好说话', 0.18],
  ['大方', 0.12],
];
function pickPers() {
  let r = Math.random();
  for (const [n, p] of PERS) {
    if ((r -= p) < 0) return n;
  }
  return '普通';
}
function freeMode() {
  return mission && mission.k === 'free' && !exam;
}
function newOffer() {
  const bi = Math.floor(player.position.x / B),
    bj = Math.floor(player.position.z / B);
  let shop = null,
    home = null;
  for (let k = 0; k < 30 && !shop; k++) {
    const ps = poisOfBlock(bi + Math.floor(rnd(-2, 3)), bj + Math.floor(rnd(-2, 3))).filter(
      (p) => p.shop
    );
    if (ps.length) shop = pick(ps);
  }
  for (let k = 0; k < 30 && !home; k++) {
    const sb = Math.floor(shop.ctr.x / B),
      sj = Math.floor(shop.ctr.z / B);
    const ps = poisOfBlock(sb + Math.floor(rnd(-2, 3)), sj + Math.floor(rnd(-2, 3))).filter(
      (p) => !p.shop && p.park.distanceTo(shop.park) > 70
    );
    if (ps.length) home = pick(ps);
  }
  let egg = false;
  if (shop && Math.random() < 0.06) {
    const sb = Math.floor(shop.ctr.x / B),
      sj = Math.floor(shop.ctr.z / B);
    for (let k = 0; k < 40 && !egg; k++) {
      const ps = poisOfBlock(sb + Math.floor(rnd(-3, 4)), sj + Math.floor(rnd(-3, 4))).filter(
        (p) => !p.shop && p.name.startsWith('南理工宿舍')
      );
      if (ps.length) {
        home = pick(ps);
        egg = true;
      }
    }
  }
  if (!shop || !home) return;
  const r = rating();
  const pu = r >= 4.8 ? 0.35 : r >= 4.5 ? 0.25 : r >= 3.5 ? 0.15 : 0.05;
  const urgent = Math.random() < pu;
  const pp = player.position;
  const dist =
    Math.abs(pp.x - shop.park.x) +
    Math.abs(pp.z - shop.park.z) +
    Math.abs(shop.park.x - home.park.x) +
    Math.abs(shop.park.z - home.park.z);
  const spd = drive === 'bike' ? 6 : 9.5;
  const lim = Math.round(((dist / spd) * 2.3 + 80) * (urgent ? 0.85 : 1));
  let price = (urgent ? 300 : 80) * rMult(r) * coOf().m;
  const extra = [];
  if (LIGHTS[lightMode].night) {
    price += 20;
    extra.push('夜间 +20');
  }
  if (rainT > 0) {
    price *= 1.3;
    extra.push('雨天 +30%');
  }
  if (snowT > 0) {
    price *= 1.4;
    extra.push('雪天 +40%');
  }
  if (STREAK.mult > 1) extra.push(`送达再 ×${STREAK.mult}`);
  if (boostOrders > 0) {
    price += 20;
    extra.push('冲单 +20');
  }
  offer = {
    id: ++oid,
    urgent,
    shop,
    home,
    lim,
    price: Math.round(price),
    dist: Math.round(dist),
    food: egg ? '一份神秘夜宵' : FOODS[shop.name] || '外卖',
    pers: egg ? '大方' : pickPers(),
    extra,
    ttl: 15,
    egg,
  };
  SFX.ring();
  $('offer').style.display = 'block';
  renderOffer();
}
function renderOffer() {
  const o = offer;
  if (!o) return;
  $('ofT').innerHTML =
    `${o.urgent ? '<span class="tag">⚡加急</span>' : '<span class="tag n">普通</span>'} 新订单 · ${Math.ceil(o.ttl)}s`;
  $('ofB').innerHTML =
    `${o.shop.e} <b>${o.shop.name}</b> → 🏢 <b>${o.home.name}</b><br>${o.egg ? '👤 顾客：小盖同学 🦩<br>' : ''}${o.food} · 约 ${o.dist} m · ⏱ ${o.lim}s<br><b style="font-size:19px;color:#ffd34d">🪙 ${o.price}</b>${o.extra.length ? ` <span style="opacity:.8;font-size:12px">${o.extra.join(' · ')}</span>` : ''}`;
}
function closeOffer() {
  offer = null;
  $('offer').style.display = 'none';
  offerT = rnd(20, 60);
}
$('ofOk').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!offer) return;
  const o = offer;
  orders.push({
    id: o.id,
    urgent: o.urgent,
    shop: o.shop,
    home: o.home,
    lim: o.lim,
    price: o.price,
    food: o.food,
    pers: o.pers,
    egg: o.egg,
    t: 0,
    phase: 'pick',
    cond: 100,
    viol: 0,
    adj: 0,
    tipPre: 0,
  });
  if (boostOrders > 0) boostOrders--;
  SFX.ding();
  toast(`✅ 抢单成功：去 ${o.shop.name} 取餐`);
  closeOffer();
  if (orders.length >= 3) unlock('triple');
  updTarget();
});
$('ofNo').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  closeOffer();
});
function curOrder() {
  return orders[0] || null;
}
function tgtOf(o) {
  return o.phase === 'pick' ? o.shop : o.home;
}
function updTarget() {
  const o = curOrder();
  if (
    !o &&
    freeMode() &&
    typeof SQ !== 'undefined' &&
    SQ &&
    SQ.tgt &&
    !(typeof ERR !== 'undefined' && ERR)
  ) {
    dests = [SQ.tgt];
    destIdx = 0;
    beacon.position.copy(SQ.tgt);
    beacon.visible = true;
    setLabel(SQ.tlabel || '❗ 支线');
    return;
  }
  if (!o && freeMode() && typeof ERR !== 'undefined' && ERR) {
    dests = [ERR.p.park];
    destIdx = 0;
    beacon.position.copy(ERR.p.park);
    beacon.visible = true;
    setLabel(ERR.label);
    return;
  }
  if (!o && freeMode() && typeof NAVHOME !== 'undefined' && NAVHOME) {
    const hp_ = homeP();
    if (hp_) {
      dests = [hp_.park];
      destIdx = 0;
      beacon.position.copy(hp_.park);
      beacon.visible = true;
      setLabel('🏠 回家');
      return;
    }
  }
  if (!o || !freeMode()) {
    if (mission && mission.k === 'free') beacon.visible = false;
    return;
  }
  const p = tgtOf(o);
  dests = [p.park];
  destIdx = 0;
  beacon.position.copy(p.park);
  beacon.visible = true;
  setLabel(o.phase === 'pick' ? `${p.e} ${p.name} 取餐` : `🏢 ${p.name} 送餐`);
}
function nearTarget() {
  if (!freeMode() || state !== 'ride' || v > 0.6) return null;
  for (const o of orders) {
    const p = tgtOf(o);
    if (Math.hypot(p.park.x - player.position.x, p.park.z - player.position.z) < 9) return o;
  }
  return null;
}
// --- walking ---
const bag = new THREE.Group();
mesh(new THREE.BoxGeometry(0.34, 0.3, 0.26), M(0xffc61a, { roughness: 0.6 }), bag);
const bh = mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 16, PI), M(0x333333), bag);
bh.position.y = 0.15;
bag.position.set(0.95, 0.55, 0);
pel.add(bag);
bag.visible = false;
function syncBag() {
  bag.visible = orders.some((o) => o.phase === 'carry');
}
function startWalk(o) {
  const isPick = o.phase === 'pick';
  const p = tgtOf(o);
  state = 'walk';
  $('act').style.display = 'none';
  pel.updateMatrixWorld(true);
  scene.attach(pel);
  const p0 = pel.position.clone(),
    q0 = pel.quaternion.clone();
  const door = p.door.clone().addScaledVector(p.n, 0.6);
  door.y = 1.12;
  walk = {
    o,
    isPick,
    p,
    p0,
    q0,
    door,
    ph: 'out',
    t: 0,
    dur: Math.max(1.2, p0.distanceTo(door) / 2.6),
    wait: 1.6,
    ev: null,
    theta: 0,
  };
  if (Math.random() < (isPick ? 0.32 : 0.42)) walk.ev = isPick ? pick(EV_PICK) : pick(EV_DROP);
  if (isPick && SHOP_EGG[p.name] && Math.random() < 0.45) walk.ev = pick(SHOP_EGG[p.name]);
  if (isPick && Math.random() < 0.03) walk.ev = pick(RARE_EGG);
  if (!isPick && p.name.startsWith('海鸥公寓') && Math.random() < 0.4)
    walk.ev = (w) => {
      w.o.cond -= 15;
      w.o.adj -= 1;
      toast('🐦 一只海鸥俯冲下来，叼走了一个鸡腿！', 2800);
    };
  toast(isPick ? `🛍️ 下车去 ${p.name} 取餐` : `📦 下车给 ${p.name} 送餐`, 1500);
}
function faceTo(from, to) {
  const a = Math.atan2(-(to.z - from.z), to.x - from.x);
  pel.rotation.set(0, a, 0);
}
function updWalk(dt, t) {
  const w = walk;
  if (!w) return;
  if (w.ph === 'inside') {
    intUpdate(dt, t);
    return;
  }
  w.t += dt;
  w.theta += dt * 9;
  if (w.ph === 'out' || w.ph === 'back') {
    const a = w.ph === 'out' ? w.p0 : w.door,
      b = w.ph === 'out' ? w.door : w.p0;
    const k = Math.min(1, w.t / w.dur);
    pel.position.lerpVectors(a, b, k);
    pel.position.y =
      (w.ph === 'out'
        ? w.p0.y + (w.door.y - w.p0.y) * Math.min(1, k * 3)
        : w.door.y + (w.p0.y - w.door.y) * Math.max(0, k * 3 - 2)) +
      Math.abs(Math.sin(w.theta)) * 0.08;
    faceTo(a, b);
    pel.rotation.z = Math.sin(w.theta) * 0.1;
    updLegs(w.theta);
    if (k >= 1) {
      if (w.ph === 'out') {
        w.ph = 'inside';
        intEnter(w);
        return;
      }
      if (w.ph === 'out') {
        w.ph = 'at';
        w.t = 0;
        faceTo(w.door, w.door.clone().sub(w.p.n));
        if (w.ev) {
          const ev = w.ev;
          w.ev = null;
          ev(w);
        }
      } else endWalk();
    }
  } else if (w.ph === 'at') {
    pel.rotation.z = Math.sin(t * 3) * 0.04;
    if (w.t > 0.5 && w.isPick) bag.visible = true;
    if (w.t >= w.wait) {
      if (w.done !== true) {
        w.done = true;
        if (w.isPick) pickedUp(w.o);
        else {
          if (!w.redirect) delivered(w.o);
        }
      }
      w.ph = 'back';
      w.t = 0;
    }
  }
}
function endWalk() {
  lean.attach(pel);
  pel.position.copy(drive === 'car' ? PCAR : PC);
  pel.quaternion.identity();
  pel.scale.set(1, 1, 1);
  walk = null;
  state = 'ride';
  syncBag();
  updTarget();
}
function pickedUp(o) {
  if (wrongPick && wrongPick.o === o) {
    o.wrong = wrongPick.wrong;
    wrongPick = null;
  }
  o.phase = 'carry';
  SFX.ding();
  toast(`🛍️ 取到「${o.food}」，送往 ${o.home.name}`, 2200);
  orders.sort(
    (a, b) =>
      (a.phase === 'carry' ? 0 : 1) - (b.phase === 'carry' ? 0 : 1) || a.lim - a.t - (b.lim - b.t)
  );
}
const REV = {
  5: [
    '准时又小心，五星好评！',
    '鹈鹕小哥太可爱了，还会说谢谢 🥹',
    '汤一滴没洒，专业！',
    '下次还点你送的 ❤️',
  ],
  4: ['挺快的，就是有点小磕碰', '还不错，给个四星', '送到了，辛苦啦'],
  3: ['一般般吧', '有点慢，但态度还行', '餐有点凉了'],
  2: ['太慢了，面都坨了', '包装都破了……', '汤洒了一半'],
  1: ['等了一个小时！差评！', '餐撒了一地，还闯红灯，投诉！', '送错了！！！', '再也不点了'],
};
function delivered(o) {
  const i = orders.indexOf(o);
  if (i >= 0) orders.splice(i, 1);
  let s = 5;
  const late = o.t > o.lim;
  if (late) s -= o.t > o.lim * 1.4 ? 2 : 1;
  if (o.cond < 75) s--;
  if (o.cond < 45) s--;
  if (o.viol) s--;
  s += o.adj;
  if (o.pers === '挑剔') s = s >= 5 ? 5 : Math.min(s, 2);
  if (o.pers === '好说话') s += 1;
  if (o.wrong) s = 1;
  s = clamp(Math.round(s), 1, 5);
  if (o.egg && !o.wrong && s >= 3) s = 5;
  const sm = streakPay();
  const pay = Math.round(o.price * (late ? 0.7 : 1) * sm);
  if (sm > 1) setTimeout(() => toast(`🔥 连单加倍 ×${sm} 生效`, 2000), 2200);
  let tip = o.tipPre;
  if (s >= 4 && Math.random() < (s === 5 ? 0.55 : 0.25))
    tip += Math.round(rnd(5, 30) * (o.pers === '大方' ? 3 : 1));
  coins += pay + tip;
  JOB.n++;
  JOB.earn += pay;
  JOB.tips += tip;
  if (o.urgent) JOB.urg++;
  if (s === 5) JOB.five++;
  JOB.clean = o.viol ? 0 : JOB.clean + 1;
  if (o.egg && s === 5) {
    tip += 520;
    coins += 520;
    unlock('xiaogai');
  }
  const rev = o.egg && s === 5 ? '小盖同学：谢谢鹈鹕师傅！宿舍楼下见 🦩❤️' : pick(REV[s]);
  JOB.revs.unshift(`${'★'.repeat(s)}${'☆'.repeat(5 - s)} ${rev}`);
  JOB.revs.length = Math.min(JOB.revs.length, 8);
  rateJob(s);
  saveCoins();
  SFX.win();
  showReceipt(o, s, pay, tip, rev, late);
  unlock('first');
  if (JOB.n >= 10) unlock('d10');
  if (JOB.n >= 50) unlock('d50');
  if (JOB.n >= 100) unlock('d100');
  if (o.urgent) unlock('urg');
  if (JOB.urg >= 10) unlock('urg10');
  if (JOB.five >= 10) unlock('five10');
  if (tip > 0) unlock('tip');
  if (JOB.tips >= 500) unlock('tip500');
  if (JOB.earn >= 1000) unlock('earn1k');
  if (JOB.earn >= 10000) unlock('earn10k');
  if (rainT > 0) unlock('rain');
  if (LIGHTS[lightMode].night) unlock('night');
  if (JOB.clean >= 10) unlock('clean10');
  if (drive === 'car' && SAVE.equip.vehicle === 'pana') unlock('pana');
  if (drive === 'moto') unlock('moto');
  if (o.t < o.lim * 0.5) unlock('fast');
  if (s === 5 && o.pers === '挑剔') unlock('picky');
}
function rateJob(s) {
  JOB.r.push(s);
  if (JOB.r.length > 60) JOB.r.shift();
  if (s <= 1) {
    JOB.low++;
    if (JOB.low >= 6) setTimeout(fire, 2600);
    else toast(`⚠️ 收到 1 星差评（${JOB.low}/6），满 6 次将被解雇`, 2600);
  }
}
function showReceipt(o, s, pay, tip, rev, late) {
  const e = $('rcpt');
  e.innerHTML = `<div style="font-size:22px;letter-spacing:2px;color:#ffd34d">${'★'.repeat(s)}<span style="opacity:.35">${'★'.repeat(5 - s)}</span></div><div>「${rev}」</div><div style="font-weight:800;margin-top:4px">🪙 +${pay}${late ? '（超时 −30%）' : ''}${tip ? ` · 💝 小费 +${tip}` : ''}</div><div style="font-size:12px;opacity:.75">${o.pers}顾客 · 评分 ${rating().toFixed(2)}</div>`;
  e.style.display = 'block';
  clearTimeout(showReceipt.t);
  showReceipt.t = setTimeout(() => (e.style.display = 'none'), 4200);
}
function fire() {
  JOB.fired = true;
  if (JOB.co !== '闪电跑腿' && !JOB.black.includes(JOB.co)) JOB.black.push(JOB.co);
  orders.length = 0;
  syncBag();
  updTarget();
  closeOffer();
  saveCoins();
  unlock('fired');
  SFX.lose();
  choice(
    '😢 你被解雇了',
    `${coOf().e} ${JOB.co} 收到你 6 次 1 星差评，已和你解除合作，并把你拉进了黑名单。<br>去「外卖员 → 求职网」投简历，找一家新平台吧。`,
    [
      { t: '打开求职网', p: 1, f: () => openJobs('ride') },
      { t: '先随便骑骑', f: () => {} },
    ]
  );
}
function cancelOrder(o, why) {
  const i = orders.indexOf(o);
  if (i < 0) return;
  orders.splice(i, 1);
  JOB.revs.unshift(`★☆☆☆☆ ${why}`);
  JOB.revs.length = Math.min(JOB.revs.length, 8);
  rateJob(1);
  saveCoins();
  SFX.lose();
  toast(`❌ ${why}（1 星）`, 3000);
  syncBag();
  updTarget();
}
// --- events ---
const EV_PICK = [
  (w) => {
    w.wait += 4;
    say('老板：马上好，马上好！再等一下下～');
  },
  (w) => {
    stamina = 100;
    exhausted = false;
    toast('🥤 老板送了你一瓶冰饮料，体力回满', 2600);
  },
  (w) => {
    w.o.cond -= 20;
    toast('💦 打包盒没扣紧，漏汤了！餐品状态 −20', 2600);
  },
  (w) => {
    choice('🤔 好几份餐长得一样', '订单号看不清楚，要不要仔细核对？', [
      {
        t: '仔细核对（多等 3 秒）',
        p: 1,
        f: () => {
          w.wait += 3;
          toast('✅ 核对无误');
        },
      },
      {
        t: '随手拿一份就走',
        f: () => {
          if (Math.random() < 0.5) wrongPick = { o: w.o, wrong: true };
        },
      },
    ]);
  },
  (w) => {
    w.o.tipPre += 10;
    toast('😊 老板夸你辛苦，多塞了一个鸡腿（顾客会更开心）', 2600);
    w.o.adj += 0.5;
  },
];
const SHOP_EGG = {
  鹈鹕炸鸡: [
    (w) => {
      coins += 20;
      saveCoins();
      toast('🦩 老板也是一只鹈鹕！「同类要互相照顾」，塞给你 🪙20', 3000);
    },
    (w) => {
      say('老板：放心，我们只炸鸡，从来不炸鹈鹕。');
    },
  ],
  老王海鲜: [
    (w) =>
      choice('🦞 小龙虾越狱了！', '一只小龙虾从桶里爬出来，正往马路上跑……', [
        {
          t: '帮老王抓回来（多等 3 秒）',
          p: 1,
          f: () => {
            w.wait += 3;
            w.o.tipPre += 15;
            toast('🦞 抓到了！老王给顾客多送了一份虾', 2600);
          },
        },
        {
          t: '假装没看见',
          f: () => {
            toast('🦞 小龙虾消失在夜色中，自由了', 2400);
          },
        },
      ]),
    (w) => {
      say('老王：皮皮虾，我们走！');
    },
  ],
  张姐麻辣烫: [
    (w) =>
      choice('🌶️ 张姐：要不要尝一口变态辣？', '据说吃完能骑得飞快……', [
        {
          t: '来！',
          f: () => {
            boostT = 6;
            stamina = 100;
            exhausted = false;
            SFX.power();
            toast('🔥 辣到起飞！6 秒极速冲刺', 2600);
          },
        },
        {
          t: '不了不了',
          p: 1,
          f: () => {
            toast('😅 张姐：年轻人不行啊');
          },
        },
      ]),
  ],
  渔港寿司: [
    (w) => {
      hp = Math.min(100, hp + 30);
      stats.fish++;
      toast('🍣 师傅偷偷喂了你一片三文鱼，血量 +30', 2600);
    },
    (w) => {
      say('师傅：鹈鹕先生，您的嘴可以装多少份寿司？');
    },
  ],
  阿婆奶茶: [
    (w) => {
      stamina = 100;
      exhausted = false;
      toast('🧋 阿婆：小伙子长得真俊，这杯奶茶送你', 2600);
    },
    (w) => {
      w.wait += 3;
      say('阿婆：珍珠要现煮的，再等一下哦');
    },
  ],
  深夜烧烤: [
    (w) => {
      if (LIGHTS[lightMode].night) {
        stamina = 100;
        toast('🍢 隔壁桌大哥请你吃了两串，你说要骑车只喝了可乐', 2800);
      } else {
        w.wait += 4;
        say('老板还没睡醒：白天来干嘛？晚上八点才开门！');
      }
    },
  ],
  鲜果切: [
    (w) =>
      choice('🍉 你问老板', '「这瓜保熟吗？」', [
        {
          t: '就问一句',
          p: 1,
          f: () => {
            say('老板：我开水果摊的，能卖你生瓜蛋子？');
          },
        },
        {
          t: '算了不问了',
          f: () => {
            toast('🍉 老板送你一块西瓜，体力 +30');
            stamina = Math.min(100, stamina + 30);
          },
        },
      ]),
  ],
  兰州牛肉面: [
    (w) => {
      w.wait += 2;
      w.o.tipPre += 10;
      toast('🍜 师傅当场表演拉面：一清二白三红四绿五黄！顾客多给了小费', 3000);
    },
  ],
  小笼包铺: [
    (w) => {
      w.o.cond = Math.min(100, w.o.cond + 10);
      say('老板：记得告诉顾客，先开窗，后喝汤！');
    },
  ],
  汉堡工坊: [
    (w) => {
      if (Math.random() < 0.5) {
        coins += 30;
        saveCoins();
        toast('🍔 抽中隐藏款「鹈鹕堡」！奖励 🪙30', 2800);
      } else toast('🍔 今天没抽到隐藏款，明天再来试试', 2400);
    },
  ],
  披萨小站: [
    (w) => {
      toast('🍕 榴莲披萨味道太冲，路边的鸽子都飞走了', 2800);
    },
  ],
  金陵盐水鸭: [
    (w) => {
      say('店里的鸭子看着你：同是水禽，相煎何急！');
    },
    (w) => {
      w.o.tipPre += 10;
      toast('🦆 老板：南京人一天不吃鸭，浑身难受。多送一份鸭胗', 2800);
    },
  ],
  鸭血粉丝汤: [
    (w) =>
      choice('🥣 老板：香菜要不要？', '这是一个严肃的问题。', [
        {
          t: '多放香菜',
          p: 1,
          f: () => {
            w.o.adj += 0.5;
            toast('🌿 顾客是香菜爱好者，开心！');
          },
        },
        {
          t: '不要香菜',
          f: () => {
            toast('🙅 老板默默把香菜挑掉了');
          },
        },
      ]),
  ],
  黄焖鸡米饭: [
    (w) => {
      say('老板：我们是正宗的，全国第 10086 家正宗店！');
    },
  ],
  煎饼果子: [
    (w) =>
      choice('🥞 大爷：加俩蛋？', '「加俩蛋，倍儿香！」', [
        {
          t: '加！（顾客更开心）',
          p: 1,
          f: () => {
            w.o.adj += 0.5;
            w.wait += 2;
          },
        },
        {
          t: '不加',
          f: () => {
            say('大爷：得嘞！');
          },
        },
      ]),
  ],
  海鸥咖啡: [
    (w) => {
      toast('🐦 店长海鸥对你翻了个白眼，然后偷走了一包糖', 2800);
      w.o.cond -= 5;
    },
    (w) => {
      stamina = 100;
      exhausted = false;
      toast('☕ 海鸥店长请你喝了杯冰美式，精神百倍', 2600);
    },
  ],
};
const RARE_EGG = [
  (w) => {
    coins += 88;
    saveCoins();
    SFX.win();
    toast('✨ 老板认出了你：「你就是传说中帅气的作者大大？」送你 🪙88', 3600);
  },
  (w) => {
    toast('🐱 店里的招财猫冲你招了招手……好像真的动了？', 3000);
  },
  (w) => {
    toast('🎵 店里正在放《鹈鹕外卖员之歌》，你忍不住跟着摇摆', 2800);
  },
];
const EV_DROP = [
  (w) => {
    choice('🚪 敲门没人应', '顾客好像不在家……', [
      {
        t: '打电话，等 5 秒',
        p: 1,
        f: () => {
          w.wait += 5;
          say('顾客：来了来了，马上开门！');
        },
      },
      {
        t: '放门口拍照走人',
        f: () => {
          if (Math.random() < 0.5) w.o.adj -= 1;
        },
      },
    ]);
  },
  (w) => {
    w.wait += 4;
    stamina = Math.max(0, stamina - 35);
    say('电梯坏了！爬了 18 楼……');
  },
  (w) => {
    choice('🛂 保安拦住了你', '小区不让外卖进门。', [
      {
        t: '登记后进门（多 4 秒）',
        p: 1,
        f: () => {
          w.wait += 4;
        },
      },
      {
        t: '趁保安不注意溜进去',
        f: () => {
          if (Math.random() < 0.45) {
            w.o.adj -= 2;
            toast('🚨 被保安抓到了，顾客也被投诉牵连……', 2600);
          } else toast('😎 成功溜进去了');
        },
      },
    ]);
  },
  (w) => {
    stamina = Math.max(0, stamina - 10);
    w.wait = 0.6;
    toast('🐕 一只狗冲你狂叫！把餐放下就跑', 2400);
  },
  (w) => {
    w.o.adj += 1;
    stamina = 100;
    toast('😊 顾客给你倒了杯水，还说「辛苦了」', 2600);
  },
  (w) => {
    const o = w.o;
    const bi = Math.floor(o.home.ctr.x / B),
      bj = Math.floor(o.home.ctr.z / B);
    const ps = poisOfBlock(bi + pick([-1, 1]), bj + pick([-1, 0, 1])).filter((p) => !p.shop);
    if (!ps.length) {
      w.wait += 2;
      return;
    }
    const nh = pick(ps);
    w.redirect = true;
    o.home = nh;
    o.lim += 45;
    w.wait = 1.2;
    say(`顾客：不好意思地址填错了！送到 ${nh.name}，给你加 10 块小费`);
    o.tipPre += 10;
  },
];
const EV_RIDE = [
  () => {
    if (drive === 'car') return;
    choice('💥 爆胎了！', '车胎被钉子扎破了。', [
      {
        t: '花 🪙30 路边补胎',
        p: 1,
        f: () => {
          if (coins >= 30) {
            coins -= 30;
            saveCoins();
            toast('🔧 补好了，继续出发');
          } else {
            flatT = 40;
            toast('钱不够，只能慢慢骑……');
          }
        },
      },
      {
        t: '凑合慢慢骑（40 秒限速）',
        f: () => {
          flatT = 40;
        },
      },
    ]);
  },
  () => {
    if (!orders.length) return;
    say('顾客：到哪了？快点哦～');
  },
  () => {
    if (wxMode === 0) {
      if (Math.random() < 0.4) startSnow();
      else startRain();
    }
  },
  () => {
    boostOrders = 3;
    toast('🔥 平台冲单奖励：接下来 3 单每单 +🪙20', 3000);
  },
  () => {
    choice('👛 路边捡到一个钱包', '里面有 🪙200 和一张身份证。', [
      {
        t: '交给附近交警',
        p: 1,
        f: () => {
          coins += 50;
          saveCoins();
          unlock('wallet');
          toast('👮 交警表扬了你，失主送来 🪙50 感谢费', 3000);
        },
      },
      {
        t: '自己留着',
        f: () => {
          if (Math.random() < 0.4) {
            coins = Math.max(0, coins - 300);
            saveCoins();
            SFX.siren();
            showTicket('<b>👮 失主报警了</b><br>拾得遗失物拒不归还 · 罚款 🪙300');
          } else {
            coins += 200;
            saveCoins();
            toast('💰 +200……良心有点痛', 2600);
          }
        },
      },
    ]);
  },
  () => {
    if (!orders.some((o) => o.phase === 'carry')) return;
    const o = orders.find((o) => o.phase === 'carry');
    o.tipPre += 15;
    toast(`💝 ${o.home.name} 的顾客提前打赏了 🪙15`, 2600);
  },
];
// --- generic choice popup ---
let choiceResume = null;
function choice(title, html, opts) {
  choiceResume = state === 'paused' ? resumeState : state;
  if (state === 'ride' || state === 'walk' || state === 'foot') state = 'paused';
  $('chT').textContent = title;
  $('chD').innerHTML = html;
  const b = $('chB');
  b.innerHTML = '';
  opts.forEach((o) => {
    const e = document.createElement('button');
    e.className = 'pill glass' + (o.p ? ' primary' : '');
    e.textContent = o.t;
    e.onclick = () => {
      $('choice').style.display = 'none';
      if (state === 'paused' && choiceResume) state = choiceResume;
      o.f();
    };
    b.appendChild(e);
  });
  $('choice').style.display = 'flex';
}
// --- achievements ---
const ACHS = [
  ['first', '🛵', '第一单', '完成第一笔外卖'],
  ['d10', '📦', '小有名气', '累计送达 10 单'],
  ['d50', '🏅', '老骑手', '累计送达 50 单'],
  ['d100', '👑', '百单王者', '累计送达 100 单'],
  ['urg', '⚡', '加急侠', '完成一笔加急单'],
  ['urg10', '🚀', '闪电侠', '完成 10 笔加急单'],
  ['five10', '🌟', '好评如潮', '收到 10 个五星好评'],
  ['picky', '🧐', '征服挑剔鬼', '挑剔顾客给了你五星'],
  ['tip', '💝', '第一笔小费', '收到顾客小费'],
  ['tip500', '💰', '小费达人', '累计小费 🪙500'],
  ['earn1k', '💵', '月入过千', '累计配送收入 🪙1000'],
  ['earn10k', '🏦', '外卖大亨', '累计配送收入 🪙10000'],
  ['fast', '⏱️', '神速送达', '一半时限内送达'],
  ['triple', '🎒', '三单齐飞', '同时背 3 单'],
  ['rain', '🌧️', '雨中骑士', '雨天送达一单'],
  ['night', '🌙', '夜猫子', '夜间送达一单'],
  ['clean10', '🚦', '模范骑手', '连续 10 单零违章'],
  ['moto', '🏍️', '摩托骑手', '骑摩托送达一单'],
  ['pana', '🏎️', '豪车送外卖', '开帕拉梅拉送外卖'],
  ['wallet', '👛', '拾金不昧', '把捡到的钱包交给交警'],
  ['hospital', '🚑', '缝了 8 针', '被送进医院'],
  ['statue', '🗿', '神像', '找到传说中的鹈鹕神像'],
  ['ufo', '👽', '第三类接触', '在 UFO 下面停车'],
  ['pigeon', '🕊️', '惊鸟', '6 秒内按 8 次车铃'],
  ['six', '6️⃣', '六六大顺', '时速保持 66 km/h'],
  ['xiaogai', '🦩', '宿舍楼下', '给小盖同学送一单夜宵'],
  ['fan', '📸', '网红骑手', '和路边粉丝合影'],
  ['rainbow', '🌈', '雨过天晴', '看到雨后彩虹'],
  ['fired', '😢', '人生低谷', '被平台解雇'],
  ['rehire', '💼', '东山再起', '被解雇后找到新工作'],
  ['lic', '🪪', '持证上岗', '考取驾照'],
  ['s2100', '💯', '科目二满分', '科目二考试满分'],
];
function unlock(id) {
  if (ACH[id]) return;
  const a = ACHS.find((x) => x[0] === id);
  if (!a) return;
  ACH[id] = Date.now();
  coins += 50;
  saveCoins();
  const e = $('achPop');
  e.innerHTML = `🏆 成就解锁：${a[1]} ${a[2]} · 🪙+50`;
  e.style.display = 'block';
  clearTimeout(unlock.t);
  unlock.t = setTimeout(() => (e.style.display = 'none'), 3200);
}
function renderAch() {
  const g = $('achGrid');
  g.innerHTML = '';
  const n = Object.keys(ACH).length;
  $('achN').textContent = `已解锁 ${n} / ${ACHS.length} · 每个奖励 🪙50`;
  for (const a of ACHS) {
    const d = document.createElement('div');
    d.className = 'item' + (ACH[a[0]] ? '' : ' lock');
    d.innerHTML = `<div style="font-size:30px">${ACH[a[0]] ? a[1] : '🔒'}</div><b>${a[2]}</b><div style="font-size:11.5px;opacity:.8">${a[3]}</div>`;
    g.appendChild(d);
  }
}
$('achBtn').onclick = () => {
  $('start').style.display = 'none';
  renderAch();
  $('ach').style.display = 'flex';
};
$('achBack').onclick = () => {
  $('ach').style.display = 'none';
  showStart();
};
// --- job panel & job site ---
let jobFrom = 'start';
function renderJob() {
  const r = rating(),
    c = coOf();
  $('jbS').innerHTML = JOB.fired
    ? `<b style="color:#ff8080">已被 ${JOB.co} 解雇</b> · 去求职网找新工作`
    : `${c.e} <b>${JOB.co}</b> 骑手 · ${rTier(r)}`;
  $('jbR').innerHTML =
    `<span style="font-size:30px;color:#ffd34d">★ ${r.toFixed(2)}</span><br>单价倍率 ×${(rMult(r) * c.m).toFixed(2)} · 1 星差评 <b style="color:${JOB.low >= 4 ? '#ff8080' : '#fff'}">${JOB.low}/6</b>`;
  $('jbT').innerHTML = [
    '📦 送达 ' + JOB.n + ' 单',
    '⚡ 加急 ' + JOB.urg,
    '🌟 五星 ' + JOB.five,
    '🪙 收入 ' + JOB.earn,
    '💝 小费 ' + JOB.tips,
  ]
    .map((s) => `<span class="stat">${s}</span>`)
    .join('');
  $('jbV').innerHTML = JOB.revs.length
    ? JOB.revs
        .slice(0, 5)
        .map((s) => `<div>${s}</div>`)
        .join('')
    : '<div style="opacity:.7">还没有评价，快去接单吧</div>';
}
function openJob(from) {
  jobFrom = from;
  $(from).style.display = 'none';
  renderJob();
  $('job').style.display = 'flex';
}
$('jobBtn').onclick = () => openJob('start');
$('jbBack').onclick = () => {
  $('job').style.display = 'none';
  if (jobFrom === 'start') showStart();
  else $(jobFrom).style.display = 'flex';
};
$('jbJobs').onclick = () => {
  $('job').style.display = 'none';
  openJobs('job');
};
let jobsFrom = 'job';
const IQ = [
  ['顾客投诉餐洒了，你应该？', ['真诚道歉，按平台规则处理', '跟顾客吵一架', '直接拉黑顾客'], 0],
  [
    '送餐快超时了，路口是红灯，你应该？',
    ['停车等绿灯，再联系顾客说明', '冲过去，反正没车', '逆行抄近路'],
    0,
  ],
  ['骑电动车送外卖必须？', ['佩戴安全头盔', '边骑边看手机导航', '载人顺路'], 0],
  ['顾客不在家，你应该？', ['电话联系，按顾客要求放置', '直接带走自己吃', '扔在楼下'], 0],
  ['商家出餐慢，你应该？', ['礼貌催单，必要时报备平台', '砸柜台', '取消订单'], 0],
  ['恶劣天气送餐，最重要的是？', ['安全第一，慢一点', '越快越好', '不接任何单'], 0],
];
function openJobs(from) {
  jobsFrom = from;
  if (from === 'ride') {
    resumeState = 'ride';
    if (state === 'ride') state = 'paused';
  } else $(from).style.display = 'none';
  renderJobs();
  $('jobs').style.display = 'flex';
}
function renderJobs() {
  const L = $('jsL');
  L.innerHTML = '';
  $('jsQ').style.display = 'none';
  L.style.display = 'block';
  $('jsS').innerHTML = JOB.fired
    ? '你目前<b style="color:#ff8080">待业中</b>，投个简历吧'
    : `当前就职：${coOf().e} ${JOB.co}（跳槽会清空当前评分记录）`;
  for (const c of COS) {
    const bl = JOB.black.includes(c.n) && c.n !== '闪电跑腿',
      cur = !JOB.fired && JOB.co === c.n,
      ok = !c.need || c.need();
    const d = document.createElement('div');
    d.className = 'jrow glass';
    d.innerHTML = `<div style="font-size:30px">${c.e}</div><div style="flex:1;text-align:left"><b>${c.n}</b> · 单价 ×${c.m}<br><span style="font-size:12px;opacity:.8">${c.req}</span></div>`;
    const b = document.createElement('button');
    b.className = 'pill glass' + (bl || cur || !ok ? '' : ' primary');
    b.style.padding = '8px 14px';
    b.textContent = cur ? '在职' : bl ? '已拉黑' : !ok ? '不符合' : '投简历';
    b.onclick = () => {
      if (cur) return;
      if (bl) {
        toast('该平台已把你拉进黑名单');
        return;
      }
      if (!ok) {
        toast(c.req);
        return;
      }
      if (c.dep && coins < c.dep) {
        toast(`押金不够，需要 🪙${c.dep}`);
        return;
      }
      interview(c);
    };
    d.appendChild(b);
    L.appendChild(d);
  }
}
function interview(c) {
  $('jsL').style.display = 'none';
  const Q = $('jsQ');
  Q.style.display = 'block';
  const qs = IQ.slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  let i = 0,
    ok = 0;
  const show = () => {
    if (i >= qs.length) {
      const pass = ok >= 2;
      Q.innerHTML = `<h3>${pass ? '🎉 面试通过！' : '😓 面试没过'}</h3><p>答对 ${ok}/3 题${pass ? `，欢迎加入 ${c.e} ${c.n}！` : '，回去再复习一下交规和服务规范吧。'}</p>`;
      if (pass) {
        const was = JOB.fired;
        if (c.dep) {
          coins -= c.dep;
        }
        Object.assign(JOB, { co: c.n, fired: false, low: 0, r: [5, 5, 5, 5, 5] });
        saveCoins();
        if (was) unlock('rehire');
        SFX.win();
      } else SFX.lose();
      const b = document.createElement('button');
      b.className = 'pill glass primary';
      b.textContent = '好的';
      b.onclick = renderJobs;
      Q.appendChild(b);
      return;
    }
    const [q, opts, ans] = qs[i];
    const order = opts.map((o, k) => k).sort(() => Math.random() - 0.5);
    Q.innerHTML = `<p style="opacity:.8">${c.e} ${c.n} 面试 · 第 ${i + 1}/3 题</p><h3>${q}</h3>`;
    for (const k of order) {
      const b = document.createElement('button');
      b.className = 'pill glass';
      b.style.cssText = 'display:block;width:100%;margin:6px 0';
      b.textContent = opts[k];
      b.onclick = () => {
        if (k === ans) ok++;
        i++;
        show();
      };
      Q.appendChild(b);
    }
  };
  show();
}
$('jsBack').onclick = () => {
  $('jobs').style.display = 'none';
  if (jobsFrom === 'ride') {
    if (state === 'paused') state = resumeState;
  } else if (jobsFrom === 'job') {
    renderJob();
    $('job').style.display = 'flex';
  } else showStart();
};
// --- per-frame ---
let actO = null;
function delivUpdate(dt) {
  if (!freeMode()) return;
  if (state === 'ride' || state === 'walk' || state === 'foot') {
    for (const o of orders.slice()) {
      o.t += dt;
      if (o.t > o.lim * 2.2 && !(walk && walk.o === o))
        cancelOrder(o, o.phase === 'pick' ? '超时太久，顾客取消了订单' : '超时太久，顾客拒收');
    }
  }
  if (state === 'ride') {
    if (braking && v > 6)
      orders.forEach((o) => {
        if (o.phase === 'carry') o.cond -= 6 * dt;
      });
    if (flatT > 0) {
      flatT -= dt;
      if (v > 5) v -= (v - 5) * dt * 2;
    }
    if (!JOB.fired && !offer && orders.length < 3) {
      offerT -= dt;
      if (offerT <= 0) newOffer();
    }
    evT -= dt;
    if (evT <= 0) {
      evT = rnd(70, 140);
      pick(EV_RIDE)();
    }
    const o = nearTarget();
    if (o !== actO) {
      actO = o;
      const a = $('act');
      if (o) {
        a.textContent =
          o.phase === 'pick' ? `🛍️ 下车取餐 · ${o.shop.name}` : `📦 下车送餐 · ${o.home.name}`;
        a.style.display = 'block';
      } else a.style.display = 'none';
    }
  } else if (actO) {
    actO = null;
    $('act').style.display = 'none';
  }
  if (state === 'foot' && !JOB.fired && !offer && orders.length < 3) {
    offerT -= dt;
    if (offerT <= 0) newOffer();
  }
  if (offer && (state === 'ride' || state === 'walk' || state === 'foot')) {
    offer.ttl -= dt;
    renderOffer();
    if (offer.ttl <= 0) closeOffer();
  }
}
$('act').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (state !== 'ride' || !actO) return;
  v = 0;
  startWalk(actO);
  actO = null;
});
function delivBump(n) {
  orders.forEach((o) => {
    if (o.phase === 'carry') {
      o.cond -= n;
      if (o.cond < 40 && !o.spill) {
        o.spill = true;
        toast('🍜 汤洒出来了！小心点', 2200);
      }
    }
  });
}
function delivUI() {
  const o = curOrder();
  const r = rating();
  $('mE').textContent = '🛵';
  $('mT').textContent = JOB.fired ? '待业中 · 去求职网' : `${JOB.co} · ★${r.toFixed(2)}`;
  if (!o) {
    $('mP').textContent = JOB.fired ? '⚙️ → 回首页 → 外卖员 → 求职网' : '🔎 等待派单，先随便骑骑…';
  } else {
    const left = Math.ceil(o.lim - o.t);
    $('mP').textContent =
      (o.phase === 'pick' ? `🛍️ 去 ${o.shop.name} 取餐` : `📦 送到 ${o.home.name}`) +
      ` · ${left >= 0 ? '⏱ ' + left + 's' : '⚠️ 超时 ' + -left + 's'}` +
      (orders.length > 1 ? ` · 共 ${orders.length} 单` : '');
  }
  $('mS').textContent =
    `🪙 ${coins}` +
    (o && o.phase === 'carry' ? ` · 🍱 ${Math.max(0, Math.round(o.cond))}%` : '') +
    (rainT > 0 ? ' · 🌧️' : '') +
    (flatT > 0 ? ' · 🛞爆胎' : '') +
    ` · 🪪${LIC.ok ? LIC.pts + '分' : '吊销'}`;
}
const FREE = { k: 'free', e: '🛵', t: '鹈鹕外卖员', lim: 0, win: ['收工！'], d: '' };

const STREAK = { list: [], mult: 1, last: 0 };
const stEl = document.createElement('div');
stEl.id = 'streak';
stEl.className = 'glass dark';
document.body.appendChild(stEl);
function streakPay() {
  const now = Date.now() / 1000;
  if (now - STREAK.last > 300) {
    STREAK.mult = 1;
    STREAK.list = [];
  }
  const m = STREAK.mult;
  STREAK.last = now;
  STREAK.list = STREAK.list.filter((x) => now - x <= 300);
  STREAK.list.push(now);
  if (STREAK.list.length >= 3) {
    const k = Math.round(rnd(1.2, 2.0) * 10) / 10;
    STREAK.mult = Math.min(50, Math.round(STREAK.mult * k * 100) / 100);
    STREAK.list = [];
    setTimeout(() => {
      SFX.power();
      toast(`🔥 5 分钟连送 3 单！赏金再 ×${k} → 当前 ×${STREAK.mult}`, 3400);
    }, 2800);
  }
  return m;
}
function updStreak() {
  const now = Date.now() / 1000,
    left = 300 - (now - STREAK.last);
  if (STREAK.mult > 1 && left <= 0) {
    STREAK.mult = 1;
    STREAK.list = [];
    toast('⌛ 5 分钟没送单，连单加倍中断了', 2600);
  }
  const show = freeMode() && (STREAK.mult > 1 || STREAK.list.length > 0) && left > 0;
  stEl.style.display = show ? 'block' : 'none';
  if (show)
    stEl.textContent = `🔥 ×${STREAK.mult} · 连单 ${STREAK.list.length}/3 · ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}`;
}
