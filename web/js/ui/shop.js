'use strict';
// ── js/ui/shop.js ──
// 商店 UI：三栏渲染、换装预览、兑换码核销
const usedCodes=new Set();try{(JSON.parse(localStorage.getItem('pelicanCodes')||'[]')).forEach(c=>usedCodes.add(c));}catch(e){}
function applyEquip(){const e=SAVE.equip;try{if(stolen){player.remove(stolen.b.g);stolen=null;if(chase)endChase();}}catch(_){}let item=SHOP.find(i=>i.id===e.vehicle)||SHOP[0];
  if((item.car||item.moto)&&!LIC.ok){e.vehicle=e.lastBike||'bike_red';item=SHOP.find(i=>i.id===e.vehicle)||SHOP[0];}
  if(!item.car&&!item.moto)e.lastBike=item.id;
  const was=drive;setModel(item.car?'pana':item.moto?'moto':'bike');
  if(!item.car&&!item.moto){red.color.setHex(item.col);red.metalness=item.id==='bike_gold'?.95:.55;red.roughness=item.id==='bike_gold'?.18:.3;}
  if(was!==drive)clampRoad();
  Object.values(outfit).forEach(o=>o.visible=false);
  for(const k of['hat','eyes','neck','back','ear'])if(e[k]&&outfit[e[k]])outfit[e[k]].visible=true;
  crest.forEach(c=>c.visible=!e.hat);try{defHelm.visible=!e.hat;}catch(_){}}
let shopTab=0,shopFrom=null;
function invGet(){return SAVE.inv_egg||(SAVE.inv_egg={});}
function useItem(i){const iv=invGet();if(!(iv[i.id]>0))return;if(state==='menu'&&i.id!=='freecard'){toast('进入游戏后才能使用');return;}
  if(i.id==='freecard'){toast('🎫 免罚金卡会在下次被开罚单时自动生效');return;}
  iv[i.id]--;if(i.id==='cola'){stamina=Math.min(100,stamina+40);exhausted=false;}else if(i.id==='drink'){stamina=100;exhausted=false;}else if(i.id==='medkit'){hp=100;}else if(i.id==='rocket'){boostT=8;stamina=100;exhausted=false;}
  SFX.power&&SFX.power();toast(`${i.icon} 使用了${i.name}：${i.d}`,1800);saveCoins();renderShop();}
const SHCOL=[['车辆','🚲','gold'],['装扮','👑','blue'],['道具','🎒','purple']];
function renderShop(){const cc=$('shCoins');cc.innerHTML=`<img src="${IMG.it_coin}">${coins.toLocaleString()}`;const root=$('shGrid');root.innerHTML='';const iv=invGet();
  SHCOL.forEach((col,ci)=>{const P=document.createElement('div');P.className='shP '+col[2];P.innerHTML=`<div class="shH">${col[1]} ${col[0]}</div><div class="shL"></div>`;const L=P.querySelector('.shL');
    SHOP.filter(i=>i.cat===ci).forEach(i=>{const owned=SAVE.owned.includes(i.id);const eq=i.kind!=='use'&&SAVE.equip[i.kind]===i.id;const im=IMG['it_'+i.id];const lic=(i.car||i.moto);
      const d=document.createElement('div');d.className='shI'+(eq?' eq':'')+(i.id==='bike_gold'||i.id==='crown'||i.car?' rare':'');
      const bars=i.st?`<div class="bars">${i.st.map((s,k)=>`<i style="--w:${s*20}%;--c:${i.col!=null?'#'+i.col.toString(16).padStart(6,'0'):['#ff5a4e','#ffb547','#5ad1e6'][k]}"></i>`).join('')}</div>`:'';
      const sub=i.kind==='use'?`<div class="sub">${i.d}${iv[i.id]?` · 拥有 <b>×${iv[i.id]}</b>`:''}</div>`:lic&&!LIC.ok?`<div class="sub warn">⚠️ ${LIC.got?'驾照已吊销':'需要驾照'}</div>`:'';
      d.innerHTML=`<div class="pic">${im?`<img src="${im}">`:`<span>${i.icon}</span>`}</div><div class="inf"><div class="nm">${i.name}</div>${bars}${sub}<div class="bt"></div></div>`;
      const bt=d.querySelector('.bt');const mk=(cls,html,fn)=>{const b=document.createElement('button');b.className='shB '+cls;b.innerHTML=html;b.onclick=e=>{e.stopPropagation();initAudio();fn();};bt.appendChild(b);};
      const coinB=p=>`<img src="${IMG.it_coin}">${p}`;
      if(i.kind==='use'){mk('buy',coinB(i.price),()=>{if(coins<i.price){toast(`金币不够，还差 🪙${i.price-coins}`);return;}coins-=i.price;iv[i.id]=(iv[i.id]||0)+1;SFX.win();toast(`🛒 买了 ${i.name}`);saveCoins();renderShop();});if(iv[i.id]>0&&i.id!=='freecard')mk('use','使用',()=>useItem(i));}
      else if(eq)mk(i.kind==='vehicle'?'on':'off',i.kind==='vehicle'?'✔ 使用中':'卸下',()=>{if(i.kind!=='vehicle'){SAVE.equip[i.kind]=null;saveCoins();applyEquip();renderShop();}});
      else if(owned)mk('own',i.kind==='vehicle'?'使用':'穿戴',()=>{if(lic&&!LIC.ok){toast(LIC.got?'驾照已吊销，先去驾校重考科目二、科目四':'先去驾校考驾照吧',2600);return;}SAVE.equip[i.kind]=i.id;saveCoins();applyEquip();renderShop();});
      else mk('buy',i.price?coinB(i.price.toLocaleString()):'免费',()=>{if(lic&&!LIC.ok){toast(LIC.got?'驾照已吊销，先去驾校重考科目二、科目四':'买车要先有驾照，去驾校考科目二、科目四吧',2800);return;}if(coins<i.price){toast(`金币不够，还差 🪙${i.price-coins}`);return;}coins-=i.price;SAVE.owned.push(i.id);SAVE.equip[i.kind]=i.id;SFX.win();toast(`🎉 获得 ${i.name}`);saveCoins();applyEquip();renderShop();});
      L.appendChild(d);});root.appendChild(P);});}
function openShop(from){if(exam){toast('考试中不能进商店');return;}shopFrom=from;$(from).style.display='none';renderShop();$('shop').style.display='flex';}
$('openShop').onclick=()=>openShop('settings');$('shopBtn').onclick=()=>openShop('start');
$('closeShop').onclick=()=>{$('shop').style.display='none';if(shopFrom==='start')showStart();else $(shopFrom).style.display='flex';};

$('redeem').onclick=()=>{const c=($('code').value||'').trim().toUpperCase();const r=CODES[c];
  if(!r){toast('兑换码无效');return;}if(usedCodes.has(c)){toast('这个兑换码已经用过了');return;}
  usedCodes.add(c);try{localStorage.setItem('pelicanCodes',JSON.stringify([...usedCodes]));}catch(e){}
  if(r.give&&!SAVE.owned.includes(r.give)){SAVE.owned.push(r.give);SAVE.equip.vehicle=r.give;}if(r.coins)coins+=r.coins;
  saveCoins();applyEquip();renderShop();SFX.win();toast(r.msg,2600);$('code').value='';};
$('code').addEventListener('keydown',e=>e.stopPropagation());
