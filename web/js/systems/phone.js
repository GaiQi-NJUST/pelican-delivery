'use strict';
// ── js/systems/phone.js ──
// 手机：灵动岛、9 个 App、20 通剧情来电、日历/回家
const PHI = (c) =>
  `<i class="phI${c ? ' ' + c : ''}" style="background-image:url(${IMG.cbtn})"></i>`;
// ===== v1.5 phone, thief, puzzles, calendar, home, island, reform =====
const modal = document.createElement('div');
modal.id = 'mdl';
modal.innerHTML =
  '<div class="glass dark" id="mdlB"><b class="xclose" id="mdlX">✕</b><div id="mdlT"></div><div id="mdlC"></div><div id="mdlO"></div></div>';
document.body.appendChild(modal);
let mdlResume = null;
function mdlOpen(title, html, opts, noClose) {
  if (!mdlResume) {
    mdlResume = state;
    if (state !== 'menu') state = 'paused';
  }
  $('mdlT').innerHTML = title;
  $('mdlC').innerHTML = html || '';
  const O = $('mdlO');
  O.innerHTML = '';
  (opts || []).forEach((o) => {
    const b = document.createElement('button');
    b.className = 'glass pill' + (o.p ? ' primary' : '');
    b.innerHTML = o.t;
    b.onpointerdown = (e) => {
      e.preventDefault();
      initAudio();
      o.f();
    };
    O.appendChild(b);
  });
  $('mdlX').style.display = noClose ? 'none' : '';
  modal.style.display = 'flex';
}
function mdlClose() {
  modal.style.display = 'none';
  if (mdlResume != null) {
    if (state === 'paused') state = mdlResume;
    mdlResume = null;
  }
}
$('mdlX').onpointerdown = (e) => {
  e.preventDefault();
  mdlClose();
};
// ---------- calendar ----------
const CAL = Object.assign({ day: 1, min: 8 * 60, slept: 0, warned: 0 }, SAVE.cal || {});
SAVE.cal = CAL;
const WK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
function calStr() {
  const h = Math.floor(CAL.min / 60) % 24,
    m = Math.floor(CAL.min % 60);
  return `${WK[(CAL.day - 1) % 7]} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
let calLM = -1;
function calUpdate(dt) {
  if (!freeMode() || !(state === 'ride' || state === 'foot' || state === 'walk')) return;
  CAL.min += dt * 2;
  const h = CAL.min / 60;
  const lm = h >= 5.5 && h < 10 ? 3 : h >= 10 && h < 17 ? 1 : h >= 17 && h < 19 ? 0 : 2;
  if (lm !== calLM) {
    calLM = lm;
    if (lightMode !== lm) {
      lightMode = lm;
      applyLight();
    }
  }
  if (h >= 22 && CAL.warned !== CAL.day) {
    CAL.warned = CAL.day;
    say('🌙 晚上 10 点了！快回家，不然只能睡大街了', 3200);
  }
  if (CAL.min >= 24 * 60) {
    if (INT.on) return;
    streetSleep();
  }
}
function nextDay() {
  CAL.day++;
  CAL.min = 7 * 60;
  CAL.warned = 0;
  calLM = -1;
  saveCoins();
}
function streetSleep() {
  if (state === 'foot') endFoot();
  const lost = Math.random() < 0.35 ? Math.round(coins * 0.2) : 0;
  coins -= lost;
  hp = Math.max(10, hp - 10);
  stamina = 60;
  exhausted = false;
  mdlOpen(
    '😴 你在马路边睡了一夜',
    `凌晨的风好冷……<br>${lost ? `醒来发现口袋被翻过，丢了 🪙${lost}` : '还好什么都没丢'}<br><span style="opacity:.8">生命 -10 · 体力只恢复到 60</span>`,
    [
      {
        t: '☀️ 新的一天（7:00）',
        p: 1,
        f: () => {
          mdlClose();
          nextDay();
        },
      },
    ],
    true
  );
  SFX.lose();
}
// ---------- home ----------
const HOMEK = SAVE.homeK || null;
function homeP() {
  if (!SAVE.homeK) {
    const c = curPOI.filter((p) => !p.shop);
    if (!c.length) return null;
    const d = c.find((p) => p.name.startsWith('南理工宿舍')) || c[0];
    SAVE.homeK = { key: d.key };
    saveCoins();
  }
  const K = SAVE.homeK;
  const kk = K.key.split(',');
  const ps = poisOfBlock(+kk[0], +kk[1]);
  return ps.find((p) => p.key === K.key) || null;
}
let NAVHOME = false;
function goHome() {
  const late = CAL.min >= 20 * 60 || CAL.min < 5 * 60;
  const st = state;
  if (state === 'foot') endFoot();
  if (late || CAL.min >= 24 * 60) {
    hp = 100;
    stamina = 100;
    exhausted = false;
    mdlOpen(
      '🏠 到家了，一觉睡到天亮',
      '洗澡、刷牙、躺平……<br>生命和体力全部回满',
      [
        {
          t: '☀️ 早上 7:00 出门',
          p: 1,
          f: () => {
            mdlClose();
            nextDay();
            NAVHOME = false;
            updTarget();
          },
        },
      ],
      true
    );
    SFX.win();
  } else {
    stamina = 100;
    exhausted = false;
    CAL.min += 120;
    mdlOpen('🏠 回家歇了一会儿', '喝了口水，体力回满（时间 +2 小时）', [
      { t: '继续出门', p: 1, f: mdlClose },
    ]);
    NAVHOME = false;
    updTarget();
  }
}
const homeSign = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: textTex(['🏠 我的家'], 'rgba(255,140,60,.95)', '#fff', 256, 72, 40),
    depthTest: true,
  })
);
homeSign.scale.set(5, 1.4, 1);
scene.add(homeSign);
homeSign.visible = false;
function homeSignUpd() {
  const p = freeMode() ? homeP() : null;
  homeSign.visible = !!p && !INT.on;
  if (p) {
    homeSign.position.set(p.door.x, p.ht ? Math.min(p.ht + 3, 40) : 18, p.door.z);
  }
}
// ---------- dynamic island ----------
const cmpE = $('cmp');
const islR = document.createElement('div');
islR.id = 'islR';
while (cmpE.firstChild) islR.appendChild(cmpE.firstChild);
cmpE.appendChild(islR);
const iclk = document.createElement('span');
iclk.id = 'iclk';
islR.appendChild(iclk);
const isl2 = document.createElement('div');
isl2.id = 'isl2';
cmpE.appendChild(isl2);
cmpE.appendChild($('offer'));
isl2.style.cursor = 'pointer';
let islLast = '';
function islUpdate() {
  const on = state !== 'menu' && !fieldOn;
  if (!on) return;
  cmpE.style.display = 'flex';
  iclk.textContent = freeMode() ? calStr() : '';
  let h = '';
  if (CALL) h = islCallHtml();
  else if (freeMode() && orders.length) {
    const o = orders[0];
    const left = Math.ceil(o.lim - o.t);
    h = `${o.phase === 'pick' ? `${o.shop.e} 取 ${o.shop.name}` : `🏢 送 ${o.home.name}`} · <b style="color:${left < 20 ? '#ff6b5a' : '#7CFC9A'}">${left <= 0 ? `超时 ${-left}s` : `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</b> · 🪙${o.price}${orders.length > 1 ? ` · +${orders.length - 1}单` : ''}`;
  } else if (freeMode() && ERR) {
    const l = Math.max(0, Math.ceil(ERR.lim - (performance.now() - ERR.t0) / 1000));
    h = `📍 ${ERR.label} · <b style="color:${l < 30 ? '#ff6b5a' : '#7CFC9A'}">${Math.floor(l / 60)}:${String(l % 60).padStart(2, '0')}</b> · 🪙${ERR.reward}`;
  } else if (freeMode() && SQ) h = sqHud();
  else if (freeMode() && NAVHOME) h = '🏠 导航回家';
  if (h !== islLast) {
    islLast = h;
    isl2.innerHTML = h;
    isl2.style.display = h ? 'block' : 'none';
  }
  cmpE.classList.toggle('big', !!offer || !!h);
  cmpE.classList.toggle('calling', !!CALL);
  cmpE.classList.toggle('xl', !!offer);
}
// ---------- phone (v1.7 redesign) ----------
const phoneE = document.createElement('div');
phoneE.id = 'phone';
phoneE.innerHTML =
  '<div id="phS"><div id="phNotch"><i></i></div><div id="phBar"><span id="phClk">09:00</span><span class="phSt"><i class="sig"><b></b><b></b><b></b><b></b></i>5G<i class="bat"><b></b></i></span></div><div id="phV"></div><div id="phHome"><i></i></div></div>';
document.body.appendChild(phoneE);
let phoneOpen = false,
  phApp = null,
  phForCall = false;
const AV = {
  妈妈: ['❤️', '#ff8fa3'],
  室友: ['🧢', '#7cc4ff'],
  站长: ['👷', '#ffd36b'],
  10086: ['📶', '#9ad7ff'],
  驾校教练: ['🕶️', '#c7b8ff'],
  鹈鹕外卖: ['🦩', '#ffb3c1'],
  交警大队: ['👮', '#8fb3ff'],
  陌生号码: ['❓', '#bbbbbb'],
  快递小哥: ['📦', '#ffcf8a'],
};
const avOf = (n) => AV[n] || ['👤', '#9aa'];
const avH = (n, s) =>
  `<span class="av" style="background:${avOf(n)[1]};width:${s}px;height:${s}px;font-size:${s * 0.55}px">${avOf(n)[0]}</span>`;
function phClkUpd() {
  const e = $('phClk');
  if (e) e.textContent = freeMode() ? calStr().slice(3) : new Date().toTimeString().slice(0, 5);
}
function openPhone(forCall) {
  if (phoneOpen) {
    if (!forCall && !CALL) phHome();
    return;
  }
  phoneOpen = true;
  phForCall = !!forCall;
  phoneE.style.display = 'block';
  phoneE.classList.remove('out');
  void phoneE.offsetWidth;
  phoneE.classList.add('in');
  phClkUpd();
  if (CALL) drawCall();
  else phHome();
  SFX.tick(0.4);
}
function closePhone() {
  phoneOpen = false;
  phForCall = false;
  phoneE.classList.remove('in');
  phoneE.style.display = 'none';
  stopGame();
}
$('bPhone').style.display = 'none';
$('phHome').onpointerdown = (e) => {
  e.preventDefault();
  if (CALL) return;
  if (phApp) phHome();
  else closePhone();
};
function wxNow() {
  const h = Math.floor(CAL.min / 60);
  const night = LIGHTS[lightMode].night;
  if (snowT > 0) return ['❄️', '小雪', -2];
  if (rainT > 0) return ['🌧️', '阵雨', 17];
  return night ? ['🌙', '晴', 19] : [h < 10 ? '🌤️' : '☀️', '晴', h < 10 ? 21 : 26];
}
function phHome() {
  phApp = null;
  stopGame();
  const w = wxNow();
  $('phV').innerHTML =
    `<div class="phW"><div><b>${w[2]}°C</b><span>${w[1]} · ${freeMode() ? calStr() : '南京'}</span></div><em>${w[0]}</em></div><div class="apps">` +
    APPS.map(
      (a) =>
        `<div class="app" data-a="${a[2]}">${IMG['app_' + a[2]] ? `<div class="aImg"><img src="${IMG['app_' + a[2]]}"></div>` : `<div style="background:linear-gradient(145deg,${a[3]})">${a[0]}</div>`}<span>${a[1]}</span>${a[2] === 'sms' && SMSn ? `<i class="dot">${SMSn}</i>` : ''}${a[2] === 'deliv' && offer ? '<i class="dot">1</i>' : ''}</div>`
    ).join('') +
    '</div><div class="phWarn">⚠️ 玩手机时小心车被偷</div>';
  $('phV')
    .querySelectorAll('.app')
    .forEach(
      (e) =>
        (e.onpointerdown = (ev) => {
          ev.preventDefault();
          openApp(e.dataset.a);
        })
    );
}
function phHead(t, back = true) {
  return `<div class="phT">${back ? '<i class="bk">‹</i>' : ''}${t}</div>`;
}
function bindBack() {
  const b = $('phV').querySelector('.bk');
  if (b)
    b.onpointerdown = (e) => {
      e.preventDefault();
      phHome();
    };
}
function phList(title, items) {
  $('phV').innerHTML =
    phHead(title) + items.map((it, i) => `<div class="phI" data-i="${i}">${it[0]}</div>`).join('');
  bindBack();
  $('phV')
    .querySelectorAll('.phI')
    .forEach(
      (e) =>
        (e.onpointerdown = (ev) => {
          ev.preventDefault();
          const f = items[+e.dataset.i][1];
          f && f();
        })
    );
}
const SMS = [];
let SMSn = 0;
function sms(from, t) {
  SMS.unshift([from, t, freeMode() ? calStr() : '', 1]);
  SMSn++;
  if (SMS.length > 20) SMS.pop();
}
sms('鹈鹕外卖', '欢迎上线！今天也要注意安全哦');
sms('妈妈', '儿子吃饭了吗？别太累');
sms('室友', '回来帮我带份烧烤 🍢');
const CALLS = {
  妈妈: [
    ['喂？妈～', '我'],
    ['吃饭了没？钱够不够花？我给你转了点', '妈妈'],
    ['够的够的，你也注意身体', '我'],
  ],
  室友: [
    ['喂？', '我'],
    ['你今晚回不回宿舍啊？11 点阿姨锁门', '室友'],
    ['回，给你带烧烤', '我'],
  ],
  站长: [
    ['站长好', '我'],
    ['今天单量大，跑起来！跑满 10 单有奖励', '站长'],
  ],
  10086: [
    ['……', '我'],
    ['您好，您的流量已用完，请及时充值', '10086'],
  ],
  驾校教练: [
    ['教练好', '我'],
    ['科目二练得怎么样？别压线！', '驾校教练'],
  ],
};
Object.assign(AV, {
  阿强: ['🤪', '#ffb26b'],
  医院: ['🏥', '#9fe0ff'],
  鹈鹕总部: ['🦩', '#ff9fb8'],
  外星人: ['👽', '#9dff9d'],
  前任: ['💔', '#ff9aa9'],
  平行宇宙的你: ['🌀', '#b59cff'],
  顾客: ['🙋', '#ffd9a0'],
  奶茶店老板娘: ['🧋', '#e8c39e'],
  幸运抽奖: ['🎁', '#ffe27a'],
});
// 20 种来电（emer = 紧急，必须停车接）

var ERR = null;
function errPOI(to) {
  if (to === 'home') return homeP();
  const pp = player.position;
  const c = curPOI
    .filter((p) => (to === 'shop' ? p.shop : p.shop && p.park.distanceTo(pp) > 60))
    .sort((a, b) => a.park.distanceTo(pp) - b.park.distanceTo(pp));
  if (!c.length) return null;
  return to === 'station'
    ? c[Math.min(c.length - 1, 3 + Math.floor(Math.random() * 4))]
    : c[Math.min(c.length - 1, Math.floor(Math.random() * 3))];
}
function startErr(j) {
  if (!freeMode()) {
    toast('（自由跑单模式下才会有跑腿任务）', 1600);
    return;
  }
  const p = errPOI(j.to);
  if (!p) return;
  ERR = {
    p,
    label:
      j.to === 'station'
        ? `${j.label}（${p.name}旁）`
        : j.to === 'shop'
          ? `${j.label}（${p.name}）`
          : j.label,
    lim: j.lim,
    t0: performance.now(),
    reward: j.reward,
    done: j.done,
  };
  toast(`📍 新任务：${ERR.label} · 限时 ${Math.round((j.lim / 60) * 10) / 10} 分钟`, 2600);
  updTarget();
}
function errTick() {
  if (!ERR) return;
  const left = ERR.lim - (performance.now() - ERR.t0) / 1000;
  const q = padOn ? pel.getWorldPosition(new THREE.Vector3()) : player.position;
  if (
    Math.hypot(q.x - ERR.p.park.x, q.z - ERR.p.park.z) < 11 ||
    (INT.on && ERR.p === homeP() && false)
  ) {
    coins += ERR.reward;
    saveCoins();
    SFX.win && SFX.win();
    toast(`${ERR.done} 🪙${ERR.reward}`, 2800);
    ERR = null;
    beacon.visible = false;
    updTarget();
    return;
  }
  if (left <= 0) {
    toast(`⌛ 没赶上：${ERR.label}`, 2400);
    ERR = null;
    beacon.visible = false;
    updTarget();
  }
}
var CALL = null;
function ringStart(emer) {
  if (CALL || state === 'menu') return;
  const pool = CALLDB.filter(
    (c) => !!c.emer === !!emer && !(c.job && !freeMode()) && !(c.job && ERR)
  );
  const src = pick(pool.length ? pool : CALLDB.filter((c) => !c.job));
  CALL = {
    st: 'ring',
    dir: 'in',
    emer: !!emer,
    n: src.n,
    src,
    L: normL(src.l, src.n),
    t0: performance.now(),
    ringMax: emer ? 22 : 12,
    li: 0,
    lt: 0,
  };
  SFX.ring && SFX.ring();
  toast(emer ? '🚨 紧急来电！必须停车接听' : '📞 有来电', 1500);
  islLast = null;
  if (phoneOpen) drawCall();
}
function callOut(n) {
  if (CALL) return;
  CALL = {
    st: 'dial',
    dir: 'out',
    emer: false,
    n,
    src: { n, l: CALLS[n] },
    L: normL(CALLS[n], n),
    t0: performance.now(),
    li: 0,
    lt: 0,
  };
  drawCall();
}
function canAnswer() {
  return !CALL.emer || padOn || Math.abs(v) < 0.4;
}
function answer() {
  if (!CALL || CALL.st !== 'ring') return;
  if (!canAnswer()) {
    toast('🚨 紧急电话必须停车接听！先刹车停稳', 1800);
    SFX.tick(0.1);
    return;
  }
  if (!padOn && Math.abs(v) > 1 && !CALL.emer)
    ticket(drive === 'bike' ? '骑车时接打手持电话' : '驾驶时接打手持电话', 200, 3, 20);
  else if (!padOn) toast('🅿️ 停车接电话，安全第一 👍', 1600);
  CALL.st = 'talk';
  CALL.t0 = performance.now();
  CALL.lt = 0;
  SFX.tick(0.3);
  islLast = null;
  if (phoneOpen) drawCall();
}
function normL(a, n) {
  return (a || []).map((x) => (Array.isArray(x) ? x : [x, n]));
}
function callFx(e, c) {
  if (!e) return;
  const T = [];
  if (e.j) startErr(e.j);
  if (e.c) {
    coins = Math.max(0, coins + e.c);
  }
  if (e.st) {
    stamina = Math.min(100, stamina + e.st);
  }
  if (e.give) {
    if (SAVE.momDay !== CAL.day) {
      SAVE.momDay = CAL.day;
      coins += e.give;
      T.push(`💰 ${c.n}转账 🪙${e.give}`);
    } else T.push(`💬 ${c.n}：今天已经给过你零花钱啦`);
  }
  if (e.rate && JOB && Array.isArray(JOB.r)) {
    JOB.r.push(5);
  }
  if (e.rnd) {
    const r = pick(e.rnd);
    coins = Math.max(0, coins + r[0]);
    T.push(r[1]);
  }
  if (e.m) T.unshift(e.m);
  if (e.s) setTimeout(() => sms(e.s[0], e.s[1]), 2500);
  saveCoins();
  if (T.length) toast(T.join(' · '), 2800);
  if (e.c > 0 || e.give || e.rnd) SFX.win && SFX.win();
}
function chooseCall(i) {
  const c = CALL;
  if (!c || !c.wait || !c.src.ch) return;
  const o = c.src.ch[i];
  if (!o) return;
  c.pick = o;
  c.wait = false;
  c.L = c.L.concat([[o.t, '我']], normL(o.r, c.n));
  c.lt = (performance.now() - c.t0) / 1000 - 1.8;
  SFX.tick(0.3);
  chHide();
  if (phoneOpen) drawCall();
  islLast = null;
}
const chE = document.createElement('div');
chE.id = 'callCh';
document.body.appendChild(chE);
chE.addEventListener(
  'pointerdown',
  (e) => {
    const b = e.target.closest('[data-ch]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    chooseCall(+b.dataset.ch);
  },
  true
);
function chShow() {
  const c = CALL;
  if (!c || !c.wait) return chHide();
  if (phoneOpen) {
    chE.style.display = 'none';
    return;
  }
  if (chE.dataset.k !== c.n + c.li) {
    chE.dataset.k = c.n + c.li;
    chE.innerHTML =
      `<div class="chT">📞 ${c.n}：「${(c.L[c.L.length - 1] || [''])[0]}」<br><small>你要怎么回答？</small></div>` +
      c.src.ch.map((o, i) => `<button data-ch="${i}"><b>${'ABC'[i]}</b>${o.t}</button>`).join('');
  }
  chE.style.display = 'flex';
}
function chHide() {
  chE.style.display = 'none';
  chE.dataset.k = '';
}
function hang(missed) {
  if (!CALL) return;
  const c = CALL;
  CALL = null;
  islLast = null;
  chHide();
  if (c.dir === 'in') {
    if (c.pick) callFx(c.pick.e, c);
    else if (c.st === 'ring' || (c.st === 'talk' && c.emer)) {
      if (c.emer) {
        const ms = c.src.miss || ['🚨 漏接紧急电话', 0];
        toast(ms[0], 2600);
        coins = Math.max(0, coins + ms[1]);
        saveCoins();
        sms(c.n, '刚才打你电话怎么没接？急事！');
      } else sms(c.n, missed ? '[未接来电] 有空回个电话' : '刚才怎么挂了？');
    } else if (c.st === 'talk') sms(c.n, '话没说完你怎么挂了？');
  } else if (c.n === '妈妈' && c.li >= c.L.length && SAVE.momDay !== CAL.day) {
    SAVE.momDay = CAL.day;
    coins += 50;
    saveCoins();
    toast('💰 妈妈转账 🪙50', 2000);
    sms('妈妈', '转了 50，别饿着');
  }
  if (phoneOpen) {
    if (phForCall && !padOn) closePhone();
    else {
      phForCall = false;
      phHome();
    }
  }
}
const mmss = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function drawCall() {
  if (!CALL || !phoneOpen) return;
  phApp = 'callscr';
  const c = CALL;
  const el = (performance.now() - c.t0) / 1000;
  let sub, btn;
  if (c.st === 'ring') {
    sub = c.emer ? '<b class="emer">🚨 紧急来电 · 必须停车接听</b>' : '来电 · 手机';
    const ok = canAnswer();
    btn = `<div class="cBtns"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>拒绝</span></div><div><button class="cb im green${ok ? ' pulse' : ' dis'}" data-c="ok">${PHI()}</button><span>${ok ? '接听' : '请先停车'}</span></div></div>`;
  } else if (c.st === 'dial') {
    sub = '正在呼叫…';
    btn = `<div class="cBtns one"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>挂断</span></div></div>`;
  } else if (c.wait) {
    sub = `通话中 ${mmss(el)} · 请选择回答`;
    btn = `<div class="cCh">${c.src.ch.map((o, i) => `<button data-ch="${i}"><b>${'ABC'[i]}</b>${o.t}</button>`).join('')}</div><div class="cBtns one"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>挂断</span></div></div>`;
  } else {
    sub = `通话中 ${mmss(el)}`;
    btn = `<div class="cOps"><div><i>🔇</i><span>静音</span></div><div><i>⌨️</i><span>键盘</span></div><div><i>🔊</i><span>免提</span></div></div><div class="cBtns one"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>挂断</span></div></div>`;
  }
  const tr =
    c.st === 'talk'
      ? `<div class="cTr">${c.L.slice(0, c.li)
          .map(
            (x, i) =>
              `<p class="${x[1] === '我' ? 'me' : ''}${i === c.li - 1 && c.lastDrawn !== c.li ? ' nw' : ''}">${x[0].replace(/^[^：]+：/, '')}</p>`
          )
          .join('')}</div>`
      : '<div class="cTr"></div>';
  $('phV').innerHTML =
    `<div class="callS${c.emer ? ' e' : ''}"><div class="cTop">${avH(c.n, c.st === 'talk' ? 46 : 70)}<h3>${c.n}</h3><div class="cSub">${sub}</div></div>${tr}${btn}</div>`;
  $('phV')
    .querySelectorAll('[data-c]')
    .forEach(
      (b) =>
        (b.onpointerdown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (b.dataset.c === 'ok') answer();
          else hang(false);
        })
    );
  $('phV')
    .querySelectorAll('[data-ch]')
    .forEach(
      (b) =>
        (b.onpointerdown = (e) => {
          e.preventDefault();
          e.stopPropagation();
          chooseCall(+b.dataset.ch);
        })
    );
  const t = $('phV').querySelector('.cTr');
  if (t) t.scrollTop = 1e4;
  c.lastDrawn = c.li;
}
let callSig = '';
setInterval(() => {
  phClkUpd();
  errTick();
  if (!CALL) return;
  const c = CALL;
  const el = (performance.now() - c.t0) / 1000;
  if (c.st === 'ring') {
    if (el > c.ringMax) {
      hang(true);
      return;
    }
    if (Math.floor(el * 10) % 14 === 0) SFX.ring && SFX.ring();
  }
  if (c.st === 'dial' && el > 2.2) {
    c.st = 'talk';
    c.t0 = performance.now();
    c.lt = 0;
  }
  if (c.st === 'talk') {
    if (c.wait) {
      if (el - c.lt > 16) chooseCall(Math.floor(Math.random() * 3));
    } else if (el - c.lt > (c.li ? 2.6 : 0.6) && c.li < c.L.length) {
      const x = c.L[c.li];
      c.li++;
      c.lt = el;
      if (!phoneOpen)
        say(x[1] === '我' ? `我：${x[0]}` : `${c.n}：${x[0].replace(/^[^：]+：/, '')}`, 2400);
    } else if (c.li >= c.L.length && el - c.lt > (c.src.ch && !c.pick ? 1.2 : 2.6)) {
      if (c.dir === 'in' && c.src.ch && !c.pick) {
        c.wait = true;
        c.lt = el;
      } else {
        hang(false);
        return;
      }
    }
  }
  chShow();
  const sig = c.st + c.li + (c.wait ? 'w' : '') + (c.st === 'ring' ? canAnswer() : '');
  if (sig !== callSig) {
    callSig = sig;
    if (phoneOpen) drawCall();
  } else if (phoneOpen && c.st === 'talk') {
    const s_ = $('phV').querySelector('.cSub');
    if (s_) s_.textContent = '通话中 ' + mmss(el);
  }
  islLast = null;
}, 250);
function openApp(a) {
  phApp = a;
  SFX.tick(0.3);
  if (a === 'call') {
    $('phV').innerHTML =
      phHead('通讯录') +
      Object.keys(CALLS)
        .map(
          (n) =>
            `<div class="ct">${avH(n, 34)}<span>${n}</span><button class="cg2 im" data-n="${n}">${PHI()}</button></div>`
        )
        .join('');
    bindBack();
    $('phV')
      .querySelectorAll('.ct')
      .forEach(
        (e) =>
          (e.onpointerdown = (ev) => {
            ev.preventDefault();
            callOut(e.querySelector('.cg2').dataset.n);
          })
      );
  } else if (a === 'sms') {
    const un = SMS.map((m) => m[3]);
    SMSn = 0;
    SMS.forEach((m) => (m[3] = 0));
    $('phV').innerHTML =
      phHead('短信') +
      SMS.map(
        (m, i) =>
          `<div class="phSm">${avH(m[0], 32)}<div class="bub"><b>${m[0]}：</b>${m[1]}<small>${m[2]}</small>${un[i] ? '<i class="dot2"></i>' : ''}</div></div>`
      ).join('');
    bindBack();
  } else if (a === 'music') drawMusic();
  else if (a === 'game') {
    startGame();
    bindBack();
  } else if (a === 'deliv') {
    const it = [];
    if (offer)
      it.push([
        `<b>🔔 新订单</b>${offer.shop.name} → ${offer.home.name} · 🪙${offer.price}<br><b style="color:#7CFC9A">点这里抢单</b>`,
        () => {
          $('ofOk').dispatchEvent(new PointerEvent('pointerdown'));
          openApp('deliv');
        },
      ]);
    orders.forEach((o) => {
      const fee = cancelFee(o);
      it.push([
        `<b>${o.phase === 'pick' ? '🛍️ 待取餐' : '📦 配送中'}</b>${o.shop.name} → ${o.home.name}<br>⏱ 剩 ${Math.max(0, Math.ceil(o.lim - o.t))}s · 🪙${o.price}<br><span style="color:${fee ? '#ff8a7a' : '#9fe8b0'}">点击取消订单${fee ? ` · 罚 🪙${fee}` : ' · 免费'}</span>`,
        () => {
          playerCancel(o);
          openApp('deliv');
        },
      ]);
    });
    if (!it.length) it.push(['暂时没有订单，等系统派单……', null]);
    it.push([
      `📊 今日收入 🪙${JOB.earn || 0} · 评分 ${(JOB.rating || 5).toFixed ? JOB.rating.toFixed(2) : JOB.rating}`,
      null,
    ]);
    phList('外卖平台', it);
  } else if (a === 'boss') {
    closePhone();
    const st = state;
    openJobs('ride');
    resumeState = st;
    state = 'paused';
  } else if (a === 'cal') {
    const h = Math.floor(CAL.min / 60);
    let g = '';
    const d0 = (CAL.day - 1) % 7;
    for (let i = 0; i < 14; i++) {
      const dd = CAL.day - d0 + i;
      g += `<div class="cd${dd === CAL.day ? ' on' : ''}">${dd > 0 ? dd : ''}</div>`;
    }
    $('phV').innerHTML =
      phHead(`第${CAL.day}天 · ${calStr()}`) +
      `<div class="cg">${WK.map((w) => `<div class="cw">${w.slice(1)}</div>`).join('')}${g}</div><div class="note">游戏 1 分钟 = 现实 0.5 秒<br>22:00 后不回家就只能睡大街<br>${h >= 20 ? '🌙 现在该回家了' : '☀️ 好好跑单'}<em>⏰</em></div>`;
    bindBack();
  } else if (a === 'nav') {
    NAVHOME = true;
    updTarget();
    toast('🗺️ 已开始导航回家', 1600);
    closePhone();
  } else if (a === 'wallet')
    phList('钱包', [
      [`<b>余额</b><span style="font-size:22px;font-weight:800">🪙 ${coins}</span>`, null],
      [`<b>驾照</b>${LIC.ok ? LIC.pts + '/12 分' : '无/已吊销'}`, null],
    ]);
}
let musIdx = -1,
  musLast = 0;
const SONGN = ['骑行摇滚', '深夜 lo-fi', '鹈鹕之歌'];
function drawMusic() {
  phApp = 'music';
  const on = musIdx >= 0;
  const cur = on ? musIdx : musLast;
  $('phV').innerHTML =
    phHead('音乐播放器') +
    `<div class="vin${on ? ' spin' : ''}"><div class="arm${on ? ' play' : ''}"></div><div class="disc"><i></i></div></div><div class="songs">${SONGN.map((s, i) => `<p class="${i === cur ? 'on' : ''}" data-s="${i}">${s}</p>`).join('')}</div><div class="mVol"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round(((master ? master.gain.value : 0.6) / 0.6) * 100)}" id="mVolR"><span>🔊</span></div><div class="mCtl"><button data-m="p">◀◀</button><button class="pp" data-m="t">${on ? '❚❚' : '▶'}</button><button data-m="n">▶▶</button></div>`;
  bindBack();
  $('phV')
    .querySelectorAll('[data-s]')
    .forEach(
      (e) =>
        (e.onpointerdown = (ev) => {
          ev.preventDefault();
          playMusic(+e.dataset.s);
          drawMusic();
        })
    );
  $('phV')
    .querySelectorAll('[data-m]')
    .forEach(
      (e) =>
        (e.onpointerdown = (ev) => {
          ev.preventDefault();
          const m = e.dataset.m;
          if (m === 't') playMusic(on ? -1 : cur);
          else playMusic((cur + (m === 'n' ? 1 : 2)) % 3);
          drawMusic();
        })
    );
  const r = $('mVolR');
  r.oninput = () => {
    if (master) master.gain.value = (0.6 * r.value) / 100;
  };
}
// island long-press → phone (only on foot), tap → call / cancel
(function () {
  let lpT = null,
    lpDone = false;
  cmpE.style.pointerEvents = 'auto';
  cmpE.addEventListener(
    'pointerdown',
    (e) => {
      if (e.target.closest('#offer')) return;
      const ic = e.target.closest('[data-ic]');
      if (ic) {
        e.preventDefault();
        e.stopPropagation();
        if (ic.dataset.ic === 'ok') answer();
        else if (ic.dataset.ic === 'no') hang(false);
        else openPhone(true);
        return;
      }
      e.preventDefault();
      lpDone = false;
      cmpE.classList.add('press');
      lpT = setTimeout(() => {
        lpDone = true;
        cmpE.classList.remove('press');
        if (navigator.vibrate) navigator.vibrate(20);
        if (padOn || INT.on) openPhone();
        else toast('🚲 下车后才能用手机（长按灵动岛打开）', 1800);
      }, 480);
    },
    true
  );
  const up = (e) => {
    if (lpT) {
      clearTimeout(lpT);
      lpT = null;
    }
    cmpE.classList.remove('press');
    if (lpDone || e.type !== 'pointerup') return;
    if (CALL) {
      openPhone(true);
      return;
    }
    if (orders.length && e.target.closest('#isl2')) cancelMenu();
  };
  cmpE.addEventListener('pointerup', up);
  cmpE.addEventListener('pointerleave', up);
  cmpE.addEventListener('pointercancel', up);
})();
function islCallHtml() {
  const c = CALL;
  if (!c) return '';
  if (c.st === 'ring')
    return `<div class="iCall${c.emer ? ' e' : ''}" data-ic="open">${avH(c.n, 26)}<span class="iN">${c.n}<small>${c.emer ? '🚨 紧急来电' : '来电'}</small></span><button class="ib red im" data-ic="no">${PHI('r')}</button><button class="ib im green${canAnswer() ? '' : ' dis'}" data-ic="ok">${PHI()}</button></div>`;
  return `<div class="iCall" data-ic="open">${avH(c.n, 22)}<span class="iN">${c.n}<small>${c.st === 'dial' ? '呼叫中…' : '通话中 ' + mmss((performance.now() - c.t0) / 1000)}</small></span><span class="wave"><i></i><i></i><i></i><i></i></span><button class="ib red im" data-ic="no">${PHI('r')}</button></div>`;
}
// music (simple synth loops)
let musT = null;
const SONGS = [
  [
    [0, 4, 7, 12],
    [5, 9, 12, 17],
    [7, 11, 14, 19],
    [5, 9, 12, 17],
  ],
  [
    [0, 3, 7, 10],
    [-2, 2, 5, 9],
    [-4, 0, 3, 7],
    [-5, -1, 2, 5],
  ],
  [
    [0, 7, 12, 7],
    [4, 7, 11, 7],
    [5, 9, 12, 9],
    [7, 11, 14, 11],
  ],
];
function playMusic(i) {
  if (musT) {
    clearInterval(musT);
    musT = null;
  }
  if (musIdx >= 0) musLast = musIdx;
  musIdx = i < 0 ? -1 : i;
  if (i >= 0) musLast = i;
  if (i < 0 || !AC) return;
  let n = 0;
  const S = SONGS[i];
  musT = setInterval(
    () => {
      if (!AC || muted) return;
      const ch = S[Math.floor(n / 8) % 4],
        f = 262 * Math.pow(2, ch[n % 4] / 12) * (i === 1 ? 0.5 : 1);
      const t = AC.currentTime;
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = i === 1 ? 'triangle' : 'square';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.3);
      n++;
    },
    i === 1 ? 300 : 180
  );
  toast('🎵 正在播放', 1200);
}
// mini game: catch fish
let gm = null;
function startGame() {
  const V_ = $('phV');
  V_.innerHTML =
    '<div class="phT">🎮 鹈鹕接鱼 · <span id="gS">0</span> 分 · <span id="gT">30</span>s</div><canvas id="gC" width="220" height="300"></canvas>';
  const c = $('gC'),
    x = c.getContext('2d');
  gm = { x, c, px: 110, fish: [], sc: 0, t: 30, raf: 0, last: performance.now() };
  const mv = (e) => {
    const r = c.getBoundingClientRect();
    gm.px = ((e.clientX - r.left) / r.width) * 220;
  };
  c.onpointerdown = mv;
  c.onpointermove = mv;
  const step = (now) => {
    if (!gm) return;
    const dt = Math.min(0.05, (now - gm.last) / 1000);
    gm.last = now;
    gm.t -= dt;
    if (Math.random() < dt * 2.2)
      gm.fish.push({ x: rnd(10, 210), y: -10, v: rnd(90, 170), bad: Math.random() < 0.2 });
    x.fillStyle = '#0e2a47';
    x.fillRect(0, 0, 220, 300);
    x.font = '22px sans-serif';
    for (const f of gm.fish) {
      f.y += f.v * dt;
      x.fillText(f.bad ? '💣' : '🐟', f.x - 11, f.y);
      if (f.y > 262 && f.y < 290 && Math.abs(f.x - gm.px) < 26 && !f.hit) {
        f.hit = 1;
        f.y = 999;
        gm.sc += f.bad ? -3 : 1;
        SFX.tick(0.3);
      }
    }
    gm.fish = gm.fish.filter((f) => f.y < 320);
    x.font = '30px sans-serif';
    x.fillText('🦩', gm.px - 15, 290);
    $('gS').textContent = gm.sc;
    $('gT').textContent = Math.ceil(gm.t);
    if (gm.t <= 0) {
      const r = Math.max(0, Math.min(30, gm.sc));
      coins += r;
      saveCoins();
      toast(`🎮 得分 ${gm.sc}，奖励 🪙${r}`, 2200);
      stopGame();
      if (phoneOpen)
        setTimeout(() => {
          if (phApp === 'game') phHome();
        }, 300);
      return;
    }
    gm.raf = requestAnimationFrame(step);
  };
  gm.raf = requestAnimationFrame(step);
}
function stopGame() {
  if (gm) {
    cancelAnimationFrame(gm.raf);
    gm = null;
  }
}
// ---------- side quests (blue !) ----------
