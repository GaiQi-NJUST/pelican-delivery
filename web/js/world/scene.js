'use strict';
// ── js/world/scene.js ──
// 场景：renderer/scene/camera、光照天空、雨雪天气
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas:$('gl'),antialias:true});}catch(e){fail('此设备不支持 WebGL');throw new Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,0.1,900);
// ===== lights & sky =====
const hemi=new THREE.HemisphereLight(0xffd6b0,0x4d6b35,.7);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffb066,1.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-14,right:14,top:14,bottom:-14,near:1,far:120});sun.shadow.bias=-.0004;sun.shadow.normalBias=.03;
scene.add(sun);scene.add(sun.target);
scene.background=new THREE.Color(0xf4a76c);scene.fog=new THREE.Fog(0xf4a76c,45,175);
// ===== rain =====
const RN=1400,rainG=new THREE.BufferGeometry(),rainP=new Float32Array(RN*6);rainG.setAttribute('position',new THREE.BufferAttribute(rainP,3));
const rain=new THREE.LineSegments(rainG,new THREE.LineBasicMaterial({color:0xaec4dd,transparent:true,opacity:.55}));rain.frustumCulled=false;rain.visible=false;scene.add(rain);
for(let i=0;i<RN;i++){const x=rnd(-30,30),y=rnd(0,22),z=rnd(-30,30);rainP.set([x,y,z,x+.05,y+.7,z],i*6);}
let rainT=0,fogF0=0;
function updRain(dt){if(rainT<=0){rain.visible=false;return;}rainT-=dt;rain.visible=true;rain.position.set(camera.position.x,0,camera.position.z);
  for(let i=0;i<RN;i++){let y=rainP[i*6+1]-26*dt;if(y<0)y+=22;rainP[i*6+1]=y;rainP[i*6+4]=y+.7;}rainG.attributes.position.needsUpdate=true;
  if(rainT<=0){scene.fog.far=fogF0||scene.fog.far;if(Math.random()<.6)showRainbow();else toast('🌤️ 雨停了');}}
function startRain(){if(rainT>0)return;if(typeof stopSnow==='function')stopSnow();rainT=rnd(60,100);fogF0=fogF0||scene.fog.far;scene.fog.far=Math.min(scene.fog.far,140);toast('🌧️ 突降暴雨！路滑注意刹车 · 雨天补贴 +30%',3200);}
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
