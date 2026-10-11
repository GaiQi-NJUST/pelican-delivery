'use strict';
// ── js/ui/modals.js ──
// 界面：toast、通用设置菜单、弹窗 ✕ 按钮、横竖屏
// ===== UI =====
(function () {
  const MAP = {
    settings: 'closeSet',
    ach: 'achBack',
    job: 'jbBack',
    jobs: 'jsBack',
    shop: 'closeShop',
    revoked: 'rvOk',
    exIntro: 'ixNo',
    crashed: 'again',
    end: 'restart',
  };
  const ids = [
    'settings',
    'choice',
    'ach',
    'job',
    'jobs',
    'shop',
    'lic',
    'revoked',
    'exIntro',
    'exEnd',
    'crashed',
    'end',
  ];
  const addX = () =>
    ids.forEach((id) => {
      const ov = $(id);
      if (!ov) return;
      const pn = ov.querySelector('.panel') || ov.firstElementChild;
      if (!pn || pn.querySelector(':scope>.ovx')) return;
      pn.style.position = pn.style.position || 'relative';
      const x = document.createElement('button');
      x.className = 'ovx';
      x.textContent = '✕';
      x.setAttribute('aria-label', '关闭');
      x.onclick = (e) => {
        e.stopPropagation();
        let t = MAP[id] ? $(MAP[id]) : null;
        if (!t && id === 'lic') t = [...$('lcB').children].pop();
        if (!t && id === 'exEnd') t = [...$('xeB').children].pop();
        if (!t && id === 'choice')
          t = $('chB').querySelector('.primary') || $('chB').firstElementChild;
        if (t) t.click();
        else ov.style.display = 'none';
      };
      pn.appendChild(x);
    });
  [0, 800, 3000].forEach((t) => setTimeout(addX, t));
  document.addEventListener('click', () => setTimeout(addX, 50), true);
})();
function toast(m, ms) {
  const e = $('toast');
  e.innerHTML = '';
  const sp = document.createElement('span');
  sp.textContent = m;
  e.appendChild(sp);
  const x = document.createElement('b');
  x.className = 'xclose';
  x.textContent = '✕';
  x.onpointerdown = (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    e.style.display = 'none';
  };
  e.appendChild(x);
  e.style.display = 'block';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => (e.style.display = 'none'), ms || 2000);
}
function segCtl(id, opts, idx, cb) {
  const el = $(id);
  el.innerHTML = '';
  opts.forEach((o, i) => {
    const b = document.createElement('button');
    b.textContent = o;
    if (i === idx) b.classList.add('on');
    b.onclick = () => {
      [...el.children].forEach((c) => c.classList.remove('on'));
      b.classList.add('on');
      cb(i);
    };
    el.appendChild(b);
  });
}
let resumeState = 'ride';
$('bSet').onclick = () => {
  initAudio();
  $('closeSet').textContent = state === 'menu' ? '返回' : '继续骑行';
  if (state === 'ride' || state === 'foot') {
    resumeState = state;
    state = 'paused';
  } else resumeState = state;
  $('settings').style.display = 'flex';
};
$('closeSet').onclick = () => {
  $('settings').style.display = 'none';
  if (state === 'menu') {
    showStart();
    return;
  }
  if (state === 'paused') state = resumeState;
};
$('setBtn').onclick = () => {
  initAudio();
  $('start').style.display = 'none';
  $('closeSet').textContent = '返回';
  $('settings').style.display = 'flex';
};
$('newMission').onclick = () => {
  $('settings').style.display = 'none';
  openSaves();
};
segCtl('sgSound', ['开', '关'], 0, (i) => {
  muted = i === 1;
  if (master) master.gain.value = muted ? 0 : 0.9;
});
segCtl('sgMusic', ['开', '关'], musOn ? 0 : 1, (i) => setMusic(i === 0));
segCtl('sgGyro', ['关', '开', '反向'], 0, async (i) => {
  gyroBase = null;
  if (i > 0 && gyroMode === 0) {
    try {
      if (
        window.DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
      ) {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') {
          toast('没有获得陀螺仪权限');
          return;
        }
      }
    } catch (err) {}
    addEventListener('deviceorientation', onOri);
    setTimeout(() => {
      if (gyroMode && !gyroSeen) toast('收不到陀螺仪数据：请在手机浏览器里直接打开本页', 3200);
    }, 2000);
  }
  if (i === 0) removeEventListener('deviceorientation', onOri);
  gyroMode = i;
  showSteer();
  if (i) toast('以当前姿势为中立，左右倾斜手机转向');
});
$('sens').oninput = (e) => {
  sens = +e.target.value;
};
let controls = null;
segCtl('sgCam', ['追尾', '远景', '侧面', '自由'], 0, (i) => {
  camMode = i;
  if (i === 3 && THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.copy(player.position).add(V(0, 1, 0));
    controls.enableDamping = true;
    controls.maxPolarAngle = PI * 0.49;
    controls.minDistance = 2;
    controls.maxDistance = 40;
  } else if (controls) {
    controls.dispose();
    controls = null;
  }
});
const LIGHTS = [
  {
    bg: 0xf4a76c,
    hs: 0xffd6b0,
    hg: 0x4d6b35,
    hi: 0.7,
    sc: 0xffb066,
    si: 1.6,
    so: V(-30, 22, 18),
    ex: 1.0,
    night: false,
  },
  {
    bg: 0x93bfdc,
    hs: 0xeef3ff,
    hg: 0x5a7444,
    hi: 0.55,
    sc: 0xfff1dc,
    si: 1.0,
    so: V(20, 45, 25),
    ex: 0.92,
    night: false,
  },
  {
    bg: 0x0a1330,
    hs: 0x5060a0,
    hg: 0x1a2418,
    hi: 0.45,
    sc: 0x9aa8ff,
    si: 0.35,
    so: V(-20, 40, -20),
    ex: 1.15,
    night: true,
  },
  {
    bg: 0xc4d3df,
    hs: 0xffe9d2,
    hg: 0x55683f,
    hi: 0.48,
    sc: 0xffd9b0,
    si: 0.8,
    so: V(40, 22, 10),
    ex: 0.9,
    night: false,
  },
];
function applyLight() {
  const L = LIGHTS[lightMode];
  scene.background.setHex(L.bg);
  scene.fog.color.setHex(L.bg);
  hemi.color.setHex(L.hs);
  hemi.groundColor.setHex(L.hg);
  hemi.intensity = L.hi;
  sun.color.setHex(L.sc);
  sun.intensity = L.si;
  renderer.toneMappingExposure = L.ex;
  stars.visible = L.night;
  headL.intensity = L.night ? 6 : 0;
  lampGlass.material.emissiveIntensity = L.night ? 2.5 : 0;
  headM.emissiveIntensity = L.night ? 2.2 : 0.6;
  cloudM.emissive.setHex(L.night ? 0x000000 : 0x332211);
  cloudM.color.setHex(L.night ? 0x4a5578 : 0xffffff);
  towers.material.emissive = new THREE.Color(L.night ? 0x333020 : 0x000000);
}
segCtl('sgTime', ['黄昏', '白天', '夜晚'], 0, (i) => {
  lightMode = i;
  applyLight();
});
applyLight();
setTimeout(
  () =>
    segCtl('sgWx', ['随机', '晴天', '下雨', '下雪'], 0, (i) => {
      wxMode = i;
      const fx = () => {
        if (fogF0) scene.fog.far = fogF0;
      };
      if (i === 1) {
        rainT = 0;
        stopSnow();
        fx();
      } else if (i === 2) {
        rainT = 0;
        startRain();
        rainT = 1e9;
      } else if (i === 3) {
        stopSnow();
        startSnow(true);
      } else {
        rainT = 0;
        stopSnow();
        fx();
      }
    }),
  0
);
segCtl('sgTraffic', ['少', '中', '多'], 1, (i) => {
  traffic = i;
});
segCtl('sgShadow', ['开', '关'], 0, (i) => {
  shadows = i === 0;
  renderer.shadowMap.enabled = shadows;
  scene.traverse((o) => {
    if (o.material) {
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(
        (m) => (m.needsUpdate = true)
      );
    }
  });
});
function onOri(e) {
  if (e.gamma == null) return;
  gyroSeen = true;
  const ang =
    screen.orientation && screen.orientation.angle != null
      ? screen.orientation.angle
      : window.orientation || 0;
  const raw = ang === 90 ? e.beta : ang === 270 || ang === -90 ? -e.beta : e.gamma;
  if (gyroBase === null) gyroBase = raw;
  let g = -(raw - gyroBase) / 20;
  if (gyroMode === 2) g = -g;
  gyroVal = clamp(g, -1, 1);
}
$('go').onclick = () => {
  initAudio();
  try {
    const de = document.documentElement;
    if (de.requestFullscreen) {
      de.requestFullscreen().catch(() => {});
    }
  } catch (e) {}
  startMission();
};
$('again').onclick = () => {
  initAudio();
  standUp();
};
$('restart').onclick = () => {
  $('end').style.display = 'none';
  hardReset();
  newMission();
};
let portraitOK = false;
$('anyway').onclick = () => {
  portraitOK = true;
  $('rotate').style.display = 'none';
};
function checkOrient() {
  $('rotate').style.display = 'none';
}
