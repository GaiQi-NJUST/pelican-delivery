'use strict';
// ── js/core/state.js ──
// 全局状态：state 状态机、物理量、经典任务、SAVE 存档读写
// ===== state =====
let VMAX = 18;
const CRASHV = 8.3;
let v = 0,
  heading = 0,
  steer = 0,
  theta = 0,
  wheelA = 0,
  chainOff = 0,
  tickAcc = 0,
  state = 'menu',
  crashT = 0,
  braking = false,
  gas = false,
  kL = false,
  kR = false;
let stamina = 100,
  exhausted = false,
  boostT = 0,
  blinkT = 2,
  blinkP = 0,
  bumpCool = 0,
  toastCool = 0;
let steerStyle = 0,
  barVal = 0,
  gyroMode = 0,
  gyroVal = 0,
  gyroBase = null,
  gyroSeen = false,
  camMode = 0,
  lightMode = 0,
  sens = 1,
  traffic = 1,
  shadows = true;
const pv = V(),
  pw = V(),
  crashDir = V();
let bikeV = 0,
  fallTo = 0;
let inInter = null,
  interViol = false;
const stats = {};
let mission = null,
  mT = 0,
  dests = [],
  destIdx = 0;

// ===== missions =====
const FAILS = {
  time: [
    '⏰ 时间到！你还在路上……',
    '⏰ 超时了，顾客已经自己骑车去拿了',
    '⏰ 太迟了，海鸥已经睡着了',
  ],
  car: [
    '🚗 被车撞飞了！鹈鹕决定以后走人行道',
    '🚗 一声巨响，鹈鹕在空中转了三圈',
    '🚗 车主下来扶起了你，还送你去了宠物医院',
  ],
  viol: ['🚨 闯红灯被交警拦下，罚抄交规 100 遍', '🚨 红灯停，绿灯行，鹈鹕被请去学习交规'],
};
const TWISTS = [
  '……然后一只海鸥抢走了你的奖励 🐦',
  '……然后你发现自行车被贴了一张罚单 🧾',
  '……然后天上掉下一条鱼，正好砸中你 🐟',
  '……然后你被星探发现，签约成为网红鹈鹕 ✨',
  '……然后你醒了，原来是一场梦 💤',
  '……然后路边的猫冲你点了点头 🐈',
  '……然后夕阳刚好落在你身后，像电影结尾一样 🎬',
];
const CFG = [
  { d: '把鲜鱼送到「老王海鲜大排档」', L: [200, 150, 100] },
  { d: '骑到城东的翡翠湖，赶上今天的晚霞', L: [240, 180, 120] },
  { d: '把药送到生病的海鸥家', L: [160, 110, 80] },
  { d: '赶到生日派对现场', L: [130, 90, 65] },
  { d: '依次送达 {n} 个包裹', N: [2, 3, 4], L: [200, 240, 260] },
  { d: '在马路上收集 {n} 条鱼', N: [5, 8, 12], L: [150, 150, 150] },
  { d: '绿灯通过 {n} 个路口，全程不闯红灯', N: [4, 6, 9], L: [180, 180, 200] },
  { d: '时速冲到 {n} km/h', N: [40, 45, 50], L: [60, 60, 60] },
  { d: '累计骑行 {km} 公里', N: [1000, 1500, 2500], L: [150, 150, 180] },
  { d: '连续 {n} 秒不刹车、不蹭路沿、不摔车', N: [25, 40, 60], L: [120, 120, 150] },
  { d: '在 {n} 个不同路口中央按响车铃', N: [2, 3, 5], L: [150, 150, 180] },
  { d: '与行驶中的汽车近距离擦肩而过 {n} 次', N: [3, 5, 8], L: [150, 150, 150] },
  { d: '近距离看到 {n} 辆帕拉梅拉和 {n} 辆宝马', N: [1, 2, 3], L: [180, 180, 240] },
];
const DIFF = ['简单', '中等', '困难'],
  REWARD = [100, 200, 500];
let diff = 1,
  baseIdx = 0,
  coins = 0;
const SAVE = {
  owned: ['bike_red'],
  equip: { vehicle: 'bike_red', hat: null, eyes: null, neck: null, back: null, ear: null },
};
try {
  const j = JSON.parse(localStorage.getItem('pelicanSave') || 'null');
  if (j) {
    if (j.x) Object.assign(SAVE, j.x);
    coins = +j.coins || 0;
    Object.assign(SAVE.equip, j.equip || {});
    SAVE.owned = j.owned || SAVE.owned;
    if (j.lic) SAVE.lic = j.lic;
    if (j.job) SAVE.job = j.job;
    if (j.ach) SAVE.ach = j.ach;
  } else coins = +(localStorage.getItem('pelicanCoins') || 0) || 0;
} catch (e) {}
function saveCoins() {
  try {
    localStorage.setItem(
      'pelicanSave',
      JSON.stringify({
        coins,
        owned: SAVE.owned,
        equip: SAVE.equip,
        lic: SAVE.lic,
        job: SAVE.job,
        ach: SAVE.ach,
        x: Object.fromEntries(
          Object.keys(SAVE)
            .filter((k) => /^(roof_|cal$|homeK$|momDay$|fuel$|achx$|title$|meme_)|_egg$/.test(k))
            .map((k) => [k, SAVE[k]])
        ),
      })
    );
  } catch (e) {}
}
function buildMission() {
  const b = MS[baseIdx],
    c = CFG[baseIdx];
  const n = c.N ? c.N[diff] : b.n;
  mission = Object.assign({}, b, {
    n,
    lim: c.L[diff],
    d: c.d.replace(/\{n\}/g, n).replace('{km}', (n / 1000).toFixed(1)),
    reward: REWARD[diff],
    diff,
  });
}
function newMission() {
  showStart();
}
function showStart() {
  mission = FREE;
  $('sC').textContent = `🪙 ${coins}`;
  $('sJ').innerHTML = JOB.fired
    ? '😢 待业中 · 去「外卖员 → 求职网」找工作'
    : `${coOf().e} ${JOB.co} · ★ ${rating().toFixed(2)} · ${rTier(rating())}`;
  $('start').style.display = 'flex';
  state = 'menu';
}
function startMission() {
  mT = 0;
  Object.assign(stats, {
    fish: 0,
    dist: 0,
    maxV: 0,
    legal: 0,
    viol: 0,
    near: 0,
    calm: 0,
    bells: new Set(),
    pana: new Set(),
    bmw: new Set(),
    score: 0,
  });
  dests = [];
  destIdx = 0;
  beacon.visible = false;
  if (mission.k === 'reach' || mission.k === 'multi') {
    let ci = Math.round(player.position.x / B),
      cj = Math.round(player.position.z / B);
    const n = mission.k === 'multi' ? mission.n : 1;
    for (let k = 0; k < n; k++) {
      let di, dj;
      do {
        di = Math.floor(rnd(-3, 3.99));
        dj = Math.floor(rnd(-3, 3.99));
      } while (
        Math.abs(di) + Math.abs(dj) < (n > 1 ? 1 : 2) ||
        Math.abs(di) + Math.abs(dj) > (n > 1 ? 2 : 4)
      );
      ci += di;
      cj += dj;
      const ax = Math.random() < 0.5;
      const sgn = Math.random() < 0.5 ? -1 : 1;
      dests.push(
        ax
          ? V(ci * B + sgn * 22, 0, cj * B + sgn * 3.6)
          : V(ci * B - sgn * 3.6, 0, cj * B + sgn * 22)
      );
    }
    setDest();
  }
  for (const f of fishes) placePickup(f);
  $('start').style.display = 'none';
  state = 'ride';
  if (mission.k === 'free') {
    offerT = rnd(6, 12);
    evT = rnd(70, 130);
    updTarget();
    if (JOB.fired) toast('😢 你还在待业，去「外卖员 → 求职网」找工作', 3000);
    else toast('🛵 上线接单！边骑边等派单', 2200);
  }
  updMissionUI(true);
  peekCard();
}
function setDest() {
  const p = dests[destIdx];
  beacon.position.copy(p);
  beacon.visible = true;
  setLabel(
    mission.k === 'multi' ? `${mission.place} ${destIdx + 1}/${dests.length}` : mission.place
  );
}
function progress() {
  const m = mission,
    s = stats;
  switch (m.k) {
    case 'reach':
    case 'multi': {
      const d = player.position.distanceTo(dests[destIdx]);
      return {
        txt:
          (m.k === 'multi' ? `包裹 ${destIdx}/${dests.length} · ` : '') +
          `距目的地 ${Math.round(d)} m`,
        done: false,
      };
    }
    case 'free':
      return { txt: `🪙 ${coins}`, done: false };
    case 'fish':
      return { txt: `🐟 ${s.fish} / ${m.n}`, done: s.fish >= m.n };
    case 'legal':
      return { txt: `🚦 文明通过 ${s.legal} / ${m.n} 个路口`, done: s.legal >= m.n };
    case 'speed':
      return { txt: `最高 ${Math.round(s.maxV * 3.6)} / ${m.n} km/h`, done: s.maxV * 3.6 >= m.n };
    case 'dist':
      return {
        txt: `${(s.dist / 1000).toFixed(2)} / ${(m.n / 1000).toFixed(1)} km`,
        done: s.dist >= m.n,
      };
    case 'calm':
      return { txt: `平稳 ${Math.floor(s.calm)} / ${m.n} 秒`, done: s.calm >= m.n };
    case 'bell':
      return { txt: `🔔 ${s.bells.size} / ${m.n} 个路口`, done: s.bells.size >= m.n };
    case 'near':
      return { txt: `😎 ${s.near} / ${m.n} 次`, done: s.near >= m.n };
    case 'cars':
      return {
        txt: `帕拉梅拉 ${Math.min(m.n, s.pana.size)}/${m.n} · 宝马 ${Math.min(m.n, s.bmw.size)}/${m.n}`,
        done: s.pana.size >= m.n && s.bmw.size >= m.n,
      };
  }
}
let uiT = 0;
function updMissionUI(force) {
  uiT -= 1;
  if (!force && uiT > 0) return;
  uiT = 6;
  if (exam) {
    updExamUI();
    return;
  }
  if (!mission) return;
  if (mission.k === 'free') {
    delivUI();
    return;
  }
  const p = progress();
  $('mE').textContent = mission.e;
  $('mT').textContent = mission.t;
  $('mP').textContent = p.txt;
  const tl = mission.lim
    ? ` · ⏱ ${Math.max(0, Math.ceil(mission.lim - mT))}s`
    : ` · ⏱ ${Math.floor(mT)}s`;
  $('mS').textContent =
    `⭐ ${stats.score}${tl}` +
    (stats.viol ? ` · 🚨${stats.viol}` : '') +
    ` · 🪪${LIC.ok ? LIC.pts + '分' : '吊销'}`;
}
function finish(win, reason) {
  if (state === 'end' || exam) return;
  const prev = state;
  state = 'end';
  gas = braking = kL = kR = false;
  const ending = win ? pick(mission.win) : pick(FAILS[reason]);
  const twist = Math.random() < 0.3 ? pick(TWISTS) : '';
  win ? SFX.win() : SFX.lose();
  if (win) {
    coins += mission.reward;
    saveCoins();
  }
  $('eTag').textContent = (win ? '任务完成' : '任务失败') + ` · ${DIFF[mission.diff]} · 随机结局`;
  $('eE').textContent = win ? mission.e : '💥';
  $('eT').textContent = win ? `${mission.t} ✓` : mission.t;
  $('eD').textContent = ending;
  $('eX').textContent = twist;
  $('eS').innerHTML =
    [
      `⏱ ${Math.floor(mT)} 秒`,
      `📏 ${(stats.dist / 1000).toFixed(2)} km`,
      `🐟 ${stats.fish}`,
      `🚀 最高 ${Math.round(stats.maxV * 3.6)} km/h`,
      `🚨 闯红灯 ${stats.viol}`,
      `⭐ ${stats.score}`,
    ]
      .map((s) => `<span class="stat">${s}</span>`)
      .join('') +
    `<p style="font-size:17px;font-weight:800;margin-top:8px">${win ? `🪙 +${mission.reward}　` : ''}金币共 ${coins}</p>`;
  setTimeout(
    () => {
      $('end').style.display = 'flex';
    },
    prev === 'crash' ? 1400 : 300
  );
}
