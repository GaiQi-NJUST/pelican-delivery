// ===== visual detail pass: facades, rooftops, trees, plates =====
(function(){
  const AN=renderer.capabilities.getMaxAnisotropy?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;
  const hiTex=(w,h,fn)=>{const t=canvasTex(w,h,fn,true);t.anisotropy=AN;t.needsUpdate=true;return t;};
  // residential facade (neutral, tinted per instance)
  const res2=hiTex(256,512,(x,w,h)=>{x.fillStyle='#f3f1ec';x.fillRect(0,0,w,h);
    for(let i=0;i<1400;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.035})`;x.fillRect(Math.random()*w,Math.random()*h,2,2);}
    const rows=10,rh=(h-56)/rows;
    for(let r=0;r<rows;r++){const y=6+r*rh;x.fillStyle='rgba(0,0,0,.10)';x.fillRect(0,y+rh-5,w,4);x.fillStyle='rgba(255,255,255,.6)';x.fillRect(0,y+rh-6,w,1.5);
      for(let c=0;c<4;c++){const wx=12+c*61,wy=y+8,ww=40,wh=rh-22;
        x.fillStyle='#d9d6cf';x.fillRect(wx-3,wy-3,ww+6,wh+6);
        const lit=Math.random()<.22;const g=x.createLinearGradient(wx,wy,wx+ww,wy+wh);
        if(lit){g.addColorStop(0,'#ffe9b0');g.addColorStop(1,'#f3c871');}else{g.addColorStop(0,'#8fb3cc');g.addColorStop(.55,'#4f6f88');g.addColorStop(1,'#3b556b');}
        x.fillStyle=g;x.fillRect(wx,wy,ww,wh);
        x.fillStyle='rgba(255,255,255,.28)';x.beginPath();x.moveTo(wx+4,wy+wh);x.lineTo(wx+ww*.45,wy);x.lineTo(wx+ww*.62,wy);x.lineTo(wx+ww*.17,wy+wh);x.fill();
        x.fillStyle='#e8e5df';x.fillRect(wx+ww/2-1.5,wy,3,wh);x.fillRect(wx,wy+wh*.38,ww,2.5);
        if(c%2===1){x.fillStyle='rgba(60,60,60,.55)';for(let k=0;k<ww+10;k+=5)x.fillRect(wx-5+k,wy+wh*.55,1.6,wh*.45+3);x.fillRect(wx-6,wy+wh*.55,ww+12,2.5);x.fillRect(wx-6,wy+wh+2,ww+12,3);}
        else if(Math.random()<.5){x.fillStyle='#e9e9e6';x.fillRect(wx+ww+4,wy+wh-12,11,10);x.fillStyle='#9a9a96';x.fillRect(wx+ww+6,wy+wh-10,7,6);}
        if(!lit&&Math.random()<.35){x.fillStyle=pick(['#c96b5a','#e2b65b','#7d9c6b','#d8d0c0']);x.fillRect(wx+2,wy+2,ww*.3,wh-4);}}}
    x.fillStyle='#b9b1a6';x.fillRect(0,h-50,w,50);x.fillStyle='#6d5d4c';x.fillRect(w/2-18,h-46,36,46);x.fillStyle='#9cc0d6';x.fillRect(w/2-14,h-42,28,26);
    x.fillStyle='#d24a3a';x.fillRect(w/2-20,h-50,40,5);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,h-52,w,3);});
  resB.material.map=res2;resB.material.color.set(0xffffff);resB.material.roughness=.75;resB.material.needsUpdate=true;
  // shop front
  const shop2=hiTex(256,256,(x,w,h)=>{x.fillStyle='#efe8dc';x.fillRect(0,0,w,h);
    x.fillStyle='#e2d9ca';for(let y=0;y<h;y+=12)x.fillRect(0,y,w,1);
    x.fillStyle='#3a3f45';x.fillRect(10,104,236,146);
    const g=x.createLinearGradient(0,108,0,246);g.addColorStop(0,'#bcd6e4');g.addColorStop(1,'#6f93a8');x.fillStyle=g;x.fillRect(16,110,224,134);
    x.fillStyle='rgba(255,240,200,.55)';x.fillRect(22,170,70,60);x.fillRect(164,170,70,60);
    x.fillStyle='rgba(255,255,255,.35)';x.beginPath();x.moveTo(30,244);x.lineTo(90,110);x.lineTo(112,110);x.lineTo(52,244);x.fill();
    x.fillStyle='#3a3f45';[96,160].forEach(v=>x.fillRect(v,110,5,134));x.fillRect(16,160,224,4);
    x.fillStyle='#2b2f33';x.fillRect(103,140,54,104);x.fillStyle='#9ec3d8';x.fillRect(107,144,22,96);x.fillRect(131,144,22,96);x.fillStyle='#d8d8d8';x.fillRect(126,186,3,18);x.fillRect(131,186,3,18);
    x.fillStyle='#8b7f70';x.fillRect(0,246,w,10);
    x.fillStyle='#d9cfbf';for(let c=0;c<3;c++){x.fillRect(22+c*80,18,58,58);}x.fillStyle='#7896aa';for(let c=0;c<3;c++)x.fillRect(27+c*80,23,48,48);});
  shopB.material.map=shop2;shopB.material.needsUpdate=true;
  const awT=hiTex(128,32,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#ffffff':'#c9c9c9';x.fillRect(i*16,0,16,h);}x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,h-4,w,4);});
  awnB.material.map=awT;awnB.material.needsUpdate=true;
  roofB.material.color.set(0x8c857c);
  // rooftop props
  const acG=new THREE.BoxGeometry(1,1,1),tankG=new THREE.CylinderGeometry(.5,.5,1,14);
  const acB=new THREE.InstancedMesh(acG,M(0xd6d6d2,{roughness:.6,metalness:.2}),NPOI*2),tankB=new THREE.InstancedMesh(tankG,M(0x9fb4c4,{roughness:.4,metalness:.5}),NPOI),stairB=new THREE.InstancedMesh(acG,M(0xbdb5aa,{roughness:.85}),NPOI);
  [acB,tankB,stairB].forEach(m=>{m.castShadow=true;m.count=0;scene.add(m);});
  for(let i=0;i<NPOI;i++)resB.setColorAt(i,new THREE.Color(0xffffff));resB.instanceColor.needsUpdate=true;resB.material.needsUpdate=true;
  const _up=updPOI;
  updPOI=function(px,pz){const b0=poiBI,b1=poiBJ;_up(px,pz);if(b0===poiBI&&b1===poiBJ)return;let na=0,nt=0,ns=0,nr=0;
    for(const p of curPOI){const h=hash(p.ctr.x*.13,p.ctr.z*.17);
      if(!p.shop){if(nr<NPOI){resB.setColorAt(nr,new THREE.Color().setHSL(.05+h*.55,.18+h*.15,.82+h*.08));nr++;}
        const top=p.ht+.65,alongX=p.n.z!==0,sx=alongX?p.w:p.d,sz=alongX?p.d:p.w;
        if(nt<NPOI){dummy.rotation.set(0,0,0);dummy.position.set(p.ctr.x+sx*.22,top+.9,p.ctr.z-sz*.2);dummy.scale.set(1.6,1.8,1.6);dummy.updateMatrix();tankB.setMatrixAt(nt++,dummy.matrix);}
        if(ns<NPOI){dummy.position.set(p.ctr.x-sx*.25,top+.9,p.ctr.z+sz*.18);dummy.scale.set(2.4,1.8,2.2);dummy.updateMatrix();stairB.setMatrixAt(ns++,dummy.matrix);}
        for(let k=0;k<2&&na<NPOI*2;k++){dummy.position.set(p.ctr.x+(k?-.15:.25)*sx,top+.35,p.ctr.z+(k?-.3:.3)*sz);dummy.scale.set(1.1,.7,.8);dummy.updateMatrix();acB.setMatrixAt(na++,dummy.matrix);}}
      else if(na<NPOI*2){const alongX=p.n.z!==0,sx=alongX?p.w:p.d,sz=alongX?p.d:p.w;dummy.rotation.set(0,0,0);dummy.position.set(p.ctr.x+sx*.2,p.ht+.55,p.ctr.z);dummy.scale.set(1.2,.75,.9);dummy.updateMatrix();acB.setMatrixAt(na++,dummy.matrix);}}
    acB.count=na;tankB.count=nt;stairB.count=ns;[acB,tankB,stairB].forEach(m=>m.instanceMatrix.needsUpdate=true);if(resB.instanceColor)resB.instanceColor.needsUpdate=true;};
  poiBI=1e9;
  // fluffier trees: clustered canopy
  function merge(list){let n=0;list.forEach(g=>n+=g.attributes.position.count);const pos=new Float32Array(n*3),nor=new Float32Array(n*3);let o=0;
    list.forEach(g=>{pos.set(g.attributes.position.array,o*3);nor.set(g.attributes.normal.array,o*3);o+=g.attributes.position.count;});
    const r=new THREE.BufferGeometry();r.setAttribute('position',new THREE.BufferAttribute(pos,3));r.setAttribute('normal',new THREE.BufferAttribute(nor,3));return r;}
  const parts=[[0,0,0,.85],[.5,-.15,.25,.6],[-.45,-.2,-.2,.62],[.1,.45,-.1,.58],[-.15,-.3,.5,.55],[.2,-.25,-.5,.55]].map(([a,b,c,s])=>{const g=new THREE.IcosahedronGeometry(s,1);
    const p=g.attributes.position;for(let i=0;i<p.count;i++){const k=1+(Math.sin(p.getX(i)*13+p.getY(i)*7+p.getZ(i)*5)*.08);p.setXYZ(i,p.getX(i)*k+a,p.getY(i)*k+b,p.getZ(i)*k+c);}g.computeVertexNormals();return g;});
  treeTop.geometry=merge(parts);treeTrunk.geometry=new THREE.CylinderGeometry(.12,.2,1,8);
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
