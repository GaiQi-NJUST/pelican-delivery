'use strict';
// ── js/ui/skin.js ──
// UI 皮肤补丁：emoji 清洗/手绘图标、倒车灯/挡杆、驾照页/骑手页/求职网
/* const ICONSVG 由 build.py 生成（见 build/gen-assets.js），此处不再声明 */
// ===== UI skin: strip emoji, coin icon =====
const EMO =
  /(?:(?![©®™])\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u20E3|[\u{1F3FB}-\u{1F3FF}])*(?:\u200D\p{Extended_Pictographic}\uFE0F?)*\s?/gu;
const EMO1 = /(?:(?![©®™])\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
function cleanText(n) {
  let t = n.nodeValue;
  if (!EMO1.test(t)) return;
  t = t.replace(/🪪\s?/gu, '驾照 ').replace(/⭐/gu, '★');
  if (
    t.includes('🪙') &&
    n.parentNode &&
    !(n.parentNode.closest && n.parentNode.closest('canvas,svg'))
  ) {
    const parts = t.split(/🪙\s?/u);
    const f = document.createDocumentFragment();
    parts.forEach((p, i) => {
      if (i) {
        const c = document.createElement('i');
        c.className = 'ico i-coin';
        f.appendChild(c);
      }
      f.appendChild(document.createTextNode(p.replace(EMO, '')));
    });
    n.parentNode.replaceChild(f, n);
    return;
  }
  n.nodeValue = t.replace(EMO, '');
}
function cleanTree(root) {
  if (root.nodeType === 3) {
    cleanText(root);
    return;
  }
  if (root.nodeType !== 1 || root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const a = [];
  while (w.nextNode()) a.push(w.currentNode);
  a.forEach(cleanText);
  if (root.querySelectorAll)
    root
      .querySelectorAll('[placeholder]')
      .forEach((e) => (e.placeholder = e.placeholder.replace(EMO, '')));
}
cleanTree(document.body);
new MutationObserver((ms) => {
  for (const m of ms) {
    if (m.type === 'characterData') cleanText(m.target);
    else m.addedNodes.forEach(cleanTree);
  }
}).observe(document.body, { subtree: true, childList: true, characterData: true });
// shop & achievement icons
const SHOPICO = { vehicle: 'bike', eyes: 'glasses', neck: 'scarf' };
const HATICO = { helmet: 'helmet', straw: 'straw', crown: 'crown' };
const _rs = renderShop;
renderShop = function () {
  _rs();
  $('shGrid')
    .querySelectorAll('.item')
    .forEach((d, i) => {
      const it = SHOP.filter((s) => s.cat === shopTab)[i];
      if (!it) return;
      const ic = d.querySelector('.ic');
      if (!ic) return;
      const k = it.car
        ? 'car'
        : it.moto
          ? 'moto'
          : it.kind === 'hat'
            ? HATICO[it.id] || 'helmet'
            : SHOPICO[it.kind] || 'box';
      ic.innerHTML = `<svg viewBox="0 0 24 24" class="svgi" style="color:${it.col != null ? '#' + it.col.toString(16).padStart(6, '0') : '#ffffff'}">${ICONSVG[k]}</svg>`;
    });
};
const _ra = renderAch;
renderAch = function () {
  _ra();
  $('achGrid')
    .querySelectorAll('.item')
    .forEach((d) => {
      const f = d.firstElementChild;
      if (f)
        f.innerHTML = `<i class="ico big i-${d.classList.contains('lock') ? 'lock' : 'medal'}"></i>`;
    });
};
// slider fill
function rangeFill(r) {
  const p = ((r.value - r.min) / (r.max - r.min)) * 100;
  r.style.setProperty('--p', p + '%');
}
document.querySelectorAll('input[type=range]').forEach((r) => {
  rangeFill(r);
  r.addEventListener('input', () => rangeFill(r));
});
// art background behind sub-menus opened from home
setInterval(() => {
  const st = $('start');
  let any = false;
  document.querySelectorAll('.ov').forEach((o) => {
    if (o.id !== 'start' && o.id !== 'rotate' && o.style.display === 'flex') any = true;
  });
  const on = state === 'menu' && any && st.style.display !== 'flex';
  $('menuBg').style.display = on ? 'block' : 'none';
  document.body.classList.toggle('inmenu', on);
}, 120);
// user agreement gate
(function () {
  let ok = false;
  try {
    ok = localStorage.getItem('pel_agree_v1') === '1';
  } catch (e) {}
  const ov = $('agree');
  if (ok) {
    ov.style.display = 'none';
    return;
  }
  const ck = $('agCk'),
    go = $('agGo');
  $('agTxt').addEventListener('touchmove', (e) => e.stopPropagation(), { passive: true });
  ck.addEventListener('change', () => {
    go.disabled = !ck.checked;
    go.style.opacity = ck.checked ? 1 : 0.45;
  });
  go.onclick = () => {
    if (!ck.checked) return;
    try {
      localStorage.setItem('pel_agree_v1', '1');
    } catch (e) {}
    ov.style.display = 'none';
  };
})();

// ===== v4 UI: reverse lamp, P/R/N/D shifter, license / rider / job board =====
(function () {
  /* const MASC 由 build.py 生成（见 build/gen-assets.js），此处不再声明 */
  // --- reverse lamp on brake ---
  const rl = document.createElement('button');
  rl.id = 'revLt';
  rl.setAttribute('aria-label', '倒车');
  $('brake').appendChild(rl);
  const brakeLbl = () => {
    const b = $('brake');
    [...b.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.remove();
    });
    let s = b.querySelector('.bl');
    if (!s) {
      s = document.createElement('span');
      s.className = 'bl';
      b.insertBefore(s, rl);
    }
    s.textContent = revMode && drive !== 'car' ? '倒车' : '刹车';
    b.classList.toggle('revm', revMode && drive !== 'car');
    rl.classList.toggle('on', revMode);
    rl.style.display = drive === 'car' ? 'none' : 'block';
  };
  rl.addEventListener(
    'pointerdown',
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      initAudio();
      if (drive === 'car') return;
      if (!revMode && v > 0.5) {
        toast('先停稳，再切换倒车', 1200);
        return;
      }
      revMode = !revMode;
      if (!revMode && gear < 0 && v < 0.3) gear = 1;
      brakeLbl();
      SFX.tick(0.12);
      toast(
        revMode ? '倒车模式：按住「倒车」往后退，再点小黄灯恢复刹车' : '已恢复刹车',
        revMode ? 2200 : 900
      );
    },
    true
  );
  ['pointerup', 'pointercancel'].forEach((t) =>
    rl.addEventListener(t, (e) => e.stopPropagation(), true)
  );
  // --- automatic shifter ---
  const sh = document.createElement('div');
  sh.id = 'shift';
  sh.className = 'glass';
  sh.innerHTML =
    '<div class="gt">AUTO</div><div class="gate"><div class="knob"></div>' +
    ['P', 'R', 'N', 'D'].map((g) => `<button data-g="${g}">${g}</button>`).join('') +
    '</div>';
  document.body.appendChild(sh);
  sh.querySelectorAll('button').forEach((b) =>
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      initAudio();
      setGear(b.dataset.g);
    })
  );
  window.updShift = function () {
    const i = 'PRND'.indexOf(gearMode);
    sh.querySelector('.knob').style.top = 3 + i * 33 + 'px';
    sh.querySelectorAll('button').forEach((b) =>
      b.classList.toggle('on', b.dataset.g === gearMode)
    );
    brakeLbl();
  };
  const syncShift = () => {
    sh.style.display = $('gear').style.display === 'block' ? 'flex' : 'none';
    brakeLbl();
  };
  new MutationObserver(syncShift).observe($('gear'), {
    attributes: true,
    attributeFilter: ['style'],
  });
  syncShift();
  updShift();
  // --- license panel ---
  const lic = $('lic');
  lic.innerHTML = `<div class="panel glass dark lic2">
    <div class="lhead"><div class="lt">C2 机动车驾驶证<i class="ico i-license"></i></div><p id="lcS"></p></div>
    <div class="dots2" id="lcD"></div>
    <div class="lsec"><div class="lst"><b>记分规则</b><span id="lcP"></span></div><div class="rgrid">
      <div><i class="rd" style="background:#ff4d4d;color:#ff4d4d"></i>闯红灯<em>6分</em></div><div><i class="rd" style="background:#ffb020;color:#ffb020"></i>超速50%+<em>6分</em></div>
      <div><i class="rd" style="background:#ff7a3d;color:#ff7a3d"></i>逆行<em>3分</em></div><div><i class="rd" style="background:#ffd34d;color:#ffd34d"></i>压越中心线<em>3分</em></div>
      <div><i class="rd" style="background:#ffb020;color:#ffb020"></i>超速20%~50%<em>3分</em></div><div><i class="rd" style="background:#7fd0ff;color:#7fd0ff"></i>接打电话<em>3分</em></div>
      <div><i class="rd" style="background:#c9a0ff;color:#c9a0ff"></i>未系安全带<em>1分</em></div><div><i class="rd" style="background:#c9a0ff;color:#c9a0ff"></i>未戴头盔<em>1分</em></div>
      <div><i class="rd" style="background:#5ef08a;color:#5ef08a"></i>转弯变道不打灯<em>1分</em></div><div><i class="rd" style="background:#5ef08a;color:#5ef08a"></i>路口内停车<em>1分</em></div>
      <div><i class="rd" style="background:#ff2d55;color:#ff2d55"></i>肇事逃逸<em>12分</em></div><div><i class="rd" style="background:#ff2d55;color:#ff2d55"></i>事故赔偿<em>300金币</em></div></div></div>
    <div class="lsec"><div class="lst"><b>罚款记录</b><span>汽车/摩托车违法扣分罚金币，自行车只罚款</span></div><div id="lcH"></div></div>
    <p class="lnote">12 分扣完或交不起罚款会吊销驾照，需重考科目二、科目四</p>
    <div class="btns" id="lcB"></div></div>`;
  const _rl = renderLic;
  renderLic = function () {
    _rl();
    $('lcS').innerHTML = LIC.ok
      ? `状态：<b class="ok">有效</b> · 剩余 ${LIC.pts} / 12 分`
      : `状态：<b>${LIC.got ? '已吊销' : '未考取'}</b> · 科目二${LIC.s2 ? '已通过' : '未通过'} → 科目四未通过`;
    $('lcD').innerHTML = Array.from(
      { length: 12 },
      (_, i) =>
        `<span class="${LIC.ok && i < LIC.pts ? 'on' : ''}"><i class="ico i-license"></i></span>`
    ).join('');
    $('lcP').textContent = `驾驶证记分（${LIC.ok ? LIC.pts : 0}/12）`;
    $('lcH').innerHTML = LIC.hist.length
      ? LIC.hist.join('<br>')
      : '<div class="none"><i class="ico i-tick"></i>暂无违法记录</div>';
  };
  // --- rider page ---
  $('job').innerHTML =
    `<div class="panel glass dark job2"><h2 class="big2">我的骑手主页</h2><p id="jbS"></p><div id="jbR"></div><div id="jbT" class="sgrid"></div><div id="jbV" class="revs"></div>
    <div class="rules2"><h4>· 骑手规则 ·</h4>★4.8 以上 金牌骑手 单价 ×1.5<br>★4.5 以上 优秀骑手 单价 ×1.2<br>★3.5 以下 单价 ×0.8<br>1 星差评满 6 次会被解雇</div>
    <div class="btns"><button class="pill glass" id="jbBack">返回</button><button class="pill glass primary" id="jbJobs"><i class="ico i-brief"></i>求职网</button></div></div>`;
  $('jbBack').onclick = () => {
    $('job').style.display = 'none';
    if (jobFrom === 'start') showStart();
    else $(jobFrom).style.display = 'flex';
  };
  $('jbJobs').onclick = () => {
    $('job').style.display = 'none';
    openJobs('job');
  };
  renderJob = function () {
    const r = rating(),
      c = coOf();
    $('jbS').innerHTML = JOB.fired
      ? `<span style="color:#ff8080">已被 ${JOB.co} 解雇</span> · 去求职网找新工作`
      : `${JOB.co} 骑手 · <span class="gold">${rTier(r)}</span>${typeof curTitle === 'function' && curTitle() ? `<span class="title2">${curTitle()}</span>` : ''}`;
    $('jbR').innerHTML =
      `<div class="rbig"><i class="ico i-star"></i><b>${r.toFixed(2)}</b></div><span class="rchip">单价倍率 ×${(rMult(r) * c.m).toFixed(2)} ｜ 1星差评 <b style="color:${JOB.low >= 4 ? '#ff8080' : '#ffd34d'}">${JOB.low}/6</b></span>`;
    $('jbT').innerHTML = [
      ['box', '送达', JOB.n + ' 单'],
      ['bolt', '加急', JOB.urg],
      ['star', '五星', JOB.five],
      ['coin', '收入', JOB.earn],
      ['heart', '小费', JOB.tips],
      ['medal', '差评', JOB.low],
    ]
      .map(([i, t, n]) => `<div><i class="ico i-${i}"></i>${t} <b>${n}</b></div>`)
      .join('');
    $('jbV').innerHTML = JOB.revs.length
      ? JOB.revs
          .slice(0, 4)
          .map((s) => `<div>${s}</div>`)
          .join('')
      : '<div style="text-align:center;font-weight:800">还没有评价，快去接单吧</div>';
  };
  // --- job board ---
  $('jobs').innerHTML =
    `<div class="panel glass dark jobs2"><h2 class="big2">骑手求职网</h2><p id="jsS"></p><div id="jsL"></div><div id="jsQ"></div><div class="btns"><button class="pill glass primary" id="jsBack">返回</button></div></div>`;
  $('jsBack').onclick = () => {
    $('jobs').style.display = 'none';
    if (jobsFrom === 'ride') {
      if (state === 'paused') state = resumeState;
    } else if (jobsFrom === 'job') {
      renderJob();
      $('job').style.display = 'flex';
    } else showStart();
  };
  renderJobs = function () {
    const L = $('jsL');
    L.innerHTML = '';
    $('jsQ').style.display = 'none';
    L.style.display = 'block';
    $('jsS').innerHTML = JOB.fired
      ? '你目前<b style="color:#ff8080">待业中</b>，投个简历吧'
      : `当前就职：${JOB.co}（跳槽会清空当前评分记录）`;
    COS.forEach((c, idx) => {
      const bl = JOB.black.includes(c.n) && c.n !== '闪电跑腿',
        cur = !JOB.fired && JOB.co === c.n,
        ok = !c.need || c.need();
      const d = document.createElement('div');
      d.className = 'jcard jc' + idx;
      d.innerHTML = `<div class="jt"><b>${c.n} · 单价 <em>×${c.m}</em></b><span>${c.dep ? '押金 ' + c.dep + ' 金币' : c.req}</span></div><img src="${MASC[idx]}" alt="">`;
      const b = document.createElement('button');
      b.className = 'pill ' + (cur ? 'cur' : bl || !ok ? 'no' : 'go');
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
          toast(`押金不够，需要 ${c.dep} 金币`);
          return;
        }
        interview(c);
      };
      d.appendChild(b);
      L.appendChild(d);
    });
  };
})();
