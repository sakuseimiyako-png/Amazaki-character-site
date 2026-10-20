(()=>{'use strict';
const $=s=>document.querySelector(s),safe=window.AmasakiSafeHTML;let cfg=null,session=null,items=[],sections=[],selected=null,imageObj=null,editImagePath=null,removedImage=false,loading=false,previewVisible=false;
const CATEGORIES={item:'異能道具',ability:'能力',technique:'使用技',world:'世界観',relation:'関係',history:'都での歴史'};
const SINGLE_FORM=new Set(['world','relation','history']);
const sectionKey=(category,form)=>category+':'+(SINGLE_FORM.has(category)?'normal':form);
const STATIC_PREPOPULATED=new Set(['item:normal','item:awakened','ability:normal','ability:awakened','technique:normal','technique:awakened','world:normal','history:normal']);
const validUuid=id=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id||'');
function config(){const c=window.AMASAKI_SUPABASE||{};try{const u=new URL(c.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||!/^sb_publishable_[\w-]+$/.test(c.publishableKey||''))return null;return {url:u.origin,key:c.publishableKey}}catch{return null}}
function message(s,err=false){const e=$('#globalStatus');e.textContent=s;e.style.color=err?'#ffb1b1':'#afd4fc';if(err)console.warn(s)}
function loginError(s){$('#loginError').textContent=s}
function working(v){loading=v;$$('button.primary').forEach(b=>b.disabled=v)}
function $$(s){return [...document.querySelectorAll(s)]}
function store(){if(session)sessionStorage.setItem('amasaki-auth-v13',JSON.stringify(session));else sessionStorage.removeItem('amasaki-auth-v13')}
function fail(msg){throw Error(msg)}
async function request(path,{method='GET',body,token=true,prefer,raw=false,returnResponse=false}={}){
 if(!cfg)fail('supabase-config.jsの接続情報を設定してください');if(token&&session)await ensureSession();
 const headers={apikey:cfg.key,Accept:'application/json'};
 if(token&&session?.access_token)headers.Authorization='Bearer '+session.access_token;
 if(body!==undefined&&!raw)headers['Content-Type']='application/json';
 if(raw)headers['Content-Type']='image/webp';if(prefer)headers.Prefer=prefer;
 const r=await fetch(cfg.url+path,{method,headers,body:body===undefined?undefined:raw?body:JSON.stringify(body)});
 if(returnResponse)return r;
 if(!r.ok){const txt=await r.text();let m=txt;try{const x=JSON.parse(txt);m=x.msg||x.message||x.error_description||x.error||txt}catch{}fail(`処理失敗（${r.status}）：${String(m).slice(0,220)}`)}
 if(r.status===204||r.status===201&&r.headers.get('content-length')==='0')return null;
 const t=await r.text();return t?JSON.parse(t):null
}
async function ensureSession(){if(!session)return;if(Date.now()<(session.expires_at||0)-60000)return;
 const r=await fetch(cfg.url+'/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
 if(!r.ok){session=null;store();showLogin();fail('ログインの有効期限が切れました。再度ログインしてください。')}
 const next=await r.json();session={...next,expires_at:Date.now()+(next.expires_in||3600)*1000,user:next.user||session.user};store();}
function showLogin(){ $('#workspace').hidden=true;$('#loginPanel').hidden=false;$('#password').value='';}
function showWorkspace(){ $('#workspace').hidden=false;$('#loginPanel').hidden=true;$('#signedUser').textContent=session?.user?.email||'認証済み管理者';}
async function verifyAdmin(){if(!session?.user?.id)return false;let id=encodeURIComponent(session.user.id);const rows=await request('/rest/v1/site_admins?select=user_id&user_id=eq.'+id);return Array.isArray(rows)&&rows.length===1;}
async function signIn(evt){evt.preventDefault();loginError('');working(true);try{const email=$('#email').value.trim(),password=$('#password').value;
 const r=await fetch(cfg.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:cfg.key,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
 if(!r.ok){loginError('ログインできません。メールアドレスとパスワードを確認してください。');return}
 const a=await r.json();session={...a,expires_at:Date.now()+(a.expires_in||3600)*1000};store();
 if(!await verifyAdmin()){session=null;store();loginError('管理者権限がありません。');return}
 showWorkspace();await loadEntries();}catch(e){loginError(e.message)}finally{working(false)}}
async function signOut(){try{if(session)await request('/auth/v1/logout',{method:'POST'})}catch{}session=null;store();items=[];selected=null;showLogin();message('ログアウトしました')}
async function loadEntries(){
 const result=await request('/rest/v1/site_entries?select=*&order=sort_order.asc,created_at.asc&limit=1000');
 items=Array.isArray(result)?result:[];
 const state=await request('/rest/v1/site_section_state?select=section_key,active');
 sections=Array.isArray(state)?state:[];
 drawList();
 if(selected?.id){const found=items.find(x=>x.id===selected.id);found?choose(found):newRecord()}
 else {const article=activeList()[0];article?choose(article):newRecord()}
 message(`DBの記事 ${items.filter(x=>!x.title.startsWith('__AMASAKI_')).length} 件を読み込みました`);
}

function activeList(){return items.filter(x=>!x.title.startsWith('__AMASAKI_')&&x.category===$('#categoryFilter').value&&x.form===(SINGLE_FORM.has(x.category)?'normal':$('#formFilter').value))}

function drawList(){let box=$('#entryList');box.replaceChildren();activeList().forEach(x=>{let b=document.createElement('button');b.type='button';b.className=x.id===selected?.id?'active':'';b.textContent=x.title;let meta=document.createElement('span');meta.textContent=x.published?'● 公開':'○ 下書き';b.append(meta);b.addEventListener('click',()=>choose(x));box.append(b)});if(!box.children.length)box.textContent='この分類・形態の記事はまだありません。'}
function resetCanvas(){const c=$('#cropCanvas'),ctx=c.getContext('2d');ctx.fillStyle='#19283b';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#98aac0';ctx.font='28px sans-serif';ctx.textAlign='center';ctx.fillText('画像プレビュー '+$('#imageAspect').textContent,c.width/2,c.height/2)}

function updateFormVisibility(){const single=SINGLE_FORM.has($('#categoryFilter').value);$('#formField').hidden=single;if(single)$('#formFilter').value='normal';const wide=single;const can=$('#cropCanvas');can.width=wide?1600:1250;can.height=900+(!wide?100:0);$('#imageAspect').textContent=wide?'16:9':'5:4';$('#imageTypeHelp').textContent=wide?'世界観・関係・歴史は16:9で保存します。':'異能道具・能力・技は5:4で保存します。';}
function choose(x){
 selected=x;$('#categoryFilter').value=x.category;$('#formFilter').value=x.form;updateFormVisibility();
 $('#title').value=x.title;$('#published').value=String(!!x.published);$('#sortOrder').value=x.sort_order??0;
 $('#richEditor').innerHTML=safe.richHtml(x.body);
 $('#animation').value=['右から登場','下から浮上'].includes(x.body?.animation)?x.body.animation:'none';
 $('#editHeading').textContent=x.id?'記事を編集':'新規記事';$('#entryBadge').textContent=x.id?'ID: '+x.id.slice(0,8):'まだ保存していません';
 editImagePath=x.image_path||null;removedImage=false;imageObj=null;$('#imageInput').value='';$('#cropX').value=0;$('#cropY').value=0;resetCanvas();
 $('#imageNote').textContent=editImagePath?'既存画像: '+editImagePath:'画像未設定（分類の共通背景を表示）';drawList();
}

function newRecord(){
 selected=null;
 const category=$('#categoryFilter').value;
 const form=SINGLE_FORM.has(category)?'normal':$('#formFilter').value;
 const row={id:null,category,form,title:'',published:false,sort_order:items.length+1,body:{type:'html',html:'<p></p>'},image_path:null};
 choose(row);$('#editHeading').textContent='新規記事';$('#entryBadge').textContent='まだ保存していません';
}

function drawCrop(){if(!imageObj){resetCanvas();return}const canvas=$('#cropCanvas'),ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,im=imageObj;const scale=Math.max(W/im.width,H/im.height),sw=im.width*scale,sh=im.height*scale;const offsetX=(W-sw)/2 + (W-sw)/2*Number($('#cropX').value)/100;const offsetY=(H-sh)/2 + (H-sh)/2*Number($('#cropY').value)/100;ctx.clearRect(0,0,W,H);ctx.drawImage(im,offsetX,offsetY,sw,sh)}
async function onImage(e){const file=e.target.files?.[0];if(!file)return;if(!['image/png','image/jpeg','image/webp'].includes(file.type)){message('PNG/JPEG/WebPのみ利用できます',true);e.target.value='';return}if(file.size>20*1024*1024){message('20MB以下の画像を選んでください',true);e.target.value='';return}
 const url=URL.createObjectURL(file);try{const im=new Image();await new Promise((resolve,reject)=>{im.onload=resolve;im.onerror=reject;im.src=url});imageObj=im;$('#cropX').value=0;$('#cropY').value=0;drawCrop();$('#imageNote').textContent='新しい画像が選択されました。記事を保存するとアップロードします。'}catch{message('画像を読み込めませんでした',true)}finally{URL.revokeObjectURL(url)}}
function blobFromCanvas(){return new Promise((res,rej)=>$('#cropCanvas').toBlob(b=>b?res(b):rej(Error('WebPに変換できませんでした')),'image/webp',0.86))}
async function uploadImage(){if(!imageObj)return editImagePath;const blob=await blobFromCanvas(),path='images/'+crypto.randomUUID()+'.webp';const u='/storage/v1/object/entry-images/'+path;const r=await request(u,{method:'POST',body:blob,raw:true,returnResponse:true});if(!r.ok)fail('画像のアップロードに失敗しました（'+r.status+'）：'+(await r.text()).slice(0,200));return path}
function validateRow(row){
 if(!row.title||row.title.length>160)fail('記事名を1〜160文字で入力してください');
 if(!CATEGORIES[row.category]||!['normal','awakened'].includes(row.form))fail('分類が不正です');
 if(SINGLE_FORM.has(row.category)&&row.form!=='normal')fail('世界観・関係・歴史の形態は通常固定です');
 if(!Number.isInteger(row.sort_order)||Math.abs(row.sort_order)>100000)fail('並び順を確認してください');
 if(row.body.html.length>150000)fail('本文が長すぎます');
}

function readEditor(){
 const category=$('#categoryFilter').value;
 const row={category,form:SINGLE_FORM.has(category)?'normal':$('#formFilter').value,title:$('#title').value.trim(),published:$('#published').value==='true',sort_order:Number($('#sortOrder').value),body:{type:'html',html:safe.scrub($('#richEditor').innerHTML),animation:$('#animation').value},image_path:removedImage?null:editImagePath,updated_at:new Date().toISOString()};
 validateRow(row);return row;
}

async function markActive(category,form){
 const key=sectionKey(category,form);
 const rows=await request('/rest/v1/site_section_state?on_conflict=section_key',{method:'POST',body:[{section_key:key,active:true,updated_at:new Date().toISOString()}],prefer:'resolution=merge-duplicates,return=representation'});
 if(!Array.isArray(rows)||rows.length!==1)fail('区画の公開切り替えを確認できません');
}
async function saveEntry(){
 if(loading)return;working(true);
 try{
  const row=readEditor();
  const key=sectionKey(row.category,row.form);
  if(!selected?.id&&STATIC_PREPOPULATED.has(key)&&!items.some(x=>x.category===row.category&&x.form===row.form&&!x.title.startsWith('__AMASAKI_'))&&!sections.some(x=>x.section_key===key&&x.active)){fail('既存の文章を守るため、先に画面下部の「未登録の分類に元サイトの記事を取り込み」を実行してください。')}
  if(imageObj)row.image_path=await uploadImage();
  const returned=selected?.id
   ? await request('/rest/v1/site_entries?id=eq.'+encodeURIComponent(selected.id),{method:'PATCH',body:row,prefer:'return=representation'})
   : await request('/rest/v1/site_entries',{method:'POST',body:row,prefer:'return=representation'});
  if(!Array.isArray(returned)||!returned[0])fail('記事保存結果を確認できません');
  // 下書きだけを作った場合、一般公開中の静的データは置き換えない。
  if(row.published||sections.some(x=>x.section_key===sectionKey(row.category,row.form)&&x.active))await markActive(row.category,row.form);
  selected=returned[0];editImagePath=selected.image_path;imageObj=null;await loadEntries();choose(selected);
  message(row.published?'保存しました。公開ページの再読み込みで反映されます。':'下書きとして保存しました。一般閲覧者には表示されません。');
 }catch(e){message(e.message,true)}finally{working(false)}
}

function download(text,name){const blob=new Blob([text],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function snapshot(){return JSON.stringify({kind:'amasaki-site-entries',version:2,exported_at:new Date().toISOString(),articles:items,sections},null,2)}

async function deleteEntry(){
 if(!selected?.id)return;
 if(!confirm('この記事を削除しますか？削除前の全記事・区画状態JSONを先にダウンロードします。'))return;
 download(snapshot(),'amasaki-before-delete-'+Date.now()+'.json');working(true);
 try{
  const row=selected;
  // 最終行の削除でも旧文章を復活させないため、公開区画の状態を先に保持する。
  if(row.published)await markActive(row.category,row.form);
  await request('/rest/v1/site_entries?id=eq.'+encodeURIComponent(row.id),{method:'DELETE'});
  selected=null;await loadEntries();message('削除しました。画像実体は誤削除防止のため残してあります。');
 }catch(e){message(e.message,true)}finally{working(false)}
}

async function importSeed(){
 if(!confirm('まだDB管理になっていない区画に、現在のサイトの記事を取り込みます。既存のDB記事は変更しません。続行しますか？'))return;
 if(prompt('確認のため「初期登録」と入力してください')!=='初期登録')return;
 working(true);
 try{
  const res=await fetch('data/content.json',{cache:'no-store'});if(!res.ok)fail('content.jsonを取得できません');
  const local=await res.json(),data=[],toActivate=[];let order=0;
  const hasDb=(cat,form)=>items.some(x=>x.category===cat&&x.form===form&&!x.title.startsWith('__AMASAKI_'))||sections.some(x=>x.section_key===sectionKey(cat,form)&&x.active);
  function add(cat,form,title,body){data.push({category:cat,form,title,body:{type:'html',html:safe.plainHtml(body)},sort_order:order++,image_path:null,published:true})}
  for(const f of ['normal','awakened']){
   if(!hasDb('item',f)){(local.equipment||[]).filter(x=>(x.form||'normal')===f).forEach(x=>add('item',f,x.name,x.body));toActivate.push(['item',f])}
   if(!hasDb('ability',f)){(local.abilities||[]).forEach(x=>add('ability',f,x.name,x[f]||x.normal));toActivate.push(['ability',f])}
   if(!hasDb('technique',f)){(local.techniques||[]).forEach(x=>add('technique',f,x.name,x.body));toActivate.push(['technique',f])}
  }
  if(!hasDb('world','normal')){if(local.world?.title)add('world','normal',local.world.title,local.world.body||'');toActivate.push(['world','normal'])}
  if(!hasDb('relation','normal')){(local.relations||[]).forEach(x=>add('relation','normal',x.name||x.title,x.body));toActivate.push(['relation','normal'])}
  if(!hasDb('history','normal')){(local.history||[]).forEach(x=>add('history','normal',x.name||x.title,x.body));toActivate.push(['history','normal'])}
  // 既存DBを守りながら区画単位で取り込む。
  if(data.length)await request('/rest/v1/site_entries',{method:'POST',body:data,prefer:'return=minimal'});
  for(const [cat,f] of toActivate)await markActive(cat,f);
  selected=null;await loadEntries();message(`${data.length}件を取り込みました。原文未転記部分は正式原文に従って補完してください。`);
 }catch(e){message(e.message,true)}finally{working(false)}
}

async function restore(){
 let j;try{j=JSON.parse($('#restoreJson').value)}catch{message('JSON形式が不正です',true);return}
 if(j?.kind!=='amasaki-site-entries'||![1,2].includes(j.version)||!Array.isArray(j.articles)||j.articles.length>1000){message('管理システム専用のJSONを貼り付けてください',true);return}
 try{
  const rows=j.articles.map(o=>{
   const r={id:o.id,category:o.category,form:o.form,title:o.title,body:o.body,image_path:o.image_path,sort_order:o.sort_order,published:o.published,updated_at:new Date().toISOString()};
   if(!validUuid(r.id))fail('記事IDが不正です');if(r.body?.type!=='html')r.body={type:'html',html:safe.richHtml(r.body)};
   r.body.html=safe.scrub(r.body.html);validateRow(r);
   if(r.image_path!==null&&!/^images\/[A-Za-z0-9._-]+\.(webp|png|jpe?g)$/.test(r.image_path))fail('画像参照先が不正です');return r;
  });
  const backupSections=(Array.isArray(j.sections)?j.sections:[]).filter(x=>/^(item|ability|technique):(normal|awakened)$|^(world|relation|history):normal$/.test(x.section_key)&&typeof x.active==='boolean');
  if(!confirm(`${rows.length}件を上書き・追加します。現在DBをJSON保存してから実行します。実行しますか？`))return;
  download(snapshot(),'amasaki-before-restore-'+Date.now()+'.json');working(true);
  if(rows.length)await request('/rest/v1/site_entries?on_conflict=id',{method:'POST',body:rows,prefer:'resolution=merge-duplicates,return=minimal'});
  if(backupSections.length)await request('/rest/v1/site_section_state?on_conflict=section_key',{method:'POST',body:backupSections.map(x=>({section_key:x.section_key,active:x.active})),prefer:'resolution=merge-duplicates,return=minimal'});
  selected=null;await loadEntries();message('復元しました。JSONにない記事の削除と画像実体の復元は行いません。');
 }catch(e){message('復元失敗: '+e.message,true)}finally{working(false)}
}

function richCmd(evt){const btn=evt.target.closest('button[data-cmd]');if(!btn)return;evt.preventDefault();$('#richEditor').focus();document.execCommand(btn.dataset.cmd,false,btn.dataset.value||null)}

function previewRecord(){
 const row=readEditor();
 // 作業中のキャンバスは保存せずプレビューへ渡すだけ。
 if(imageObj)row.previewImageData=$('#cropCanvas').toDataURL('image/webp',0.8);
 return {...row,id:selected?.id||null};
}
function sendPreview(){
 if(!previewVisible)return;
 try{const row=previewRecord();const frame=$('#previewFrame');frame.contentWindow?.postMessage({type:'AMASAKI_DRAFT_PREVIEW_V14',row},location.origin);$('#previewNotice').textContent='編集中の内容を表示。DBには未保存・未公開です。';}
 catch(e){$('#previewNotice').textContent='プレビューできません: '+e.message}
}
function showPreview(){
 try{previewRecord()}catch(e){message('プレビュー不可: '+e.message,true);return}
 previewVisible=true;$('#previewDialog').hidden=false;document.body.classList.add('preview-open');
 const f=$('#previewFrame');f.onload=()=>{sendPreview();setTimeout(sendPreview,750)};
 f.src='index.html?amasaki_preview=1';
}
function closePreview(){previewVisible=false;$('#previewDialog').hidden=true;document.body.classList.remove('preview-open');$('#previewFrame').src='about:blank';}

function attach(){
 cfg=config();if(!cfg){$('#configBanner').hidden=false;$('#loginForm').querySelector('button').disabled=true}
 $('#loginForm').addEventListener('submit',signIn);$('#logoutBtn').addEventListener('click',signOut);
 $('#categoryFilter').addEventListener('change',()=>{selected=null;updateFormVisibility();newRecord()});
 $('#formFilter').addEventListener('change',()=>{selected=null;newRecord()});
 $('#newBtn').onclick=newRecord;$('#entryList').addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='BUTTON')e.target.click()});
 $('#saveEntry').onclick=saveEntry;$('#deleteEntry').onclick=deleteEntry;
 $('#imageInput').onchange=onImage;$('#cropX').oninput=drawCrop;$('#cropY').oninput=drawCrop;
 $('#removeImage').onclick=()=>{editImagePath=null;removedImage=true;imageObj=null;$('#imageInput').value='';resetCanvas();$('#imageNote').textContent='画像指定を解除。保存すると分類の共通背景が表示されます。'};
 $('#formatTools').addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});$('#formatTools').addEventListener('click',richCmd);
 $('#fontColor').addEventListener('change',e=>{$('#richEditor').focus();document.execCommand('foreColor',false,e.target.value)});
 $('#insertLine').onclick=()=>{$('#richEditor').focus();document.execCommand('insertHorizontalRule')};
 $('#richEditor').addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'))});
 $('#seedBtn').onclick=importSeed;
 $('#downloadJson').onclick=()=>download(snapshot(),'amasaki-articles-'+new Date().toISOString().slice(0,10)+'.json');
 $('#copyJson').onclick=async()=>{try{await navigator.clipboard.writeText(snapshot());message('記事JSONをコピーしました')}catch{message('コピー不可。JSONファイルを保存してください',true)}};
 $('#restoreBtn').onclick=restore;
 $('#previewBtn').onclick=showPreview;$('#closePreview').onclick=closePreview;
 window.addEventListener('message',e=>{if(previewVisible&&e.origin===location.origin&&e.source===$('#previewFrame').contentWindow&&e.data?.type==='AMASAKI_PREVIEW_READY_V14')sendPreview()});
 $('#previewDesktop').onclick=()=>{$('#previewFrame').classList.remove('mobile');$('#previewDesktop').setAttribute('aria-pressed','true');$('#previewMobile').setAttribute('aria-pressed','false')};
 $('#previewMobile').onclick=()=>{$('#previewFrame').classList.add('mobile');$('#previewMobile').setAttribute('aria-pressed','true');$('#previewDesktop').setAttribute('aria-pressed','false')};
 $('#previewDialog').addEventListener('click',e=>{if(e.target.id==='previewDialog')closePreview()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&previewVisible)closePreview()});
 ['title','published','sortOrder','animation','cropX','cropY','richEditor'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(previewVisible)sendPreview()}));
 updateFormVisibility();resetCanvas();
 try{session=JSON.parse(sessionStorage.getItem('amasaki-auth-v13')||'null')}catch{session=null}
 if(cfg&&session){verifyAdmin().then(ok=>{if(ok){showWorkspace();loadEntries().catch(e=>message(e.message,true))}else{session=null;store();showLogin()}}).catch(()=>{session=null;store();showLogin()})}
}

attach();
})();
