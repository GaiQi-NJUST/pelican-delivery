'use strict';
// ── js/main.js ──
// 主循环：frame 调度、调试钩子 window.__*、启动
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
