'use strict';
// ── js/core/utils.js ──
// 核心工具：环境自检、DOM/几何/纹理 helpers
'use strict';
const $=id=>document.getElementById(id);
function fail(m){const e=$('err');e.textContent=m;e.style.display='flex';}
if(!window.THREE){fail('three.js 加载失败，请检查网络后刷新');throw new Error('THREE missing');}
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
