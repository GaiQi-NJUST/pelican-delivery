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
