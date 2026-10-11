'use strict';
// ── js/entities/pelican.js ──
// 鹈鹕：骑行模型、腿部 IK、喉囊、服饰配件 outfit
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
