'use strict';
// ── js/systems/quests.js ──
// 支线：24 种蓝色 ! 任务、聊天 NPC、小偷追击与解谜、杂项调度
var SQ = null;
const SQG = [];
let sqCool = 0;
const bangTex = canvasTex(128, 160, (x, w, h) => {
  x.lineJoin = 'round';
  x.font = '900 150px Arial Black, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.lineWidth = 16;
  x.strokeStyle = '#fff';
  x.strokeText('!', w / 2, h / 2 + 6);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#6fc3ff');
  g.addColorStop(1, '#1366e8');
  x.fillStyle = g;
  x.fillText('!', w / 2, h / 2 + 6);
});
function meP() {
  return state === 'foot' ? pel.position : player.position;
}
function mkBang() {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: bangTex, depthTest: true, transparent: true })
  );
  s.scale.set(0.75, 0.95, 1);
  return s;
}
function nearPOIs(min, max, shop) {
  const q = meP();
  return curPOI.filter(
    (p) => (shop == null || !!p.shop === shop) && ((d) => d > min && d < max)(p.park.distanceTo(q))
  );
}
function sqDoneSet() {
  return SAVE.sqdone_egg || (SAVE.sqdone_egg = []);
}
function sqSpawn(g) {
  const used = SQG.map((x) => x.type && x.type.k).concat(SQ ? [SQ.type.k] : []);
  const done = sqDoneSet();
  let types = QTYPES.filter((t) => !used.includes(t.k));
  const fresh = types.filter((t) => !done.includes(t.k));
  if (fresh.length && Math.random() < 0.75) types = fresh;
  const c = nearPOIs(40, 160).filter((p) => !SQG.some((x) => x.poi === p));
  if (!c.length) return false;
  const p = pick(c);
  const type = pick(types);
  if (!g.ped) {
    g.ped = makePed(false);
    g.bang = mkBang();
    g.ped.g.add(g.bang);
    g.bang.position.set(0, 2.45, 0);
  } else scene.add(g.ped.g);
  const pos = p.door.clone().addScaledVector(p.n, 1.6);
  pos.y = 0;
  g.ped.g.position.copy(pos);
  g.ped.g.rotation.y = Math.atan2(p.n.z, -p.n.x) + PI;
  g.ped.g.scale.setScalar(type.kid ? 0.7 : type.old ? 0.9 : 1);
  g.ped.g.visible = true;
  g.bang.visible = true;
  g.type = type;
  g.poi = p;
  g.pos = pos;
  return true;
}
for (let i = 0; i < 3; i++) SQG.push({ ped: null });
function sqDone(win, msg) {
  const q = SQ;
  if (!q) return;
  SQ = null;
  (q.objs || []).forEach((o) => {
    scene.remove(o);
  });
  if (q.runner) q.runner.g.visible = false;
  if (q.chk) q.chk.visible = false;
  if (win) {
    const d = sqDoneSet();
    const first = !d.includes(q.type.k);
    if (first) d.push(q.type.k);
    coins += q.type.r;
    saveCoins();
    SFX.win();
    toast(
      `${msg || '✅ 支线完成'} · 🪙${q.type.r}${first ? ` · 📜 支线图鉴 ${d.length}/${QTYPES.length}` : ''}`,
      3200
    );
    sms(q.type.n, pick(['谢谢你！你真是个好鹈鹕 👍', '太感谢了！下次请你吃饭', '好人一生平安 🙏']));
  } else {
    SFX.lose && SFX.lose();
    toast(msg || '❌ 支线失败', 2600);
  }
  if (q.g) {
    q.g.type = null;
    q.g.ped.g.visible = false;
  }
  sqCool = 12;
  beacon.visible = false;
  updTarget();
}
function sqTgt(p, label) {
  if (!SQ) return;
  if (p && SQ.tgt && SQ.tlabel === label) {
    SQ.tgt.copy(p);
    if (!curOrder() && !ERR) beacon.position.copy(p);
    return;
  }
  SQ.tgt = p ? p.clone() : null;
  SQ.tlabel = label || '';
  updTarget();
}
function sqAct(pp, range) {
  if (!freeMode()) return null;
  range = range || 2.6;
  if (SQ && SQ.act) {
    const a = SQ.act;
    if (Math.hypot(a.pos.x - pp.x, a.pos.z - pp.z) < range) return a;
  }
  if (SQ && SQ.ret && SQ.g && Math.hypot(SQ.g.pos.x - pp.x, SQ.g.pos.z - pp.z) < range)
    return {
      label: `把好消息告诉${SQ.type.n}`,
      short: '交任务',
      fn: () => sqDone(true, `✅ ${SQ.type.n}：太谢谢你了！`),
    };
  if (!SQ)
    for (const g of SQG) {
      if (g.type && Math.hypot(g.pos.x - pp.x, g.pos.z - pp.z) < range)
        return { label: `❗ 和${g.type.n}说话`, short: '对话', fn: () => sqTalk(g) };
    }
  return null;
}
function sqTalk(g) {
  const t = g.type;
  const done = sqDoneSet().includes(t.k);
  mdlOpen(
    `${t.e} ${t.n}`,
    `<div style="font-size:15px">「${t.say}」</div><small style="opacity:.7">奖励 🪙${t.r}${done ? ' · 已完成过' : ' · 🆕 新支线'}</small>`,
    [
      {
        t: '👍 交给我',
        p: 1,
        f: () => {
          mdlClose();
          sqStart(g);
        },
      },
      { t: '下次吧', f: () => mdlClose() },
    ]
  );
}
function inter() {
  const q = meP();
  return V(Math.round(q.x / B) * B, 0, Math.round(q.z / B) * B);
}
function mkAnimal(col, dog) {
  const c = new THREE.Group();
  const o = M(col, { roughness: 0.8 }),
    w = M(0xffffff);
  const b = mesh(new THREE.SphereGeometry(0.28, 14, 10), o, c);
  b.scale.set(dog ? 1.7 : 1.5, 0.9, 0.9);
  b.position.y = 0.32;
  const h = mesh(new THREE.SphereGeometry(dog ? 0.22 : 0.2, 14, 10), o, c);
  h.position.set(0.44, 0.54, 0);
  for (const s of [-1, 1]) {
    const e = mesh(
      dog ? new THREE.ConeGeometry(0.08, 0.2, 4) : new THREE.ConeGeometry(0.07, 0.15, 4),
      o,
      c
    );
    e.position.set(0.42, 0.74, s * 0.1);
    mesh(new THREE.SphereGeometry(0.035, 6, 5), M(0x111111), c).position.set(0.6, 0.58, s * 0.08);
    if (dog)
      for (const f of [-1, 1]) {
        mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 6), o, c).position.set(
          f * 0.25,
          0.1,
          s * 0.12
        );
      }
  }
  const t = mesh(new THREE.CylinderGeometry(0.04, 0.03, dog ? 0.22 : 0.5, 6), o, c);
  t.position.set(-0.48, 0.55, 0);
  t.rotation.z = 0.8;
  mesh(new THREE.SphereGeometry(0.12, 8, 6), w, c).position.set(0.58, 0.47, 0);
  if (dog) mesh(new THREE.SphereGeometry(0.045, 6, 5), M(0x111111), c).position.set(0.66, 0.52, 0);
  scene.add(c);
  return c;
}
function mkObj(k) {
  const g = new THREE.Group();
  if (k === 'wallet') {
    mesh(new THREE.BoxGeometry(0.35, 0.08, 0.25), M(0x6b3a1f, { roughness: 0.6 }), g).position.y =
      0.05;
    mesh(
      new THREE.BoxGeometry(0.1, 0.085, 0.1),
      M(0xd4a531, { metalness: 0.7, roughness: 0.3 }),
      g
    ).position.set(0.15, 0.05, 0);
  } else if (k === 'fish') {
    const m = M(0xd9a35a, { roughness: 0.6, emissive: 0x553300, emissiveIntensity: 0.5 });
    const b = mesh(new THREE.SphereGeometry(0.3, 10, 8), m, g);
    b.scale.set(1.4, 0.6, 0.35);
    const t = mesh(new THREE.ConeGeometry(0.2, 0.3, 4), m, g);
    t.rotation.z = PI / 2;
    t.position.x = -0.5;
  } else if (k === 'balloon') {
    const c = pick([0xff4d6d, 0x4dabf7, 0xffd43b, 0x69db7c, 0xb197fc]);
    const b = mesh(
      new THREE.SphereGeometry(0.35, 16, 12),
      M(c, { roughness: 0.25, emissive: c, emissiveIntensity: 0.25 }),
      g
    );
    b.scale.y = 1.2;
    b.position.y = 0.6;
    mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), M(0xffffff), g).position.y = -0.1;
  } else if (k === 'flyer') {
    const p = mesh(
      new THREE.BoxGeometry(0.42, 0.01, 0.3),
      M(0xfff3bf, { emissive: 0x332200, emissiveIntensity: 0.4 }),
      g
    );
    p.rotation.x = 0.3;
    mesh(new THREE.BoxGeometry(0.3, 0.012, 0.06), M(0xe03131), g).position.set(0, 0.01, -0.05);
  } else if (k === 'chicken') {
    const w = M(0xffffff, { roughness: 0.8 });
    const b = mesh(new THREE.SphereGeometry(0.22, 12, 10), w, g);
    b.position.y = 0.32;
    b.scale.set(1.2, 1, 0.9);
    const h = mesh(new THREE.SphereGeometry(0.12, 10, 8), w, g);
    h.position.set(0.2, 0.55, 0);
    mesh(new THREE.ConeGeometry(0.04, 0.1, 4), M(0xffa500), g).position.set(0.33, 0.54, 0)
      .constructor;
    const cm = mesh(new THREE.BoxGeometry(0.1, 0.08, 0.03), M(0xe03131), g);
    cm.position.set(0.2, 0.69, 0);
    for (const s of [-1, 1])
      mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), M(0xffa500), g).position.set(
        0,
        0.1,
        s * 0.07
      );
  }
  scene.add(g);
  return g;
}
function mkChest() {
  const c = new THREE.Group();
  mesh(new THREE.BoxGeometry(1, 0.6, 0.7), M(0x8b5a2b, { roughness: 0.7 }), c).position.y = 0.3;
  const l = mesh(
    new THREE.BoxGeometry(1.02, 0.25, 0.72),
    M(0xc9962b, { metalness: 0.6, roughness: 0.3 }),
    c
  );
  l.position.y = 0.72;
  mesh(
    new THREE.BoxGeometry(0.16, 0.2, 0.05),
    M(0xffd700, { metalness: 0.8, roughness: 0.2, emissive: 0x664400 }),
    c
  ).position.set(0, 0.5, 0.37);
  scene.add(c);
  return c;
}
let sqR = null,
  sqK = null;
function sqStart(g) {
  const t = g.type;
  g.bang.visible = false;
  SQ = { type: t, g, t0: performance.now(), objs: [], step: 0 };
  const q = meP();
  if (t.m === 'find') {
    const p = pick(nearPOIs(30, 90)) || g.poi;
    const o =
      t.obj === 'wallet'
        ? mkObj('wallet')
        : mkAnimal(t.obj === 'dog' ? 0xd98b3a : 0xf0a040, t.obj === 'dog');
    const pos = p.door.clone().addScaledVector(p.n, 1.2);
    pos.y = 0;
    o.position.copy(pos);
    SQ.objs.push(o);
    SQ.cat = o;
    SQ.lim = 150;
    SQ.flee = !t.still && Math.random() < 0.6;
    SQ.act = {
      pos,
      label: `${t.still ? '捡起' : '抓住'}${t.on}`,
      short: t.still ? '捡起' : '抓住',
      fn: () => {
        if (SQ.flee) {
          SQ.flee = false;
          toast(`💨 ${t.on}一溜烟跑了……再追！`, 1800);
          const p2 = pick(nearPOIs(10, 40)) || p;
          const np = p2.door.clone().addScaledVector(p2.n, 1.2);
          np.y = 0;
          SQ.catTo = np;
          SQ.act.pos = np;
        } else {
          scene.remove(o);
          SQ.act = null;
          SQ.ret = true;
          sqTgt(g.pos, `${t.e} 送回给${t.n}`);
          toast(`✅ 找到${t.on}了！快送回去`, 1800);
        }
      },
    };
    toast(`🔎 ${t.on}就在附近，留意灵动岛上的冷热提示`, 2400);
  } else if (t.m === 'chase') {
    let r;
    if (t.chicken) {
      sqK = sqK || mkObj('chicken');
      sqK.visible = true;
      r = { g: sqK, legs: [], arms: [] };
      SQ.chk = sqK;
    } else {
      r = sqR || (sqR = makePed(false));
      r.g.visible = true;
      r.g.scale.setScalar(t.kidR ? 0.7 : 1);
    }
    SQ.runner = r;
    const s = inter();
    r.g.position.copy(s);
    SQ.node = s.clone();
    SQ.next = null;
    SQ.lim = t.lim;
    toast(`🏃 ${t.rn}往路口跑了！追上去（靠近就能抓住）`, 2200);
  } else if (t.m === 'visit') {
    if (t.src === 'inter') {
      const s = inter();
      const pts = [];
      let c = s.clone();
      for (let i = 0; i < t.cnt; i++) {
        const d = pick([
          [B, 0],
          [-B, 0],
          [0, B],
          [0, -B],
        ]);
        c = V(c.x + d[0], 0, c.z + d[1]);
        pts.push({ park: c.clone(), name: `路口 ${i + 1}` });
      }
      SQ.spots = pts;
    } else {
      SQ.spots = nearPOIs(40, 240, t.src === 'shop')
        .sort(() => Math.random() - 0.5)
        .slice(0, t.cnt);
      if (SQ.spots.length < t.cnt) SQ.spots = nearPOIs(20, 320).slice(0, t.cnt);
    }
    SQ.lim = t.lim;
    sqTgt(SQ.spots[0].park, `${t.verb} 1/${t.cnt} · ${SQ.spots[0].name}`);
    toast(`${t.verb}：限时 ${t.lim} 秒`, 2000);
  } else if (t.m === 'race') {
    if (state === 'foot') {
      toast(`${t.e} ${t.n}：先骑上车再来比！`, 1800);
      g.bang.visible = true;
      SQ = null;
      return;
    }
    const s = inter();
    const dx = pick([-2, -1, 1, 2]) * B,
      dz = pick([-2, -1, 1, 2]) * B;
    SQ.goal = V(s.x + dx, 0, s.z + dz);
    SQ.path = [s.clone(), V(s.x + dx, 0, s.z), SQ.goal.clone()];
    SQ.rv = t.rv;
    SQ.rd = -Math.hypot(q.x - s.x, q.z - s.z);
    SQ.tot = Math.abs(dx) + Math.abs(dz);
    const r = (SQ.runner = sqR || (sqR = makePed(false)));
    r.g.visible = true;
    r.g.scale.setScalar(1);
    r.g.position.copy(s);
    SQ.lim = 150;
    sqTgt(SQ.goal, '🏁 终点');
    toast('🏁 3、2、1……开始！', 1800);
  } else if (t.m === 'collect') {
    SQ.fish = [];
    const ps = nearPOIs(8, 90)
      .sort(() => Math.random() - 0.5)
      .slice(0, t.cnt);
    ps.forEach((p) => {
      const f = mkObj(t.obj);
      const by = t.obj === 'balloon' ? 2.2 : t.obj === 'flyer' ? 0.4 : 1.2;
      f.userData.by = by;
      f.position.set(p.park.x, by, p.park.z);
      SQ.objs.push(f);
      SQ.fish.push(f);
    });
    SQ.lim = t.lim;
    SQ.got = 0;
    SQ.need = SQ.fish.length;
    toast(`🧺 捡齐 ${SQ.need} 个（骑车或走路靠近就能捡）`, 2400);
  } else if (t.m === 'quiz') {
    const qs = t.qs
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    let i = 0,
      ok = 0;
    const ask = () => {
      const qq = qs[i];
      const opts = qq[1].map((x, k) => ({ x, k })).sort(() => Math.random() - 0.5);
      mdlOpen(
        `${t.e} 第 ${i + 1}/3 题`,
        qq[0],
        opts.map((o) => ({
          t: o.x,
          f: () => {
            if (o.k === 0) {
              ok++;
              toast('✅ 对！', 700);
            } else toast(`❌ 不对，答案是「${qq[1][0]}」`, 1200);
            i++;
            if (i < 3) ask();
            else {
              mdlClose();
              ok >= 2
                ? sqDone(true, `${t.e} ${t.n}：答对 ${ok} 题，厉害！`)
                : sqDone(false, `${t.e} ${t.n}：才对 ${ok} 题，回去再学学！`);
            }
          },
        })),
        true
      );
    };
    ask();
    return;
  } else if (t.m === 'escort') {
    if (state !== 'foot') {
      toast(`${t.e} ${t.n}：你下车陪我走好不好？`, 2000);
      g.bang.visible = true;
      SQ = null;
      return;
    }
    const p = pick(nearPOIs(25, 60, false).filter((p) => p !== g.poi)) || pick(nearPOIs(20, 80));
    SQ.dst = p;
    SQ.lim = 150;
    SQ.gp = g.pos.clone();
    sqTgt(p.park, `${t.e} 送到 ${p.name}`);
    toast(`${t.e} 走得慢，别离太远（6 米内）`, 2400);
  } else if (t.m === 'treasure') {
    const shops = nearPOIs(30, 250, true);
    const a = pick(shops),
      b = pick(shops.filter((x) => x !== a)) || a;
    SQ.clues = [a, b];
    SQ.lim = 240;
    SQ.hint = `去一家名字里带「${a.name.replace(/[^\u4e00-\u9fa5]/g, '')[0]}」的店，找到门口`;
    toast(`🧙 第一条线索：${SQ.hint}`, 3200);
  }
  islLast = null;
}
function sqUpdate(dt, t) {
  if (!freeMode() || INT.on || state === 'paused' || state === 'menu') {
    return;
  }
  sqCool -= dt;
  for (const g of SQG) {
    if (g.type) {
      const d = g.pos.distanceTo(meP());
      if (d > 260 && !(SQ && SQ.g === g)) {
        g.type = null;
        g.ped.g.visible = false;
      } else {
        g.bang.position.y = 2.45 + Math.sin(t * 3) * 0.12;
        g.bang.material.rotation = Math.sin(t * 2) * 0.12;
      }
    } else if (sqCool <= 0 && (!SQ || SQ.g !== g)) {
      sqSpawn(g);
      sqCool = 3;
    }
  }
  if (!SQ) return;
  const q = SQ,
    me = meP(),
    T = q.type;
  const el = (performance.now() - q.t0) / 1000;
  if (q.lim && el > q.lim && !q.ret) {
    sqDone(false, `⌛ 时间到：${T.n}的任务失败了`);
    return;
  }
  const m = T.m;
  if (m === 'find' && q.cat) {
    if (q.catTo) {
      const d = V(q.catTo.x - q.cat.position.x, 0, q.catTo.z - q.cat.position.z);
      const L = d.length();
      if (L < 0.2) q.catTo = null;
      else {
        d.normalize();
        q.cat.position.addScaledVector(d, Math.min(L, dt * 7));
        q.cat.rotation.y = Math.atan2(-d.z, d.x);
      }
    }
    if (!T.still) q.cat.position.y = Math.abs(Math.sin(t * 6)) * 0.05;
  }
  if (m === 'chase' && !q.ret) {
    const r = q.runner;
    if (!q.next) {
      const opts = [
        [B, 0],
        [-B, 0],
        [0, B],
        [0, -B],
      ].map((o) => V(q.node.x + o[0], 0, q.node.z + o[1]));
      opts.sort((a, b) => b.distanceTo(me) - a.distanceTo(me));
      q.next = Math.random() < 0.7 ? opts[0] : opts[1];
    }
    const d = q.next.clone().sub(r.g.position);
    d.y = 0;
    const L = d.length();
    if (L < 0.5) {
      q.node = q.next;
      q.next = null;
    } else {
      d.normalize();
      const sp = me.distanceTo(r.g.position) < 25 ? T.sp : T.sp * 0.66;
      r.g.position.addScaledVector(d, dt * sp);
      r.g.rotation.y = Math.atan2(-d.z, d.x);
      if (T.chicken) r.g.position.y = Math.abs(Math.sin(t * 16)) * 0.15;
      r.legs.forEach((l, i) => (l.rotation.z = Math.sin(t * 14 + i * PI) * 0.8));
      r.arms.forEach((a, i) => (a.rotation.z = -Math.sin(t * 14 + i * PI) * 0.7));
    }
    if (me.distanceTo(r.g.position) < 2.8) {
      r.g.visible = false;
      q.ret = true;
      sqTgt(q.g.pos, `${T.e} 回去找${T.n}`);
      SFX.win();
      toast(`🦸 抓住${T.rn}了！${T.got}，快回去`, 2400);
    } else sqTgt(r.g.position, `🏃 ${T.rn}`);
  }
  if (m === 'visit' && !q.ret) {
    const s = q.spots[q.step];
    if (me.distanceTo(s.park) < 12) {
      q.step++;
      if (T.flash) flashShot();
      else SFX.tick(0.5);
      toast(`${T.verb} ${s.name}（${q.step}/${T.cnt}）`, 1600);
      if (q.step >= T.cnt) {
        if (T.cnt === 1) {
          sqDone(true, `${T.e} ${T.n}：收到啦，谢谢你！`);
          return;
        }
        q.ret = true;
        sqTgt(q.g.pos, `${T.e} 回去找${T.n}`);
      } else
        sqTgt(q.spots[q.step].park, `${T.verb} ${q.step + 1}/${T.cnt} · ${q.spots[q.step].name}`);
    }
  }
  if (m === 'race' && !q.ret) {
    q.rd += q.rv * dt;
    const r = q.runner;
    let dd = Math.max(0, q.rd);
    const p = q.path;
    const seg1 = p[0].distanceTo(p[1]);
    let pos;
    if (dd < seg1) pos = p[0].clone().lerp(p[1], dd / seg1);
    else
      pos = p[1].clone().lerp(p[2], Math.min(1, (dd - seg1) / Math.max(1, p[1].distanceTo(p[2]))));
    const dir = pos.clone().sub(r.g.position);
    if (dir.lengthSq() > 1e-4) r.g.rotation.y = Math.atan2(-dir.z, dir.x);
    r.g.position.copy(pos);
    r.legs.forEach((l, i) => (l.rotation.z = Math.sin(t * 12 + i * PI) * 0.5));
    if (me.distanceTo(q.goal) < 10) {
      sqDone(true, `🏁 你赢了！${T.n}：服了服了`);
      return;
    }
    if (dd >= q.tot) {
      sqDone(false, `${T.e} ${T.n}先到了：「下次再练练吧！」`);
      return;
    }
  }
  if (m === 'collect') {
    q.fish.forEach((f) => {
      if (!f.visible) return;
      f.rotation.y += dt * (T.obj === 'flyer' ? 1 : 3);
      f.position.y = f.userData.by + Math.sin(t * 3 + f.position.x) * 0.2;
      if (Math.hypot(f.position.x - me.x, f.position.z - me.z) < 3) {
        f.visible = false;
        q.got++;
        SFX.tick(0.4);
        toast(`🧺 ${q.got}/${q.need}`, 700);
      }
    });
    if (q.got >= q.need && !q.ret) {
      q.ret = true;
      if (T.full) stamina = 100;
      sqTgt(q.g.pos, `${T.e} 回去找${T.n}`);
    } else if (!q.ret) {
      const f = q.fish
        .filter((f) => f.visible)
        .sort((a, b) => a.position.distanceTo(me) - b.position.distanceTo(me))[0];
      if (f && (!q.tgt || q.tgt.distanceTo(V(f.position.x, 0, f.position.z)) > 1))
        sqTgt(V(f.position.x, 0, f.position.z), '🧺 目标');
    }
  }
  if (m === 'escort') {
    const gp = q.g.ped.g;
    const d = me.distanceTo(gp.position);
    if (state === 'foot' && d > 1.6 && d < 6.5) {
      const dir = V(me.x - gp.position.x, 0, me.z - gp.position.z).normalize();
      gp.position.addScaledVector(dir, dt * T.sp);
      gp.rotation.y = Math.atan2(-dir.z, dir.x);
      q.g.ped.legs.forEach((l, i) => (l.rotation.z = Math.sin(t * 6 + i * PI) * 0.35));
      q.g.pos.copy(gp.position);
    }
    if (d >= 6.5 && !q.warn) {
      q.warn = 1;
      toast(`${T.e} ${T.n}：慢点……等等我`, 1600);
    }
    if (d < 6) q.warn = 0;
    if (gp.position.distanceTo(q.dst.park) < 10 || gp.position.distanceTo(q.dst.door) < 5) {
      sqDone(true, `${T.e} ${T.n}：谢谢你，好孩子！`);
      return;
    }
  }
  if (m === 'treasure' && !q.ret) {
    if (q.step < 2) {
      const c = q.clues[q.step];
      if (me.distanceTo(c.park) < 12) {
        q.step++;
        if (q.step === 1) {
          SQ.hint = `第二条线索：宝箱在「${q.clues[1].name}」附近`;
          toast(`🧙 ${SQ.hint}`, 3000);
          sqTgt(q.clues[1].park, '🗝️ 线索 2');
        } else {
          const ch = mkChest();
          const p = q.clues[1];
          const cp = p.door.clone().addScaledVector(p.n, 2);
          cp.y = 0;
          ch.position.copy(cp);
          q.objs.push(ch);
          q.act = {
            pos: cp,
            label: '打开宝箱',
            short: '开箱',
            fn: () => {
              sqDone(true, '💰 宝箱打开了！金光闪闪');
            },
          };
          toast('🎁 宝箱就在店门口！下车去打开', 2400);
        }
      }
    }
  }
}
function flashShot() {
  const f = document.createElement('div');
  f.style.cssText =
    'position:fixed;inset:0;background:#fff;z-index:50;pointer-events:none;transition:opacity .5s';
  document.body.appendChild(f);
  requestAnimationFrame(() => {
    f.style.opacity = '0';
  });
  setTimeout(() => f.remove(), 600);
  SFX.tick(0.6);
}
function sqHud() {
  const q = SQ,
    T = q.type;
  const el = (performance.now() - q.t0) / 1000;
  const l = q.lim ? Math.max(0, Math.ceil(q.lim - el)) : 0;
  const tm =
    q.lim && !q.ret
      ? ` · <b style="color:${l < 20 ? '#ff6b5a' : '#7CFC9A'}">${Math.floor(l / 60)}:${String(l % 60).padStart(2, '0')}</b>`
      : '';
  const me = meP();
  let s = '';
  const m = T.m;
  if (q.ret) s = `回去找${T.n}`;
  else if (m === 'find' && q.cat) {
    const d = Math.round(me.distanceTo(q.act ? q.act.pos : q.cat.position));
    s = `🔎 找${T.on} · ${d}m ${d < 15 ? '🔥🔥' : d < 35 ? '🔥' : d < 60 ? '🌡️' : '🧊'}`;
  } else if (m === 'chase' && q.runner)
    s = `🏃 追${T.rn} · ${Math.round(me.distanceTo(q.runner.g.position))}m`;
  else if (m === 'visit') s = `${T.verb} ${q.step}/${T.cnt}`;
  else if (m === 'race') {
    const mine = Math.max(0, 100 - (me.distanceTo(q.goal) / (q.tot + 1)) * 100),
      his = Math.min(100, Math.max(0, (q.rd / q.tot) * 100));
    s = `🏁 你 ${Math.round(mine)}% · 对手 ${Math.round(his)}%`;
  } else if (m === 'collect') s = `🧺 ${q.got}/${q.need}`;
  else if (m === 'escort')
    s = `${T.e} 护送 · 距离 ${Math.round(me.distanceTo(q.g.ped.g.position))}m`;
  else if (m === 'treasure') s = `🗺️ ${q.hint}`;
  return `<span style="color:#6fc3ff">❗</span> ${s}${tm}`;
}
// ---------- thief ----------
let thiefT = 20,
  thief = null;
const thiefPed = makePed(false);
thiefPed.g.visible = false;

const TALKS = [
  [
    '算命大爷',
    '🔮',
    () => {
      const r = Math.random();
      if (r < 0.4) {
        coins += 66;
        saveCoins();
        say('大爷：小伙子印堂发亮，今天必有横财！');
        toast('🔮 大爷说中了，捡到 🪙66', 2600);
      } else if (r < 0.7) say('大爷：你命里缺单，多接几单就好了。');
      else say('大爷：算一卦 20 块……开玩笑的，看你是鹈鹕，免费。');
    },
  ],
  ['南理工学长', '🎓', () => say('学长：悄悄告诉你，设置里输兑换码 NJUST 有惊喜。')],
  [
    '迷路的游客',
    '🧳',
    () =>
      choice('🧳 游客问路', '「请问夫子庙怎么走？」', [
        {
          t: '热心指路',
          p: 1,
          f: () => {
            coins += 30;
            saveCoins();
            toast('🙏 游客塞给你 🪙30 表示感谢', 2600);
          },
        },
        { t: '我也是路过的', f: () => say('游客：好吧……谢谢你') },
      ]),
  ],
  [
    '烤红薯阿姨',
    '🍠',
    () => {
      stamina = 100;
      exhausted = false;
      hp = Math.min(100, hp + 15);
      toast(
        snowT > 0 ? '🍠 雪天的烤红薯太香了！体力回满，血量 +15' : '🍠 阿姨送你一个烤红薯，体力回满',
        2800
      );
    },
  ],
  [
    '神秘人',
    '🕶️',
    () =>
      choice('🕶️ 神秘人', '「你觉得这个游戏的作者帅吗？」', [
        {
          t: '帅！宇宙第一帅',
          p: 1,
          f: () => {
            coins += 166;
            saveCoins();
            SFX.win();
            toast('✨ 神秘人满意地点点头，给你 🪙166', 2800);
          },
        },
        {
          t: '一般吧',
          f: () => {
            say('神秘人：……你会后悔的。');
            stamina = Math.max(0, stamina - 30);
          },
        },
      ]),
  ],
  [
    '退休交警',
    '👮',
    () =>
      say(
        pick([
          '老交警：右转可以不看红灯，但要让行人！',
          '老交警：开车一定要系安全带，罚 50 不值当。',
          '老交警：下雪天刹车距离翻倍，慢点开。',
        ])
      ),
  ],
  [
    '小朋友',
    '🧒',
    () => {
      hp = Math.min(100, hp + 10);
      toast('🍬 小朋友送你一颗糖：鹈鹕叔叔加油！血量 +10', 2800);
    },
  ],
  [
    '网红主播',
    '📱',
    () => {
      coins += 50;
      saveCoins();
      say('主播：家人们！真的有鹈鹕送外卖！点点关注！');
      toast('📱 上了直播，打赏 🪙50', 2600);
    },
  ],
  ['外卖同行', '🛵', () => say('同行：5 分钟内送 3 单，赏金就会加倍，还能一直叠加！')],
  [
    '环卫工人',
    '🧹',
    () => {
      JOB.r.push(5);
      if (JOB.r.length > 60) JOB.r.shift();
      toast('🧹 你帮环卫大叔扶起了垃圾桶，口碑 +1 个五星', 2800);
    },
  ],
  [
    '借钱的骗子',
    '🤥',
    () =>
      choice('🤥 陌生人', '「兄弟，借我 100 块打车，明天还你！」', [
        { t: '不借', p: 1, f: () => say('骗子：切，小气……（溜走了）') },
        {
          t: '借给他',
          f: () => {
            coins = Math.max(0, coins - 100);
            saveCoins();
            toast('💸 人跑了，100 块打水漂……', 2600);
          },
        },
      ]),
  ],
  [
    '彩票摊老板',
    '🎫',
    () =>
      choice('🎫 彩票摊', '刮刮乐 🪙20 一张，要不要来一张？', [
        {
          t: '来一张！',
          p: 1,
          f: () => {
            if (coins < 20) {
              toast('钱不够');
              return;
            }
            coins -= 20;
            const r = Math.random();
            if (r < 0.02) {
              coins += 5000;
              SFX.win();
              toast('🎉🎉 中了头奖 🪙5000！！！', 3600);
            } else if (r < 0.15) {
              coins += 100;
              toast('🎫 中了 🪙100', 2600);
            } else toast('🎫 谢谢惠顾', 2000);
            saveCoins();
          },
        },
        { t: '不了', f: () => {} },
      ]),
  ],
  [
    '鹈鹕粉丝',
    '🦩',
    () => {
      coins += 20;
      saveCoins();
      toast('✍️ 给粉丝签了个名，🪙+20', 2400);
    },
  ],
  [
    '健身教练',
    '💪',
    () => {
      stamina = 100;
      exhausted = false;
      boostT = 5;
      SFX.power();
      say('教练：来！冲刺五秒！燃起来！');
    },
  ],
  [
    '过马路的老奶奶',
    '👵',
    () =>
      choice('👵 老奶奶', '「小伙子，能扶我过马路吗？」', [
        {
          t: '当然！',
          p: 1,
          f: () => {
            coins += 40;
            saveCoins();
            toast('👵 奶奶夸你是好孩子，塞给你 🪙40', 2800);
          },
        },
        { t: '在送单，下次吧', f: () => say('奶奶：那你慢点骑啊') },
      ]),
  ],
  [
    '流浪歌手',
    '🎸',
    () => {
      toast('🎸 他为你唱了一首《鹈鹕外卖员之歌》，你感动得眼眶湿润', 3000);
      stamina = 100;
    },
  ],
];
const npcs = [];
for (let i = 0; i < 7; i++) {
  const p = makePed(false);
  p.g.visible = false;
  const tag = labelSprite('', 'rgba(0,0,0,.6)');
  tag.position.y = 2.35;
  p.g.add(tag);
  npcs.push({ p, tag, alive: false });
}
function npcSpawn(n) {
  const s = nearRoadSpot(40, 170);
  if (!s) {
    n.alive = false;
    return;
  }
  const k = Math.floor(Math.random() * TALKS.length);
  const T = TALKS[k];
  const off = s.alongX ? V(0, 0, s.side * (SW - RH + 1.35)) : V(-s.side * (SW - RH + 1.35), 0, 0);
  const x = s.x + off.x,
    z = s.z + off.z;
  Object.assign(n, { alive: true, x, z, k, done: false });
  n.p.g.position.set(x, 0.16, z);
  n.p.g.rotation.set(0, Math.atan2(-(s.z - z), s.x - x), 0);
  n.p.g.visible = true;
  n.tag.material.map.dispose();
  n.tag.material.map = labelSprite(`💬 ${T[1]} ${T[0]}`, 'rgba(40,110,230,.9)').material.map;
  n.tag.material.needsUpdate = true;
}
function updNpcs(dt, t) {
  const pp = player.position;
  if (!freeMode() || fieldOn) {
    npcs.forEach((n) => (n.p.g.visible = false));
    return null;
  }
  let best = null,
    bd = 1e9;
  for (const n of npcs) {
    if (!n.alive) {
      if (Math.random() < 0.01) npcSpawn(n);
      continue;
    }
    n.p.g.visible = true;
    const d = Math.hypot(n.x - pp.x, n.z - pp.z);
    if (d > 230) {
      npcSpawn(n);
      continue;
    }
    n.tag.visible = !n.done && d < 70;
    n.p.arms[1].rotation.z = n.done ? 0 : Math.sin(t * 4 + n.k) * 0.6 - 0.6;
    if (!n.done && d < bd) {
      bd = d;
      best = n;
    }
  }
  if (best && bd < 6.5 && state === 'ride' && v < 1.5) {
    const n = best,
      T = TALKS[n.k];
    return {
      key: 'npc' + n.x,
      label: `💬 和${T[0]}聊聊`,
      fn: () => {
        n.done = true;
        SFX.ding();
        T[2]();
      },
    };
  }
  return null;
}
// --- delivery streak multiplier ---
function v13Update(dt, t) {
  const a = updCrime(dt, t);
  const b = updNpcs(dt, t);
  updSnow(dt);
  updStreak();
  const c = b || a || nearDoor();
  if (c && !walk) setAct2(c.key, c.label, c.fn);
  else setAct2('', null, null);
}
function thiefUpdate(dt) {
  if (stolen || (drive !== 'bike' && false)) return;
  const pp = pel.position,
    bp = player.position;
  if (!player.visible && !thief) return;
  if (thief) {
    thief.t += dt;
    const g = thiefPed.g;
    if (thief.ph === 'run') {
      const d = V(bp.x - g.position.x, 0, bp.z - g.position.z);
      const L_ = d.length();
      if (L_ < 0.8) {
        thief.ph = 'go';
        thief.t = 0;
        say('🦹 小偷：这车不错，归我了！', 1800);
        SFX.horn();
      } else {
        d.normalize();
        g.position.addScaledVector(d, dt * 5.5);
        g.rotation.y = Math.atan2(-d.z, d.x) + PI / 2;
        pedWalk(g, thief.t);
      }
    } else if (thief.ph === 'go') {
      const f = V(Math.cos(heading), 0, -Math.sin(heading));
      player.position.addScaledVector(f, dt * Math.min(12, thief.t * 6));
      g.position.copy(player.position);
      if (thief.t > 2.5) {
        player.visible = false;
        g.visible = false;
        thief.ph = 'call';
        thief.t = 0;
        toast('🚲 你的车被小偷骑走了！', 2400);
      }
    } else if (thief.ph === 'call' && thief.t > 1.6) {
      thief.ph = 'deal';
      closePhone();
      thiefDeal();
    }
    return;
  }
  const dist = Math.hypot(pp.x - bp.x, pp.z - bp.z);
  if (!(phoneOpen && dist > 1.5) && dist < 10) return;
  thiefT -= dt;
  if (thiefT > 0) return;
  thiefT = rnd(15, 30);
  if (Math.random() > (phoneOpen ? 0.45 : 0.3)) return;
  const a = Math.random() * 6.28;
  thiefPed.g.position.set(bp.x + Math.cos(a) * 14, 0, bp.z + Math.sin(a) * 14);
  thiefPed.g.visible = true;
  thief = { ph: 'run', t: 0, price: Math.round(rnd(60, 150)), tries: 0 };
  toast('👀 有个可疑的人朝你的车走过去了！', 2200);
}
function pedWalk(g, t) {
  thiefPed.legs.forEach((l, i) => {
    l.rotation.z = Math.sin(t * 12 + i * PI) * 0.6;
  });
}
function thiefDeal() {
  const T = thief;
  SFX.ring && SFX.ring();
  mdlOpen(
    '📞 陌生号码来电',
    `🦹 小偷：「你的车在我手上。想要回去？<b>🪙${T.price}</b>，或者……陪我玩个游戏。」`,
    [
      {
        t: `💰 付 🪙${T.price} 赎车`,
        p: 1,
        f: () => {
          if (coins < T.price) {
            toast('金币不够，试试砍价或者解谜', 1800);
            return;
          }
          coins -= T.price;
          saveCoins();
          mdlClose();
          returnBike('🤝 交易完成，车停在你旁边了');
        },
      },
      {
        t: '🗣️ 砍价',
        f: () => {
          T.tries++;
          if (T.tries > 3) {
            toast('小偷：别砍了！再砍我就挂了', 1800);
            return;
          }
          if (Math.random() < 0.6) {
            T.price = Math.round(T.price * 0.7);
            toast(`小偷：行吧行吧，🪙${T.price}`, 1600);
          } else {
            T.price += 20;
            toast(`小偷：你再砍我就涨价！🪙${T.price}`, 1600);
          }
          thiefDeal();
        },
      },
      { t: '🧩 解谜赢回', f: () => puzzleMenu() },
      {
        t: '🚔 吓唬他要报警',
        f: () => {
          if (Math.random() < 0.3) {
            mdlClose();
            returnBike('🦹 小偷吓跑了，车扔在了路边');
          } else {
            T.price += 30;
            toast(`小偷：报啊！我不怕！涨价 🪙${T.price}`, 1800);
            thiefDeal();
          }
        },
      },
    ],
    true
  );
}
function returnBike(msg) {
  const pp = pel.position;
  player.visible = true;
  player.position.set(pp.x + 1, 0, pp.z + 1);
  thief = null;
  thiefPed.g.visible = false;
  SFX.win();
  toast(msg, 2400);
}
function puzzleMenu() {
  mdlOpen(
    '🧩 小偷的挑战',
    '「三选一，赢了车就还你。输了……涨价。」',
    [
      { t: '🔢 密码锁', p: 1, f: pzLock },
      { t: '🤔 脑筋急转弯', p: 1, f: pzRiddle },
      { t: '🧠 记忆密码', p: 1, f: pzSimon },
      { t: '↩️ 返回', f: thiefDeal },
    ],
    true
  );
}
function pzFail() {
  thief.price += 20;
  toast(`❌ 失败！小偷涨价到 🪙${thief.price}`, 2000);
  SFX.lose();
  setTimeout(thiefDeal, 600);
}
function pzWin() {
  mdlClose();
  returnBike('🎉 解谜成功！小偷愿赌服输，把车还你了');
}
function pzLock() {
  const t = 1 + Math.floor(Math.random() * 3),
    h = t * 2 + (Math.random() < 0.5 ? 0 : 1),
    u = t + 3;
  const ans = `${h}${t}${u}`;
  const hint = h === t * 2 ? '百位是十位的 2 倍' : '百位比十位的 2 倍多 1';
  let inp = '',
    tries = 3;
  const draw = () => {
    mdlOpen(
      '🔢 车锁密码',
      `三位数密码：<br>① ${hint}<br>② 个位比十位大 3<br>③ 三个数字之和是 ${h + t + u}<br><div class="pzIn">${(inp + '___').slice(0, 3)}</div><div class="kp">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((k) => `<button class="glass pill" data-k="${k}">${k}</button>`).join('')}</div><small>剩余 ${tries} 次</small>`,
      [],
      true
    );
    $('mdlC')
      .querySelectorAll('[data-k]')
      .forEach(
        (b) =>
          (b.onpointerdown = (e) => {
            e.preventDefault();
            const k = b.dataset.k;
            if (k === '⌫') inp = inp.slice(0, -1);
            else if (k === '✓') {
              if (inp === ans) {
                pzWin();
                return;
              }
              tries--;
              inp = '';
              if (tries <= 0) {
                pzFail();
                return;
              }
              toast('🔒 密码错误', 1000);
            } else if (inp.length < 3) inp += k;
            SFX.tick(0.2);
            draw();
          })
      );
  };
  draw();
}
const RIDDLES = [
  ['什么东西越洗越脏？', ['水', '衣服', '碗', '手'], 0],
  ['什么路最窄？', ['冤家路窄', '小路', '山路', '单行道'], 0],
  ['鹈鹕的嘴里能装什么？', ['好几条鱼', '一辆车', '一栋楼', '空气'], 0],
  ['什么车寸步难行？', ['风车', '自行车', '火车', '外卖车'], 0],
  ['一个人从飞机上跳下来没摔伤，为什么？', ['飞机停在地上', '他会飞', '有降落伞', '掉进水里'], 0],
  ['什么东西有头无脚？', ['砖头', '人', '鸟', '桌子'], 0],
  ['什么瓜不能吃？', ['傻瓜', '西瓜', '南瓜', '黄瓜'], 0],
  ['外卖员最怕什么天？', ['下雨天', '晴天', '周末', '生日'], 0],
];
function pzRiddle() {
  const qs = RIDDLES.slice()
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  let i = 0,
    ok = 0;
  const ask = () => {
    const q = qs[i];
    const opts = q[1].map((t, k) => ({ t, k })).sort(() => Math.random() - 0.5);
    mdlOpen(
      `🤔 第 ${i + 1}/3 题 · 答对 2 题就赢`,
      q[0],
      opts.map((o) => ({
        t: o.t,
        f: () => {
          if (o.k === q[2]) {
            ok++;
            toast('✅ 答对了', 800);
          } else toast('❌ 答错了', 800);
          i++;
          if (i < 3) ask();
          else ok >= 2 ? pzWin() : pzFail();
        },
      })),
      true
    );
  };
  ask();
}
function pzSimon() {
  const C = ['🔴', '🟢', '🔵', '🟡'];
  const seq = [...Array(5)].map(() => Math.floor(Math.random() * 4));
  let k = 0;
  mdlOpen('🧠 记住顺序', `<div class="pzIn" id="smS">准备……</div>`, [], true);
  let i = 0;
  const show = setInterval(() => {
    const e = $('smS');
    if (!e) {
      clearInterval(show);
      return;
    }
    if (i < seq.length) {
      e.textContent = C[seq[i]];
      SFX.tick(0.4);
      setTimeout(() => {
        if ($('smS')) $('smS').textContent = '·';
      }, 400);
      i++;
    } else {
      clearInterval(show);
      input();
    }
  }, 700);
  const input = () =>
    mdlOpen(
      '🧠 按顺序点出来',
      `<div class="pzIn">${'●'.repeat(k)}${'○'.repeat(5 - k)}</div>`,
      C.map((c, j) => ({
        t: c,
        f: () => {
          if (j === seq[k]) {
            k++;
            SFX.tick(0.3);
            if (k >= 5) pzWin();
            else input();
          } else pzFail();
        },
      })),
      true
    );
}
// ---------- reform (first time 12 points used up) ----------
function reformScene() {
  LIC.reform = 1;
  saveCoins();
  const st = state;
  mdlOpen(
    '👮 交警叔叔',
    `「你的 12 分扣光了。在这里签下：」<div class="sign">好好改造，重新做人</div><div style="opacity:.85;font-size:13px">（这对吗？）<br>啊不对不对，是 —— <b>重新开车</b>。</div><input id="rfIn" placeholder="在这里写下正确的四个字" maxlength="8" autocomplete="off">`,
    [
      {
        t: '✍️ 签字',
        p: 1,
        f: () => {
          const v = ($('rfIn').value || '').replace(/\s/g, '');
          if (v === '重新开车') {
            LIC.pts = 12;
            LIC.ok = true;
            saveCoins();
            mdlClose();
            say('交警：好，12 分还给你。下不为例！', 2600);
            SFX.win();
          } else if (v === '重新做人' || v === '好好改造') {
            toast('👮 交警：……我都说了不对了！', 1800);
          } else toast('👮 交警：字写错了，再写一遍', 1600);
        },
      },
      {
        t: '我不签',
        f: () => {
          mdlClose();
          revoke('12 分已经扣完，拒绝签字');
        },
      },
    ],
    true
  );
  setTimeout(() => {
    const e = $('rfIn');
    if (e) e.focus();
  }, 300);
}
// ---------- perf: adaptive pixel ratio ----------
let pfN = 0,
  pfT = 0,
  pfR = Math.min(window.devicePixelRatio || 1, 2);
renderer.setPixelRatio(Math.min(pfR, 1.75));
function perfUpd(dt) {
  pfN++;
  pfT += dt;
  if (pfT > 3) {
    const fps = pfN / pfT;
    pfN = 0;
    pfT = 0;
    const cur = renderer.getPixelRatio();
    if (fps < 48 && cur > 1) {
      renderer.setPixelRatio(Math.max(1, cur - 0.25));
    } else if (fps > 58 && cur < Math.min(pfR, 1.75)) {
      renderer.setPixelRatio(Math.min(Math.min(pfR, 1.75), cur + 0.25));
    }
  }
}

function cancelFee(o) {
  const left = o.lim - o.t;
  return left <= 30 ? Math.max(10, Math.round(o.price * 0.5)) : 0;
}
function playerCancel(o) {
  if (walk && walk.o === o) {
    toast('正在取餐/送餐中，出来后再取消', 1800);
    return;
  }
  const fee = cancelFee(o);
  const i = orders.indexOf(o);
  if (i < 0) return;
  orders.splice(i, 1);
  if (fee) {
    coins = Math.max(0, coins - fee);
    JOB.revs.unshift(`★★☆☆☆ 临近送达才取消，罚款 🪙${fee}`);
    JOB.revs.length = Math.min(JOB.revs.length, 8);
    rateJob(2);
    SFX.lose();
    toast(`❌ 已取消订单 · 临近送达取消，罚款 🪙${fee}`, 2600);
  } else {
    SFX.tick(0.4);
    toast('✅ 已取消订单，未扣费', 1800);
  }
  saveCoins();
  syncBag();
  updTarget();
}
function cancelMenu() {
  if (!orders.length) {
    toast('当前没有订单', 1200);
    return;
  }
  mdlOpen(
    '🧾 我的订单',
    '剩余时间超过 30 秒可免费取消；<b>30 秒内或已超时</b>取消，罚订单价的一半（至少 🪙10）',
    orders
      .map((o) => {
        const left = Math.ceil(o.lim - o.t),
          fee = cancelFee(o);
        return {
          t: `${o.phase === 'pick' ? '🛍️' : '📦'} ${o.shop.name}→${o.home.name} · ${left > 0 ? left + 's' : '超时'} · ${fee ? `取消罚 🪙${fee}` : '免费取消'}`,
          f: () => {
            mdlClose();
            playerCancel(o);
          },
        };
      })
      .concat([{ t: '返回', p: 1, f: mdlClose }])
  );
}
function v15Update(dt, t) {
  calUpdate(dt);
  try {
    sqUpdate(dt, t);
  } catch (e) {
    console.error(e);
  }
  islUpdate();
  homeSignUpd();
  perfUpd(dt);
  if (state === 'foot') footUpdate(dt, t);
  if (INT.on || state === 'foot') $('act2').style.display = 'none';
}
