/* AMAZAKI ARCHIVE v1.6.2 — motion-on-view, non-blocking progressive enhancement.
   CSS keeps content visible by default; no observer / script / reduced-motion = readable text. */
(()=>{'use strict';
 const TYPES=Object.freeze({'右から登場':'right','下から浮上':'rise'});
 let observer=null;
 const reduce=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
 function play(node,motion){
  const type=TYPES[motion];if(!node||!type||reduce())return node;
  node.dataset.entryMotion=type;
  node.classList.remove('entry-reveal-run');
  // Replay an opening dialog. In a normal document this is called only once per item.
  void node.offsetWidth;
  node.classList.add('entry-reveal-run');
  return node;
 }
 function watch(node,motion){
  const type=TYPES[motion];if(!node||!type||reduce())return node;
  node.dataset.entryMotion=type;
  // Never set opacity:0 while waiting for an observer: readable even on browser bugs.
  if(!('IntersectionObserver' in window)){return play(node,motion)}
  try{
   if(!observer)observer=new IntersectionObserver(entries=>{
    for(const entry of entries){if(!entry.isIntersecting)continue;
     observer.unobserve(entry.target);
     play(entry.target,entry.target.dataset.entryMotion==='right'?'右から登場':'下から浮上');
    }
   },{threshold:0.08,rootMargin:'0px 0px -7% 0px'});
   observer.observe(node);
  }catch(e){console.warn('本文アニメーションを通常表示に切り替えました',e);play(node,motion)}
  return node;
 }
 function forget(root){
  if(!observer||!root)return;
  root.querySelectorAll?.('[data-entry-motion]').forEach(el=>observer.unobserve(el));
 }
 window.AmazakiEntryReveal=Object.freeze({watch,play,forget});
})();
