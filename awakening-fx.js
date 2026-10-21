/* REJECT — filmic cosmic-horror awakening. Canvas 2D + CSS. No media, external scripts or audio. */
(()=>{'use strict';
const motionOK=()=>!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let playing=false;
const wait=ms=>new Promise(done=>setTimeout(done,ms));
function visual(){
 const overlay=document.createElement('div');overlay.className='reject-sequence';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','覚醒演出 — 再生の解放（リジェクト）');
 overlay.innerHTML=`<canvas class="reject-particles" aria-hidden="true"></canvas><div class="reject-vortex" aria-hidden="true"></div><div class="reject-rune-wheel" aria-hidden="true">✧　◈　✦　◌　⌁　⟡　◈　✧</div><div class="reject-seal" aria-hidden="true"></div><div class="reject-portrait"><img src="assets/portrait-awakened-effect.webp" alt=""></div><div class="reject-veil" aria-hidden="true"></div><div class="reject-titles" aria-live="off"><p class="reject-counter">SIGNAL 000 / ENTITY UNKNOWN</p><h2 class="reject-en" data-title="AWAKENING">AWAKENING</h2><p class="reject-jp">— <ruby>再生の解放<rp>（</rp><rt>リジェクト</rt><rp>）</rp></ruby>。—</p></div><button class="reject-skip" type="button">SKIP ↗ <span class="visually-hidden">演出をスキップ</span></button>`;
 document.body.appendChild(overlay);
 return overlay;
}
function particles(canvas,overlay){
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return()=>{};
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 let width=0,height=0,dpr=1,frame=0,raf=0,live=true;
 const count=Math.min(195,Math.max(65,Math.floor(innerWidth*innerHeight/5900)));
 const points=Array.from({length:count},(_,i)=>({angle:Math.random()*Math.PI*2,r:Math.random(),speed:0.3+Math.random()*0.7,side:i%3===0?-1:1,phase:Math.random()*Math.PI*2}));
 const resize=()=>{dpr=Math.min(1.6,devicePixelRatio||1);width=window.innerWidth;height=window.innerHeight;canvas.width=Math.max(1,Math.round(width*dpr));canvas.height=Math.max(1,Math.round(height*dpr));ctx.setTransform(dpr,0,0,dpr,0,0)};
 resize();window.addEventListener('resize',resize,{passive:true});
 function draw(t){if(!live)return;raf=requestAnimationFrame(draw);if(reduced||++frame%2===1)return;
  const age=Number(overlay.dataset.age||0);ctx.clearRect(0,0,width,height);let cx=width/2,cy=height/2;
  for(const p of points){const a=p.angle+t*.00015*p.speed;const radius=(.04+.65*p.r)*Math.hypot(width,height)*.55;const x=cx+Math.cos(a)*radius;const y=cy+Math.sin(a)*radius*.65;const alpha=.13+(.44*(1-p.r))*Math.min(1,age/.25);ctx.beginPath();ctx.fillStyle=p.side===1?`rgba(200,35,64,${alpha})`:`rgba(73,164,242,${alpha})`;ctx.shadowBlur=14;ctx.shadowColor=p.side===1?'#ea163e':'#5e9df2';ctx.arc(x,y,p.r<.12?2:1.1,0,Math.PI*2);ctx.fill();}
  ctx.shadowBlur=0;
  if(age>.22&&age<.83){let seed=197;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
   for(let branch=0;branch<9;branch++){let x=cx+(rand()-.5)*width*.12,y=cy+(rand()-.5)*height*.12;ctx.beginPath();ctx.moveTo(x,y);
    for(let i=0;i<12;i++){x+=(rand()-.5)*Math.min(130,width*.1);y+=(rand()-.5)*Math.min(120,height*.1);ctx.lineTo(x,y)}
    ctx.strokeStyle=branch%2?'rgba(108,171,255,.5)':'rgba(244,36,74,.65)';ctx.lineWidth=branch%2?1.2:1.8;ctx.shadowColor=branch%2?'#5d9cfe':'#f02351';ctx.shadowBlur=13;ctx.stroke();}ctx.shadowBlur=0;
  }
 }
 raf=requestAnimationFrame(draw);
 return()=>{live=false;cancelAnimationFrame(raf);window.removeEventListener('resize',resize)};
}
async function play({onReveal}={}){
 if(playing)return false;playing=true;let overlay=null,stopped=()=>{},done=false,completed=false;const reveal=()=>{if(completed)return;completed=true;try{onReveal?.()}catch(e){console.error(e)}};
 if(!motionOK()){reveal();playing=false;return true}
 try{
  overlay=visual();const button=overlay.querySelector('.reject-skip');const previousFocus=document.activeElement;
  let resolveSkip;const skipped=new Promise(resolve=>resolveSkip=resolve);
  button.addEventListener('click',()=>{reveal();resolveSkip(true)},{once:true});
  button.focus({preventScroll:true});document.body.classList.add('reject-in-progress');
  stopped=particles(overlay.querySelector('canvas'),overlay);
  const start=performance.now();let alive=true;
  const phaseTick=()=>{if(!alive||!overlay?.isConnected)return;const age=Math.min(1,(performance.now()-start)/3680);overlay.dataset.age=age.toFixed(3);let phase=age<.20?'signal':age<.48?'fracture':age<.70?'reject':'manifest';overlay.dataset.phase=phase;requestAnimationFrame(phaseTick)};
  requestAnimationFrame(phaseTick);
  const script=async()=>{
   overlay.classList.add('is-live');await wait(560);overlay.classList.add('fracture');await wait(1000);overlay.classList.add('unsealed');await wait(720);reveal();overlay.classList.add('revealed');await wait(1180);return true;
  };
  await Promise.race([script(),skipped]);alive=false;reveal();overlay.classList.add('finishing');await wait(260);
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  return true;
 }finally{stopped();overlay?.remove();document.body.classList.remove('reject-in-progress');playing=false}
}
window.AmazakiAwakeningFX={play,isPlaying:()=>playing};
})();
