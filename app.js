(() => {"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));let data,original,form='normal',tab='equipment',archive='relations',slide=0,interval=null,sliding=false,remoteEntries=[],remoteSections=new Set(),previewRecord=null,bootReady=false;const imgs=['slide-1.png','slide-2.png','slide-3.png','slide-4.png','slide-5.png'];const menu=[{name:'MAIN',jp:'メイン',id:'main'},{name:'CHARACTER',jp:'キャラクター説明',id:'character'},{name:'WORLD',jp:'世界観',id:'world'},{name:'ARSENAL',jp:'異能道具・能力・使用技',id:'arsenal',children:[['異能道具','equipment'],['能力','abilities'],['使用技','techniques']]},{name:'ARCHIVE',jp:'関係・都での歴史',id:'archive',children:[['関係','relations'],['都での歴史','history']]}];
const clean=s=>String(s??'');const escape=s=>clean(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const asset=s=>'assets/'+encodeURIComponent(s||'');const txt=(el,s)=>{el.textContent=clean(s)};
async function boot(){try{let resp=await fetch('data/content.json');if(!resp.ok)throw Error('JSONを取得できません');original=await resp.json();try{data=JSON.parse(localStorage.getItem('amasaki-content-v1')||'null')||structuredClone(original)}catch{data=structuredClone(original)}renderAll();bootReady=true;loadCloudEntries();if(new URLSearchParams(location.search).has('amasaki_preview')&&window.parent!==window)window.parent.postMessage({type:'AMASAKI_PREVIEW_READY_V14'},location.origin);}catch(e){console.error(e);txt($('#worldBody'),'データを取得できません。ローカルサーバー経由で開いてください。');}if(new URLSearchParams(location.search).has('amasaki_preview')){$('#loader').remove();}else setupLoader()}
function setupLoader(){let loader=$('#loader'),video=$('#loaderVideo'),finished=false;function hide(){if(finished)return;finished=true;loader.classList.add('hide');setTimeout(()=>{video.pause();loader.remove()},900)}$('#skipLoad').onclick=hide;video.addEventListener('ended',hide,{once:true});video.addEventListener('error',hide,{once:true});setTimeout(hide,6500)}
function toggleMenu(open){$('#menu').classList.toggle('open',open);$('#menu').setAttribute('aria-hidden',String(!open));$('#menuToggle').classList.toggle('active',open);$('#menuToggle').setAttribute('aria-expanded',String(open));document.body.classList.toggle('locked',open)}function navigate(id){toggleMenu(false);$('#'+id)?.scrollIntoView({behavior:'smooth'});}
function renderMenu(){let box=$('#menuItems');box.innerHTML='';menu.forEach(m=>{let wrap=document.createElement('div');wrap.className='menu-group';let b=document.createElement('button');b.className='menu-link';b.innerHTML='<span>'+m.name+' <small>'+m.jp+'</small></span><span>'+ (m.children?'＋':'↗')+'</span>';b.onclick=()=>{if(m.children){wrap.classList.toggle('expanded')}else{navigate(m.id)}};wrap.append(b);if(m.children){let sub=document.createElement('div');sub.className='menu-sub';m.children.forEach(([jp,key])=>{let s=document.createElement('button');txt(s,jp);s.onclick=()=>{if(m.id==='arsenal'){tab=key;$$('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));renderArsenal()}else{archive=key;$$('.archive-tab').forEach(x=>x.classList.toggle('active',x.dataset.archive===archive));renderArchive()}navigate(m.id)};sub.append(s)});wrap.append(sub)}box.append(wrap)})}
function showSlide(i){slide=(i+imgs.length)%imgs.length;$('#slideLayer').style.backgroundImage='url("'+asset(imgs[slide])+'")';$$('#slideDots button').forEach((b,j)=>b.classList.toggle('active',j===slide));txt($('#heroQuote'),data.quotes[slide%data.quotes.length]||'物語の終幕へ');}function startSlides(){clearInterval(interval);interval=setInterval(()=>{if(!document.hidden&&!$('#menu').classList.contains('open'))showSlide(slide+1)},Math.max(2500,Number(data.site?.slideIntervalMs)||5000))}function renderSlides(){let d=$('#slideDots');d.innerHTML='';imgs.forEach((_,i)=>{let b=document.createElement('button');b.setAttribute('aria-label','スライド '+(i+1));b.onclick=()=>{showSlide(i);startSlides()};d.append(b)});showSlide(slide);startSlides()}
function renderProfile(){txt($('#profileDetails'),'');let p=data.profile;let box=$('#profileDetails');let rows=[['識別名',p.alias],['出身',p.origin],['年齢',p.age],['身長',p.height],['性別',p.gender],['好きなもの',p.likes]];box.innerHTML='<div class="profile-table">'+rows.map(([n,v])=>'<div class="profile-row"><strong>'+escape(n)+'</strong><span>'+escape(v)+'</span></div>').join('')+'</div>'+ (p.description||[]).map(x=>'<p>'+escape(x)+'</p>').join('');$('#profilePortrait').src=asset(form==='normal'?'portrait-normal.png':'portrait-awakened.png');$('#profileDecoration').src=asset(form==='normal'?'portrait-normal-effect.png':'portrait-awakened-effect.png');$$('.form-switch').forEach(b=>b.classList.toggle('active',b.dataset.form===form))}
// v1.4 -- cloud-controlled sections and true live-page drafts, profile intentionally unchanged.
const CLOUD_CATEGORY={equipment:'item',abilities:'ability',techniques:'technique'};
const CATEGORY_TAB={item:'equipment',ability:'abilities',technique:'techniques'};
const SINGLE_FORM=new Set(['world','relation','history']);
const sectionKey=(category,f)=>category+':'+(SINGLE_FORM.has(category)?'normal':f);
const safe=window.AmasakiSafeHTML;
function cloudConfig(){const c=window.AMASAKI_SUPABASE||{};try{const u=new URL(c.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co'))return null;if(!/^sb_publishable_[\w-]+$/.test(c.publishableKey||''))return null;return {url:u.origin,key:c.publishableKey}}catch{return null}}
async function loadCloudEntries(){
 const cfg=cloudConfig();if(!cfg)return;
 try{
  const [a,b]=await Promise.all([
   fetch(cfg.url+'/rest/v1/site_entries?select=id,category,form,title,body,image_path,sort_order,published&published=eq.true&order=sort_order.asc,created_at.asc&limit=1000',{headers:{apikey:cfg.key,Accept:'application/json'}}),
   fetch(cfg.url+'/rest/v1/site_section_state?select=section_key,active&active=eq.true',{headers:{apikey:cfg.key,Accept:'application/json'}})
  ]);
  if(!a.ok||!b.ok)throw Error('公開データ読み込み不可: '+a.status+'/'+b.status);
  const entries=await a.json(),sections=await b.json();
  if(!Array.isArray(entries)||!Array.isArray(sections))throw Error('公開データの形式が不正');
  remoteEntries=entries.filter(r=>r.title!=='__AMASAKI_DB_READY__');
  remoteSections=new Set(sections.map(r=>r.section_key));
  renderWorld();renderArsenal();renderArchive();
 }catch(e){console.warn('Supabase取得失敗、既存の画面を保持します',e)}
}
function isRemote(cat,f){return remoteSections.has(sectionKey(cat,f))||remoteEntries.some(r=>r.category===cat&&r.form===f)||Boolean(previewRecord?.category===cat&&previewRecord?.form===f)}
function publicRows(cat,f){
 let rows=remoteEntries.filter(r=>r.category===cat&&r.form===f);
 if(previewRecord?.category===cat&&previewRecord?.form===f){rows=rows.filter(r=>r.id!==previewRecord.id);rows.push(previewRecord)}
 return rows.sort((a,b)=>(a.sort_order??0)-(b.sort_order??0));
}
function cloudImage(row,defaultAsset){
 if(row.previewImageData?.startsWith('data:image/webp;base64,'))return row.previewImageData;
 const cfg=cloudConfig(),name=row.image_path||'';
 if(cfg&&/^images\/[A-Za-z0-9._-]+\.(?:webp|png|jpe?g)$/.test(name))return cfg.url+'/storage/v1/object/public/entry-images/'+name;
 return asset(defaultAsset);
}
function bodyElement(row){const div=document.createElement('div');div.className='entry-rich';div.innerHTML=safe.richHtml(row.body);if(['右から登場','下から浮上'].includes(row.body?.animation))div.setAttribute('aria-label',row.body.animation);return div}
function renderWorld(){
 const title=$('#worldTitle'),body=$('#worldBody'),shell=$('.world-content');shell.querySelectorAll('.world-entry-extra,.world-cover').forEach(e=>e.remove());
 const foot=shell.querySelector('.footnote');
 if(!isRemote('world','normal')){txt(title,data.world.title);txt(body,data.world.body);title.hidden=false;body.hidden=false;foot.hidden=false;return}
 foot.hidden=true;body.hidden=true;title.hidden=true;title.textContent='';const rows=publicRows('world','normal');
 if(!rows.length){title.hidden=false;title.textContent='世界観の公開記事はありません。';return}
 rows.forEach((r,i)=>{
  const wrap=document.createElement('article');wrap.className='world-entry-extra';
  if(r.image_path||r.previewImageData){const cover=document.createElement('div');cover.className='world-cover';cover.style.backgroundImage='url("'+cloudImage(r,'background-history.png')+'")';wrap.append(cover)}
  const h=document.createElement('h3');h.textContent=r.title;wrap.append(h,bodyElement(r));shell.append(wrap);
 });
}
function itemsFor(){if(tab==='equipment')return data.equipment.filter(x=>!x.form||x.form===form);return data[tab]||[]}
function renderArsenal(){
 const category=CLOUD_CATEGORY[tab];
 if(!isRemote(category,form)){
  const q=$('#search').value.trim().toLocaleLowerCase();let entries=itemsFor().filter(x=>([x.name,x.body,x.normal,x.awakened].join(' ')).toLocaleLowerCase().includes(q));
  $('#arsenalCards').innerHTML=entries.length?entries.map((x,i)=>'<article class="entry-card"><div class="entry-image" style="background-image:url('+asset(x.image||'background-equipment.jpg')+')"></div><div class="entry-text"><small>ARCHIVE #'+String(i+1).padStart(2,'0')+'</small><h3>'+escape(x.name)+'</h3><p>'+escape(tab==='abilities'?(x[form]||x.normal):x.body)+'</p></div></article>').join(''):'<p>該当する項目はありません。</p>';
  return;
 }
 const list=$('#arsenalCards');list.replaceChildren();const q=$('#search').value.trim().toLocaleLowerCase();
 const rows=publicRows(category,form).filter(r=>(r.title+' '+(r.body?.html||'')).toLocaleLowerCase().includes(q));
 if(!rows.length){const el=document.createElement('p');el.textContent='公開記事はありません。';list.append(el);return}
 rows.forEach((r,i)=>{
  const article=document.createElement('article');article.className='entry-card';
  const cover=document.createElement('div');cover.className='entry-image';cover.style.backgroundImage='url("'+cloudImage(r,category==='item'?'background-equipment.jpg':'background-ability.jpg')+'")';
  const details=document.createElement('div');details.className='entry-text';const no=document.createElement('small');no.textContent='ARCHIVE #'+String(i+1).padStart(2,'0');const h=document.createElement('h3');h.textContent=r.title;
  details.append(no,h,bodyElement(r));article.append(cover,details);list.append(article)
 });
}
function renderArchive(){
 const category=archive==='relations'?'relation':'history',list=$('#archiveContent');list.replaceChildren();
 if(!isRemote(category,'normal')){
  const rows=data[archive]||[];
  if(!rows.length){list.textContent='関係人物は未登録です。';return}
  rows.forEach(x=>{const article=document.createElement('article');article.className='history-item';const h=document.createElement('h3');h.textContent=x.title||x.name;const body=document.createElement('p');body.textContent=x.body||'';article.append(h,body);list.append(article)});return;
 }
 const rows=publicRows(category,'normal');if(!rows.length){list.textContent='公開記事はありません。';return}
 rows.forEach(r=>{const article=document.createElement('article');article.className='history-item archive-rich-card';
  if(r.image_path||r.previewImageData){const media=document.createElement('div');media.className='archive-card-media';media.style.backgroundImage='url("'+cloudImage(r,'background-relations.jpg')+'")';article.append(media)}
  const h=document.createElement('h3');h.textContent=r.title;article.append(h,bodyElement(r));list.append(article)});
}
function renderAll(){renderMenu();renderSlides();renderProfile();renderWorld();renderArsenal();renderArchive();refreshEditor()}
function saveLocal(){try{localStorage.setItem('amasaki-content-v1',JSON.stringify(data));return true}catch(e){status('保存に失敗しました。端末の保存容量を確認してください。');return false}}
function status(s){txt($('#editorStatus'),s)}function editorOpen(open){$('#editorOverlay').classList.toggle('open',open);$('#editorOverlay').setAttribute('aria-hidden',String(!open));document.body.classList.toggle('locked',open)}function collection(){return $('#editCollection').value}function refreshEditor(){if(!data)return;let val=collection(),items=data[val]||[];$('#editItem').innerHTML='';items.forEach((x,i)=>{let op=document.createElement('option');op.value=String(i);txt(op,x.name||x.title);$('#editItem').append(op)});loadEditorItem()}
function loadEditorItem(){let x=(data[collection()]||[])[Number($('#editItem').value)];$('#editTitle').value=x?.name||x?.title||'';$('#editBody').value=x?(collection()==='abilities'?(x[form]||x.normal||''):(x.body||'')):''}
function updateItem(){let coll=collection(),i=Number($('#editItem').value),x=data[coll]?.[i];if(!x){status('項目を選んでください。');return}let title=$('#editTitle').value.trim();if(!title){status('名称は必須です。');return}if(coll==='relations'||coll==='history')x.title=title;else x.name=title;if(coll==='abilities')x[form]=$('#editBody').value;else x.body=$('#editBody').value;if(saveLocal()){renderArsenal();renderArchive();status('この端末に保存しました。公開サイトには反映されません。')}}
function backup(){return JSON.stringify(data,null,2)}function download(text,filename,type='application/json'){let blob=new Blob([text],{type});let url=URL.createObjectURL(blob);let a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),500)}function validate(o){if(!o||typeof o!=='object'||o.version!==1||typeof o.profile!=='object'||!Array.isArray(o.equipment)||!Array.isArray(o.abilities)||!Array.isArray(o.techniques)||!Array.isArray(o.relations)||!Array.isArray(o.history)||!o.site||!Array.isArray(o.quotes))throw Error('対応していないデータ構造です');if(JSON.stringify(o).length>2e6)throw Error('データが大きすぎます')}
function wire(){ $('#menuToggle').onclick=()=>toggleMenu(!$('#menu').classList.contains('open'));$('#home').onclick=()=>navigate('main');$('#footerTop').onclick=()=>navigate('main');$('#explore').onclick=()=>navigate('character');$('#prev').onclick=()=>{showSlide(slide-1);startSlides()};$('#next').onclick=()=>{showSlide(slide+1);startSlides()};let startX=null;$('#main').addEventListener('touchstart',e=>{startX=e.changedTouches[0].screenX},{passive:true});$('#main').addEventListener('touchend',e=>{if(startX===null)return;let dx=e.changedTouches[0].screenX-startX;if(Math.abs(dx)>55){showSlide(slide+(dx<0?1:-1));startSlides()}startX=null},{passive:true});$$('.form-switch').forEach(b=>b.onclick=()=>{form=b.dataset.form;renderProfile();renderArsenal();loadEditorItem()});$$('.tab').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;$$('.tab').forEach(x=>x.classList.toggle('active',x===b));renderArsenal()});$$('.archive-tab').forEach(b=>b.onclick=()=>{archive=b.dataset.archive;$$('.archive-tab').forEach(x=>x.classList.toggle('active',x===b));renderArchive()});$('#search').addEventListener('input',renderArsenal);$('#menuAdmin').onclick=()=>{toggleMenu(false);editorOpen(true)};$('#closeEditor').onclick=()=>editorOpen(false);$('#editCollection').onchange=refreshEditor;$('#editItem').onchange=loadEditorItem;$('#saveItem').onclick=updateItem;$('#addItem').onclick=()=>{let coll=collection();let x={id:'local-'+Date.now(),name:'新規項目',body:'',image:coll==='relations'?'background-relations.jpg':'background-equipment.jpg'};if(coll==='abilities'){x.normal='';x.awakened=''}if(coll==='equipment')x.form=form;if(['history','relations'].includes(coll))x.title=x.name;data[coll].push(x);saveLocal();refreshEditor();$('#editItem').value=String(data[coll].length-1);loadEditorItem();renderArsenal();renderArchive();status('項目を追加しました')};$('#deleteItem').onclick=()=>{let coll=collection(),i=Number($('#editItem').value);if(!data[coll]?.[i]||!confirm('選択した項目を削除しますか？'))return;data[coll].splice(i,1);saveLocal();refreshEditor();renderArsenal();renderArchive();status('削除しました')};$('#downloadBackup').onclick=()=>download(backup(),'amasaki-backup-'+new Date().toISOString().slice(0,10)+'.json');$('#copyBackup').onclick=async()=>{try{await navigator.clipboard.writeText(backup());status('JSONをコピーしました')}catch{status('コピーできません。JSONファイルとしてダウンロードしてください')}};$('#resetData').onclick=()=>{if(!confirm('この端末の編集内容を初期化しますか？'))return;data=structuredClone(original);saveLocal();renderAll();status('初期化しました')};$('#restoreBackup').onclick=()=>{try{let obj=JSON.parse($('#restoreText').value);validate(obj);if(!confirm('現在の内容を復元データで上書きします。続行しますか？'))return;download(backup(),'amasaki-before-restore.json');data=obj;saveLocal();renderAll();status('復元しました。復元前データもダウンロードしました。')}catch(e){status('復元失敗: '+e.message)}};document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggleMenu(false);editorOpen(false)}})}
function applyDraftMessage(evt){
 if(!new URLSearchParams(location.search).has('amasaki_preview'))return;
 if(evt.origin!==location.origin||evt.source!==window.parent||evt.data?.type!=='AMASAKI_DRAFT_PREVIEW_V14')return;
 const row=evt.data.row;
 if(!row||!['item','ability','technique','world','relation','history'].includes(row.category)||!['normal','awakened'].includes(row.form)||typeof row.title!=='string')return;
 if(row.previewImageData&&!/^data:image\/webp;base64,[a-z0-9+/=]+$/i.test(row.previewImageData))return;
 previewRecord={...row,title:row.title.slice(0,160),body:{type:'html',html:safe.richHtml(row.body),animation:row.body?.animation}};
 if(!bootReady)return;
 if(row.category==='world'){renderWorld();$('#world').scrollIntoView({behavior:'instant'})}
 else if(row.category==='relation'||row.category==='history'){archive=row.category==='relation'?'relations':'history';$$('.archive-tab').forEach(x=>x.classList.toggle('active',x.dataset.archive===archive));renderArchive();$('#archive').scrollIntoView({behavior:'instant'})}
 else {form=row.form;tab=CATEGORY_TAB[row.category];$$('.form-switch').forEach(b=>b.classList.toggle('active',b.dataset.form===form));$$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$('#search').value='';renderProfile();renderArsenal();$('#arsenal').scrollIntoView({behavior:'instant'})}
}
window.addEventListener('message',applyDraftMessage);
wire();boot();})();