'use strict';
// ── js/systems/health.js ──
// 生命：HP/受伤/医院、彩蛋（UFO/雕像）
// ===== HP, injuries, blood =====
let hp=100,dripD=0;
const bloodT=canvasTex(128,128,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='rgba(140,8,8,.9)';x.beginPath();x.arc(64,64,30,0,7);x.fill();for(let i=0;i<14;i++){const a=Math.random()*7,r=rnd(28,56);x.beginPath();x.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,rnd(3,11),0,7);x.fill();}});
const bloodM=new THREE.MeshBasicMaterial({map:bloodT,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3});
const bloods=[];let bloodI=0;for(let i=0;i<70;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),bloodM.clone());m.rotation.x=-PI/2;m.visible=false;scene.add(m);bloods.push({m,t:0});}
function blood(x,z,s){const b=bloods[bloodI++%bloods.length];b.t=90;b.m.visible=true;const r=roadInfo(x,z);b.m.position.set(x,r.off?.18:.02,z);b.m.rotation.z=Math.random()*7;b.m.scale.setScalar(s);b.m.material.opacity=.92;}
function updBlood(dt){for(const b of bloods)if(b.t>0){b.t-=dt;b.m.material.opacity=Math.min(.92,b.t/20);if(b.t<=0)b.m.visible=false;}
  if(state==='ride'&&hp<35){dripD+=v*dt;if(dripD>2.2){dripD=0;blood(player.position.x+rnd(-.2,.2),player.position.z+rnd(-.2,.2),rnd(.25,.45));}}}
function hurt(n,why){if(exam&&exam.kind===2)return;n=Math.round(n);if(n<=0)return;hp=Math.max(0,hp-n);const f=$('hurt');f.style.opacity=1;clearTimeout(hurt.t);hurt.t=setTimeout(()=>f.style.opacity=0,450);
  blood(player.position.x,player.position.z,clamp(n/18,.6,1.8));toast(`❤️ −${n}　${why}`,1800);
  if(hp<=0)setTimeout(hospital,1500);else if(hp<35)setTimeout(()=>toast('🩸 流血了！血量很低，吃鱼或者慢慢骑能回血',2600),1900);}
function hospital(){if(hp>0)return;const fee=Math.min(coins,200);coins-=fee;saveCoins();if(orders.length){orders.length=0;syncBag();updTarget();}unlock('hospital');$('crashed').style.display='none';
  choice('🚑 你被送进了医院',`医生给鹈鹕缝了 8 针，还绑了个蝴蝶结绷带。<br>医药费 🪙${fee}，手上的订单都被平台转给别的骑手了。`,[{t:'出院，继续骑',p:1,f:()=>{hp=100;stamina=100;if(pel.parent!==lean)standUp();}}]);}
function updHP(dt){if(state==='ride'&&hp<100&&hp>0)hp=Math.min(100,hp+.35*dt);
  const hb=$('hpF'),sb=$('stF');if(hb){hb.style.width=hp+'%';hb.style.background=hp>50?'#ff4d6d':hp>25?'#ff8a3d':'#c40000';sb.style.width=stamina+'%';sb.style.background=boostT>0?'#6ad1ff':stamina>50?'#5ef08a':stamina>20?'#ffd34d':'#ff5a5a';$('hpN').textContent=Math.ceil(hp);$('stN').textContent=Math.ceil(stamina);}
  const hpb=$('hpb');if(hpb.parentNode.id!=='hpDock'){let d=$('hpDock');if(!d){d=document.createElement('div');d.id='hpDock';d.className='glass dark';document.body.appendChild(d);}d.appendChild(hpb);}
  const dk=$('hpDock');const vis=!(state==='menu'||fieldOn);dk.style.display=vis?'block':'none';hpb.style.display='flex';if(vis){const r=$('mcard').getBoundingClientRect();dk.style.top=(r.bottom+6)+'px';}}


// ===== easter eggs =====
const ufo=new THREE.Group();(()=>{const d=mesh(new THREE.SphereGeometry(3,24,12),M(0xb8c4d0,{metalness:.9,roughness:.2}),ufo);d.scale.set(1,.25,1);const dome=mesh(new THREE.SphereGeometry(1.3,20,12,0,PI*2,0,PI/2),M(0x7fe0ff,{emissive:0x2aa7d6,emissiveIntensity:.8,transparent:true,opacity:.8}),ufo);dome.position.y=.4;
  for(let i=0;i<8;i++){const l=mesh(new THREE.SphereGeometry(.18,8,6),M(0xffffff,{emissive:i%2?0xff3df0:0x3dff8a,emissiveIntensity:2}),ufo);l.position.set(Math.cos(i/8*PI*2)*2.7,0,Math.sin(i/8*PI*2)*2.7);}
  const bm=new THREE.Mesh(new THREE.ConeGeometry(3,14,24,1,true),new THREE.MeshBasicMaterial({color:0x9dffb0,transparent:true,opacity:.18,depthWrite:false,side:THREE.DoubleSide}));bm.position.y=-7;ufo.add(bm);})();
ufo.visible=false;scene.add(ufo);let ufoT=0,eggT=rnd(60,120),under=0;
const statue=new THREE.Group();(()=>{const gold=M(0xe2b13c,{metalness:.8,roughness:.25});mesh(new THREE.CylinderGeometry(5,6,3,24),M(0x9a9a9a,{roughness:.9}),statue).position.y=1.5;
  const b=mesh(new THREE.SphereGeometry(4,24,16),gold,statue);b.scale.set(1.3,1,.9);b.position.y=7.5;const nk=tube(V(2.5,9,0),V(4,15,0),1.1,.9,gold,statue,16);const hd=mesh(new THREE.SphereGeometry(1.7,20,14),gold,statue);hd.position.set(4.3,16,0);
  const bk=mesh(new THREE.ConeGeometry(.8,7,16),M(0xff8a1f,{metalness:.5,roughness:.3}),statue);bk.rotation.z=-PI/2-.25;bk.position.set(7.7,15.2,0);
  const pl=textPlane('🦩 鹈鹕神像',8,1.6,'#3b2a12','#ffd34d');pl.position.set(0,2,6.05);statue.add(pl);})();
statue.position.set(2.5*B,.16,2.5*B);scene.add(statue);
let rainbow=null;function showRainbow(){if(rainbow)scene.remove(rainbow);rainbow=new THREE.Group();[0xff0000,0xff8c00,0xffee00,0x2ecc40,0x1e90ff,0x4b0082,0x9400d3].forEach((c,i)=>{const r=new THREE.Mesh(new THREE.TorusGeometry(140-i*3,1.4,6,60,PI),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.45,fog:false}));rainbow.add(r);});
  rainbow.position.set(player.position.x+Math.cos(heading)*260,0,player.position.z-Math.sin(heading)*260);rainbow.rotation.y=heading+PI/2;scene.add(rainbow);rainbow.userData.t=35;toast('🌈 雨后出彩虹了！',2600);unlock('rainbow');}
let sixT=0,bellLog=[];
function eggsUpdate(dt,t){if(fieldOn||exam)return;const pp=player.position;
  if(rainbow){rainbow.userData.t-=dt;if(rainbow.userData.t<=0){scene.remove(rainbow);rainbow=null;}}
  if(!ACH.statue&&Math.hypot(pp.x-statue.position.x,pp.z-statue.position.z)<75){unlock('statue');say('你发现了传说中的鹈鹕神像！');}
  if(state==='ride'&&Math.round(v*3.6)===66){sixT+=dt;if(sixT>1.2&&!ACH.six){unlock('six');toast('6️⃣6️⃣6️⃣ 时速 66，六六大顺！',2600);}}else sixT=0;
  eggT-=dt;if(eggT<=0&&state==='ride'){eggT=rnd(70,140);if(LIGHTS[lightMode].night&&Math.random()<.5&&!ufo.visible){ufoT=12;under=0;ufo.visible=true;toast('👽 天上有个会发光的东西在跟着你……',3000);SFX.power();}}
  if(ufo.visible){ufoT-=dt;ufo.position.lerp(V(pp.x+Math.cos(t*.7)*2,15+Math.sin(t*2)*.6,pp.z+Math.sin(t*.7)*2),Math.min(1,dt*1.5));ufo.rotation.y+=dt*2;
    if(state==='ride'&&v<.4){under+=dt;if(under>3&&!ACH.ufo){coins+=100;saveCoins();unlock('ufo');say('外星人：谢谢你的外卖，我们星球没有鸭血粉丝汤');toast('👽 外星人留下了 🪙100',2800);ufoT=Math.min(ufoT,1.5);}}
    if(ufoT<=0){ufo.visible=false;}}}
function bellEgg(){const n=performance.now();bellLog=bellLog.filter(x=>n-x<6000);bellLog.push(n);if(bellLog.length>=8){bellLog=[];toast('🕊️🕊️🕊️ 一群鸽子被你的车铃吓飞了',2600);unlock('pigeon');}}
