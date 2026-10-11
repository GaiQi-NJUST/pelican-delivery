'use strict';
// ── js/world/road.js ──
// 道路：地面/路口网格、中国式路段、世界对象池环绕
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
let segNI=1e9,segNJ=1e9;
function updSegs(ni,nj){if(ni===segNI&&nj===segNJ)return;segNI=ni;segNJ=nj;let k=0;for(let a=-2;a<=2;a++)for(let b=-2;b<=2;b++){segX[k].position.set((ni+a)*B+B/2,.012,(nj+b)*B);segZ[k].position.set((ni+a)*B,.012,(nj+b)*B+B/2);k++;}updSchools(ni,nj);}
function roadInfo(x,z){const nx=Math.round(x/B)*B,nz=Math.round(z/B)*B,rx=x-nx,rz=z-nz;if(Math.abs(rx)<R&&Math.abs(rz)<R)return {inter:true};
  if(Math.abs(rz)<RH)return {ax:0,along:x-Math.floor(x/B)*B,line:nz,lat:rz};if(Math.abs(rx)<RH)return {ax:1,along:z-Math.floor(z/B)*B,line:nx,lat:rx};return {off:true};}
function nearUturn(){const r=roadInfo(player.position.x,player.position.z);return r.along!=null&&Math.abs(r.along-B/2)<8;}
