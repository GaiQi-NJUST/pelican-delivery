'use strict';
// ── js/systems/interior.js ──
// 室内：店铺/住宅楼内部、电梯楼梯、NPC 对话、户外步行
// ===== v1.4: enterable interiors (shops + residential towers) =====
const INT={on:false};const IY=-600,IX=0,IZ=0;
const intRoot=new THREE.Group();intRoot.position.set(IX,IY,IZ);intRoot.visible=false;scene.add(intRoot);
const intLight=new THREE.PointLight(0xfff1dd,1.3,40);intRoot.add(intLight);const intAmb=new THREE.PointLight(0xffffff,.6,60);intAmb.position.set(7,6,-8);intRoot.add(intAmb);
const backdrop=new THREE.Mesh(new THREE.BoxGeometry(160,160,160),new THREE.MeshBasicMaterial({color:0x1b2433,side:THREE.BackSide}));backdrop.position.set(7,40,4);intRoot.add(backdrop);
const IM=c=>M(c,{roughness:.75});
function ibx(w,h,d,m,par,x,y,z){const o=mesh(new THREE.BoxGeometry(w,h,d),m,par);o.position.set(x,y,z);return o;}
function icy(rt,rb,h,m,par,x,y,z,seg){const o=mesh(new THREE.CylinderGeometry(rt,rb,h,seg||16),m,par);o.position.set(x,y,z);return o;}
function isp(r,m,par,x,y,z,sx,sy,sz){const o=mesh(new THREE.SphereGeometry(r,14,10),m,par);o.position.set(x,y,z);if(sx)o.scale.set(sx,sy,sz);return o;}
function textTex(lines,bg,fg,w,h,size){return canvasTex(w||256,h||128,(x,W,H)=>{x.fillStyle=bg;x.fillRect(0,0,W,H);x.fillStyle=fg;x.textAlign='center';x.textBaseline='middle';const n=lines.length;
  lines.forEach((l,i)=>{x.font=`bold ${i===0?(size||34):Math.round((size||34)*.72)}px sans-serif`;x.fillText(l,W/2,H*(i+.5)/n);});});}
// --- food models ---
const FM={bowl:IM(0xf5f1e8),red:IM(0xc8321e),broth:IM(0xb5651d),bun:IM(0xd99a4e),white:IM(0xfffaf0),brown:IM(0x8b4a1c),green:IM(0x3f9a3a),yellow:IM(0xf3c94a),orange:IM(0xff7f3f),dark:IM(0x2b1a10),pink:IM(0xff9a8a),cup:M(0xffffff,{transparent:true,opacity:.55,roughness:.2}),tea:IM(0xc79a6b),bam:IM(0xc9a35f),cheese:IM(0xffd25a)};
function bowl(g,fill){icy(.22,.13,.16,FM.bowl,g,0,.08,0);const s=icy(.2,.2,.02,fill,g,0,.15,0);return s;}
const FOODM={
 '鹈鹕炸鸡':g=>{icy(.2,.16,.34,FM.red,g,0,.17,0);icy(.205,.205,.06,FM.white,g,0,.3,0);for(let i=0;i<5;i++){const a=i*1.26;const d=isp(.07,FM.bun,g,Math.cos(a)*.1,.38,Math.sin(a)*.1,1,1.6,1);d.rotation.z=.4*Math.cos(a);}},
 '老王海鲜':g=>{icy(.3,.28,.03,FM.bowl,g,0,.02,0);for(let i=0;i<4;i++){const t=mesh(new THREE.TorusGeometry(.09,.035,8,12,PI*1.3),FM.orange,g);t.position.set(-.15+i*.1,.07,(i%2)*.1-.05);t.rotation.x=PI/2;}},
 '张姐麻辣烫':g=>{bowl(g,FM.red);for(let i=0;i<6;i++)ibx(.05,.03,.05,i%2?FM.green:FM.white,g,rnd(-.12,.12),.17,rnd(-.12,.12));},
 '渔港寿司':g=>{ibx(.5,.03,.25,IM(0x333333),g,0,.015,0);for(let i=0;i<4;i++){icy(.04,.04,.06,FM.white,g,-.18+i*.12,.06,0,10);ibx(.1,.025,.08,FM.orange,g,-.18+i*.12,.1,0);}},
 '阿婆奶茶':g=>{for(const x of[-.1,.1]){icy(.07,.055,.24,FM.cup,g,x,.12,0);icy(.06,.05,.2,FM.tea,g,x,.1,0);for(let k=0;k<5;k++)isp(.015,FM.dark,g,x+rnd(-.03,.03),.02,rnd(-.03,.03));icy(.008,.008,.16,FM.pink,g,x+.02,.28,0,6);}},
 '深夜烧烤':g=>{for(let i=0;i<5;i++){const s=icy(.006,.006,.4,IM(0xd8c49a),g,-.12+i*.06,.03,0,5);s.rotation.x=PI/2;for(let k=0;k<3;k++)ibx(.04,.04,.04,FM.brown,g,-.12+i*.06,.03,-.1+k*.08);}},
 '鲜果切':g=>{ibx(.32,.08,.22,FM.cup,g,0,.04,0);for(let i=0;i<4;i++){const w=mesh(new THREE.CylinderGeometry(.08,.08,.03,12,1,false,0,PI*.5),FM.red,g);w.position.set(-.1+i*.07,.1,0);w.rotation.x=PI/2;}},
 '兰州牛肉面':g=>{bowl(g,IM(0xd9b37a));for(let i=0;i<4;i++){const n=mesh(new THREE.TorusGeometry(.08-i*.015,.008,6,20),FM.yellow,g);n.position.y=.165;n.rotation.x=PI/2;}ibx(.08,.015,.05,FM.brown,g,.06,.17,.03);isp(.025,FM.green,g,-.06,.17,-.04);},
 '小笼包铺':g=>{icy(.22,.22,.12,FM.bam,g,0,.06,0);for(let i=0;i<6;i++){const a=i*1.05;isp(.06,FM.white,g,Math.cos(a)*.12,.14,Math.sin(a)*.12,1,.7,1);}isp(.06,FM.white,g,0,.14,0,1,.7,1);},
 '汉堡工坊':g=>{isp(.15,FM.bun,g,0,.2,0,1,.55,1);icy(.15,.15,.04,FM.dark,g,0,.13,0);icy(.16,.16,.015,FM.green,g,0,.155,0);icy(.15,.15,.015,FM.cheese,g,0,.105,0);icy(.15,.14,.07,FM.bun,g,0,.06,0);},
 '披萨小站':g=>{icy(.3,.3,.03,FM.bun,g,0,.02,0);icy(.27,.27,.01,FM.cheese,g,0,.04,0);for(let i=0;i<7;i++)icy(.035,.035,.012,FM.red,g,rnd(-.18,.18),.05,rnd(-.18,.18),10);},
 '金陵盐水鸭':g=>{icy(.3,.28,.03,FM.bowl,g,0,.02,0);isp(.16,IM(0xf3dcc0),g,0,.11,0,1.5,.6,1);isp(.05,IM(0xf3dcc0),g,.22,.15,0);},
 '鸭血粉丝汤':g=>{bowl(g,IM(0xe9dcc4));for(let i=0;i<5;i++)ibx(.045,.03,.045,IM(0x6b1f1f),g,rnd(-.1,.1),.17,rnd(-.1,.1));for(let i=0;i<5;i++)isp(.015,FM.green,g,rnd(-.12,.12),.17,rnd(-.12,.12));},
 '黄焖鸡米饭':g=>{const b=bowl(g,FM.broth);for(let i=0;i<5;i++)isp(.04,FM.brown,g,rnd(-.1,.1),.17,rnd(-.1,.1));const r=new THREE.Group();g.add(r);r.position.x=.32;bowl(r,FM.white);isp(.14,FM.white,r,0,.15,0,1,.45,1);},
 '煎饼果子':g=>{const c=mesh(new THREE.CylinderGeometry(.2,.2,.03,20,1,false,0,PI),FM.yellow,g);c.position.y=.05;icy(.02,.02,.3,IM(0xc0392b),g,0,.07,.04).rotation.z=PI/2;},
 '海鸥咖啡':g=>{for(const x of[-.15,0,.15]){icy(.06,.05,.2,FM.cup,g,x,.1,0);icy(.055,.045,.17,FM.dark,g,x,.085,0);icy(.062,.062,.02,FM.white,g,x,.2,0);}}};
function foodModel(name){const g=new THREE.Group();(FOODM[name]||FOODM['黄焖鸡米饭'])(g);return g;}
// --- shop room ---
const shopRoom=new THREE.Group();intRoot.add(shopRoom);
const SR={W:14,D:10,H:4.2};
ibx(SR.W,.2,SR.D,IM(0xe8dccb),shopRoom,7,-.1,5);ibx(SR.W,.2,SR.D,IM(0xf7f2ea),shopRoom,7,SR.H,5);
ibx(SR.W,SR.H,.2,IM(0xf3e6d0),shopRoom,7,SR.H/2,10);ibx(.2,SR.H,SR.D,IM(0xf3e6d0),shopRoom,0,SR.H/2,5);ibx(.2,SR.H,SR.D,IM(0xf3e6d0),shopRoom,14,SR.H/2,5);
const tiles=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#d9cdb8';x.fillRect(0,0,w,h);x.fillStyle='#c7b89f';for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2)x.fillRect(i*32,j*32,32,32);},[6,4]);
shopRoom.children[0].material=M(0xffffff,{map:tiles,roughness:.6});
const counterM=IM(0x8b5a2b);ibx(6,1.1,1,counterM,shopRoom,7,.55,7.6);ibx(6.2,.08,1.2,IM(0xeeeeee),shopRoom,7,1.14,7.6);
const clerk=makePed(false);scene.remove(clerk.g);clerk.g.position.set(7,0,8.8);clerk.g.rotation.y=-PI/2;shopRoom.add(clerk.g);
const hatC=icy(.15,.15,.2,FM.white,clerk.g,0,1.85,0);
const menuB=new THREE.Mesh(new THREE.PlaneGeometry(5,1.5),M(0xffffff));menuB.position.set(7,2.75,9.88);menuB.rotation.y=PI;shopRoom.add(menuB);
const shelfFood=new THREE.Group();shopRoom.add(shelfFood);
for(const x of[1.6,12.4])ibx(1.4,2.4,.5,IM(0x6e4a2a),shopRoom,x,1.2,9.6);
const tableM=IM(0xa0703a);const tableFood=new THREE.Group();shopRoom.add(tableFood);
for(const [x,z] of[[2.5,3],[11.5,3],[2.5,5.6],[11.5,5.6]]){icy(.55,.55,.06,tableM,shopRoom,x,.78,z);icy(.05,.05,.78,FM.dark,shopRoom,x,.39,z,8);for(const s of[-1,1])icy(.22,.22,.45,IM(0xd9534f),shopRoom,x+s*.85,.22,z);}
const doorFrame=ibx(2.4,.2,.3,IM(0x555555),shopRoom,7,3,0);
const counterFood=new THREE.Group();shopRoom.add(counterFood);
let shopCurName='';
function setupShop(p,orderFood){shopCurName=p.name;const X=SHOPX[p.name]||{s:'',bg:'#d94f3d'};
  menuB.material.map&&menuB.material.map.dispose();menuB.material=new THREE.MeshBasicMaterial({map:textTex([`${p.e} ${p.name}`,`招牌：${FOODS[p.name]||'外卖'}  🪙${18+(p.name.length*7)%30}`,X.s],X.bg,'#fff',512,160,44),toneMapped:false});
  [shelfFood,tableFood,counterFood].forEach(g=>{while(g.children.length)g.remove(g.children[0]);});
  for(const x of[1.6,12.4])for(const y of[.9,1.7]){const f=foodModel(p.name);f.position.set(x,y,9.3);f.scale.setScalar(1.8);shelfFood.add(f);}
  for(const [x,z] of[[2.5,3],[11.5,5.6]]){const f=foodModel(p.name);f.position.set(x,.81,z);f.scale.setScalar(2);tableFood.add(f);}
  if(orderFood){const f=foodModel(p.name);f.scale.setScalar(1.5);f.position.set(7,1.18,7.6);f.visible=false;counterFood.add(f);}
  hatC.material=new THREE.MeshStandardMaterial({color:new THREE.Color(X.bg)});applyTheme(p);placeShopNPC(p);}
// --- residential tower (cutaway, front wall open) ---
const tower=new THREE.Group();intRoot.add(tower);const FH=3,TW=14,TD=8,MAXF=18;
const wallM=IM(0xe9dcc6),slabM=IM(0x9c8f7e),stairM=IM(0x7d8a96),railM=M(0x444444,{metalness:.6,roughness:.4});
for(let f=0;f<=MAXF;f++){ibx(9,.25,TD,slabM,tower,4.5,f*FH-.12,TD/2);ibx(5,.25,TD-3.4,slabM,tower,11.5,f*FH-.12,TD/2+1.7);}
ibx(TW,FH*MAXF+FH,.2,wallM,tower,7,(FH*MAXF+FH)/2,TD);ibx(.2,FH*MAXF+FH,TD,wallM,tower,0,(FH*MAXF+FH)/2,TD/2);ibx(.2,FH*MAXF+FH,TD,wallM,tower,TW,(FH*MAXF+FH)/2,TD/2);
// elevator shaft x 1..4 z 4.5..7.5
const shaftM=M(0x7f8c8d,{transparent:true,opacity:.35});ibx(3.2,FH*MAXF+FH,.1,shaftM,tower,2.6,(FH*MAXF+FH)/2,4.4);
const cab=new THREE.Group();tower.add(cab);ibx(2.6,.15,2.6,IM(0x95a5a6),cab,2.6,0,6);ibx(2.6,.15,2.6,IM(0x95a5a6),cab,2.6,2.6,6);ibx(.1,2.6,2.6,IM(0xbdc3c7),cab,1.3,1.3,6);ibx(.1,2.6,2.6,IM(0xbdc3c7),cab,3.9,1.3,6);
const cabRope=icy(.03,.03,1,railM,tower,2.6,0,6,6);
const elDoorL=ibx(1.25,2.5,.08,M(0xc0c6cc,{metalness:.7,roughness:.3}),tower,2,1.25,4.5),elDoorR=ibx(1.25,2.5,.08,M(0xc0c6cc,{metalness:.7,roughness:.3}),tower,3.25,1.25,4.5);
const floorSign=new THREE.Mesh(new THREE.PlaneGeometry(1.4,.6),new THREE.MeshBasicMaterial({color:0xffffff}));floorSign.position.set(2.6,3.1,4.3);floorSign.rotation.y=PI;tower.add(floorSign);
const fsCache={};function setFloorSign(n,up){const k=n+(up?'u':'d');if(!fsCache[k])fsCache[k]=new THREE.MeshBasicMaterial({map:textTex([`${up?'▲':'▼'} ${n} F`],'#111','#ff4040',128,64,40),toneMapped:false});floorSign.material=fsCache[k];}
// stairwell x 9.5..13.5: per floor two flights
const STEPS=10;for(let f=0;f<MAXF;f++){for(let k=0;k<2;k++){const z=k?2.6:1.2,dir=k?-1:1;for(let s=0;s<STEPS;s++){const x=k?13.2-(s+.5)*.38:9.6+(s+.5)*.38;ibx(.4,.15,1.3,stairM,tower,x,f*FH+k*1.5+(s+1)*.15-.07,z);}
    ibx(1.1,.15,2.8,stairM,tower,k?9.1:13.75,f*FH+(k+1)*1.5-.07,1.9);}
  icy(.025,.025,4.2,railM,tower,11.4,f*FH+1.6,.55,6).rotation.z=Math.atan2(4,1.5)*0+PI/2-Math.atan(1.5/3.8);}
// apartment doors on back wall
const doorM=IM(0x8b5e3c),plates=[];for(let f=1;f<=MAXF;f++){for(const x of[5.5,7.5]){ibx(1,2.1,.1,doorM,tower,x,f*FH+1.05,7.85);}}
const aptPlate=new THREE.Mesh(new THREE.PlaneGeometry(.6,.3),new THREE.MeshBasicMaterial({color:0xffffff}));aptPlate.rotation.y=PI;tower.add(aptPlate);
const aptDoor=new THREE.Group();tower.add(aptDoor);const aptDoorP=ibx(1,2.1,.12,IM(0xa0522d),aptDoor,.5,1.05,0);
const cust=makePed(false);scene.remove(cust.g);tower.add(cust.g);cust.g.visible=false;
const lobbySign=new THREE.Mesh(new THREE.PlaneGeometry(4,.8),new THREE.MeshBasicMaterial({color:0xffffff}));lobbySign.position.set(7,2.4,7.88);lobbySign.rotation.y=PI;tower.add(lobbySign);
const mailbox=ibx(2,1.2,.4,IM(0x2e86c1),tower,6.5,.6,7.7);
// --- UI ---
const intUI=document.createElement('div');intUI.id='intUI';document.body.appendChild(intUI);
const intHud=document.createElement('div');intHud.id='intHud';intHud.className='glass dark';document.body.appendChild(intHud);
function intBtns(list){intUI.innerHTML='';list.forEach(b=>{const e=document.createElement('button');e.className='glass pill'+(b.p?' primary':'');e.textContent=b.t;
  if(b.hold){e.addEventListener('pointerdown',ev=>{ev.preventDefault();b.hold(true);});['pointerup','pointerleave','pointercancel'].forEach(n=>e.addEventListener(n,()=>b.hold(false)));}
  else e.addEventListener('pointerdown',ev=>{ev.preventDefault();initAudio();b.f();});intUI.appendChild(e);});intUI.style.display=list.length?'flex':'none';}

// ===== v1.5 shop themes, NPCs, talks =====
const TABLES=[[2.5,3],[11.5,3],[2.5,5.6],[11.5,5.6]];
const themeG=new THREE.Group();shopRoom.add(themeG);const shopWallMs=[];shopRoom.children.slice(0,5).forEach(m=>shopWallMs.push(m));
const accent=new THREE.PointLight(0xffaa55,1.2,16);accent.position.set(7,3.4,8.2);shopRoom.add(accent);
const spotS=new THREE.SpotLight(0xfff0dd,1.4,22,.9,.5,1);spotS.position.set(7,4,3);spotS.target.position.set(7,0,6);spotS.castShadow=true;spotS.shadow.mapSize.set(512,512);shopRoom.add(spotS);shopRoom.add(spotS.target);
const glow=c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.8});
const T_=(fn)=>fn;const PROPS={
 fry:g=>{for(const x of[4.6,5.8]){ibx(1,.9,.8,M(0x9aa3a8,{metalness:.7,roughness:.3}),g,x,.45,9.2);ibx(.8,.05,.6,glow(0xd98c1a),g,x,.92,9.2);}ibx(1.6,.5,.5,glow(0xff3b30),g,7,3.9,9.8);},
 tank:g=>{for(const x of[1.6,12.4]){ibx(1.5,1.3,.7,M(0x3aa7ff,{transparent:true,opacity:.35,roughness:.1}),g,x,2.75,9.4);for(let i=0;i<4;i++){const f=isp(.08,glow(i%2?0xff7f3f:0xffd23f),g,x+rnd(-.5,.5),2.5+rnd(0,.7),9.4,1.6,.7,.6);f.userData.swim=rnd(0,6);}}ibx(2,.6,.6,M(0x6b4f2a),g,10,.3,6.2);},
 hotpot:g=>{for(const x of[5,9]){icy(.45,.4,.5,M(0x888888,{metalness:.8,roughness:.3}),g,x,1.4,8.7);icy(.4,.4,.05,glow(0xc8321e),g,x,1.66,8.7);}for(let i=0;i<8;i++)icy(.15,.15,.25,M(pick([0x3f9a3a,0xf5f1e8,0xd9534f])),g,1+i*.25,.13,8.3);},
 belt:g=>{const b=ibx(9,.1,.6,M(0x666666,{metalness:.5}),g,7,.95,6);for(let i=0;i<10;i++){const pl=icy(.16,.16,.03,M(pick([0xd9534f,0x3a7bd5,0xf3c94a])),g,2.6+i*.9,1.02,6);pl.userData.belt=1;}},
 tea:g=>{for(let i=0;i<4;i++)icy(.12,.1,.6,M(0xc79a6b,{transparent:true,opacity:.7}),g,4.6+i*.5,1.5,7.8);ibx(.8,.9,.6,M(0xf0f0f0),g,9.2,1.6,8.6);ibx(.5,.08,.4,glow(0x55e0ff),g,9.2,2.1,8.3);for(let i=0;i<6;i++)icy(.07,.06,.2,M(0xffffff,{transparent:true,opacity:.6}),g,4+i*.14,1.25,7.3);},
 grill:g=>{ibx(2.6,.8,.7,M(0x333333,{metalness:.6}),g,7,.4,9.1);ibx(2.4,.04,.5,glow(0xff5a1a),g,7,.83,9.1);for(let i=0;i<10;i++){ibx(.05,.05,.5,M(0x8b4a1c),g,6+i*.22,.9,9.1);}for(let i=0;i<3;i++)ibx(.6,.4,.4,M(0x2e7d32),g,12.6,.2+i*.42,6.5);},
 fruit:g=>{for(let r=0;r<2;r++)for(let i=0;i<4;i++){ibx(.7,.25,.5,M(0x8d6e63),g,2+i*.8,.6+r*.6,9.3);for(let k=0;k<4;k++)isp(.1,M(pick([0xff7043,0xffd54f,0x66bb6a,0xe53935])),g,1.8+i*.8+k*.12,.8+r*.6,9.3);}isp(.25,M(0x2e7d32),g,11,1.4,7.7,1.2,1,1);},
 noodle:g=>{icy(.55,.5,.7,M(0xaaaaaa,{metalness:.8}),g,5,1.5,8.7);icy(.5,.5,.04,M(0xe6c78a),g,5,1.86,8.7);ibx(1.4,.08,.7,M(0xdeb887),g,9,1.18,8.6);for(let i=0;i<8;i++)icy(.01,.01,1.2,M(0xf3e1a0),g,8.5+i*.12,1.25,8.6,4).rotation.x=PI/2;},
 steam:g=>{for(let i=0;i<5;i++)icy(.45,.45,.25,M(0xc9a35f),g,5,1.25+i*.26,8.8);for(let i=0;i<5;i++)icy(.45,.45,.25,M(0xc9a35f),g,9,1.25+i*.26,8.8);},
 diner:g=>{for(const [x,z] of[[1.3,3],[1.3,5.6],[12.7,3],[12.7,5.6]])ibx(.6,1,1.4,M(0xc62828),g,x,.5,z);ibx(3,.25,.1,glow(0xff4081),g,7,3.7,9.85);ibx(2.4,.2,.1,glow(0x40c4ff),g,7,3.35,9.85);},
 oven:g=>{const o=isp(1.1,M(0xa1452c,{roughness:.9}),g,10,1.1,9.1,1,1,.7);ibx(.9,.6,.2,glow(0xff7a1a),g,10,.8,8.4);for(let i=0;i<3;i++)icy(.3,.3,.02,M(0xffd25a),g,4.5+i*.75,1.2,7.6);},
 duck:g=>{ibx(4,.05,.05,M(0x777777),g,7,2.6,8.9);for(let i=0;i<5;i++){isp(.22,M(0xf3dcc0),g,5.4+i*.8,2.15,8.9,.8,1.4,.7);icy(.01,.01,.4,M(0x777777),g,5.4+i*.8,2.45,8.9,4);}},
 soup:g=>{for(const x of[4.5,6,7.5]){icy(.4,.35,.5,M(0x999999,{metalness:.8}),g,x,1.45,8.8);icy(.36,.36,.03,M(0xe9dcc4),g,x,1.7,8.8);}},
 claypot:g=>{for(let i=0;i<6;i++){icy(.25,.2,.25,M(0x5d4037),g,4.6+i*.95,1.3,8.8);icy(.2,.2,.02,M(0xb5651d),g,4.6+i*.95,1.43,8.8);}},
 cart:g=>{ibx(2.2,.9,1,M(0xff7043),g,10.5,.45,4.3);icy(.5,.5,.06,M(0x444444,{metalness:.7}),g,10.5,.95,4.3);for(const z of[3.8,4.8])icy(.25,.25,.08,M(0x222222),g,9.5,.25,z).rotation.x=PI/2;},
 cafe:g=>{ibx(1,.7,.6,M(0x8d8d8d,{metalness:.8,roughness:.25}),g,5,1.5,8.6);ibx(.2,.08,.2,glow(0xff5252),g,5.3,1.75,8.3);for(const x of[1.2,12.8]){icy(.25,.2,.4,M(0x795548),g,x,.2,1.2);isp(.45,M(0x43a047),g,x,.85,1.2);}ibx(2,.9,.05,M(0x1b1b1b),g,10,2.6,9.88);}};
function applyTheme(p){const T=THEMES[p.name]||['#f3e6d0','#d9cdb8','#c7b89f',0xffaa55,'fry'];while(themeG.children.length)themeG.remove(themeG.children[0]);
  const wm=M(T[0]);for(let i=2;i<5;i++)shopWallMs[i].material=wm;
  const tex=canvasTex(128,128,(x,w,h)=>{x.fillStyle=T[1];x.fillRect(0,0,w,h);x.fillStyle=T[2];for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i+j)%2)x.fillRect(i*32,j*32,32,32);},[6,4]);shopWallMs[0].material=M(0xffffff,{map:tex,roughness:.55,metalness:.05});
  accent.color.setHex(T[3]);(PROPS[T[4]]||PROPS.fry)(themeG);themeG.traverse(o=>{if(o.isMesh){o.castShadow=false;}});}
scene.updateMatrixWorld(true);const ILS=[[intLight,1.3,0],[intAmb,.6,0],[accent,1.2,1],[spotS,1.4,1]];ILS.forEach(l=>{scene.attach(l[0]);if(l[0].target){scene.attach(l[0].target);}l[0].intensity=0;});
function intLightsOn(on,shop){ILS.forEach(l=>{l[0].intensity=on&&(!l[2]||shop)?l[1]:0;});}
const shopNPC=[];for(let i=0;i<5;i++){const n=makePed(i===4);scene.remove(n.g);shopRoom.add(n.g);n.g.visible=false;shopNPC.push(n);}
const NPC_SPOTS=[[3.35,3,PI],[1.65,5.6,0],[10.65,3,0],[12.35,5.6,PI],[6.2,5.4,-PI/2],[7.8,4.6,-PI/2],[5,2.2,1]];
const NPC_WHO=['大学生','上班族','阿姨','大爷','小朋友','外卖同行','情侣'];
const NPC_GEN=['你也是送外卖的？今天单多吗？','这家店我吃了三年了','听说城东有个 UFO……','下雨天骑车慢点啊','我在等我的号，前面还有 12 个','你们鹈鹕骑车不累吗？','这里 WiFi 密码是 88888888','加油！打工人！','我女朋友让我来买的','别告诉老板我又来了'];
const NPC_SHOP={'阿婆奶茶':['三分糖去冰加椰果，记住了吗','这家的芋泥波波是真的绝','我已经喝了第 4 杯了'],'深夜烧烤':['老板，再来 20 串！','这个点只有烧烤懂我','明天还要上早八……'],'兰州牛肉面':['要二细，多加辣子','拉面师傅的手速太快了'],'海鸥咖啡':['我在这写论文写了一下午','冰美式是续命水'],'渔港寿司':['我只吃三文鱼','传送带上那盘是我的！'],'汉堡工坊':['双层芝士才是正义','薯条要配冰可乐'],'老王海鲜':['这虾还在动！','老王说今天的蟹最肥'],'金陵盐水鸭':['来南京不吃盐水鸭等于白来','要前胸还是后腿？'],'鸭血粉丝汤':['多放香菜！','配个小笼包刚刚好']};
function placeShopNPC(p){const n=3+Math.floor(Math.random()*3);const spots=NPC_SPOTS.slice().sort(()=>Math.random()-.5);
  shopNPC.forEach((c,i)=>{if(i<n){const s=spots[i];c.g.visible=true;c.g.position.set(s[0],0,s[1]);c.g.rotation.y=s[2];c.who=NPC_WHO[Math.floor(Math.random()*NPC_WHO.length)];if(i===4)c.who='小朋友';
    c.lines=[...(NPC_SHOP[p.name]||[]),...NPC_GEN].sort(()=>Math.random()-.5).slice(0,4);c.li=0;c.gift=0;c.anim=Math.random()<.6;}else c.g.visible=false;});}
const HALL_LINES=['又是外卖？这栋楼一天能来一百个','电梯又坏了吗？','你好你好，帮我按一下门禁','楼下小卖部关门了吗','我在等我的快递','这楼隔音太差了'];
const SHOP_TALK={
 '鹈鹕炸鸡':[['我们老板就是一只鹈鹕，你们是亲戚吗？','c10'],['炸鸡要趁热，凉了就是罪过','s'],['秘制酱料配方锁在保险柜里，密码是老板生日','c'],['昨天有人一口气点了 100 块鸡翅','c15'],['员工福利：每天随便吃……我已经胖了 20 斤','h'],['别说出去，其实我更喜欢吃素','c20']],
 '老王海鲜':[['老王去码头进货了，我是小王','c'],['那只龙虾昨晚又越狱了','c10'],['尝尝这个生蚝，送你的','h'],['水箱里那条鱼叫阿福，养了五年了','c'],['老王说你们鹈鹕吃鱼不用钱……开玩笑的','c15'],['这周末海鲜节，记得来！','s']],
 '张姐麻辣烫':[['张姐说你们骑手辛苦，送你一碗汤','s'],['微辣？在我们这微辣就是特辣','c'],['有个顾客每次都点 37 串豆皮','c10'],['我们的汤底熬了 12 个小时','h'],['张姐年轻时候是川剧变脸演员','c15'],['麻酱自己调，不收钱','c20']],
 '渔港寿司':[['传送带上的蓝盘子最贵，别拿','c'],['师傅捏寿司 30 年，手速比你骑车还快','c10'],['芥末不要一次放太多……你已经哭了','h'],['今天的三文鱼是早上空运来的','s'],['鹈鹕能吃生鱼片吗？那你随意','c15'],['隐藏菜单：鹈鹕卷，只给你做','c20']],
 '阿婆奶茶':[['阿婆说：年轻人少喝奶茶，多喝热水','h'],['波波是阿婆手搓的，一颗一颗','c'],['今天第二杯半价……第一杯原价','c10'],['有个大学生一天来了 6 次','c15'],['阿婆其实 85 岁了，还会玩抖音','c'],['隐藏款：鹈鹕奶盖，送你尝尝','s']],
 '深夜烧烤':[['晚上八点才开门，白天老板在睡觉','c'],['烤串的秘诀是孜然要多','c10'],['昨天有人在这求婚，用的是腰子','c15'],['喝点什么？骑车就只能喝可乐了','s'],['隔壁桌的大哥请你吃两串','h'],['我们老板以前是摇滚乐手','c20']],
 '鲜果切':[['这瓜保熟！','c'],['芒果今天特别甜，你尝一块','s'],['榴莲要不要？算了你们鹈鹕鼻子灵','c10'],['我们的水果都是早上五点去批发市场挑的','h'],['有人问能不能只买西瓜中间那一口','c15'],['老板说下雨天水果打八折','c20']],
 '兰州牛肉面':[['一清二白三红四绿五黄，记住了吗','c'],['师傅一分钟能拉 200 根面','c10'],['加个蛋？送你的','h'],['我们是正宗兰州来的，不是兰州拉面那种','c15'],['面汤免费续','s'],['辣子是师傅老家寄来的','c20']],
 '小笼包铺':[['先开窗，后喝汤，最后一口全吞掉','c'],['每个包子 18 个褶，不多不少','c10'],['蒸笼摞了十层，你数数','c'],['刚出笼的，小心烫','h'],['老板娘说你长得像她家鹦鹉','c15'],['送你两个，路上吃','s']],
 '汉堡工坊':[['我们的牛肉饼是手打的','c'],['薯条无限续，但你吃不完','c10'],['店里的点唱机只会放一首歌','c'],['双层还是三层？鹈鹕嘴大可以四层','h'],['今天是汉堡日，买一送一……送你一个','s'],['墙上那个签名是假的','c20']],
 '披萨小站':[['窑温 450 度，90 秒出炉','c'],['菠萝披萨？这里不讨论这个话题','c10'],['饼底是老板凌晨三点起来揉的','h'],['芝士能拉一米长','c15'],['送你一块边角料，最香了','s'],['意大利人来吃过，说还行','c20']],
 '金陵盐水鸭':[['南京人一年吃掉一亿只鸭子','c'],['前胸肉嫩，后腿有嚼劲','c10'],['桂花开的时候鸭子最好吃','h'],['我们家的卤水传了三代','c15'],['尝一块，不要钱','s'],['老板说鹈鹕和鸭子不是一家，放心吃','c20']],
 '鸭血粉丝汤':[['鸭血要嫩，粉丝要滑，汤要鲜','c'],['香菜要多少？好的全放了','c10'],['配个锅贴？送你的','h'],['我们早上六点就开门了','c15'],['汤底是鸭骨头熬了一夜','s'],['南京人早饭标配就是这个','c20']],
 '黄焖鸡米饭':[['全国有六万家黄焖鸡，我们是最好吃的那家','c'],['米饭免费加','s'],['辣度可以选：不辣、微辣、鹈鹕辣','c10'],['砂锅是景德镇定做的……假的','c'],['土豆比鸡肉还好吃','h'],['老板是个程序员，辞职来卖黄焖鸡','c20']],
 '煎饼果子':[['薄脆还是油条？我建议都要','c'],['两个蛋！三个蛋！','c10'],['我们是天津正宗的，别加生菜','c15'],['这个推车跟了我十五年','h'],['摊煎饼最重要的是手腕','c'],['送你一个，加肠','s']],
 '海鸥咖啡':[['拉花是一只海鸥……也像鹈鹕','c'],['冰美式续命，热拿铁养生','s'],['那个人在这坐了一天，只点了一杯水','c10'],['咖啡豆是云南的','c'],['WiFi 密码是 seagull666','c15'],['老板养了一只真的海鸥，在天台','c20']],
 _:[['欢迎光临！','c'],['今天生意不错','c10'],['你们骑手辛苦了','s'],['要不要尝尝新品？','h'],['老板出去了','c15'],['下次再来！','c20']]};
// --- v1.5 controller: free-roam interiors, on-foot mode, joystick ---
const joy=document.createElement('div');joy.id='joy';joy.innerHTML='<div id="joyK"></div>';document.body.appendChild(joy);
let JX=0,JY=0,joyId=null;
function joyMove(e){const r=joy.getBoundingClientRect();let x=(e.clientX-r.left-r.width/2)/(r.width/2),y=-(e.clientY-r.top-r.height/2)/(r.height/2);const m=Math.hypot(x,y);if(m>1){x/=m;y/=m;}JX=x;JY=y;$('joyK').style.transform=`translate(${x*40}px,${-y*40}px)`;}
joy.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();joyId=e.pointerId;try{joy.setPointerCapture(e.pointerId);}catch(_){}joyMove(e);});
joy.addEventListener('pointermove',e=>{if(e.pointerId===joyId)joyMove(e);});
['pointerup','pointercancel','lostpointercapture'].forEach(n=>joy.addEventListener(n,e=>{if(e.pointerId===joyId){joyId=null;JX=JY=0;$('joyK').style.transform='';}}));
const KB={};addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;KB[e.key.toLowerCase()]=1;});addEventListener('keyup',e=>{KB[e.key.toLowerCase()]=0;});
function joyVec(){let x=JX,y=JY;if(!x&&!y){x=(KB.d||KB.arrowright?1:0)-(KB.a||KB.arrowleft?1:0);y=(KB.w||KB.arrowup?1:0)-(KB.s||KB.arrowdown?1:0);}return [x,y];}
let padOn=false;function setPad(on){padOn=on;joy.style.display=on?'block':'none';['kL','kR','bell'].forEach(i=>{const e=$(i);if(e)e.style.visibility=on?'hidden':'';});
  $('gas').textContent=on?'互动':(drive!=='bike'?'油门':'蹬车');$('brake').textContent=on?'跑':'刹车';$('footUI').style.display=on?'flex':'none';if(!on){$('intTip').style.display='none';}}
const footUI=document.createElement('div');footUI.id='footUI';footUI.innerHTML='<button class="glass pill" id="bPhone">📱</button>';document.body.appendChild(footUI);
const intTip=document.createElement('div');intTip.id='intTip';intTip.className='glass dark';document.body.appendChild(intTip);
let gasPrev=false,curAct=null;
function setAct(a){curAct=a;const t=$('intTip');if(a){t.textContent='「互动」'+a.label;t.style.display='block';$('gas').textContent=a.short||'互动';}else{t.style.display='none';$('gas').textContent='互动';}}
function actEdge(){const g=gas;if(g&&!gasPrev&&curAct){const f=curAct.fn;curAct=null;SFX.tick(.3);f();}gasPrev=g;}
const _f=V(),_r=V();let camYaw=0;
function moveChar(dt,ok,spdK){const [x,y]=joyVec();const m=Math.min(1,Math.hypot(x,y));if(m<.15)return null;
  camera.getWorldDirection(_f);_f.y=0;_f.normalize();_r.set(-_f.z,0,_f.x);const dir=_r.clone().multiplyScalar(x).addScaledVector(_f,y).normalize();
  const run=braking&&stamina>0;const sp=(run?4.6:1.9)*m*(spdK||1);if(run){stamina=Math.max(0,stamina-dt*5);if(stamina<=0)exhausted=true;}
  const p=pel.position,nx=p.x+dir.x*sp*dt,nz=p.z+dir.z*sp*dt;if(ok(nx,nz)){p.x=nx;p.z=nz;}else if(ok(nx,p.z))p.x=nx;else if(ok(p.x,nz))p.z=nz;
  pel.rotation.set(0,Math.atan2(-dir.z,dir.x),0);FOOTT+=dt*sp*3.2;updLegs(FOOTT);pel.position.y=FOOTY+Math.abs(Math.sin(FOOTT))*.05;return dir;}
let FOOTT=0,FOOTY=1.12;

// ===== interiors (free roam) =====
const iv=(x,y,z)=>V(IX+x,IY+y,IZ+z);const L=(x,z)=>[x-IX,z-IZ];
function intEnter(w){Object.assign(INT,{mv:null,carry:null,lk:null,ph:'',cook:0,ready:false,floor:1,stairs:null,elF:1,elOpen:0,riding:null,knock:null,eggI:0});
  INT.on=true;INT.w=w;INT.p=w.p;intRoot.visible=true;scene.fog.far0=scene.fog.far;scene.fog.far=400;sun.shadow.autoUpdate=false;intLightsOn(true,!!w.p.shop);camera.far0=camera.far;camera.far=160;camera.updateProjectionMatrix();
  const isShop=w.p.shop;shopRoom.visible=isShop;tower.visible=!isShop;pel.rotation.set(0,0,0);intHud.style.display='block';setPad(true);
  if(isShop)shopEnter(w);else towerEnter(w);if(!w.p.shop)towerCam();camera.position.copy(INT.cam.pos);INT.lk=INT.cam.look.clone();camera.lookAt(INT.lk);}
function intExit(){INT.on=false;intRoot.visible=false;intUI.style.display='none';intHud.style.display='none';if(scene.fog.far0)scene.fog.far=scene.fog.far0;sun.shadow.autoUpdate=true;intLightsOn(false);if(camera.far0){camera.far=camera.far0;camera.updateProjectionMatrix();}cust.g.visible=false;
  const w=INT.w;pel.position.copy(w.door);pel.rotation.set(0,0,0);camInit=false;INT.lk=null;camera.position.copy(w.door).addScaledVector(w.p.n,5.5);camera.position.y=w.door.y+2.6;camera.lookAt(w.door.x,w.door.y+.5,w.door.z);
  if(w.foot){walk=null;state='foot';FOOT.yaw=Math.atan2(-w.p.n.z,w.p.n.x);setPad(true);}else{setPad(false);faceTo(w.door,w.p0);w.ph='back';w.t=0;}}
function towerFloors(p){return p.name.startsWith('南理工宿舍')?6:Math.max(3,Math.min(MAXF,Math.floor(p.ht/3)));}
// ---- SHOP ----
function shopEnter(w){const o=w.o;setupShop(w.p,!!o);intHud.textContent=`${w.p.e} ${w.p.name}${o?' · 取餐：'+o.food:''}`;
  pel.position.copy(iv(7,1.12,1));FOOTY=IY+1.12;INT.cam={pos:iv(7,3.4,-3),look:iv(7,1,5)};
  if(o){INT.cook=Math.max(2.5,w.wait+1.5);if(w.ev){const ev=w.ev;w.ev=null;ev(w);INT.cook=Math.max(INT.cook,w.wait+1);}}
  say(pick(['老板：欢迎光临！','店员：您好，里面请～','老板：来啦！随便坐']),1400);}
const SHOP_OBS=[[3.6,10.4,6.9,10]];function shopOk(x,z){const [lx,lz]=L(x,z);if(lx<.6||lx>13.4||lz<.35||lz>9.5)return false;
  for(const b of SHOP_OBS)if(lx>b[0]&&lx<b[1]&&lz>b[2]&&lz<b[3])return false;for(const t of TABLES)if(Math.hypot(lx-t[0],lz-t[1])<.75)return false;
  for(const n of shopNPC)if(n.g.visible&&Math.hypot(lx-n.g.position.x,lz-n.g.position.z)<.45)return false;if(lx<2.4&&lz>8.8||lx>11.6&&lz>8.8)return false;return true;}
function shopUpdate(dt,t){const w=INT.w,o=w.o,[lx,lz]=L(pel.position.x,pel.position.z);moveChar(dt,shopOk);
  if(INT.cook>0){INT.cook-=dt;clerk.arms[0].rotation.z=Math.sin(t*10)*.8;if(INT.cook<=0&&o&&!w.done){INT.ready=true;const f=counterFood.children[0];if(f){f.visible=true;f.scale.setScalar(.01);}SFX.ding();say('老板：'+o.food+' 好了！来柜台拿～',1800);}}
  const f=counterFood.children[0];if(INT.ready&&f){if(f.scale.x<2.4)f.scale.setScalar(Math.min(2.4,f.scale.x+dt*5));f.rotation.y+=dt*.8;}
  if(INT.carry){INT.carry.position.copy(pel.position).sub(intRoot.position).add(V(0,-.25,0));}
  shopNPC.forEach((n,i)=>{if(n.g.visible&&n.anim){n.arms[i%2].rotation.z=Math.sin(t*3+i)*.5;}});
  let a=null;
  if(lz<1.1)a={label:'离开店铺',short:'离开',fn:()=>{if(INT.carry){counterFood.remove(INT.carry);INT.carry=null;}intExit();}};
  else if(lz>5.9&&lx>3.8&&lx<10.2){if(o&&!w.done){a=INT.ready?{label:`取餐「${o.food}」`,short:'取餐',fn:()=>{INT.ready=false;INT.carry=counterFood.children[0];w.done=true;pickedUp(o);}}:{label:'催一下老板',short:'催单',fn:()=>{say(pick(['老板：别急别急，还有 '+Math.ceil(INT.cook)+' 秒！','老板：锅都快冒烟了！','老板：在做了在做了！']),1500);INT.cook=Math.max(.5,INT.cook-.8);}};}
    else a={label:'和店员聊聊',short:'对话',fn:clerkTalk};if(Math.abs(lx-7)>1.6&&!(o&&!w.done))a={label:`点一份（🪙10，回满体力）`,short:'点餐',fn:()=>{if(coins<10){toast('金币不够');return;}coins-=10;saveCoins();stamina=100;exhausted=false;hp=Math.min(100,hp+10);SFX.ding();toast(`😋 ${FOODS[w.p.name]||'美食'}真香！体力回满`,2200);}};}
  else{let best=null,bd=1.7;for(const n of shopNPC){if(!n.g.visible)continue;const d=Math.hypot(lx-n.g.position.x,lz-n.g.position.z);if(d<bd){bd=d;best=n;}}
    if(best)a={label:`和${best.who}聊天`,short:'对话',fn:()=>npcTalk(best)};}
  setAct(a);actEdge();
  const tp=pel.position;INT.cam.pos.set(tp.x*.6+(IX+7)*.4,tp.y+2.5,Math.max(IZ-1.6,tp.z-4.6));INT.cam.look.set(tp.x,tp.y+.1,tp.z+1.8);}
function clerkTalk(){const E=SHOP_TALK[INT.p.name]||SHOP_TALK._;const k=INT.p.key+'_egg';const seen=SAVE[k]||0;const i=INT.eggI++%E.length;const e=E[i];say('店员：'+e[0],3200);
  if(!(seen&(1<<i))){SAVE[k]=seen|(1<<i);const ef=e[1]||'';if(ef[0]==='c'){const n=+ef.slice(1)||10;coins+=n;saveCoins();setTimeout(()=>toast(`🎁 彩蛋 ${i+1}/6 · 🪙+${n}`,2000),1600);}
    else if(ef==='s'){stamina=100;exhausted=false;setTimeout(()=>toast(`🎁 彩蛋 ${i+1}/6 · 体力回满`,2000),1600);}else if(ef==='h'){hp=Math.min(100,hp+25);setTimeout(()=>toast(`🎁 彩蛋 ${i+1}/6 · 生命 +25`,2000),1600);}
    else setTimeout(()=>toast(`🎁 发现彩蛋 ${i+1}/6`,1800),1600);
    if((SAVE[k]&63)===63)setTimeout(()=>{coins+=66;saveCoins();toast(`🏆 ${INT.p.name} 6 个彩蛋全收集！🪙+66`,2800);},3600);saveCoins();}}
function npcTalk(n){const ln=n.lines[n.li++%n.lines.length];say(`${n.who}：${ln}`,2800);if(!n.gift&&Math.random()<.3){n.gift=1;const c=5+Math.floor(Math.random()*15);coins+=c;saveCoins();setTimeout(()=>toast(`${n.who}塞给你 🪙${c}`,1800),1500);}}
// ---- TOWER ----
function towerEnter(w){const p=w.p,F=towerFloors(p),o=w.o;INT.F=F;INT.dorm=p.name.startsWith('南理工宿舍');
  INT.target=o?(o.floor||(o.floor=2+Math.floor(Math.random()*(F-1)))):0;INT.aptK=o?(o.aptK!=null?o.aptK:(o.aptK=Math.floor(Math.random()*2))):-1;
  if(o&&!o.flAdj){o.flAdj=1;o.lim+=Math.round(INT.target*5);}
  lobbySign.material=new THREE.MeshBasicMaterial({map:textTex([p.name,INT.dorm?'学生宿舍 · 无电梯':'住宅楼 · 1-'+F+'F · 电梯在左手边'],'#24364d','#fff',512,100,40),toneMapped:false});
  cab.position.y=0;INT.elF=1;elDoorL.position.set(2,1.25,4.5);elDoorR.position.set(3.25,1.25,4.5);floorSign.position.y=3.1;setFloorSign(1,true);
  shaftVis(!INT.dorm);setFloor(1);pel.position.copy(iv(7,1.12,.9));FOOTY=IY+1.12;INT.cam={pos:iv(7,2.5,-3),look:iv(7,1.2,4)};
  intHud.textContent=`🏢 ${p.name} · ${o?`送到 ${aptNo(INT.target,INT.aptK)} 室（${INT.target} 楼）`:'随便逛逛 · 顶楼能上天台'}`;
  if(INT.dorm)setTimeout(()=>say('宿舍楼没有电梯……楼梯在右手边',2000),600);}
function aptNo(f,k){return `${f}0${k+1}`;}
function shaftVis(on){[cab,elDoorL,elDoorR,floorSign,cabRope].forEach(o=>o.visible=on);}
const floorPlates=[0,1].map(k=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.6,.3),new THREE.MeshBasicMaterial({color:0xffffff}));m.rotation.y=PI;tower.add(m);return m;});
const DOORX=[5.5,7.5];const hallNPC=makePed(false);scene.remove(hallNPC.g);tower.add(hallNPC.g);
const guard=makePed(false);scene.remove(guard.g);tower.add(guard.g);guard.g.position.set(11.8,0,6.6);guard.g.rotation.y=PI*.75;
function setFloor(f){INT.floor=f;const yF=(f-1)*FH;FOOTY=IY+1.12+yF;DOORX.forEach((x,k)=>{const pl=floorPlates[k];pl.position.set(x,yF+2.35,7.78);pl.material=new THREE.MeshBasicMaterial({map:textTex([f===1?(k?'物业':'快递柜'):aptNo(f,k)],'#c9a227','#222',128,64,40),toneMapped:false});});
  aptDoor.position.set(-50,0,0);hallNPC.g.visible=f>1&&Math.random()<.6;if(hallNPC.g.visible){hallNPC.g.position.set(rnd(4.5,8.5),yF,rnd(5,6.2));hallNPC.g.rotation.y=rnd(0,6);hallNPC.line=pick(HALL_LINES);}guard.g.visible=f===1;}
function towerOk(x,z){const [lx,lz]=L(x,z);if(lx<.5||lx>13.5||lz<.35||lz>7.5)return false;
  if(!INT.dorm&&lx>.9&&lx<4.3&&lz>4.35){if(!(INT.elOpen===INT.floor&&lx>1.5&&lx<3.7))return false;}
  if(lx>12.9&&lz>5.6&&INT.floor===1)return false;
  if(lx>9.3&&lz<3.4)return 'stairs';return true;}
function towerUpdate(dt,t){const w=INT.w,o=w.o;
  if(INT.riding){elevRide(dt);towerCam();return;}if(INT.knock){knockUpd(dt);towerCam();return;}
  if(INT.stairs){stairsUpd(dt);towerCam();return;}
  if(INT.elMove){elevCall(dt);}
  const ok=(x,z)=>{const r=towerOk(x,z);return r===true||r==='stairs';};moveChar(dt,ok);
  const [lx,lz]=L(pel.position.x,pel.position.z);
  if(towerOk(pel.position.x,pel.position.z)==='stairs'){INT.stairs={fl:(INT.floor-1)*2+.02};pel.position.copy(stairPos(INT.stairs.fl));return;}
  let a=null;const f=INT.floor;
  if(f===1&&lz<1.1)a={label:'离开大楼',short:'离开',fn:intExit};
  else if(!INT.dorm&&lx>1.2&&lx<4&&lz>3.2&&lz<4.4&&INT.elOpen!==f)a={label:'按电梯按钮',short:'叫电梯',fn:()=>{INT.elMove={to:f};SFX.tick(.4);toast(INT.elF===f?'🛗 电梯门开了':`🛗 电梯从 ${INT.elF} 楼下来……`,1400);}};
  else if(!INT.dorm&&INT.elOpen===f&&lz>4.7&&lx>1.3&&lx<3.9)a={label:'选择楼层',short:'选楼层',fn:floorPanel};
  else if(lz>6.2&&f>1&&lx>4.3){let k=-1;DOORX.forEach((x,i)=>{if(Math.abs(lx-x)<.9)k=i;});if(k>=0){const mine=o&&!w.done&&f===INT.target&&k===INT.aptK;a={label:mine?`敲门送餐（${aptNo(f,k)}）`:`敲 ${aptNo(f,k)} 的门`,short:'敲门',fn:()=>knock(k,mine)};}}
  else if(f===INT.F&&lx>8.5&&lx<9.4&&lz<3.2&&!o)a=null;
  if(!a&&hallNPC.g.visible&&Math.hypot(lx-hallNPC.g.position.x,lz-hallNPC.g.position.z)<1.6)a={label:'和邻居聊天',short:'对话',fn:()=>say('邻居：'+hallNPC.line,2600)};
  if(!a&&guard.g.visible&&Math.hypot(lx-11.8,lz-6.6)<1.8)a={label:INT.dorm?'和宿管阿姨说话':'和保安聊天',short:'对话',fn:()=>say(INT.dorm?pick(['宿管阿姨：外卖不能上楼！……算了你上去吧，快点下来','宿管阿姨：11 点锁门啊！','宿管阿姨：又是 6 楼那个男生点的？']):pick(['保安：送外卖啊？电梯在那边','保安：登记一下……算了，鹈鹕不用登记','保安：上次有个鹈鹕把电梯按钮全按了']),2800)};
  if(!a&&f===INT.F&&lx<1.6&&lz<1.6)a={label:'上天台',short:'天台',fn:roof};
  setAct(a);actEdge();
  intHud.textContent=`🏢 ${f} 楼${o&&!w.done?` · 目标 ${aptNo(INT.target,INT.aptK)}（${INT.target} 楼）`:''}${f===INT.F?' · 顶楼：左前角可上天台':''}`;towerCam();}
function towerCam(){const tp=pel.position;INT.cam.pos.set(tp.x+.6,tp.y+1.15,Math.max(IZ-2.2,tp.z-4.3));INT.cam.look.set(tp.x,tp.y+.2,tp.z+.8);}
function roof(){const k='roof_'+INT.p.key;if(!SAVE[k]){SAVE[k]=1;coins+=20;saveCoins();toast('🌇 天台上的风景真好！捡到一个红包 🪙20',2800);}else toast('🌇 天台吹吹风，体力 +20',2000);stamina=Math.min(100,stamina+20);}
// elevator
function elevCall(dt){const m=INT.elMove;const ty=(m.to-1)*FH;const y=cab.position.y;if(Math.abs(y-ty)>.02){const ny=y+Math.sign(ty-y)*Math.min(Math.abs(ty-y),dt*5);setCab(ny,ty>y);return;}
  m.t=(m.t||0)+dt;const k=Math.min(1,m.t/.7);elDoorL.position.x=2-k*1.1;elDoorR.position.x=3.25+k*1.1;if(k>=1){INT.elOpen=m.to;INT.elF=m.to;INT.elMove=null;SFX.ding();}}
function setCab(y,up){cab.position.y=y;elDoorL.position.y=elDoorR.position.y=y+1.25;floorSign.position.y=y+3.1;setFloorSign(1+Math.round(y/FH),up);}
function floorPanel(){const opts=[];for(let f=1;f<=INT.F;f++)if(f!==INT.floor)opts.push({t:(f===INT.target?'⭐':'')+f,p:f===INT.target,f:()=>{intBtns([]);INT.riding={to:f,ph:'close',t:0};}});opts.push({t:'✕',f:()=>intBtns([])});intBtns(opts);intUI.classList.add('grid');}
function elevRide(dt){const r=INT.riding;r.t+=dt;
  if(r.ph==='close'){const k=Math.min(1,r.t/.6);elDoorL.position.x=.9+k*1.1;elDoorR.position.x=4.35-k*1.1;pel.position.x+=(IX+2.6-pel.position.x)*Math.min(1,dt*6);pel.position.z+=(IZ+6-pel.position.z)*Math.min(1,dt*6);pel.rotation.set(0,PI/2,0);
    if(k>=1){r.ph='move';r.t=0;INT.elOpen=0;r.stuck=Math.random()<.15?rnd(.3,.7):-1;r.from=cab.position.y;}}
  else if(r.ph==='move'){const ty=(r.to-1)*FH,y=cab.position.y,frac=Math.abs(y-r.from)/Math.max(.1,Math.abs(ty-r.from));
    if(r.stuck>0&&frac>=r.stuck&&!r.stk){r.stk=1;r.stT=2.2;SFX.bump();toast('⚠️ 电梯卡住了！按了紧急按钮……',2000);}
    if(r.stT>0){r.stT-=dt;pel.rotation.z=Math.sin(r.t*30)*.05;return;}pel.rotation.z=0;
    const ny=y+Math.sign(ty-y)*Math.min(Math.abs(ty-y),dt*Math.min(6,1.5+r.t*3));setCab(ny,ty>y);pel.position.y=IY+1.12+ny;
    if(Math.abs(ny-ty)<.01){r.ph='open';r.t=0;SFX.ding();setFloor(r.to);INT.elF=r.to;}}
  else{const k=Math.min(1,r.t/.7);elDoorL.position.x=2-k*1.1;elDoorR.position.x=3.25+k*1.1;if(k>=1){INT.elOpen=r.to;INT.riding=null;intUI.classList.remove('grid');}}}
// stairs
function stairPos(fl){const f=Math.floor(fl/2),k=Math.floor(fl)%2,s=fl-Math.floor(fl);const y=f*FH+k*1.5+s*1.5;const x=k?13.2-s*3.8:9.6+s*3.8;return iv(x,1.12+y,k?2.6:1.2);}
function stairsUpd(dt){const S=INT.stairs;const [x,y]=joyVec();const m=Math.hypot(x,y);
  const fl=S.fl,k=Math.floor(fl)%2;let d=0;
  if(m>.15){camera.getWorldDirection(_f);_f.y=0;_f.normalize();_r.set(-_f.z,0,_f.x);const dir=_r.clone().multiplyScalar(x).addScaledVector(_f,y);const tan=k?-1:1;d=dir.x*tan;if(Math.abs(d)<.35)d=y;
    const run=braking&&stamina>0;const sp=(run?1.6:.9)*Math.sign(d)*Math.min(1,Math.abs(d)+.3);const tired=stamina<=0?.35:1;
    let nf=fl+sp*tired*dt;const maxF=(INT.F-1)*2;nf=Math.max(-.01,Math.min(maxF,nf));
    // leave stairs at a floor landing
    if(nf<=0&&d<0){INT.stairs=null;setFloor(1);pel.position.copy(iv(8.9,1.12,1.6));return;}
    if(sp>0)stamina=Math.max(0,stamina-dt*(INT.dorm?5:6));S.fl=nf;FOOTT+=dt*12;updLegs(FOOTT);
    const a=stairPos(nf),b=stairPos(Math.max(0,Math.min(maxF,nf+(sp>0?.05:-.05))));pel.position.copy(a);pel.position.y+=Math.abs(Math.sin(FOOTT))*.05;if(b.distanceTo(a)>1e-4)faceTo(a,b);
    const nowF=1+Math.floor((nf+.04)/2);if(nowF!==INT.floor&&Math.abs(nf-(nowF-1)*2)<.08){setFloor(nowF);}
    if(!S.mid&&nf>4&&Math.random()<dt*.05){S.mid=1;toast(pick(['👵 邻居奶奶：小伙子，这么高还爬楼啊？','🐱 一只猫蹲在楼梯上盯着你看','📦 楼道里堆满了快递……','🎵 楼上有人在练钢琴']),2200);}}
  const lf=Math.round(S.fl/2)*2,onLanding=Math.abs(S.fl-lf)<.3;const fN=lf/2+1;
  setAct(onLanding?{label:`进入 ${fN} 楼走廊`,short:'进楼层',fn:()=>{INT.stairs=null;setFloor(fN);pel.position.copy(iv(8.9,1.12+(fN-1)*FH,1.6));}}:null);actEdge();
  intHud.textContent=`🪜 ${1+Math.floor((S.fl+.04)/2)} / ${INT.F} 楼${INT.target?` · 目标 ${INT.target} 楼`:''} · 体力 ${Math.round(stamina)}${stamina<=0?' · 爬不动了……':''}`;}
// knocking
function knock(k,mine){const f=INT.floor,yF=(f-1)*FH,x=DOORX[k];aptDoor.position.set(x-.5,yF,7.78);aptDoor.rotation.y=0;SFX.bell&&SFX.bell();say(mine?'咚咚咚……您好，外卖到了！':'咚咚咚……',1400);INT.knock={k,mine,t:0,x};setAct(null);}
function knockUpd(dt){const c=INT.knock,w=INT.w,f=INT.floor,yF=(f-1)*FH;c.t+=dt;
  if(c.t>1.3&&!c.opened){c.opened=1;if(!c.mine&&Math.random()<.45){c.t=99;say(pick(['（没人在家）','屋里传来狗叫：汪汪汪！！','大爷：谁啊？我没点外卖！','（里面有人在打游戏，没理你）']),2200);setTimeout(()=>{INT.knock=null;},1600);return;}
    aptDoor.rotation.y=-1.3;cust.g.visible=true;cust.g.position.set(c.x,yF,7.4);cust.g.rotation.y=PI/2;
    if(c.mine){if(w.ev){const ev=w.ev;w.ev=null;ev(w);}c.wait=Math.max(1.2,w.wait||1.6);}else{c.wait=1.8;say(pick(['邻居：送错啦，不是我家的','阿姨：小鹈鹕，要不要吃个苹果？','学生：哥们帮我带个快递呗……开玩笑的']),2400);}}
  if(c.opened&&c.t>1.3+c.wait&&!c.handed){c.handed=1;if(c.mine&&!w.redirect){w.done=true;delivered(w.o);bag.visible=false;}setTimeout(()=>{aptDoor.rotation.y=0;cust.g.visible=false;INT.knock=null;},1100);}}
// shared update
function intUpdate(dt,t){if(!INT.on)return;const c=INT;if(state==='paused')return;
  if(INT.p.shop)shopUpdate(dt,t);else towerUpdate(dt,t);
  intLight.position.copy(pel.position).add(V(0,2.4,-1.5));
  camera.position.lerp(c.cam.pos,Math.min(1,dt*4));const lk=c.lk||(c.lk=c.cam.look.clone());lk.lerp(c.cam.look,Math.min(1,dt*4));camera.lookAt(lk);}
// ===== on-foot outdoors =====
const FOOT={yaw:0};
function startFoot(){if(state!=='ride')return;state='foot';v=0;pel.updateMatrixWorld(true);scene.attach(pel);const h=heading;const side=V(Math.sin(h),0,Math.cos(h));
  pel.position.copy(player.position).addScaledVector(side,1.1);pel.position.y=1.12;FOOTY=1.12;pel.rotation.set(0,h,0);FOOT.yaw=h;camInit=false;setPad(true);thiefT=rnd(10,22);toast('🚶 下车步行：摇杆移动，按住「跑」奔跑，「互动」上车/进门',2600);}
function endFoot(){if(state!=='foot')return;lean.attach(pel);pel.position.copy(drive==='car'?PCAR:PC);pel.quaternion.identity();pel.scale.set(1,1,1);state='ride';setPad(false);camInit=false;closePhone();syncBag&&syncBag();}
function footOk(x,z){const dx=Math.abs(x-Math.round(x/B)*B),dz=Math.abs(z-Math.round(z/B)*B);return Math.min(dx,dz)<R+2.4;}
function footUpdate(dt,t){if(phoneOpen){setAct(null);footCam(dt);thiefUpdate(dt);return;}
  const dir=moveChar(dt,footOk);if(dir){FOOT.yaw+=angWrap(Math.atan2(-dir.z,dir.x)-FOOT.yaw)*Math.min(1,dt*(joyVec()[1]>.2?1.6:.5));}
  const pp=pel.position;let a=null;const bd=Math.hypot(pp.x-player.position.x,pp.z-player.position.z);
  if(player.visible&&bd<2.6)a={label:'骑上车',short:'上车',fn:endFoot};
  else{let best=null,dd=3.2;for(const p of curPOI){const d=Math.hypot(p.door.x-pp.x,p.door.z-pp.z);if(d<dd){dd=d;best=p;}}
    if(best){const hp_=homeP();if(hp_&&best.key===hp_.key)a={label:'回家',short:'回家',fn:goHome};else{const o=orders.find(o=>(o.phase==='pick'&&o.shop.key===best.key)||(o.phase==='carry'&&o.home.key===best.key));
      a={label:`进入 ${best.name}${o?(o.phase==='pick'?' · 取餐':' · 送餐'):''}`,short:'进门',fn:()=>enterOnFoot(best,o)};}}}
  {const sa=sqAct(pp);if(sa)a=sa;}setAct(a);actEdge();thiefUpdate(dt);footCam(dt);}
function angWrap(a){while(a>PI)a-=2*PI;while(a<-PI)a+=2*PI;return a;}
function footCam(dt){const pp=pel.position,f=V(Math.cos(FOOT.yaw),0,-Math.sin(FOOT.yaw));const want=pp.clone().addScaledVector(f,-5.2);want.y=pp.y+2.4;if(!camInit){camera.position.copy(want);camInit=true;}camera.position.lerp(want,Math.min(1,dt*3.5));camera.lookAt(pp.x+f.x*2,pp.y+.5,pp.z+f.z*2);}
function enterOnFoot(p,o){const door=pel.position.clone();door.y=1.12;state='walk';walk={o:o||null,isPick:p.shop,p,p0:door.clone(),q0:pel.quaternion.clone(),door,ph:'inside',t:0,dur:1,wait:1.6,ev:null,theta:0,foot:true};
  if(o&&Math.random()<(p.shop?.3:.4))walk.ev=p.shop?pick(EV_PICK):pick(EV_DROP);if(o&&p.shop&&SHOP_EGG[p.name]&&Math.random()<.4)walk.ev=pick(SHOP_EGG[p.name]);intEnter(walk);}
function startVisit(p){const o=orders.find(o=>(o.phase==='pick'&&o.shop.key===p.key)||(o.phase==='carry'&&o.home.key===p.key))||null;if(o){startWalk(o);return;}
  state='walk';pel.updateMatrixWorld(true);scene.attach(pel);const p0=pel.position.clone(),q0=pel.quaternion.clone();
  const door=p.door.clone().addScaledVector(p.n,.6);door.y=1.12;walk={o:null,isPick:p.shop,visit:true,p,p0,q0,door,ph:'out',t:0,dur:Math.max(1.2,p0.distanceTo(door)/2.6),wait:1.2,ev:null,theta:0};v=0;}
function nearDoor(){if(!freeMode()||state!=='ride'||v>1)return null;const pp=player.position;const hp_=homeP();{const sa=sqAct(pp,6);if(sa&&!(SQ&&SQ.act&&sa===SQ.act&&SQ.type.k!=='treasure'))return {key:'sq'+sa.label,label:'❗ '+sa.label.replace(/^❗ /,''),fn:sa.fn};}
  if(hp_&&Math.hypot(hp_.park.x-pp.x,hp_.park.z-pp.z)<8)return {key:'home',label:'🏠 回家',fn:goHome};
  let best=null,bd=1e9;for(const p of curPOI){const d=Math.hypot(p.park.x-pp.x,p.park.z-pp.z);if(d<bd){bd=d;best=p;}}
  if(best&&bd<7&&!orders.some(o=>tgtOf(o).key===best.key))return {key:'door'+best.key,label:`🚪 进入 ${best.name}`,fn:()=>startVisit(best)};
  if(v<.4&&!stolen)return {key:'foot',label:'🚶 下车步行',fn:startFoot};return null;}
