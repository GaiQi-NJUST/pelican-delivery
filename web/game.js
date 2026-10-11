(function(){
'use strict';
const $=id=>document.getElementById(id);
function fail(m){const e=$('err');e.textContent=m;e.style.display='flex';}
if(!window.THREE){fail('three.js 加载失败，请检查网络后刷新');return;}
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true});}catch(e){fail('此设备不支持 WebGL');return;}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,0.1,900);
const V=(x,y,z)=>new THREE.Vector3(x,y||0,z||0);
const UP=V(0,1,0),PI=Math.PI;
const M=(c,o)=>new THREE.MeshStandardMaterial(Object.assign({color:c},o||{}));
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function mesh(g,m,p){const o=new THREE.Mesh(g,m);o.castShadow=true;o.receiveShadow=true;if(p)p.add(o);return o;}
function seg(o,a,b){const d=new THREE.Vector3().subVectors(b,a);const L=d.length()||1e-4;o.position.copy(a).addScaledVector(d,.5);o.quaternion.setFromUnitVectors(UP,d.divideScalar(L));o.scale.set(1,L,1);}
function tube(a,b,r1,r2,m,p,rs){const o=mesh(new THREE.CylinderGeometry(r2,r1,1,rs||12),m,p);seg(o,a,b);return o;}
function taper(curve,n,rs,re,rad){const fr=curve.computeFrenetFrames(n,false);const pos=[],idx=[];
  for(let i=0;i<=n;i++){const t=i/n,P=curve.getPointAt(t),N=fr.normals[i],B=fr.binormals[i],r=rs+(re-rs)*t;
    for(let j=0;j<=rad;j++){const a=j/rad*PI*2,c=Math.cos(a),s=Math.sin(a);pos.push(P.x+r*(c*N.x+s*B.x),P.y+r*(c*N.y+s*B.y),P.z+r*(c*N.z+s*B.z));}}
  for(let i=0;i<n;i++)for(let j=0;j<rad;j++){const a=i*(rad+1)+j,b=(i+1)*(rad+1)+j;idx.push(a,b,a+1,b,b+1,a+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();return g;}
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping;}t.anisotropy=4;return t;}
function speckle(x,w,h,n,a){for(let i=0;i<n;i++){const l=Math.random()<.5;x.fillStyle=l?`rgba(255,255,255,${Math.random()*a})`:`rgba(0,0,0,${Math.random()*a})`;x.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*2,1+Math.random()*2);}}
const dummy=new THREE.Object3D();

// ===== constants =====
const IMG=/*IMGS*/{};const PHI=(c)=>`<i class="phI${c?' '+c:''}" style="background-image:url(${IMG.cbtn})"></i>`;
const B=120,RH=9,R=11,LO=5.25;
const D=[[1,0],[0,1],[-1,0],[0,-1]];
function hash(i,j){const s=Math.sin(i*127.1+j*311.7)*43758.5453;return s-Math.floor(s);}
let T=0;
function light(i,j,ax){const ph=(T+hash(i,j)*24)%24;if(ax===0)return ph<9?'g':ph<11?'y':'r';return ph>=12&&ph<21?'g':(ph>=21&&ph<23?'y':'r');}
function lightLeft(i,j,ax){const ph=(T+hash(i,j)*24)%24;if(ax===0)return ph<9?9-ph:ph<11?11-ph:24-ph;return ph<12?12-ph:ph<21?21-ph:ph<23?23-ph:36-ph;}
function wrap(b,c,s){return c+((((b-c)%s)+s*1.5)%s)-s/2;}

// ===== lights & sky =====
const hemi=new THREE.HemisphereLight(0xffd6b0,0x4d6b35,.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffb066,1.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:120});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;
scene.add(sun);scene.add(sun.target);
scene.background=new THREE.Color(0xf4a76c);scene.fog=new THREE.Fog(0xf4a76c,45,175);

// ===== ground / roads =====
const asphaltT=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#45464b';x.fillRect(0,0,w,h);speckle(x,w,h,2600,.18);},true);asphaltT.repeat.set(60,60);
const ground=mesh(new THREE.PlaneGeometry(600,600),M(0xffffff,{map:asphaltT,roughness:.95}),scene);ground.rotation.x=-PI/2;ground.castShadow=false;
const markT=canvasTex(64,176,(x,w,h)=>{const m=h/11;x.clearRect(0,0,w,h);
  x.fillStyle='rgba(70,160,90,.38)';x.fillRect(0,0,w,1.3*m);x.fillRect(0,h-1.3*m,w,1.3*m);
  x.fillStyle='#f4f4f0';x.fillRect(0,1.3*m-2,w,3);x.fillRect(0,h-1.3*m-1,w,3);
  x.fillStyle='#f2c230';x.fillRect(0,h/2-5,w,3);x.fillRect(0,h/2+2,w,3);
  x.fillStyle='rgba(255,255,255,.75)';x.font='bold 22px sans-serif';},true);markT.repeat.set(100,1);
const markM=new THREE.MeshStandardMaterial({map:markT,transparent:true,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
const roadX=[],roadZ=[];
for(let k=0;k<5;k++){const a=mesh(new THREE.PlaneGeometry(600,11),markM,scene);a.rotation.x=-PI/2;a.castShadow=false;a.position.y=.012;roadX.push(a);
  const b=mesh(new THREE.PlaneGeometry(600,11),markM,scene);b.rotation.set(-PI/2,0,PI/2);b.castShadow=false;b.position.y=.012;roadZ.push(b);}
const interT=canvasTex(352,352,(x,w,h)=>{x.fillStyle='#45464b';x.fillRect(0,0,w,h);speckle(x,w,h,1600,.18);const P=v=>(v+R)*16;
  x.fillStyle='#f2f2ee';
  for(let s=-RH+.3;s<=RH-.6;s+=.9){x.fillRect(P(R-3.2),P(s),2.8*16,.45*16);x.fillRect(P(-R+.4),P(s),2.8*16,.45*16);x.fillRect(P(s),P(R-3.2),.45*16,2.8*16);x.fillRect(P(s),P(-R+.4),.45*16,2.8*16);}
  x.fillRect(P(-R),P(0),5,P(RH)-P(0));x.fillRect(P(R)-5,P(-RH),5,P(0)-P(-RH));x.fillRect(P(-RH),P(-R),P(0)-P(-RH),5);x.fillRect(P(0),P(R)-5,P(RH)-P(0),5);});
const interM=new THREE.MeshStandardMaterial({map:interT,roughness:.9,polygonOffset:true,polygonOffsetFactor:-2});
// blocks (sidewalk + grass)
const grassT=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#78a84a';x.fillRect(0,0,w,h);speckle(x,w,h,3000,.25);},true);grassT.repeat.set(20,20);
const swT=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#cfc9bd';x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.12)';for(let i=0;i<=128;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,128);x.moveTo(0,i);x.lineTo(128,i);x.stroke();}},true);swT.repeat.set(36,36);
const blockG=new THREE.BoxGeometry(B-2*RH,.16,B-2*RH),swM=[M(0xbdb7ab),M(0xbdb7ab),M(0xffffff,{map:swT}),M(0xbdb7ab),M(0xbdb7ab),M(0xbdb7ab)],grM=M(0xffffff,{map:grassT,roughness:1});
const blocks=[];
for(let k=0;k<25;k++){const g=new THREE.Group();const b=mesh(blockG,swM,g);b.position.y=.08;b.castShadow=false;const gr=mesh(new THREE.PlaneGeometry(B-2*RH-6,B-2*RH-6),grM,g);gr.rotation.x=-PI/2;gr.position.y=.162;gr.castShadow=false;scene.add(g);blocks.push(g);}
// intersections pool with traffic lights
const inters=[];const poleM=M(0x30343a,{metalness:.5,roughness:.5}),houseM=M(0x1b1d22,{roughness:.6});
const lampG=new THREE.SphereGeometry(.13,12,8);
for(let k=0;k<9;k++){const g=new THREE.Group();const o=mesh(new THREE.PlaneGeometry(2*R,2*R),interM,g);o.rotation.x=-PI/2;o.position.y=.014;o.castShadow=false;
  const heads=[];
  for(let d=0;d<4;d++){const [dx,dz]=D[d];const rx=-dz,rz=dx;const px=dx*(R-.4)+rx*(RH+1),pz=dz*(R-.4)+rz*(RH+1);
    tube(V(px,0,pz),V(px,4.6,pz),.09,.07,poleM,g,8);
    const arm=tube(V(px,4.5,pz),V(px-rx*6.4,4.5,pz-rz*6.4),.05,.05,poleM,g,6);
    const h=new THREE.Group();h.position.set(px-rx*6.0,4.15,pz-rz*6.0);h.rotation.y=Math.atan2(-dz,dx);g.add(h);
    mesh(new THREE.BoxGeometry(.32,1.05,.36),houseM,h);
    const cv=document.createElement('canvas');cv.width=64;cv.height=40;const ctx2=cv.getContext('2d');const ctex=new THREE.CanvasTexture(cv);ctex.encoding=THREE.sRGBEncoding;
    const cd=new THREE.Mesh(new THREE.PlaneGeometry(.42,.27),new THREE.MeshBasicMaterial({map:ctex,toneMapped:false}));cd.position.set(-.185,-.7,0);cd.rotation.y=-PI/2;h.add(cd);
    mesh(new THREE.BoxGeometry(.3,.33,.46),houseM,h).position.set(0,-.7,0);
    const mats=[];[[0xff3b30,.33],[0xffcc00,0],[0x34c759,-.33]].forEach(([c,y])=>{const m=new THREE.MeshStandardMaterial({color:0x222222,emissive:c,emissiveIntensity:0});const l=mesh(lampG,m,h);l.position.set(-.13,y,0);l.scale.set(.6,1,1);mats.push(m);
      const visor=mesh(new THREE.CylinderGeometry(.15,.15,.18,10,1,true,0,PI),houseM,h);visor.rotation.z=PI/2;visor.position.set(-.24,y+.02,0);});
    heads.push({ax:d%2,mats,cv,ctx2,ctex,key:''});}
  scene.add(g);inters.push({g,heads,i:1e9,j:1e9});}

// ===== scenery (instanced, wraps every 3 blocks) =====
const TILE=3*B;
const treeTrunk=new THREE.InstancedMesh(new THREE.CylinderGeometry(.14,.2,1,6),M(0x6b4a2e,{roughness:.95}),260);
const treeTop=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),M(0xffffff,{flatShading:true,roughness:.85}),260);
const houseB=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff,{roughness:.8}),90);
const roofG=new THREE.ConeGeometry(.72,1,4);roofG.rotateY(PI/4);
const houseR=new THREE.InstancedMesh(roofG,M(0xffffff,{roughness:.7,flatShading:true}),90);
const winT=canvasTex(64,128,(x,w,h)=>{x.fillStyle='#d9d4cc';x.fillRect(0,0,w,h);for(let r=0;r<8;r++)for(let c=0;c<4;c++){x.fillStyle=Math.random()<.3?'#ffe9a8':'#5d7488';x.fillRect(4+c*15,6+r*15,10,10);}},true);
const towers=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff,{map:winT,roughness:.6}),24);
[treeTrunk,treeTop,houseB,houseR,towers].forEach(m=>{m.castShadow=true;m.receiveShadow=true;scene.add(m);});
const scen={trees:[],houses:[],towers:[]};
const inBlock=(v)=>{const m=((v%B)+B)%B;return m>RH+5&&m<B-RH-5;};
while(scen.trees.length<260){const x=rnd(0,TILE),z=rnd(0,TILE);if(!inBlock(x)||!inBlock(z))continue;const lx=((x%B)+B)%B,lz=((z%B)+B)%B;if(lx<RH+17||lx>B-RH-17||lz<RH+17||lz>B-RH-17)continue;
  scen.trees.push({x,z,s:rnd(.8,1.6),c:new THREE.Color().setHSL(rnd(.22,.32),rnd(.45,.6),rnd(.3,.42))});}
const houseCols=[0xf2e2c4,0xe8c9b0,0xc9dbe8,0xf0d0d0,0xd9e8c9,0xffffff,0xe6dcf2];const roofCols=[0xa0442e,0x5a3a2e,0x3f5872,0x7a2f2f,0x4b4b4b];
for(let bi=0;bi<3;bi++)for(let bj=0;bj<3;bj++){const cx=bi*B+B/2,cz=bj*B+B/2;
  for(let side=0;side<4;side++)for(let n=0;n<2;n++){const along=rnd(-35,35);const off=B/2-RH-14;const [dx,dz]=D[side];const x=cx+dx*off+(dz!==0?along:0),z=cz+dz*off+(dx!==0?along:0);
    if(Math.random()<.18&&scen.towers.length<24)scen.towers.push({x,z,w:rnd(10,14),h:rnd(14,30),d:rnd(10,14)});
    else scen.houses.push({x,z,w:rnd(7,10),h:rnd(3.5,5.5),d:rnd(7,10),rot:side%2?0:PI/2,c:new THREE.Color(pick(houseCols)),rc:new THREE.Color(pick(roofCols))});}}
scen.houses.length=0;scen.towers.length=0;
scen.trees.forEach((t,i)=>{treeTop.setColorAt(i,t.c);});scen.houses.forEach((h,i)=>{houseB.setColorAt(i,h.c);houseR.setColorAt(i,h.rc);});
treeTrunk.count=scen.trees.length;treeTop.count=scen.trees.length;houseB.count=houseR.count=scen.houses.length;towers.count=scen.towers.length;
let scenX=1e9,scenZ=1e9;
function updScenery(px,pz){if(Math.abs(px-scenX)<6&&Math.abs(pz-scenZ)<6)return;scenX=px;scenZ=pz;
  scen.trees.forEach((t,i)=>{const x=wrap(t.x,px,TILE),z=wrap(t.z,pz,TILE);dummy.rotation.set(0,0,0);dummy.position.set(x,.9*t.s+.16,z);dummy.scale.set(t.s,1.8*t.s,t.s);dummy.updateMatrix();treeTrunk.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,2.6*t.s+.16,z);dummy.scale.set(1.6*t.s,1.5*t.s,1.6*t.s);dummy.updateMatrix();treeTop.setMatrixAt(i,dummy.matrix);});
  scen.houses.forEach((h,i)=>{const x=wrap(h.x,px,TILE),z=wrap(h.z,pz,TILE);dummy.rotation.set(0,h.rot,0);dummy.position.set(x,h.h/2+.16,z);dummy.scale.set(h.w,h.h,h.d);dummy.updateMatrix();houseB.setMatrixAt(i,dummy.matrix);
    dummy.position.set(x,h.h+.16+h.w*.22,z);dummy.scale.set(h.w*1.08,h.w*.45,h.d*1.08);dummy.updateMatrix();houseR.setMatrixAt(i,dummy.matrix);});
  scen.towers.forEach((h,i)=>{dummy.rotation.set(0,0,0);dummy.position.set(wrap(h.x,px,TILE),h.h/2+.16,wrap(h.z,pz,TILE));dummy.scale.set(h.w,h.h,h.d);dummy.updateMatrix();towers.setMatrixAt(i,dummy.matrix);});
  [treeTrunk,treeTop,houseB,houseR,towers].forEach(m=>{m.instanceMatrix.needsUpdate=true;});}
// clouds / stars / hills
const cloudM=M(0xffffff,{roughness:1,flatShading:true,emissive:0x332211});const clouds=[];
for(let i=0;i<12;i++){const g=new THREE.Group();for(let k=0;k<5;k++){const c=mesh(new THREE.IcosahedronGeometry(1,1),cloudM,g);c.castShadow=false;c.position.set(k*2-4+Math.random(),Math.random(),Math.random()*1.5);c.scale.setScalar(rnd(1.6,3));}
  g.userData={x:rnd(-250,250),z:rnd(-250,250),y:rnd(40,60)};scene.add(g);clouds.push(g);}
const sg=new THREE.BufferGeometry();const sp=[];for(let i=0;i<900;i++){const u=Math.random()*PI*2,w=rnd(.08,.95),c=Math.cos(Math.asin(w)),r=400;sp.push(Math.cos(u)*c*r,w*r,Math.sin(u)*c*r);}
sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));const stars=new THREE.Points(sg,new THREE.PointsMaterial({color:0xffffff,size:1.5,sizeAttenuation:false,fog:false}));stars.visible=false;scene.add(stars);

// ===== player: pelican on bicycle =====
const player=new THREE.Group();scene.add(player);
const lean=new THREE.Group();lean.scale.setScalar(.82);player.add(lean);
const bike=new THREE.Group();lean.add(bike);
const red=M(0xc41e3a,{metalness:.55,roughness:.3}),chrome=M(0xe0e0e0,{metalness:1,roughness:.18}),blackM=M(0x161616,{roughness:.8}),rubber=M(0x1b1b1b,{roughness:.95}),whiteP=M(0xffffff,{roughness:.4});
const RW=V(-.56,.36),FW=V(.58,.36),BB=V(0,.33),ST=V(-.17,.93),HT=V(.43,.92),HB=V(.48,.70);
tube(BB,ST,.028,.024,red,bike);tube(BB,HB,.035,.03,red,bike);tube(ST.clone().add(V(.01,-.03)),HT,.025,.023,red,bike);tube(HB,HT,.033,.033,red,bike);
tube(BB.clone().lerp(HB,.42),BB.clone().lerp(HB,.6),.0355,.0335,whiteP,bike);
for(const z of[-.065,.065]){tube(V(BB.x,BB.y,z*.5),V(RW.x,RW.y,z),.015,.011,red,bike);tube(V(ST.x+.015,ST.y-.06,z*.4),V(RW.x,RW.y,z),.012,.01,red,bike);
  mesh(taper(new THREE.QuadraticBezierCurve3(V(HB.x,HB.y,z*.45),V(.53,.5,z),V(FW.x,FW.y,z*.9)),10,.019,.011,8),red,bike);}
tube(ST,ST.clone().add(V(-.025,.11)),.014,.014,chrome,bike);tube(HT,V(.45,1.0),.017,.017,chrome,bike);tube(V(.45,1.0),V(.53,1.01),.015,.015,chrome,bike);
const tape=M(0x101010,{roughness:.6});tube(V(.53,1.01,-.2),V(.53,1.01,.2),.013,.013,tape,bike);
for(const s of[-1,1])mesh(taper(new THREE.CubicBezierCurve3(V(.53,1.01,s*.2),V(.68,1.01,s*.21),V(.7,.86,s*.215),V(.57,.85,s*.22)),14,.0135,.013,8),tape,bike);
const shp=new THREE.Shape();shp.moveTo(-.13,.07);shp.quadraticCurveTo(-.16,0,-.13,-.07);shp.lineTo(0,-.05);shp.quadraticCurveTo(.15,-.02,.16,0);shp.quadraticCurveTo(.15,.02,0,.05);shp.closePath();
const saddle=mesh(new THREE.ExtrudeGeometry(shp,{depth:.03,bevelEnabled:true,bevelThickness:.014,bevelSize:.014,bevelSegments:3,curveSegments:8}),M(0x202020,{roughness:.5}),bike);saddle.rotation.x=PI/2;saddle.position.set(-.2,1.075,0);
const spokeG=new THREE.CylinderGeometry(.0022,.0022,1,4);
function wheel(c){const g=new THREE.Group();g.position.copy(c);bike.add(g);
  mesh(new THREE.TorusGeometry(.345,.028,12,56),rubber,g);mesh(new THREE.TorusGeometry(.322,.011,8,56),chrome,g);
  const hub=mesh(new THREE.CylinderGeometry(.022,.022,.11,12),chrome,g);hub.rotation.x=PI/2;
  const sp=new THREE.InstancedMesh(spokeG,chrome,28);sp.castShadow=true;
  for(let i=0;i<28;i++){const a=i/28*PI*2,z=i%2?.034:-.034,o=i%2?.2:-.2;seg(dummy,V(Math.cos(a+o)*.03,Math.sin(a+o)*.03,z),V(Math.cos(a)*.318,Math.sin(a)*.318,z*.15));dummy.updateMatrix();sp.setMatrixAt(i,dummy.matrix);}
  g.add(sp);return g;}
const wR=wheel(RW),wF=wheel(FW);
const crank=new THREE.Group();crank.position.copy(BB);bike.add(crank);
const ring=mesh(new THREE.CylinderGeometry(.1,.1,.006,36),chrome,crank);ring.rotation.x=PI/2;ring.position.z=.075;
const teeth=new THREE.InstancedMesh(new THREE.BoxGeometry(.012,.014,.005),chrome,40);
for(let i=0;i<40;i++){const a=i/40*PI*2;dummy.position.set(Math.cos(a)*.106,Math.sin(a)*.106,.075);dummy.rotation.set(0,0,a);dummy.scale.set(1,1,1);dummy.updateMatrix();teeth.setMatrixAt(i,dummy.matrix);}crank.add(teeth);
const pedals=[];
for(const s of[1,-1]){const z=s*.1;const end=V(s*.17,0,z);tube(V(0,0,z),end,.014,.011,chrome,crank);const pd=new THREE.Group();pd.position.copy(end);crank.add(pd);mesh(new THREE.BoxGeometry(.09,.018,.07),blackM,pd).position.z=s*.04;pedals.push(pd);}
for(let i=0;i<4;i++){const c=mesh(new THREE.CylinderGeometry(.045-i*.006,.045-i*.006,.004,20),chrome,bike);c.rotation.x=PI/2;c.position.set(RW.x,RW.y,.06+i*.006);}
const cR=.1,cr=.045,CZ=.075;
const cTop=[V(BB.x,BB.y+cR),V(RW.x,RW.y+cr)],cBot=[V(RW.x,RW.y-cr),V(BB.x,BB.y-cR)];
const L1=cTop[0].distanceTo(cTop[1]),A1=PI*cr,L2=cBot[0].distanceTo(cBot[1]),A2=PI*cR,CL=L1+A1+L2+A2;
function chainPt(s){s=((s%CL)+CL)%CL;if(s<L1)return cTop[0].clone().lerp(cTop[1],s/L1);s-=L1;if(s<A1){const a=PI/2+s/cr;return V(RW.x+Math.cos(a)*cr,RW.y+Math.sin(a)*cr);}s-=A1;
  if(s<L2)return cBot[0].clone().lerp(cBot[1],s/L2);s-=L2;const a=-PI/2+s/cR;return V(BB.x+Math.cos(a)*cR,BB.y+Math.sin(a)*cR);}
const CN=70;const chain=new THREE.InstancedMesh(new THREE.BoxGeometry(.019,.008,.012),M(0x6e6e6e,{metalness:.9,roughness:.35}),CN);bike.add(chain);
function updChain(off){for(let i=0;i<CN;i++){const s=off+i/CN*CL;const p=chainPt(s),q=chainPt(s+.004);dummy.position.set(p.x,p.y,CZ);dummy.rotation.set(0,0,Math.atan2(q.y-p.y,q.x-p.x));dummy.scale.set(1,1,1);dummy.updateMatrix();chain.setMatrixAt(i,dummy.matrix);}chain.instanceMatrix.needsUpdate=true;}
const lampGlass=mesh(new THREE.CircleGeometry(.03,14),M(0xffffff,{emissive:0xfff2c0,emissiveIntensity:0}),bike);lampGlass.rotation.y=PI/2;lampGlass.position.set(.63,.98,0);
mesh(new THREE.CylinderGeometry(.032,.026,.05,12),chrome,bike).position.set(.6,.98,0);
const headL=new THREE.SpotLight(0xfff0c8,0,45,.45,.5,1.2);headL.position.set(.63,.98,0);headL.target.position.set(8,0,0);bike.add(headL);bike.add(headL.target);
// pelican
const pel=new THREE.Group();const PC=V(-.1,1.3);pel.position.copy(PC);lean.add(pel);
const pin=new THREE.Group();pin.position.set(-PC.x,-PC.y,0);pel.add(pin);
const featherW=M(0xf8f5ee,{roughness:.85}),orange=M(0xf28c28,{roughness:.5});
const body=mesh(new THREE.LatheGeometry([[0,-.52],[.1,-.5],[.18,-.42],[.24,-.28],[.28,-.1],[.29,.06],[.27,.22],[.22,.36],[.13,.46],[0,.5]].map(p=>new THREE.Vector2(p[0],p[1])),40),featherW,pin);
body.rotation.z=-PI/2+.42;body.position.set(-.1,1.33,0);body.scale.set(.95,1.1,.86);
mesh(new THREE.SphereGeometry(.25,20,14),M(0xece6dc,{roughness:.9}),pin).position.set(.05,1.28,0);
const upper=new THREE.Group();upper.position.set(.28,1.55,0);pin.add(upper);const up=new THREE.Group();up.position.set(-.28,-1.55,0);upper.add(up);
mesh(taper(new THREE.CatmullRomCurve3([V(.24,1.5),V(.42,1.76),V(.3,2.0),V(.29,2.18),V(.37,2.33)]),36,.13,.068,16),M(0xf8f5ee,{roughness:.85,side:THREE.DoubleSide}),up);
const skull=mesh(new THREE.SphereGeometry(.125,24,18),featherW,up);skull.position.set(.41,2.38,0);skull.scale.set(1.25,.95,.9);
const crestM=M(0xf3d77a,{roughness:.8});const crest=[];
for(let i=0;i<6;i++){const c=mesh(new THREE.ConeGeometry(.018,.17-i*.012,6),crestM,up);crest.push(c);c.position.set(.33-i*.012,2.46-i*.008,(i%2?1:-1)*.012*i*.4);c.rotation.z=PI/2*.62+i*.07;}
// v1.6 detail: helmet, tail fan, chest plumage, neck ruff
const defHelm=new THREE.Group();{const hm=defHelm;hm.position.set(.4,2.43,0);hm.rotation.z=-.18;up.add(hm);const hY=M(0xffc61a,{roughness:.35,metalness:.05});
 const sh_=mesh(new THREE.SphereGeometry(.152,24,14,0,PI*2,0,PI*.5),hY,hm);sh_.scale.set(1.18,.82,.98);
 for(const z of[-.05,0,.05]){const r=mesh(new THREE.BoxGeometry(.24,.018,.022),M(0x222222,{roughness:.5}),hm);r.position.set(-.01,.105,z);r.rotation.z=.05;}
 const rim=mesh(new THREE.TorusGeometry(.152,.011,6,28),M(0x333333,{roughness:.6}),hm);rim.rotation.x=PI/2;rim.scale.set(1.18,.98,1);
 for(const s of[-1,1]){const st=mesh(new THREE.CylinderGeometry(.006,.006,.2,5),M(0x333333),hm);st.position.set(.03,-.09,s*.135);st.rotation.x=s*.15;}
 const vis=mesh(new THREE.BoxGeometry(.07,.012,.2),hY,hm);vis.position.set(.17,-.005,0);vis.rotation.z=-.25;}
{const tf=new THREE.Group();tf.position.set(-.62,1.2,0);tf.rotation.z=.35;pin.add(tf);const tg=new THREE.ConeGeometry(.045,.3,8);tg.scale(1,1,.35);
 for(let i=0;i<7;i++){const f=mesh(tg,M(i%2?0xe9e4da:0xf8f5ee,{roughness:.85}),tf);const a=(i-3)*.13;f.rotation.set(a,0,PI/2+.1);f.position.set(-.1,0,a*.35);}}
{const ch=mesh(new THREE.SphereGeometry(.16,18,12),M(0xf6e3a8,{roughness:.9}),pin);ch.position.set(.2,1.36,0);ch.scale.set(.6,1.05,1.05);
 const rG=new THREE.ConeGeometry(.03,.09,5);const rM=M(0xf3efe6,{roughness:.9});for(let i=0;i<10;i++){const a=i/10*PI*2;const r=mesh(rG,rM,up);r.position.set(.3+Math.cos(a)*.06,1.98,Math.sin(a)*.065);r.rotation.set(Math.sin(a)*.6,0,PI+Math.cos(a)*.6);}}
const lids=[];
for(const s of[-1,1]){const e=new THREE.Group();e.position.set(.46,2.415,s*.092);up.add(e);
  mesh(new THREE.SphereGeometry(.026,14,10),M(0xffffff,{roughness:.3}),e);
  mesh(new THREE.SphereGeometry(.019,12,8),M(0x7a5520,{roughness:.3}),e).position.set(.008,0,s*.013);
  mesh(new THREE.SphereGeometry(.011,10,8),M(0x050505,{roughness:.05,metalness:.2}),e).position.set(.012,0,s*.02);
  mesh(new THREE.SphereGeometry(.004,6,6),M(0xffffff,{emissive:0xffffff,emissiveIntensity:1}),e).position.set(.017,.007,s*.024);
  mesh(new THREE.TorusGeometry(.029,.0055,6,20),M(0xf2a0a6,{roughness:.6}),e).position.z=s*.006;
  const lid=mesh(new THREE.SphereGeometry(.031,14,10),featherW,e);lid.visible=false;lids.push(lid);}
const beak=new THREE.Group();beak.position.set(.52,2.37,0);beak.rotation.z=-.3;up.add(beak);
const bG=new THREE.LatheGeometry([[.047,0],[.046,.08],[.04,.3],[.03,.55],[.018,.73],[.004,.79],[0,.795]].map(p=>new THREE.Vector2(p[0],p[1])),20);
const ub=mesh(bG,M(0xf39a3a,{roughness:.42}),beak);ub.rotation.z=-PI/2;ub.scale.set(.55,1,1.15);ub.position.y=.014;
mesh(new THREE.SphereGeometry(.022,10,8),M(0xd5401a,{roughness:.4}),beak).position.set(.78,0,0);
const lb=mesh(bG,M(0xe0701c,{roughness:.5}),beak);lb.rotation.z=-PI/2;lb.scale.set(.25,.96,1.02);lb.position.y=-.022;
const pouchG=new THREE.SphereGeometry(1,28,18);const pB=pouchG.attributes.position.array.slice();for(let i=1;i<pB.length;i+=3)if(pB[i]>0)pB[i]*=.25;
const pouch=mesh(pouchG,new THREE.MeshPhysicalMaterial({color:0xf5b13d,roughness:.42,transmission:.3,thickness:.08,clearcoat:.4}),beak);pouch.position.set(.37,-.03,0);pouch.scale.set(.34,.14,.085);
let pouchFill=0;
function wobblePouch(t,amp){const a=pouchG.attributes.position.array,f=1+pouchFill*.12;for(let i=0;i<a.length;i+=3){const x=pB[i],y=pB[i+1],z=pB[i+2];if(y<0){const w=Math.sin(t*9+x*5)*amp*(-y);a[i]=x+w*.25;a[i+1]=y*(1+w*.35)*f;a[i+2]=z*(1+pouchFill*.06);}else{a[i]=x;a[i+1]=y;a[i+2]=z;}}pouchG.attributes.position.needsUpdate=true;pouchG.computeVertexNormals();}
const fG=new THREE.SphereGeometry(.5,8,5);fG.translate(0,.5,0);const fM=M(0xffffff,{roughness:.85,side:THREE.DoubleSide});
const wings=[];
for(const s of[-1,1]){const sh=V(.1,1.5,s*.245),gr=V(.62,.99,s*.215);const w=new THREE.Group();w.position.copy(sh);pin.add(w);
  const arm=gr.clone().sub(sh);mesh(taper(new THREE.LineCurve3(V(0,0,0),arm),5,.07,.025,10),featherW,w);
  const rows=[[11,.17,.055,0xf6f3ec,.03,0,1],[11,.3,.06,0xbfc2c8,.018,.05,1],[8,.4,.055,0x1f1f22,.006,.1,.45]];
  let n=0;rows.forEach(r=>n+=r[0]);const im=new THREE.InstancedMesh(fG,fM,n);im.castShadow=true;let k=0;
  for(const [cnt,len,wd,col,zo,drop,from] of rows){for(let i=0;i<cnt;i++){const u=1-from+(i/(cnt-1))*from;const p=arm.clone().multiplyScalar(u*.95);p.y-=drop*(1-u*.4);p.z+=s*zo;
      dummy.position.copy(p);dummy.quaternion.setFromUnitVectors(UP,V(-1,.28-.35*u,s*.04).normalize());dummy.scale.set(wd*(1+.3*Math.random()),len*(.9+.25*u),.018);dummy.updateMatrix();im.setMatrixAt(k,dummy.matrix);im.setColorAt(k,new THREE.Color(col));k++;}}
  w.add(im);wings.push(w);}
const tail=new THREE.InstancedMesh(fG,fM,7);tail.castShadow=true;
for(let i=0;i<7;i++){const a=(i-3)/3;dummy.position.set(-.55,1.14,a*.06);dummy.quaternion.setFromUnitVectors(UP,V(-1,.05,a*.45).normalize());dummy.scale.set(.06,.24-Math.abs(a)*.05,.015);dummy.updateMatrix();tail.setMatrixAt(i,dummy.matrix);tail.setColorAt(i,new THREE.Color(i%2?0xe9e6df:0xf8f5ee));}pin.add(tail);
const fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(.02,-.055);fs.quadraticCurveTo(.08,-.07,.13,-.06);fs.quadraticCurveTo(.1,-.035,.15,-.01);fs.quadraticCurveTo(.12,0,.15,.012);fs.quadraticCurveTo(.1,.035,.13,.06);fs.quadraticCurveTo(.08,.07,.02,.055);fs.closePath();
const footG=new THREE.ExtrudeGeometry(fs,{depth:.008,bevelEnabled:false,curveSegments:5});
const legs=[];
for(const s of[1,-1]){const th=mesh(new THREE.CylinderGeometry(.045,.065,1,10),featherW,pin),sn=mesh(new THREE.CylinderGeometry(.016,.02,1,8),orange,pin),kn=mesh(new THREE.SphereGeometry(.024,8,6),orange,pin),ft=mesh(footG,orange,pin);ft.rotation.x=PI/2;legs.push({s,th,sn,kn,ft});}
function ik(h,t,a1,a2){const dx=t.x-h.x,dy=t.y-h.y;const d=Math.min(Math.hypot(dx,dy),a1+a2-.001);const a=Math.atan2(dy,dx);const b=Math.acos(clamp((a1*a1+d*d-a2*a2)/(2*a1*d),-1,1));
  const z=(h.z+t.z)/2;const k1=V(h.x+a1*Math.cos(a+b),h.y+a1*Math.sin(a+b),z),k2=V(h.x+a1*Math.cos(a-b),h.y+a1*Math.sin(a-b),z);return k1.x>k2.x?k1:k2;}
function updLegs(th){for(const L of legs){const ang=-th+(L.s>0?0:PI);const ped=V(BB.x+Math.cos(ang)*.17,BB.y+Math.sin(ang)*.17,L.s*.14);const ank=ped.clone().add(V(-.03,.05,0));const hip=V(-.12,1.13,L.s*.13);
  const kn=ik(hip,ank,.46,.47);seg(L.th,hip,kn);seg(L.sn,kn,ank);L.kn.position.copy(kn);L.ft.position.set(ped.x-.04,ped.y+.022,ped.z);}}
const LF=40;const loose=new THREE.InstancedMesh(fG,fM,LF);scene.add(loose);const lfs=[];for(let i=0;i<LF;i++){lfs.push({p:V(0,-9,0),v:V(),r:Math.random()*6,w:rnd(2,6)});loose.setColorAt(i,new THREE.Color(i%4?0xf8f5ee:0xbfc2c8));}loose.visible=false;

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

// ===== pickups =====
const fishes=[];const fishBodyM=M(0x8fb6d6,{metalness:.6,roughness:.25}),finM=M(0xff8a3c,{roughness:.5}),ringM=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:.55});
function makeFish(){const g=new THREE.Group();const b=mesh(new THREE.SphereGeometry(.3,14,10),fishBodyM,g);b.scale.set(1.3,.6,.4);const t=mesh(new THREE.ConeGeometry(.18,.3,4),finM,g);t.rotation.z=PI/2;t.position.x=-.48;t.scale.set(1,1,.3);
  mesh(new THREE.SphereGeometry(.04,8,6),darkM,g).position.set(.28,.06,.1);const r=mesh(new THREE.TorusGeometry(.62,.035,6,28),ringM,g);r.rotation.x=PI/2;r.position.y=-.55;r.castShadow=false;g.userData.ring=r;scene.add(g);return g;}
function makeCan(){const g=new THREE.Group();mesh(new THREE.CylinderGeometry(.16,.16,.46,16),M(0x1e90ff,{metalness:.7,roughness:.25}),g);mesh(new THREE.CylinderGeometry(.165,.165,.12,16),M(0xffd400,{metalness:.5,roughness:.3}),g);
  const r=mesh(new THREE.TorusGeometry(.62,.035,6,28),new THREE.MeshBasicMaterial({color:0x6ad1ff,transparent:true,opacity:.6}),g);r.rotation.x=PI/2;r.position.y=-.55;r.castShadow=false;scene.add(g);return g;}
for(let i=0;i<12;i++)fishes.push({g:makeFish(),kind:'fish',p:V(),alive:false});
for(let i=0;i<3;i++)fishes.push({g:makeCan(),kind:'can',p:V(),alive:false});
function placePickup(f){const pi=Math.round(player.position.x/B),pj=Math.round(player.position.z/B);
  for(let t=0;t<10;t++){const i=pi+Math.floor(rnd(-1,1.99)),j=pj+Math.floor(rnd(-1,1.99));const along=rnd(R+4,B-R-4),lat=rnd(-(RH-1),RH-1);
    const p=Math.random()<.5?V(i*B+along,0,j*B+lat):V(i*B+lat,0,j*B+along);const d=p.distanceTo(player.position);if(d<25||d>150)continue;f.p.copy(p);f.alive=true;f.g.visible=true;return;}
  f.alive=false;f.g.visible=false;}

// ===== destination beacon =====
const beacon=new THREE.Group();scene.add(beacon);
const beamM=new THREE.MeshBasicMaterial({color:0xffd34d,transparent:true,opacity:.28,depthWrite:false,blending:THREE.AdditiveBlending});
const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.6,1.6,60,24,1,true),beamM);beam.position.y=30;beacon.add(beam);
const bring=new THREE.Mesh(new THREE.TorusGeometry(3,.14,8,40),new THREE.MeshBasicMaterial({color:0xffd34d}));bring.rotation.x=PI/2;bring.position.y=.2;beacon.add(bring);
let labelTex=null;const label=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthTest:false}));label.scale.set(9,2.25,1);label.position.y=7;beacon.add(label);
function setLabel(txt){labelTex&&labelTex.dispose();labelTex=canvasTex(512,128,(x,w,h)=>{x.fillStyle='rgba(20,22,32,.72)';x.beginPath();x.roundRect?x.roundRect(4,4,w-8,h-8,40):x.rect(4,4,w-8,h-8);x.fill();x.fillStyle='#fff';x.font='bold 58px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,h/2+2);});label.material.map=labelTex;label.material.needsUpdate=true;}
beacon.visible=false;

// ===== audio =====
let ltLast='';let AC=null,master,noiseBuf,windG,windF,rollG,squealG,squealOsc,engG,engOsc,engF,muted=false;
function initAudio(){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;if(AC){AC.resume();return;}
  AC=new C();master=AC.createGain();master.gain.value=muted?0:.9;master.connect(AC.destination);
  noiseBuf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  const loopN=()=>{const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;s.start();return s;};
  windF=AC.createBiquadFilter();windF.type='bandpass';windF.frequency.value=500;windF.Q.value=.7;windG=AC.createGain();windG.gain.value=0;loopN().connect(windF);windF.connect(windG);windG.connect(master);
  const rf=AC.createBiquadFilter();rf.type='lowpass';rf.frequency.value=170;rollG=AC.createGain();rollG.gain.value=0;loopN().connect(rf);rf.connect(rollG);rollG.connect(master);
  squealOsc=AC.createOscillator();squealOsc.type='sawtooth';squealOsc.frequency.value=2300;const sf=AC.createBiquadFilter();sf.type='bandpass';sf.frequency.value=2300;sf.Q.value=14;squealG=AC.createGain();squealG.gain.value=0;squealOsc.connect(sf);sf.connect(squealG);squealG.connect(master);squealOsc.start();
  engOsc=AC.createOscillator();engOsc.type='sawtooth';engOsc.frequency.value=55;engF=AC.createBiquadFilter();engF.type='lowpass';engF.frequency.value=260;engG=AC.createGain();engG.gain.value=0;engOsc.connect(engF);engF.connect(engG);engG.connect(master);engOsc.start();startMusic();}
// ===== background music: cheerful procedural loop (C major, 128 BPM) =====
let musG=null,musOn=true,musStep=0,musNext=0,musTimer=null;
const MBPM=128,MSTEP=60/MBPM/4;
const MCH=[[48,[60,64,67]],[45,[57,60,64]],[41,[57,60,65]],[43,[55,59,62]]];
const MEL=[
 72,0,76,0,79,0,76,0,77,76,74,0,72,0,0,0,
 69,0,72,0,76,0,74,72,71,0,72,0,69,0,0,0,
 65,0,69,0,72,0,74,0,76,0,74,0,72,0,69,0,
 71,0,74,0,79,0,77,0,76,0,74,0,71,0,74,0,
 72,0,76,0,79,0,81,0,79,77,76,0,72,0,0,0,
 69,0,72,0,76,0,77,76,74,0,72,0,69,0,72,0,
 65,0,69,0,72,0,77,0,76,0,74,0,72,0,74,0,
 74,0,72,0,71,0,67,0,72,0,0,0,0,0,0,0];
const mf=n=>440*Math.pow(2,(n-69)/12);
function mNote(type,n,t,dur,vol,dest){const o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.value=mf(n);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(dest||musG);o.start(t);o.stop(t+dur+.05);}
function mNoise(t,dur,vol,ft,fq){const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=ft;f.frequency.value=fq;const g=AC.createGain();
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(f);f.connect(g);g.connect(musG);s.start(t,Math.random()*1.5);s.stop(t+dur+.02);}
function mKick(t){const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(45,t+.12);
  g.gain.setValueAtTime(.55,t);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(musG);o.start(t);o.stop(t+.2);}
function mSched(st,t){const bar=Math.floor(st/16)%8,s=st%16,ch=MCH[bar%4];
  if(s%4===0)mKick(t);
  if(s===4||s===12)mNoise(t,.12,.22,'bandpass',1800);
  if(s%2===1)mNoise(t,.04,.07,'highpass',7000);
  if(s%2===0)mNote('triangle',ch[0]+(s%4===2?12:0),t,MSTEP*1.8,.32);
  if(s===2||s===6||s===10||s===14)ch[1].forEach(n=>mNote('square',n,t,MSTEP*1.3,.028));
  const m=MEL[(bar*16+s)%MEL.length];if(m){mNote('square',m,t,MSTEP*1.9,.06);mNote('triangle',m+12,t,MSTEP*1.2,.035);}}
function musTick(){if(!AC||!musG)return;const now=AC.currentTime;if(musNext<now)musNext=now+.05;
  while(musNext<now+.25){if(musOn&&!muted&&document.visibilityState!=='hidden')mSched(musStep,musNext);musStep++;musNext+=MSTEP;}}
function startMusic(){if(musG)return;musG=AC.createGain();musG.gain.value=musOn?.55:0;musG.connect(master);musNext=AC.currentTime+.1;musTimer=setInterval(musTick,60);}
function setMusic(on){musOn=on;try{localStorage.setItem('pel_music',on?'1':'0');}catch(e){}if(musG)musG.gain.value=on?.55:0;}
try{musOn=localStorage.getItem('pel_music')!=='0';}catch(e){}

function env(node,t,peak,att,dec){const g=AC.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0001,t+att+dec);node.connect(g);g.connect(master);return g;}
const ok=()=>AC&&!muted;
function osc(type,f,t,peak,att,dec,f2){const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+att+dec);env(o,t,peak,att,dec);o.start(t);o.stop(t+att+dec+.05);return o;}
function noise(t,dur,type,f,peak){const s=AC.createBufferSource();s.buffer=noiseBuf;const fl=AC.createBiquadFilter();fl.type=type;fl.frequency.value=f;s.connect(fl);env(fl,t,peak,.003,dur);s.start(t,Math.random(),dur+.1);}
const SFX={
  tick(v){if(!ok())return;noise(AC.currentTime,.025,'highpass',3800,v);},
  bell(){if(!ok())return;const t=AC.currentTime;for(const d of[0,.16])for(const f of[2093,2637,3520])osc('sine',f,t+d,f>3000?.05:.15,.004,1.0);},
  horn(){if(!ok())return;const t=AC.currentTime;for(const f of[392,494]){const o=AC.createOscillator();o.type='square';o.frequency.value=f;const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=1400;o.connect(fl);env(fl,t,.09,.02,.45);o.start(t);o.stop(t+.55);}},
  bump(){if(!ok())return;const t=AC.currentTime;osc('sine',120,t,.5,.005,.18,45);noise(t,.12,'lowpass',600,.3);},
  ding(){if(!ok())return;const t=AC.currentTime;[1047,1319,1568].forEach((f,i)=>osc('triangle',f,t+i*.07,.18,.005,.25));},
  power(){if(!ok())return;const t=AC.currentTime;osc('sawtooth',300,t,.12,.01,.5,1400);},
  siren(){if(!ok())return;const t=AC.currentTime;const o=AC.createOscillator();o.type='sawtooth';o.frequency.setValueAtTime(700,t);o.frequency.linearRampToValueAtTime(1300,t+.3);o.frequency.linearRampToValueAtTime(700,t+.6);o.frequency.linearRampToValueAtTime(1300,t+.9);const fl=AC.createBiquadFilter();fl.type='lowpass';fl.frequency.value=2200;o.connect(fl);env(fl,t,.08,.02,.9);o.start(t);o.stop(t+1);},
  squawk(t){const a=AC.createOscillator(),b=AC.createOscillator();a.type='sawtooth';b.type='square';a.frequency.setValueAtTime(760,t);a.frequency.exponentialRampToValueAtTime(330,t+.32);b.frequency.setValueAtTime(1140,t);b.frequency.exponentialRampToValueAtTime(500,t+.32);
    const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=1300;f.Q.value=2;a.connect(f);b.connect(f);env(f,t,.3,.02,.32);a.start(t);b.start(t);a.stop(t+.4);b.stop(t+.4);},
  crash(){if(!ok())return;const t=AC.currentTime;noise(t,.8,'lowpass',900,.9);osc('sine',110,t,.9,.005,.4,40);[[420,.05],[987,.09],[1310,.3]].forEach(([f,d])=>osc('triangle',f,t+d,.12,.003,.35));SFX.squawk(t+.08);SFX.squawk(t+.5);},
  ring(){if(!ok())return;const t=AC.currentTime;for(let i=0;i<4;i++){osc('square',1320,t+i*.12,.05,.005,.08);osc('square',1760,t+i*.12+.06,.05,.005,.06);}},
  win(){if(!ok())return;const t=AC.currentTime;[523,659,784,1047,784,1047].forEach((f,i)=>osc('triangle',f,t+i*.12,.2,.01,.3));},
  lose(){if(!ok())return;const t=AC.currentTime;[392,330,262,196].forEach((f,i)=>osc('triangle',f,t+i*.18,.2,.01,.35));}};

// ===== state =====
let VMAX=18;const CRASHV=8.3;
let v=0,heading=0,steer=0,theta=0,wheelA=0,chainOff=0,tickAcc=0,state='menu',crashT=0,braking=false,gas=false,kL=false,kR=false;
let stamina=100,exhausted=false,boostT=0,blinkT=2,blinkP=0,bumpCool=0,toastCool=0;
let steerStyle=0,barVal=0,gyroMode=0,gyroVal=0,gyroBase=null,gyroSeen=false,camMode=0,lightMode=0,sens=1,traffic=1,shadows=true;
const pv=V(),pw=V(),crashDir=V();let bikeV=0,fallTo=0;
let inInter=null,interViol=false;
const stats={};let mission=null,mT=0,dests=[],destIdx=0;

// ===== missions =====
const MS=[
 {k:'reach',e:'🐟',t:'外卖鹈鹕',d:'150 秒内把鲜鱼送到「老王海鲜大排档」',lim:150,place:'🦞 老王海鲜大排档',win:['老王多送了你一盆小龙虾 🦞','顾客给了五星好评，还打赏了一条大黄鱼 🐟','到了才发现……顾客点的是素食套餐 🥬']},
 {k:'reach',e:'🌅',t:'湖边看日落',d:'骑到城东的翡翠湖，赶上今天的晚霞',lim:0,place:'🌅 翡翠湖',win:['晚霞烧红了半边天，你发了条朋友圈，获得 999 个赞','刚到就下起太阳雨，天上挂了两道彩虹 🌈','湖边有人在烤鱼，分了你一大串 🍢']},
 {k:'reach',e:'💊',t:'送药给海鸥',d:'110 秒内把药送到生病的海鸥家',lim:110,place:'💊 海鸥家',win:['海鸥喝了药立刻生龙活虎，给你唱了首歌 🎶','原来海鸥只是装病想见你 🥹','医生说你是全城最快的快递鸟']},
 {k:'reach',e:'🎂',t:'派对要迟到了',d:'90 秒内赶到生日派对',lim:90,place:'🎉 派对现场',win:['刚好赶上吹蜡烛 🎂','派对其实是给你的惊喜派对 🎉','蛋糕是鱼味的，全场只有你爱吃 🐟']},
 {k:'multi',e:'📦',t:'快递三连',d:'240 秒内依次送达 3 个包裹',lim:240,n:3,place:'📦 收件点',win:['三个包裹全部签收，你被评为「月度最佳快递员」🏅','最后一个包裹里装的是给你的感谢信 💌','站长给你涨了工资：每单多一条小鱼干']},
 {k:'fish',e:'🎣',t:'渔获大丰收',d:'在马路上收集 8 条鱼',n:8,win:['八条鱼一口吞下，喉囊鼓成了气球 🎈','你在路口摆摊卖鱼，日入过万 💰','你把鱼分给了路边的流浪猫，收获一群小弟 🐱']},
 {k:'legal',e:'🚦',t:'模范市民',d:'绿灯通过 6 个路口，全程不闯红灯',n:6,win:['交警叔叔送你一面「文明骑手」锦旗 🚩','你被选为城市交通形象大使，海报贴满全城','红绿灯集体为你闪了个爱心 💚']},
 {k:'speed',e:'⚡',t:'速度之王',d:'时速冲到 45 km/h',n:45,win:['测速摄像头拍下了你的英姿 📸','一位帕拉梅拉车主冲你竖起大拇指 👍','风把你的羽毛吹成了莫西干头']},
 {k:'dist',e:'🗺️',t:'城市漫游',d:'累计骑行 1.5 公里',n:1500,win:['你画出了一张全新的城市骑行地图','路过的小朋友都喊你「鹈鹕骑士」','你发现了一家隐藏的鱼丸店 🍡']},
 {k:'calm',e:'🧘',t:'稳如老狗',d:'连续 40 秒不刹车、不蹭路沿、不摔车',n:40,win:['禅意骑行，鹈鹕悟了 🧘','你的平稳车技让车筐里的鸡蛋一个没碎 🥚','一群鸽子排队跟在你后面骑行']},
 {k:'bell',e:'🔔',t:'街头艺人',d:'在 3 个不同路口中央按响车铃',n:3,win:['路人以为是快闪表演，纷纷鼓掌 👏','你的车铃声被做成了城市彩铃','一位音乐制作人邀请你录专辑 🎵']},
 {k:'near',e:'😎',t:'擦肩而过',d:'与行驶中的汽车近距离擦肩而过 5 次',n:5,win:['惊险刺激！不过妈妈说下次别这样了 😅','你被极限运动杂志选为封面鸟','司机们给你起了个外号：「鹈鹕闪电」⚡']},
 {k:'cars',e:'🏎️',t:'豪车鉴赏家',d:'近距离看到 2 辆帕拉梅拉和 2 辆宝马',win:['你在本子上画满了豪车速写 ✏️','一位车主邀请你坐副驾兜风 🏎️','你决定攒钱……买一辆更贵的自行车']}];
const FAILS={time:['⏰ 时间到！你还在路上……','⏰ 超时了，顾客已经自己骑车去拿了','⏰ 太迟了，海鸥已经睡着了'],car:['🚗 被车撞飞了！鹈鹕决定以后走人行道','🚗 一声巨响，鹈鹕在空中转了三圈','🚗 车主下来扶起了你，还送你去了宠物医院'],viol:['🚨 闯红灯被交警拦下，罚抄交规 100 遍','🚨 红灯停，绿灯行，鹈鹕被请去学习交规']};
const TWISTS=['……然后一只海鸥抢走了你的奖励 🐦','……然后你发现自行车被贴了一张罚单 🧾','……然后天上掉下一条鱼，正好砸中你 🐟','……然后你被星探发现，签约成为网红鹈鹕 ✨','……然后你醒了，原来是一场梦 💤','……然后路边的猫冲你点了点头 🐈','……然后夕阳刚好落在你身后，像电影结尾一样 🎬'];
const CFG=[
 {d:'把鲜鱼送到「老王海鲜大排档」',L:[200,150,100]},{d:'骑到城东的翡翠湖，赶上今天的晚霞',L:[240,180,120]},{d:'把药送到生病的海鸥家',L:[160,110,80]},{d:'赶到生日派对现场',L:[130,90,65]},
 {d:'依次送达 {n} 个包裹',N:[2,3,4],L:[200,240,260]},{d:'在马路上收集 {n} 条鱼',N:[5,8,12],L:[150,150,150]},{d:'绿灯通过 {n} 个路口，全程不闯红灯',N:[4,6,9],L:[180,180,200]},
 {d:'时速冲到 {n} km/h',N:[40,45,50],L:[60,60,60]},{d:'累计骑行 {km} 公里',N:[1000,1500,2500],L:[150,150,180]},{d:'连续 {n} 秒不刹车、不蹭路沿、不摔车',N:[25,40,60],L:[120,120,150]},
 {d:'在 {n} 个不同路口中央按响车铃',N:[2,3,5],L:[150,150,180]},{d:'与行驶中的汽车近距离擦肩而过 {n} 次',N:[3,5,8],L:[150,150,150]},{d:'近距离看到 {n} 辆帕拉梅拉和 {n} 辆宝马',N:[1,2,3],L:[180,180,240]}];
const DIFF=['简单','中等','困难'],REWARD=[100,200,500];let diff=1,baseIdx=0,coins=0;
const SAVE={owned:['bike_red'],equip:{vehicle:'bike_red',hat:null,eyes:null,neck:null,back:null,ear:null}};
try{const j=JSON.parse(localStorage.getItem('pelicanSave')||'null');if(j){if(j.x)Object.assign(SAVE,j.x);coins=+j.coins||0;Object.assign(SAVE.equip,j.equip||{});SAVE.owned=j.owned||SAVE.owned;if(j.lic)SAVE.lic=j.lic;if(j.job)SAVE.job=j.job;if(j.ach)SAVE.ach=j.ach;}else coins=+(localStorage.getItem('pelicanCoins')||0)||0;}catch(e){}
function saveCoins(){try{localStorage.setItem('pelicanSave',JSON.stringify({coins,owned:SAVE.owned,equip:SAVE.equip,lic:SAVE.lic,job:SAVE.job,ach:SAVE.ach,x:Object.fromEntries(Object.keys(SAVE).filter(k=>/^(roof_|cal$|homeK$|momDay$)|_egg$/.test(k)).map(k=>[k,SAVE[k]]))}));}catch(e){}}
function buildMission(){const b=MS[baseIdx],c=CFG[baseIdx];const n=c.N?c.N[diff]:b.n;mission=Object.assign({},b,{n,lim:c.L[diff],d:c.d.replace(/\{n\}/g,n).replace('{km}',(n/1000).toFixed(1)),reward:REWARD[diff],diff});}
function newMission(){showStart();}
function showStart(){mission=FREE;$('sC').textContent=`🪙 ${coins}`;$('sJ').innerHTML=JOB.fired?'😢 待业中 · 去「外卖员 → 求职网」找工作':`${coOf().e} ${JOB.co} · ★ ${rating().toFixed(2)} · ${rTier(rating())}`;$('start').style.display='flex';state='menu';}
function startMission(){mT=0;Object.assign(stats,{fish:0,dist:0,maxV:0,legal:0,viol:0,near:0,calm:0,bells:new Set(),pana:new Set(),bmw:new Set(),score:0});
  dests=[];destIdx=0;beacon.visible=false;
  if(mission.k==='reach'||mission.k==='multi'){let ci=Math.round(player.position.x/B),cj=Math.round(player.position.z/B);const n=mission.k==='multi'?mission.n:1;
    for(let k=0;k<n;k++){let di,dj;do{di=Math.floor(rnd(-3,3.99));dj=Math.floor(rnd(-3,3.99));}while(Math.abs(di)+Math.abs(dj)<(n>1?1:2)||Math.abs(di)+Math.abs(dj)>(n>1?2:4));
      ci+=di;cj+=dj;const ax=Math.random()<.5;const sgn=Math.random()<.5?-1:1;dests.push(ax?V(ci*B+sgn*22,0,cj*B+sgn*3.6):V(ci*B-sgn*3.6,0,cj*B+sgn*22));}
    setDest();}
  for(const f of fishes)placePickup(f);
  $('start').style.display='none';state='ride';if(mission.k==='free'){offerT=rnd(6,12);evT=rnd(70,130);updTarget();if(JOB.fired)toast('😢 你还在待业，去「外卖员 → 求职网」找工作',3000);else toast('🛵 上线接单！边骑边等派单',2200);}updMissionUI(true);peekCard();}
function setDest(){const p=dests[destIdx];beacon.position.copy(p);beacon.visible=true;setLabel(mission.k==='multi'?`${mission.place} ${destIdx+1}/${dests.length}`:mission.place);}
function progress(){const m=mission,s=stats;
  switch(m.k){case'reach':case'multi':{const d=player.position.distanceTo(dests[destIdx]);return {txt:(m.k==='multi'?`包裹 ${destIdx}/${dests.length} · `:'')+`距目的地 ${Math.round(d)} m`,done:false};}
    case'free':return {txt:`🪙 ${coins}`,done:false};
    case'fish':return {txt:`🐟 ${s.fish} / ${m.n}`,done:s.fish>=m.n};
    case'legal':return {txt:`🚦 文明通过 ${s.legal} / ${m.n} 个路口`,done:s.legal>=m.n};
    case'speed':return {txt:`最高 ${Math.round(s.maxV*3.6)} / ${m.n} km/h`,done:s.maxV*3.6>=m.n};
    case'dist':return {txt:`${(s.dist/1000).toFixed(2)} / ${(m.n/1000).toFixed(1)} km`,done:s.dist>=m.n};
    case'calm':return {txt:`平稳 ${Math.floor(s.calm)} / ${m.n} 秒`,done:s.calm>=m.n};
    case'bell':return {txt:`🔔 ${s.bells.size} / ${m.n} 个路口`,done:s.bells.size>=m.n};
    case'near':return {txt:`😎 ${s.near} / ${m.n} 次`,done:s.near>=m.n};
    case'cars':return {txt:`帕拉梅拉 ${Math.min(m.n,s.pana.size)}/${m.n} · 宝马 ${Math.min(m.n,s.bmw.size)}/${m.n}`,done:s.pana.size>=m.n&&s.bmw.size>=m.n};}}
let uiT=0;
function updMissionUI(force){uiT-=1;if(!force&&uiT>0)return;uiT=6;if(exam){updExamUI();return;}if(!mission)return;if(mission.k==='free'){delivUI();return;}const p=progress();
  $('mE').textContent=mission.e;$('mT').textContent=mission.t;$('mP').textContent=p.txt;
  const tl=mission.lim?` · ⏱ ${Math.max(0,Math.ceil(mission.lim-mT))}s`:` · ⏱ ${Math.floor(mT)}s`;$('mS').textContent=`⭐ ${stats.score}${tl}`+(stats.viol?` · 🚨${stats.viol}`:'')+` · 🪪${LIC.ok?LIC.pts+'分':'吊销'}`;}
function finish(win,reason){if(state==='end'||exam)return;const prev=state;state='end';gas=braking=kL=kR=false;
  const ending=win?pick(mission.win):pick(FAILS[reason]);const twist=Math.random()<.3?pick(TWISTS):'';
  win?SFX.win():SFX.lose();
  if(win){coins+=mission.reward;saveCoins();}$('eTag').textContent=(win?'任务完成':'任务失败')+` · ${DIFF[mission.diff]} · 随机结局`;$('eE').textContent=win?mission.e:'💥';$('eT').textContent=win?`${mission.t} ✓`:mission.t;$('eD').textContent=ending;$('eX').textContent=twist;
  $('eS').innerHTML=[`⏱ ${Math.floor(mT)} 秒`,`📏 ${(stats.dist/1000).toFixed(2)} km`,`🐟 ${stats.fish}`,`🚀 最高 ${Math.round(stats.maxV*3.6)} km/h`,`🚨 闯红灯 ${stats.viol}`,`⭐ ${stats.score}`].map(s=>`<span class="stat">${s}</span>`).join('')+`<p style="font-size:17px;font-weight:800;margin-top:8px">${win?`🪙 +${mission.reward}　`:''}金币共 ${coins}</p>`;
  setTimeout(()=>{$('end').style.display='flex';},prev==='crash'?1400:300);}

// ===== UI =====
(function(){const MAP={settings:'closeSet',ach:'achBack',job:'jbBack',jobs:'jsBack',shop:'closeShop',revoked:'rvOk',exIntro:'ixNo',crashed:'again',end:'restart'};
  const ids=['settings','choice','ach','job','jobs','shop','lic','revoked','exIntro','exEnd','crashed','end'];
  const addX=()=>ids.forEach(id=>{const ov=$(id);if(!ov)return;const pn=ov.querySelector('.panel')||ov.firstElementChild;if(!pn||pn.querySelector(':scope>.ovx'))return;pn.style.position=pn.style.position||'relative';
    const x=document.createElement('button');x.className='ovx';x.textContent='✕';x.setAttribute('aria-label','关闭');
    x.onclick=e=>{e.stopPropagation();let t=MAP[id]?$(MAP[id]):null;
      if(!t&&id==='lic')t=[...$('lcB').children].pop();
      if(!t&&id==='exEnd')t=[...$('xeB').children].pop();
      if(!t&&id==='choice')t=$('chB').querySelector('.primary')||$('chB').firstElementChild;
      if(t)t.click();else ov.style.display='none';};
    pn.appendChild(x);});[0,800,3000].forEach(t=>setTimeout(addX,t));document.addEventListener('click',()=>setTimeout(addX,50),true);})();
function toast(m,ms){const e=$('toast');e.innerHTML='';const sp=document.createElement('span');sp.textContent=m;e.appendChild(sp);const x=document.createElement('b');x.className='xclose';x.textContent='✕';x.onpointerdown=ev=>{ev.preventDefault();ev.stopPropagation();e.style.display='none';};e.appendChild(x);e.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.display='none',ms||2000);}
function hold(id,set){const el=$(id);const on=e=>{e.preventDefault();initAudio();set(true);el.classList.add('down');try{el.setPointerCapture(e.pointerId);}catch(_){}};const off=()=>{set(false);el.classList.remove('down');};
  el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);el.addEventListener('contextmenu',e=>e.preventDefault());}
hold('gas',b=>gas=b);hold('brake',b=>braking=b);hold('kL',b=>kL=b);hold('kR',b=>kR=b);
$('bell').addEventListener('pointerdown',e=>{e.preventDefault();initAudio();ringBell();});
function ringBell(){if(drive!=='bike'){SFX.horn();if(!exam&&state==='ride'){const n=performance.now();rule.horns=(rule.horns||[]).filter(x=>n-x<5000);rule.horns.push(n);if(rule.horns.length>=3&&rule.hornC<=0){rule.hornC=30;rule.horns=[];ticket('违反禁止鸣喇叭规定（连续鸣笛）',100,0,0);}}}else{SFX.bell();bellEgg();}if(inInter&&state==='ride'){const k=inInter.join(',');if(!stats.bells.has(k)){stats.bells.add(k);if(mission&&mission.k==='bell')toast(`🔔 叮铃铃！(${stats.bells.size}/${mission.n})`);}}}
addEventListener('keydown',e=>{initAudio();const c=e.code;if(c==='ArrowUp'||c==='KeyW')gas=true;if(c==='ArrowDown'||c==='KeyS'||c==='Space')braking=true;if(c==='ArrowLeft'||c==='KeyA')kL=true;if(c==='ArrowRight'||c==='KeyD')kR=true;if(c==='KeyB')ringBell();});
addEventListener('keyup',e=>{const c=e.code;if(c==='ArrowUp'||c==='KeyW')gas=false;if(c==='ArrowDown'||c==='KeyS'||c==='Space')braking=false;if(c==='ArrowLeft'||c==='KeyA')kL=false;if(c==='ArrowRight'||c==='KeyD')kR=false;});
function segCtl(id,opts,idx,cb){const el=$(id);el.innerHTML='';opts.forEach((o,i)=>{const b=document.createElement('button');b.textContent=o;if(i===idx)b.classList.add('on');b.onclick=()=>{[...el.children].forEach(c=>c.classList.remove('on'));b.classList.add('on');cb(i);};el.appendChild(b);});}
let resumeState='ride';
$('bSet').onclick=()=>{initAudio();$('closeSet').textContent=state==='menu'?'返回':'继续骑行';if(state==='ride'||state==='foot'){resumeState=state;state='paused';}else resumeState=state;$('settings').style.display='flex';};
$('closeSet').onclick=()=>{$('settings').style.display='none';if(state==='menu'){showStart();return;}if(state==='paused')state=resumeState;};
$('setBtn').onclick=()=>{initAudio();$('start').style.display='none';$('closeSet').textContent='返回';$('settings').style.display='flex';};
$('newMission').onclick=()=>{$('settings').style.display='none';openSaves();};
function slotGet(n){try{return JSON.parse(localStorage.getItem('pel_slot'+n)||'null');}catch(e){return null;}}
function curSlot(){return +(localStorage.getItem('pel_cur')||0);}
function openSaves(){const fmt=t=>{const d=new Date(t);return `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;};const cur=curSlot();
  let h='<div class="svL">';for(let n=1;n<=3;n++){const s=slotGet(n);h+=`<div class="svR${cur===n?' on':''}"><div class="svI">💾</div><div class="svT"><b>存档 ${n}${cur===n?' · 当前':''}</b><span>${s?`🪙 ${s.coins} · 第 ${s.day||1} 天 · ${fmt(s.t)}`:'空存档'}</span></div><button class="pill glass" data-sv="s${n}">保存</button><button class="pill glass primary${s?'':' dis'}" data-sv="l${n}">读取</button></div>`;}
  h+='</div><p style="font-size:12px;opacity:.75;margin:6px 0 0">游戏会自动保存进度；存档可以把当前进度备份到一个格子里，随时读回来。</p>';
  mdlOpen('💾 存档管理',h,[{t:'🆕 新建存档',f:()=>{mdlOpen('🆕 新建存档？','会从 0 金币、初始单车开始新的游戏。<br>已经保存到格子里的存档不会丢。',[{t:'确定新建',p:1,f:()=>{saveCoins();try{['pelicanSave','pelicanCodes','pelicanCoins'].forEach(k=>localStorage.removeItem(k));localStorage.setItem('pel_cur','0');localStorage.setItem('pel_fresh','1');}catch(e){}location.reload();}},{t:'取消',f:()=>openSaves()}]);}},{t:'返回',p:1,f:()=>{mdlClose();$('settings').style.display='flex';}}],true);
  $('mdlC').querySelectorAll('[data-sv]').forEach(b=>b.onclick=()=>{const k=b.dataset.sv,n=+k.slice(1);
    if(k[0]==='s'){const s=slotGet(n);const doSave=()=>{saveCoins();try{localStorage.setItem('pel_slot'+n,JSON.stringify({s:localStorage.getItem('pelicanSave'),c:localStorage.getItem('pelicanCodes'),coins,day:CAL.day,t:Date.now()}));localStorage.setItem('pel_cur',''+n);}catch(e){toast('保存失败：存储空间不足');return;}SFX.win&&SFX.win();toast(`💾 已保存到存档 ${n}`,1600);openSaves();};
      if(s&&curSlot()!==n)mdlOpen(`覆盖存档 ${n}？`,`原有进度（🪙 ${s.coins} · 第 ${s.day||1} 天）会被替换`,[{t:'覆盖',p:1,f:doSave},{t:'取消',f:()=>openSaves()}]);else doSave();}
    else{const s=slotGet(n);if(!s){toast('这是个空存档');return;}mdlOpen(`读取存档 ${n}？`,'当前没保存的进度会丢失，游戏会重新载入。',[{t:'读取',p:1,f:()=>{try{if(s.s)localStorage.setItem('pelicanSave',s.s);else localStorage.removeItem('pelicanSave');if(s.c)localStorage.setItem('pelicanCodes',s.c);else localStorage.removeItem('pelicanCodes');localStorage.setItem('pel_cur',''+n);}catch(e){}location.reload();}},{t:'取消',f:()=>openSaves()}]);}});}
segCtl('sgSound',['开','关'],0,i=>{muted=i===1;if(master)master.gain.value=muted?0:.9;});
segCtl('sgMusic',['开','关'],musOn?0:1,i=>setMusic(i===0));
segCtl('sgGyro',['关','开','反向'],0,async i=>{gyroBase=null;
  if(i>0&&gyroMode===0){try{if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission==='function'){const r=await DeviceOrientationEvent.requestPermission();if(r!=='granted'){toast('没有获得陀螺仪权限');return;}}}catch(err){}
    addEventListener('deviceorientation',onOri);setTimeout(()=>{if(gyroMode&&!gyroSeen)toast('收不到陀螺仪数据：请在手机浏览器里直接打开本页',3200);},2000);}
  if(i===0)removeEventListener('deviceorientation',onOri);gyroMode=i;showSteer();if(i)toast('以当前姿势为中立，左右倾斜手机转向');});
$('sens').oninput=e=>{sens=+e.target.value;};
let controls=null;
segCtl('sgCam',['追尾','远景','侧面','自由'],0,i=>{camMode=i;if(i===3&&THREE.OrbitControls){controls=new THREE.OrbitControls(camera,renderer.domElement);controls.target.copy(player.position).add(V(0,1,0));controls.enableDamping=true;controls.maxPolarAngle=PI*.49;controls.minDistance=2;controls.maxDistance=40;}else if(controls){controls.dispose();controls=null;}});
const LIGHTS=[{bg:0xf4a76c,hs:0xffd6b0,hg:0x4d6b35,hi:.7,sc:0xffb066,si:1.6,so:V(-30,22,18),ex:1.0,night:false},
  {bg:0x93bfdc,hs:0xeef3ff,hg:0x5a7444,hi:.55,sc:0xfff1dc,si:1.0,so:V(20,45,25),ex:.92,night:false},
  {bg:0x0a1330,hs:0x5060a0,hg:0x1a2418,hi:.45,sc:0x9aa8ff,si:.35,so:V(-20,40,-20),ex:1.15,night:true},
  {bg:0xc4d3df,hs:0xffe9d2,hg:0x55683f,hi:.48,sc:0xffd9b0,si:.8,so:V(40,22,10),ex:.9,night:false}];
function applyLight(){const L=LIGHTS[lightMode];scene.background.setHex(L.bg);scene.fog.color.setHex(L.bg);hemi.color.setHex(L.hs);hemi.groundColor.setHex(L.hg);hemi.intensity=L.hi;sun.color.setHex(L.sc);sun.intensity=L.si;renderer.toneMappingExposure=L.ex;
  stars.visible=L.night;headL.intensity=L.night?6:0;lampGlass.material.emissiveIntensity=L.night?2.5:0;headM.emissiveIntensity=L.night?2.2:.6;cloudM.emissive.setHex(L.night?0x000000:0x332211);cloudM.color.setHex(L.night?0x4a5578:0xffffff);
  towers.material.emissive=new THREE.Color(L.night?0x333020:0x000000);}
segCtl('sgTime',['黄昏','白天','夜晚'],0,i=>{lightMode=i;applyLight();});applyLight();
setTimeout(()=>segCtl('sgWx',['随机','晴天','下雨','下雪'],0,i=>{wxMode=i;const fx=()=>{if(fogF0)scene.fog.far=fogF0;};if(i===1){rainT=0;stopSnow();fx();}else if(i===2){rainT=0;startRain();rainT=1e9;}else if(i===3){stopSnow();startSnow(true);}else{rainT=0;stopSnow();fx();}}),0);
segCtl('sgTraffic',['少','中','多'],1,i=>{traffic=i;});
segCtl('sgShadow',['开','关'],0,i=>{shadows=i===0;renderer.shadowMap.enabled=shadows;scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true);}});});
function onOri(e){if(e.gamma==null)return;gyroSeen=true;const ang=(screen.orientation&&screen.orientation.angle!=null)?screen.orientation.angle:(window.orientation||0);
  const raw=ang===90?e.beta:(ang===270||ang===-90)?-e.beta:e.gamma;if(gyroBase===null)gyroBase=raw;let g=-(raw-gyroBase)/20;if(gyroMode===2)g=-g;gyroVal=clamp(g,-1,1);}
$('go').onclick=()=>{initAudio();try{const de=document.documentElement;if(de.requestFullscreen){de.requestFullscreen().catch(()=>{});}}catch(e){}startMission();};
$('again').onclick=()=>{initAudio();standUp();};
$('restart').onclick=()=>{$('end').style.display='none';hardReset();newMission();};
let portraitOK=false;$('anyway').onclick=()=>{portraitOK=true;$('rotate').style.display='none';};
function checkOrient(){$('rotate').style.display='none';}


function showSteer(){$('steer').style.display=(gyroMode||steerStyle===1)?'none':'flex';$('bar').style.display=(!gyroMode&&steerStyle===1)?'flex':'none';}
segCtl('sgSteer',['按键','车把'],0,i=>{steerStyle=i;barVal=0;showSteer();});
segCtl('sgGauge',['显示','隐藏'],0,i=>{gaugeOn=i===0;$('gaugeW').style.display=gaugeOn?'block':'none';});
(function(){const el=$('bar'),svg=$('barSvg');let x0=null,pid=null;
  const set=val=>{barVal=val;svg.style.transform=`rotate(${-val*32}deg)`;};
  el.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();x0=e.clientX;pid=e.pointerId;try{el.setPointerCapture(pid);}catch(_){}});
  el.addEventListener('pointermove',e=>{if(x0===null||e.pointerId!==pid)return;set(clamp(-(e.clientX-x0)/55,-1,1));});
  const up=e=>{if(e.pointerId!==pid)return;x0=null;pid=null;set(0);};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);})();
let cardTimer=null;
function peekCard(){const c=$('mcard');c.classList.remove('mini');clearTimeout(cardTimer);cardTimer=setTimeout(()=>c.classList.add('mini'),3000);}
$('mcard').addEventListener('click',()=>peekCard());


// ===== shop / garage / outfits =====
let drive='bike';const PCAR=V(PC.x-.35,PC.y-.35,-.5);
const pcar=buildCar('pana');player.add(pcar.g);pcar.g.visible=false;
['cab','roof'].forEach(n=>{const o=pcar.g.getObjectByName(n);if(o)o.visible=false;});
pcar.g.getObjectByName('body').material.color.setHex(0xc4161c);
const seat=mesh(new THREE.BoxGeometry(.6,.5,.55),M(0x2a1a14,{roughness:.6}),pcar.g);seat.position.set(-.55,.85,-.45);
const seat2=mesh(new THREE.BoxGeometry(.6,.5,.55),M(0x2a1a14,{roughness:.6}),pcar.g);seat2.position.set(-.55,.85,.45);
const wsf=mesh(new THREE.PlaneGeometry(1.6,.45),new THREE.MeshStandardMaterial({color:0x8fb3c9,transparent:true,opacity:.35,metalness:.9,roughness:.05,side:THREE.DoubleSide}),pcar.g);wsf.position.set(.75,1.1,0);wsf.rotation.set(0,PI/2,0);wsf.rotateX(-.6);
const sw=mesh(new THREE.TorusGeometry(.17,.025,8,24),darkM,pcar.g);sw.position.set(.15,1.05,-.45);sw.rotation.y=PI/2;sw.rotation.x=.4;
// outfits on head
const outfit={};
(function(){const hg=new THREE.Group();up.add(hg);
  const helm=new THREE.Group();hg.add(helm);const hm=mesh(new THREE.SphereGeometry(.17,24,12,0,PI*2,0,PI/2),M(0x2f7de1,{metalness:.3,roughness:.35}),helm);hm.scale.set(1.35,.95,1.05);hm.position.set(.39,2.43,0);
  for(let i=-1;i<=1;i++){const st=mesh(new THREE.BoxGeometry(.32,.025,.03),M(0xffffff),helm);st.position.set(.38,2.58,i*.07);}
  const visor=mesh(new THREE.BoxGeometry(.1,.015,.2),M(0x111111),helm);visor.position.set(.6,2.44,0);visor.rotation.z=-.2;outfit.helmet=helm;
  const straw=new THREE.Group();hg.add(straw);const sm=M(0xe6c77a,{roughness:.95});mesh(new THREE.CylinderGeometry(.3,.3,.02,28),sm,straw).position.set(.38,2.48,0);mesh(new THREE.CylinderGeometry(.13,.15,.13,20),sm,straw).position.set(.38,2.55,0);
  mesh(new THREE.CylinderGeometry(.152,.152,.035,20),M(0xc0392b),straw).position.set(.38,2.51,0);outfit.straw=straw;
  const crown=new THREE.Group();hg.add(crown);const gm=M(0xffc93c,{metalness:1,roughness:.2});const band=mesh(new THREE.CylinderGeometry(.11,.11,.07,20,1,true),gm,crown);band.position.set(.37,2.52,0);
  for(let i=0;i<6;i++){const a=i/6*PI*2;const sp=mesh(new THREE.ConeGeometry(.03,.09,6),gm,crown);sp.position.set(.37+Math.cos(a)*.1,2.6,Math.sin(a)*.1);const gem=mesh(new THREE.SphereGeometry(.018,8,6),M(i%2?0xe0115f:0x1e90ff,{emissive:i%2?0x550022:0x002255}),crown);gem.position.set(.37+Math.cos(a)*.112,2.52,Math.sin(a)*.112);}
  outfit.crown=crown;
  const gl=new THREE.Group();hg.add(gl);const lensM=M(0x0a0a0a,{metalness:.8,roughness:.05});for(const s of[-1,1]){const l=mesh(new THREE.CylinderGeometry(.04,.04,.012,18),lensM,gl);l.rotation.x=PI/2;l.position.set(.47,2.415,s*.112);}
  const br=mesh(new THREE.BoxGeometry(.012,.012,.2),lensM,gl);br.position.set(.52,2.43,0);outfit.glasses=gl;
  const sc=new THREE.Group();hg.add(sc);const scM=M(0xd62828,{roughness:.8});const t=mesh(new THREE.TorusGeometry(.13,.05,10,24),scM,sc);t.position.set(.37,1.88,0);t.rotation.x=PI/2;t.rotation.y=.35;
  const tl=mesh(new THREE.BoxGeometry(.08,.32,.03),scM,sc);tl.position.set(.2,1.72,.12);tl.rotation.z=.5;outfit.scarf=sc;
  const G=()=>{const x=new THREE.Group();hg.add(x);return x;};
  {const c=G();const w=M(0xffffff,{roughness:.9});mesh(new THREE.CylinderGeometry(.115,.12,.14,20),w,c).position.set(.38,2.56,0);for(let i=0;i<5;i++){const a=i/5*PI*2;mesh(new THREE.SphereGeometry(.085,12,10),w,c).position.set(.38+Math.cos(a)*.07,2.67,Math.sin(a)*.07);}mesh(new THREE.SphereGeometry(.09,12,10),w,c).position.set(.38,2.71,0);outfit.chef=c;}
  {const c=G();const br=M(0x8b5a2b,{roughness:.8});const brim=mesh(new THREE.CylinderGeometry(.3,.3,.02,28),br,c);brim.position.set(.38,2.49,0);brim.scale.set(1,1,.85);mesh(new THREE.CylinderGeometry(.11,.14,.15,20),br,c).position.set(.38,2.57,0);mesh(new THREE.CylinderGeometry(.142,.142,.03,20),M(0x3b2414),c).position.set(.38,2.52,0);outfit.cowboy=c;}
  {const c=G();const pu=M(0x6c3fc8,{roughness:.6});mesh(new THREE.CylinderGeometry(.26,.26,.015,28),pu,c).position.set(.38,2.49,0);const cn=mesh(new THREE.ConeGeometry(.15,.42,20),pu,c);cn.position.set(.35,2.69,0);cn.rotation.z=.22;mesh(new THREE.CylinderGeometry(.152,.152,.04,20),M(0xffc93c,{metalness:.7,roughness:.3}),c).position.set(.38,2.52,0);for(const p of[[.43,2.66,.1],[.3,2.75,-.06],[.4,2.6,-.12]])mesh(new THREE.OctahedronGeometry(.025),M(0xffd43b,{emissive:0x664400}),c).position.set(...p);outfit.wizard=c;}
  {const c=G();const cn=mesh(new THREE.ConeGeometry(.09,.26,16),M(0xff5c8a,{roughness:.5}),c);cn.position.set(.38,2.61,0);cn.rotation.z=-.15;mesh(new THREE.TorusGeometry(.065,.012,6,16),M(0x4dabf7),c).position.set(.383,2.56,0).constructor;c.children[1].rotation.x=PI/2;mesh(new THREE.SphereGeometry(.035,10,8),M(0xffd43b),c).position.set(.4,2.75,0);outfit.party=c;}
  {const c=G();const rd=M(0xd62828,{roughness:.4});const band=mesh(new THREE.TorusGeometry(.155,.018,8,24,PI),rd,c);band.position.set(.4,2.4,0);band.rotation.y=PI/2;for(const s of[-1,1]){const cup=mesh(new THREE.CylinderGeometry(.06,.06,.045,16),rd,c);cup.rotation.x=PI/2;cup.position.set(.4,2.38,s*.135);mesh(new THREE.CylinderGeometry(.045,.045,.05,14),M(0x222222),c).position.set(.4,2.38,s*.13).constructor;c.children[c.children.length-1].rotation.x=PI/2;}outfit.phones=c;}
  {const c=G();const bk=M(0x151515,{roughness:.5});for(const s of[-1,1]){const w=mesh(new THREE.ConeGeometry(.045,.09,4),bk,c);w.rotation.x=s*PI/2;w.position.set(.47,1.86,s*.045);}mesh(new THREE.SphereGeometry(.022,8,6),bk,c).position.set(.47,1.86,0);outfit.bowtie=c;}
  {const c=G();const t=mesh(new THREE.TorusGeometry(.135,.022,8,28),M(0xffc93c,{metalness:1,roughness:.2}),c);t.position.set(.37,1.86,0);t.rotation.x=PI/2;t.rotation.y=.35;mesh(new THREE.CylinderGeometry(.04,.04,.015,12),M(0xffd700,{metalness:1,roughness:.15}),c).position.set(.47,1.8,0);c.children[1].rotation.z=PI/2;outfit.chain=c;}
  {const c=new THREE.Group();pin.add(c);const bl=M(0x2f7de1,{roughness:.6});const bx=mesh(new THREE.BoxGeometry(.32,.13,.3),bl,c);bx.position.set(-.22,1.6,0);bx.rotation.z=.42;const pk=mesh(new THREE.BoxGeometry(.18,.05,.22),M(0x1d5fb8,{roughness:.6}),c);pk.position.set(-.25,1.67,0);pk.rotation.z=.42;mesh(new THREE.BoxGeometry(.04,.02,.05),M(0xd4a531,{metalness:.7}),c).position.set(-.2,1.71,0);outfit.backpack=c;}
  Object.values(outfit).forEach(o=>o.visible=false);})();
const SHOP=[
 {id:'bike_red',cat:0,name:'经典红单车',icon:'🚲',price:0,kind:'vehicle',col:0xc41e3a,st:[3,3,3]},
 {id:'bike_mint',cat:0,name:'薄荷绿单车',icon:'🚲',price:300,kind:'vehicle',col:0x2fbf9a,st:[3,3,4]},
 {id:'bike_sky',cat:0,name:'天空蓝单车',icon:'🚲',price:450,kind:'vehicle',col:0x3fa9e0,st:[3,4,3]},
 {id:'bike_black',cat:0,name:'午夜黑单车',icon:'🚲',price:600,kind:'vehicle',col:0x1d1d24,st:[4,3,3]},
 {id:'bike_orange',cat:0,name:'活力橙单车',icon:'🚲',price:750,kind:'vehicle',col:0xf28c1e,st:[4,4,3]},
 {id:'bike_pink',cat:0,name:'樱花粉单车',icon:'🚲',price:900,kind:'vehicle',col:0xf28bb3,st:[3,4,4]},
 {id:'bike_violet',cat:0,name:'紫罗兰单车',icon:'🚲',price:1200,kind:'vehicle',col:0x7b3fe4,st:[4,4,4]},
 {id:'bike_white',cat:0,name:'奶油白单车',icon:'🚲',price:1500,kind:'vehicle',col:0xf3efe6,st:[4,4,5]},
 {id:'bike_gold',cat:0,name:'土豪金单车',icon:'🚲',price:2000,kind:'vehicle',col:0xd4a531,st:[5,5,5]},
 {id:'moto',cat:0,name:'街车摩托',icon:'🏍️',price:3000,kind:'vehicle',moto:true,st:[5,4,3]},
 {id:'pana',cat:0,name:'保时捷帕拉梅拉',icon:'🏎️',price:9999,kind:'vehicle',car:true,st:[5,5,4]},
 {id:'glasses',cat:1,name:'酷炫墨镜',icon:'🕶️',price:300,kind:'eyes'},
 {id:'bowtie',cat:1,name:'绅士领结',icon:'🎀',price:350,kind:'neck'},
 {id:'party',cat:1,name:'派对帽',icon:'🥳',price:400,kind:'hat'},
 {id:'helmet',cat:1,name:'骑行头盔',icon:'⛑️',price:500,kind:'hat'},
 {id:'straw',cat:1,name:'夏日草帽',icon:'👒',price:600,kind:'hat'},
 {id:'phones',cat:1,name:'红色耳机',icon:'🎧',price:650,kind:'ear'},
 {id:'chef',cat:1,name:'厨师帽',icon:'👨‍🍳',price:700,kind:'hat'},
 {id:'scarf',cat:1,name:'红色围巾',icon:'🧣',price:800,kind:'neck'},
 {id:'backpack',cat:1,name:'运动背包',icon:'🎒',price:800,kind:'back'},
 {id:'cowboy',cat:1,name:'牛仔帽',icon:'🤠',price:900,kind:'hat'},
 {id:'wizard',cat:1,name:'魔法师帽',icon:'🧙',price:1200,kind:'hat'},
 {id:'chain',cat:1,name:'大金链子',icon:'📿',price:1500,kind:'neck'},
 {id:'crown',cat:1,name:'黄金皇冠',icon:'👑',price:2000,kind:'hat'},
 {id:'cola',cat:2,name:'冰镇可乐',icon:'🥤',price:15,kind:'use',d:'体力 +40'},
 {id:'drink',cat:2,name:'能量饮料',icon:'⚡',price:35,kind:'use',d:'体力回满'},
 {id:'medkit',cat:2,name:'急救包',icon:'🩹',price:60,kind:'use',d:'生命回满'},
 {id:'rocket',cat:2,name:'火箭加速',icon:'🚀',price:80,kind:'use',d:'加速 8 秒'},
 {id:'freecard',cat:2,name:'免罚金卡',icon:'🎫',price:200,kind:'use',d:'抵消下一张罚单'}];
const CODES={'VIP666':{coins:6666,msg:'💎 VIP 福利 🪙+6666'},'NJUST':{coins:300,msg:'🎓 南理工学子专属福利 🪙300'},'XIAOGAI':{coins:520,msg:'🦩 小盖专属彩蛋 🪙520'},'PANAMERA':{give:'pana',msg:'🏎️ 帕拉梅拉已解锁！'},'PELICAN666':{coins:666,msg:'🪙 +666 金币'},'XIAOGAI':{coins:1000,msg:'🪙 +1000 金币'}};
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
const K4POOL=[
 ['普通外卖订单的基础报酬是多少金币？',['80','50','120','300'],0],
 ['加急单的基础报酬是多少金币？',['300','100','150','500'],0],
 ['收到几次 1 星差评会被平台解雇？',['6 次','3 次','10 次','1 次'],0],
 ['我国道路上车辆靠哪一侧通行？',['右侧','左侧','中间','随便'],0],
 ['学校区域的限速是多少？',['30 km/h','60 km/h','50 km/h','不限速'],0],
 ['机动车占用非机动车道行驶，罚款多少金币？',['100','20','500','不罚款'],0],
 ['驾照一个记分周期满分是几分？',['12 分','10 分','6 分','100 分'],0],
 ['开车闯红灯一次记几分？',['6 分','1 分','3 分','12 分'],0],
 ['骑自行车违章会怎样？',['只罚款，不记分也不吊销驾照','吊销驾照','记 12 分','什么事都没有'],0],
 ['开车时接打手持电话记几分？',['3 分','0 分','6 分','12 分'],0],
 ['骑手评分达到多少以上算金牌骑手、单价 ×1.5？',['4.8','4.0','3.5','5.0'],0],
 ['斑马线上有行人正在过街，你应该？',['停车礼让行人','鸣笛催他快走','加速冲过去','绕到人行道上'],0],
 ['驾驶摩托车必须？',['戴好安全头盔','戴墨镜','戴草帽','什么都不用戴'],0],
 ['开车发生事故后，几秒内必须停车，否则算肇事逃逸？',['5 秒','30 秒','1 分钟','不用停'],0],
 ['这个游戏的主角是什么动物？',['鹈鹕','海鸥','鸽子','企鹅'],0],
 ['骑车时连续狂按铃铛会引来什么？',['一群鸽子','交警','UFO','一只猫'],0],
 ['血量归零后会发生什么？',['被送到医院，付医疗费','游戏直接删档','变成幽灵继续骑','什么也不会发生'],0],
 ['右转的大型车辆旁边骑车，最需要注意什么？',['内轮差盲区，离它远一点','跟紧它更安全','从它右侧超过去','按铃铛就行'],0]];
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

// ===== gauge =====
const gc=$('gauge'),gx=gc.getContext('2d');const GD=Math.min(window.devicePixelRatio||1,2);gc.width=gc.height=84*GD;let gaugeOn=true;
function drawGauge(){if(!gaugeOn)return;const s=176,c=s/2;gx.setTransform(GD*84/176,0,0,GD*84/176,0,0);gx.clearRect(0,0,s,s);const a0=PI*.75,a1=PI*2.25,MAXK=drive!=='bike'?160:60,kmh=v*3.6;
  gx.lineCap='round';gx.lineWidth=10;gx.strokeStyle='rgba(255,255,255,.18)';gx.beginPath();gx.arc(c,c,70,a0,a1);gx.stroke();
  const ar=k=>a0+(a1-a0)*clamp(k/MAXK,0,1);
  if(drive==='car'){gx.font='900 22px -apple-system,sans-serif';gx.fillStyle={D:'#7cf2ff',R:'#ff6a6a',N:'#ffd34d',P:'#c9c9c9'}[gearMode];gx.textAlign='center';gx.fillText(gearMode,c,c-30);}
  if(drive==='bike'){gx.strokeStyle='rgba(255,70,70,.55)';gx.beginPath();gx.arc(c,c,70,ar(30),a1);gx.stroke();}
  const grd=gx.createLinearGradient(20,0,156,0);grd.addColorStop(0,'#7cf2ff');grd.addColorStop(1,'#ffb347');gx.strokeStyle=grd;gx.beginPath();gx.arc(c,c,70,a0,ar(kmh));gx.stroke();
  gx.lineWidth=1.6;gx.strokeStyle='rgba(255,255,255,.85)';gx.fillStyle='rgba(255,255,255,.9)';gx.font='600 10px -apple-system,sans-serif';gx.textAlign='center';gx.textBaseline='middle';
  for(let k=0;k<=MAXK;k+=10){const a=ar(k),L=k%10?5:9;gx.beginPath();gx.moveTo(c+Math.cos(a)*(62-L),c+Math.sin(a)*(62-L));gx.lineTo(c+Math.cos(a)*62,c+Math.sin(a)*62);gx.stroke();}
  const na=ar(kmh);gx.strokeStyle='#ff6a2b';gx.lineWidth=5;gx.beginPath();gx.moveTo(c-Math.cos(na)*8,c-Math.sin(na)*8);gx.lineTo(c+Math.cos(na)*60,c+Math.sin(na)*60);gx.stroke();
  gx.fillStyle='#fff';gx.beginPath();gx.arc(c,c,5,0,PI*2);gx.fill();
  gx.font='800 46px -apple-system,sans-serif';gx.fillText(Math.round(kmh),c,c+30);gx.font='700 17px -apple-system,sans-serif';gx.fillStyle='rgba(255,255,255,.85)';gx.fillText('km/h',c,c+56);
  // stamina arc (bottom)
  const sa0=PI*.32,sa1=PI*.68;gx.lineWidth=9;gx.strokeStyle='rgba(255,255,255,.18)';gx.beginPath();gx.arc(c,c,80,sa1,sa0,true);gx.stroke();
  const sc=stamina>50?'#5ef08a':stamina>20?'#ffd34d':'#ff5a5a';gx.strokeStyle=boostT>0?'#6ad1ff':sc;gx.beginPath();gx.arc(c,c,80,sa1,sa1-(sa1-sa0)*stamina/100,true);gx.stroke();
  }

// ===== physics helpers =====
function onRoad(x,z){const m=drive==='car'?1.05:drive==='moto'?.45:.3;const rx=x-Math.round(x/B)*B,rz=z-Math.round(z/B)*B;return Math.abs(rz)<=RH-m||Math.abs(rx)<=RH-m;}
function clampRoad(){const p=player.position;if(onRoad(p.x,p.z))return false;
  const nz=Math.round(p.z/B)*B,nx=Math.round(p.x/B)*B,rz=p.z-nz,rx=p.x-nx;
  const mm=drive==='car'?1.1:drive==='moto'?.5:.35;const cz=nz+Math.sign(rz)*(RH-mm),cx=nx+Math.sign(rx)*(RH-mm);
  if(Math.abs(p.z-cz)<Math.abs(p.x-cx))p.z=cz;else p.x=cx;return true;}
function crash(kind,dir,spd){if(state!=='ride')return;state='crash';crashT=0;SFX.crash();
  crashDir.copy(dir||V(Math.cos(heading),0,-Math.sin(heading))).normalize();
  pel.updateMatrixWorld(true);scene.attach(pel);const sp=spd||v;
  pv.copy(crashDir).multiplyScalar(Math.max(4,sp*.85)).add(V(0,kind==='car'?6:3.6,0));pw.set(crashDir.z,0,-crashDir.x).multiplyScalar(-7);
  bikeV=sp*.5;fallTo=(steer>=0?-1:1)*1.42;
  loose.visible=true;const P=pel.position;for(const f of lfs){f.p.copy(P).add(V(rnd(-.2,.2),rnd(0,.4),rnd(-.2,.2)));f.v.copy(crashDir).multiplyScalar(rnd(2,6)).add(V(rnd(-1.5,1.5),rnd(2,5),rnd(-1.5,1.5)));}
  stats.calm=0;hurt(kind==='car'?14+sp*1.6:6+sp*.6,kind==='car'?'被车撞了':'摔倒了');
  if(kind==='car'&&exam)examEnd(false,'发生碰撞事故');else if(kind==='car'&&!(mission&&mission.k==='free')){accident();finish(false,'car');}
  else{if(kind==='car')accident();delivBump(kind==='car'?60:40);stamina=Math.max(0,stamina-25);$('crashMsg').textContent=kind==='car'?`被车撞倒了！时速 ${Math.round(sp*3.6)} km/h。体力 -25${orders.some(o=>o.phase==='carry')?'，外卖也洒了':''}`:`刹车时速度 ${Math.round(sp*3.6)} km/h，超过了 ${rainT>0?'雨天安全速度':'30 km/h'}。体力 -25`;setTimeout(()=>{if(state==='crash')$('crashed').style.display='flex';},1500);}
  v=0;}
function standUp(){if(fieldOn){lean.attach(pel);pel.position.copy(drive==='car'?PCAR:PC);pel.quaternion.identity();pel.scale.set(1,1,1);lean.rotation.x=0;lean.position.y=0;v=0;steer=0;loose.visible=false;$('crashed').style.display='none';state='ride';return;}lean.attach(pel);pel.position.copy(drive==='car'?PCAR:PC);pel.quaternion.identity();pel.scale.set(1,1,1);lean.rotation.x=0;lean.position.y=0;v=0;steer=0;loose.visible=false;$('crashed').style.display='none';clampRoad();state='ride';}
function hardReset(){try{crimeReset();stopSnow();if(INT.on){INT.on=false;intRoot.visible=false;intUI.style.display='none';intHud.style.display='none';}if(state==='foot'||padOn){try{lean.attach(pel);pel.position.copy(drive==='car'?PCAR:PC);pel.quaternion.identity();}catch(_){}setPad(false);}closePhone();thief=null;thiefPed.g.visible=false;player.visible=true;modal.style.display='none';mdlResume=null;}catch(e){}hp=100;ufo.visible=false;orders.length=0;if(offer)closeOffer();walk=null;actO=null;$('act').style.display='none';bag.visible=false;rainT=0;flatT=0;$('choice').style.display='none';acc.t=0;phone.ring=0;if($('phone'))closePhone();CALL=null;ERR=null;if(pel.parent!==lean)standUp();loose.visible=false;state='menu';v=0;stamina=100;exhausted=false;boostT=0;pouchFill=0;}

// ===== camera =====
let camInit=false;const prevP=V(),tmp=V(),tmp2=V(),fv=V();
function updCamera(dt){const offs=[V(-5.6,2.7,.9),V(-11,6.5,1.2),V(.4,1.9,6.5)];
  if(camMode===3&&controls){controls.target.add(tmp.subVectors(player.position,prevP));camera.position.add(tmp);controls.update();return;}
  const o=(camTop?V(-3,14,0):offs[Math.min(camMode,2)].clone()).applyAxisAngle(UP,heading);const want=tmp2.copy(player.position).add(o);
  if(!camInit){camera.position.copy(want);camInit=true;}camera.position.lerp(want,Math.min(1,dt*3.2));
  const focus=state==='crash'?fv.copy(pel.position):fv.set(player.position.x+Math.cos(heading)*2,1.2,player.position.z-Math.sin(heading)*2);camera.lookAt(focus);}

// ===== world pools update =====
let lastBI=1e9,lastBJ=1e9;
function updPools(){const px=player.position.x,pz=player.position.z;const bi=Math.floor(px/B),bj=Math.floor(pz/B),ni=Math.round(px/B),nj=Math.round(pz/B);
  ground.position.set(Math.round(px/10)*10,0,Math.round(pz/10)*10);
  for(let k=0;k<5;k++){roadX[k].position.set(Math.round(px/6)*6,.012,(nj-2+k)*B);roadZ[k].position.set((ni-2+k)*B,.012,Math.round(pz/6)*6);}
  if(bi!==lastBI||bj!==lastBJ){lastBI=bi;lastBJ=bj;let k=0;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){blocks[k++].position.set((bi+a+.5)*B,0,(bj+b+.5)*B);}}
  let k=0;for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const it=inters[k++];it.i=ni+a;it.j=nj+b;it.g.position.set(it.i*B,0,it.j*B);if(it.off)it.off.visible=hash(it.i*1.37+5.1,it.j*2.11-3.7)<.3;
    for(const h of it.heads){const st=light(it.i,it.j,h.ax);h.mats[0].emissiveIntensity=st==='r'?2.4:0;h.mats[1].emissiveIntensity=st==='y'?2.4:0;h.mats[2].emissiveIntensity=st==='g'?2.4:0;
      const n=Math.ceil(lightLeft(it.i,it.j,h.ax)),key=st+n;if(key!==h.key){h.key=key;const x=h.ctx2;x.fillStyle='#050505';x.fillRect(0,0,64,40);x.fillStyle=st==='r'?'#ff3b30':st==='y'?'#ffcc00':'#34c759';x.font='bold 34px monospace';x.textAlign='center';x.textBaseline='middle';x.fillText(String(n).padStart(2,'0'),32,22);h.ctex.needsUpdate=true;}}}
  updScenery(px,pz);updSegs(ni,nj);updPOI(px,pz);}

// ===== traffic update =====
const obst=[];
function updTraffic(dt){const want=[7,15,24][traffic];
  if(cars.length<want&&Math.random()<.25)spawnCar();
  for(let i=cars.length-1;i>=0;i--){const c=cars[i];if(c.pos.distanceTo(player.position)>240||(cars.length>want+2&&c.pos.distanceTo(player.position)>120)){disposeCar(c);cars.splice(i,1);}}
  obst.length=0;for(const c of cars){obst.push({p:c.pos,hl:c.hl,hw:c.hw,o:c,f:c.fwd});if(c.trg)obst.push({p:c.trC,hl:6.7,hw:1.25,o:c,f:c.trF});}
  const pp=player.position,pAlive=state==='ride';
  for(const c of cars){let dist=1e9;let blockedByPlayer=false;const rx=-c.fwd.z,rz=c.fwd.x;
    if(c.seg===0){const toStop=c.segLen-c.s;const Mx=c.node[0]+D[c.dir][0],Mz=c.node[1]+D[c.dir][1];const L=light(Mx,Mz,c.dir%2);
      if(L!=='g'){const canStop=toStop>c.v*c.v/(2*7)+.8;if(L==='r'&&toStop>-.5||canStop)dist=Math.min(dist,toStop-.6-(c.trg?0:0));}
      if(c.nd!==c.dir&&toStop<35)dist=Math.min(dist,toStop+4);}
    dist=Math.min(dist,pedGap(c,rx,rz));
    for(const o of obst){if(o.o===c)continue;const dx=o.p.x-c.pos.x,dz=o.p.z-c.pos.z;const f=dx*c.fwd.x+dz*c.fwd.z;if(f<=0||f>45)continue;const lat=Math.abs(dx*rx+dz*rz);if(lat>o.hw+1.1)continue;dist=Math.min(dist,f-o.hl-c.hl-2.2);}
    if(pAlive||state==='crash'){const dx=pp.x-c.pos.x,dz=pp.z-c.pos.z;const f=dx*c.fwd.x+dz*c.fwd.z,lat=Math.abs(dx*rx+dz*rz);if(f>0&&f<40&&lat<c.hw+(drive==='car'?1.6:.9)){const g=f-c.hl-2.5;if(g<dist){dist=g;blockedByPlayer=true;}}}
    let vt=Math.min(c.vmax,Math.sqrt(Math.max(0,2*6*Math.max(0,dist))));if(c.seg===1&&c.nd!==c.dir)vt=Math.min(vt,c.nd===(c.dir+1)%4?5.5:7.5);
    const dv=vt-c.v;c.v+=clamp(dv,-10*dt,2.8*dt);if(c.v<0)c.v=0;
    if(c.bar){const k=(T*3|0)%2;c.bar[0].emissiveIntensity=k?3.5:.2;c.bar[1].emissiveIntensity=k?.2:3.5;}
    const braking=dv<-.5||c.v<.3;c.tail.forEach(m=>m.emissiveIntensity=braking?2.2:.45);
    if(blockedByPlayer&&c.v<.4){c.stopT+=dt;if(c.stopT>2.5){c.stopT=-3;if(c.pos.distanceTo(pp)<35){SFX.horn();toast('🚗 嘀嘀！后面的车在按喇叭');}}}else if(c.stopT>0)c.stopT=0;
    c.s+=c.v*dt;
    while(c.s>=c.segLen){c.s-=c.segLen;if(c.seg===0)setTurn(c);else{c.node=c.nextNode;c.dir=c.nd;setStraight(c);}}
    carPos(c);placeCar(c);
    for(const w of c.wheels)w.w.rotation.z-=c.v*dt/w.r;}
}
function carPlayerInteract(dt){if(state!=='ride')return;const pp=player.position;const pf=V(Math.cos(heading),0,-Math.sin(heading));
  for(const o of obst){const c=o.o;const dx=pp.x-o.p.x,dz=pp.z-o.p.z;const f=dx*o.f.x+dz*o.f.z,lat=dx*(-o.f.z)+dz*o.f.x;
    const ph=drive==='car'?2.5:drive==='moto'?1.0:.45,pw2=drive==='car'?1.0:drive==='moto'?.45:.35;
    if(Math.abs(f)<o.hl+ph&&Math.abs(lat)<o.hw+pw2){const rel=Math.abs(c.v-pf.dot(o.f)*v);
      if(c.v>2.5&&f>-o.hl*.3||rel>6){crash('car',c.v>v?o.f:pf,Math.max(c.v,v));return;}
      const push=Math.abs(lat)/(o.hw+.35)>Math.abs(f)/(o.hl+.45);if(push){pp.x+=(-o.f.z)*Math.sign(lat)*(o.hw+pw2+.01-Math.abs(lat));pp.z+=o.f.x*Math.sign(lat)*(o.hw+pw2+.01-Math.abs(lat));}else{v*=.3;}
      if(bumpCool<=0){SFX.bump();bumpCool=.6;stats.calm=0;accident();delivBump(15);if(drive==='bike')hurt(4,'被车剐蹭');}}
    else if(o.p===c.pos&&c.v>4&&Math.abs(f)<o.hl&&Math.abs(lat)<o.hw+1.7&&!c.near){c.near=true;stats.near++;stats.score+=15;toast(`😎 擦肩而过！+15`);}
    if(o.p===c.pos&&Math.abs(f)>o.hl+6)c.near=false;
    if(o.p===c.pos&&mission&&mission.k==='cars'&&Math.hypot(dx,dz)<9){if(c.type==='pana'&&!stats.pana.has(c.id)){stats.pana.add(c.id);toast(`🏎️ 帕拉梅拉 ${Math.min(mission.n,stats.pana.size)}/${mission.n}`);}if(c.type==='bmw'&&!stats.bmw.has(c.id)){stats.bmw.add(c.id);toast(`🚘 宝马 ${Math.min(mission.n,stats.bmw.size)}/${mission.n}`);}}}}

// ===== lane arrows =====
const arrowT=canvasTex(320,176,(x,w,h)=>{x.clearRect(0,0,w,h);x.fillStyle='rgba(245,245,240,.92)';
  const arr=(cx,cy,dir)=>{x.save();x.translate(cx,cy);x.scale(dir,1);x.beginPath();x.moveTo(-26,-4);x.lineTo(8,-4);x.lineTo(8,-12);x.lineTo(28,0);x.lineTo(8,12);x.lineTo(8,4);x.lineTo(-26,4);x.closePath();x.fill();x.restore();};
  arr(150,(5.5+2.2)/11*176,1);arr(170,(5.5-2.2)/11*176,-1);
  // bike lane icon
  x.strokeStyle='rgba(245,245,240,.8)';x.lineWidth=2;const bk=(cx,cy)=>{x.beginPath();x.arc(cx-8,cy,5,0,7);x.arc(cx+8,cy,5,0,7);x.stroke();x.beginPath();x.moveTo(cx-8,cy);x.lineTo(cx,cy-6);x.lineTo(cx+8,cy);x.stroke();};
  bk(60,(5.5+4.8)/11*176);bk(260,(5.5-4.8)/11*176);},true);arrowT.repeat.set(20,1);
const arrowM=new THREE.MeshStandardMaterial({map:arrowT,transparent:true,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1.5});
const arrX=[],arrZ=[];
for(let k=0;k<5;k++){const a=mesh(new THREE.PlaneGeometry(600,11),arrowM,scene);a.rotation.x=-PI/2;a.castShadow=false;arrX.push(a);
  const b=mesh(new THREE.PlaneGeometry(600,11),arrowM,scene);b.rotation.set(-PI/2,0,PI/2);b.castShadow=false;arrZ.push(b);}
function updArrows(px,pz,ni,nj){for(let k=0;k<5;k++){arrX[k].position.set(Math.round(px/B)*B+B/2,.013,(nj-2+k)*B);arrZ[k].position.set((ni-2+k)*B,.013,Math.round(pz/B)*B+B/2);}}

// ===== roadside shops & homes =====
const SHOPX={
 '鹈鹕炸鸡':{s:'炸鸡不炸鹈鹕',bg:'#d94f3d'},'老王海鲜':{s:'今日到货：皮皮虾',bg:'#2f7dd1'},'张姐麻辣烫':{s:'变态辣 敢挑战吗',bg:'#c0392b'},
 '渔港寿司':{s:'新鲜三文鱼 每日空运',bg:'#e8743b'},'阿婆奶茶':{s:'阿婆亲手煮珍珠',bg:'#8e44ad'},'深夜烧烤':{s:'晚上八点才开门',bg:'#3b2b20'},
 '鲜果切':{s:'保熟！不熟不要钱',bg:'#29a35a'},'兰州牛肉面':{s:'一清二白三红四绿',bg:'#f2a71b'},'小笼包铺':{s:'先开窗 后喝汤',bg:'#a0522d'},
 '汉堡工坊':{s:'隐藏款：鹈鹕堡',bg:'#e67e22'},'披萨小站':{s:'榴莲披萨 敢点吗',bg:'#16a085'},'金陵盐水鸭':{s:'南京人的灵魂',bg:'#b9770e'},
 '鸭血粉丝汤':{s:'香菜管够',bg:'#7f8c8d'},'黄焖鸡米饭':{s:'正宗第 10086 家',bg:'#d4ac0d'},'煎饼果子':{s:'加俩蛋 不加钱？',bg:'#ca6f1e'},'海鸥咖啡':{s:'店长是一只海鸥',bg:'#5d6d7e'}};
const SHOPS=[['🍗','鹈鹕炸鸡'],['🦞','老王海鲜'],['🌶️','张姐麻辣烫'],['🍣','渔港寿司'],['🧋','阿婆奶茶'],['🍢','深夜烧烤'],['🍉','鲜果切'],['🍜','兰州牛肉面'],['🥟','小笼包铺'],['🍔','汉堡工坊'],['🍕','披萨小站'],['🦆','金陵盐水鸭'],['🥣','鸭血粉丝汤'],['🍚','黄焖鸡米饭'],['🥞','煎饼果子'],['☕','海鸥咖啡']];
const HOMES=['翡翠湖小区','海鸥公寓','鹭岛花园','渔人码头','星河湾','梧桐里','云锦苑','南理工宿舍','紫金山庄','秦淮人家'];
const SHOPC=[0xd94f3d,0x2f7dd1,0x29a35a,0xf2a71b,0x8e44ad,0xe8743b,0x16a085,0xc0392b];
const ALONG=[-28,0,28],FRONT=B/2-RH-3.2;
function poiAt(bi,bj,side,slot){if(isSchool(bi,bj))return null;const h=hash(bi*3.17+side*17.3+slot*5.71,bj*2.73-side*4.13+slot*11.37);if(h<.1)return null;
  const h2=hash(bi*9.1+side*2.3+slot*7.7+1.3,bj*5.3+slot*3.1-side*8.9),[dx,dz]=D[side],tx=-dz,tz=dx,al=ALONG[slot];
  const cx=(bi+.5)*B,cz=(bj+.5)*B,shop=h<.48;const w=shop?12:14,d=shop?9:12,ht=shop?4.6+h2*2.5:13+h2*20;
  const door=V(cx+dx*FRONT+tx*al,0,cz+dz*FRONT+tz*al),park=V(cx+dx*(B/2-RH+1.4)+tx*al,0,cz+dz*(B/2-RH+1.4)+tz*al);
  const ctr=V(cx+dx*(FRONT-d/2)+tx*al,0,cz+dz*(FRONT-d/2)+tz*al);
  const key=`${bi},${bj},${side},${slot}`;
  if(shop){const s=SHOPS[Math.floor(h2*SHOPS.length*7)%SHOPS.length];return {key,shop:true,e:s[0],name:s[1],w,d,ht,door,park,ctr,side,n:V(dx,0,dz),col:SHOPC[Math.floor(h*97)%SHOPC.length]};}
  const nm=HOMES[Math.floor(h2*HOMES.length*13)%HOMES.length],no=1+Math.floor(hash(bi+side*.37,bj+slot*.71)*9);
  return {key,shop:false,e:'🏢',name:`${nm} ${no}栋`,w,d,ht,door,park,ctr,side,n:V(dx,0,dz),col:0xffffff};}
function poisOfBlock(bi,bj){const r=[];for(let s=0;s<4;s++)for(let k=0;k<3;k++){const p=poiAt(bi,bj,s,k);if(p)r.push(p);}return r;}
const shopFrontT=canvasTex(128,128,(x,w,h)=>{x.fillStyle='#f4efe6';x.fillRect(0,0,w,h);x.fillStyle='#9fc3d6';x.fillRect(8,58,50,60);x.fillRect(70,58,50,60);x.fillStyle='#5b4636';x.fillRect(56,50,16,78);x.fillStyle='rgba(0,0,0,.15)';x.fillRect(0,0,w,10);});
const NPOI=320;
const shopB=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff,{map:shopFrontT,roughness:.8}),NPOI);
const awnB=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff,{roughness:.6}),NPOI);
const resT=canvasTex(64,128,(x,w,h)=>{x.fillStyle='#e7e1d6';x.fillRect(0,0,w,h);for(let r=0;r<10;r++)for(let c=0;c<4;c++){x.fillStyle=Math.random()<.25?'#ffe3a0':'#6a8299';x.fillRect(5+c*15,4+r*12.6,9,7);}x.fillStyle='#8a7a68';x.fillRect(24,116,16,12);});
const resB=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0xffffff,{map:resT,roughness:.7}),NPOI);
const roofB=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),M(0x6f6a64,{roughness:.9}),NPOI);
const roofSignMats={},boardMats={};
function roofSignMat(p){const k=p.name;if(roofSignMats[k])return roofSignMats[k];const X=SHOPX[p.name]||{bg:'#d94f3d'};
  const t=canvasTex(256,256,(x,w,h)=>{x.fillStyle=X.bg;x.beginPath();x.arc(w/2,h/2,120,0,7);x.fill();x.lineWidth=10;x.strokeStyle='#fff';x.stroke();x.font='150px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(p.e,w/2,h/2+10);});
  return roofSignMats[k]=new THREE.MeshBasicMaterial({map:t,transparent:true,alphaTest:.3,side:THREE.DoubleSide,toneMapped:false});}
function boardMat(p){const k=p.name;if(boardMats[k])return boardMats[k];const X=SHOPX[p.name]||{s:'欢迎光临'};
  const t=canvasTex(128,192,(x,w,h)=>{x.fillStyle='#6b4a2f';x.fillRect(0,0,w,h);x.fillStyle='#22312a';x.fillRect(8,8,w-16,h-16);x.fillStyle='#fff';x.textAlign='center';
    x.font='bold 20px sans-serif';x.fillText('今日推荐',w/2,34);x.fillStyle='#ffe28a';x.font='bold 17px sans-serif';const t2=X.s;const half=Math.ceil(t2.length/2);x.fillText(t2.slice(0,half),w/2,84);x.fillText(t2.slice(half),w/2,110);x.font='40px sans-serif';x.fillText(p.e,w/2,162);});
  return boardMats[k]=M(0xffffff,{map:t,roughness:.9});}
const roofSigns=[],boards=[];
for(let i=0;i<40;i++){const g=new THREE.Group();const pl=new THREE.Mesh(new THREE.PlaneGeometry(3,3),M(0xffffff));pl.position.y=1.9;g.add(pl);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,1.2,6),M(0x555555));pole.position.y=.6;g.add(pole);g.visible=false;scene.add(g);roofSigns.push({g,pl});
  const b=new THREE.Group();const geo=new THREE.BoxGeometry(.8,1.15,.06);const f1=new THREE.Mesh(geo,M(0xffffff));f1.position.set(0,.55,.16);f1.rotation.x=-.25;const f2=f1.clone();f2.position.z=-.16;f2.rotation.x=.25;b.add(f1,f2);b.visible=false;scene.add(b);boards.push({g:b,f1,f2});}
[shopB,awnB,resB,roofB].forEach(m=>{m.castShadow=true;m.receiveShadow=true;m.count=0;scene.add(m);});
const signMats={};function signMat(p){const k=p.name+p.e;if(signMats[k])return signMats[k];
  const t=canvasTex(512,128,(x,w,h)=>{x.fillStyle=p.shop?'#'+p.col.toString(16).padStart(6,'0'):'#24364d';x.fillRect(0,0,w,h);x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=6;x.strokeRect(5,5,w-10,h-10);
    x.fillStyle='#fff';x.font='bold 62px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(p.name,w/2,h/2+3);});
  return signMats[k]=new THREE.MeshBasicMaterial({map:t,toneMapped:false});}
const signG=new THREE.PlaneGeometry(1,1);const signs=[];for(let i=0;i<120;i++){const s=new THREE.Mesh(signG,signMats.x||M(0xffffff));s.visible=false;scene.add(s);signs.push(s);}
const curPOI=[];let poiBI=1e9,poiBJ=1e9;
function updPOI(px,pz){const bi=Math.floor(px/B),bj=Math.floor(pz/B);if(bi===poiBI&&bj===poiBJ)return;poiBI=bi;poiBJ=bj;curPOI.length=0;
  let ns=0,nr=0,sg=0,rs=0;
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++)for(const p of poisOfBlock(bi+a,bj+b)){curPOI.push(p);const alongX=p.n.z!==0;
    const sx=alongX?p.w:p.d,sz=alongX?p.d:p.w;
    if(p.shop&&ns<NPOI){dummy.rotation.set(0,0,0);dummy.position.set(p.ctr.x,p.ht/2+.16,p.ctr.z);dummy.scale.set(sx,p.ht,sz);dummy.updateMatrix();shopB.setMatrixAt(ns,dummy.matrix);
      dummy.position.set(p.door.x+p.n.x*.9,2.9,p.door.z+p.n.z*.9);dummy.scale.set(alongX?p.w*.9:1.8,.25,alongX?1.8:p.w*.9);dummy.updateMatrix();awnB.setMatrixAt(ns,dummy.matrix);awnB.setColorAt(ns,new THREE.Color(p.col));ns++;}
    else if(!p.shop&&nr<NPOI){dummy.rotation.set(0,0,0);dummy.position.set(p.ctr.x,p.ht/2+.16,p.ctr.z);dummy.scale.set(sx,p.ht,sz);dummy.updateMatrix();resB.setMatrixAt(nr,dummy.matrix);
      dummy.position.set(p.ctr.x,p.ht+.4,p.ctr.z);dummy.scale.set(sx+.6,.5,sz+.6);dummy.updateMatrix();roofB.setMatrixAt(nr,dummy.matrix);nr++;}
    if(p.shop&&Math.abs(a)<=1&&Math.abs(b)<=1&&rs<roofSigns.length){const r=roofSigns[rs],bd=boards[rs];rs++;const ry=Math.atan2(p.n.x,p.n.z),tx=-p.n.z,tz=p.n.x;
      r.pl.material=roofSignMat(p);r.g.position.set(p.ctr.x+p.n.x*(p.d/2-1.2),p.ht+.16,p.ctr.z+p.n.z*(p.d/2-1.2));r.g.rotation.set(0,ry,0);r.g.visible=true;
      const bm=boardMat(p);bd.f1.material=bm;bd.f2.material=bm;bd.g.position.set(p.door.x+p.n.x*2.2+tx*(p.w*.32),0,p.door.z+p.n.z*2.2+tz*(p.w*.32));bd.g.rotation.set(0,ry+PI/2,0);bd.g.visible=true;}
    if(Math.abs(a)<=1&&Math.abs(b)<=1&&sg<signs.length){const s=signs[sg++];s.material=signMat(p);s.visible=true;
      const y=p.shop?3.75:Math.min(p.ht-1.5,6.5);s.position.set(p.door.x+p.n.x*.06,y,p.door.z+p.n.z*.06);s.rotation.set(0,Math.atan2(p.n.x,p.n.z),0);s.scale.set(p.shop?p.w*.75:7,p.shop?1.6:1.4,1);}}
  for(let i=sg;i<signs.length;i++)signs[i].visible=false;for(let i=rs;i<roofSigns.length;i++){roofSigns[i].g.visible=false;boards[i].g.visible=false;}
  shopB.count=awnB.count=ns;resB.count=roofB.count=nr;[shopB,awnB,resB,roofB].forEach(m=>{m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;});}

// ===== rain =====
const RN=1400,rainG=new THREE.BufferGeometry(),rainP=new Float32Array(RN*6);rainG.setAttribute('position',new THREE.BufferAttribute(rainP,3));
const rain=new THREE.LineSegments(rainG,new THREE.LineBasicMaterial({color:0xaec4dd,transparent:true,opacity:.55}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);
for(let i=0;i<RN;i++){const x=rnd(-30,30),y=rnd(0,22),z=rnd(-30,30);rainP.set([x,y,z,x+.05,y+.7,z],i*6);}
let rainT=0,fogF0=0;
function updRain(dt){if(rainT<=0){rain.visible=false;return;}rainT-=dt;rain.visible=true;rain.position.set(camera.position.x,0,camera.position.z);
  for(let i=0;i<RN;i++){let y=rainP[i*6+1]-26*dt;if(y<0)y+=22;rainP[i*6+1]=y;rainP[i*6+4]=y+.7;}rainG.attributes.position.needsUpdate=true;
  if(rainT<=0){scene.fog.far=fogF0||scene.fog.far;if(Math.random()<.6)showRainbow();else toast('🌤️ 雨停了');}}
function startRain(){if(rainT>0)return;if(typeof stopSnow==='function')stopSnow();rainT=rnd(60,100);fogF0=fogF0||scene.fog.far;scene.fog.far=Math.min(scene.fog.far,140);toast('🌧️ 突降暴雨！路滑注意刹车 · 雨天补贴 +30%',3200);}

// ===== job / delivery =====
const COS=[{n:'鹈鹕外卖',e:'🦩',m:1,req:'无门槛'},{n:'袋鼠快送',e:'🦘',m:1.15,req:'需要有效驾照',need:()=>LIC.ok},{n:'蜂鸟速递',e:'🐦',m:.95,req:'押金 🪙100',dep:100},{n:'闪电跑腿',e:'⚡',m:.75,req:'来者不拒，不会拉黑'}];
const JOB=Object.assign({co:'鹈鹕外卖',r:[5,5,5,5,5],low:0,fired:false,black:[],n:0,earn:0,tips:0,urg:0,five:0,clean:0,revs:[]},SAVE.job||{});SAVE.job=JOB;
const ACH=SAVE.ach=SAVE.ach||{};
const rating=()=>{const r=JOB.r.slice(-50);return r.reduce((a,b)=>a+b,0)/r.length;};
const rMult=r=>r>=4.8?1.5:r>=4.5?1.2:r>=3.5?1:.8;
const rTier=r=>r>=4.8?'🥇 金牌骑手':r>=4.5?'🥈 银牌骑手':r>=3.5?'🥉 普通骑手':'⚠️ 观察期';
const coOf=()=>COS.find(c=>c.n===JOB.co)||COS[0];
const orders=[];let offer=null,offerT=10,oid=0,evT=rnd(70,130),walk=null,flatT=0,boostOrders=0,wrongPick=null;
const FOODS={'鹈鹕炸鸡':'炸鸡全家桶','老王海鲜':'椒盐皮皮虾','张姐麻辣烫':'麻辣烫（微辣）','渔港寿司':'三文鱼寿司拼盘','阿婆奶茶':'珍珠奶茶 ×2','深夜烧烤':'烤串 30 串','鲜果切':'西瓜果切','兰州牛肉面':'牛肉面加蛋','小笼包铺':'蟹黄小笼包','汉堡工坊':'双层牛肉堡','披萨小站':'榴莲披萨','金陵盐水鸭':'盐水鸭半只','鸭血粉丝汤':'鸭血粉丝汤','黄焖鸡米饭':'黄焖鸡米饭','煎饼果子':'煎饼果子加肠','海鸥咖啡':'冰美式 ×3'};
const PERS=[['普通',.55],['挑剔',.15],['好说话',.18],['大方',.12]];
function pickPers(){let r=Math.random();for(const [n,p] of PERS){if((r-=p)<0)return n;}return '普通';}
function freeMode(){return mission&&mission.k==='free'&&!exam;}
function newOffer(){const bi=Math.floor(player.position.x/B),bj=Math.floor(player.position.z/B);let shop=null,home=null;
  for(let k=0;k<30&&!shop;k++){const ps=poisOfBlock(bi+Math.floor(rnd(-2,3)),bj+Math.floor(rnd(-2,3))).filter(p=>p.shop);if(ps.length)shop=pick(ps);}
  for(let k=0;k<30&&!home;k++){const sb=Math.floor(shop.ctr.x/B),sj=Math.floor(shop.ctr.z/B);const ps=poisOfBlock(sb+Math.floor(rnd(-2,3)),sj+Math.floor(rnd(-2,3))).filter(p=>!p.shop&&p.park.distanceTo(shop.park)>70);if(ps.length)home=pick(ps);}
  let egg=false;if(shop&&Math.random()<.06){const sb=Math.floor(shop.ctr.x/B),sj=Math.floor(shop.ctr.z/B);for(let k=0;k<40&&!egg;k++){const ps=poisOfBlock(sb+Math.floor(rnd(-3,4)),sj+Math.floor(rnd(-3,4))).filter(p=>!p.shop&&p.name.startsWith('南理工宿舍'));if(ps.length){home=pick(ps);egg=true;}}}
  if(!shop||!home)return;const r=rating();const pu=r>=4.8?.35:r>=4.5?.25:r>=3.5?.15:.05;const urgent=Math.random()<pu;
  const pp=player.position;const dist=Math.abs(pp.x-shop.park.x)+Math.abs(pp.z-shop.park.z)+Math.abs(shop.park.x-home.park.x)+Math.abs(shop.park.z-home.park.z);
  const spd=drive==='bike'?6:9.5;const lim=Math.round((dist/spd*2.3+80)*(urgent?.85:1));
  let price=(urgent?300:80)*rMult(r)*coOf().m;const extra=[];if(LIGHTS[lightMode].night){price+=20;extra.push('夜间 +20');}if(rainT>0){price*=1.3;extra.push('雨天 +30%');}if(snowT>0){price*=1.4;extra.push('雪天 +40%');}if(STREAK.mult>1)extra.push(`送达再 ×${STREAK.mult}`);if(boostOrders>0){price+=20;extra.push('冲单 +20');}
  offer={id:++oid,urgent,shop,home,lim,price:Math.round(price),dist:Math.round(dist),food:egg?'一份神秘夜宵':FOODS[shop.name]||'外卖',pers:egg?'大方':pickPers(),extra,ttl:15,egg};
  SFX.ring();$('offer').style.display='block';renderOffer();}
function renderOffer(){const o=offer;if(!o)return;$('ofT').innerHTML=`${o.urgent?'<span class="tag">⚡加急</span>':'<span class="tag n">普通</span>'} 新订单 · ${Math.ceil(o.ttl)}s`;
  $('ofB').innerHTML=`${o.shop.e} <b>${o.shop.name}</b> → 🏢 <b>${o.home.name}</b><br>${o.egg?'👤 顾客：小盖同学 🦩<br>':''}${o.food} · 约 ${o.dist} m · ⏱ ${o.lim}s<br><b style="font-size:19px;color:#ffd34d">🪙 ${o.price}</b>${o.extra.length?` <span style="opacity:.8;font-size:12px">${o.extra.join(' · ')}</span>`:''}`;}
function closeOffer(){offer=null;$('offer').style.display='none';offerT=rnd(20,60);}
$('ofOk').addEventListener('pointerdown',e=>{e.preventDefault();if(!offer)return;const o=offer;orders.push({id:o.id,urgent:o.urgent,shop:o.shop,home:o.home,lim:o.lim,price:o.price,food:o.food,pers:o.pers,egg:o.egg,t:0,phase:'pick',cond:100,viol:0,adj:0,tipPre:0});
  if(boostOrders>0)boostOrders--;SFX.ding();toast(`✅ 抢单成功：去 ${o.shop.name} 取餐`);closeOffer();if(orders.length>=3)unlock('triple');updTarget();});
$('ofNo').addEventListener('pointerdown',e=>{e.preventDefault();closeOffer();});
function curOrder(){return orders[0]||null;}
function tgtOf(o){return o.phase==='pick'?o.shop:o.home;}
function updTarget(){const o=curOrder();if(!o&&freeMode()&&typeof SQ!=='undefined'&&SQ&&SQ.tgt&&!(typeof ERR!=='undefined'&&ERR)){dests=[SQ.tgt];destIdx=0;beacon.position.copy(SQ.tgt);beacon.visible=true;setLabel(SQ.tlabel||'❗ 支线');return;}if(!o&&freeMode()&&typeof ERR!=='undefined'&&ERR){dests=[ERR.p.park];destIdx=0;beacon.position.copy(ERR.p.park);beacon.visible=true;setLabel(ERR.label);return;}if(!o&&freeMode()&&typeof NAVHOME!=='undefined'&&NAVHOME){const hp_=homeP();if(hp_){dests=[hp_.park];destIdx=0;beacon.position.copy(hp_.park);beacon.visible=true;setLabel('🏠 回家');return;}}if(!o||!freeMode()){if(mission&&mission.k==='free')beacon.visible=false;return;}const p=tgtOf(o);dests=[p.park];destIdx=0;beacon.position.copy(p.park);beacon.visible=true;setLabel(o.phase==='pick'?`${p.e} ${p.name} 取餐`:`🏢 ${p.name} 送餐`);}
function nearTarget(){if(!freeMode()||state!=='ride'||v>.6)return null;for(const o of orders){const p=tgtOf(o);if(Math.hypot(p.park.x-player.position.x,p.park.z-player.position.z)<9)return o;}return null;}
// --- walking ---
const bag=new THREE.Group();mesh(new THREE.BoxGeometry(.34,.3,.26),M(0xffc61a,{roughness:.6}),bag);const bh=mesh(new THREE.TorusGeometry(.09,.015,6,16,PI),M(0x333333),bag);bh.position.y=.15;
bag.position.set(.95,.55,0);pel.add(bag);bag.visible=false;
function syncBag(){bag.visible=orders.some(o=>o.phase==='carry');}
function startWalk(o){const isPick=o.phase==='pick';const p=tgtOf(o);state='walk';$('act').style.display='none';
  pel.updateMatrixWorld(true);scene.attach(pel);const p0=pel.position.clone(),q0=pel.quaternion.clone();
  const door=p.door.clone().addScaledVector(p.n,.6);door.y=1.12;
  walk={o,isPick,p,p0,q0,door,ph:'out',t:0,dur:Math.max(1.2,p0.distanceTo(door)/2.6),wait:1.6,ev:null,theta:0};
  if(Math.random()<(isPick?.32:.42))walk.ev=isPick?pick(EV_PICK):pick(EV_DROP);
  if(isPick&&SHOP_EGG[p.name]&&Math.random()<.45)walk.ev=pick(SHOP_EGG[p.name]);
  if(isPick&&Math.random()<.03)walk.ev=pick(RARE_EGG);
  if(!isPick&&p.name.startsWith('海鸥公寓')&&Math.random()<.4)walk.ev=w=>{w.o.cond-=15;w.o.adj-=1;toast('🐦 一只海鸥俯冲下来，叼走了一个鸡腿！',2800);};
  toast(isPick?`🛍️ 下车去 ${p.name} 取餐`:`📦 下车给 ${p.name} 送餐`,1500);}
function faceTo(from,to){const a=Math.atan2(-(to.z-from.z),to.x-from.x);pel.rotation.set(0,a,0);}
function updWalk(dt,t){const w=walk;if(!w)return;if(w.ph==='inside'){intUpdate(dt,t);return;}w.t+=dt;w.theta+=dt*9;
  if(w.ph==='out'||w.ph==='back'){const a=w.ph==='out'?w.p0:w.door,b=w.ph==='out'?w.door:w.p0;const k=Math.min(1,w.t/w.dur);
    pel.position.lerpVectors(a,b,k);pel.position.y=(w.ph==='out'?w.p0.y+(w.door.y-w.p0.y)*Math.min(1,k*3):w.door.y+(w.p0.y-w.door.y)*Math.max(0,k*3-2))+Math.abs(Math.sin(w.theta))*.08;
    faceTo(a,b);pel.rotation.z=Math.sin(w.theta)*.1;updLegs(w.theta);
    if(k>=1){if(w.ph==='out'){w.ph='inside';intEnter(w);return;}if(w.ph==='out'){w.ph='at';w.t=0;faceTo(w.door,w.door.clone().sub(w.p.n));if(w.ev){const ev=w.ev;w.ev=null;ev(w);}}else endWalk();}}
  else if(w.ph==='at'){pel.rotation.z=Math.sin(t*3)*.04;if(w.t>.5&&w.isPick)bag.visible=true;
    if(w.t>=w.wait){if(w.done!==true){w.done=true;if(w.isPick)pickedUp(w.o);else{if(!w.redirect)delivered(w.o);}}w.ph='back';w.t=0;}}}
function endWalk(){lean.attach(pel);pel.position.copy(drive==='car'?PCAR:PC);pel.quaternion.identity();pel.scale.set(1,1,1);walk=null;state='ride';syncBag();updTarget();}
function pickedUp(o){if(wrongPick&&wrongPick.o===o){o.wrong=wrongPick.wrong;wrongPick=null;}o.phase='carry';SFX.ding();toast(`🛍️ 取到「${o.food}」，送往 ${o.home.name}`,2200);orders.sort((a,b)=>(a.phase==='carry'?0:1)-(b.phase==='carry'?0:1)||(a.lim-a.t)-(b.lim-b.t));}
const REV={5:['准时又小心，五星好评！','鹈鹕小哥太可爱了，还会说谢谢 🥹','汤一滴没洒，专业！','下次还点你送的 ❤️'],4:['挺快的，就是有点小磕碰','还不错，给个四星','送到了，辛苦啦'],3:['一般般吧','有点慢，但态度还行','餐有点凉了'],2:['太慢了，面都坨了','包装都破了……','汤洒了一半'],1:['等了一个小时！差评！','餐撒了一地，还闯红灯，投诉！','送错了！！！','再也不点了']};
function delivered(o){const i=orders.indexOf(o);if(i>=0)orders.splice(i,1);
  let s=5;const late=o.t>o.lim;if(late)s-=o.t>o.lim*1.4?2:1;if(o.cond<75)s--;if(o.cond<45)s--;if(o.viol)s--;s+=o.adj;
  if(o.pers==='挑剔')s=s>=5?5:Math.min(s,2);if(o.pers==='好说话')s+=1;if(o.wrong)s=1;s=clamp(Math.round(s),1,5);if(o.egg&&!o.wrong&&s>=3)s=5;
  const sm=streakPay();const pay=Math.round(o.price*(late?.7:1)*sm);if(sm>1)setTimeout(()=>toast(`🔥 连单加倍 ×${sm} 生效`,2000),2200);let tip=o.tipPre;if(s>=4&&Math.random()<(s===5?.55:.25))tip+=Math.round(rnd(5,30)*(o.pers==='大方'?3:1));
  coins+=pay+tip;JOB.n++;JOB.earn+=pay;JOB.tips+=tip;if(o.urgent)JOB.urg++;if(s===5)JOB.five++;JOB.clean=o.viol?0:JOB.clean+1;
  if(o.egg&&s===5){tip+=520;coins+=520;unlock('xiaogai');}const rev=o.egg&&s===5?'小盖同学：谢谢鹈鹕师傅！宿舍楼下见 🦩❤️':pick(REV[s]);JOB.revs.unshift(`${'★'.repeat(s)}${'☆'.repeat(5-s)} ${rev}`);JOB.revs.length=Math.min(JOB.revs.length,8);rateJob(s);saveCoins();
  SFX.win();showReceipt(o,s,pay,tip,rev,late);
  unlock('first');if(JOB.n>=10)unlock('d10');if(JOB.n>=50)unlock('d50');if(JOB.n>=100)unlock('d100');if(o.urgent)unlock('urg');if(JOB.urg>=10)unlock('urg10');if(JOB.five>=10)unlock('five10');
  if(tip>0)unlock('tip');if(JOB.tips>=500)unlock('tip500');if(JOB.earn>=1000)unlock('earn1k');if(JOB.earn>=10000)unlock('earn10k');if(rainT>0)unlock('rain');if(LIGHTS[lightMode].night)unlock('night');
  if(JOB.clean>=10)unlock('clean10');if(drive==='car'&&SAVE.equip.vehicle==='pana')unlock('pana');if(drive==='moto')unlock('moto');if(o.t<o.lim*.5)unlock('fast');if(s===5&&o.pers==='挑剔')unlock('picky');}
function rateJob(s){JOB.r.push(s);if(JOB.r.length>60)JOB.r.shift();if(s<=1){JOB.low++;if(JOB.low>=6)setTimeout(fire,2600);else toast(`⚠️ 收到 1 星差评（${JOB.low}/6），满 6 次将被解雇`,2600);}}
function showReceipt(o,s,pay,tip,rev,late){const e=$('rcpt');e.innerHTML=`<div style="font-size:22px;letter-spacing:2px;color:#ffd34d">${'★'.repeat(s)}<span style="opacity:.35">${'★'.repeat(5-s)}</span></div><div>「${rev}」</div><div style="font-weight:800;margin-top:4px">🪙 +${pay}${late?'（超时 −30%）':''}${tip?` · 💝 小费 +${tip}`:''}</div><div style="font-size:12px;opacity:.75">${o.pers}顾客 · 评分 ${rating().toFixed(2)}</div>`;
  e.style.display='block';clearTimeout(showReceipt.t);showReceipt.t=setTimeout(()=>e.style.display='none',4200);}
function fire(){JOB.fired=true;if(JOB.co!=='闪电跑腿'&&!JOB.black.includes(JOB.co))JOB.black.push(JOB.co);orders.length=0;syncBag();updTarget();closeOffer();saveCoins();unlock('fired');SFX.lose();
  choice('😢 你被解雇了',`${coOf().e} ${JOB.co} 收到你 6 次 1 星差评，已和你解除合作，并把你拉进了黑名单。<br>去「外卖员 → 求职网」投简历，找一家新平台吧。`,[{t:'打开求职网',p:1,f:()=>openJobs('ride')},{t:'先随便骑骑',f:()=>{}}]);}
function cancelOrder(o,why){const i=orders.indexOf(o);if(i<0)return;orders.splice(i,1);JOB.revs.unshift(`★☆☆☆☆ ${why}`);JOB.revs.length=Math.min(JOB.revs.length,8);rateJob(1);saveCoins();SFX.lose();toast(`❌ ${why}（1 星）`,3000);syncBag();updTarget();}
// --- events ---
const EV_PICK=[
 w=>{w.wait+=4;say('老板：马上好，马上好！再等一下下～');},
 w=>{stamina=100;exhausted=false;toast('🥤 老板送了你一瓶冰饮料，体力回满',2600);},
 w=>{w.o.cond-=20;toast('💦 打包盒没扣紧，漏汤了！餐品状态 −20',2600);},
 w=>{choice('🤔 好几份餐长得一样','订单号看不清楚，要不要仔细核对？',[{t:'仔细核对（多等 3 秒）',p:1,f:()=>{w.wait+=3;toast('✅ 核对无误');}},{t:'随手拿一份就走',f:()=>{if(Math.random()<.5)wrongPick={o:w.o,wrong:true};}}]);},
 w=>{w.o.tipPre+=10;toast('😊 老板夸你辛苦，多塞了一个鸡腿（顾客会更开心）',2600);w.o.adj+=.5;}];
const SHOP_EGG={
 '鹈鹕炸鸡':[w=>{coins+=20;saveCoins();toast('🦩 老板也是一只鹈鹕！「同类要互相照顾」，塞给你 🪙20',3000);},w=>{say('老板：放心，我们只炸鸡，从来不炸鹈鹕。');}],
 '老王海鲜':[w=>choice('🦞 小龙虾越狱了！','一只小龙虾从桶里爬出来，正往马路上跑……',[{t:'帮老王抓回来（多等 3 秒）',p:1,f:()=>{w.wait+=3;w.o.tipPre+=15;toast('🦞 抓到了！老王给顾客多送了一份虾',2600);}},{t:'假装没看见',f:()=>{toast('🦞 小龙虾消失在夜色中，自由了',2400);}}]),w=>{say('老王：皮皮虾，我们走！');}],
 '张姐麻辣烫':[w=>choice('🌶️ 张姐：要不要尝一口变态辣？','据说吃完能骑得飞快……',[{t:'来！',f:()=>{boostT=6;stamina=100;exhausted=false;SFX.power();toast('🔥 辣到起飞！6 秒极速冲刺',2600);}},{t:'不了不了',p:1,f:()=>{toast('😅 张姐：年轻人不行啊');}}])],
 '渔港寿司':[w=>{hp=Math.min(100,hp+30);stats.fish++;toast('🍣 师傅偷偷喂了你一片三文鱼，血量 +30',2600);},w=>{say('师傅：鹈鹕先生，您的嘴可以装多少份寿司？');}],
 '阿婆奶茶':[w=>{stamina=100;exhausted=false;toast('🧋 阿婆：小伙子长得真俊，这杯奶茶送你',2600);},w=>{w.wait+=3;say('阿婆：珍珠要现煮的，再等一下哦');}],
 '深夜烧烤':[w=>{if(LIGHTS[lightMode].night){stamina=100;toast('🍢 隔壁桌大哥请你吃了两串，你说要骑车只喝了可乐',2800);}else{w.wait+=4;say('老板还没睡醒：白天来干嘛？晚上八点才开门！');}}],
 '鲜果切':[w=>choice('🍉 你问老板','「这瓜保熟吗？」',[{t:'就问一句',p:1,f:()=>{say('老板：我开水果摊的，能卖你生瓜蛋子？');}},{t:'算了不问了',f:()=>{toast('🍉 老板送你一块西瓜，体力 +30');stamina=Math.min(100,stamina+30);}}])],
 '兰州牛肉面':[w=>{w.wait+=2;w.o.tipPre+=10;toast('🍜 师傅当场表演拉面：一清二白三红四绿五黄！顾客多给了小费',3000);}],
 '小笼包铺':[w=>{w.o.cond=Math.min(100,w.o.cond+10);say('老板：记得告诉顾客，先开窗，后喝汤！');}],
 '汉堡工坊':[w=>{if(Math.random()<.5){coins+=30;saveCoins();toast('🍔 抽中隐藏款「鹈鹕堡」！奖励 🪙30',2800);}else toast('🍔 今天没抽到隐藏款，明天再来试试',2400);}],
 '披萨小站':[w=>{toast('🍕 榴莲披萨味道太冲，路边的鸽子都飞走了',2800);}],
 '金陵盐水鸭':[w=>{say('店里的鸭子看着你：同是水禽，相煎何急！');},w=>{w.o.tipPre+=10;toast('🦆 老板：南京人一天不吃鸭，浑身难受。多送一份鸭胗',2800);}],
 '鸭血粉丝汤':[w=>choice('🥣 老板：香菜要不要？','这是一个严肃的问题。',[{t:'多放香菜',p:1,f:()=>{w.o.adj+=.5;toast('🌿 顾客是香菜爱好者，开心！');}},{t:'不要香菜',f:()=>{toast('🙅 老板默默把香菜挑掉了');}}])],
 '黄焖鸡米饭':[w=>{say('老板：我们是正宗的，全国第 10086 家正宗店！');}],
 '煎饼果子':[w=>choice('🥞 大爷：加俩蛋？','「加俩蛋，倍儿香！」',[{t:'加！（顾客更开心）',p:1,f:()=>{w.o.adj+=.5;w.wait+=2;}},{t:'不加',f:()=>{say('大爷：得嘞！');}}])],
 '海鸥咖啡':[w=>{toast('🐦 店长海鸥对你翻了个白眼，然后偷走了一包糖',2800);w.o.cond-=5;},w=>{stamina=100;exhausted=false;toast('☕ 海鸥店长请你喝了杯冰美式，精神百倍',2600);}]};
const RARE_EGG=[w=>{coins+=88;saveCoins();SFX.win();toast('✨ 老板认出了你：「你就是传说中帅气的作者大大？」送你 🪙88',3600);},
 w=>{toast('🐱 店里的招财猫冲你招了招手……好像真的动了？',3000);},
 w=>{toast('🎵 店里正在放《鹈鹕外卖员之歌》，你忍不住跟着摇摆',2800);}];
const EV_DROP=[
 w=>{choice('🚪 敲门没人应','顾客好像不在家……',[{t:'打电话，等 5 秒',p:1,f:()=>{w.wait+=5;say('顾客：来了来了，马上开门！');}},{t:'放门口拍照走人',f:()=>{if(Math.random()<.5)w.o.adj-=1;}}]);},
 w=>{w.wait+=4;stamina=Math.max(0,stamina-35);say('电梯坏了！爬了 18 楼……');},
 w=>{choice('🛂 保安拦住了你','小区不让外卖进门。',[{t:'登记后进门（多 4 秒）',p:1,f:()=>{w.wait+=4;}},{t:'趁保安不注意溜进去',f:()=>{if(Math.random()<.45){w.o.adj-=2;toast('🚨 被保安抓到了，顾客也被投诉牵连……',2600);}else toast('😎 成功溜进去了');}}]);},
 w=>{stamina=Math.max(0,stamina-10);w.wait=.6;toast('🐕 一只狗冲你狂叫！把餐放下就跑',2400);},
 w=>{w.o.adj+=1;stamina=100;toast('😊 顾客给你倒了杯水，还说「辛苦了」',2600);},
 w=>{const o=w.o;const bi=Math.floor(o.home.ctr.x/B),bj=Math.floor(o.home.ctr.z/B);const ps=poisOfBlock(bi+pick([-1,1]),bj+pick([-1,0,1])).filter(p=>!p.shop);
   if(!ps.length){w.wait+=2;return;}const nh=pick(ps);w.redirect=true;o.home=nh;o.lim+=45;w.wait=1.2;say(`顾客：不好意思地址填错了！送到 ${nh.name}，给你加 10 块小费`);o.tipPre+=10;}];
const EV_RIDE=[
 ()=>{if(drive==='car')return;choice('💥 爆胎了！','车胎被钉子扎破了。',[{t:'花 🪙30 路边补胎',p:1,f:()=>{if(coins>=30){coins-=30;saveCoins();toast('🔧 补好了，继续出发');}else{flatT=40;toast('钱不够，只能慢慢骑……');}}},{t:'凑合慢慢骑（40 秒限速）',f:()=>{flatT=40;}}]);},
 ()=>{if(!orders.length)return;say('顾客：到哪了？快点哦～');},
 ()=>{if(wxMode===0){if(Math.random()<.4)startSnow();else startRain();}},
 ()=>{boostOrders=3;toast('🔥 平台冲单奖励：接下来 3 单每单 +🪙20',3000);},
 ()=>{choice('👛 路边捡到一个钱包','里面有 🪙200 和一张身份证。',[{t:'交给附近交警',p:1,f:()=>{coins+=50;saveCoins();unlock('wallet');toast('👮 交警表扬了你，失主送来 🪙50 感谢费',3000);}},{t:'自己留着',f:()=>{if(Math.random()<.4){coins=Math.max(0,coins-300);saveCoins();SFX.siren();showTicket('<b>👮 失主报警了</b><br>拾得遗失物拒不归还 · 罚款 🪙300');}else{coins+=200;saveCoins();toast('💰 +200……良心有点痛',2600);}}}]);},
 ()=>{if(!orders.some(o=>o.phase==='carry'))return;const o=orders.find(o=>o.phase==='carry');o.tipPre+=15;toast(`💝 ${o.home.name} 的顾客提前打赏了 🪙15`,2600);}];
// --- generic choice popup ---
let choiceResume=null;
function choice(title,html,opts){choiceResume=state==='paused'?resumeState:state;if(state==='ride'||state==='walk'||state==='foot')state='paused';
  $('chT').textContent=title;$('chD').innerHTML=html;const b=$('chB');b.innerHTML='';
  opts.forEach(o=>{const e=document.createElement('button');e.className='pill glass'+(o.p?' primary':'');e.textContent=o.t;e.onclick=()=>{$('choice').style.display='none';if(state==='paused'&&choiceResume)state=choiceResume;o.f();};b.appendChild(e);});
  $('choice').style.display='flex';}
// --- achievements ---
const ACHS=[['first','🛵','第一单','完成第一笔外卖'],['d10','📦','小有名气','累计送达 10 单'],['d50','🏅','老骑手','累计送达 50 单'],['d100','👑','百单王者','累计送达 100 单'],
 ['urg','⚡','加急侠','完成一笔加急单'],['urg10','🚀','闪电侠','完成 10 笔加急单'],['five10','🌟','好评如潮','收到 10 个五星好评'],['picky','🧐','征服挑剔鬼','挑剔顾客给了你五星'],
 ['tip','💝','第一笔小费','收到顾客小费'],['tip500','💰','小费达人','累计小费 🪙500'],['earn1k','💵','月入过千','累计配送收入 🪙1000'],['earn10k','🏦','外卖大亨','累计配送收入 🪙10000'],
 ['fast','⏱️','神速送达','一半时限内送达'],['triple','🎒','三单齐飞','同时背 3 单'],['rain','🌧️','雨中骑士','雨天送达一单'],['night','🌙','夜猫子','夜间送达一单'],
 ['clean10','🚦','模范骑手','连续 10 单零违章'],['moto','🏍️','摩托骑手','骑摩托送达一单'],['pana','🏎️','豪车送外卖','开帕拉梅拉送外卖'],['wallet','👛','拾金不昧','把捡到的钱包交给交警'],['hospital','🚑','缝了 8 针','被送进医院'],['statue','🗿','神像','找到传说中的鹈鹕神像'],['ufo','👽','第三类接触','在 UFO 下面停车'],['pigeon','🕊️','惊鸟','6 秒内按 8 次车铃'],['six','6️⃣','六六大顺','时速保持 66 km/h'],['xiaogai','🦩','宿舍楼下','给小盖同学送一单夜宵'],['fan','📸','网红骑手','和路边粉丝合影'],['rainbow','🌈','雨过天晴','看到雨后彩虹'],
 ['fired','😢','人生低谷','被平台解雇'],['rehire','💼','东山再起','被解雇后找到新工作'],['lic','🪪','持证上岗','考取驾照'],['s2100','💯','科目二满分','科目二考试满分']];
function unlock(id){if(ACH[id])return;const a=ACHS.find(x=>x[0]===id);if(!a)return;ACH[id]=Date.now();coins+=50;saveCoins();
  const e=$('achPop');e.innerHTML=`🏆 成就解锁：${a[1]} ${a[2]} · 🪙+50`;e.style.display='block';clearTimeout(unlock.t);unlock.t=setTimeout(()=>e.style.display='none',3200);}
function renderAch(){const g=$('achGrid');g.innerHTML='';const n=Object.keys(ACH).length;$('achN').textContent=`已解锁 ${n} / ${ACHS.length} · 每个奖励 🪙50`;
  for(const a of ACHS){const d=document.createElement('div');d.className='item'+(ACH[a[0]]?'':' lock');d.innerHTML=`<div style="font-size:30px">${ACH[a[0]]?a[1]:'🔒'}</div><b>${a[2]}</b><div style="font-size:11.5px;opacity:.8">${a[3]}</div>`;g.appendChild(d);}}
$('achBtn').onclick=()=>{$('start').style.display='none';renderAch();$('ach').style.display='flex';};
$('achBack').onclick=()=>{$('ach').style.display='none';showStart();};
// --- job panel & job site ---
let jobFrom='start';
function renderJob(){const r=rating(),c=coOf();
  $('jbS').innerHTML=JOB.fired?`<b style="color:#ff8080">已被 ${JOB.co} 解雇</b> · 去求职网找新工作`:`${c.e} <b>${JOB.co}</b> 骑手 · ${rTier(r)}`;
  $('jbR').innerHTML=`<span style="font-size:30px;color:#ffd34d">★ ${r.toFixed(2)}</span><br>单价倍率 ×${(rMult(r)*c.m).toFixed(2)} · 1 星差评 <b style="color:${JOB.low>=4?'#ff8080':'#fff'}">${JOB.low}/6</b>`;
  $('jbT').innerHTML=['📦 送达 '+JOB.n+' 单','⚡ 加急 '+JOB.urg,'🌟 五星 '+JOB.five,'🪙 收入 '+JOB.earn,'💝 小费 '+JOB.tips].map(s=>`<span class="stat">${s}</span>`).join('');
  $('jbV').innerHTML=JOB.revs.length?JOB.revs.slice(0,5).map(s=>`<div>${s}</div>`).join(''):'<div style="opacity:.7">还没有评价，快去接单吧</div>';}
function openJob(from){jobFrom=from;$(from).style.display='none';renderJob();$('job').style.display='flex';}
$('jobBtn').onclick=()=>openJob('start');
$('jbBack').onclick=()=>{$('job').style.display='none';if(jobFrom==='start')showStart();else $(jobFrom).style.display='flex';};
$('jbJobs').onclick=()=>{$('job').style.display='none';openJobs('job');};
let jobsFrom='job';
const IQ=[['顾客投诉餐洒了，你应该？',['真诚道歉，按平台规则处理','跟顾客吵一架','直接拉黑顾客'],0],['送餐快超时了，路口是红灯，你应该？',['停车等绿灯，再联系顾客说明','冲过去，反正没车','逆行抄近路'],0],
 ['骑电动车送外卖必须？',['佩戴安全头盔','边骑边看手机导航','载人顺路'],0],['顾客不在家，你应该？',['电话联系，按顾客要求放置','直接带走自己吃','扔在楼下'],0],
 ['商家出餐慢，你应该？',['礼貌催单，必要时报备平台','砸柜台','取消订单'],0],['恶劣天气送餐，最重要的是？',['安全第一，慢一点','越快越好','不接任何单'],0]];
function openJobs(from){jobsFrom=from;if(from==='ride'){resumeState='ride';if(state==='ride')state='paused';}else $(from).style.display='none';renderJobs();$('jobs').style.display='flex';}
function renderJobs(){const L=$('jsL');L.innerHTML='';$('jsQ').style.display='none';L.style.display='block';
  $('jsS').innerHTML=JOB.fired?'你目前<b style="color:#ff8080">待业中</b>，投个简历吧':`当前就职：${coOf().e} ${JOB.co}（跳槽会清空当前评分记录）`;
  for(const c of COS){const bl=JOB.black.includes(c.n)&&c.n!=='闪电跑腿',cur=!JOB.fired&&JOB.co===c.n,ok=!c.need||c.need();
    const d=document.createElement('div');d.className='jrow glass';d.innerHTML=`<div style="font-size:30px">${c.e}</div><div style="flex:1;text-align:left"><b>${c.n}</b> · 单价 ×${c.m}<br><span style="font-size:12px;opacity:.8">${c.req}</span></div>`;
    const b=document.createElement('button');b.className='pill glass'+(bl||cur||!ok?'':' primary');b.style.padding='8px 14px';b.textContent=cur?'在职':bl?'已拉黑':!ok?'不符合':'投简历';
    b.onclick=()=>{if(cur)return;if(bl){toast('该平台已把你拉进黑名单');return;}if(!ok){toast(c.req);return;}if(c.dep&&coins<c.dep){toast(`押金不够，需要 🪙${c.dep}`);return;}interview(c);};d.appendChild(b);L.appendChild(d);}}
function interview(c){$('jsL').style.display='none';const Q=$('jsQ');Q.style.display='block';const qs=IQ.slice().sort(()=>Math.random()-.5).slice(0,3);let i=0,ok=0;
  const show=()=>{if(i>=qs.length){const pass=ok>=2;Q.innerHTML=`<h3>${pass?'🎉 面试通过！':'😓 面试没过'}</h3><p>答对 ${ok}/3 题${pass?`，欢迎加入 ${c.e} ${c.n}！`:'，回去再复习一下交规和服务规范吧。'}</p>`;
      if(pass){const was=JOB.fired;if(c.dep){coins-=c.dep;}Object.assign(JOB,{co:c.n,fired:false,low:0,r:[5,5,5,5,5]});saveCoins();if(was)unlock('rehire');SFX.win();}else SFX.lose();
      const b=document.createElement('button');b.className='pill glass primary';b.textContent='好的';b.onclick=renderJobs;Q.appendChild(b);return;}
    const [q,opts,ans]=qs[i];const order=opts.map((o,k)=>k).sort(()=>Math.random()-.5);Q.innerHTML=`<p style="opacity:.8">${c.e} ${c.n} 面试 · 第 ${i+1}/3 题</p><h3>${q}</h3>`;
    for(const k of order){const b=document.createElement('button');b.className='pill glass';b.style.cssText='display:block;width:100%;margin:6px 0';b.textContent=opts[k];b.onclick=()=>{if(k===ans)ok++;i++;show();};Q.appendChild(b);}};show();}
$('jsBack').onclick=()=>{$('jobs').style.display='none';if(jobsFrom==='ride'){if(state==='paused')state=resumeState;}else if(jobsFrom==='job'){renderJob();$('job').style.display='flex';}else showStart();};
// --- per-frame ---
let actO=null;
function delivUpdate(dt){if(!freeMode())return;
  if(state==='ride'||state==='walk'||state==='foot'){for(const o of orders.slice()){o.t+=dt;if(o.t>o.lim*2.2&&!(walk&&walk.o===o))cancelOrder(o,o.phase==='pick'?'超时太久，顾客取消了订单':'超时太久，顾客拒收');}}
  if(state==='ride'){
    if(braking&&v>6)orders.forEach(o=>{if(o.phase==='carry')o.cond-=6*dt;});
    if(flatT>0){flatT-=dt;if(v>5)v-=(v-5)*dt*2;}
    if(!JOB.fired&&!offer&&orders.length<3){offerT-=dt;if(offerT<=0)newOffer();}
    evT-=dt;if(evT<=0){evT=rnd(70,140);pick(EV_RIDE)();}
    const o=nearTarget();if(o!==actO){actO=o;const a=$('act');if(o){a.textContent=o.phase==='pick'?`🛍️ 下车取餐 · ${o.shop.name}`:`📦 下车送餐 · ${o.home.name}`;a.style.display='block';}else a.style.display='none';}}
  else if(actO){actO=null;$('act').style.display='none';}
  if(state==='foot'&&!JOB.fired&&!offer&&orders.length<3){offerT-=dt;if(offerT<=0)newOffer();}
  if(offer&&(state==='ride'||state==='walk'||state==='foot')){offer.ttl-=dt;renderOffer();if(offer.ttl<=0)closeOffer();}}
$('act').addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='ride'||!actO)return;v=0;startWalk(actO);actO=null;});
function delivBump(n){orders.forEach(o=>{if(o.phase==='carry'){o.cond-=n;if(o.cond<40&&!o.spill){o.spill=true;toast('🍜 汤洒出来了！小心点',2200);}}});}
function delivUI(){const o=curOrder();const r=rating();$('mE').textContent='🛵';
  $('mT').textContent=JOB.fired?'待业中 · 去求职网':`${JOB.co} · ★${r.toFixed(2)}`;
  if(!o){$('mP').textContent=JOB.fired?'⚙️ → 回首页 → 外卖员 → 求职网':'🔎 等待派单，先随便骑骑…';}
  else{const left=Math.ceil(o.lim-o.t);$('mP').textContent=(o.phase==='pick'?`🛍️ 去 ${o.shop.name} 取餐`:`📦 送到 ${o.home.name}`)+` · ${left>=0?'⏱ '+left+'s':'⚠️ 超时 '+(-left)+'s'}`+(orders.length>1?` · 共 ${orders.length} 单`:'');}
  $('mS').textContent=`🪙 ${coins}`+(o&&o.phase==='carry'?` · 🍱 ${Math.max(0,Math.round(o.cond))}%`:'')+(rainT>0?' · 🌧️':'')+(flatT>0?' · 🛞爆胎':'')+` · 🪪${LIC.ok?LIC.pts+'分':'吊销'}`;}
const FREE={k:'free',e:'🛵',t:'鹈鹕外卖员',lim:0,win:['收工！'],d:''};

// ===== China-style road segments: 双向四车道 + 非机动车道 + 中央掉头口 =====
const SEGL=B-2*R,RDW=2*RH,UT0=SEGL/2-6,UT1=SEGL/2+6;
const segT=(()=>{const CW=2048,CH=Math.round(CW*RDW/SEGL);return canvasTex(CW,CH,(x,w,h)=>{const sx=w/SEGL,sy=h/RDW;x.clearRect(0,0,w,h);
  const rect=(u0,w0,u1,w1)=>x.fillRect(u0*sx,w0*sy,(u1-u0)*sx,(w1-w0)*sy);
  x.fillStyle='rgba(70,160,90,.32)';rect(0,0,SEGL,2);rect(0,RDW-2,SEGL,RDW);
  x.fillStyle='#f4f4f0';rect(0,1.92,SEGL,2.08);rect(0,RDW-2.08,SEGL,RDW-1.92);
  const dash=(wc,u0,u1)=>{for(let u=u0;u<u1;u+=9)rect(u,wc-.08,Math.min(u+4,u1),wc+.08);};
  dash(5.5,30,SEGL);rect(0,5.42,30,5.58);dash(12.5,0,SEGL-30);rect(SEGL-30,12.42,SEGL,12.58);
  x.fillStyle='#f2c230';rect(0,8.72,UT0,8.88);rect(0,9.12,UT0,9.28);rect(UT1,8.72,SEGL,8.88);rect(UT1,9.12,SEGL,9.28);for(let u=UT0;u<UT1;u+=2)rect(u,8.92,u+1,9.08);
  x.fillStyle='rgba(245,245,240,.95)';
  const draw=(u,wc,dir,fn)=>{x.save();x.translate(u*sx,wc*sy);x.scale(dir*sx,-dir*sy);fn();x.restore();};
  const P=pts=>{x.beginPath();x.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)x.lineTo(pts[i][0],pts[i][1]);x.closePath();x.fill();};
  const straight=()=>{P([[-3,-.15],[1,-.15],[1,-.55],[2.6,0],[1,.55],[1,.15],[-3,.15]]);};
  const turn=s=>()=>{P([[-3,-.15],[.3,-.15],[.3,.15],[-3,.15]]);P([[0,0],[.3,0],[.3,s*1],[0,s*1]].map(p=>[p[0]-.15,p[1]]));P([[-.6,s*1],[.75,s*1],[.08,s*2.1]]);};
  const uturn=()=>{x.lineWidth=.3;x.strokeStyle=x.fillStyle;x.beginPath();x.moveTo(-3,0);x.lineTo(.2,0);x.arc(.2,.65,.65,-PI/2,PI/2);x.lineTo(-.4,1.3);x.stroke();P([[-.4,.75],[-1.6,1.3],[-.4,1.85]]);};
  const both=(a,b)=>()=>{a();b();};
  // bottom lanes travel +u (dir 1), top lanes travel -u (dir -1)
  for(const [dir,uE,uM,uU,wi,wo] of [[1,SEGL-12,22,UT0-6,10.75,14.25],[-1,12,SEGL-22,UT1+6,7.25,3.75]]){
    draw(uE,wi,dir,both(straight,turn(1)));draw(uE,wo,dir,both(straight,turn(-1)));draw(uM,wi,dir,straight);draw(uM,wo,dir,straight);draw(uU,wi+dir*.7,dir,()=>{x.scale(.8,.8);uturn();});}
  x.strokeStyle='rgba(245,245,240,.85)';x.lineWidth=2.2;const bk=(u,wc)=>{const cx=u*sx,cy=wc*sy;x.beginPath();x.arc(cx-9,cy,6,0,7);x.stroke();x.beginPath();x.arc(cx+9,cy,6,0,7);x.stroke();x.beginPath();x.moveTo(cx-9,cy);x.lineTo(cx,cy-8);x.lineTo(cx+9,cy);x.stroke();};
  bk(10,1);bk(SEGL-10,1);bk(10,RDW-1);bk(SEGL-10,RDW-1);});})();
const segM=new THREE.MeshStandardMaterial({map:segT,transparent:true,roughness:.8,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
const segX=[],segZ=[];for(let k=0;k<25;k++){const a=mesh(new THREE.PlaneGeometry(SEGL,RDW),segM,scene);a.rotation.x=-PI/2;a.castShadow=false;segX.push(a);const b=mesh(new THREE.PlaneGeometry(SEGL,RDW),segM,scene);b.rotation.set(-PI/2,0,PI/2);b.castShadow=false;segZ.push(b);}
roadX.concat(roadZ,arrX,arrZ).forEach(m=>m.visible=false);
let segNI=1e9,segNJ=1e9;
function updSegs(ni,nj){if(ni===segNI&&nj===segNJ)return;segNI=ni;segNJ=nj;let k=0;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){segX[k].position.set((ni+a)*B+B/2,.012,(nj+b)*B);segZ[k].position.set((ni+a)*B,.012,(nj+b)*B+B/2);k++;}updSchools(ni,nj);}
function roadInfo(x,z){const nx=Math.round(x/B)*B,nz=Math.round(z/B)*B,rx=x-nx,rz=z-nz;if(Math.abs(rx)<R&&Math.abs(rz)<R)return {inter:true};
  if(Math.abs(rz)<RH)return {ax:0,along:x-Math.floor(x/B)*B,line:nz,lat:rz};if(Math.abs(rx)<RH)return {ax:1,along:z-Math.floor(z/B)*B,line:nx,lat:rx};return {off:true};}
function nearUturn(){const r=roadInfo(player.position.x,player.position.z);return r.along!=null&&Math.abs(r.along-B/2)<8;}

// ===== schools =====
const isSchool=(bi,bj)=>hash(bi*.913+7.7,bj*1.37-2.2)<.09&&(Math.abs(bi)+Math.abs(bj)>1);
const SCHN=['鹈鹕实验小学','海鸥幼儿园','翡翠湖中学','南理工附属小学'];
function inSchool(x,z){const r=roadInfo(x,z);if(r.along==null)return false;if(r.ax===0){const bi=Math.floor(x/B),nj=Math.round(z/B);return isSchool(bi,nj-1)||isSchool(bi,nj);}const bj=Math.floor(z/B),ni=Math.round(x/B);return isSchool(ni-1,bj)||isSchool(ni,bj);}
function textPlane(txt,w,h,bg,fg,font){const t=canvasTex(512,Math.round(512*h/w),(x,cw,ch)=>{if(bg){x.fillStyle=bg;x.fillRect(0,0,cw,ch);}else x.clearRect(0,0,cw,ch);x.fillStyle=fg;x.font=font||`900 ${Math.round(ch*.62)}px sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillText(txt,cw/2,ch/2+2);});
  return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:!bg,toneMapped:false,depthWrite:!!bg}));}
const limitT=canvasTex(128,128,(x)=>{x.fillStyle='#fff';x.beginPath();x.arc(64,64,62,0,7);x.fill();x.lineWidth=14;x.strokeStyle='#d61f1f';x.beginPath();x.arc(64,64,54,0,7);x.stroke();x.fillStyle='#111';x.font='900 56px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('30',64,68);});
const kidT=canvasTex(128,128,(x)=>{x.fillStyle='#f5c400';x.beginPath();x.moveTo(64,6);x.lineTo(124,118);x.lineTo(4,118);x.closePath();x.fill();x.lineWidth=7;x.strokeStyle='#111';x.stroke();x.font='54px sans-serif';x.textAlign='center';x.fillText('🚸',64,92);});
function schoolGroup(){const g=new THREE.Group();const cream=M(0xf3e6cf,{roughness:.8}),orange=M(0xe8743b,{roughness:.7});
  const bld=mesh(new THREE.BoxGeometry(64,15,13),cream,g);bld.position.set(0,7.6,0);for(let f=0;f<3;f++){const s=mesh(new THREE.BoxGeometry(64.2,.5,13.2),orange,g);s.position.set(0,4.5+f*4.5,0);}
  const winM=M(0x7fa6c2,{roughness:.2,metalness:.3});for(let f=0;f<3;f++)for(let i=-6;i<=6;i++){const w=mesh(new THREE.BoxGeometry(2.6,1.8,.1),winM,g);w.position.set(i*4.8,2.6+f*4.5,6.55);}
  const sign=textPlane('鹈鹕实验小学',22,2.4,'#b3261e','#ffe9a8');sign.position.set(0,13.2,6.62);g.add(sign);g.userData.sign=sign;
  for(const s of[-1,1]){const p=mesh(new THREE.BoxGeometry(1.2,4.2,1.2),M(0xb3261e),g);p.position.set(s*5,2.1,12);}const gate=textPlane('欢迎同学们',10.6,1.3,'#b3261e','#fff');gate.position.set(0,3.8,12.62);g.add(gate);
  const track=mesh(new THREE.RingGeometry(14,19,40),M(0xb8452f,{roughness:.95}),g);track.rotation.x=-PI/2;track.scale.set(1.5,1,1);track.position.set(0,.18,-30);track.castShadow=false;
  const field=mesh(new THREE.CircleGeometry(14,40),M(0x3f9a4a,{roughness:1}),g);field.rotation.x=-PI/2;field.scale.set(1.5,1,1);field.position.set(0,.19,-30);field.castShadow=false;
  tube(V(14,0,6),V(14,12,6),.12,.08,M(0xdddddd,{metalness:.6}),g,8);const flag=mesh(new THREE.PlaneGeometry(3,2),M(0xde2910,{side:THREE.DoubleSide,emissive:0x400000}),g);flag.position.set(15.5,11,6);g.userData.flag=flag;
  return g;}
const schools=[];for(let i=0;i<4;i++){const g=schoolGroup();g.visible=false;scene.add(g);schools.push(g);}
const zoneDecals=[],zoneSigns=[];
for(let i=0;i<16;i++){const p=textPlane('学校区域 慢行',8,2.6,null,'rgba(255,240,180,.95)');p.rotation.x=-PI/2;const g=new THREE.Group();g.add(p);g.visible=false;scene.add(g);zoneDecals.push(g);}
for(let i=0;i<16;i++){const g=new THREE.Group();tube(V(0,0,0),V(0,2.9,0),.06,.06,poleM,g,6);const a=new THREE.Mesh(new THREE.CircleGeometry(.5,24),new THREE.MeshBasicMaterial({map:limitT,toneMapped:false}));a.position.set(0,2.55,.07);g.add(a);
  const b=new THREE.Mesh(new THREE.PlaneGeometry(.95,.95),new THREE.MeshBasicMaterial({map:kidT,transparent:true,toneMapped:false}));b.position.set(0,1.6,.07);g.add(b);g.visible=false;scene.add(g);zoneSigns.push(g);}
function updSchools(ni,nj){let s=0,d=0,z=0;const bi0=Math.floor(player.position.x/B),bj0=Math.floor(player.position.z/B);
  for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){const bi=bi0+a,bj=bj0+b;if(!isSchool(bi,bj))continue;
    if(s<schools.length){const g=schools[s++];g.visible=true;g.position.set((bi+.5)*B,0,(bj+1)*B-RH-3.2-12.5);
      const nm=SCHN[Math.floor(hash(bi+.5,bj+.5)*SCHN.length*5)%SCHN.length];if(g.userData.nm!==nm){g.userData.nm=nm;const old=g.userData.sign;g.remove(old);const sg=textPlane(nm,22,2.4,'#b3261e','#ffe9a8');sg.position.copy(old.position);g.add(sg);g.userData.sign=sg;}}
    // adjacent four road segments: decals for each travel direction + signs
    const segs=[[0,(bi+.5)*B,bj*B],[0,(bi+.5)*B,(bj+1)*B],[1,bi*B,(bj+.5)*B],[1,(bi+1)*B,(bj+.5)*B]];
    for(const [ax,cx,cz] of segs)for(const dir of[1,-1]){const f=ax===0?V(dir,0,0):V(0,0,dir),rt=V(-f.z,0,f.x);
      if(d<zoneDecals.length){const g=zoneDecals[d++];g.visible=true;g.position.set(cx-f.x*(SEGL/2-20)+rt.x*3.5,.014,cz-f.z*(SEGL/2-20)+rt.z*3.5);g.rotation.y=Math.atan2(-f.x,-f.z);}
      if(z<zoneSigns.length){const g=zoneSigns[z++];g.visible=true;g.position.set(cx-f.x*(SEGL/2-8)+rt.x*(RH+.8),.16,cz-f.z*(SEGL/2-8)+rt.z*(RH+.8));g.rotation.y=Math.atan2(-f.x,-f.z);}}}
  for(;s<schools.length;s++)schools[s].visible=false;for(;d<zoneDecals.length;d++)zoneDecals[d].visible=false;for(;z<zoneSigns.length;z++)zoneSigns[z].visible=false;}

// ===== pedestrians =====
const SW=RH+1.4,peds=[];const shirtC=[0xe74c3c,0x3498db,0x2ecc71,0xf1c40f,0x9b59b6,0xecf0f1,0x34495e,0xe67e22],skinC=[0xf1c9a5,0xe0b48f,0xc99a72],pantC=[0x2c3e50,0x1f3a5f,0x5d4037,0x333333];
const PG={leg:new THREE.CylinderGeometry(.075,.06,.46,10),shin:new THREE.CylinderGeometry(.062,.052,.44,10),shoe:new THREE.BoxGeometry(.24,.09,.11),
  torso:new THREE.LatheGeometry([[0,-.33],[.17,-.32],[.19,-.2],[.2,0],[.22,.18],[.2,.27],[.12,.32],[0,.33]].map(p=>new THREE.Vector2(p[0],p[1])),16),
  hip:new THREE.CylinderGeometry(.19,.18,.16,14),uarm:new THREE.CylinderGeometry(.058,.05,.32,8),farm:new THREE.CylinderGeometry(.047,.04,.3,8),hand:new THREE.SphereGeometry(.05,10,8),
  neck:new THREE.CylinderGeometry(.055,.06,.1,10),head:new THREE.SphereGeometry(.125,20,16),eye:new THREE.SphereGeometry(.018,8,6),pup:new THREE.SphereGeometry(.009,6,5),nose:new THREE.ConeGeometry(.022,.05,8),
  ear:new THREE.SphereGeometry(.03,8,6),hairS:new THREE.SphereGeometry(.135,18,12,0,PI*2,0,PI*.55),hairL:new THREE.CylinderGeometry(.13,.12,.28,14,1,true,PI*.6,PI*1.8),pony:new THREE.SphereGeometry(.06,10,8),
  cap:new THREE.SphereGeometry(.138,16,10,0,PI*2,0,PI/2),brim:new THREE.BoxGeometry(.14,.015,.2),collar:new THREE.TorusGeometry(.085,.022,6,16),brow:new THREE.BoxGeometry(.01,.012,.045),mouth:new THREE.BoxGeometry(.01,.01,.05),skirt:new THREE.CylinderGeometry(.19,.27,.36,16,1,true)};
const PMC={};const PM=(c,r)=>PMC[c+'_'+(r||.8)]||(PMC[c+'_'+(r||.8)]=M(c,{roughness:r||.8}));
const hairC=[0x1b130d,0x2a1d14,0x4a2f1e,0x6b4a2b,0x8a8a8a,0xc9a26b];
function makePed(kid){const g=new THREE.Group();const sk=PM(pick(skinC),.65),sh=PM(kid?0xffffff:pick(shirtC),.8),pa=PM(kid?0x1f3a8a:pick(pantC),.85),shoe=PM(pick([0x222222,0xffffff,0x6b3e26,0xd04040]),.6);
  const fem=!kid&&Math.random()<.45;const legs=[],arms=[];
  for(const s of[-1,1]){const l=new THREE.Group();l.position.set(0,.9,s*.1);g.add(l);mesh(PG.leg,pa,l).position.y=-.22;const sn=mesh(PG.shin,pa,l);sn.position.y=-.66;const so=mesh(PG.shoe,shoe,l);so.position.set(.05,-.86,0);legs.push(l);
    const a=new THREE.Group();a.position.set(0,1.44,s*.235);g.add(a);mesh(PG.uarm,sh,a).position.y=-.15;const fa=mesh(PG.farm,sk,a);fa.position.y=-.45;mesh(PG.hand,sk,a).position.y=-.62;arms.push(a);}
  mesh(PG.hip,pa,g).position.y=.95;const tor=mesh(PG.torso,sh,g);tor.position.y=1.24;tor.scale.set(.85,1,1.15);
  if(fem&&Math.random()<.5){const sk_=mesh(PG.skirt,pa,g);sk_.position.y=.82;}
  const col=mesh(PG.collar,sh,g);col.rotation.x=PI/2;col.position.y=1.55;mesh(PG.neck,sk,g).position.y=1.6;
  const hd=new THREE.Group();hd.position.y=1.76;g.add(hd);const h=mesh(PG.head,sk,hd);h.scale.set(1,1.08,.95);
  const ey=PM(0xffffff,.3),pu=PM(0x111111,.2),hc=PM(pick(hairC),.7);
  for(const s of[-1,1]){mesh(PG.eye,ey,hd).position.set(.105,.02,s*.045);mesh(PG.pup,pu,hd).position.set(.12,.02,s*.045);mesh(PG.ear,sk,hd).position.set(0,0,s*.125);const b=mesh(PG.brow,hc,hd);b.position.set(.112,.06,s*.045);}
  const no=mesh(PG.nose,sk,hd);no.rotation.z=-PI/2;no.position.set(.13,-.02,0);mesh(PG.mouth,PM(0xa0453a,.6),hd).position.set(.112,-.065,0);
  const style=kid?0:Math.floor(Math.random()*(fem?3:3));
  if(fem){mesh(PG.hairS,hc,hd).position.y=.01;if(style!==1){const hl=mesh(PG.hairL,hc,hd);hl.position.set(-.02,-.12,0);}else{mesh(PG.pony,hc,hd).position.set(-.15,.02,0);}}
  else if(style===2){mesh(PG.cap,PM(pick([0xd32f2f,0x1565c0,0x2e7d32,0x111111]),.7),hd).position.y=.02;const br=mesh(PG.brim,PM(0x222222),hd);br.position.set(.15,.05,0);}
  else{const hs=mesh(PG.hairS,hc,hd);hs.position.set(-.01,.015,0);hs.scale.set(1.02,.95,1.02);}
  if(kid){const bp=mesh(new THREE.BoxGeometry(.22,.34,.32),M(pick([0xe74c3c,0x2e86de,0xff6fb1])),g);bp.position.set(-.24,1.22,0);mesh(PG.cap,PM(0xffd800,.6),hd).position.y=.02;g.scale.setScalar(.66);}
  g.traverse(o=>{if(o.isMesh){o.receiveShadow=false;}});scene.add(g);return {g,legs,arms,kid};}

for(let i=0;i<24;i++){const p=makePed(i%4===0);p.g.visible=false;p.alive=false;peds.push(p);}
function spawnPed(p){const px=player.position.x,pz=player.position.z;
  for(let t=0;t<12;t++){const ax=Math.random()<.5?0:1;const other=ax===0?pz:px,mine=ax===0?px:pz;const c=(Math.round(other/B)+Math.floor(rnd(-1,2)))*B;let a=mine+rnd(-140,140);
    const m=a-Math.round(a/B)*B;if(Math.abs(m)<SW+1)continue;const s=Math.random()<.5?-1:1;const x=ax===0?a:c+s*SW,z=ax===0?c+s*SW:a;const d=Math.hypot(x-px,z-pz);if(d<35||d>160)continue;
    const nearSch=inSchool(ax===0?a:c,ax===0?c:a);if(p.kid&&!nearSch&&Math.random()<.7)continue;
    Object.assign(p,{alive:true,ax,c,s,a,dir:Math.random()<.5?-1:1,st:'walk',t:0,spd:p.kid?rnd(1,1.4):rnd(1.1,1.6),cool:0,fan:Math.random()<.04,fanDone:false});p.nodeA=p.dir>0?Math.ceil(p.a/B)*B:Math.floor(p.a/B)*B;p.g.visible=true;p.g.rotation.set(0,0,0);return;}
  p.alive=false;p.g.visible=false;}
function pedPos(p,out){if(p.ax===0)out.set(p.a,0,p.c+p.s*SW);else out.set(p.c+p.s*SW,0,p.a);return out;}
const pTmp=V();
function pedGap(c,rx,rz){let best=1e9;for(const p of peds){if(!p.alive||(p.st!=='cross'&&p.st!=='down'))continue;pedPos(p,pTmp);const dx=pTmp.x-c.pos.x,dz=pTmp.z-c.pos.z;const f=dx*c.fwd.x+dz*c.fwd.z;if(f<=0||f>35)continue;if(Math.abs(dx*rx+dz*rz)>c.hw+1.6)continue;best=Math.min(best,f-c.hl-2.5);}return best;}
let zebraC=0;
function updPeds(dt,t){if(fieldOn){peds.forEach(p=>p.g.visible=false);return;}zebraC-=dt;const pp=player.position;
  for(const p of peds){if(!p.alive){if(Math.random()<.05)spawnPed(p);continue;}pedPos(p,pTmp);const dist=Math.hypot(pTmp.x-pp.x,pTmp.z-pp.z);if(dist>200){spawnPed(p);continue;}
    p.t+=dt;let moving=false;
    if(p.st==='walk'){p.a+=p.dir*p.spd*dt;moving=true;if(p.dir*(p.nodeA-p.a)<=SW){if(Math.random()<.5){p.st='wait';p.a=p.nodeA-p.dir*SW;}
        else{const na=p.c+p.s*SW;p.s=-p.dir;p.dir=Math.sign(na-p.c)||1;p.c=p.nodeA;p.a=na;p.ax=1-p.ax;p.nodeA=p.dir>0?Math.ceil((p.a+.01)/B)*B:Math.floor((p.a-.01)/B)*B;}}}
    else if(p.st==='wait'){const i=p.ax===0?p.nodeA/B:p.c/B,j=p.ax===0?p.c/B:p.nodeA/B,ax=1-p.ax;if(light(i,j,ax)==='r'&&lightLeft(i,j,ax)>7)p.st='cross';}
    else if(p.st==='cross'){p.a+=p.dir*p.spd*1.15*dt;moving=true;if(p.dir*(p.a-p.nodeA)>=SW){p.st='walk';p.nodeA=p.dir>0?Math.ceil((p.a+.01)/B)*B:Math.floor((p.a-.01)/B)*B;}}
    else if(p.st==='down'){if(p.t>6){p.st='walk';p.g.rotation.set(0,0,0);p.spd*=.6;}}
    pedPos(p,pTmp);p.g.position.set(pTmp.x,p.st==='cross'||p.st==='down'?0:.16,pTmp.z);
    if(p.st!=='down'){const fx=p.ax===0?p.dir:0,fz=p.ax===0?0:p.dir;p.g.rotation.y=Math.atan2(-fz,fx);const sw=moving?Math.sin(p.t*p.spd*5.5)*.55:0;p.legs[0].rotation.z=sw;p.legs[1].rotation.z=-sw;p.arms[0].rotation.z=-sw*.7;p.arms[1].rotation.z=sw*.7;}
    if(state==='ride'&&p.st!=='down'){const hitR=drive==='car'?1.7:drive==='moto'?.95:.7;if(dist<hitR&&v>1.2)hitPed(p,pTmp);
      else if(p.fan&&!p.fanDone&&dist<5&&v<.3){p.fanDone=true;coins+=20;saveCoins();SFX.ding();say('路人：哇，是鹈鹕外卖员！可以合个影吗？📸');toast('📸 和粉丝合影 · 🪙+20',2600);unlock('fan');}}
    if(p.st==='cross'&&drive!=='bike'&&state==='ride'&&v>2&&zebraC<=0&&!exam&&dist<9){const r=roadInfo(pp.x,pp.z);if(r.inter){zebraC=20;ticket('机动车行经人行横道未礼让行人',200,3,0);}}}}
function hitPed(p,pos){p.st='down';p.t=0;p.g.rotation.set(PI/2*(Math.random()<.5?1:-1),p.g.rotation.y,0);p.g.position.y=.15;SFX.crash();SFX.squawk&&SFX.squawk();
  blood(pos.x,pos.z,1.4);const sp=v;v*=.3;delivBump(20);hurt(drive==='bike'?8+sp:3,'撞到行人');
  if(!exam){const motor=drive!=='bike';ticket(p.kid?'撞伤儿童（负全部责任），赔偿医药费':'撞伤行人（负全部责任），赔偿医药费',p.kid?1500:800,0,p.kid?400:200);if(motor){acc.t=5;acc.cool=8;setTimeout(()=>{if(acc.t>0)toast('⚠️ 撞到人了！5 秒内必须停车，否则算肇事逃逸',3000);},4300);}}
  else if(exam.kind===3)examFail('发生交通事故（撞到行人）');}

// ===== v1.3: steal parked cars / chase, snow, chat NPCs, streak multiplier =====
const act2=document.createElement('button');act2.className='glass pill primary';act2.id='act2';document.body.appendChild(act2);
let act2Fn=null,act2Key='';
function setAct2(key,label,fn){if(key===act2Key)return;act2Key=key;act2Fn=fn;if(fn){act2.textContent=label;act2.style.display='block';}else act2.style.display='none';}
act2.addEventListener('pointerdown',e=>{e.preventDefault();initAudio();const f=act2Fn;setAct2('',null,null);if(f)f();});
function labelSprite(txt,bg){const t=canvasTex(256,64,(x,w,h)=>{x.fillStyle=bg;const r=28;x.beginPath();x.moveTo(r,2);x.arcTo(w-2,2,w-2,h-2,r);x.arcTo(w-2,h-2,2,h-2,r);x.arcTo(2,h-2,2,2,r);x.arcTo(2,2,w-2,2,r);x.fill();
  x.fillStyle='#fff';x.font='bold 30px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(txt,w/2,h/2+2);});
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false,toneMapped:false}));s.scale.set(3.2,.8,1);s.renderOrder=9;return s;}
function nearRoadSpot(minD,maxD){const pp=player.position;for(let t=0;t<20;t++){const alongX=Math.random()<.5,side=Math.random()<.5?1:-1;
    const ri=Math.round(pp.x/B)+Math.floor(rnd(-1,2)),rj=Math.round(pp.z/B)+Math.floor(rnd(-1,2));
    const a=(alongX?pp.x:pp.z)+rnd(-maxD,maxD);const m=a-Math.round(a/B)*B;if(Math.abs(m)<RH+14)continue;
    let x,z,h;if(alongX){z=rj*B+side*(RH-1.35);x=a;h=side>0?0:PI;}else{x=ri*B-side*(RH-1.35);z=a;h=side>0?-PI/2:PI/2;}
    const d=Math.hypot(x-pp.x,z-pp.z);if(d<minD||d>maxD)continue;return {x,z,h,alongX,side,c:alongX?rj*B:ri*B};}return null;}
// --- parked cars & stealing ---
const parked=[];let stolen=null,chase=null,stolenKeep=false;
const keyMark=labelSprite('🔑 空闲车辆','rgba(30,150,80,.92)');keyMark.visible=false;scene.add(keyMark);
function spawnParked(){const s=nearRoadSpot(50,170);if(!s)return;if(parked.some(p=>Math.hypot(p.x-s.x,p.z-s.z)<20))return;
  const type=pick(['sedan','bmw','hatch','suv','pana']);const b=buildCar(type);b.g.position.set(s.x,0,s.z);b.g.rotation.y=s.h;scene.add(b.g);parked.push({...s,type,b});}
function dropParked(p){scene.remove(p.b.g);parked.splice(parked.indexOf(p),1);}
// chaser: original owner on your bike
const chaser=new THREE.Group();(function(){const pp=makePed(false);scene.remove(pp.g);pp.g.position.set(0,.35,0);pp.legs.forEach((l,i)=>l.rotation.z=i?-.9:.9);pp.arms.forEach(a=>a.rotation.z=1.1);chaser.add(pp.g);chaser.ped=pp;
  const wm=M(0x222222),fm=M(0xd03a2f,{metalness:.5,roughness:.3});for(const x of[-.55,.55]){const w=new THREE.Mesh(new THREE.TorusGeometry(.34,.05,6,16),wm);w.position.set(x,.36,0);chaser.add(w);}
  const f=new THREE.Mesh(new THREE.BoxGeometry(1.1,.07,.07),fm);f.position.set(0,.62,0);f.rotation.z=.15;chaser.add(f);
  const tag=labelSprite('😡 车主在追你！','rgba(210,40,40,.92)');tag.position.y=2.6;chaser.add(tag);})();chaser.visible=false;scene.add(chaser);
function stealCar(p){if(stolen)return;dropParked(p);stolen=p;stolenKeep=false;
  setModel('pana');pcar.g.visible=false;player.add(p.b.g);p.b.g.position.copy(pcar.g.position);p.b.g.rotation.copy(pcar.g.rotation);p.b.g.scale.copy(pcar.g.scale);
  player.position.set(p.x,0,p.z);heading=p.h;player.rotation.y=heading;v=0;gearMode='D';if(window.updShift)updShift();belt=true;
  chase={t:0,x:p.x+Math.cos(p.h+PI/2)*4,z:p.z-Math.sin(p.h+PI/2)*4,v:0,far:0};chaser.visible=true;chaser.position.set(chase.x,0,chase.z);
  SFX.horn();say('车主：喂！那是我的车！！');}
function releaseStolen(){if(!stolen)return;player.remove(stolen.b.g);stolen=null;stolenKeep=false;applyEquip();}
function endChase(){chase=null;chaser.visible=false;}
function crimeReset(){endChase();releaseStolen();parked.slice().forEach(dropParked);}
function updCrime(dt,t){const pp=player.position;
  if(!freeMode()||fieldOn){parked.forEach(p=>p.b.g.visible=false);keyMark.visible=false;if(chase||stolen)crimeReset();return;}
  parked.forEach(p=>p.b.g.visible=true);
  for(const p of parked.slice())if(Math.hypot(p.x-pp.x,p.z-pp.z)>240)dropParked(p);
  if(parked.length<4&&Math.random()<.02)spawnParked();
  let near=null,nd=1e9;for(const p of parked){const d=Math.hypot(p.x-pp.x,p.z-pp.z);if(d<nd){nd=d;near=p;}}
  keyMark.visible=!!near&&nd<45&&drive==='bike'&&!stolen;if(keyMark.visible)keyMark.position.set(near.x,3.2+Math.sin(t*3)*.15,near.z);
  if(chase&&state!=='paused'){chase.t+=dt;const dx=pp.x-chase.x,dz=pp.z-chase.z,d=Math.hypot(dx,dz);
    if(chase.t<5){chaser.rotation.y=Math.atan2(-dz,dx);const c=Math.ceil(5-chase.t);if(c!==chase.cd){chase.cd=c;toast(`😡 车主正在骑上你的自行车…… ${c} 秒后开追！`,1100);}}
    else{const ct=chase.t-5;if(!chase.go){chase.go=1;SFX.horn();say('车主：站住！别跑！');}
    const top=ct<3?6:11.5+Math.min(3,ct/30);chase.v=Math.min(top,chase.v+6*dt);
    const st=Math.min(d,chase.v*dt);chase.x+=dx/d*st;chase.z+=dz/d*st;chaser.position.set(chase.x,0,chase.z);chaser.rotation.y=Math.atan2(-dz,dx);
    chaser.children.forEach(c=>{if(c.geometry&&c.geometry.type==='TorusGeometry')c.rotation.z-=chase.v*dt*3;});
    if(d<3.2&&(state==='ride'||state==='walk')){coins=Math.max(0,coins-100);saveCoins();SFX.lose();endChase();
      if(state==='walk'){}releaseStolen();say('车主：抓到你了！车还我，再赔 100 块！');toast('🚔 被车主抓到了：车已归还，罚 🪙100',3200);}
    else if(d>200){chase.far+=dt;if(chase.far>2){endChase();stolenKeep=true;SFX.win();toast('😎 甩掉车主了！这辆车今天归你开',3000);}}else chase.far=0;}}
  if(state==='ride'&&!chase&&!stolen&&drive==='bike'&&near&&nd<6&&v<1.2)return {key:'steal'+near.x,label:'🚗 抢这辆空闲的车',fn:()=>stealCar(near)};
  if(state==='ride'&&stolen&&stolenKeep&&v<.5)return {key:'ret',label:'🚲 还车（换回自行车）',fn:()=>{const p=stolen;releaseStolen();p.b.g.position.set(pp.x,0,pp.z);p.b.g.rotation.y=heading;}};
  return null;}
// --- snow ---
const SN=1600,snowG=new THREE.BufferGeometry(),snowP=new Float32Array(SN*3);for(let i=0;i<SN;i++)snowP.set([rnd(-35,35),rnd(0,24),rnd(-35,35)],i*3);
snowG.setAttribute('position',new THREE.BufferAttribute(snowP,3));
const snow=new THREE.Points(snowG,new THREE.PointsMaterial({color:0xffffff,size:.22,transparent:true,opacity:.9,depthWrite:false}));snow.frustumCulled=false;snow.visible=false;scene.add(snow);
let snowT=0,snowFog=null,wxMode=0;
function startSnow(long){if(snowT>0)return;rainT=0;snowT=long?1e9:rnd(70,120);snowFog={far:scene.fog.far,col:scene.fog.color.getHex()};scene.fog.far=Math.min(scene.fog.far,120);scene.fog.color.setHex(0xdfe6ee);
  toast('❄️ 下雪了！路面湿滑，刹车要提前 · 雪天补贴 +40%',3200);}
function stopSnow(){if(snowT<=0&&!snow.visible)return;snowT=0;snow.visible=false;if(snowFog){scene.fog.far=snowFog.far;scene.fog.color.setHex(snowFog.col);snowFog=null;}}
function updSnow(dt){if(snowT<=0){if(snow.visible)stopSnow();return;}snowT-=dt;snow.visible=true;snow.position.set(camera.position.x,0,camera.position.z);const tt=performance.now()/1000;
  for(let i=0;i<SN;i++){let y=snowP[i*3+1]-2.2*dt;if(y<0)y+=24;snowP[i*3+1]=y;snowP[i*3]+=Math.sin(tt*.8+i)*.4*dt;}snowG.attributes.position.needsUpdate=true;
  if(snowT<=0){stopSnow();toast('☀️ 雪停了');}}
// --- chat NPCs ---
const TALKS=[
 ['算命大爷','🔮',()=>{const r=Math.random();if(r<.4){coins+=66;saveCoins();say('大爷：小伙子印堂发亮，今天必有横财！');toast('🔮 大爷说中了，捡到 🪙66',2600);}else if(r<.7)say('大爷：你命里缺单，多接几单就好了。');else say('大爷：算一卦 20 块……开玩笑的，看你是鹈鹕，免费。');}],
 ['南理工学长','🎓',()=>say('学长：悄悄告诉你，设置里输兑换码 NJUST 有惊喜。')],
 ['迷路的游客','🧳',()=>choice('🧳 游客问路','「请问夫子庙怎么走？」',[{t:'热心指路',p:1,f:()=>{coins+=30;saveCoins();toast('🙏 游客塞给你 🪙30 表示感谢',2600);}},{t:'我也是路过的',f:()=>say('游客：好吧……谢谢你')}])],
 ['烤红薯阿姨','🍠',()=>{stamina=100;exhausted=false;hp=Math.min(100,hp+15);toast(snowT>0?'🍠 雪天的烤红薯太香了！体力回满，血量 +15':'🍠 阿姨送你一个烤红薯，体力回满',2800);}],
 ['神秘人','🕶️',()=>choice('🕶️ 神秘人','「你觉得这个游戏的作者帅吗？」',[{t:'帅！宇宙第一帅',p:1,f:()=>{coins+=166;saveCoins();SFX.win();toast('✨ 神秘人满意地点点头，给你 🪙166',2800);}},{t:'一般吧',f:()=>{say('神秘人：……你会后悔的。');stamina=Math.max(0,stamina-30);}}])],
 ['退休交警','👮',()=>say(pick(['老交警：右转可以不看红灯，但要让行人！','老交警：开车一定要系安全带，罚 50 不值当。','老交警：下雪天刹车距离翻倍，慢点开。']))],
 ['小朋友','🧒',()=>{hp=Math.min(100,hp+10);toast('🍬 小朋友送你一颗糖：鹈鹕叔叔加油！血量 +10',2800);}],
 ['网红主播','📱',()=>{coins+=50;saveCoins();say('主播：家人们！真的有鹈鹕送外卖！点点关注！');toast('📱 上了直播，打赏 🪙50',2600);}],
 ['外卖同行','🛵',()=>say('同行：5 分钟内送 3 单，赏金就会加倍，还能一直叠加！')],
 ['环卫工人','🧹',()=>{JOB.r.push(5);if(JOB.r.length>60)JOB.r.shift();toast('🧹 你帮环卫大叔扶起了垃圾桶，口碑 +1 个五星',2800);}],
 ['借钱的骗子','🤥',()=>choice('🤥 陌生人','「兄弟，借我 100 块打车，明天还你！」',[{t:'不借',p:1,f:()=>say('骗子：切，小气……（溜走了）')},{t:'借给他',f:()=>{coins=Math.max(0,coins-100);saveCoins();toast('💸 人跑了，100 块打水漂……',2600);}}])],
 ['彩票摊老板','🎫',()=>choice('🎫 彩票摊','刮刮乐 🪙20 一张，要不要来一张？',[{t:'来一张！',p:1,f:()=>{if(coins<20){toast('钱不够');return;}coins-=20;const r=Math.random();if(r<.02){coins+=5000;SFX.win();toast('🎉🎉 中了头奖 🪙5000！！！',3600);}else if(r<.15){coins+=100;toast('🎫 中了 🪙100',2600);}else toast('🎫 谢谢惠顾',2000);saveCoins();}},{t:'不了',f:()=>{}}])],
 ['鹈鹕粉丝','🦩',()=>{coins+=20;saveCoins();toast('✍️ 给粉丝签了个名，🪙+20',2400);}],
 ['健身教练','💪',()=>{stamina=100;exhausted=false;boostT=5;SFX.power();say('教练：来！冲刺五秒！燃起来！');}],
 ['过马路的老奶奶','👵',()=>choice('👵 老奶奶','「小伙子，能扶我过马路吗？」',[{t:'当然！',p:1,f:()=>{coins+=40;saveCoins();toast('👵 奶奶夸你是好孩子，塞给你 🪙40',2800);}},{t:'在送单，下次吧',f:()=>say('奶奶：那你慢点骑啊')}])],
 ['流浪歌手','🎸',()=>{toast('🎸 他为你唱了一首《鹈鹕外卖员之歌》，你感动得眼眶湿润',3000);stamina=100;}]];
const npcs=[];for(let i=0;i<7;i++){const p=makePed(false);p.g.visible=false;const tag=labelSprite('','rgba(0,0,0,.6)');tag.position.y=2.35;p.g.add(tag);npcs.push({p,tag,alive:false});}
function npcSpawn(n){const s=nearRoadSpot(40,170);if(!s){n.alive=false;return;}const k=Math.floor(Math.random()*TALKS.length);const T=TALKS[k];
  const off=s.alongX?V(0,0,s.side*(SW-RH+1.35)):V(-s.side*(SW-RH+1.35),0,0);const x=s.x+off.x,z=s.z+off.z;
  Object.assign(n,{alive:true,x,z,k,done:false});n.p.g.position.set(x,.16,z);n.p.g.rotation.set(0,Math.atan2(-(s.z-z),(s.x-x)),0);n.p.g.visible=true;
  n.tag.material.map.dispose();n.tag.material.map=labelSprite(`💬 ${T[1]} ${T[0]}`,'rgba(40,110,230,.9)').material.map;n.tag.material.needsUpdate=true;}
function updNpcs(dt,t){const pp=player.position;if(!freeMode()||fieldOn){npcs.forEach(n=>n.p.g.visible=false);return null;}let best=null,bd=1e9;
  for(const n of npcs){if(!n.alive){if(Math.random()<.01)npcSpawn(n);continue;}n.p.g.visible=true;const d=Math.hypot(n.x-pp.x,n.z-pp.z);if(d>230){npcSpawn(n);continue;}
    n.tag.visible=!n.done&&d<70;n.p.arms[1].rotation.z=n.done?0:Math.sin(t*4+n.k)*.6-.6;
    if(!n.done&&d<bd){bd=d;best=n;}}
  if(best&&bd<6.5&&state==='ride'&&v<1.5){const n=best,T=TALKS[n.k];return {key:'npc'+n.x,label:`💬 和${T[0]}聊聊`,fn:()=>{n.done=true;SFX.ding();T[2]();}};}return null;}
// --- delivery streak multiplier ---
const STREAK={list:[],mult:1,last:0};const stEl=document.createElement('div');stEl.id='streak';stEl.className='glass dark';document.body.appendChild(stEl);
function streakPay(){const now=Date.now()/1000;if(now-STREAK.last>300){STREAK.mult=1;STREAK.list=[];}const m=STREAK.mult;STREAK.last=now;STREAK.list=STREAK.list.filter(x=>now-x<=300);STREAK.list.push(now);
  if(STREAK.list.length>=3){const k=Math.round(rnd(1.2,2.0)*10)/10;STREAK.mult=Math.min(50,Math.round(STREAK.mult*k*100)/100);STREAK.list=[];setTimeout(()=>{SFX.power();toast(`🔥 5 分钟连送 3 单！赏金再 ×${k} → 当前 ×${STREAK.mult}`,3400);},2800);}
  return m;}
function updStreak(){const now=Date.now()/1000,left=300-(now-STREAK.last);if(STREAK.mult>1&&left<=0){STREAK.mult=1;STREAK.list=[];toast('⌛ 5 分钟没送单，连单加倍中断了',2600);}
  const show=freeMode()&&(STREAK.mult>1||STREAK.list.length>0)&&left>0;stEl.style.display=show?'block':'none';
  if(show)stEl.textContent=`🔥 ×${STREAK.mult} · 连单 ${STREAK.list.length}/3 · ${Math.floor(left/60)}:${String(Math.floor(left%60)).padStart(2,'0')}`;}
function v13Update(dt,t){const a=updCrime(dt,t);const b=updNpcs(dt,t);updSnow(dt);updStreak();const c=b||a||nearDoor();if(c&&!walk)setAct2(c.key,c.label,c.fn);else setAct2('',null,null);}

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
const THEMES={
 '鹈鹕炸鸡':['#fbe3c4','#e7c48d','#d7a35a',0xffb35a,'fry'],'老王海鲜':['#d7eef7','#bfd8e2','#9fbfcc',0x7fd1ff,'tank'],'张姐麻辣烫':['#ffe0d6','#d9a89a','#c08070',0xff7a5a,'hotpot'],
 '渔港寿司':['#f3ead8','#cbb994','#b29f7a',0xfff2cc,'belt'],'阿婆奶茶':['#fff1e6','#f2d4c2','#e6bba3',0xffc0cb,'tea'],'深夜烧烤':['#3b2f2f','#5a4030','#40302a',0xff6a2a,'grill'],
 '鲜果切':['#eaffea','#c8eac8','#a8d8a8',0xd0ff9a,'fruit'],'兰州牛肉面':['#fff6e0','#e8d5a8','#d6bf8a',0xffe08a,'noodle'],'小笼包铺':['#f6efe2','#d8c8a8','#c0ad88',0xfff0c8,'steam'],
 '汉堡工坊':['#2a2f45','#b0332f','#f5f5f5',0xff4081,'diner'],'披萨小站':['#fff3e0','#c9a27a','#e8d2b8',0xff9a4a,'oven'],'金陵盐水鸭':['#f7efe1','#c8b58e','#b8a37a',0xffe6b0,'duck'],
 '鸭血粉丝汤':['#f4f1ea','#cfc6b4','#bdb39f',0xfff5e0,'soup'],'黄焖鸡米饭':['#fff0d8','#d9b07a','#c49a62',0xffc870,'claypot'],'煎饼果子':['#fffbe8','#d9cfa6','#c9be92',0xffe7a0,'cart'],
 '海鸥咖啡':['#e9e2d8','#6d4c41','#5d4037',0xffd8a8,'cafe']};
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

// ===== v1.5 phone, thief, puzzles, calendar, home, island, reform =====
const modal=document.createElement('div');modal.id='mdl';modal.innerHTML='<div class="glass dark" id="mdlB"><b class="xclose" id="mdlX">✕</b><div id="mdlT"></div><div id="mdlC"></div><div id="mdlO"></div></div>';document.body.appendChild(modal);
let mdlResume=null;function mdlOpen(title,html,opts,noClose){if(!mdlResume){mdlResume=state;if(state!=='menu')state='paused';}$('mdlT').innerHTML=title;$('mdlC').innerHTML=html||'';const O=$('mdlO');O.innerHTML='';
  (opts||[]).forEach(o=>{const b=document.createElement('button');b.className='glass pill'+(o.p?' primary':'');b.innerHTML=o.t;b.onpointerdown=e=>{e.preventDefault();initAudio();o.f();};O.appendChild(b);});$('mdlX').style.display=noClose?'none':'';modal.style.display='flex';}
function mdlClose(){modal.style.display='none';if(mdlResume!=null){if(state==='paused')state=mdlResume;mdlResume=null;}}
$('mdlX').onpointerdown=e=>{e.preventDefault();mdlClose();};
// ---------- calendar ----------
const CAL=Object.assign({day:1,min:8*60,slept:0,warned:0},SAVE.cal||{});SAVE.cal=CAL;const WK=['周一','周二','周三','周四','周五','周六','周日'];
function calStr(){const h=Math.floor(CAL.min/60)%24,m=Math.floor(CAL.min%60);return `${WK[(CAL.day-1)%7]} ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;}
let calLM=-1;function calUpdate(dt){if(!freeMode()||!(state==='ride'||state==='foot'||state==='walk'))return;CAL.min+=dt*2;
  const h=CAL.min/60;const lm=(h>=5.5&&h<10)?3:(h>=10&&h<17)?1:(h>=17&&h<19)?0:2;if(lm!==calLM){calLM=lm;if(lightMode!==lm){lightMode=lm;applyLight();}}
  if(h>=22&&CAL.warned!==CAL.day){CAL.warned=CAL.day;say('🌙 晚上 10 点了！快回家，不然只能睡大街了',3200);}
  if(CAL.min>=24*60){if(INT.on)return;streetSleep();}}
function nextDay(){CAL.day++;CAL.min=7*60;CAL.warned=0;calLM=-1;saveCoins();}
function streetSleep(){if(state==='foot')endFoot();const lost=Math.random()<.35?Math.round(coins*.2):0;coins-=lost;hp=Math.max(10,hp-10);stamina=60;exhausted=false;
  mdlOpen('😴 你在马路边睡了一夜',`凌晨的风好冷……<br>${lost?`醒来发现口袋被翻过，丢了 🪙${lost}`:'还好什么都没丢'}<br><span style="opacity:.8">生命 -10 · 体力只恢复到 60</span>`,[{t:'☀️ 新的一天（7:00）',p:1,f:()=>{mdlClose();nextDay();}}],true);SFX.lose();}
// ---------- home ----------
const HOMEK=SAVE.homeK||null;function homeP(){if(!SAVE.homeK){const c=curPOI.filter(p=>!p.shop);if(!c.length)return null;const d=c.find(p=>p.name.startsWith('南理工宿舍'))||c[0];SAVE.homeK={key:d.key};saveCoins();}
  const K=SAVE.homeK;const kk=K.key.split(',');const ps=poisOfBlock(+kk[0],+kk[1]);return ps.find(p=>p.key===K.key)||null;}
let NAVHOME=false;
function goHome(){const late=CAL.min>=20*60||CAL.min<5*60;const st=state;if(state==='foot')endFoot();
  if(late||CAL.min>=24*60){hp=100;stamina=100;exhausted=false;mdlOpen('🏠 到家了，一觉睡到天亮','洗澡、刷牙、躺平……<br>生命和体力全部回满',[{t:'☀️ 早上 7:00 出门',p:1,f:()=>{mdlClose();nextDay();NAVHOME=false;updTarget();}}],true);SFX.win();}
  else{stamina=100;exhausted=false;CAL.min+=120;mdlOpen('🏠 回家歇了一会儿','喝了口水，体力回满（时间 +2 小时）',[{t:'继续出门',p:1,f:mdlClose}]);NAVHOME=false;updTarget();}}
const homeSign=new THREE.Sprite(new THREE.SpriteMaterial({map:textTex(['🏠 我的家'],'rgba(255,140,60,.95)','#fff',256,72,40),depthTest:true}));homeSign.scale.set(5,1.4,1);scene.add(homeSign);homeSign.visible=false;
function homeSignUpd(){const p=freeMode()?homeP():null;homeSign.visible=!!p&&!INT.on;if(p){homeSign.position.set(p.door.x,p.ht?Math.min(p.ht+3,40):18,p.door.z);}}
// ---------- dynamic island ----------
const cmpE=$('cmp');const islR=document.createElement('div');islR.id='islR';while(cmpE.firstChild)islR.appendChild(cmpE.firstChild);cmpE.appendChild(islR);
const iclk=document.createElement('span');iclk.id='iclk';islR.appendChild(iclk);const isl2=document.createElement('div');isl2.id='isl2';cmpE.appendChild(isl2);cmpE.appendChild($('offer'));
let islLast='';function islUpdate(){const on=state!=='menu'&&!fieldOn;if(!on)return;cmpE.style.display='flex';iclk.textContent=freeMode()?calStr():'';
  let h='';if(CALL)h=islCallHtml();else if(freeMode()&&orders.length){const o=orders[0];const left=Math.ceil(o.lim-o.t);h=`${o.phase==='pick'?`${o.shop.e} 取 ${o.shop.name}`:`🏢 送 ${o.home.name}`} · <b style="color:${left<20?'#ff6b5a':'#7CFC9A'}">${left<=0?`超时 ${-left}s`:`${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`}</b> · 🪙${o.price}${orders.length>1?` · +${orders.length-1}单`:''}`;}
  else if(freeMode()&&ERR){const l=Math.max(0,Math.ceil(ERR.lim-(performance.now()-ERR.t0)/1000));h=`📍 ${ERR.label} · <b style="color:${l<30?'#ff6b5a':'#7CFC9A'}">${Math.floor(l/60)}:${String(l%60).padStart(2,'0')}</b> · 🪙${ERR.reward}`;}else if(freeMode()&&SQ)h=sqHud();else if(freeMode()&&NAVHOME)h='🏠 导航回家';
  if(h!==islLast){islLast=h;isl2.innerHTML=h;isl2.style.display=h?'block':'none';}
  cmpE.classList.toggle('big',!!offer||!!h);cmpE.classList.toggle('calling',!!CALL);cmpE.classList.toggle('xl',!!offer);}
// ---------- phone (v1.7 redesign) ----------
const phoneE=document.createElement('div');phoneE.id='phone';phoneE.innerHTML='<div id="phS"><div id="phNotch"><i></i></div><div id="phBar"><span id="phClk">09:00</span><span class="phSt"><i class="sig"><b></b><b></b><b></b><b></b></i>5G<i class="bat"><b></b></i></span></div><div id="phV"></div><div id="phHome"><i></i></div></div>';document.body.appendChild(phoneE);
let phoneOpen=false,phApp=null,phForCall=false;
const APPS=[['📞','通话','call','#4cd964,#1fa34a'],['💬','短信','sms','#5ef08a,#22b14c'],['🎵','音乐','music','#ff6b8b,#e8304f'],['🎮','小游戏','game','#a78bfa,#6d28d9'],['📦','外卖平台','deliv','#ffc35a,#f08a1c'],['💼','Boss直聘','boss','#5ad1e6,#1b9ab8'],['📅','日历','cal','#ffffff,#dfe6ee'],['🧭','回家导航','nav','#f7d9a0,#c9954a'],['👛','钱包','wallet','#ffe066,#f5b301']];
const AV={'妈妈':['❤️','#ff8fa3'],'室友':['🧢','#7cc4ff'],'站长':['👷','#ffd36b'],'10086':['📶','#9ad7ff'],'驾校教练':['🕶️','#c7b8ff'],'鹈鹕外卖':['🦩','#ffb3c1'],'交警大队':['👮','#8fb3ff'],'陌生号码':['❓','#bbbbbb'],'快递小哥':['📦','#ffcf8a']};
const avOf=n=>AV[n]||['👤','#9aa'];const avH=(n,s)=>`<span class="av" style="background:${avOf(n)[1]};width:${s}px;height:${s}px;font-size:${s*.55}px">${avOf(n)[0]}</span>`;
function phClkUpd(){const e=$('phClk');if(e)e.textContent=freeMode()?calStr().slice(3):new Date().toTimeString().slice(0,5);}
function openPhone(forCall){if(phoneOpen){if(!forCall&&!CALL)phHome();return;}phoneOpen=true;phForCall=!!forCall;phoneE.style.display='block';phoneE.classList.remove('out');void phoneE.offsetWidth;phoneE.classList.add('in');phClkUpd();if(CALL)drawCall();else phHome();SFX.tick(.4);}
function closePhone(){phoneOpen=false;phForCall=false;phoneE.classList.remove('in');phoneE.style.display='none';stopGame();}
$('bPhone').style.display='none';
$('phHome').onpointerdown=e=>{e.preventDefault();if(CALL)return;if(phApp)phHome();else closePhone();};
function wxNow(){const h=Math.floor(CAL.min/60);const night=LIGHTS[lightMode].night;if(snowT>0)return['❄️','小雪',-2];if(rainT>0)return['🌧️','阵雨',17];return night?['🌙','晴',19]:[h<10?'🌤️':'☀️','晴',h<10?21:26];}
function phHome(){phApp=null;stopGame();const w=wxNow();$('phV').innerHTML=`<div class="phW"><div><b>${w[2]}°C</b><span>${w[1]} · ${freeMode()?calStr():'南京'}</span></div><em>${w[0]}</em></div><div class="apps">`+APPS.map(a=>`<div class="app" data-a="${a[2]}">${IMG['app_'+a[2]]?`<div class="aImg"><img src="${IMG['app_'+a[2]]}"></div>`:`<div style="background:linear-gradient(145deg,${a[3]})">${a[0]}</div>`}<span>${a[1]}</span>${a[2]==='sms'&&SMSn?`<i class="dot">${SMSn}</i>`:''}${a[2]==='deliv'&&offer?'<i class="dot">1</i>':''}</div>`).join('')+'</div><div class="phWarn">⚠️ 玩手机时小心车被偷</div>';
  $('phV').querySelectorAll('.app').forEach(e=>e.onpointerdown=ev=>{ev.preventDefault();openApp(e.dataset.a);});}
function phHead(t,back=true){return `<div class="phT">${back?'<i class="bk">‹</i>':''}${t}</div>`;}
function bindBack(){const b=$('phV').querySelector('.bk');if(b)b.onpointerdown=e=>{e.preventDefault();phHome();};}
function phList(title,items){$('phV').innerHTML=phHead(title)+items.map((it,i)=>`<div class="phI" data-i="${i}">${it[0]}</div>`).join('');bindBack();$('phV').querySelectorAll('.phI').forEach(e=>e.onpointerdown=ev=>{ev.preventDefault();const f=items[+e.dataset.i][1];f&&f();});}
const SMS=[];let SMSn=0;function sms(from,t){SMS.unshift([from,t,freeMode()?calStr():'',1]);SMSn++;if(SMS.length>20)SMS.pop();}
sms('鹈鹕外卖','欢迎上线！今天也要注意安全哦');sms('妈妈','儿子吃饭了吗？别太累');sms('室友','回来帮我带份烧烤 🍢');
const CALLS={'妈妈':[['喂？妈～','我'],['吃饭了没？钱够不够花？我给你转了点','妈妈'],['够的够的，你也注意身体','我']],'室友':[['喂？','我'],['你今晚回不回宿舍啊？11 点阿姨锁门','室友'],['回，给你带烧烤','我']],'站长':[['站长好','我'],['今天单量大，跑起来！跑满 10 单有奖励','站长']],'10086':[['……','我'],['您好，您的流量已用完，请及时充值','10086']],'驾校教练':[['教练好','我'],['科目二练得怎么样？别压线！','驾校教练']]};
Object.assign(AV,{'阿强':['🤪','#ffb26b'],'医院':['🏥','#9fe0ff'],'鹈鹕总部':['🦩','#ff9fb8'],'外星人':['👽','#9dff9d'],'前任':['💔','#ff9aa9'],'平行宇宙的你':['🌀','#b59cff'],'顾客':['🙋','#ffd9a0'],'奶茶店老板娘':['🧋','#e8c39e'],'幸运抽奖':['🎁','#ffe27a']});
// 20 种来电（emer = 紧急，必须停车接）
const J_STATION={to:'station',label:'🦩 外卖总站',lim:160,reward:80,done:'📦 签收完急单，站长奖励'};
const CALLDB=[
 {n:'站长',emer:1,l:['小盖！马上来趟外卖总站，有批急单要你签收！'],miss:['🚨 漏接站长电话，被扣 🪙30',-30],ch:[
  {t:'好的站长，我这就过去！',r:['好小伙，快点！'],e:{j:J_STATION}},
  {t:'站长我在送单，晚点行吗？',r:['……行吧，那这批给别人了','下次积极点啊'],e:{m:'😐 站长有点失望',c:-10}},
  {t:'站长你声音好像感冒了？',r:['咳咳……你还挺细心','急单我先让别人签，你注意安全','给你发个关心红包'],e:{m:'🧧 站长被你暖到了',c:20}}]},
 {n:'妈妈',emer:1,l:['儿子……妈妈发烧了，有点难受……'],miss:['😢 没接到妈妈电话……心里很不是滋味',0],ch:[
  {t:'妈你别动，我马上回家！',r:['路上慢点，别着急……'],e:{j:{to:'home',label:'🏠 回家看妈妈',lim:240,reward:100,done:'❤️ 给妈妈买了药，妈妈好多了，塞给你'}}},
  {t:'我给你点个外卖药送过去！',r:['好……你也别太累'],e:{c:-25,m:'💊 下单了退烧药 🪙-25，妈妈说好多了',s:['妈妈','药收到了，喝了热水好多了 ❤️']}},
  {t:'我叫爸爸先回去照顾你',r:['你爸早就回来啦，在给我熬粥呢','妈就是想听听你声音'],e:{m:'🥣 原来爸爸在家，妈妈只是想你了',s:['妈妈','有空回家吃饭']}}]},
 {n:'交警大队',emer:1,l:['您好，这里是交警大队，需要核实一起事故的目击信息'],miss:['👮 未接交警电话，被记录一次 🪙-20',-20],ch:[
  {t:'我当时就在路口，看得很清楚',r:['太好了，请详细描述一下','……感谢配合，见义勇为奖励已发放'],e:{c:60,m:'👮 配合调查，获得奖励 🪙60'}},
  {t:'我什么都没看见……',r:['好的，打扰了'],e:{m:'👮 交警挂了电话'}},
  {t:'我还拍了行车记录视频！',r:['太关键了！请发到我们邮箱','这次奖励翻倍'],e:{c:120,m:'📹 关键证据！奖励 🪙120'}}]},
 {n:'站长',emer:1,l:['紧急！刚才有个顾客投诉餐洒了！'],miss:['🚨 漏接站长紧急电话，被罚 🪙30',-30],ch:[
  {t:'我马上联系顾客道歉赔偿',r:['处理得好，平台给你补贴'],e:{c:40,m:'🚨 处理及时，补贴 🪙40'}},
  {t:'不是我洒的，是路上颠的',r:['……这理由顾客不会接受的','罚款照扣'],e:{c:-30,m:'😓 甩锅失败 🪙-30'}},
  {t:'我自掏腰包再送一份',r:['顾客感动得给你五星好评！'],e:{c:-15,m:'⭐ 顾客改成了五星好评',rate:.05}}]},
 {n:'室友',emer:1,l:['快回来！！宿舍冒烟了！！'],miss:['😅 室友：算了，烟已经散了',0],ch:[
  {t:'什么？！我马上回去！',r:['……等等，没事','我泡面忘关电磁炉了，哈哈虚惊一场','请你喝奶茶赔罪'],e:{c:15,m:'😅 虚惊一场，室友请你喝奶茶 🪙15'}},
  {t:'快打 119！别管东西先跑！',r:['冷静……是泡面糊了','你真靠谱，回头请你吃饭'],e:{c:10,m:'👍 室友夸你冷静靠谱'}},
  {t:'又是你煮泡面了吧？',r:['……你怎么知道的','行吧行吧，被你识破了'],e:{c:5,m:'🕵️ 一眼识破 🪙5'}}]},
 {n:'医院',emer:1,l:['您好，请问是张先生的家属吗？'],miss:['🏥 一个陌生的医院号码，没接到',0],ch:[
  {t:'不是，你们打错了',r:['啊抱歉抱歉！'],e:{m:'🏥 原来是打错了……'}},
  {t:'张先生？他怎么了？',r:['您是家属？……啊不是','那抱歉打扰了，谢谢您的关心'],e:{m:'🏥 好心的鹈鹕'}},
  {t:'我帮你们查一下他的电话吧',r:['太感谢了！您真是好人','我们会给您写感谢信'],e:{c:30,m:'💌 医院寄来感谢信和慰问 🪙30'}}]},
 {n:'鹈鹕总部',emer:1,l:['恭喜！你被评为本周「最佳鹈鹕骑手」！'],miss:['🏆 没接总部电话，奖项给了别人……',0],ch:[
  {t:'真的吗？我马上来领奖！',r:['请立刻到外卖总站领奖，过时作废哦'],e:{j:{to:'station',label:'🏆 总站领奖',lim:180,reward:150,done:'🏆 领到「最佳鹈鹕骑手」奖金'}}},
  {t:'不会是诈骗吧？',r:['……我们是官方号码','算了，奖金直接打你钱包里，少一半'],e:{c:60,m:'🏆 奖金直接到账 🪙60'}},
  {t:'能把奖让给我室友吗？',r:['你人也太好了吧','那就两个人都有奖！'],e:{c:100,m:'🤝 总部被感动，你和室友都拿奖 🪙100'}}]},
 {n:'阿强',l:['兄弟！你中了五百万！'],ch:[
  {t:'真的假的？！',r:['假的哈哈哈哈，逗你玩儿呢'],e:{m:'🤪 被兄弟耍了……'}},
  {t:'那先还我上次借你的 50',r:['……信号不好嘟嘟嘟','（转账 50）'],e:{c:50,m:'💸 阿强心虚，还了你 🪙50'}},
  {t:'太好了！请我吃饭！',r:['呃……我开玩笑的','好吧好吧，请你一顿烧烤'],e:{st:30,m:'🍢 阿强请你撸串，体力 +30'}}]},
 {n:'阿强',l:['猜猜我是谁～'],ch:[
  {t:'阿强你变声器没关',r:['切，没意思'],e:{c:5,m:'🤪 识破变声器 🪙5'}},
  {t:'是……秦始皇？',r:['大胆！朕……噗哈哈哈','兄弟你太逗了'],e:{m:'😂 两个人笑了五分钟'}},
  {t:'你是我爸爸？',r:['？？？','……我挂了'],e:{m:'📵 阿强被你噎住了'}}]},
 {n:'妈妈',l:['在忙吗？天冷了，多穿点衣服'],ch:[
  {t:'知道啦妈，你也是',r:['乖，给你转点零花钱'],e:{give:30}},
  {t:'妈我在送外卖，挺好的',r:['我儿子真能干！','别太拼，钱够花吗？'],e:{give:50}},
  {t:'妈，我想你了',r:['……傻孩子','妈也想你，周末回来吃红烧肉'],e:{give:20,st:20,m:'❤️ 心里暖暖的，体力 +20'}}]},
 {n:'室友',l:['回来帮我带份夜宵呗，钱我转你'],ch:[
  {t:'行，顺路给你带',r:['爱你兄弟！'],e:{j:{to:'shop',label:'🍢 给室友带夜宵',lim:200,reward:25,done:'🍢 夜宵买好了，室友转你'}}},
  {t:'跑腿费 20，不讲价',r:['……你掉钱眼里了','行行行，转你'],e:{j:{to:'shop',label:'🍢 给室友带夜宵（加价版）',lim:180,reward:45,done:'🍢 夜宵送到，室友咬牙转你'}}},
  {t:'减肥吧兄弟',r:['……扎心了','那我睡觉了'],e:{m:'🫠 室友决定减肥'}}]},
 {n:'10086',l:['尊敬的用户，您本月套餐可升级为 5G 畅享版……'],ch:[
  {t:'不用了谢谢',r:['好的，祝您生活愉快'],e:{}},
  {t:'有没有送流量的活动？',r:['有的！为您赠送 1GB 夜间流量'],e:{m:'📶 白嫖 1GB 夜间流量'}},
  {t:'你们能听到鹈鹕叫吗？嘎！',r:['……先生请不要恶作剧'],e:{m:'🦩 客服沉默了'}}]},
 {n:'陌生号码',l:['您好，请问需要贷款吗？无抵押秒到账'],ch:[
  {t:'不需要，谢谢',r:['好的打扰了'],e:{}},
  {t:'我需要贷五百万买鱼',r:['……先生您征信需要……','嘟嘟嘟'],e:{m:'🐟 推销员被你吓跑了'}},
  {t:'我要举报你',r:['别别别！','（对方慌忙挂断）'],e:{c:10,m:'🛡️ 反诈先锋 🪙10'}}]},
 {n:'快递小哥',l:['你的快递放驿站了哈，记得取'],ch:[
  {t:'好的谢谢',r:['不客气'],e:{}},
  {t:'能帮我送上楼吗？',r:['今天太忙啦','下次一定！'],e:{}},
  {t:'辛苦了，给你点杯奶茶',r:['哎呀太客气了！','以后你的件我优先送！'],e:{c:-15,m:'🧋 请快递小哥喝奶茶 🪙-15，人缘 +1'}}]},
 {n:'驾校教练',l:['明天练车别迟到，记得带身份证'],ch:[
  {t:'收到教练',r:['好好练，争取一把过'],e:{}},
  {t:'教练我能骑鹈鹕去吗？',r:['……驾校不收鹈鹕','但你可以试试'],e:{m:'🦩 教练陷入沉思'}},
  {t:'教练，科目二有什么技巧？',r:['倒车入库看后视镜','压线就挂，记住了'],e:{m:'📝 学到了科目二技巧'}}]},
 {n:'外星人',l:['滋……地球人……你的鹈鹕……很可爱……'],ch:[
  {t:'？？？你是谁',r:['滋……我们会再联系……嘟嘟嘟'],e:{m:'👽 你收到了一通来自宇宙的电话'}},
  {t:'可以带我去你们星球吗？',r:['滋……你的外卖……送完再说……'],e:{m:'🛸 外星人也催单'}},
  {t:'嘎嘎嘎（鹈鹕语）',r:['滋……原来你会说鹈鹕语……','送你一点宇宙金币'],e:{c:42,m:'👽 外星人送你宇宙金币 🪙42'}}]},
 {n:'前任',l:['在吗？'],ch:[
  {t:'……有事吗',r:['没事，打错了'],e:{m:'💔 ……'}},
  {t:'不在，我在送外卖',r:['……你还是这么忙','好好照顾自己'],e:{m:'🌙 有点惆怅'}},
  {t:'拉黑',r:[],e:{st:10,m:'😎 拉黑！神清气爽，体力 +10'}}]},
 {n:'平行宇宙的你',l:['喂，我是平行宇宙的你，我那边鹈鹕会开飞机'],ch:[
  {t:'那你送外卖快吗？',r:['快，但老被罚超速……'],e:{c:1,m:'🌀 宇宙也有交规 🪙1'}},
  {t:'给我透露下彩票号码',r:['不行，会破坏时空','……不过可以给你点零花钱'],e:{c:88,m:'🌀 平行宇宙转账 🪙88'}},
  {t:'你那边我谈恋爱了吗？',r:['……这个嘛','你还是专心送外卖吧'],e:{m:'🌀 平行的自己也单身'}}]},
 {n:'奶茶店老板娘',l:['小伙子，你上次落了件外套在我店里'],ch:[
  {t:'谢谢！我马上去拿',r:['好嘞，给你留着'],e:{j:{to:'shop',label:'🧥 去奶茶店拿外套',lim:220,reward:20,done:'🧥 拿回外套，老板娘还送了杯奶茶，省下'}}},
  {t:'送给你家狗狗当窝吧',r:['哈哈哈它确实很喜欢','那请你喝杯奶茶'],e:{st:20,m:'🧋 老板娘请你喝奶茶，体力 +20'}},
  {t:'那不是我的外套',r:['啊？那是谁的……','算了我再找找'],e:{m:'🧥 外套之谜……'}}]},
 {n:'幸运抽奖',l:['恭喜您成为鹈鹕外卖第 10000 位幸运骑手！'],ch:[
  {t:'不会是诈骗吧？',r:['不是！奖励已直接发到钱包～'],e:{c:20,m:'🎁 真的到账了 🪙20'}},
  {t:'我要选神秘大奖！',r:['好的……正在抽取……'],e:{rnd:[[150,'🎰 神秘大奖：🪙150！'],[-10,'🎰 神秘大奖：一张谢谢惠顾（手续费 🪙-10）'],[50,'🎰 神秘大奖：🪙50']]}},
  {t:'把奖品捐给流浪猫',r:['您真善良！','我们额外奖励您'],e:{c:30,m:'🐱 爱心捐赠，平台奖励 🪙30'}}]}];

var ERR=null;
function errPOI(to){if(to==='home')return homeP();const pp=player.position;const c=curPOI.filter(p=>to==='shop'?p.shop:p.shop&&p.park.distanceTo(pp)>60).sort((a,b)=>a.park.distanceTo(pp)-b.park.distanceTo(pp));if(!c.length)return null;return to==='station'?c[Math.min(c.length-1,3+Math.floor(Math.random()*4))]:c[Math.min(c.length-1,Math.floor(Math.random()*3))];}
function startErr(j){if(!freeMode()){toast('（自由跑单模式下才会有跑腿任务）',1600);return;}const p=errPOI(j.to);if(!p)return;ERR={p,label:j.to==='station'?`${j.label}（${p.name}旁）`:j.to==='shop'?`${j.label}（${p.name}）`:j.label,lim:j.lim,t0:performance.now(),reward:j.reward,done:j.done};
  toast(`📍 新任务：${ERR.label} · 限时 ${Math.round(j.lim/60*10)/10} 分钟`,2600);updTarget();}
function errTick(){if(!ERR)return;const left=ERR.lim-(performance.now()-ERR.t0)/1000;const q=padOn?pel.getWorldPosition(new THREE.Vector3()):player.position;
  if(Math.hypot(q.x-ERR.p.park.x,q.z-ERR.p.park.z)<11||INT.on&&ERR.p===homeP()&&false){coins+=ERR.reward;saveCoins();SFX.win&&SFX.win();toast(`${ERR.done} 🪙${ERR.reward}`,2800);ERR=null;beacon.visible=false;updTarget();return;}
  if(left<=0){toast(`⌛ 没赶上：${ERR.label}`,2400);ERR=null;beacon.visible=false;updTarget();}}
var CALL=null;
function ringStart(emer){if(CALL||state==='menu')return;const pool=CALLDB.filter(c=>!!c.emer===!!emer&&!(c.job&&!freeMode())&&!(c.job&&ERR));const src=pick(pool.length?pool:CALLDB.filter(c=>!c.job));CALL={st:'ring',dir:'in',emer:!!emer,n:src.n,src,L:normL(src.l,src.n),t0:performance.now(),ringMax:emer?22:12,li:0,lt:0};SFX.ring&&SFX.ring();toast(emer?'🚨 紧急来电！必须停车接听':'📞 有来电',1500);islLast=null;if(phoneOpen)drawCall();}
function callOut(n){if(CALL)return;CALL={st:'dial',dir:'out',emer:false,n,src:{n,l:CALLS[n]},L:normL(CALLS[n],n),t0:performance.now(),li:0,lt:0};drawCall();}
function canAnswer(){return !CALL.emer||padOn||Math.abs(v)<.4;}
function answer(){if(!CALL||CALL.st!=='ring')return;if(!canAnswer()){toast('🚨 紧急电话必须停车接听！先刹车停稳',1800);SFX.tick(.1);return;}
  if(!padOn&&Math.abs(v)>1&&!CALL.emer)ticket(drive==='bike'?'骑车时接打手持电话':'驾驶时接打手持电话',200,3,20);else if(!padOn)toast('🅿️ 停车接电话，安全第一 👍',1600);
  CALL.st='talk';CALL.t0=performance.now();CALL.lt=0;SFX.tick(.3);islLast=null;if(phoneOpen)drawCall();}
function normL(a,n){return (a||[]).map(x=>Array.isArray(x)?x:[x,n]);}
function callFx(e,c){if(!e)return;const T=[];if(e.j)startErr(e.j);if(e.c){coins=Math.max(0,coins+e.c);}if(e.st){stamina=Math.min(100,stamina+e.st);}
  if(e.give){if(SAVE.momDay!==CAL.day){SAVE.momDay=CAL.day;coins+=e.give;T.push(`💰 ${c.n}转账 🪙${e.give}`);}else T.push(`💬 ${c.n}：今天已经给过你零花钱啦`);}
  if(e.rate&&JOB&&Array.isArray(JOB.r)){JOB.r.push(5);}if(e.rnd){const r=pick(e.rnd);coins=Math.max(0,coins+r[0]);T.push(r[1]);}
  if(e.m)T.unshift(e.m);if(e.s)setTimeout(()=>sms(e.s[0],e.s[1]),2500);saveCoins();if(T.length)toast(T.join(' · '),2800);if(e.c>0||e.give||e.rnd)SFX.win&&SFX.win();}
function chooseCall(i){const c=CALL;if(!c||!c.wait||!c.src.ch)return;const o=c.src.ch[i];if(!o)return;c.pick=o;c.wait=false;c.L=c.L.concat([[o.t,'我']],normL(o.r,c.n));c.lt=(performance.now()-c.t0)/1000-1.8;SFX.tick(.3);chHide();if(phoneOpen)drawCall();islLast=null;}
const chE=document.createElement('div');chE.id='callCh';document.body.appendChild(chE);
chE.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-ch]');if(!b)return;e.preventDefault();e.stopPropagation();chooseCall(+b.dataset.ch);},true);
function chShow(){const c=CALL;if(!c||!c.wait)return chHide();if(phoneOpen){chE.style.display='none';return;}if(chE.dataset.k!==c.n+c.li){chE.dataset.k=c.n+c.li;chE.innerHTML=`<div class="chT">📞 ${c.n}：「${(c.L[c.L.length-1]||[''])[0]}」<br><small>你要怎么回答？</small></div>`+c.src.ch.map((o,i)=>`<button data-ch="${i}"><b>${'ABC'[i]}</b>${o.t}</button>`).join('');}chE.style.display='flex';}
function chHide(){chE.style.display='none';chE.dataset.k='';}
function hang(missed){if(!CALL)return;const c=CALL;CALL=null;islLast=null;chHide();
  if(c.dir==='in'){if(c.pick)callFx(c.pick.e,c);
    else if(c.st==='ring'||c.st==='talk'&&c.emer){if(c.emer){const ms=c.src.miss||['🚨 漏接紧急电话',0];toast(ms[0],2600);coins=Math.max(0,coins+ms[1]);saveCoins();sms(c.n,'刚才打你电话怎么没接？急事！');}else sms(c.n,missed?'[未接来电] 有空回个电话':'刚才怎么挂了？');}
    else if(c.st==='talk')sms(c.n,'话没说完你怎么挂了？');}
  else if(c.n==='妈妈'&&c.li>=c.L.length&&SAVE.momDay!==CAL.day){SAVE.momDay=CAL.day;coins+=50;saveCoins();toast('💰 妈妈转账 🪙50',2000);sms('妈妈','转了 50，别饿着');}
  if(phoneOpen){if(phForCall&&!padOn)closePhone();else{phForCall=false;phHome();}}}
const mmss=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function drawCall(){if(!CALL||!phoneOpen)return;phApp='callscr';const c=CALL;const el=(performance.now()-c.t0)/1000;let sub,btn;
  if(c.st==='ring'){sub=c.emer?'<b class="emer">🚨 紧急来电 · 必须停车接听</b>':'来电 · 手机';const ok=canAnswer();btn=`<div class="cBtns"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>拒绝</span></div><div><button class="cb im green${ok?' pulse':' dis'}" data-c="ok">${PHI()}</button><span>${ok?'接听':'请先停车'}</span></div></div>`;}
  else if(c.st==='dial'){sub='正在呼叫…';btn=`<div class="cBtns one"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>挂断</span></div></div>`;}
  else if(c.wait){sub=`通话中 ${mmss(el)} · 请选择回答`;btn=`<div class="cCh">${c.src.ch.map((o,i)=>`<button data-ch="${i}"><b>${'ABC'[i]}</b>${o.t}</button>`).join('')}</div><div class="cBtns one"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>挂断</span></div></div>`;}
  else{sub=`通话中 ${mmss(el)}`;btn=`<div class="cOps"><div><i>🔇</i><span>静音</span></div><div><i>⌨️</i><span>键盘</span></div><div><i>🔊</i><span>免提</span></div></div><div class="cBtns one"><div><button class="cb red im" data-c="no">${PHI('r')}</button><span>挂断</span></div></div>`;}
  const tr=c.st==='talk'?`<div class="cTr">${c.L.slice(0,c.li).map((x,i)=>`<p class="${x[1]==='我'?'me':''}${i===c.li-1&&c.lastDrawn!==c.li?' nw':''}">${x[0].replace(/^[^：]+：/,'')}</p>`).join('')}</div>`:'<div class="cTr"></div>';
  $('phV').innerHTML=`<div class="callS${c.emer?' e':''}"><div class="cTop">${avH(c.n,c.st==='talk'?46:70)}<h3>${c.n}</h3><div class="cSub">${sub}</div></div>${tr}${btn}</div>`;
  $('phV').querySelectorAll('[data-c]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();if(b.dataset.c==='ok')answer();else hang(false);});$('phV').querySelectorAll('[data-ch]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();e.stopPropagation();chooseCall(+b.dataset.ch);});const t=$('phV').querySelector('.cTr');if(t)t.scrollTop=1e4;c.lastDrawn=c.li;}
let callSig='';setInterval(()=>{phClkUpd();errTick();if(!CALL)return;const c=CALL;const el=(performance.now()-c.t0)/1000;
  if(c.st==='ring'){if(el>c.ringMax){hang(true);return;}if(Math.floor(el*10)%14===0)SFX.ring&&SFX.ring();}
  if(c.st==='dial'&&el>2.2){c.st='talk';c.t0=performance.now();c.lt=0;}
  if(c.st==='talk'){if(c.wait){if(el-c.lt>16)chooseCall(Math.floor(Math.random()*3));}else if(el-c.lt>(c.li?2.6:.6)&&c.li<c.L.length){const x=c.L[c.li];c.li++;c.lt=el;if(!phoneOpen)say(x[1]==='我'?`我：${x[0]}`:`${c.n}：${x[0].replace(/^[^：]+：/,'')}`,2400);}
    else if(c.li>=c.L.length&&el-c.lt>(c.src.ch&&!c.pick?1.2:2.6)){if(c.dir==='in'&&c.src.ch&&!c.pick){c.wait=true;c.lt=el;}else{hang(false);return;}}}
  chShow();
  const sig=c.st+c.li+(c.wait?'w':'')+(c.st==='ring'?canAnswer():'');if(sig!==callSig){callSig=sig;if(phoneOpen)drawCall();}else if(phoneOpen&&c.st==='talk'){const s_=$('phV').querySelector('.cSub');if(s_)s_.textContent='通话中 '+mmss(el);}islLast=null;},250);
function openApp(a){phApp=a;SFX.tick(.3);
  if(a==='call'){$('phV').innerHTML=phHead('通讯录')+Object.keys(CALLS).map(n=>`<div class="ct">${avH(n,34)}<span>${n}</span><button class="cg2 im" data-n="${n}">${PHI()}</button></div>`).join('');bindBack();$('phV').querySelectorAll('.ct').forEach(e=>e.onpointerdown=ev=>{ev.preventDefault();callOut(e.querySelector('.cg2').dataset.n);});}
  else if(a==='sms'){const un=SMS.map(m=>m[3]);SMSn=0;SMS.forEach(m=>m[3]=0);$('phV').innerHTML=phHead('短信')+SMS.map((m,i)=>`<div class="phSm">${avH(m[0],32)}<div class="bub"><b>${m[0]}：</b>${m[1]}<small>${m[2]}</small>${un[i]?'<i class="dot2"></i>':''}</div></div>`).join('');bindBack();}
  else if(a==='music')drawMusic();
  else if(a==='game'){startGame();bindBack();}
  else if(a==='deliv'){const it=[];if(offer)it.push([`<b>🔔 新订单</b>${offer.shop.name} → ${offer.home.name} · 🪙${offer.price}<br><b style="color:#7CFC9A">点这里抢单</b>`,()=>{$('ofOk').dispatchEvent(new PointerEvent('pointerdown'));openApp('deliv');}]);
    orders.forEach(o=>{const fee=cancelFee(o);it.push([`<b>${o.phase==='pick'?'🛍️ 待取餐':'📦 配送中'}</b>${o.shop.name} → ${o.home.name}<br>⏱ 剩 ${Math.max(0,Math.ceil(o.lim-o.t))}s · 🪙${o.price}<br><span style="color:${fee?'#ff8a7a':'#9fe8b0'}">点击取消订单${fee?` · 罚 🪙${fee}`:' · 免费'}</span>`,()=>{playerCancel(o);openApp('deliv');}]);});if(!it.length)it.push(['暂时没有订单，等系统派单……',null]);
    it.push([`📊 今日收入 🪙${JOB.earn||0} · 评分 ${(JOB.rating||5).toFixed?JOB.rating.toFixed(2):JOB.rating}`,null]);phList('外卖平台',it);}
  else if(a==='boss'){closePhone();const st=state;openJobs('ride');resumeState=st;state='paused';}
  else if(a==='cal'){const h=Math.floor(CAL.min/60);let g='';const d0=(CAL.day-1)%7;for(let i=0;i<14;i++){const dd=CAL.day-d0+i;g+=`<div class="cd${dd===CAL.day?' on':''}">${dd>0?dd:''}</div>`;}
    $('phV').innerHTML=phHead(`第${CAL.day}天 · ${calStr()}`)+`<div class="cg">${WK.map(w=>`<div class="cw">${w.slice(1)}</div>`).join('')}${g}</div><div class="note">游戏 1 分钟 = 现实 0.5 秒<br>22:00 后不回家就只能睡大街<br>${h>=20?'🌙 现在该回家了':'☀️ 好好跑单'}<em>⏰</em></div>`;bindBack();}
  else if(a==='nav'){NAVHOME=true;updTarget();toast('🗺️ 已开始导航回家',1600);closePhone();}
  else if(a==='wallet')phList('钱包',[[`<b>余额</b><span style="font-size:22px;font-weight:800">🪙 ${coins}</span>`,null],[`<b>驾照</b>${LIC.ok?LIC.pts+'/12 分':'无/已吊销'}`,null]]);}
let musIdx=-1,musLast=0;const SONGN=['骑行摇滚','深夜 lo-fi','鹈鹕之歌'];
function drawMusic(){phApp='music';const on=musIdx>=0;const cur=on?musIdx:musLast;$('phV').innerHTML=phHead('音乐播放器')+`<div class="vin${on?' spin':''}"><div class="arm${on?' play':''}"></div><div class="disc"><i></i></div></div><div class="songs">${SONGN.map((s,i)=>`<p class="${i===cur?'on':''}" data-s="${i}">${s}</p>`).join('')}</div><div class="mVol"><span>🔈</span><input type="range" min="0" max="100" value="${Math.round((master?master.gain.value:.6)/.6*100)}" id="mVolR"><span>🔊</span></div><div class="mCtl"><button data-m="p">◀◀</button><button class="pp" data-m="t">${on?'❚❚':'▶'}</button><button data-m="n">▶▶</button></div>`;bindBack();
  $('phV').querySelectorAll('[data-s]').forEach(e=>e.onpointerdown=ev=>{ev.preventDefault();playMusic(+e.dataset.s);drawMusic();});
  $('phV').querySelectorAll('[data-m]').forEach(e=>e.onpointerdown=ev=>{ev.preventDefault();const m=e.dataset.m;if(m==='t')playMusic(on?-1:cur);else playMusic((cur+(m==='n'?1:2))%3);drawMusic();});
  const r=$('mVolR');r.oninput=()=>{if(master)master.gain.value=.6*r.value/100;};}
// island long-press → phone (only on foot), tap → call / cancel
(function(){let lpT=null,lpDone=false;cmpE.style.pointerEvents='auto';
  cmpE.addEventListener('pointerdown',e=>{if(e.target.closest('#offer'))return;const ic=e.target.closest('[data-ic]');if(ic){e.preventDefault();e.stopPropagation();if(ic.dataset.ic==='ok')answer();else if(ic.dataset.ic==='no')hang(false);else openPhone(true);return;}
    e.preventDefault();lpDone=false;cmpE.classList.add('press');lpT=setTimeout(()=>{lpDone=true;cmpE.classList.remove('press');if(navigator.vibrate)navigator.vibrate(20);if(padOn||INT.on)openPhone();else toast('🚲 下车后才能用手机（长按灵动岛打开）',1800);},480);},true);
  const up=e=>{if(lpT){clearTimeout(lpT);lpT=null;}cmpE.classList.remove('press');if(lpDone||e.type!=='pointerup')return;if(CALL){openPhone(true);return;}if(orders.length&&e.target.closest('#isl2'))cancelMenu();};
  cmpE.addEventListener('pointerup',up);cmpE.addEventListener('pointerleave',up);cmpE.addEventListener('pointercancel',up);})();
function islCallHtml(){const c=CALL;if(!c)return '';if(c.st==='ring')return `<div class="iCall${c.emer?' e':''}" data-ic="open">${avH(c.n,26)}<span class="iN">${c.n}<small>${c.emer?'🚨 紧急来电':'来电'}</small></span><button class="ib red im" data-ic="no">${PHI('r')}</button><button class="ib im green${canAnswer()?'':' dis'}" data-ic="ok">${PHI()}</button></div>`;
  return `<div class="iCall" data-ic="open">${avH(c.n,22)}<span class="iN">${c.n}<small>${c.st==='dial'?'呼叫中…':'通话中 '+mmss((performance.now()-c.t0)/1000)}</small></span><span class="wave"><i></i><i></i><i></i><i></i></span><button class="ib red im" data-ic="no">${PHI('r')}</button></div>`;}
// music (simple synth loops)
let musT=null;const SONGS=[[[0,4,7,12],[5,9,12,17],[7,11,14,19],[5,9,12,17]],[[0,3,7,10],[-2,2,5,9],[-4,0,3,7],[-5,-1,2,5]],[[0,7,12,7],[4,7,11,7],[5,9,12,9],[7,11,14,11]]];
function playMusic(i){if(musT){clearInterval(musT);musT=null;}if(musIdx>=0)musLast=musIdx;musIdx=i<0?-1:i;if(i>=0)musLast=i;if(i<0||!AC)return;let n=0;const S=SONGS[i];musT=setInterval(()=>{if(!AC||muted)return;const ch=S[Math.floor(n/8)%4],f=262*Math.pow(2,ch[n%4]/12)*(i===1?.5:1);const t=AC.currentTime;const o=AC.createOscillator(),g=AC.createGain();o.type=i===1?'triangle':'square';o.frequency.value=f;g.gain.setValueAtTime(.05,t);g.gain.exponentialRampToValueAtTime(.001,t+.25);o.connect(g);g.connect(master);o.start(t);o.stop(t+.3);n++;},i===1?300:180);toast('🎵 正在播放',1200);}
// mini game: catch fish
let gm=null;function startGame(){const V_=$('phV');V_.innerHTML='<div class="phT">🎮 鹈鹕接鱼 · <span id="gS">0</span> 分 · <span id="gT">30</span>s</div><canvas id="gC" width="220" height="300"></canvas>';const c=$('gC'),x=c.getContext('2d');
  gm={x,c,px:110,fish:[],sc:0,t:30,raf:0,last:performance.now()};const mv=e=>{const r=c.getBoundingClientRect();gm.px=(e.clientX-r.left)/r.width*220;};c.onpointerdown=mv;c.onpointermove=mv;
  const step=now=>{if(!gm)return;const dt=Math.min(.05,(now-gm.last)/1000);gm.last=now;gm.t-=dt;if(Math.random()<dt*2.2)gm.fish.push({x:rnd(10,210),y:-10,v:rnd(90,170),bad:Math.random()<.2});
    x.fillStyle='#0e2a47';x.fillRect(0,0,220,300);x.font='22px sans-serif';for(const f of gm.fish){f.y+=f.v*dt;x.fillText(f.bad?'💣':'🐟',f.x-11,f.y);if(f.y>262&&f.y<290&&Math.abs(f.x-gm.px)<26&&!f.hit){f.hit=1;f.y=999;gm.sc+=f.bad?-3:1;SFX.tick(.3);}}
    gm.fish=gm.fish.filter(f=>f.y<320);x.font='30px sans-serif';x.fillText('🦩',gm.px-15,290);$('gS').textContent=gm.sc;$('gT').textContent=Math.ceil(gm.t);
    if(gm.t<=0){const r=Math.max(0,Math.min(30,gm.sc));coins+=r;saveCoins();toast(`🎮 得分 ${gm.sc}，奖励 🪙${r}`,2200);stopGame();if(phoneOpen)setTimeout(()=>{if(phApp==='game')phHome();},300);return;}gm.raf=requestAnimationFrame(step);};gm.raf=requestAnimationFrame(step);}
function stopGame(){if(gm){cancelAnimationFrame(gm.raf);gm=null;}}
// ---------- side quests (blue !) ----------
var SQ=null;const SQG=[];let sqCool=0;
const bangTex=canvasTex(128,160,(x,w,h)=>{x.lineJoin='round';x.font='900 150px Arial Black, sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=16;x.strokeStyle='#fff';x.strokeText('!',w/2,h/2+6);const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#6fc3ff');g.addColorStop(1,'#1366e8');x.fillStyle=g;x.fillText('!',w/2,h/2+6);});
const QZ_TRAFFIC=[['黄灯亮时应该？',['已越过停止线的可以继续通行','加速冲过去','原地掉头']],['骑电动车需要戴什么？',['安全头盔','墨镜','耳机']],['驾驶时接打手持电话会被？',['罚款并记分','表扬','没关系']],['看到斑马线有行人应该？',['停车让行','鸣笛催促','加速通过']],['自行车可以在机动车道上逆行吗？',['不可以','可以','晚上可以']],['红灯时右转需要注意什么？',['让行直行车辆和行人','直接冲','按喇叭']]];
const QZ_NJ=[['南京的简称是？',['宁','沪','杭']],['中山陵位于哪座城市？',['南京','苏州','上海']],['玄武湖在哪座城市？',['南京','杭州','武汉']],['南京长江大桥横跨哪条江？',['长江','黄河','珠江']],['南京理工大学在南京哪个区？',['玄武区','浦口区','江宁区']]];
const QZ_PEL=[['鹈鹕嘴下面的大袋子叫什么？',['喉囊','口袋','背包']],['鹈鹕主要吃什么？',['鱼','草','坚果']],['鹈鹕会游泳吗？',['会','不会','只会狗刨']],['鹈鹕属于哪一类动物？',['鸟类','哺乳类','鱼类']]];
const QTYPES=[
 {k:'cat',m:'find',n:'迷路的小妹妹',e:'👧',kid:1,say:'呜呜……我的小猫「年糕」跑丢了，你能帮我找找吗？',obj:'cat',on:'小猫「年糕」',r:60},
 {k:'dog',m:'find',n:'遛狗的阿姨',e:'🐕',say:'我家柯基「豆豆」挣脱绳子跑了！就在这附近！',obj:'dog',on:'柯基「豆豆」',r:60},
 {k:'wallet',m:'find',n:'着急的大学生',e:'🎒',say:'我的钱包丢了，里面有饭卡和身份证……能帮我找找吗？',obj:'wallet',on:'钱包',r:50,still:1},
 {k:'thief',m:'chase',n:'被抢的阿姨',e:'👩',say:'抓小偷啊！他抢了我的包往那边跑了！快追！',r:80,sp:7.5,lim:60,rn:'小偷',got:'包拿回来了'},
 {k:'brat',m:'chase',n:'奶茶店小妹',e:'🧋',say:'有个熊孩子拿了奶茶没付钱就跑！帮我追回来！',r:50,sp:6,lim:50,kidR:1,rn:'熊孩子',got:'熊孩子乖乖付了钱'},
 {k:'chick',m:'chase',n:'养鸡的大爷',e:'👴',say:'哎呀我的大公鸡跑了！它跑得可快了，快帮我抓住它！',r:70,sp:8,lim:60,chicken:1,rn:'大公鸡',got:'抓住大公鸡了'},
 {k:'photo',m:'visit',n:'游客小哥',e:'📷',say:'第一次来南京！能帮我去 3 个地方拍照打卡吗？',src:'shop',cnt:3,verb:'📸 拍照打卡',flash:1,lim:200,r:70},
 {k:'live',m:'visit',n:'网红主播',e:'🤳',say:'家人们！帮我去探 4 家店，我要做探店视频！',src:'shop',cnt:4,verb:'🎥 探店',flash:1,lim:240,r:90},
 {k:'candy',m:'visit',n:'新婚夫妻',e:'💒',say:'我们结婚啦！帮我们给 3 栋楼的邻居送喜糖好吗？',src:'home',cnt:3,verb:'🍬 送喜糖',lim:220,r:80},
 {k:'umbrella',m:'visit',n:'担心的爸爸',e:'☂️',say:'要下雨了，帮我把这把伞送到女儿住的那栋楼吧！',src:'home',cnt:1,verb:'☂️ 送伞',lim:90,r:45},
 {k:'jog',m:'visit',n:'夜跑达人',e:'🏃',say:'来挑战一下：2 分钟内经过 4 个路口打卡！',src:'inter',cnt:4,verb:'🏁 路口打卡',lim:120,r:80},
 {k:'skate',m:'race',n:'滑板少年',e:'🛹',say:'听说你骑车很快？比一场！谁先到终点谁赢，敢不敢？',rv:8.2,r:90},
 {k:'rival',m:'race',n:'闪电跑腿骑手',e:'⚡',say:'鹈鹕外卖的？我们闪电跑腿才是最快的！来比比！',rv:9.6,r:130},
 {k:'grandpa',m:'race',n:'晨跑大爷',e:'👴',say:'年轻人，大爷我每天晨跑十公里，你骑车都未必赢我！',rv:6.2,r:50},
 {k:'fish',m:'collect',n:'胖鹈鹕大叔',e:'🐟',say:'哎呀我的鱼干撒了一地！帮我捡回来，分你一半～',obj:'fish',cnt:6,lim:100,r:50,full:1},
 {k:'balloon',m:'collect',n:'幼儿园老师',e:'🎈',say:'孩子们的气球被风吹散了！帮我把 5 个气球找回来！',obj:'balloon',cnt:5,lim:110,r:60},
 {k:'flyer',m:'collect',n:'健身房小哥',e:'💪',say:'帮我把散落的 6 张传单捡回来，送你体验卡！',obj:'flyer',cnt:6,lim:100,r:45},
 {k:'quiz',m:'quiz',n:'退休老交警',e:'👮',say:'小伙子送外卖要懂交规！考你三道题，答对两道有奖！',qs:QZ_TRAFFIC,r:40},
 {k:'njquiz',m:'quiz',n:'南理工学长',e:'🎓',say:'学弟！考考你南京知识，答对两道请你吃食堂！',qs:QZ_NJ,r:40},
 {k:'pelquiz',m:'quiz',n:'鹈鹕博士',e:'🔬',say:'身为一只鹈鹕，你了解自己吗？来回答三个问题！',qs:QZ_PEL,r:40},
 {k:'granny',m:'escort',n:'老奶奶',e:'👵',old:1,say:'孩子，奶奶眼神不好，能扶我走到前面那栋楼吗？',sp:1.7,r:60},
 {k:'lostkid',m:'escort',n:'迷路的小朋友',e:'🧒',kid:1,say:'我……我找不到妈妈了，妈妈说她在前面那栋楼等我……',sp:2.2,r:70},
 {k:'blind',m:'escort',n:'盲人大叔',e:'🦯',say:'小伙子，能带我去前面那栋楼吗？我看不见路。',sp:1.5,r:70},
 {k:'treasure',m:'treasure',n:'神秘老头',e:'🧙',say:'嘿嘿，城里藏着一个宝箱……想要吗？跟着我的线索走。',r:120}];
function meP(){return state==='foot'?pel.position:player.position;}
function mkBang(){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:bangTex,depthTest:true,transparent:true}));s.scale.set(.75,.95,1);return s;}
function nearPOIs(min,max,shop){const q=meP();return curPOI.filter(p=>(shop==null||!!p.shop===shop)&&(d=>d>min&&d<max)(p.park.distanceTo(q)));}
function sqDoneSet(){return SAVE.sqdone_egg||(SAVE.sqdone_egg=[]);}
function sqSpawn(g){const used=SQG.map(x=>x.type&&x.type.k).concat(SQ?[SQ.type.k]:[]);const done=sqDoneSet();let types=QTYPES.filter(t=>!used.includes(t.k));const fresh=types.filter(t=>!done.includes(t.k));if(fresh.length&&Math.random()<.75)types=fresh;
  const c=nearPOIs(40,160).filter(p=>!SQG.some(x=>x.poi===p));if(!c.length)return false;const p=pick(c);const type=pick(types);
  if(!g.ped){g.ped=makePed(false);g.bang=mkBang();g.ped.g.add(g.bang);g.bang.position.set(0,2.45,0);}else scene.add(g.ped.g);
  const pos=p.door.clone().addScaledVector(p.n,1.6);pos.y=0;g.ped.g.position.copy(pos);g.ped.g.rotation.y=Math.atan2(p.n.z,-p.n.x)+PI;g.ped.g.scale.setScalar(type.kid?.7:type.old?.9:1);g.ped.g.visible=true;g.bang.visible=true;g.type=type;g.poi=p;g.pos=pos;return true;}
for(let i=0;i<3;i++)SQG.push({ped:null});
function sqDone(win,msg){const q=SQ;if(!q)return;SQ=null;(q.objs||[]).forEach(o=>{scene.remove(o);});if(q.runner)q.runner.g.visible=false;if(q.chk)q.chk.visible=false;
  if(win){const d=sqDoneSet();const first=!d.includes(q.type.k);if(first)d.push(q.type.k);coins+=q.type.r;saveCoins();SFX.win();toast(`${msg||'✅ 支线完成'} · 🪙${q.type.r}${first?` · 📜 支线图鉴 ${d.length}/${QTYPES.length}`:''}`,3200);sms(q.type.n,pick(['谢谢你！你真是个好鹈鹕 👍','太感谢了！下次请你吃饭','好人一生平安 🙏']));}
  else{SFX.lose&&SFX.lose();toast(msg||'❌ 支线失败',2600);}
  if(q.g){q.g.type=null;q.g.ped.g.visible=false;}sqCool=12;beacon.visible=false;updTarget();}
function sqTgt(p,label){if(!SQ)return;if(p&&SQ.tgt&&SQ.tlabel===label){SQ.tgt.copy(p);if(!curOrder()&&!ERR)beacon.position.copy(p);return;}SQ.tgt=p?p.clone():null;SQ.tlabel=label||'';updTarget();}
function sqAct(pp,range){if(!freeMode())return null;range=range||2.6;
  if(SQ&&SQ.act){const a=SQ.act;if(Math.hypot(a.pos.x-pp.x,a.pos.z-pp.z)<range)return a;}
  if(SQ&&SQ.ret&&SQ.g&&Math.hypot(SQ.g.pos.x-pp.x,SQ.g.pos.z-pp.z)<range)return {label:`把好消息告诉${SQ.type.n}`,short:'交任务',fn:()=>sqDone(true,`✅ ${SQ.type.n}：太谢谢你了！`)};
  if(!SQ)for(const g of SQG){if(g.type&&Math.hypot(g.pos.x-pp.x,g.pos.z-pp.z)<range)return {label:`❗ 和${g.type.n}说话`,short:'对话',fn:()=>sqTalk(g)};}return null;}
function sqTalk(g){const t=g.type;const done=sqDoneSet().includes(t.k);mdlOpen(`${t.e} ${t.n}`,`<div style="font-size:15px">「${t.say}」</div><small style="opacity:.7">奖励 🪙${t.r}${done?' · 已完成过':' · 🆕 新支线'}</small>`,[{t:'👍 交给我',p:1,f:()=>{mdlClose();sqStart(g);}},{t:'下次吧',f:()=>mdlClose()}]);}
function inter(){const q=meP();return V(Math.round(q.x/B)*B,0,Math.round(q.z/B)*B);}
function mkAnimal(col,dog){const c=new THREE.Group();const o=M(col,{roughness:.8}),w=M(0xffffff);const b=mesh(new THREE.SphereGeometry(.28,14,10),o,c);b.scale.set(dog?1.7:1.5,.9,.9);b.position.y=.32;const h=mesh(new THREE.SphereGeometry(dog?.22:.2,14,10),o,c);h.position.set(.44,.54,0);
  for(const s of[-1,1]){const e=mesh(dog?new THREE.ConeGeometry(.08,.2,4):new THREE.ConeGeometry(.07,.15,4),o,c);e.position.set(.42,.74,s*.1);mesh(new THREE.SphereGeometry(.035,6,5),M(0x111111),c).position.set(.6,.58,s*.08);if(dog)for(const f of[-1,1]){mesh(new THREE.CylinderGeometry(.05,.05,.2,6),o,c).position.set(f*.25,.1,s*.12);}}
  const t=mesh(new THREE.CylinderGeometry(.04,.03,dog?.22:.5,6),o,c);t.position.set(-.48,.55,0);t.rotation.z=.8;mesh(new THREE.SphereGeometry(.12,8,6),w,c).position.set(.58,.47,0);if(dog)mesh(new THREE.SphereGeometry(.045,6,5),M(0x111111),c).position.set(.66,.52,0);scene.add(c);return c;}
function mkObj(k){const g=new THREE.Group();
  if(k==='wallet'){mesh(new THREE.BoxGeometry(.35,.08,.25),M(0x6b3a1f,{roughness:.6}),g).position.y=.05;mesh(new THREE.BoxGeometry(.1,.085,.1),M(0xd4a531,{metalness:.7,roughness:.3}),g).position.set(.15,.05,0);}
  else if(k==='fish'){const m=M(0xd9a35a,{roughness:.6,emissive:0x553300,emissiveIntensity:.5});const b=mesh(new THREE.SphereGeometry(.3,10,8),m,g);b.scale.set(1.4,.6,.35);const t=mesh(new THREE.ConeGeometry(.2,.3,4),m,g);t.rotation.z=PI/2;t.position.x=-.5;}
  else if(k==='balloon'){const c=pick([0xff4d6d,0x4dabf7,0xffd43b,0x69db7c,0xb197fc]);const b=mesh(new THREE.SphereGeometry(.35,16,12),M(c,{roughness:.25,emissive:c,emissiveIntensity:.25}),g);b.scale.y=1.2;b.position.y=.6;mesh(new THREE.CylinderGeometry(.006,.006,1,4),M(0xffffff),g).position.y=-.1;}
  else if(k==='flyer'){const p=mesh(new THREE.BoxGeometry(.42,.01,.3),M(0xfff3bf,{emissive:0x332200,emissiveIntensity:.4}),g);p.rotation.x=.3;mesh(new THREE.BoxGeometry(.3,.012,.06),M(0xe03131),g).position.set(0,.01,-.05);}
  else if(k==='chicken'){const w=M(0xffffff,{roughness:.8});const b=mesh(new THREE.SphereGeometry(.22,12,10),w,g);b.position.y=.32;b.scale.set(1.2,1,.9);const h=mesh(new THREE.SphereGeometry(.12,10,8),w,g);h.position.set(.2,.55,0);mesh(new THREE.ConeGeometry(.04,.1,4),M(0xffa500),g).position.set(.33,.54,0).constructor;const cm=mesh(new THREE.BoxGeometry(.1,.08,.03),M(0xe03131),g);cm.position.set(.2,.69,0);for(const s of[-1,1])mesh(new THREE.CylinderGeometry(.015,.015,.22,4),M(0xffa500),g).position.set(0,.1,s*.07);}
  scene.add(g);return g;}
function mkChest(){const c=new THREE.Group();mesh(new THREE.BoxGeometry(1,.6,.7),M(0x8b5a2b,{roughness:.7}),c).position.y=.3;const l=mesh(new THREE.BoxGeometry(1.02,.25,.72),M(0xc9962b,{metalness:.6,roughness:.3}),c);l.position.y=.72;mesh(new THREE.BoxGeometry(.16,.2,.05),M(0xffd700,{metalness:.8,roughness:.2,emissive:0x664400}),c).position.set(0,.5,.37);scene.add(c);return c;}
let sqR=null,sqK=null;
function sqStart(g){const t=g.type;g.bang.visible=false;SQ={type:t,g,t0:performance.now(),objs:[],step:0};const q=meP();
  if(t.m==='find'){const p=pick(nearPOIs(30,90))||g.poi;const o=t.obj==='wallet'?mkObj('wallet'):mkAnimal(t.obj==='dog'?0xd98b3a:0xf0a040,t.obj==='dog');const pos=p.door.clone().addScaledVector(p.n,1.2);pos.y=0;o.position.copy(pos);SQ.objs.push(o);SQ.cat=o;SQ.lim=150;SQ.flee=!t.still&&Math.random()<.6;
    SQ.act={pos,label:`${t.still?'捡起':'抓住'}${t.on}`,short:t.still?'捡起':'抓住',fn:()=>{if(SQ.flee){SQ.flee=false;toast(`💨 ${t.on}一溜烟跑了……再追！`,1800);const p2=pick(nearPOIs(10,40))||p;const np=p2.door.clone().addScaledVector(p2.n,1.2);np.y=0;SQ.catTo=np;SQ.act.pos=np;}else{scene.remove(o);SQ.act=null;SQ.ret=true;sqTgt(g.pos,`${t.e} 送回给${t.n}`);toast(`✅ 找到${t.on}了！快送回去`,1800);}}};
    toast(`🔎 ${t.on}就在附近，留意灵动岛上的冷热提示`,2400);}
  else if(t.m==='chase'){let r;if(t.chicken){sqK=sqK||mkObj('chicken');sqK.visible=true;r={g:sqK,legs:[],arms:[]};SQ.chk=sqK;}else{r=sqR||(sqR=makePed(false));r.g.visible=true;r.g.scale.setScalar(t.kidR?.7:1);}SQ.runner=r;const s=inter();r.g.position.copy(s);SQ.node=s.clone();SQ.next=null;SQ.lim=t.lim;toast(`🏃 ${t.rn}往路口跑了！追上去（靠近就能抓住）`,2200);}
  else if(t.m==='visit'){if(t.src==='inter'){const s=inter();const pts=[];let c=s.clone();for(let i=0;i<t.cnt;i++){const d=pick([[B,0],[-B,0],[0,B],[0,-B]]);c=V(c.x+d[0],0,c.z+d[1]);pts.push({park:c.clone(),name:`路口 ${i+1}`});}SQ.spots=pts;}
    else{SQ.spots=nearPOIs(40,240,t.src==='shop').sort(()=>Math.random()-.5).slice(0,t.cnt);if(SQ.spots.length<t.cnt)SQ.spots=nearPOIs(20,320).slice(0,t.cnt);}
    SQ.lim=t.lim;sqTgt(SQ.spots[0].park,`${t.verb} 1/${t.cnt} · ${SQ.spots[0].name}`);toast(`${t.verb}：限时 ${t.lim} 秒`,2000);}
  else if(t.m==='race'){if(state==='foot'){toast(`${t.e} ${t.n}：先骑上车再来比！`,1800);g.bang.visible=true;SQ=null;return;}const s=inter();const dx=pick([-2,-1,1,2])*B,dz=pick([-2,-1,1,2])*B;SQ.goal=V(s.x+dx,0,s.z+dz);SQ.path=[s.clone(),V(s.x+dx,0,s.z),SQ.goal.clone()];SQ.rv=t.rv;SQ.rd=-Math.hypot(q.x-s.x,q.z-s.z);SQ.tot=Math.abs(dx)+Math.abs(dz);
    const r=SQ.runner=sqR||(sqR=makePed(false));r.g.visible=true;r.g.scale.setScalar(1);r.g.position.copy(s);SQ.lim=150;sqTgt(SQ.goal,'🏁 终点');toast('🏁 3、2、1……开始！',1800);}
  else if(t.m==='collect'){SQ.fish=[];const ps=nearPOIs(8,90).sort(()=>Math.random()-.5).slice(0,t.cnt);ps.forEach(p=>{const f=mkObj(t.obj);const by=t.obj==='balloon'?2.2:t.obj==='flyer'?.4:1.2;f.userData.by=by;f.position.set(p.park.x,by,p.park.z);SQ.objs.push(f);SQ.fish.push(f);});SQ.lim=t.lim;SQ.got=0;SQ.need=SQ.fish.length;toast(`🧺 捡齐 ${SQ.need} 个（骑车或走路靠近就能捡）`,2400);}
  else if(t.m==='quiz'){const qs=t.qs.slice().sort(()=>Math.random()-.5).slice(0,3);let i=0,ok=0;const ask=()=>{const qq=qs[i];const opts=qq[1].map((x,k)=>({x,k})).sort(()=>Math.random()-.5);
      mdlOpen(`${t.e} 第 ${i+1}/3 题`,qq[0],opts.map(o=>({t:o.x,f:()=>{if(o.k===0){ok++;toast('✅ 对！',700);}else toast(`❌ 不对，答案是「${qq[1][0]}」`,1200);i++;if(i<3)ask();else{mdlClose();ok>=2?sqDone(true,`${t.e} ${t.n}：答对 ${ok} 题，厉害！`):sqDone(false,`${t.e} ${t.n}：才对 ${ok} 题，回去再学学！`);}}})),true);};ask();return;}
  else if(t.m==='escort'){if(state!=='foot'){toast(`${t.e} ${t.n}：你下车陪我走好不好？`,2000);g.bang.visible=true;SQ=null;return;}const p=pick(nearPOIs(25,60,false).filter(p=>p!==g.poi))||pick(nearPOIs(20,80));SQ.dst=p;SQ.lim=150;SQ.gp=g.pos.clone();sqTgt(p.park,`${t.e} 送到 ${p.name}`);toast(`${t.e} 走得慢，别离太远（6 米内）`,2400);}
  else if(t.m==='treasure'){const shops=nearPOIs(30,250,true);const a=pick(shops),b=pick(shops.filter(x=>x!==a))||a;SQ.clues=[a,b];SQ.lim=240;SQ.hint=`去一家名字里带「${a.name.replace(/[^\u4e00-\u9fa5]/g,'')[0]}」的店，找到门口`;toast(`🧙 第一条线索：${SQ.hint}`,3200);}
  islLast=null;}
function sqUpdate(dt,t){if(!freeMode()||INT.on||state==='paused'||state==='menu'){return;}sqCool-=dt;
  for(const g of SQG){if(g.type){const d=g.pos.distanceTo(meP());if(d>260&&!(SQ&&SQ.g===g)){g.type=null;g.ped.g.visible=false;}else{g.bang.position.y=2.45+Math.sin(t*3)*.12;g.bang.material.rotation=Math.sin(t*2)*.12;}}
    else if(sqCool<=0&&(!SQ||SQ.g!==g)){sqSpawn(g);sqCool=3;}}
  if(!SQ)return;const q=SQ,me=meP(),T=q.type;const el=(performance.now()-q.t0)/1000;if(q.lim&&el>q.lim&&!q.ret){sqDone(false,`⌛ 时间到：${T.n}的任务失败了`);return;}
  const m=T.m;
  if(m==='find'&&q.cat){if(q.catTo){const d=V(q.catTo.x-q.cat.position.x,0,q.catTo.z-q.cat.position.z);const L=d.length();if(L<.2)q.catTo=null;else{d.normalize();q.cat.position.addScaledVector(d,Math.min(L,dt*7));q.cat.rotation.y=Math.atan2(-d.z,d.x);}}if(!T.still)q.cat.position.y=Math.abs(Math.sin(t*6))*.05;}
  if(m==='chase'&&!q.ret){const r=q.runner;if(!q.next){const opts=[[B,0],[-B,0],[0,B],[0,-B]].map(o=>V(q.node.x+o[0],0,q.node.z+o[1]));opts.sort((a,b)=>b.distanceTo(me)-a.distanceTo(me));q.next=Math.random()<.7?opts[0]:opts[1];}
    const d=q.next.clone().sub(r.g.position);d.y=0;const L=d.length();if(L<.5){q.node=q.next;q.next=null;}else{d.normalize();const sp=me.distanceTo(r.g.position)<25?T.sp:T.sp*.66;r.g.position.addScaledVector(d,dt*sp);r.g.rotation.y=Math.atan2(-d.z,d.x);if(T.chicken)r.g.position.y=Math.abs(Math.sin(t*16))*.15;r.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*14+i*PI)*.8);r.arms.forEach((a,i)=>a.rotation.z=-Math.sin(t*14+i*PI)*.7);}
    if(me.distanceTo(r.g.position)<2.8){r.g.visible=false;q.ret=true;sqTgt(q.g.pos,`${T.e} 回去找${T.n}`);SFX.win();toast(`🦸 抓住${T.rn}了！${T.got}，快回去`,2400);}else sqTgt(r.g.position,`🏃 ${T.rn}`);}
  if(m==='visit'&&!q.ret){const s=q.spots[q.step];if(me.distanceTo(s.park)<12){q.step++;if(T.flash)flashShot();else SFX.tick(.5);toast(`${T.verb} ${s.name}（${q.step}/${T.cnt}）`,1600);if(q.step>=T.cnt){if(T.cnt===1){sqDone(true,`${T.e} ${T.n}：收到啦，谢谢你！`);return;}q.ret=true;sqTgt(q.g.pos,`${T.e} 回去找${T.n}`);}else sqTgt(q.spots[q.step].park,`${T.verb} ${q.step+1}/${T.cnt} · ${q.spots[q.step].name}`);}}
  if(m==='race'&&!q.ret){q.rd+=q.rv*dt;const r=q.runner;let dd=Math.max(0,q.rd);const p=q.path;const seg1=p[0].distanceTo(p[1]);let pos;if(dd<seg1)pos=p[0].clone().lerp(p[1],dd/seg1);else pos=p[1].clone().lerp(p[2],Math.min(1,(dd-seg1)/Math.max(1,p[1].distanceTo(p[2]))));
    const dir=pos.clone().sub(r.g.position);if(dir.lengthSq()>1e-4)r.g.rotation.y=Math.atan2(-dir.z,dir.x);r.g.position.copy(pos);r.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*12+i*PI)*.5);
    if(me.distanceTo(q.goal)<10){sqDone(true,`🏁 你赢了！${T.n}：服了服了`);return;}if(dd>=q.tot){sqDone(false,`${T.e} ${T.n}先到了：「下次再练练吧！」`);return;}}
  if(m==='collect'){q.fish.forEach(f=>{if(!f.visible)return;f.rotation.y+=dt*(T.obj==='flyer'?1:3);f.position.y=f.userData.by+Math.sin(t*3+f.position.x)*.2;if(Math.hypot(f.position.x-me.x,f.position.z-me.z)<3){f.visible=false;q.got++;SFX.tick(.4);toast(`🧺 ${q.got}/${q.need}`,700);}});
    if(q.got>=q.need&&!q.ret){q.ret=true;if(T.full)stamina=100;sqTgt(q.g.pos,`${T.e} 回去找${T.n}`);}else if(!q.ret){const f=q.fish.filter(f=>f.visible).sort((a,b)=>a.position.distanceTo(me)-b.position.distanceTo(me))[0];if(f&&(!q.tgt||q.tgt.distanceTo(V(f.position.x,0,f.position.z))>1))sqTgt(V(f.position.x,0,f.position.z),'🧺 目标');}}
  if(m==='escort'){const gp=q.g.ped.g;const d=me.distanceTo(gp.position);if(state==='foot'&&d>1.6&&d<6.5){const dir=V(me.x-gp.position.x,0,me.z-gp.position.z).normalize();gp.position.addScaledVector(dir,dt*T.sp);gp.rotation.y=Math.atan2(-dir.z,dir.x);q.g.ped.legs.forEach((l,i)=>l.rotation.z=Math.sin(t*6+i*PI)*.35);q.g.pos.copy(gp.position);}
    if(d>=6.5&&!q.warn){q.warn=1;toast(`${T.e} ${T.n}：慢点……等等我`,1600);}if(d<6)q.warn=0;
    if(gp.position.distanceTo(q.dst.park)<10||gp.position.distanceTo(q.dst.door)<5){sqDone(true,`${T.e} ${T.n}：谢谢你，好孩子！`);return;}}
  if(m==='treasure'&&!q.ret){if(q.step<2){const c=q.clues[q.step];if(me.distanceTo(c.park)<12){q.step++;if(q.step===1){SQ.hint=`第二条线索：宝箱在「${q.clues[1].name}」附近`;toast(`🧙 ${SQ.hint}`,3000);sqTgt(q.clues[1].park,'🗝️ 线索 2');}else{const ch=mkChest();const p=q.clues[1];const cp=p.door.clone().addScaledVector(p.n,2);cp.y=0;ch.position.copy(cp);q.objs.push(ch);q.act={pos:cp,label:'打开宝箱',short:'开箱',fn:()=>{sqDone(true,'💰 宝箱打开了！金光闪闪');}};toast('🎁 宝箱就在店门口！下车去打开',2400);}}}}}
function flashShot(){const f=document.createElement('div');f.style.cssText='position:fixed;inset:0;background:#fff;z-index:50;pointer-events:none;transition:opacity .5s';document.body.appendChild(f);requestAnimationFrame(()=>{f.style.opacity='0';});setTimeout(()=>f.remove(),600);SFX.tick(.6);}
function sqHud(){const q=SQ,T=q.type;const el=(performance.now()-q.t0)/1000;const l=q.lim?Math.max(0,Math.ceil(q.lim-el)):0;const tm=q.lim&&!q.ret?` · <b style="color:${l<20?'#ff6b5a':'#7CFC9A'}">${Math.floor(l/60)}:${String(l%60).padStart(2,'0')}</b>`:'';const me=meP();let s='';const m=T.m;
  if(q.ret)s=`回去找${T.n}`;else if(m==='find'&&q.cat){const d=Math.round(me.distanceTo(q.act?q.act.pos:q.cat.position));s=`🔎 找${T.on} · ${d}m ${d<15?'🔥🔥':d<35?'🔥':d<60?'🌡️':'🧊'}`;}
  else if(m==='chase'&&q.runner)s=`🏃 追${T.rn} · ${Math.round(me.distanceTo(q.runner.g.position))}m`;else if(m==='visit')s=`${T.verb} ${q.step}/${T.cnt}`;else if(m==='race'){const mine=Math.max(0,100-me.distanceTo(q.goal)/(q.tot+1)*100),his=Math.min(100,Math.max(0,q.rd/q.tot*100));s=`🏁 你 ${Math.round(mine)}% · 对手 ${Math.round(his)}%`;}
  else if(m==='collect')s=`🧺 ${q.got}/${q.need}`;else if(m==='escort')s=`${T.e} 护送 · 距离 ${Math.round(me.distanceTo(q.g.ped.g.position))}m`;else if(m==='treasure')s=`🗺️ ${q.hint}`;
  return `<span style="color:#6fc3ff">❗</span> ${s}${tm}`;}
// ---------- thief ----------
let thiefT=20,thief=null;const thiefPed=makePed(false);thiefPed.g.visible=false;
function thiefUpdate(dt){if(stolen||drive!=='bike'&&false)return;const pp=pel.position,bp=player.position;if(!player.visible&&!thief)return;
  if(thief){thief.t+=dt;const g=thiefPed.g;if(thief.ph==='run'){const d=V(bp.x-g.position.x,0,bp.z-g.position.z);const L_=d.length();if(L_<.8){thief.ph='go';thief.t=0;say('🦹 小偷：这车不错，归我了！',1800);SFX.horn();}else{d.normalize();g.position.addScaledVector(d,dt*5.5);g.rotation.y=Math.atan2(-d.z,d.x)+PI/2;pedWalk(g,thief.t);}}
    else if(thief.ph==='go'){const f=V(Math.cos(heading),0,-Math.sin(heading));player.position.addScaledVector(f,dt*Math.min(12,thief.t*6));g.position.copy(player.position);if(thief.t>2.5){player.visible=false;g.visible=false;thief.ph='call';thief.t=0;toast('🚲 你的车被小偷骑走了！',2400);}}
    else if(thief.ph==='call'&&thief.t>1.6){thief.ph='deal';closePhone();thiefDeal();}return;}
  const dist=Math.hypot(pp.x-bp.x,pp.z-bp.z);if(!(phoneOpen&&dist>1.5)&&dist<10)return;thiefT-=dt;if(thiefT>0)return;thiefT=rnd(15,30);if(Math.random()>(phoneOpen?.45:.3))return;
  const a=Math.random()*6.28;thiefPed.g.position.set(bp.x+Math.cos(a)*14,0,bp.z+Math.sin(a)*14);thiefPed.g.visible=true;thief={ph:'run',t:0,price:Math.round(rnd(60,150)),tries:0};toast('👀 有个可疑的人朝你的车走过去了！',2200);}
function pedWalk(g,t){thiefPed.legs.forEach((l,i)=>{l.rotation.z=Math.sin(t*12+i*PI)*.6;});}
function thiefDeal(){const T=thief;SFX.ring&&SFX.ring();mdlOpen('📞 陌生号码来电',`🦹 小偷：「你的车在我手上。想要回去？<b>🪙${T.price}</b>，或者……陪我玩个游戏。」`,[
  {t:`💰 付 🪙${T.price} 赎车`,p:1,f:()=>{if(coins<T.price){toast('金币不够，试试砍价或者解谜',1800);return;}coins-=T.price;saveCoins();mdlClose();returnBike('🤝 交易完成，车停在你旁边了');}},
  {t:'🗣️ 砍价',f:()=>{T.tries++;if(T.tries>3){toast('小偷：别砍了！再砍我就挂了',1800);return;}if(Math.random()<.6){T.price=Math.round(T.price*.7);toast(`小偷：行吧行吧，🪙${T.price}`,1600);}else{T.price+=20;toast(`小偷：你再砍我就涨价！🪙${T.price}`,1600);}thiefDeal();}},
  {t:'🧩 解谜赢回',f:()=>puzzleMenu()},
  {t:'🚔 吓唬他要报警',f:()=>{if(Math.random()<.3){mdlClose();returnBike('🦹 小偷吓跑了，车扔在了路边');}else{T.price+=30;toast(`小偷：报啊！我不怕！涨价 🪙${T.price}`,1800);thiefDeal();}}}],true);}
function returnBike(msg){const pp=pel.position;player.visible=true;player.position.set(pp.x+1,0,pp.z+1);thief=null;thiefPed.g.visible=false;SFX.win();toast(msg,2400);}
function puzzleMenu(){mdlOpen('🧩 小偷的挑战','「三选一，赢了车就还你。输了……涨价。」',[{t:'🔢 密码锁',p:1,f:pzLock},{t:'🤔 脑筋急转弯',p:1,f:pzRiddle},{t:'🧠 记忆密码',p:1,f:pzSimon},{t:'↩️ 返回',f:thiefDeal}],true);}
function pzFail(){thief.price+=20;toast(`❌ 失败！小偷涨价到 🪙${thief.price}`,2000);SFX.lose();setTimeout(thiefDeal,600);}
function pzWin(){mdlClose();returnBike('🎉 解谜成功！小偷愿赌服输，把车还你了');}
function pzLock(){const t=1+Math.floor(Math.random()*3),h=t*2+(Math.random()<.5?0:1),u=t+3;const ans=`${h}${t}${u}`;const hint=h===t*2?'百位是十位的 2 倍':'百位比十位的 2 倍多 1';let inp='',tries=3;
  const draw=()=>{mdlOpen('🔢 车锁密码',`三位数密码：<br>① ${hint}<br>② 个位比十位大 3<br>③ 三个数字之和是 ${h+t+u}<br><div class="pzIn">${(inp+'___').slice(0,3)}</div><div class="kp">${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(k=>`<button class="glass pill" data-k="${k}">${k}</button>`).join('')}</div><small>剩余 ${tries} 次</small>`,[],true);
    $('mdlC').querySelectorAll('[data-k]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();const k=b.dataset.k;if(k==='⌫')inp=inp.slice(0,-1);else if(k==='✓'){if(inp===ans){pzWin();return;}tries--;inp='';if(tries<=0){pzFail();return;}toast('🔒 密码错误',1000);}else if(inp.length<3)inp+=k;SFX.tick(.2);draw();});};draw();}
const RIDDLES=[['什么东西越洗越脏？',['水','衣服','碗','手'],0],['什么路最窄？',['冤家路窄','小路','山路','单行道'],0],['鹈鹕的嘴里能装什么？',['好几条鱼','一辆车','一栋楼','空气'],0],['什么车寸步难行？',['风车','自行车','火车','外卖车'],0],['一个人从飞机上跳下来没摔伤，为什么？',['飞机停在地上','他会飞','有降落伞','掉进水里'],0],['什么东西有头无脚？',['砖头','人','鸟','桌子'],0],['什么瓜不能吃？',['傻瓜','西瓜','南瓜','黄瓜'],0],['外卖员最怕什么天？',['下雨天','晴天','周末','生日'],0]];
function pzRiddle(){const qs=RIDDLES.slice().sort(()=>Math.random()-.5).slice(0,3);let i=0,ok=0;const ask=()=>{const q=qs[i];const opts=q[1].map((t,k)=>({t,k})).sort(()=>Math.random()-.5);
  mdlOpen(`🤔 第 ${i+1}/3 题 · 答对 2 题就赢`,q[0],opts.map(o=>({t:o.t,f:()=>{if(o.k===q[2]){ok++;toast('✅ 答对了',800);}else toast('❌ 答错了',800);i++;if(i<3)ask();else ok>=2?pzWin():pzFail();}})),true);};ask();}
function pzSimon(){const C=['🔴','🟢','🔵','🟡'];const seq=[...Array(5)].map(()=>Math.floor(Math.random()*4));let k=0;
  mdlOpen('🧠 记住顺序',`<div class="pzIn" id="smS">准备……</div>`,[],true);let i=0;const show=setInterval(()=>{const e=$('smS');if(!e){clearInterval(show);return;}if(i<seq.length){e.textContent=C[seq[i]];SFX.tick(.4);setTimeout(()=>{if($('smS'))$('smS').textContent='·';},400);i++;}else{clearInterval(show);input();}},700);
  const input=()=>mdlOpen('🧠 按顺序点出来',`<div class="pzIn">${'●'.repeat(k)}${'○'.repeat(5-k)}</div>`,C.map((c,j)=>({t:c,f:()=>{if(j===seq[k]){k++;SFX.tick(.3);if(k>=5)pzWin();else input();}else pzFail();}})),true);}
// ---------- reform (first time 12 points used up) ----------
function reformScene(){LIC.reform=1;saveCoins();const st=state;
  mdlOpen('👮 交警叔叔',`「你的 12 分扣光了。在这里签下：」<div class="sign">好好改造，重新做人</div><div style="opacity:.85;font-size:13px">（这对吗？）<br>啊不对不对，是 —— <b>重新开车</b>。</div><input id="rfIn" placeholder="在这里写下正确的四个字" maxlength="8" autocomplete="off">`,
   [{t:'✍️ 签字',p:1,f:()=>{const v=($('rfIn').value||'').replace(/\s/g,'');if(v==='重新开车'){LIC.pts=12;LIC.ok=true;saveCoins();mdlClose();say('交警：好，12 分还给你。下不为例！',2600);SFX.win();}
     else if(v==='重新做人'||v==='好好改造'){toast('👮 交警：……我都说了不对了！',1800);}else toast('👮 交警：字写错了，再写一遍',1600);}},
    {t:'我不签',f:()=>{mdlClose();revoke('12 分已经扣完，拒绝签字');}}],true);setTimeout(()=>{const e=$('rfIn');if(e)e.focus();},300);}
// ---------- perf: adaptive pixel ratio ----------
let pfN=0,pfT=0,pfR=Math.min(window.devicePixelRatio||1,2);renderer.setPixelRatio(Math.min(pfR,1.75));
function perfUpd(dt){pfN++;pfT+=dt;if(pfT>3){const fps=pfN/pfT;pfN=0;pfT=0;const cur=renderer.getPixelRatio();if(fps<48&&cur>1){renderer.setPixelRatio(Math.max(1,cur-.25));}else if(fps>58&&cur<Math.min(pfR,1.75)){renderer.setPixelRatio(Math.min(Math.min(pfR,1.75),cur+.25));}}}

function cancelFee(o){const left=o.lim-o.t;return left<=30?Math.max(10,Math.round(o.price*.5)):0;}
function playerCancel(o){if(walk&&walk.o===o){toast('正在取餐/送餐中，出来后再取消',1800);return;}const fee=cancelFee(o);const i=orders.indexOf(o);if(i<0)return;orders.splice(i,1);
  if(fee){coins=Math.max(0,coins-fee);JOB.revs.unshift(`★★☆☆☆ 临近送达才取消，罚款 🪙${fee}`);JOB.revs.length=Math.min(JOB.revs.length,8);rateJob(2);SFX.lose();toast(`❌ 已取消订单 · 临近送达取消，罚款 🪙${fee}`,2600);}
  else{SFX.tick(.4);toast('✅ 已取消订单，未扣费',1800);}saveCoins();syncBag();updTarget();}
function cancelMenu(){if(!orders.length){toast('当前没有订单',1200);return;}mdlOpen('🧾 我的订单','剩余时间超过 30 秒可免费取消；<b>30 秒内或已超时</b>取消，罚订单价的一半（至少 🪙10）',
  orders.map(o=>{const left=Math.ceil(o.lim-o.t),fee=cancelFee(o);return {t:`${o.phase==='pick'?'🛍️':'📦'} ${o.shop.name}→${o.home.name} · ${left>0?left+'s':'超时'} · ${fee?`取消罚 🪙${fee}`:'免费取消'}`,f:()=>{mdlClose();playerCancel(o);}};}).concat([{t:'返回',p:1,f:mdlClose}]));}
isl2.style.cursor='pointer';
function v15Update(dt,t){calUpdate(dt);try{sqUpdate(dt,t);}catch(e){console.error(e);}islUpdate();homeSignUpd();perfUpd(dt);if(state==='foot')footUpdate(dt,t);if(INT.on||state==='foot')$('act2').style.display='none';}

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

// ===== main loop =====
const clock=new THREE.Clock();let engNear=0;
function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.05),t=clock.elapsedTime;
  const live=state==='ride'||state==='crash';
  if(state!=='paused'&&state!=='menu')T+=dt;else if(state==='menu')T+=dt;
  prevP.copy(player.position);bumpCool-=dt;
  if(state==='ride'){
    if(!exam)mT+=dt;
    const target=gyroMode?gyroVal:steerStyle===1?barVal:(kL?1:0)-(kR?1:0);steer+=(target*sens-steer)*Math.min(1,dt*6);steer=clamp(steer,-1.6,1.6);
    if(boostT>0){boostT-=dt;}
    if(exhausted&&stamina>20)exhausted=false;
    const isCar=drive==='car',motor=drive!=='bike',VPm=VPAR[drive];let gasIn=gas,brkIn=braking;
    if(isCar){if(gearMode==='P'||gearMode==='N')gasIn=false;if(gearMode==='P')v=Math.max(0,v-12*dt);}
    else if(revMode){brkIn=false;if(braking&&!gas){if(gear>0&&v>.3){v=Math.max(0,v-6*dt);gasIn=false;}else{gear=-1;gasIn=true;}}else if(gas&&gear<0){if(v>.3){v=Math.max(0,v-6*dt);gasIn=false;}else gear=1;}}
    else if(gear<0){gasIn=false;brkIn=braking;if(v<.3||gas)gear=1;}
    const canPedal=gasIn&&(!exhausted||motor);
    const vmax=gear<0?(isCar?3:2.2):fieldOn?5:motor?VPm.vmax:boostT>0?23:VMAX;
    if(canPedal)v+=(motor?VPm.acc:boostT>0?6.5:4.6)*Math.max(0,1-v/vmax)*dt;
    if(canPedal&&boostT<=0&&!motor){stamina-=(4.5+v*.42)*dt;if(stamina<=0){stamina=0;exhausted=true;toast('😮‍💨 鹈鹕累了！松开蹬车滑行或停下恢复体力',2600);}}
    else stamina=Math.min(100,stamina+(v<.5?15:5)*dt);
    if(brkIn){if(v>(rainT>0||snowT>0?6.4:CRASHV)&&!motor){crash('brake');}else{v=Math.max(0,v-(motor?VPm.brk:8.5)*(snowT>0?.55:1)*dt);stats.calm=0;}}
    if(state==='ride'){
      v-=(.2+.003*v*v)*dt;v=Math.max(0,v);if(v>vmax)v-=(v-vmax)*dt;
      if(isCar){const dl=clamp(steer*.6,-.62,.62)*Math.min(1,9/Math.max(v,.1));heading+=gear*v*Math.tan(dl)/2.4*dt;}else heading+=gear*steer*1.2*dt*Math.min(1,v/3);player.rotation.y=heading;
      const mvd=gear;const dx=Math.cos(heading)*v*dt*mvd,dz=-Math.sin(heading)*v*dt*mvd;player.position.x+=dx;player.position.z+=dz;stats.dist+=v*dt;stats.maxV=Math.max(stats.maxV,v);
      if(!fieldOn&&clampRoad()){if(exam&&exam.kind===3&&rule.cbC<=0){rule.cbC=3;deduct(10,'车轮骑轧道路边缘');}v*=.55;if(bumpCool<=0){SFX.bump();bumpCool=.5;stats.calm=0;delivBump(4);if(toastCool<=0){toast('🚧 那是人行道，不能骑出公路');toastCool=3;}}}
      toastCool-=dt;rule.cbC-=dt;if(!braking&&v>2)stats.calm+=dt;
      lean.rotation.x+=((isCar?0:-steer*Math.min(1,v/8)*.3)-lean.rotation.x)*Math.min(1,dt*5);if(isCar)for(const w of curCar.wheels)w.w.rotation.z-=gear*v*dt/w.r;
      const dw=v/(.36*.82)*dt;wheelA+=dw;const dc=(canPedal||v>.4)?dw/2.3:0;theta+=dc*(canPedal?1:.6);chainOff+=dc*cR;
      tickAcc+=canPedal?dc/PI:dw*18/(2*PI);if(tickAcc>1){tickAcc=0;if(v>.4&&!motor)SFX.tick(canPedal?.05:.03);}
      pel.position.y=(isCar?PCAR.y:PC.y)+(motor?0:Math.sin(theta*2)*.012)+(exhausted?-.03:0);pel.rotation.x=Math.sin(theta)*.035;upper.rotation.z=Math.sin(t*1.3)*.03+(canPedal?.02:0)-(exhausted?.15:0);
      wings.forEach((w,i)=>{w.rotation.x=(i?1:-1)*(Math.sin(t*2.1+i)*.015+(Math.sin(t*.7)>.93?Math.sin(t*30)*.05:0));});
      if(exam&&state==='ride')examUpdate(dt);
      if(!fieldOn&&state==='ride')rulesUpdate(dt);
      if(!exam)vipHint(dt);
      // intersections & lights
      const ni=Math.round(player.position.x/B),nj=Math.round(player.position.z/B),rx=player.position.x-ni*B,rz=player.position.z-nj*B;const inside=Math.abs(rx)<R&&Math.abs(rz)<R;
      if(fieldOn){}else if(inside&&!inInter){inInter=[ni,nj];const ax=Math.abs(Math.cos(heading))>=Math.abs(Math.sin(heading))?0:1;const st=light(ni,nj,ax);interViol=false;rule.enDir=dirIdx(heading);rule.enSig=sig;rule.inStopT=0;rule.inStopDone=false;
        rule.redIn=(st==='r'&&v>1);}
      else if(!inside&&inInter){if(rule.redIn){rule.redIn=false;const ed=dirIdx(heading);if(ed!==(rule.enDir+1)%4){interViol=true;stats.viol++;stats.score-=20;ticket('闯红灯',200,6,20);if(mission&&mission.k==='legal'&&!exam){finish(false,'viol');}}}
        if(!interViol){stats.legal++;stats.score+=5;if(mission&&mission.k==='legal')toast(`🚦 文明通过 ${stats.legal}/${mission.n}`);}inInter=null;
        const exd=dirIdx(heading);if(drive!=='bike'&&!exam&&exd!==rule.enDir&&exd!==(rule.enDir+2)%4){const need=exd===(rule.enDir+3)%4?-1:1;if(rule.enSig!==need)ticket(`${need<0?'左':'右'}转弯未按规定使用转向灯`,100,1,0);}}
      // pickups
      if(!exam)for(const f of fishes){if(!f.alive){if(Math.random()<.01)placePickup(f);continue;}if(f.p.distanceTo(player.position)>160){placePickup(f);continue;}
        if(Math.hypot(f.p.x-player.position.x,f.p.z-player.position.z)<1.7){f.alive=false;f.g.visible=false;
          if(f.kind==='fish'){stats.fish++;stats.score+=10;stamina=Math.min(100,stamina+20);hp=Math.min(100,hp+12);pouchFill=Math.min(1,pouchFill+.15);SFX.ding();toast(mission&&mission.k==='fish'?`🐟 +1 (${stats.fish}/${mission.n})`:'🐟 好吃！体力 +20');}
          else{boostT=6;stamina=100;exhausted=false;SFX.power();toast('⚡ 能量饮料！6 秒极速冲刺');}}}
      // mission
      if(mission&&!exam){if(mission.k==='reach'||mission.k==='multi'){const d=dests[destIdx];if(Math.hypot(d.x-player.position.x,d.z-player.position.z)<5){SFX.ding();stats.score+=50;destIdx++;if(destIdx>=dests.length){beacon.visible=false;finish(true);}else{setDest();toast(`📦 已送达 ${destIdx}/${dests.length}，前往下一个`);}}}
        else if(progress().done)finish(true);
        if(state==='ride'&&mission.lim&&mT>mission.lim)finish(false,'time');}
    }
  }else if(state==='crash'||(state==='end'&&pel.parent===scene)){crashT+=dt;
    pv.y-=9.8*dt;pel.position.addScaledVector(pv,dt);pel.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(tmp.copy(pw).normalize(),pw.length()*dt));
    if(pel.position.y<.25){pel.position.y=.25;pv.y=Math.abs(pv.y)*.28;pv.x*=.5;pv.z*=.5;pw.multiplyScalar(.45);}
    bikeV=Math.max(0,bikeV-5*dt);player.position.addScaledVector(crashDir,bikeV*dt);clampRoad();
    lean.rotation.x+=(fallTo-lean.rotation.x)*Math.min(1,dt*7);wheelA+=bikeV/.3*dt+dt*Math.max(0,3-crashT);
    for(let i=0;i<LF;i++){const f=lfs[i];f.v.y-=2.2*dt;f.v.multiplyScalar(1-1.6*dt);f.p.addScaledVector(f.v,dt);if(f.p.y<.03){f.p.y=.03;f.v.set(0,0,0);}
      dummy.position.copy(f.p);dummy.rotation.set(f.r+t*f.w,f.r,Math.sin(t*f.w)*.8);dummy.scale.set(.03,.09,.01);dummy.updateMatrix();loose.setMatrixAt(i,dummy.matrix);}loose.instanceMatrix.needsUpdate=true;}
  if(state!=='paused'&&!fieldOn){updTraffic(dt);carPlayerInteract(dt);}
  updSignals(dt,t);for(const o of offArms){o.a[0].rotation.x=-(1.3+Math.sin(t*1.6+o.ph)*.35);o.a[1].rotation.x=.15+Math.max(0,Math.sin(t*1.6+o.ph+1.5))*1.2;}
  wR.rotation.z=-wheelA;wF.rotation.z=-wheelA;mwh.forEach(w=>w.rotation.z=-wheelA*.82/.6);crank.rotation.z=-theta;pedals.forEach(p=>p.rotation.z=theta);updChain(chainOff);
  if(pel.parent===lean&&drive==='bike')updLegs(theta);
  wobblePouch(t,.08+Math.min(.25,v*.018)+(state==='crash'?.3:0));
  blinkT-=dt;if(blinkT<0){blinkP=.18;blinkT=rnd(2,5.5);}if(blinkP>0){blinkP-=dt;const k=Math.sin((1-Math.max(0,blinkP)/.18)*PI);lids.forEach(l=>{l.visible=k>.05;l.scale.set(1,.2+.8*k,1);});}else lids.forEach(l=>l.visible=exhausted&&Math.sin(t*2)>0);
  for(const f of fishes)if(f.alive){f.g.position.set(f.p.x,.7+Math.sin(t*3+f.p.x)*.15,f.p.z);f.g.rotation.y=t*2;}
  if(beacon.visible){bring.scale.setScalar(1+Math.sin(t*3)*.08);beamM.opacity=.22+Math.sin(t*2)*.06;}
  if(!fieldOn)updPools();
  stars.position.copy(camera.position);
  for(const c of clouds){c.userData.x+=dt*1.2;c.position.set(wrap(c.userData.x,player.position.x,500),c.userData.y,wrap(c.userData.z,player.position.z,500));}
  const L=LIGHTS[lightMode];sun.position.copy(player.position).add(L.so);sun.target.position.copy(player.position);
  if(INT.on||state==='foot'){}else updCamera(dt);
  // compass
  if(state!=='menu'&&!fieldOn){$('cmp').style.display='flex';$('arrow').style.display=beacon.visible?'inline-block':'none';}else $('cmp').style.display='none';
  if(state!=='menu'&&!fieldOn){const px=player.position.x,pz=player.position.z,ax=Math.abs(Math.cos(heading))>=Math.abs(Math.sin(heading))?0:1;let txt='';
    if(ax===0&&Math.abs(pz-Math.round(pz/B)*B)<RH){const sg=Math.cos(heading)>0?1:-1;const i=sg>0?Math.ceil((px-R)/B):Math.floor((px+R)/B),j=Math.round(pz/B);const st=light(i,j,0);txt=`<i class="tl tl-${st}"></i><b class="tln tl-${st}">${Math.ceil(lightLeft(i,j,0))}</b><small>s</small>`;}
    else if(ax===1&&Math.abs(px-Math.round(px/B)*B)<RH){const sg=-Math.sin(heading)>0?1:-1;const j=sg>0?Math.ceil((pz-R)/B):Math.floor((pz+R)/B),i=Math.round(px/B);const st=light(i,j,1);txt=`<i class="tl tl-${st}"></i><b class="tln tl-${st}">${Math.ceil(lightLeft(i,j,1))}</b><small>s</small>`;}
    if(txt!==ltLast){ltLast=txt;$('lt').innerHTML=txt;$('lt').style.display=txt?'inline-flex':'none';}}
  if(beacon.visible&&state!=='menu'){const d=dests[destIdx];const a=Math.atan2(-(d.z-player.position.z),d.x-player.position.x);camera.getWorldDirection(tmp);const ch=Math.atan2(-tmp.z,tmp.x);
    $('arrow').style.transform=`rotate(${-(a-ch)*180/PI}deg)`;$('cdist').textContent=`${Math.round(Math.hypot(d.x-player.position.x,d.z-player.position.z))} m`;}else if(exam&&state!=='menu'){$('cdist').textContent='📝 '+(exam.short||'');}else if(mission&&state!=='menu'&&uiT===6){$('cdist').textContent=mission.e+' '+progress().txt;}
  if(state==='walk')updWalk(dt,t);delivUpdate(dt);updRain(dt);if(state!=='paused')updPeds(dt,t);v13Update(dt,t);updBlood(dt);updHP(dt);eggsUpdate(dt,t);v15Update(dt,t);
  if(state==='ride'||state==='crash'||state==='walk'||state==='foot')updMissionUI();
  drawGauge();
  updAudio(t);
  renderer.render(scene,camera);}
function updAudio(t){if(!AC)return;const n=AC.currentTime,k=muted?0:1;
  windG.gain.setTargetAtTime(k*Math.min(.3,Math.pow(v/20,2)*.35),n,.15);windF.frequency.setTargetAtTime(350+v*60,n,.2);
  rollG.gain.setTargetAtTime(k*(v>.2?.03+v*.01:0),n,.1);
  squealG.gain.setTargetAtTime(k*(braking&&v>.8&&state==='ride'?.06*Math.min(1,v/4):0),n,.03);squealOsc.frequency.setTargetAtTime(2300+Math.sin(t*38)*70,n,.01);
  let best=1e9,bv=0;if(drive!=='bike'){best=0;bv=v*.6;}else for(const c of cars){const d=c.pos.distanceTo(player.position);if(d<best){best=d;bv=c.v;}}
  engG.gain.setTargetAtTime(k*(best<35?.1*(1-best/35):0),n,.1);engOsc.frequency.setTargetAtTime(45+bv*5,n,.1);engF.frequency.setTargetAtTime(200+bv*25,n,.1);}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);checkOrient();});
window.__lic=LIC;window.__job=JOB;window.__orders=orders;window.__ach=ACH;window.__rate=rateJob;window.__peds=()=>peds.filter(p=>p.alive).map(p=>p.st);window.__hp=()=>hp;window.__ri=()=>roadInfo(player.position.x,player.position.z);window.__setV=x=>{v=x};window.__hurt=hurt;window.__deliv=()=>({offer:!!offer,orders:orders.map(o=>o.phase+':'+Math.round(o.t)+'/'+o.lim),walk:walk&&walk.ph,act:$('act').style.display,coins});window.__acceptOffer=()=>{if(offer)$('ofOk').dispatchEvent(new Event('pointerdown'));};window.__tp=(p)=>{player.position.set(p.x,0,p.z);};window.__tgt=()=>{const o=orders[0];return o&&tgtOf(o).park;};window.__exam=()=>exam;window.__dbg=()=>({x:+player.position.x.toFixed(1),z:+player.position.z.toFixed(1),kmh:Math.round(v*3.6),st:Math.round(stamina),cars:cars.length,state,heading:+heading.toFixed(2),viol:stats.viol,legal:stats.legal,near:stats.near});
// start
player.position.set(25,0,8);heading=0;
for(let i=0;i<10;i++)spawnCar();
checkOrient();applyEquip();newMission();frame();
})();
