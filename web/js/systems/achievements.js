'use strict';
// ── js/systems/achievements.js ──
// v0.1.10：成就系统重做——分类、进度条、每个成就 🪙50–500、可佩戴称号（首页和骑手页显示）
// 兼容旧存档：沿用 ACH[id] = 解锁时间戳；旧 id 全部保留。
const ACHX = SAVE.achx || (SAVE.achx = {}); // 计数器：加油次数、抢车次数……
const ACH_CATS = ['配送', '驾驶', '探索', '生活', '热梗'];
const P_ = (cur, max) => () => [Math.min(cur(), max), max];
const jobN = () => JOB.n,
  roofN = () => Object.keys(SAVE).filter((k) => k.startsWith('roof_')).length,
  sqN = () => (SAVE.sqdone_egg || []).length,
  cnt = (k) => () => ACHX[k] || 0;
// [id, 分类, 名称, 说明, 奖励, 称号, 进度]
const ACH2 = [
  ['first', 0, '第一单', '完成第一笔外卖', 50],
  ['d10', 0, '小有名气', '累计送达 10 单', 100, null, P_(jobN, 10)],
  ['d50', 0, '老骑手', '累计送达 50 单', 200, '老骑手', P_(jobN, 50)],
  ['d100', 0, '百单王者', '累计送达 100 单', 400, '百单王者', P_(jobN, 100)],
  ['d300', 0, '外卖之神', '累计送达 300 单', 500, '外卖之神', P_(jobN, 300)],
  ['urg', 0, '加急侠', '完成一笔加急单', 50],
  ['urg10', 0, '闪电侠', '完成 10 笔加急单', 200, '闪电侠', P_(() => JOB.urg, 10)],
  ['five10', 0, '好评如潮', '收到 10 个五星好评', 150, null, P_(() => JOB.five, 10)],
  ['picky', 0, '征服挑剔鬼', '挑剔顾客给了你五星', 120],
  ['tip', 0, '第一笔小费', '收到顾客小费', 50],
  ['tip500', 0, '小费达人', '累计小费 🪙500', 200, null, P_(() => JOB.tips, 500)],
  ['earn1k', 0, '月入过千', '累计配送收入 🪙1000', 100, null, P_(() => JOB.earn, 1000)],
  ['earn10k', 0, '外卖大亨', '累计配送收入 🪙10000', 500, '外卖大亨', P_(() => JOB.earn, 10000)],
  ['fast', 0, '神速送达', '一半时限内送达', 100],
  ['triple', 0, '三单齐飞', '同时背 3 单', 100],
  ['rain', 0, '雨中骑士', '雨天送达一单', 80],
  ['night', 0, '夜猫子', '夜间送达一单', 80],
  ['clean10', 0, '模范骑手', '连续 10 单零违章', 200, '模范骑手', P_(() => JOB.clean, 10)],
  ['lic', 1, '持证上岗', '考取驾照', 200, '持证上岗'],
  ['s2100', 1, '科目二满分', '科目二考试满分', 300, '倒库之王'],
  ['moto', 1, '摩托骑手', '骑摩托送达一单', 100],
  ['pana', 1, '豪车送外卖', '开帕拉梅拉送外卖', 200, '豪车外卖员'],
  ['steal', 1, '借车一用', '第一次抢走路边的车', 50],
  ['escape', 1, '追不上我吧', '甩掉追你的车主', 150, '追不上我吧'],
  ['scrap', 1, '开到报废', '把偷来的车开到没油报废', 80],
  ['gas', 1, '第一次加油', '在加油站加满一次油', 50],
  ['gas5', 1, '加油站常客', '累计加油 5 次', 150, '加油站常客', P_(cnt('gas'), 5)],
  ['six', 1, '六六大顺', '时速保持 66 km/h', 66],
  ['pigeon', 1, '惊鸟', '6 秒内按 8 次车铃', 50],
  ['statue', 2, '神像', '找到传说中的鹈鹕神像', 200, '神像守护者'],
  ['ufo', 2, '第三类接触', '在 UFO 下面停车', 150, '外星人的骑手'],
  ['rainbow', 2, '雨过天晴', '看到雨后彩虹', 80],
  ['roof5', 2, '天台收藏家', '登上 5 栋楼的天台', 150, null, P_(roofN, 5)],
  ['sq12', 2, '热心市民', '完成 12 种支线', 300, '热心市民', P_(sqN, 12)],
  ['sq24', 2, '南京百事通', '完成全部 24 种支线', 500, '南京百事通', P_(sqN, 24)],
  ['xiaogai', 3, '宿舍楼下', '给小盖同学送一单夜宵', 100],
  ['fan', 3, '网红骑手', '和路边粉丝合影', 80],
  ['wallet', 3, '拾金不昧', '把捡到的钱包交给交警', 100, '拾金不昧'],
  ['hospital', 3, '缝了 8 针', '被送进医院', 50],
  ['fired', 3, '人生低谷', '被平台解雇', 50],
  ['rehire', 3, '东山再起', '被解雇后找到新工作', 100, '东山再起'],
  ['bsx', 4, '下午干活不烧心', '在工地门口送一单「贵但不烧心」的盒饭', 150, '不烧心'],
  ['tongtou', 4, '特别通透', '跟着路边的博主跳完一套噜噜操', 100, '特别通透'],
  ['shanshen', 4, '闪身步', '路人用闪身步躲开你 3 次', 100, '闪身大师', P_(cnt('shanshen'), 3)],
  ['dachang', 4, '超长长长长长时代', '送达一份超长蛋挞', 80],
  ['dashui', 4, '大水时代', '在加油站便利店买一瓶 2L 大水', 80],
  ['luke', 4, '全抖音都在找 luke', '找到藏在城里的 luke', 200, '找到 luke 的人'],
  ['niulai', 4, '牛来了', '在马路上遇到一头牛', 150],
  ['china', 4, 'Chinamaxxing', '帮外国游客体验喝热水泡脚', 100],
  ['xianhua', 4, '显化成功', '对着天空许愿后真的收到了打赏', 120, '显化成功'],
];
// 旧 ACHS 结构（[id, emoji, 名称, 说明]）保持给其它代码查询
ACHS.length = 0;
ACH2.forEach((a) => ACHS.push([a[0], '🏅', a[2], a[3]]));
function achDef(id) {
  return ACH2.find((a) => a[0] === id);
}
function achCount(k, n) {
  ACHX[k] = (ACHX[k] || 0) + (n || 1);
  if (k === 'gas') {
    unlock('gas');
    if (ACHX.gas >= 5) unlock('gas5');
  }
  if (k === 'shanshen' && ACHX.shanshen >= 3) unlock('shanshen');
  saveCoins();
}
function achProgressCheck() {
  for (const a of ACH2)
    if (!ACH[a[0]] && a[6]) {
      const [c, m] = a[6]();
      if (c >= m) unlock(a[0]);
    }
}
unlock = function (id) {
  if (ACH[id]) return;
  const a = achDef(id);
  if (!a) return;
  ACH[id] = Date.now();
  coins += a[4];
  saveCoins();
  const e = $('achPop');
  e.innerHTML = `🏆 成就解锁：${a[2]} · 🪙+${a[4]}${a[5] ? ` · 获得称号「${a[5]}」` : ''}`;
  e.style.display = 'block';
  clearTimeout(unlock.t);
  unlock.t = setTimeout(() => (e.style.display = 'none'), 3400);
  try {
    SFX.win();
  } catch (_) {}
};
// 称号：手动佩戴，没选就自动用奖励最高的那个
function titlesOwned() {
  return ACH2.filter((a) => a[5] && ACH[a[0]]).map((a) => a[5]);
}
function curTitle() {
  const own = titlesOwned();
  if (SAVE.title && own.includes(SAVE.title)) return SAVE.title;
  let best = null,
    br = -1;
  for (const a of ACH2)
    if (a[5] && ACH[a[0]] && a[4] > br) {
      br = a[4];
      best = a[5];
    }
  return best;
}
let achTab = -1;
renderAch = function () {
  achProgressCheck();
  const g = $('achGrid');
  g.innerHTML = '';
  const n = ACH2.filter((a) => ACH[a[0]]).length;
  const earned = ACH2.filter((a) => ACH[a[0]]).reduce((s, a) => s + a[4], 0);
  $('achN').innerHTML =
    `已解锁 ${n} / ${ACH2.length} · 已领 🪙${earned}${curTitle() ? ` · 当前称号<span class="title2">${curTitle()}</span>` : ''}`;
  // 分类标签
  let tabs = $('achTabs');
  if (!tabs) {
    tabs = document.createElement('div');
    tabs.id = 'achTabs';
    g.parentNode.insertBefore(tabs, g);
  }
  tabs.innerHTML = '';
  [['全部', -1]].concat(ACH_CATS.map((c, i) => [c, i])).forEach(([t, i]) => {
    const b = document.createElement('button');
    const got = ACH2.filter((a) => (i < 0 || a[1] === i) && ACH[a[0]]).length,
      all = ACH2.filter((a) => i < 0 || a[1] === i).length;
    b.textContent = `${t} ${got}/${all}`;
    if (i === achTab) b.className = 'on';
    b.onclick = () => {
      achTab = i;
      renderAch();
    };
    tabs.appendChild(b);
  });
  // 称号选择
  let tt = $('achTitle');
  if (!tt) {
    tt = document.createElement('div');
    tt.id = 'achTitle';
    g.parentNode.insertBefore(tt, g);
  }
  const own = titlesOwned();
  tt.innerHTML = own.length
    ? ''
    : '<span style="font-size:12px;opacity:.75">解锁带称号的成就后，可以在这里佩戴称号</span>';
  own.forEach((t) => {
    const b = document.createElement('button');
    b.textContent = t;
    if (t === curTitle()) b.className = 'on';
    b.onclick = () => {
      SAVE.title = t;
      saveCoins();
      renderAch();
    };
    tt.appendChild(b);
  });
  for (const a of ACH2) {
    if (achTab >= 0 && a[1] !== achTab) continue;
    const ok = !!ACH[a[0]];
    const d = document.createElement('div');
    d.className = 'item' + (ok ? '' : ' lock');
    let pb = '';
    if (a[6] && !ok) {
      const [c, m] = a[6]();
      pb = `<div class="pb"><i style="width:${Math.round((c / m) * 100)}%"></i></div><div style="font-size:10.5px;opacity:.8">${c} / ${m}</div>`;
    }
    d.innerHTML = `<div style="font-size:30px">🏅</div><b>${a[2]}</b><div style="font-size:11.5px;opacity:.8">${a[3]}</div>${pb}<div class="rw">🪙${a[4]}</div>${a[5] ? `<div class="tt">称号「${a[5]}」</div>` : ''}`;
    g.appendChild(d);
  }
};
// 首页 & 骑手页显示称号
const _showStart2 = showStart;
showStart = function () {
  _showStart2();
  achProgressCheck();
  const t = curTitle();
  if (t) $('sJ').innerHTML += `<span class="title2">${t}</span>`;
};
setInterval(() => {
  if (state === 'ride' || state === 'foot') achProgressCheck();
}, 5000);
