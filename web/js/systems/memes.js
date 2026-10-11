'use strict';
// ── js/systems/memes.js ──
// v0.1.10：2026 年 7–10 月抖音热梗彩蛋（改编）
//  不烧心（10 月 · AI 短剧工地盒饭）  噜噜操/特别通透（10 月）  闪身步（9 月）
//  超长长长长长时代（9 月 · 超长蛋挞）  大水时代（2L 大瓶水）  全抖音都在找 luke（9 月）
//  牛来（8 月 · AI 二创）  Chinamaxxing（8 月 · 外国人喝热水泡脚）  显化（10 月）
//  评论区「根本就没有这样的 XX」「你只是怕了」

// ---------- 路边热梗 NPC（同一时间最多 1 个）----------
const MEME_NPC = [
  {
    k: 'bsx',
    tag: '🍱 工地盒饭 · 贵但不烧心',
    col: 'rgba(214,120,30,.92)',
    hat: 0xffc400,
    act: '🍱 给工友送一份盒饭（🪙18）',
    fn: () => {
      coins += 18;
      saveCoins();
      SFX.ding();
      say('工友：贵是贵了点，但下午干活不烧心！');
      setTimeout(() => toast('👷 「先把规矩立住，路才能越走越宽。」', 2600), 2400);
      unlock('bsx');
    },
  },
  {
    k: 'tongtou',
    tag: '💃 噜噜操 · 每天十分钟特别通透',
    col: 'rgba(160,70,220,.92)',
    dance: 1,
    act: '💃 跟着博主跳一套噜噜操',
    fn: () => {
      stamina = 100;
      exhausted = false;
      hp = Math.min(100, hp + 15);
      SFX.power();
      say('博主：跳完了吗？是不是特别通透！');
      toast('✨ 体力回满、生命 +15：整只鹈鹕特别通透', 2600);
      unlock('tongtou');
    },
  },
  {
    k: 'china',
    tag: '🧳 Chinamaxxing · 想体验中国生活',
    col: 'rgba(30,140,200,.92)',
    hair: 0xf2d16b,
    act: '♨️ 带外国游客喝热水泡脚（🪙+30）',
    fn: () => {
      coins += 30;
      saveCoins();
      SFX.ding();
      say('游客：Hot water + 泡脚 = the best！I want to become Chinese！');
      unlock('china');
    },
  },
];
let memeNpc = null,
  memeT = rnd(35, 70),
  memeLast = '';
function memeSidewalk(s) {
  const o = RH + 1.6;
  return s.alongX
    ? { x: s.x, z: s.c + s.side * o, h: s.h }
    : { x: s.c - s.side * o, z: s.z, h: s.h };
}
function spawnMemeNpc() {
  const s = nearRoadSpot(70, 160);
  if (!s) return;
  const pool = MEME_NPC.filter((m) => m.k !== memeLast);
  const def = pool.find((m) => !ACH[m.k]) || pick(pool);
  memeLast = def.k;
  const p = makePed(false);
  if (def.hat) {
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 10, 8, 0, PI * 2, 0, PI / 2),
      M(def.hat)
    );
    h.position.set(0, 1.93, 0);
    p.g.add(h);
  }
  if (def.hair) {
    const h = new THREE.Mesh(
      new THREE.SphereGeometry(0.19, 10, 8),
      M(def.hair, { roughness: 0.9 })
    );
    h.position.set(-0.03, 1.9, 0);
    h.scale.set(1, 0.7, 1);
    p.g.add(h);
  }
  const w = memeSidewalk(s);
  p.g.position.set(w.x, 0.16, w.z);
  p.g.rotation.y = w.h + PI / 2;
  const tag = labelSprite(def.tag, def.col);
  tag.position.y = 2.5;
  p.g.add(tag);
  memeNpc = { def, p, x: w.x, z: w.z, t: 0, done: false, tag };
}
function dropMemeNpc() {
  if (!memeNpc) return;
  scene.remove(memeNpc.p.g);
  memeNpc = null;
}

// ---------- luke：藏在城西北某个路口，只有走近才看得到 ----------
const LUKE = { x: -4 * B + 12, z: -5 * B + 12 };
const lukeP = makePed(false);
lukeP.g.position.set(LUKE.x, 0.16, LUKE.z);
const lukeTag = labelSprite('🔍 luke（全抖音都在找我）', 'rgba(20,20,20,.9)');
lukeTag.position.y = 2.5;
lukeP.g.add(lukeTag);

// ---------- 牛来了：路上偶尔出现一头慢悠悠的牛 ----------
const cow = new THREE.Group();
(function () {
  const w = M(0xf4f1ea, { roughness: 0.85 }),
    bk = M(0x222222, { roughness: 0.85 }),
    pk = M(0xe7a1a1, { roughness: 0.7 });
  mesh(new THREE.BoxGeometry(1.9, 0.95, 0.85), w, cow).position.set(0, 1.15, 0);
  mesh(new THREE.BoxGeometry(0.6, 0.5, 0.86), bk, cow).position.set(-0.3, 1.25, 0);
  mesh(new THREE.BoxGeometry(0.55, 0.5, 0.5), w, cow).position.set(1.15, 1.45, 0);
  mesh(new THREE.BoxGeometry(0.22, 0.25, 0.42), pk, cow).position.set(1.45, 1.32, 0);
  for (const s of [-1, 1]) {
    const hn = mesh(new THREE.ConeGeometry(0.05, 0.28, 6), M(0xe8dcc0), cow);
    hn.position.set(1.1, 1.78, s * 0.18);
    hn.rotation.x = s * 0.5;
  }
  cow.legs = [];
  for (const [x, z] of [
    [0.7, 0.3],
    [0.7, -0.3],
    [-0.7, 0.3],
    [-0.7, -0.3],
  ]) {
    const l = new THREE.Group();
    l.position.set(x, 0.75, z);
    mesh(new THREE.BoxGeometry(0.18, 0.75, 0.18), w, l).position.y = -0.37;
    cow.add(l);
    cow.legs.push(l);
  }
  const tg = labelSprite('🐂 牛来了！', 'rgba(120,80,40,.92)');
  tg.position.y = 2.6;
  cow.add(tg);
})();
cow.visible = false;
scene.add(cow);
let cowS = null,
  cowT = rnd(90, 160);

// ---------- 显化：夜里停车许愿 ----------
let wishStill = 0,
  wishCool = 0;

// ---------- 超长蛋挞订单 ----------
const _newOffer0 = newOffer;
newOffer = function () {
  _newOffer0();
  if (offer && !offer.egg && Math.random() < 0.07) {
    offer.food = '超长长长长长蛋挞（1.2 米）';
    offer.price += 30;
    offer.extra.push('超长，小心别颠断');
    renderOffer();
  }
};
const _delivered0 = delivered;
delivered = function (o) {
  const long = o && o.food && o.food.startsWith('超长');
  _delivered0(o);
  if (long) {
    unlock('dachang');
    say('顾客：现在是超长长长长长时代，蛋挞也得卷长度！');
  }
};

// ---------- 评论区热梗：聊天 NPC ----------
TALKS.push([
  '刷短视频的大学生',
  '📱',
  () => {
    const L = [
      ['大学生：根本就没有会骑车送外卖的鹈鹕。', '鹈鹕：你只是怕了。'],
      ['大学生：全抖音都在找 luke，听说他在城西北的路口送外卖？', null],
      ['大学生：今天是今天，明天是明天，每天都得重新算——今天先点个外卖。', null],
      ['大学生：我现在纯过日子，奶茶戒了，只喝大水。', null],
      ['大学生：我刚刷到一个牛来了的视频，结果楼下真来了头牛……', null],
    ];
    const [a, b] = pick(L);
    say(a);
    if (b) setTimeout(() => say(b), 2300);
  },
]);

// ---------- 每帧 ----------
function memesUpdate(dt, t) {
  if (!freeMode() || fieldOn || INT.on) {
    if (memeNpc) memeNpc.p.g.visible = false;
    cow.visible = false;
    return;
  }
  const pp = state === 'foot' ? pel.position : player.position;
  // 路边热梗 NPC
  if (!memeNpc) {
    memeT -= dt;
    if (memeT <= 0) {
      memeT = rnd(60, 120);
      spawnMemeNpc();
    }
  } else {
    const m = memeNpc;
    m.p.g.visible = true;
    m.t += dt;
    const d = Math.hypot(m.x - pp.x, m.z - pp.z);
    m.tag.visible = !m.done && d < 80;
    if (m.def.dance && !m.done) {
      const s = Math.sin(t * 6);
      m.p.arms.forEach((a, i) => (a.rotation.x = (i ? 1 : -1) * (1.2 + s * 0.6)));
      m.p.g.position.y = 0.16 + Math.abs(Math.sin(t * 6)) * 0.08;
    } else m.p.arms[1].rotation.z = m.done ? 0 : Math.sin(t * 4) * 0.6 - 0.6;
    if (d > 230 || m.t > 150) dropMemeNpc();
  }
  // luke
  const ld = Math.hypot(LUKE.x - pp.x, LUKE.z - pp.z);
  if (ld < 260 && !lukeP.g.parent) scene.add(lukeP.g);
  else if (ld >= 260 && lukeP.g.parent) scene.remove(lukeP.g);
  lukeTag.visible = ld < 40;
  if (ld < 6 && !ACH.luke) {
    unlock('luke');
    say('luke：嘘……别告诉别人，我只是在这送外卖。');
    toast('🔍 全抖音都在找的 luke，被你找到了！', 3000);
  }
  // 闪身步：横穿马路的路人被你逼近时，有概率一个闪身步躲开
  if (state === 'ride' && v > 4) {
    const fx = Math.cos(heading),
      fz = -Math.sin(heading);
    for (const p of peds) {
      if (!p.alive || p.st !== 'cross' || p.dodgeT > 0 || p.noDodge) continue;
      const dx = p.g.position.x - player.position.x,
        dz = p.g.position.z - player.position.z;
      const ahead = dx * fx + dz * fz,
        lat = Math.abs(dx * fz - dz * fx);
      if (ahead > 1 && ahead < 6.5 && lat < 1.6) {
        if (Math.random() < 0.45) {
          p.dodgeT = 0.6;
          p.dodgeDir = dx * fz - dz * fx > 0 ? 1 : -1;
          p.dodgeOff = 0;
          toast('🕺 路人一个「闪身步」躲开了你！', 1800);
          achCount('shanshen');
        } else p.noDodge = 1;
      }
    }
  }
  for (const p of peds) {
    if (p.dodgeT > 0) {
      p.dodgeT -= dt;
      p.dodgeOff = Math.min(1.8, (p.dodgeOff || 0) + dt * 6);
      const fx = Math.cos(heading),
        fz = -Math.sin(heading);
      p.g.position.x += fz * p.dodgeDir * p.dodgeOff;
      p.g.position.z += -fx * p.dodgeDir * p.dodgeOff;
      p.g.rotation.y += p.dodgeDir * 0.5;
    } else if (p.noDodge && p.st !== 'cross') p.noDodge = 0;
  }
  // 牛来了
  if (!cowS) {
    cowT -= dt;
    if (cowT <= 0 && state === 'ride') {
      cowT = rnd(150, 260);
      const s = nearRoadSpot(60, 120);
      if (s) {
        cowS = { x: s.x, z: s.z, h: s.h, t: 0, seen: false };
        cow.visible = true;
      }
    }
  } else {
    cowS.t += dt;
    cowS.x += Math.cos(cowS.h) * 0.6 * dt;
    cowS.z -= Math.sin(cowS.h) * 0.6 * dt;
    cow.position.set(cowS.x, 0, cowS.z);
    cow.rotation.y = cowS.h;
    cow.legs.forEach((l, i) => (l.rotation.z = Math.sin(t * 4 + (i % 2) * PI) * 0.35));
    const cd = Math.hypot(cowS.x - pp.x, cowS.z - pp.z);
    if (cd < 25 && !cowS.seen) {
      cowS.seen = true;
      SFX.horn();
      say('路人：牛来了！牛来了！');
      unlock('niulai');
    }
    if (cd < 2.4 && state === 'ride' && v > 2) {
      v *= 0.3;
      SFX.bump();
      toast('🐂 牛：哞～（你被牛顶了一下）', 1800);
    }
    if (cowS.t > 45 || cd > 240) {
      cowS = null;
      cow.visible = false;
    }
  }
  // 显化（夜里停车 6 秒、身上没单，会出现许愿按钮）
  wishCool -= dt;
  if (state === 'ride' && v < 0.2 && LIGHTS[lightMode].night && !orders.length) wishStill += dt;
  else wishStill = 0;
}
function memeAct() {
  if (state !== 'ride' || v > 1.5) return null;
  const pp = player.position;
  if (memeNpc && !memeNpc.done && Math.hypot(memeNpc.x - pp.x, memeNpc.z - pp.z) < 7) {
    const m = memeNpc;
    return {
      key: 'meme' + m.def.k + m.x,
      label: m.def.act,
      fn: () => {
        m.done = true;
        m.def.fn();
      },
    };
  }
  // 加油站便利店：大水时代
  const n = nearestGas(pp.x, pp.z);
  if (n && n.d < 11 && !(fuelKey() && getFuel() < 99))
    return {
      key: 'dashui',
      label: '🥤 便利店买一瓶 2L 大水（🪙2）',
      fn: () => {
        if (coins < 2) return toast('🪙 两块钱都没有……', 1800);
        coins -= 2;
        saveCoins();
        stamina = 100;
        exhausted = false;
        hp = Math.min(100, hp + 10);
        SFX.ding();
        say('店员：大水时代，奶茶是社交，大水才是真爱。');
        unlock('dashui');
      },
    };
  if (wishStill > 6 && wishCool <= 0)
    return {
      key: 'wish',
      label: '🙏 对着夜空「显化」：今天要爆单',
      fn: () => {
        wishCool = 120;
        wishStill = 0;
        if (Math.random() < 0.6) {
          coins += 66;
          saveCoins();
          SFX.win();
          say('一位路过的顾客：你看着就像要爆单的样子，打赏 66！');
          unlock('xianhua');
        } else say('夜空很安静。也许要先假装成功，直到真的成功。');
      },
    };
  return null;
}
