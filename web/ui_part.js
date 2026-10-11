const ICONSVG=/*ICONS*/;
// ===== UI skin: strip emoji, coin icon =====
const EMO=/(?:(?![©®™])\p{Extended_Pictographic}|\p{Regional_Indicator})(?:\uFE0F|\u20E3|[\u{1F3FB}-\u{1F3FF}])*(?:\u200D\p{Extended_Pictographic}\uFE0F?)*\s?/gu;
const EMO1=/(?:(?![©®™])\p{Extended_Pictographic}|\p{Regional_Indicator})/u;
function cleanText(n){let t=n.nodeValue;if(!EMO1.test(t))return;t=t.replace(/🪪\s?/gu,'驾照 ').replace(/⭐/gu,'★');
  if(t.includes('🪙')&&n.parentNode&&!(n.parentNode.closest&&n.parentNode.closest('canvas,svg'))){const parts=t.split(/🪙\s?/u);const f=document.createDocumentFragment();
    parts.forEach((p,i)=>{if(i){const c=document.createElement('i');c.className='ico i-coin';f.appendChild(c);}f.appendChild(document.createTextNode(p.replace(EMO,'')));});n.parentNode.replaceChild(f,n);return;}
  n.nodeValue=t.replace(EMO,'');}
function cleanTree(root){if(root.nodeType===3){cleanText(root);return;}if(root.nodeType!==1||root.tagName==='SCRIPT'||root.tagName==='STYLE')return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const a=[];while(w.nextNode())a.push(w.currentNode);a.forEach(cleanText);
  if(root.querySelectorAll)root.querySelectorAll('[placeholder]').forEach(e=>e.placeholder=e.placeholder.replace(EMO,''));}
cleanTree(document.body);
new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')cleanText(m.target);else m.addedNodes.forEach(cleanTree);}}).observe(document.body,{subtree:true,childList:true,characterData:true});
// shop & achievement icons
const SHOPICO={vehicle:'bike',eyes:'glasses',neck:'scarf'};const HATICO={helmet:'helmet',straw:'straw',crown:'crown'};
const _rs=renderShop;renderShop=function(){_rs();$('shGrid').querySelectorAll('.item').forEach((d,i)=>{const it=SHOP.filter(s=>s.cat===shopTab)[i];if(!it)return;const ic=d.querySelector('.ic');if(!ic)return;
  const k=it.car?'car':it.moto?'moto':it.kind==='hat'?HATICO[it.id]||'helmet':SHOPICO[it.kind]||'box';ic.innerHTML=`<svg viewBox="0 0 24 24" class="svgi" style="color:${it.col!=null?'#'+it.col.toString(16).padStart(6,'0'):'#ffffff'}">${ICONSVG[k]}</svg>`;});};
const _ra=renderAch;renderAch=function(){_ra();$('achGrid').querySelectorAll('.item').forEach(d=>{const f=d.firstElementChild;if(f)f.innerHTML=`<i class="ico big i-${d.classList.contains('lock')?'lock':'medal'}"></i>`;});};
// slider fill
function rangeFill(r){const p=(r.value-r.min)/(r.max-r.min)*100;r.style.setProperty('--p',p+'%');}
document.querySelectorAll('input[type=range]').forEach(r=>{rangeFill(r);r.addEventListener('input',()=>rangeFill(r));});
// art background behind sub-menus opened from home
setInterval(()=>{const st=$('start');let any=false;document.querySelectorAll('.ov').forEach(o=>{if(o.id!=='start'&&o.id!=='rotate'&&o.style.display==='flex')any=true;});
  const on=state==='menu'&&any&&st.style.display!=='flex';$('menuBg').style.display=on?'block':'none';document.body.classList.toggle('inmenu',on);},120);
// user agreement gate
(function(){let ok=false;try{ok=localStorage.getItem('pel_agree_v1')==='1';}catch(e){}const ov=$('agree');if(ok){ov.style.display='none';return;}
  const ck=$('agCk'),go=$('agGo');$('agTxt').addEventListener('touchmove',e=>e.stopPropagation(),{passive:true});
  ck.addEventListener('change',()=>{go.disabled=!ck.checked;go.style.opacity=ck.checked?1:.45;});
  go.onclick=()=>{if(!ck.checked)return;try{localStorage.setItem('pel_agree_v1','1');}catch(e){}ov.style.display='none';};})();
