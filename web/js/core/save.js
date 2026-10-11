'use strict';
// ── js/core/save.js ──
// 存档槽：3 格手动存档读写、存档管理面板
function slotGet(n) {
  try {
    return JSON.parse(localStorage.getItem('pel_slot' + n) || 'null');
  } catch (e) {
    return null;
  }
}
function curSlot() {
  return +(localStorage.getItem('pel_cur') || 0);
}
function openSaves() {
  const fmt = (t) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };
  const cur = curSlot();
  let h = '<div class="svL">';
  for (let n = 1; n <= 3; n++) {
    const s = slotGet(n);
    h += `<div class="svR${cur === n ? ' on' : ''}"><div class="svI">💾</div><div class="svT"><b>存档 ${n}${cur === n ? ' · 当前' : ''}</b><span>${s ? `🪙 ${s.coins} · 第 ${s.day || 1} 天 · ${fmt(s.t)}` : '空存档'}</span></div><button class="pill glass" data-sv="s${n}">保存</button><button class="pill glass primary${s ? '' : ' dis'}" data-sv="l${n}">读取</button></div>`;
  }
  h +=
    '</div><p style="font-size:12px;opacity:.75;margin:6px 0 0">游戏会自动保存进度；存档可以把当前进度备份到一个格子里，随时读回来。</p>';
  mdlOpen(
    '💾 存档管理',
    h,
    [
      {
        t: '🆕 新建存档',
        f: () => {
          mdlOpen(
            '🆕 新建存档？',
            '会从 0 金币、初始单车开始新的游戏。<br>已经保存到格子里的存档不会丢。',
            [
              {
                t: '确定新建',
                p: 1,
                f: () => {
                  saveCoins();
                  try {
                    ['pelicanSave', 'pelicanCodes', 'pelicanCoins'].forEach((k) =>
                      localStorage.removeItem(k)
                    );
                    localStorage.setItem('pel_cur', '0');
                    localStorage.setItem('pel_fresh', '1');
                  } catch (e) {}
                  location.reload();
                },
              },
              { t: '取消', f: () => openSaves() },
            ]
          );
        },
      },
      {
        t: '返回',
        p: 1,
        f: () => {
          mdlClose();
          $('settings').style.display = 'flex';
        },
      },
    ],
    true
  );
  $('mdlC')
    .querySelectorAll('[data-sv]')
    .forEach(
      (b) =>
        (b.onclick = () => {
          const k = b.dataset.sv,
            n = +k.slice(1);
          if (k[0] === 's') {
            const s = slotGet(n);
            const doSave = () => {
              saveCoins();
              try {
                localStorage.setItem(
                  'pel_slot' + n,
                  JSON.stringify({
                    s: localStorage.getItem('pelicanSave'),
                    c: localStorage.getItem('pelicanCodes'),
                    coins,
                    day: CAL.day,
                    t: Date.now(),
                  })
                );
                localStorage.setItem('pel_cur', '' + n);
              } catch (e) {
                toast('保存失败：存储空间不足');
                return;
              }
              SFX.win && SFX.win();
              toast(`💾 已保存到存档 ${n}`, 1600);
              openSaves();
            };
            if (s && curSlot() !== n)
              mdlOpen(
                `覆盖存档 ${n}？`,
                `原有进度（🪙 ${s.coins} · 第 ${s.day || 1} 天）会被替换`,
                [
                  { t: '覆盖', p: 1, f: doSave },
                  { t: '取消', f: () => openSaves() },
                ]
              );
            else doSave();
          } else {
            const s = slotGet(n);
            if (!s) {
              toast('这是个空存档');
              return;
            }
            mdlOpen(`读取存档 ${n}？`, '当前没保存的进度会丢失，游戏会重新载入。', [
              {
                t: '读取',
                p: 1,
                f: () => {
                  try {
                    if (s.s) localStorage.setItem('pelicanSave', s.s);
                    else localStorage.removeItem('pelicanSave');
                    if (s.c) localStorage.setItem('pelicanCodes', s.c);
                    else localStorage.removeItem('pelicanCodes');
                    localStorage.setItem('pel_cur', '' + n);
                  } catch (e) {}
                  location.reload();
                },
              },
              { t: '取消', f: () => openSaves() },
            ]);
          }
        })
    );
}
