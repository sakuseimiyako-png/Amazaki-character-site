// Strict small allowlist for rich text. All inbound HTML is sanitized before rendering.
(function(){'use strict';
const allowed=new Set(['P','DIV','BR','B','STRONG','I','EM','U','S','H2','H3','H4','UL','OL','LI','BLOCKQUOTE','HR','SPAN','FONT']);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function validColor(value){let v=String(value||'').trim();return /^(#[0-9a-f]{3,8}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)|(?:black|white|red|blue|gray|grey|silver|orange|purple|teal|yellow))$/i.test(v)?v:''}
function scrub(markup){const doc=new DOMParser().parseFromString(String(markup??''),'text/html');const out=document.createElement('div');
 function appendSafe(parent,child){if(child.nodeType===3){parent.append(document.createTextNode(child.nodeValue));return;}if(child.nodeType!==1)return;let tag=child.tagName;if(['SCRIPT','STYLE','SVG','MATH','IFRAME','OBJECT','EMBED','FORM','INPUT','BUTTON','VIDEO','AUDIO','IMG','LINK','META','TEMPLATE'].includes(tag))return;
 if(!allowed.has(tag)){for(const c of Array.from(child.childNodes))appendSafe(parent,c);return;}
 const safeTag=tag==='FONT'?'SPAN':tag.toLowerCase();const el=document.createElement(safeTag);
 let color=validColor(tag==='FONT'?child.getAttribute('color'):child.style.color);if(color)el.style.color=color;
 let size=tag==='FONT'?({'1':'12px','2':'14px','3':'16px','4':'18px','5':'22px','6':'28px','7':'36px'}[child.getAttribute('size')]||''):String(child.style.fontSize||'');
 if(/^(?:1[2-9]|2\d|3[0-6])px$/.test(size))el.style.fontSize=size;
 for(const c of Array.from(child.childNodes))appendSafe(el,c);parent.append(el)}
 for(const c of Array.from(doc.body.childNodes))appendSafe(out,c);return out.innerHTML;}
function plainHtml(t){return String(t||'').split(/\n\s*\n/).map(x=>'<p>'+escape(x).replace(/\n/g,'<br>')+'</p>').join('')||'<p></p>'}
function richHtml(body){if(body?.type==='html')return scrub(body.html);if(body?.type==='doc'){const walk=x=>typeof x==='string'?x:(x?.text||'')+(Array.isArray(x?.content)?x.content.map(walk).join(''):''),s=walk(body);return plainHtml(s)}return plainHtml(typeof body==='string'?body:'')}
window.AmasakiSafeHTML=Object.freeze({escape,scrub,plainHtml,richHtml});
})();
