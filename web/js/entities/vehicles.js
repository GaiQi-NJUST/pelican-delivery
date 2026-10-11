'use strict';
// ── js/entities/vehicles.js ──
// 车辆：CARS 建模、VPAR 参数、挡位/转向灯/倒车、车牌补丁
// ===== vehicles =====
const glassM=M(0x1c2632,{metalness:.9,roughness:.08}),tyreM=M(0x151515,{roughness:.9}),rimM=M(0xc8c8c8,{metalness:.9,roughness:.25}),darkM=M(0x111111,{roughness:.6});
const headM=M(0xffffff,{emissive:0xfff6dc,emissiveIntensity:.6});
function prof(pts,w,mat,inset){const s=new THREE.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:w-2*(inset||0)-.12,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2,curveSegments:4});g.translate(0,0,-(w-2*(inset||0)-.12)/2);return new THREE.Mesh(g,mat);}
const wheelG=new THREE.CylinderGeometry(1,1,1,18);wheelG.rotateX(PI/2);const hubG=new THREE.CylinderGeometry(.62,.62,1.06,8);hubG.rotateX(PI/2);
function addWheel(g,x,z,r,wd,list){const w=new THREE.Group();w.position.set(x,r,z);g.add(w);const t=mesh(wheelG,tyreM,w);t.scale.set(r,r,wd);const h=mesh(hubG,rimM,w);h.scale.set(r,r,wd);
  const sp=mesh(new THREE.BoxGeometry(r*1.15,r*.16,wd*1.08),darkM,w);list.push({w,r});return w;}
const CARS={
  sedan:{n:'轿车',len:4.7,w:1.85,vmax:13.5,r:.33,body:[[-2.35,.32],[2.3,.32],[2.38,.62],[2.25,.82],[.95,.95],[-1.9,.98],[-2.36,.84]],cab:[[.95,.9],[.2,1.42],[-1.15,1.45],[-1.9,.95]],cols:[0xd8d8d8,0x2b2b2b,0x8a1c1c,0x2a4d7a,0xe8e2d0,0x5c6b5a]},
  bmw:{n:'宝马',len:4.95,w:1.9,vmax:15,r:.35,body:[[-2.47,.33],[2.45,.33],[2.5,.62],[2.38,.82],[1.0,.96],[-1.95,1.0],[-2.48,.86]],cab:[[1.0,.92],[.18,1.44],[-1.2,1.47],[-2.0,.97]],cols:[0x1c3d78,0xf2f2f2,0x111111,0x6b6f75],bmw:true},
  pana:{n:'帕拉梅拉',len:5.05,w:1.95,vmax:17,r:.36,body:[[-2.52,.3],[2.5,.3],[2.56,.52],[2.42,.72],[1.15,.84],[-2.1,.9],[-2.53,.74]],cab:[[1.15,.8],[.15,1.3],[-.75,1.33],[-2.32,.86]],cols:[0xb8bcc2,0xc4161c,0x1f4d3a,0x0d0d0d,0xe6e1d3],pana:true},
  hatch:{n:'小轿车',len:4.0,w:1.75,vmax:12.5,r:.31,body:[[-2.0,.32],[1.98,.32],[2.04,.62],[1.9,.84],[.8,.92],[-1.95,.95],[-2.0,.8]],cab:[[.8,.88],[.05,1.45],[-1.88,1.45],[-1.95,.92]],cols:[0xf5d547,0x7fb3d5,0xffffff,0xe86f4c,0x9bc47a]},
  suv:{n:'SUV',len:4.8,w:1.95,vmax:13,r:.38,body:[[-2.4,.42],[2.38,.42],[2.45,.85],[2.3,1.05],[1.2,1.13],[-2.35,1.16],[-2.4,1.0]],cab:[[1.2,1.08],[.45,1.76],[-2.28,1.76],[-2.35,1.12]],cols:[0x3a3f45,0xffffff,0x6d4c2f,0x2f5f8a]},
  semi:{n:'半挂车',len:6.6,w:2.5,vmax:11,r:.5}
};
const TYPES=['sedan','sedan','bmw','bmw','pana','hatch','hatch','suv','semi'];
function badgeTex(){return canvasTex(64,64,(x)=>{x.fillStyle='#111';x.beginPath();x.arc(32,32,31,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(32,32,22,0,7);x.fill();x.fillStyle='#1c69d4';x.beginPath();x.moveTo(32,32);x.arc(32,32,22,-PI/2,0);x.fill();x.beginPath();x.moveTo(32,32);x.arc(32,32,22,PI/2,PI);x.fill();});}
let bmwBadgeT=null;
function trailerTex(){return canvasTex(512,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#fbfbfb');g.addColorStop(1,'#e2e2e2');x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='#ff7a1a';x.fillRect(0,h-22,w,10);x.fillStyle='#1f2f55';x.font='bold 50px sans-serif';x.fillText('鹈鹕物流',24,70);x.font='bold 22px sans-serif';x.fillText('PELICAN EXPRESS · 使命必达',26,100);x.font='64px sans-serif';x.fillText('🐟',420,82);});}
let trailerT=null;
function buildCar(type){const S=CARS[type];const g=new THREE.Group();const wheels=[];const col=pick(S.cols||[0xffffff]);
  if(type==='semi'){const cabM=M(pick([0xd93a2b,0x2563b8,0xf2f2f2,0x2f8f4e]),{metalness:.4,roughness:.35});
    mesh(new THREE.BoxGeometry(6.4,.35,1.1),darkM,g).position.set(-1.6,.75,0);
    const cab=prof([[-.9,.75],[1.6,.75],[1.68,1.5],[1.6,2.7],[1.25,3.05],[-.9,3.05]],2.45,cabM);cab.castShadow=true;g.add(cab);
    const ws=mesh(new THREE.PlaneGeometry(1.15,2.1),glassM,g);ws.position.set(1.66,2.35,0);ws.rotation.set(0,PI/2,0);ws.rotation.z=-.12;
    for(const s of[-1,1]){const sw=mesh(new THREE.PlaneGeometry(.8,.7),glassM,g);sw.position.set(.9,2.45,s*1.235);if(s<0)sw.rotation.y=PI;
      tube(V(-1.0,1.2,s*1.0),V(-1.0,3.5,s*1.0),.07,.07,chrome,g,8);const tk=mesh(new THREE.CylinderGeometry(.32,.32,1.1,14),chrome,g);tk.rotation.z=PI/2;tk.position.set(-.1,.95,s*.95);}
    mesh(new THREE.BoxGeometry(.08,.7,1.9),chrome,g).position.set(1.69,1.35,0);
    for(const s of[-1,1]){const hl=mesh(new THREE.BoxGeometry(.06,.18,.4),headM,g);hl.position.set(1.7,1.0,s*.9);}
    addWheel(g,.75,1.05,.5,.35,wheels);addWheel(g,.75,-1.05,.5,.35,wheels);for(const x of[-2.5,-3.6])for(const s of[-1,1])addWheel(g,x,s*1.0,.5,.55,wheels);
    const tr=new THREE.Group();if(!trailerT)trailerT=trailerTex();const sideM=M(0xffffff,{map:trailerT,roughness:.6});const plainM=M(0xeeeeee,{roughness:.6});
    const box=mesh(new THREE.BoxGeometry(13.4,2.75,2.5),[plainM,plainM,plainM,darkM,sideM,sideM],tr);box.position.set(-5.9,2.72,0);
    mesh(new THREE.BoxGeometry(12,.25,1.2),darkM,tr).position.set(-6.2,1.25,0);
    const trW=[];for(const x of[-10.4,-11.6])for(const s of[-1,1])addWheel(tr,x,s*1.0,.5,.55,trW);
    const tl=new THREE.MeshStandardMaterial({color:0x550000,emissive:0xff2020,emissiveIntensity:.5});for(const s of[-1,1])mesh(new THREE.BoxGeometry(.06,.18,.35),tl,tr).position.set(-12.62,1.5,s*1.0);
    scene.add(tr);trW.forEach(w=>wheels.push(w));
    return {g,tr,wheels,tail:[tl],len:6.6,w:2.5,hl:3.3,hw:1.25};}
  const bodyM=M(col,{metalness:.55,roughness:.28});
  const b=prof(S.body,S.w,bodyM);b.name='body';b.castShadow=true;b.receiveShadow=true;g.add(b);
  const c=prof(S.cab,S.w,glassM,.1);c.name='cab';c.castShadow=true;g.add(c);
  // roof strip & pillars
  const roofPts=S.cab;const roofM=mesh(new THREE.BoxGeometry(Math.abs(roofPts[1][0]-roofPts[2][0])+.05,.05,S.w-.3),bodyM,g).position.set((roofPts[1][0]+roofPts[2][0])/2,Math.max(roofPts[1][1],roofPts[2][1])+.02,0);roofM.name='roof';
  for(const s of[-1,1]){const fr=S.body[2],tail=S.body[S.body.length-1];
    const hl=mesh(new THREE.BoxGeometry(.08,.12,.42),headM,g);hl.position.set(fr[0]-.02,fr[1]-.02,s*(S.w/2-.32));
    const mir=mesh(new THREE.BoxGeometry(.12,.1,.2),bodyM,g);mir.position.set(S.cab[0][0]-.1,S.cab[0][1]+.05,s*(S.w/2+.05));}
  const tl=new THREE.MeshStandardMaterial({color:0x550000,emissive:0xff2020,emissiveIntensity:.45});
  const tailP=S.body[S.body.length-1];
  if(S.pana){mesh(new THREE.BoxGeometry(.06,.07,S.w-.2),tl,g).position.set(tailP[0]-.04,tailP[1]-.04,0);const sp=mesh(new THREE.BoxGeometry(.35,.03,S.w-.5),darkM,g);sp.position.set(tailP[0]+.25,tailP[1]+.1,0);
    for(const s of[-1,1])mesh(new THREE.CylinderGeometry(.05,.05,.1,10),chrome,g).position.set(tailP[0]-.05,.38,s*.55);}
  else for(const s of[-1,1])mesh(new THREE.BoxGeometry(.07,.16,.38),tl,g).position.set(tailP[0]-.03,tailP[1]-.08,s*(S.w/2-.3));
  const fr=S.body[2];
  if(S.bmw){for(const s of[-1,1]){const k=mesh(new THREE.BoxGeometry(.06,.2,.22),darkM,g);k.position.set(fr[0]+.02,fr[1]-.08,s*.14);const kr=mesh(new THREE.BoxGeometry(.05,.23,.25),chrome,g);kr.position.set(fr[0]-.0,fr[1]-.08,s*.14);}
    if(!bmwBadgeT)bmwBadgeT=badgeTex();const bd=mesh(new THREE.CircleGeometry(.07,20),M(0xffffff,{map:bmwBadgeT,metalness:.3,roughness:.3}),g);bd.position.set(fr[0]-.12,fr[1]+.2,0);bd.rotation.set(-PI/2,0,-PI/2);bd.rotation.x=-PI/2+.35;}
  else mesh(new THREE.BoxGeometry(.05,.14,S.w*.45),darkM,g).position.set(fr[0]+.02,fr[1]-.12,0);
  if(S.pana){const lg=mesh(new THREE.BoxGeometry(.06,.05,.3),M(0xffffff,{emissive:0xffffff,emissiveIntensity:.8}),g);lg.position.set(fr[0]-.02,fr[1]+.05,0);}
  const wx=S.len/2-.82;for(const x of[wx,-wx+.05])for(const s of[-1,1])addWheel(g,x,s*(S.w/2-.12),S.r,.24,wheels);
  const ret={g,tr:null,wheels,tail:[tl],len:S.len,w:S.w,hl:S.len/2,hw:S.w/2};if(S.police)decoratePolice(ret);return ret;}
const cars=[];let carId=0;
function carPos(c){const t=clamp(c.s/c.segLen,0,1);
  if(c.seg===0){c.pos.copy(c.A).lerp(c.Bp,t);c.fwd.set(D[c.dir][0],0,D[c.dir][1]);}
  else{const u=1-t;c.pos.set(u*u*c.A.x+2*u*t*c.C.x+t*t*c.Bp.x,0,u*u*c.A.z+2*u*t*c.C.z+t*t*c.Bp.z);c.fwd.set(2*u*(c.C.x-c.A.x)+2*t*(c.Bp.x-c.C.x),0,2*u*(c.C.z-c.A.z)+2*t*(c.Bp.z-c.C.z));if(c.fwd.lengthSq()<1e-6)c.fwd.set(D[c.nd][0],0,D[c.nd][1]);c.fwd.normalize();}}
function setStraight(c){const [dx,dz]=D[c.dir],rx=-dz,rz=dx,nx=c.node[0]*B,nz=c.node[1]*B;
  const r=Math.random();c.nd=c.type==='semi'?(r<.75?c.dir:(c.dir+1)%4):(r<.55?c.dir:r<.78?(c.dir+1)%4:(c.dir+3)%4);
  const lo0=c.lo||5.25;c.lo=c.nd===(c.dir+1)%4?5.25:c.nd===(c.dir+3)%4?1.75:(c.type==='semi'?5.25:Math.random()<.5?1.75:5.25);
  c.A.set(nx+dx*R+rx*lo0,0,nz+dz*R+rz*lo0);c.Bp.set(nx+dx*(B-R)+rx*c.lo,0,nz+dz*(B-R)+rz*c.lo);c.segLen=B-2*R;c.seg=0;}
function setTurn(c){const Mx=c.node[0]+D[c.dir][0],Mz=c.node[1]+D[c.dir][1];const [ex,ez]=D[c.nd],rx=-ez,rz=ex;
  const start=c.Bp.clone(),exit=V(Mx*B+ex*R+rx*c.lo,0,Mz*B+ez*R+rz*c.lo);c.A.copy(start);c.Bp.copy(exit);
  if(c.nd===c.dir)c.C.copy(start).lerp(exit,.5);else if(D[c.dir][0]!==0)c.C.set(exit.x,0,start.z);else c.C.set(start.x,0,exit.z);
  let L=0,p=start.clone();for(let i=1;i<=8;i++){const t=i/8,u=1-t;const q=V(u*u*start.x+2*u*t*c.C.x+t*t*exit.x,0,u*u*start.z+2*u*t*c.C.z+t*t*exit.z);L+=q.distanceTo(p);p=q;}
  c.segLen=L;c.seg=1;c.nextNode=[Mx,Mz];}
function spawnCar(){const pi=Math.round(player.position.x/B),pj=Math.round(player.position.z/B);
  for(let tries=0;tries<12;tries++){const type=Math.random()<.1?'police':pick(TYPES);const c={id:carId++,type,node:[pi+Math.floor(rnd(-2,2.99)),pj+Math.floor(rnd(-2,2.99))],dir:Math.floor(Math.random()*4),A:V(),Bp:V(),C:V(),pos:V(),fwd:V(),s:0,v:0,stopT:0,near:false,seen:false,tr:null};
    setStraight(c);c.s=rnd(0,c.segLen*.8);carPos(c);
    const dp=c.pos.distanceTo(player.position);if(dp<45||dp>210)continue;
    if(cars.some(o=>o.pos.distanceTo(c.pos)<16))continue;
    const b=buildCar(type);Object.assign(c,{g:b.g,trg:b.tr,wheels:b.wheels,tail:b.tail,bar:b.bar,len:b.len,hl:b.hl,hw:b.hw,vmax:CARS[type].vmax*rnd(.85,1.1)});c.v=c.vmax*.7;
    if(b.tr){c.trT=c.pos.clone().addScaledVector(c.fwd,-(3.2+11));}
    scene.add(c.g);cars.push(c);placeCar(c);return;}}
function disposeCar(c){[c.g,c.trg].forEach(o=>{if(!o)return;scene.remove(o);o.traverse(m=>{if(m.isMesh&&m.geometry!==wheelG&&m.geometry!==hubG&&m.geometry!==lampG)m.geometry.dispose();});});}
const hitch=V(),tdir=V();
function placeCar(c){c.g.position.copy(c.pos);c.g.rotation.y=Math.atan2(-c.fwd.z,c.fwd.x);
  if(c.trg){hitch.copy(c.pos).addScaledVector(c.fwd,-3.0);tdir.subVectors(hitch,c.trT);tdir.y=0;if(tdir.lengthSq()<1e-4)tdir.copy(c.fwd);tdir.normalize();c.trT.copy(hitch).addScaledVector(tdir,-11);
    c.trg.position.copy(hitch);c.trg.rotation.y=Math.atan2(-tdir.z,tdir.x);c.trC=c.trC||V();c.trC.copy(hitch).addScaledVector(tdir,-5.9);c.trF=c.trF||V();c.trF.copy(tdir);}}


// ===== shop / garage / outfits =====
let drive='bike';const PCAR=V(PC.x-.35,PC.y-.35,-.5);
const pcar=buildCar('pana');player.add(pcar.g);pcar.g.visible=false;
['cab','roof'].forEach(n=>{const o=pcar.g.getObjectByName(n);if(o)o.visible=false;});
pcar.g.getObjectByName('body').material.color.setHex(0xc4161c);
const seat=mesh(new THREE.BoxGeometry(.6,.5,.55),M(0x2a1a14,{roughness:.6}),pcar.g);seat.position.set(-.55,.85,-.45);
const seat2=mesh(new THREE.BoxGeometry(.6,.5,.55),M(0x2a1a14,{roughness:.6}),pcar.g);seat2.position.set(-.55,.85,.45);
const wsf=mesh(new THREE.PlaneGeometry(1.6,.45),new THREE.MeshStandardMaterial({color:0x8fb3c9,transparent:true,opacity:.35,metalness:.9,roughness:.05,side:THREE.DoubleSide}),pcar.g);wsf.position.set(.75,1.1,0);wsf.rotation.set(0,PI/2,0);wsf.rotateX(-.6);
const sw=mesh(new THREE.TorusGeometry(.17,.025,8,24),darkM,pcar.g);sw.position.set(.15,1.05,-.45);sw.rotation.y=PI/2;sw.rotation.x=.4;
// ===== motorcycle / trainer / blinkers =====
const VPAR={bike:{},moto:{acc:8,vmax:33,brk:11},car:{acc:10,vmax:40,brk:13}};
let gearMode='D',revMode=false;let belt=false,gear=1,sig=0,sigT=0,exam=null,fieldOn=false,camTop=false;
const blinkL=new THREE.MeshStandardMaterial({color:0x5a3a00,emissive:0xffa000,emissiveIntensity:0}),blinkR=blinkL.clone();
function addBlink(g,fx,rx,y,hw,s){for(const x of[fx,rx])for(const k of[-1,1]){const b=mesh(new THREE.BoxGeometry(.08*s,.07*s,.12*s),k<0?blinkL:blinkR,g);b.position.set(x,y,k*hw);}}
addBlink(pcar.g,2.5,-2.5,.62,.8,1);
const moto=new THREE.Group();lean.add(moto);moto.visible=false;
const motoM=M(0x1b5fd1,{metalness:.6,roughness:.25});const mwh=[];
for(const x of[-.72,.8]){const g=new THREE.Group();g.position.set(x,.34,0);moto.add(g);mesh(new THREE.TorusGeometry(.25,.085,12,28),tyreM,g);const r=mesh(new THREE.CylinderGeometry(.18,.18,.09,20),rimM,g);r.rotation.x=PI/2;
  for(let i=0;i<5;i++){const s=mesh(new THREE.BoxGeometry(.34,.035,.035),darkM,g);s.rotation.z=i*PI/5;}mwh.push(g);}
(function(){const tk=mesh(new THREE.SphereGeometry(1,20,12),motoM,moto);tk.scale.set(.36,.16,.19);tk.position.set(.18,.88,0);
  mesh(new THREE.BoxGeometry(.6,.09,.26),M(0x1a1a1a,{roughness:.7}),moto).position.set(-.3,.86,0);
  mesh(new THREE.BoxGeometry(.46,.34,.26),M(0x6d7177,{metalness:.8,roughness:.35}),moto).position.set(0,.5,0);
  tube(V(-.1,.36,.17),V(-.95,.56,.17),.05,.045,chrome,moto);
  tube(V(.55,.98,0),V(.05,.45,0),.045,.045,motoM,moto);tube(V(-.5,.82,0),V(-.72,.36,0),.035,.035,motoM,moto);
  const rf=mesh(new THREE.BoxGeometry(.45,.04,.17),motoM,moto);rf.position.set(-.75,.66,0);rf.rotation.z=.25;
  for(const s of[-1,1])tube(V(.62,1.0,s*.1),V(.8,.34,s*.1),.03,.03,chrome,moto);
  tube(V(.6,1.1,-.34),V(.6,1.1,.34),.022,.022,darkM,moto);
  const hl=mesh(new THREE.SphereGeometry(.09,14,10),headM,moto);hl.position.set(.74,.96,0);
  const ff=mesh(new THREE.BoxGeometry(.38,.04,.16),motoM,moto);ff.position.set(.82,.64,0);ff.rotation.z=-.3;
  addBlink(moto,.72,-.95,.8,.2,.8);})();
function cabrio(c,col){['cab','roof'].forEach(n=>{const o=c.g.getObjectByName(n);if(o)o.visible=false;});c.g.getObjectByName('body').material.color.setHex(col);
  for(const s of[-1,1])mesh(new THREE.BoxGeometry(.6,.5,.55),M(0x2a1a14,{roughness:.6}),c.g).position.set(-.55,.85,s*.45);
  const w=mesh(new THREE.TorusGeometry(.17,.025,8,24),darkM,c.g);w.position.set(.15,1.05,-.45);w.rotation.y=PI/2;w.rotation.x=.4;}
const trainer=buildCar('hatch');player.add(trainer.g);trainer.g.visible=false;cabrio(trainer,0xf4f4f0);addBlink(trainer.g,1.98,-1.98,.62,.72,1);
(function(){const t=canvasTex(256,64,(x,w,h)=>{x.fillStyle='#ffd400';x.fillRect(0,0,w,h);x.fillStyle='#111';x.font='bold 44px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('教 练 车',w/2,h/2+2);});
  for(const s of[-1,1]){const p=mesh(new THREE.PlaneGeometry(1.3,.32),M(0xffffff,{map:t}),trainer.g);p.position.set(-.3,.6,s*(.876+.01));if(s<0)p.rotation.y=PI;}
  const top=mesh(new THREE.BoxGeometry(.5,.28,.08),M(0xffffff,{map:t}),trainer.g);top.position.set(-1.7,1.15,0);top.rotation.y=PI/2;
  tube(V(-1.7,.9,0),V(-1.7,1.02,0),.03,.03,darkM,trainer.g);})();
let curCar=pcar;
function setModel(id){drive=id==='bike'?'bike':id==='moto'?'moto':'car';curCar=id==='trainer'?trainer:pcar;
  bike.visible=id==='bike';moto.visible=id==='moto';pcar.g.visible=id==='pana';trainer.g.visible=id==='trainer';
  legs.forEach(L=>{[L.th,L.sn,L.kn,L.ft].forEach(m=>m.visible=id==='bike');});
  if(pel.parent===lean)pel.position.copy(drive==='car'?PCAR:PC);gear=1;gearMode='D';revMode=false;sig=0;if(window.updShift)updShift();
  const motor=drive!=='bike';$('gas').textContent=motor?'油门':'蹬车';$('bell').innerHTML='<i class="ico i-bell"></i>';
  $('sig').style.display=motor?'flex':'none';$('gear').style.display=drive==='car'?'block':'none';$('beltB').style.display=drive==='car'&&!exam?'block':'none';$('beltB').classList.toggle('on2',belt);$('topv').style.display=fieldOn?'block':'none';updSigUI();}
function updSigUI(){$('sigL').classList.toggle('on',sig===-1);$('sigR').classList.toggle('on',sig===1);$('gear').textContent=gear>0?'D':'R';$('gear').classList.toggle('rev',gear<0);}
let sigH0=0;
function setSig(s){sig=sig===s?0:s;sigT=0;sigH0=heading;updSigUI();SFX.tick(.08);}
$('sigL').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();setSig(-1);});
$('sigR').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();setSig(1);});
function setGear(m,quiet){if(drive!=='car')return;if(m===gearMode)return;
  if(v>.5&&(m==='R'||m==='P'||gearMode==='R')&&m!=='N'){toast('先踩刹车停稳，再挂 '+m+' 挡',1400);return;}
  gearMode=m;gear=m==='R'?-1:1;updSigUI();SFX.tick(.1);if(!quiet)toast({P:'P 驻车挡',R:'R 倒车挡',N:'N 空挡',D:'D 前进挡'}[m],800);if(window.updShift)updShift();}
function toggleGear(){setGear(gearMode==='R'?'D':'R');}
$('gear').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();toggleGear();});
$('topv').addEventListener('pointerdown',e=>{e.preventDefault();camTop=!camTop;camInit=false;});
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;if(e.code==='KeyQ')setSig(-1);if(e.code==='KeyE')setSig(1);if(e.code==='KeyR')toggleGear();});
let sigAcc=0;
function updSignals(dt,t){sigT+=dt;if(sig){sigAcc+=dt;if(sigAcc>.4){sigAcc=0;SFX.tick(.05);}let dh=Math.abs(((heading-sigH0+PI*3)%(PI*2))-PI);if(dh>1.2&&v>.5){sig=0;updSigUI();}}
  const on=sig&&(t*2.5%1)<.5;blinkL.emissiveIntensity=sig===-1&&on?3:0;blinkR.emissiveIntensity=sig===1&&on?3:0;}


(function(){
  // self-contained：车牌覆盖必须等 buildCar 定义后执行，故放在 entities/vehicles.js
    const AN=renderer.capabilities.getMaxAnisotropy?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;
    const hiTex=(w,h,fn)=>{const t=canvasTex(w,h,fn,true);t.anisotropy=AN;t.needsUpdate=true;return t;};
  // Chinese-style license plates
  const plateTs=[];const PL='ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  for(let i=0;i<8;i++)plateTs.push(hiTex(256,84,(x,w,h)=>{const green=i===7;x.fillStyle=green?'#e8f5e9':'#1f4fb4';x.fillRect(0,0,w,h);
    if(green){const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#f4fff4');g.addColorStop(1,'#4caf62');x.fillStyle=g;x.fillRect(0,0,w,h);}
    x.strokeStyle=green?'#2b2b2b':'#ffffff';x.lineWidth=4;x.strokeRect(5,5,w-10,h-10);x.fillStyle=green?'#111':'#fff';x.font='bold 50px sans-serif';x.textBaseline='middle';
    let t='苏'+pick(['A','A','A','B','E'])+'·';for(let k=0;k<(green?6:5);k++)t+=PL[Math.floor(Math.random()*PL.length)];x.textAlign='center';x.fillText(t,w/2,h/2+3,w-20);}));
  const plateG=new THREE.PlaneGeometry(.44,.145);
  const _bc=buildCar;
  buildCar=function(type){const r=_bc(type);try{const S=CARS[type];const pm=new THREE.MeshStandardMaterial({map:pick(plateTs),roughness:.4,metalness:.2});
    if(type==='semi'){const f=new THREE.Mesh(new THREE.PlaneGeometry(.44,.145),pm);f.position.set(1.74,.95,0);f.rotation.y=PI/2;r.g.add(f);}
    else if(S&&S.body){const fr=S.body[1],tl=S.body[0];const f=new THREE.Mesh(new THREE.PlaneGeometry(.44,.145),pm);f.position.set(fr[0]+.1,fr[1]+.16,0);f.rotation.y=PI/2;r.g.add(f);
      const b=new THREE.Mesh(new THREE.PlaneGeometry(.44,.145),pm);b.position.set(tl[0]-.1,tl[1]+.24,0);b.rotation.y=-PI/2;r.g.add(b);}}catch(e){}return r;};
})();
