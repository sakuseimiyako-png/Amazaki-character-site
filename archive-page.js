(()=>{'use strict';
const $=s=>document.querySelector(s);
const LABELS={world:['WORLD ARCHIVE','世界観','world'],item:['EQUIPMENT ARCHIVE','異能道具','arsenal'],ability:['ABILITY ARCHIVE','能力','arsenal'],technique:['TECHNIQUE ARCHIVE','使用技','arsenal'],relation:['RELATION ARCHIVE','関係','archive'],history:['CHRONICLE ARCHIVE','都での歴史','archive']};
const ALIASES={equipment:'item',abilities:'ability',techniques:'technique',relations:'relation'};
const args=new URLSearchParams(location.search),input=args.get('section')||'world',section=LABELS[input]?input:(ALIASES[input]||'world');
const requestedForm=args.get('form')==='awakened'?'awakened':'normal';let form='normal',awakeningAllowed=false;const hasForm=['item','ability','technique'].includes(section);
const safe=window.AmasakiSafeHTML;
const asset=s=>'assets/'+encodeURIComponent(s||'');
const sectionKey=s=>s+':normal';
let localData=null,cloudRows=[],remoteSections=new Set(),cloudOK=false,query='';
function cloudConfig(){const c=window.AMASAKI_SUPABASE||{};try{const u=new URL(c.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co'))return null;if(!/^sb_publishable_[\w-]+$/.test(c.publishableKey||''))return null;return {url:u.origin,key:c.publishableKey}}catch{return null}}
function cloudImage(row,def){if(row.previewImageData?.startsWith('data:image/webp;base64,'))return row.previewImageData;const c=cloudConfig(),name=row.image_path||'';return c&&/^images\/[\w.-]+\.(?:webp|png|jpe?g)$/.test(name)?c.url+'/storage/v1/object/public/entry-images/'+name:asset(def)}
const htmlPlain=t=>safe.plainHtml(t||'');
function legacyRows(){if(!localData)return[];
 const list={item:'equipment',ability:'abilities',technique:'techniques',relation:'relations',history:'history'}[section];
 if(section==='world'){return[{title:localData.world?.title||'世界観',body:htmlPlain(localData.world?.body||''),image:''}]}
 return (localData[list]||[]).filter(x=>section!=='item'||!x.form||x.form===form).map(x=>({title:x.name||x.title||'無題',body:htmlPlain(section==='ability'?(x[form]||x.normal||''):x.body),image:x.image?asset(x.image):''}));
}
function currentRows(){
 const managed=cloudOK&&(remoteSections.has(section+':'+(hasForm?form:'normal'))||cloudRows.some(x=>x.category===section&&x.form===(hasForm?form:'normal')));
 if(!managed)return legacyRows();
 return cloudRows.filter(x=>x.category===section&&x.form===(hasForm?form:'normal')).sort((a,b)=>(a.sort_order??0)-(b.sort_order??0)).map(r=>({title:r.title,body:safe.richHtml(r.body),image:(r.image_path?cloudImage(r,section==='item'?'background-equipment.jpg':'background-history.png'):'')}));
}
function updateURL(){if(!awakeningAllowed)form='normal';document.querySelectorAll('a[data-preserve-form]').forEach(a=>{a.href='archive.html?section='+a.dataset.preserveForm+'&form='+form});if(location.protocol==='about:')return;const u=new URL(location.href);u.searchParams.set('section',section);if(hasForm)u.searchParams.set('form',form);else u.searchParams.delete('form');history.replaceState(null,'',u.pathname+u.search+u.hash)}
function render(){
 const rows=currentRows().filter(r=>(r.title+' '+r.body.replace(/<[^>]+>/g,' ')).toLocaleLowerCase().includes(query.toLocaleLowerCase()));
 const box=$('#fullRecords');box.replaceChildren();$('#archiveCount').textContent=rows.length+' RECORDS';
 if(!rows.length){const n=document.createElement('p');n.className='archive-status';n.textContent=query?'検索条件に一致する記事はありません。':'公開されている記録はありません。';box.append(n);return}
 rows.forEach((r,i)=>{
  const card=document.createElement('article');card.className='full-record';card.id='record-'+(i+1);
  if(r.image){const media=document.createElement('div');media.className='full-record-media';media.dataset.ratio=hasForm?'item':'wide';media.style.backgroundImage='url("'+r.image+'")';media.setAttribute('role','img');media.setAttribute('aria-label',r.title+'の画像');card.append(media)}
  const body=document.createElement('div');body.className='full-record-body';
  const number=document.createElement('small');number.className='full-record-index';number.textContent='ARCHIVE #'+String(i+1).padStart(2,'0');
  const h=document.createElement('h2');h.textContent=r.title;const rich=document.createElement('div');rich.className='entry-rich';rich.innerHTML=r.body;body.append(number,h,rich);card.append(body);box.append(card)
 });
}
function menu(){const host=$('#menuItems');const groups=[['MAIN / メイン','index.html#main'],['CHARACTER PROFILE / キャラクター説明','index.html#character'],['WORLD / 世界観','archive.html?section=world'],['異能道具','archive.html?section=item'],['能力','archive.html?section=ability'],['使用技','archive.html?section=technique'],['関係','archive.html?section=relation'],['都での歴史','archive.html?section=history']];
 groups.forEach(([label,href])=>{const link=document.createElement('a');link.className='menu-link';const target=href.includes('section=')?href.split('section=')[1].split('&')[0]:null;if(['item','ability','technique'].includes(target)){link.dataset.preserveForm=target;link.href=href+'&form='+form}else link.href=href;link.textContent=label;host.append(link)});
 const btn=$('#menuToggle'),nav=$('#menu');btn.onclick=()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);nav.setAttribute('aria-hidden',String(!open));btn.setAttribute('aria-expanded',String(open));btn.classList.toggle('active',open);document.body.classList.toggle('locked',open)};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');document.body.classList.remove('locked')}})
}
async function load(){
 try{const r=await fetch('data/content.json',{cache:'no-store'});if(!r.ok)throw Error('元データ取得不可');localData=await r.json()}catch(e){console.error(e)}
 render();const cfg=cloudConfig();if(!cfg){$('#archiveStatus').textContent='オフラインの初期記録を表示しています。';return}
 try{const [a,b]=await Promise.all([
  fetch(cfg.url+'/rest/v1/site_entries?select=id,category,form,title,body,image_path,sort_order,published&published=eq.true&order=sort_order.asc,created_at.asc&limit=1000',{headers:{apikey:cfg.key,Accept:'application/json'}}),
  fetch(cfg.url+'/rest/v1/site_section_state?select=section_key,active&active=eq.true',{headers:{apikey:cfg.key,Accept:'application/json'}})
 ]);if(!a.ok||!b.ok)throw Error('データベース取得失敗');const entries=await a.json(),states=await b.json();if(!Array.isArray(entries)||!Array.isArray(states))throw Error('DB形式不正');cloudRows=entries.filter(r=>r.title!=='__AMASAKI_DB_READY__');remoteSections=new Set(states.map(s=>s.section_key));cloudOK=true;$('#archiveStatus').textContent='公開済みの記録を表示中';render();}
 catch(e){console.warn(e);$('#archiveStatus').textContent='最新記事の取得に失敗しました。初期記録のみ表示中です。時間をおいて再読み込みしてください。'}
}
async function start(){
 const visibility=await window.AmazakiAwakeningState.read();awakeningAllowed=visibility.ok&&visibility.public;form=awakeningAllowed?requestedForm:'normal';
 document.querySelectorAll('[data-form="awakened"]').forEach(b=>{b.hidden=!awakeningAllowed;b.disabled=!awakeningAllowed});
 if(hasForm&&requestedForm==='awakened'&&!awakeningAllowed)updateURL();
 const [en,jp,anchor]=LABELS[section];$('#archiveTitle').textContent=en;$('#archiveCode').textContent=jp+' / COMPLETE RECORD';$('#backOverview').href='index.html#'+anchor;document.title=jp+'（全文） | AMAZAKI ARCHIVE';
 $('#formWrap').hidden=!hasForm;
 document.querySelectorAll('[data-form]').forEach(b=>{b.classList.toggle('selected',b.dataset.form===form);b.onclick=()=>{if(b.dataset.form==='awakened'&&!awakeningAllowed)return;form=b.dataset.form;document.querySelectorAll('[data-form]').forEach(x=>x.classList.toggle('selected',x.dataset.form===form));updateURL();render()}});
 $('#fullSearch').addEventListener('input',e=>{query=e.target.value.trim();render()});menu();load()
}
start();
})();
