/* AMAZAKI v1.6: public awakening visibility. Defaults to HIDDEN unless confirmed by the DB. */
(()=>{'use strict';
let cache={public:false,effect:false,ok:false},inflight=null;
const safeOrigin=()=>{const c=window.AMASAKI_SUPABASE||{};try{const u=new URL(c.url);return u.protocol==='https:'&&u.hostname.endsWith('.supabase.co')&&/^sb_publishable_[\w-]+$/.test(c.publishableKey||'')?{url:u.origin,key:c.publishableKey}:null}catch{return null}};
async function read({fresh=false}={}){
 if(inflight&&!fresh)return inflight;
 const cfg=safeOrigin();if(!cfg){cache={public:false,effect:false,ok:false};return cache}
 const task=(async()=>{
  try{
   const ctl=new AbortController();const timer=setTimeout(()=>ctl.abort(),9000);
   let r;try{r=await fetch(cfg.url+'/rest/v1/site_settings?select=setting_key,enabled&setting_key=in.(awakened_public,awakened_effect)',{headers:{apikey:cfg.key,Accept:'application/json'},cache:'no-store',signal:ctl.signal})}finally{clearTimeout(timer)}
   if(!r.ok)throw Error('site_settings '+r.status);
   const rows=await r.json();if(!Array.isArray(rows))throw Error('Invalid site settings');
   const vis=rows.find(r=>r.setting_key==='awakened_public');const eff=rows.find(r=>r.setting_key==='awakened_effect');
   cache={public:vis?.enabled===true,effect:eff?.enabled!==false,ok:typeof vis?.enabled==='boolean'};
  }catch(error){console.warn('覚醒公開設定を確認できないため非表示にします。',error);cache={public:false,effect:false,ok:false}}
  return cache;
 })();inflight=task;
 try{return await task}finally{if(inflight===task)inflight=null}
}
window.AmazakiAwakeningState={read,get:()=>({...cache}),isPublic:()=>cache.ok&&cache.public};
})();
