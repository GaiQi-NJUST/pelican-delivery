'use strict';
// ── js/systems/rules.js ──
// 交规玩法：交警/罚单/12分驾照、驾校科目二/三/四
// ===== police =====
CARS.police={n:'警车',len:4.7,w:1.85,vmax:14,r:.33,body:CARS.sedan.body,cab:CARS.sedan.cab,cols:[0xffffff],police:true};
let polT=null;
function decoratePolice(b){const S=CARS.police;if(!polT)polT=canvasTex(256,64,(x,w,h)=>{x.fillStyle='#1747a6';x.font='bold 40px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('警察 POLICE',w/2,h/2+2);});
  const g=b.g;for(const s of[-1,1]){const st=mesh(new THREE.BoxGeometry(S.len*.92,.11,.02),M(0x1747a6),g);st.position.set(0,.5,s*(S.w/2+.005));
    const p=mesh(new THREE.PlaneGeometry(1.5,.38),new THREE.MeshStandardMaterial({map:polT,transparent:true}),g);p.position.set(-.2,.68,s*(S.w/2+.012));if(s<0)p.rotation.y=PI;}
  const x0=(S.cab[1][0]+S.cab[2][0])/2,y0=Math.max(S.cab[1][1],S.cab[2][1])+.06;mesh(new THREE.BoxGeometry(.3,.06,1.1),darkM,g).position.set(x0,y0,0);
  const mr=new THREE.MeshStandardMaterial({color:0x330000,emissive:0xff1a1a,emissiveIntensity:2}),mb=new THREE.MeshStandardMaterial({color:0x000033,emissive:0x1a5cff,emissiveIntensity:2});
  mesh(new THREE.BoxGeometry(.26,.1,.48),mr,g).position.set(x0,y0+.07,-.27);mesh(new THREE.BoxGeometry(.26,.1,.48),mb,g).position.set(x0,y0+.07,.27);b.bar=[mr,mb];}
const offArms=[];
function makeOfficer(){const g=new THREE.Group();const navy=M(0x1d2a44,{roughness:.8}),shirt=M(0xbcd3ea,{roughness:.8}),vest=M(0xc6ff2e,{roughness:.6,emissive:0x2a3a00}),skin=M(0xf1c9a5,{roughness:.7}),white=M(0xffffff,{roughness:.5});
  for(const s of[-1,1])mesh(new THREE.CylinderGeometry(.075,.07,.86,8),navy,g).position.set(0,.43,s*.1);
  mesh(new THREE.CylinderGeometry(.19,.17,.62,12),shirt,g).position.set(0,1.17,0);mesh(new THREE.CylinderGeometry(.205,.185,.42,12),vest,g).position.set(0,1.2,0);
  mesh(new THREE.CylinderGeometry(.18,.18,.06,12),white,g).position.set(0,.9,0);
  mesh(new THREE.SphereGeometry(.12,14,10),skin,g).position.set(0,1.62,0);
  mesh(new THREE.CylinderGeometry(.135,.13,.09,14),white,g).position.set(0,1.74,0);const br=mesh(new THREE.CylinderGeometry(.15,.15,.015,14,1,false,-PI/2,PI),M(0x111111),g);br.position.set(.04,1.7,0);
  const arms=[];for(const s of[-1,1]){const a=new THREE.Group();a.position.set(0,1.44,s*.24);g.add(a);const ar=mesh(new THREE.CylinderGeometry(.05,.045,.58,8),shirt,a);ar.position.y=-.29;const gl=mesh(new THREE.SphereGeometry(.06,8,6),white,a);gl.position.y=-.6;arms.push(a);}
  offArms.push({a:arms,ph:Math.random()*6});return g;}
inters.forEach(it=>{const o=makeOfficer();o.position.set(RH+1.8,.16,-(RH+1.8));o.rotation.y=-3*PI/4;it.g.add(o);it.off=o;});
function nearPolice(){const p=player.position;if(cars.some(c=>c.type==='police'&&c.pos.distanceTo(p)<60))return true;
  return inters.some(it=>it.off&&it.off.visible&&Math.hypot(it.i*B-p.x,it.j*B-p.z)<35);}

let vipT=0,vipDone=(()=>{try{return localStorage.getItem('pel_viphint')==='1'}catch(e){return false}})();
function vipHint(dt){if(vipDone)return;vipT+=dt;if(vipT>300&&typeof orders!=='undefined'&&orders.length>0){vipDone=true;try{localStorage.setItem('pel_viphint','1')}catch(e){}
  toast('🎁 送单辛苦啦！偷偷告诉你：在设置里输入兑换码 vip666，领 🪙6666 金币',6500);SFX.ding&&SFX.ding();}}
// ===== license & tickets =====
const LIC=Object.assign({ok:false,got:false,pts:12,s2:false,hist:[],retk:0},SAVE.lic||{});LIC.got=LIC.got||LIC.ok;SAVE.lic=LIC;
function showTicket(html){const e=$('ticket');e.innerHTML=html+'<b class="xclose" onpointerdown="event.preventDefault();event.stopPropagation();this.parentNode.style.display=\'none\'">✕</b>';e.style.display='block';clearTimeout(showTicket.t);showTicket.t=setTimeout(()=>e.style.display='none',4200);}
function ticket(name,fineM,ptsM,fineB){if(exam){if(exam.kind===3)examFail(`违反交通信号或标线：${name}`);return;}{const iv=invGet();if(iv.freecard>0){iv.freecard--;saveCoins();SFX.power&&SFX.power();toast(`🎫 免罚金卡生效！「${name}」不罚款不记分（剩 ${iv.freecard} 张）`,2800);return;}}
  if(typeof orders!=='undefined')orders.forEach(o=>o.viol++);
  const motor=drive!=='bike';const fine=motor?fineM:fineB,pts=motor?ptsM:0;const who=nearPolice()?'👮 交警拦停':'📸 电子眼抓拍';SFX.siren();
  let revoked=false,reason='';
  if(coins<fine){coins=0;if(motor&&LIC.ok){revoked=true;reason=`罚款 🪙${fine} 交不起，驾照被吊销`;}}else coins-=fine;
  if(motor&&!revoked&&LIC.ok&&pts){LIC.pts=Math.max(0,LIC.pts-pts);if(LIC.pts<=0){if(!LIC.reform){setTimeout(reformScene,1600);}else{revoked=true;reason='12 分已经扣完';}}}
  LIC.hist.unshift(`${name} · 罚 🪙${fine}${pts?` · 记 ${pts} 分`:''}`);LIC.hist.length=Math.min(LIC.hist.length,6);
  showTicket(`<b>${who}</b><br>${name} · 罚款 🪙${fine}${pts?` · 记 ${pts} 分`:''}<br><span style="opacity:.85;font-size:12.5px">${motor?(LIC.ok?`驾照剩余 ${LIC.pts}/12 分`:'驾照已吊销'):'自行车违法只罚款，不记分、不影响驾照'} · 金币 ${coins}</span>`);
  saveCoins();if(revoked)revoke(reason);}
function revoke(reason){LIC.ok=false;LIC.pts=0;LIC.s2=false;saveCoins();if(drive!=='bike')applyEquip();
  $('rvR').textContent=reason;if(state==='ride'){resumeState='ride';state='paused';}$('revoked').style.display='flex';SFX.lose();}
const rule={spT:0,spC:0,wwT:0,wwC:0,hT:0,hC:0,cbC:0,hornC:0,beltT:0,beltC:0,latRef:null,latDir:-1,latT:0,lcC:0,clC:0,lastLat:0,inStopT:0,inStopDone:false,enDir:0,enSig:0};
const acc={cool:0,t:0};let phone={next:70+Math.random()*60,ring:0};
function accident(){if(exam){if(exam.kind===3)examFail('发生交通事故');return;}if(acc.cool>0||(state!=='ride'&&state!=='crash'))return;acc.cool=8;
  ticket('发生交通事故（负全部责任），赔偿对方损失',300,0,50);if(drive!=='bike'&&state==='ride'){acc.t=5;setTimeout(()=>{if(acc.t>0)toast('⚠️ 发生事故！5 秒内必须停车，否则算肇事逃逸',3000);},4300);}}
function rulesExtra(dt,motor,rx,rz){acc.cool-=dt;rule.hornC-=dt;rule.beltC-=dt;rule.lcC-=dt;rule.clC-=dt;
  // 肇事逃逸
  if(acc.t>0){if(v<.3){acc.t=0;toast('✅ 已停车，事故处理完毕');}else{acc.t-=dt;if(acc.t<=0)ticket('交通肇事逃逸',2000,12,0);}}
  if(exam)return;
  rule.nmC=(rule.nmC||0)-dt;rule.scC=(rule.scC||0)-dt;
  {const ri=roadInfo(player.position.x,player.position.z);
   if(ri.along!=null&&!nearUturn()){const lat=latOff();
     if(motor&&lat>RH-1.9&&v>3){rule.nmT=(rule.nmT||0)+dt;if(rule.nmT>3&&rule.nmC<=0){rule.nmC=30;rule.nmT=0;ticket('机动车违法占用非机动车道行驶',100,0,0);}}
     else rule.nmT=0;}
   const sch=inSchool(player.position.x,player.position.z);
   if(sch){if(!rule.inSch){rule.inSch=true;toast('🏫 进入学校区域 · 限速 30 km/h · 注意儿童',2600);}const k=v*3.6;
     if(motor&&k>33){rule.scT=(rule.scT||0)+dt;if(rule.scT>1.5&&rule.scC<=0){rule.scC=15;rule.scT=0;if(k>45)ticket(`学校区域超速50%以上（${Math.round(k)}/30）`,1000,6,0);else ticket(`学校区域超速（${Math.round(k)}/30）`,200,3,0);}}else rule.scT=0;}
   else if(ri.along!=null)rule.inSch=false;}
  // 安全带
  if(drive==='car'&&!belt&&v>3){rule.beltT+=dt;if(rule.beltT>5&&rule.beltC<=0){rule.beltC=60;rule.beltT=0;ticket('驾驶时未按规定使用安全带',50,1,0);}}else rule.beltT=0;
  // 手持电话
  phone.next-=dt;if(phone.next<=0&&!CALL&&!INT.on){phone.next=70+Math.random()*70;ringStart(Math.random()<.35);}
  const inside=Math.abs(rx)<R&&Math.abs(rz)<R;
  // 路口内停车
  if(motor&&inside&&v<.2&&!rule.inStopDone){rule.inStopT+=dt;if(rule.inStopT>6){rule.inStopDone=true;ticket('在路口内停车，妨碍通行',100,1,0);}}
  // 压线 / 变道不打灯
  const d=dirIdx(heading),aligned=Math.abs(Math.cos(heading))>.95||Math.abs(Math.sin(heading))>.95;
  if(!inside&&aligned&&!(gear<0)&&(Math.abs(rx)>R+2||Math.abs(rz)>R+2)){const lat=latOff();
    if(rule.latDir!==d){rule.latDir=d;rule.latRef=lat;rule.latT=0;rule.lastLat=lat;}
    if(motor&&rule.lastLat>.3&&lat<-.3&&rule.clC<=0&&!nearUturn()){rule.clC=15;ticket('压越道路中心黄实线',200,3,0);}
    rule.lastLat=lat;rule.latT+=dt;
    if(motor&&Math.abs(lat-rule.latRef)>2&&rule.lcC<=0){const need=lat<rule.latRef?-1:1;if(sig!==need){rule.lcC=10;ticket('变更车道未按规定使用转向灯',100,1,0);}rule.latRef=lat;rule.latT=0;}
    if(rule.latT>3){rule.latT=0;rule.latRef=lat;}}
  else rule.latDir=-1;}
$('beltB').addEventListener('pointerdown',e=>{e.preventDefault();belt=!belt;$('beltB').classList.toggle('on2',belt);toast(belt?'✅ 已系安全带':'⚠️ 安全带已解开',1200);SFX.tick(.1);});
function rulesUpdate(dt){const motor=drive!=='bike';rule.spC-=dt;rule.wwC-=dt;rule.hC-=dt;
  const k=v*3.6;if(motor&&!exam){if(k>66){rule.spT+=dt;if(rule.spT>1.5&&rule.spC<=0){rule.spC=15;rule.spT=0;if(k>90)ticket(`超速50%以上（${Math.round(k)}/60）`,1000,6,0);else if(k>72)ticket(`超速20%~50%（${Math.round(k)}/60）`,200,3,0);else ticket(`超速未达20%（${Math.round(k)}/60）`,50,0,0);}}else rule.spT=0;}
  const p=player.position,nx=Math.round(p.x/B)*B,nz=Math.round(p.z/B)*B,rx=p.x-nx,rz=p.z-nz;const fx=Math.cos(heading),fz=-Math.sin(heading);let wrong=false;
  if(!(Math.abs(rx)<R&&Math.abs(rz)<R)&&!(gear<0)){if(Math.abs(rz)<RH&&Math.abs(fx)>.9)wrong=rz*Math.sign(fx)<-.8;else if(Math.abs(rx)<RH&&Math.abs(fz)>.9)wrong=rx*Math.sign(fz)>.8;}
  if(wrong&&v>1.5&&!nearUturn()){rule.wwT+=dt;if(rule.wwT>2&&rule.wwC<=0){rule.wwC=20;rule.wwT=0;ticket('逆行（我国道路靠右行驶）',200,3,20);}}else rule.wwT=0;
  rulesExtra(dt,motor,rx,rz);
  if(drive==='moto'&&SAVE.equip.hat!=='helmet'&&v>3&&!exam){rule.hT+=dt;if(rule.hT>4&&rule.hC<=0){rule.hC=60;rule.hT=0;ticket('驾驶摩托车未戴安全头盔',50,1,0);}}}
function renderLic(){$('lcS').innerHTML=LIC.ok?`状态：<b style="color:#7dffa0">有效</b> · 剩余 <b>${LIC.pts}</b> / 12 分`:`状态：<b style="color:#ff7a7a">${LIC.got?'已吊销':'未考取'}</b> · 科目二 ${LIC.s2?'已通过':'未通过'} → 科目四 未通过`;
  $('lcD').innerHTML=Array.from({length:12},(_,i)=>`<span class="${i<(LIC.ok?LIC.pts:0)?'on':''}"></span>`).join('');
  $('lcH').innerHTML=LIC.hist.length?'最近记录：<br>'+LIC.hist.join('<br>'):'暂无违法记录';
  const b=$('lcB');b.innerHTML='';const add=(t,cls,fn)=>{const e=document.createElement('button');e.className='pill glass'+(cls?' '+cls:'');e.textContent=t;e.onclick=fn;b.appendChild(e);};
  if(LIC.ok){add('练习科目二','',()=>openIntro(2,true));add('练习科目四','',()=>openK4(true));}
  else{if(!LIC.s2)add(`预约科目二 🪙${FEE}`,'primary',()=>openIntro(2,false));else add(LIC.retk>0?`补考科目四（剩 ${LIC.retk} 次）`:`预约科目四 🪙${FEE}`,'primary',()=>openK4(false,LIC.retk>0));
    add(`💰 直接买驾照 🪙${LIC_PRICE}`,'',()=>{if(coins<LIC_PRICE){toast(`金币不够，还差 🪙${LIC_PRICE-coins}`,2600);return;}coins-=LIC_PRICE;LIC.ok=true;LIC.got=true;LIC.pts=12;LIC.s2=false;LIC.retk=0;LIC.hist=[];unlock('lic');saveCoins();SFX.win();toast('🪪 驾照到手！可以去商店买车啦（仅限游戏内，现实中请认真考试）',3800);renderLic();});}
  add('返回','',closeLic);}
let licFrom=null;const FEE=150,LIC_PRICE=1000,RETAKES=5;

// ===== 科目四 · 安全文明驾驶常识（游戏版） =====
const K4LAST=['最后一题：作者大大帅不帅？',['帅呀','超级帅好吧','我老公级别的呀','傻子吧这个游戏策划'],-1];
let k4=null;
function openK4(practice,free){$('lic').style.display='none';
  if(free&&!practice){if(free!=='entry'){LIC.retk=Math.max(0,LIC.retk-1);saveCoins();}}
  else if(!practice){if(coins<FEE){toast(`考试费不够，还差 🪙${FEE-coins}，先骑车做任务赚金币吧`,2800);openLic(licFrom||'start');return;}coins-=FEE;LIC.retk=RETAKES;saveCoins();}
  const pool=K4POOL.slice().sort(()=>Math.random()-.5).slice(0,4).map(q=>{const opts=q[1].map((t,i)=>({t,ok:i===q[2]})).sort(()=>Math.random()-.5);return {q:q[0],opts};});
  pool.push({q:K4LAST[0],opts:K4LAST[1].map((t,i)=>({t,ok:i<3,troll:i===3})),last:true});
  k4={practice,qs:pool,i:0,score:0,log:[]};initAudio();k4Show();$('quiz').style.display='flex';}
function k4Show(){const q=k4.qs[k4.i];$('qN').textContent=`科目四${k4.practice?'（练习）':''} · 第 ${k4.i+1} / ${k4.qs.length} 题`;$('qQ').textContent=q.q;$('qT').textContent=`当前得分 ${k4.score} · 60 分及格`;
  const o=$('qO');o.innerHTML='';q.opts.forEach((op,idx)=>{const b=document.createElement('button');b.className='pill glass qopt';b.textContent=`${'ABCD'[idx]}. ${op.t}`;
    b.onclick=()=>{if(k4.lock)return;k4.lock=true;
      if(op.troll){b.style.background='rgba(255,60,60,.75)';SFX.lose();setTimeout(()=>{k4.lock=false;k4End(false,true);},900);return;}
      if(op.ok){k4.score+=20;b.style.background='rgba(60,200,110,.8)';SFX.tick&&SFX.tick(.15);}
      else{b.style.background='rgba(255,60,60,.75)';[...o.children].forEach((c,j)=>{if(q.opts[j].ok)c.style.background='rgba(60,200,110,.55)';});k4.log.push(`第 ${k4.i+1} 题答错：${q.q}`);SFX.bump();}
      setTimeout(()=>{k4.lock=false;k4.i++;if(k4.i>=k4.qs.length)k4End(k4.score>=60,false);else k4Show();},q.last?1100:800);};
    o.appendChild(b);});}
function k4End(pass,troll){$('quiz').style.display='none';const pr=k4.practice;
  if(troll){if(!pr){LIC.ok=false;LIC.s2=false;LIC.pts=0;LIC.retk=0;saveCoins();}
    $('xeE').textContent='';$('xeT').textContent=`科目四${pr?'（练习）':''} 不合格`;$('xeS').textContent='考官很生气';
    $('xeR').textContent=pr?'练习模式不影响驾照，但考官已经记住你了。':'敢说作者是傻子？直接不合格，驾照考试从科目二重新开始。';$('xeL').innerHTML='最后一题选了 D';}
  else{if(pass&&!pr){LIC.ok=true;LIC.got=true;LIC.pts=12;LIC.s2=false;LIC.hist=[];unlock('lic');saveCoins();}
    $('xeE').textContent='';$('xeT').textContent=`科目四${pr?'（练习）':''} ${pass?'合格':'不合格'}`;$('xeS').textContent=`成绩 ${k4.score} 分 · 60 分合格`;
    $('xeR').textContent=pass?(pr?'常识掌握得不错！':'恭喜拿到驾照！现在可以去商店买车、骑摩托啦。'):'没到 60 分，再复习一下游戏规则吧。';
    $('xeL').innerHTML=k4.log.length?k4.log.join('<br>'):'全部答对';}
  pass&&!troll?SFX.win():SFX.lose();
  const b=$('xeB');b.innerHTML='';const add=(t,cls,fn)=>{const e=document.createElement('button');e.className='pill glass'+(cls?' '+cls:'');e.textContent=t;e.onclick=fn;b.appendChild(e);};
  if(!pass||troll){const fr=!pr&&!troll&&LIC.retk>0;add(pr?'再练一次':(troll?`重新预约科目二 🪙${FEE}`:fr?`免费补考（剩 ${LIC.retk} 次）`:`重新预约科目四 🪙${FEE}`),'primary',()=>{$('exEnd').style.display='none';if(troll&&!pr)openIntro(2,false);else openK4(pr,fr);});}
  add('返回驾校','',()=>{$('exEnd').style.display='none';openLic(licFrom||'start');});
  k4=null;$('exEnd').style.display='flex';}

function openLic(from){licFrom=from;['start','settings','revoked'].forEach(i=>$(i).style.display='none');renderLic();$('lic').style.display='flex';}
function closeLic(){$('lic').style.display='none';if(licFrom==='start')showStart();else if(licFrom==='settings')$('settings').style.display='flex';else{if(state==='paused')state=resumeState;}}
$('openLic').onclick=()=>openLic('settings');$('licBtn').onclick=()=>openLic('start');
$('rvGo').onclick=()=>openLic('revoked');$('rvOk').onclick=()=>{$('revoked').style.display='none';if(state==='paused')state=resumeState;};
let introK=2,introP=false;
function openIntro(k,practice){introK=k;introP=practice;belt=false;$('lic').style.display='none';
  $('ixT').textContent=k===2?'科目二 · 场地驾驶技能考试':'科目三 · 道路驾驶技能考试';
  $('ixD').innerHTML=k===2?'考试车：C2 自动挡教练车 · 满分 100，<b>60 分合格</b><br>只考两项：直角转弯 → 曲线行驶<br>压线扣 10 分、中途停车扣 5 分，不会直接挂科<br>左侧 ⬅ ➡ 转向灯，🎥 切换俯视'
   :'在真实城市道路上考试，跟随考试员语音指令 · 满分 100，<b>90 分合格</b><br>灯光模拟 → 起步 → 直线行驶 → 变更车道 → 路口直行/左转/右转 → 掉头 → 靠边停车<br>闯红灯、逆行、超速（60）、发生碰撞、灯光操作错误、不按指令行驶 = 不合格<br>起步、转弯、变道、停车前要提前打灯 3 秒，否则扣 10 分';
  $('ixF').textContent=practice?'练习模式 · 免费，不影响驾照':`考试费 🪙${FEE}（含 ${RETAKES} 次免费补考）· 当前 🪙${coins}`;
  $('belt').textContent='🔗 系安全带';$('belt').classList.remove('primary');$('exIntro').style.display='flex';}
$('belt').onclick=()=>{belt=!belt;$('belt').textContent=belt?'✅ 已系安全带':'🔗 系安全带';SFX.tick(.1);};
$('ixGo').onclick=()=>{initAudio();if(!belt){const bb=$('belt');bb.classList.add('primary');bb.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:450,iterations:3});toast('🔗 先点「系安全带」，再开始考试',2400);return;}if(!introP){if(coins<FEE){toast(`考试费不够，还差 🪙${FEE-coins}，先骑车做任务赚金币吧`,2800);return;}coins-=FEE;LIC.retk=RETAKES;saveCoins();}$('exIntro').style.display='none';beginExam(introK,introP,false);};
$('ixNo').onclick=()=>{$('exIntro').style.display='none';openLic(licFrom||'start');};
function say(t,ms){toast(t,ms||3200);try{if(window.speechSynthesis&&!muted){const u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';u.rate=1.1;speechSynthesis.cancel();speechSynthesis.speak(u);}}catch(e){}}

// ===== exam field (科目二) =====
const examField=new THREE.Group();scene.add(examField);examField.visible=false;
const fGround=mesh(new THREE.PlaneGeometry(520,200),M(0x8e9089,{roughness:1}),examField);fGround.rotation.x=-PI/2;fGround.position.set(140,0,-15);fGround.castShadow=false;
const lineM=M(0xf2c200,{roughness:.7}),padM=M(0x46474c,{roughness:.95});
function fLine(g,x1,z1,x2,z2,y1,y2){y1=y1||0;y2=y2==null?y1:y2;const a=V(x1,y1+.03,z1),b=V(x2,y2+.03,z2);const L=a.distanceTo(b);const o=mesh(new THREE.BoxGeometry(L,.03,.15),lineM,g);o.castShadow=false;o.position.copy(a).lerp(b,.5);
  o.rotation.y=Math.atan2(-(z2-z1),Math.hypot(x2-x1,0)*Math.sign(x2-x1||1));o.rotation.y=Math.atan2(-(z2-z1),x2-x1);o.rotateZ(Math.atan2(y2-y1,Math.hypot(x2-x1,z2-z1)));return o;}
function fArc(g,cx,cz,r,a0,a1){const n=40;for(let i=0;i<n;i++){const t0=a0+(a1-a0)*i/n,t1=a0+(a1-a0)*(i+1)/n;fLine(g,cx+r*Math.cos(t0),cz+r*Math.sin(t0),cx+r*Math.cos(t1),cz+r*Math.sin(t1));}}
function fPad(g,x1,z1,x2,z2){const p=mesh(new THREE.PlaneGeometry(Math.abs(x2-x1),Math.abs(z2-z1)),padM,g);p.rotation.x=-PI/2;p.position.set((x1+x2)/2,.012,(z1+z2)/2);p.castShadow=false;}
function fSign(g,txt,x,z){const t=canvasTex(512,128,(c,w,h)=>{c.fillStyle='#1d4fa8';c.fillRect(0,0,w,h);c.strokeStyle='#fff';c.lineWidth=8;c.strokeRect(8,8,w-16,h-16);c.fillStyle='#fff';c.font='bold 64px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(txt,w/2,h/2+4);});
  const b=mesh(new THREE.PlaneGeometry(4,1),M(0xffffff,{map:t,side:THREE.DoubleSide}),g);b.position.set(x,2.6,z);for(const s of[-1,1])tube(V(x+s*1.8,0,z),V(x+s*1.8,2.1,z),.05,.05,poleM,g);}
const rampY=x=>x<=0?0:x<10?x*.12:x<16?1.2:x<26?1.2-(x-16)*.12:0;
const WHEELS=[[1.18,.755],[1.18,-.755],[-1.13,.755],[-1.13,-.755]],CORN=[[2.0,.875],[2.0,-.875],[-2.0,.875],[-2.0,-.875]];
const inR=(x,z,x1,x2,z1,z2)=>x>=x1&&x<=x2&&z>=z1&&z<=z2;
const FIELD=[
 {name:'倒车入库',o:V(0,0,0),s:[7,3.5,0],lim:210,stop:'ded',tip:'挂 R 挡倒车，把车完整倒进车库并停稳',
  inside:(x,z)=>inR(x,z,-12,12,0,7)||inR(x,z,-1.2,1.2,-4.8,0.01),done:(c)=>v<.05&&c.every(([x,z])=>inR(x,z,-1.2,1.2,-4.8,0))},
 {name:'侧方停车',o:V(70,0,0),s:[7,-1.8,0],lim:90,stop:'ded',tip:'倒车进入右侧车位，车身完全入位后停稳',
  inside:(x,z)=>inR(x,z,-14,14,-6,0)||inR(x,z,-3.5,3.5,-0.01,2.6),done:(c)=>v<.05&&c.every(([x,z])=>inR(x,z,-3.5,3.5,0,2.6))},
 {name:'坡道定点停车与起步',o:V(140,0,0),s:[-8,.5,0],ramp:true,tip:'上坡把前保险杠停在桩杆线上，靠右不超过30厘米，然后起步不后溜',
  inside:(x,z)=>inR(x,z,-12,32,-1.75,1.75),done:()=>exam.phase==='go'&&exam.lx>24},
 {name:'直角转弯',o:V(210,0,0),s:[-12,.4,0],stop:'fail',sigTurn:-1,tip:'打左转向灯，向左直角转弯，车轮不能压线',
  inside:(x,z)=>inR(x,z,-15,1.75,-1.75,1.75)||inR(x,z,-1.75,1.75,-17,1.75),done:()=>exam.lz<-12},
 {name:'曲线行驶',o:V(280,0,0),s:[-10,0,0],stop:'fail',tip:'沿S弯道行驶，车轮不能压线，中途不能停车',
  inside:(x,z)=>inR(x,z,-12,0.5,-1.75,1.75)||(x>=-0.3&&Math.abs(Math.hypot(x,z+7.5)-7.5)<=1.75)||(x<=0.3&&Math.abs(Math.hypot(x,z+22.5)-7.5)<=1.75)||inR(x,z,-0.5,14,-31.75,-28.25),done:()=>exam.lx>8&&exam.lz<-26}];
(function(){const g0=new THREE.Group();examField.add(g0);
  {const g=new THREE.Group();g.position.copy(FIELD[0].o);examField.add(g);fPad(g,-13,-6,13,8);fLine(g,-12,7,12,7);fLine(g,-12,0,-1.2,0);fLine(g,1.2,0,12,0);fLine(g,-1.2,0,-1.2,-4.8);fLine(g,1.2,0,1.2,-4.8);fLine(g,-1.2,-4.8,1.2,-4.8);fSign(g,'倒车入库',0,-9);}
  {const g=new THREE.Group();g.position.copy(FIELD[1].o);examField.add(g);fPad(g,-15,-7,15,4);fLine(g,-14,-6,14,-6);fLine(g,-14,0,-3.5,0);fLine(g,3.5,0,14,0);fLine(g,-3.5,0,-3.5,2.6);fLine(g,3.5,0,3.5,2.6);fLine(g,-3.5,2.6,3.5,2.6);fSign(g,'侧方停车',0,6);}
  {const g=new THREE.Group();g.position.copy(FIELD[2].o);examField.add(g);fPad(g,-13,-3,0,3);fPad(g,26,-3,33,3);
    const segs=[[0,10],[10,16],[16,26]];for(const[a,b]of segs){const ya=rampY(a),yb=rampY(b);const L=Math.hypot(b-a,yb-ya);const bx=mesh(new THREE.BoxGeometry(L,.3,6),padM,g);bx.position.set((a+b)/2,(ya+yb)/2-.15,0);bx.rotation.z=Math.atan2(yb-ya,b-a);
      for(const s of[-1,1])fLine(g,a,s*1.75,b,s*1.75,ya,yb);}
    for(const s of[-1,1]){fLine(g,-12,s*1.75,0,s*1.75);fLine(g,26,s*1.75,32,s*1.75);}
    fLine(g,7,-1.75,7,1.75,rampY(7),rampY(7));const pole=new THREE.Group();pole.position.set(7,rampY(7),-2.4);g.add(pole);
    for(let i=0;i<6;i++)mesh(new THREE.CylinderGeometry(.05,.05,.2,10),i%2?M(0xffffff):M(0xd62828),pole).position.y=.1+i*.2;fSign(g,'坡道定点停车与起步',8,-6);}
  {const g=new THREE.Group();g.position.copy(FIELD[3].o);examField.add(g);fPad(g,-16,-18,3,3);fLine(g,-15,1.75,1.75,1.75);fLine(g,1.75,1.75,1.75,-17);fLine(g,-15,-1.75,-1.75,-1.75);fLine(g,-1.75,-1.75,-1.75,-17);fSign(g,'直角转弯',-9,-8);}
  {const g=new THREE.Group();g.position.copy(FIELD[4].o);examField.add(g);fPad(g,-12,-33,14,3);for(const s of[-1,1])fLine(g,-12,s*1.75,0,s*1.75);
    fArc(g,0,-7.5,5.75,PI/2,-PI/2);fArc(g,0,-7.5,9.25,PI/2,-PI/2);fArc(g,0,-22.5,5.75,PI/2,PI*1.5);fArc(g,0,-22.5,9.25,PI/2,PI*1.5);fLine(g,0,-28.25,14,-28.25);fLine(g,0,-31.75,14,-31.75);fSign(g,'曲线行驶',-10,-12);}
  fSign(g0,'🦩 鹈鹕驾校',-20,14);
})();
let fieldHidden=[],cityPos=V(),cityHead=0;
function enterField(){if(fieldOn)return;fieldOn=true;fieldHidden=[];for(const o of scene.children){if(o===player||o===examField||o===loose||o.isLight||o===stars||clouds.includes(o)||o===sun.target)continue;if(o.visible){o.visible=false;fieldHidden.push(o);}}
  for(const c of cars)disposeCar(c);cars.length=0;obst.length=0;examField.visible=true;}
function leaveField(){fieldOn=false;fieldHidden.forEach(o=>o.visible=true);fieldHidden=[];examField.visible=false;player.position.y=0;player.rotation.set(0,heading,0);lastBI=1e9;lastBJ=1e9;}
function beginExam(kind,practice,retake){if(!retake||!exam){cityPos.copy(player.position);cityHead=heading;}
  exam={kind,practice,retake,score:100,log:[],t:0,short:''};
  ['start','settings','lic','exIntro','exEnd','end','revoked','crashed'].forEach(i=>$(i).style.display='none');
  hardReset();beacon.visible=false;fishes.forEach(f=>{f.alive=false;f.g.visible=false;});camTop=false;camInit=false;
  if(kind===2){enterField();setModel('trainer');exam.seq=0;e2Item(E2SEQ[0]);}
  else{if(fieldOn)leaveField();setModel('trainer');const ni=Math.round(cityPos.x/B),nj=Math.round(cityPos.z/B);player.position.set(ni*B+25,0,nj*B+5.3);heading=0;player.rotation.set(0,0,0);
    for(let i=cars.length-1;i>=0;i--)if(cars[i].pos.distanceTo(player.position)<25){disposeCar(cars[i]);cars.splice(i,1);}exam.step=-1;exam.wait=0;exam.inI=null;}
  state='ride';peekCard();updMissionUI(true);

  if(kind===3)runQuiz();}
function deduct(n,why){if(!exam||state==='end')return;exam.score-=n;exam.log.push(`−${n} ${why}`);toast(`📝 扣 ${n} 分：${why}`,2600);SFX.bump();
  if(exam.score<(exam.kind===2?60:90))examEnd(false,'扣分后成绩低于合格线');}
function examFail(why){if(!exam||state==='end')return;exam.log.push(`不合格：${why}`);exam.score=0;examEnd(false,why);}
let quizTimer=null;
function examEnd(pass,why){if(!exam)return;const crashed=state==='crash';state='end';gas=braking=kL=kR=false;clearInterval(quizTimer);$('quiz').style.display='none';
  const k=exam.kind,need=k===2?60:90;pass=pass&&exam.score>=need;
  if(pass&&!exam.practice){if(k===2)LIC.s2=true;else{LIC.ok=true;LIC.pts=12;LIC.s2=false;LIC.hist=[];unlock('lic');}saveCoins();}if(pass&&k===2&&exam.score>=100)unlock('s2100');
  pass?SFX.win():SFX.lose();say(pass?'考试合格':'考试不合格',2500);
  $('xeE').textContent=pass?(k===3&&!exam.practice?'🪪':'✅'):'❌';$('xeT').textContent=`科目${k===2?'二':'三'}${exam.practice?'（练习）':''} ${pass?'合格':'不合格'}`;
  $('xeS').textContent=`成绩 ${Math.max(0,exam.score)} 分 · ${need} 分合格`;$('xeR').textContent=pass?(k===3&&!exam.practice?'🎉 恭喜！驾照恢复，12 分重新计算，可以开车骑摩托啦':k===2&&!exam.practice?'科目二通过，接下来考科目四（5 道题，60 分及格）':'表现不错！'):why;
  $('xeL').innerHTML=exam.log.length?exam.log.join('<br>'):'全程无扣分';
  const b=$('xeB');b.innerHTML='';const add=(t,cls,fn)=>{const e=document.createElement('button');e.className='pill glass'+(cls?' '+cls:'');e.textContent=t;e.onclick=fn;b.appendChild(e);};
  if(pass&&k===2&&!exam.practice)add(LIC.retk>0?'进入科目四（免费）':`预约科目四 🪙${FEE}`,'primary',()=>{$('exEnd').style.display='none';exitExam(true);licFrom='start';state='menu';openK4(false,LIC.retk>0?'entry':false);});
  if(!pass&&!exam.practice&&LIC.retk>0)add(`免费补考（剩 ${LIC.retk} 次）`,'primary',()=>{LIC.retk--;saveCoins();$('exEnd').style.display='none';beginExam(k,false,true);});
  if(!pass&&!exam.practice&&LIC.retk<=0)add(`重新预约 🪙${FEE}`,'primary',()=>{$('exEnd').style.display='none';exitExam(true);licFrom='start';state='menu';openIntro(k,false);});
  if(!pass&&exam.practice)add('再练一次','primary',()=>{$('exEnd').style.display='none';beginExam(k,true,true);});
  add('返回城市','',()=>{$('exEnd').style.display='none';exitExam(false);});
  setTimeout(()=>{$('exEnd').style.display='flex';},crashed?1500:700);}
function exitExam(keepMenu){if(fieldOn)leaveField();exam=null;camTop=false;camInit=false;player.position.copy(cityPos);player.position.y=0;heading=cityHead;player.rotation.set(0,heading,0);hardReset();applyEquip();
  if(!keepMenu)newMission();}
const E2SEQ=[3,4];
function e2Item(i){const it=FIELD[i];Object.assign(exam,{item:i,t:0,stopT:0,holdT:0,moved:false,phase:'approach',rollV:0,rollD:0,trans:0,sigDone:false,stopDed:false,lnC:0,short:it.name});
  player.position.set(it.o.x+it.s[0],0,it.o.z+it.s[1]);heading=it.s[2];player.rotation.set(0,heading,0);v=0;gear=1;gearMode='D';sig=0;updSigUI();if(window.updShift)updShift();camInit=false;
  say(`${it.name}：${it.tip}`,4200);peekCard();}
function e2Update(dt){const it=FIELD[exam.item];if(exam.trans>0){exam.trans-=dt;if(exam.trans<=0){exam.seq++;if(exam.seq<E2SEQ.length)e2Item(E2SEQ[exam.seq]);else examEnd(true,'');}return;}
  exam.t+=dt;const o=it.o,lx=player.position.x-o.x,lz=player.position.z-o.z;exam.lx=lx;exam.lz=lz;
  const fx=Math.cos(heading),fz=-Math.sin(heading),rx=-fz,rz=fx;
  if(it.ramp){const sl=(rampY(lx+.3)-rampY(lx-.3))/.6,pit=Math.atan(sl)*fx;player.position.y=rampY(lx);player.rotation.z=pit;
    v-=9.8*Math.sin(pit)*gear*dt*.6;if(v<0)v=0;
    if(v<.05&&!gas&&!braking&&sl>.02){exam.rollV=Math.min(2,exam.rollV+1.4*dt);}else if(braking)exam.rollV=0;else if(gas)exam.rollV=Math.max(0,exam.rollV-5*dt);
    if(exam.rollV>0){player.position.x-=fx*exam.rollV*dt;player.position.z-=fz*exam.rollV*dt;if(exam.phase==='hold')exam.rollD+=exam.rollV*dt;}
    const front=lx+2.0*fx;
    if(exam.phase==='approach'){if(front>7.6)return examFail('坡道：未在桩杆线处定点停车');
      if(exam.moved&&v<.05&&lx>0){const d=front-7,rd=1.75-(lz+.875);exam.phase='hold';exam.hold0=exam.t;exam.rollD=0;
        if(Math.abs(d)>.5)return examFail(`坡道：前保险杠距桩杆线 ${Math.round(Math.abs(d)*100)} 厘米，超过50厘米`);
        if(rd>.5)return examFail(`坡道：车身距右侧边线 ${Math.round(rd*100)} 厘米，超过50厘米`);
        if(Math.abs(d)>.2)deduct(10,'坡道：前保险杠未定于桩杆线上');if(rd>.3)deduct(10,'坡道：车身距右侧边线超过30厘米');if(state!=='end')say('定点停车完成，请坡道起步，注意不要后溜');}}
    else if(exam.phase==='hold'){if(exam.rollD>.3)return examFail('坡道起步：车辆后溜超过30厘米');if(exam.t-exam.hold0>30&&lx<9)return examFail('坡道起步：停车后起步时间超过30秒');if(lx>11)exam.phase='go';}}
  if(!exam.moved&&v>.3)exam.moved=true;
  exam.lnC=(exam.lnC||0)-dt;for(const[a,b]of WHEELS){if(!it.inside(lx+fx*a+rx*b,lz+fz*a+rz*b)){if(exam.lnC<=0){exam.lnC=2.5;deduct(10,`${it.name}：车轮压线`);}break;}}
  if(it.lim&&exam.t>it.lim)return examFail(`${it.name}：超过规定时间 ${it.lim} 秒`);
  if(exam.moved&&v<.05)exam.stopT+=dt;else{if(exam.stopT>2&&it.stop==='ded')deduct(5,`${it.name}：中途停车`);exam.stopT=0;}
  if(it.stop==='fail'&&exam.stopT>2&&!exam.stopDed){exam.stopDed=true;deduct(5,`${it.name}：中途停车`);}
  if(it.sigTurn&&!exam.sigDone&&Math.abs(heading-it.s[2])>.3){exam.sigDone=true;if(sig!==it.sigTurn)deduct(5,`${it.name}：转弯前未开左转向灯`);}
  const c=CORN.map(([a,b])=>[lx+fx*a+rx*b,lz+fz*a+rz*b]);
  if(it.done(c)){exam.holdT+=dt;if(exam.holdT>(it.ramp||it.stop==='fail'?.05:1)){SFX.ding();toast(`✅ ${it.name} 完成`,1500);exam.trans=1.6;}}else exam.holdT=0;}

// ===== 科目三 =====
const LQ=[['夜间在没有路灯、照明不良条件下行驶','远光灯'],['夜间同方向近距离跟车行驶','近光灯'],['夜间与机动车会车','近光灯'],['夜间在有路灯、照明良好的道路上行驶','近光灯'],['夜间通过急弯、坡路、拱桥、人行横道或者没有交通信号灯控制的路口','远近光交替'],['夜间超越前方车辆','远近光交替'],['夜间在路边临时停车','示廓灯＋危险报警闪光灯'],['在雾天行驶','雾灯＋危险报警闪光灯']];
const LOPT=['近光灯','远光灯','远近光交替','示廓灯＋危险报警闪光灯','雾灯＋危险报警闪光灯'];
function runQuiz(){state='paused';resumeState='ride';const pool=LQ.slice().sort(()=>Math.random()-.5);const qs=[['请开启前照灯','近光灯'],...pool.slice(0,4)];let k=0;
  $('qQ').textContent='下面将进行模拟夜间灯光使用考试，请在语音播报结束后 5 秒内做出相应的灯光操作';$('qN').textContent='灯光模拟';$('qO').innerHTML='';$('qT').textContent='';$('quiz').style.display='flex';
  say('下面将进行模拟夜间灯光使用考试，请在语音播报结束后5秒内做出相应的灯光操作',4000);
  const next=()=>{if(!exam||state==='end')return;if(k>=qs.length){$('quiz').style.display='none';state='ride';say('模拟夜间考试完成，请关闭所有灯光',2200);exam.wait=2.4;return;}
    const q=qs[k];$('qN').textContent=`灯光 ${k+1} / ${qs.length}`;$('qQ').textContent=q[0];say(q[0],2400);let left=5,done=false;
    const answer=o=>{if(done)return;done=true;clearInterval(quizTimer);if(o!==q[1]){examFail(`灯光：${q[0]} 应使用「${q[1]}」${o?`，你选了「${o}」`:'，未操作'}`);}else{SFX.ding();k++;setTimeout(next,700);}};
    const box=$('qO');box.innerHTML='';LOPT.forEach(o=>{const b=document.createElement('button');b.className='pill glass qopt';b.textContent=o;b.onclick=()=>answer(o);box.appendChild(b);});
    clearInterval(quizTimer);quizTimer=setInterval(()=>{left-=.1;$('qT').textContent=`⏱ ${Math.max(0,left).toFixed(1)} 秒`;if(left<=0)answer(null);},100);};
  setTimeout(next,4200);}
const dirIdx=h=>{const fx=Math.cos(h),fz=-Math.sin(h);return Math.abs(fx)>=Math.abs(fz)?(fx>0?0:2):(fz>0?1:3);};
function latOff(){const p=player.position,d=dirIdx(heading),nx=Math.round(p.x/B)*B,nz=Math.round(p.z/B)*B;return d===0?p.z-nz:d===2?-(p.z-nz):d===1?-(p.x-nx):(p.x-nx);}
function e3Steps(){const it=['直行','左转','右转'].sort(()=>Math.random()-.5);
  return[{k:'start',say:'请起步，继续完成考试',short:'起步'},{k:'straight',say:'请保持直线行驶',short:'直线行驶'},{k:'lane',say:'前方请变更车道',short:'变更车道'},
    ...it.map(x=>({k:'inter',turn:x,say:`前方路口${x}`,short:`路口${x}`})),{k:'uturn',say:'请在前方掉头口掉头',short:'掉头'},{k:'park',say:'请靠边停车',short:'靠边停车'}];}
function e3Next(){exam.step++;if(!exam.steps)exam.steps=e3Steps();const st=exam.steps[exam.step];if(!st){return examEnd(true,'');}
  Object.assign(st,{t:0,h0:heading,lat0:latOff(),dist:0,devT:0,mv:false,flag:false,pt:0,armT:exam.t});exam.cur=st;exam.short=st.short;say(st.say,3000);peekCard();}
function e3Update(dt){exam.t+=dt;const p=player.position;
  if(v*3.6>60.5){exam.spT=(exam.spT||0)+dt;if(exam.spT>1)return examFail('超过道路限速 60 km/h');}else exam.spT=0;
  const nx=Math.round(p.x/B)*B,nz=Math.round(p.z/B)*B,inside=Math.abs(p.x-nx)<R&&Math.abs(p.z-nz)<R;
  if(inside&&!exam.inI)exam.inI={dir:dirIdx(heading),kmh:v*3.6,sig,sigT,t:exam.t};
  else if(!inside&&exam.inI){const en=exam.inI,ex=dirIdx(heading);exam.inI=null;const st=exam.cur;
    if(st&&st.k==='inter'&&en.t>=st.armT){const want=st.turn==='直行'?en.dir:st.turn==='左转'?(en.dir+3)%4:(en.dir+1)%4;
      if(en.kmh>30)return examFail(`通过路口未减速慢行（${Math.round(en.kmh)} km/h）`);if(ex!==want)return examFail(`未按考试员指令${st.turn}`);
      if(st.turn==='直行'){if(en.sig)deduct(10,'直行通过路口错误使用转向灯');}else{const need=st.turn==='左转'?-1:1;if(en.sig!==need)deduct(10,`${st.turn}前未开转向灯`);else if(en.sigT<3)deduct(10,'开转向灯不足3秒即转向');}
      if(state!=='end'){SFX.ding();e3Done();}return;}}
  if(exam.wait>0){exam.wait-=dt;if(exam.wait<=0)e3Next();return;}
  const st=exam.cur;if(!st)return;st.t+=dt;
  const ang=Math.acos(clamp(Math.cos(heading-st.h0),-1,1));
  if(st.k==='start'){if(v>.5&&!st.mv){st.mv=true;if(sig!==-1)deduct(10,'起步前未开左转向灯');else if(sigT<3)deduct(10,'开转向灯不足3秒即起步');}if(st.mv&&v>4)e3Done();}
  else if(st.k==='straight'){const D4=[[1,0],[0,1],[-1,0],[0,-1]],ax=D4[dirIdx(st.h0)],dv=Math.acos(clamp(Math.cos(heading)*ax[0]-Math.sin(heading)*ax[1],-1,1));
    st.dist+=v*dt;if(dv>.2){st.devT+=dt;if(st.devT>1.5)return examFail('直线行驶：方向控制不稳');}else st.devT=0;if(st.dist>100)e3Done();}
  else if(st.k==='lane'){const dl=latOff()-st.lat0;if(Math.abs(dl)>.5&&!st.mv){st.mv=true;const need=dl<0?-1:1;if(sig!==need)deduct(10,'变更车道前未开转向灯');else if(sigT<3)deduct(10,'开转向灯不足3秒即变更车道');}
    if(Math.abs(dl)>=1.5)e3Done();else if(st.t>25)return examFail('未按指令变更车道');}
  else if(st.k==='inter'){if(st.t>90)return examFail(`未按指令${st.turn}`);}
  else if(st.k==='uturn'){if(ang>.45&&!st.mv){st.mv=true;if(sig!==-1)deduct(10,'掉头前未开左转向灯');else if(sigT<3)deduct(10,'开转向灯不足3秒即掉头');}if(Math.cos(heading-st.h0)<-.85)e3Done();else if(st.t>60)return examFail('未按指令掉头');}
  else if(st.k==='park'){if(v>1)st.flag=true;const lat=latOff();
    if(st.flag&&v<.05&&(sig===1||lat>RH-1.9)){st.pt+=dt;if(st.pt>1){if(inside)return examFail('在路口内停车');const dist=RH-(lat+.875);
      if(dist>.3)return examFail(`停车后车身距道路右侧边缘 ${Math.round(dist*100)} 厘米，超过30厘米`);if(sig!==1)deduct(10,'靠边停车前未开右转向灯');if(state!=='end')examEnd(true,'');}}else st.pt=0;
    if(st.t>60&&state!=='end')return examFail('未按指令靠边停车');}}
function e3Done(){exam.cur=null;exam.wait=3;}
function examUpdate(dt){if(exam.kind===2)e2Update(dt);else e3Update(dt);}
function updExamUI(){const e=exam;$('mE').textContent='📝';$('mT').textContent=`科目${e.kind===2?'二':'三'}${e.practice?'（练习）':''} · ${e.short||'准备'}`;
  if(e.kind===2){const it=FIELD[e.item||0];$('mP').textContent=it.tip;$('mS').textContent=`得分 ${e.score} · 项目 ${(e.item||0)+1}/5`+(it.lim?` · ⏱ ${Math.max(0,Math.ceil(it.lim-e.t))}s`:'')+` · ${gear>0?'D':'R'}挡`;}
  else{$('mP').textContent=e.cur?e.cur.say:'听考试员指令';$('mS').textContent=`得分 ${e.score} · 限速 60 · 第 ${Math.max(1,e.step+1)}/${e.steps?e.steps.length:9} 项`;}}
