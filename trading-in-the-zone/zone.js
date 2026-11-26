'use strict';
const $ = s => document.querySelector(s);
const KEY = 'zone-journal-v1', DRAFT = 'zone-draft-v1';
const TYPES = ['交易復盤','盤前計畫','心態筆記','等待紀錄'];
const MOODS = ['平靜專注','擔心錯過','急躁','猶豫','懊惱','疲倦'];
let entries = [], deleteId = null, toastTimeout;
function notify(message){ $('#toast').textContent=message; $('#toast').classList.add('show'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),5000); }
function localDate(d=new Date()){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function escapeHTML(value){const el=document.createElement('span');el.textContent=String(value??'');return el.innerHTML.replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;const d=new Date(s+'T12:00:00');return !isNaN(d)&&localDate(d)===s;}
function validateEntry(e){
 if(!e||typeof e!=='object'||typeof e.id!=='string'||e.id.length>100||!e.id||!validDate(e.date)||!TYPES.includes(e.type)||!MOODS.includes(e.mood)||!['','yes','partial','no'].includes(e.discipline))throw Error('手記欄位格式不正確');
 for(const [key,max] of Object.entries({title:120,symbol:40,plan:12000,reflection:12000}))if(typeof e[key]!=='string'||e[key].length>max)throw Error('手記文字格式或長度不正確');
 if(!e.title.trim())throw Error('手記標題不可空白');
 if(e.result!==null&&(typeof e.result!=='number'||!Number.isFinite(e.result)||Math.abs(e.result)>100000))throw Error('R 值格式不正確');
 return {id:e.id,date:e.date,type:e.type,mood:e.mood,discipline:e.discipline,title:e.title,symbol:e.symbol,plan:e.plan,reflection:e.reflection,result:e.result};
}
try {const stored=localStorage.getItem(KEY);if(stored){const data=JSON.parse(stored);if(!Array.isArray(data))throw Error();entries=data.map(validateEntry);}}catch(e){notify('無法讀取既有手記，請保留備份並檢查瀏覽器儲存空間。');}
function persist(next){try{localStorage.setItem(KEY,JSON.stringify(next));entries=next;render();return true;}catch(e){notify('儲存失敗：瀏覽器空間或權限不足。請先匯出備份，草稿仍保留在畫面。');return false;}}
$('#today').textContent=new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(new Date());
function themeLabel(){ $('#theme-toggle').textContent=document.documentElement.dataset.theme==='dark'?'切換亮色':'切換暗色'; }
themeLabel();$('#theme-toggle').addEventListener('click',()=>{const next=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;try{localStorage.setItem('zone-theme',next);}catch(e){}themeLabel();});
function render(){
 $('#entry-count').textContent=entries.length;
 const assessed=entries.filter(e=>e.discipline);$('#discipline-rate').textContent=assessed.length?Math.round(100*assessed.filter(e=>e.discipline==='yes').length/assessed.length)+'%':'—';
 const monday=new Date();monday.setHours(0,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));
 $('#week-count').textContent=entries.filter(e=>e.date>=localDate(monday)&&e.date<=localDate()).length;
 const query=$('#search').value.trim().toLocaleLowerCase(),filter=$('#filter').value;
 const shown=entries.filter(e=>(filter==='all'||e.type===filter)&&[e.symbol,e.title,e.plan,e.reflection,e.mood].join(' ').toLocaleLowerCase().includes(query)).sort((a,b)=>b.date.localeCompare(a.date));
 if(!shown.length){$('#journal-list').innerHTML=`<div class="empty"><div class="empty-symbol" aria-hidden="true">◎</div><h3>${entries.length?'這次搜尋沒有找到手記':'從一次誠實的記錄開始'}</h3><p>${entries.length?'試試其他關鍵字或分類。':'今天沒有進場，也能記下等待的理由。'}</p>${entries.length?'':'<button class="text-button" id="first-entry" type="button">寫下第一篇手記</button>'}</div>`;$('#first-entry')?.addEventListener('click',()=>openEntry());return;}
 const discipline={yes:'依計畫執行',partial:'部分偏離',no:'情緒主導','':'尚未評估'};
 $('#journal-list').innerHTML=shown.map(e=>`<article class="entry-card"><div class="entry-meta"><time datetime="${escapeHTML(e.date)}">${escapeHTML(e.date)}</time><span class="type-tag">${escapeHTML(e.type)}</span>${e.symbol?`<span>${escapeHTML(e.symbol)}</span>`:''}<span>${escapeHTML(e.mood)}</span></div><h3>${escapeHTML(e.title)}</h3>${e.plan?`<p>${escapeHTML(e.plan)}</p>`:''}${e.reflection?`<details><summary>復盤與下一步</summary><p>${escapeHTML(e.reflection)}</p></details>`:''}<div class="entry-footer"><span>${discipline[e.discipline]}${e.result===null?'':` · ${e.result>0?'+':''}${e.result} R`}</span><div class="entry-actions"><button type="button" class="text-button" data-edit="${escapeHTML(e.id)}">編輯</button><button type="button" class="text-button" data-delete="${escapeHTML(e.id)}">刪除</button></div></div></article>`).join('');
}
$('#search').addEventListener('input',render);$('#filter').addEventListener('change',render);
$('#journal-list').addEventListener('click',e=>{const edit=e.target.closest('[data-edit]'),del=e.target.closest('[data-delete]');if(edit){openEntry(entries.find(x=>x.id===edit.dataset.edit));}if(del){deleteId=del.dataset.delete;$('#delete-dialog').showModal();}});
$('#cancel-delete').addEventListener('click',()=>$('#delete-dialog').close());$('#confirm-delete').addEventListener('click',()=>{if(persist(entries.filter(e=>e.id!==deleteId))){$('#delete-dialog').close();notify('手記已刪除。');}});
const fields=['date','type','symbol','mood','title','plan','discipline','result'];
fields.push('reflection');
function formData(){const e={id:$('#entry-id').value};fields.forEach(k=>e[k]=$('#entry-'+k).value);e.title=e.title.trim();e.symbol=e.symbol.trim();e.result=e.result===''?null:Number(e.result);return e;}
function putForm(e){$('#entry-id').value=e.id||'';fields.forEach(k=>$('#entry-'+k).value=e[k]??'');}
function openEntry(entry){$('#entry-form').reset();$('#entry-id').value='';$('#entry-date').value=localDate();$('#dialog-title').textContent=entry?'編輯手記':'寫下這次交易';$('#draft-status').textContent='輸入時會自動保留草稿。';if(entry){putForm(entry);}else{try{const draft=JSON.parse(localStorage.getItem(DRAFT)||'null');if(draft&&typeof draft==='object'){putForm(draft);$('#dialog-title').textContent=draft.id?'繼續編輯手記':'繼續上次的草稿';$('#draft-status').textContent='已恢復上次未完成的草稿。';}}catch(e){}}$('#entry-dialog').showModal();}
$('#new-entry').addEventListener('click',()=>openEntry());$('#add-entry').addEventListener('click',()=>openEntry());$('#close-dialog').addEventListener('click',()=>$('#entry-dialog').close());
$('#entry-form').addEventListener('input',()=>{try{localStorage.setItem(DRAFT,JSON.stringify(formData()));$('#draft-status').textContent='草稿已保留於目前瀏覽器。';}catch(e){$('#draft-status').textContent='草稿暫時無法儲存，請保留此畫面。';}});
$('#discard').addEventListener('click',()=>{try{localStorage.removeItem(DRAFT);}catch(e){}$('#entry-dialog').close();notify('已捨棄草稿，已儲存的手記不受影響。');});
$('#entry-form').addEventListener('submit',e=>{e.preventDefault();try{const entry=formData();entry.id=entry.id||crypto.randomUUID();validateEntry(entry);const exists=entries.some(x=>x.id===entry.id);const next=exists?entries.map(x=>x.id===entry.id?entry:x):[entry,...entries];if(persist(next)){try{localStorage.removeItem(DRAFT);}catch(e){}$('#entry-dialog').close();notify('手記已儲存。');}}catch(e){notify(e.message);}});
$('#export').addEventListener('click',()=>{const data={app:'trading-in-the-zone',version:1,exportedAt:new Date().toISOString(),entries};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`trading-in-the-zone-${localDate()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);notify(`已匯出 ${entries.length} 篇手記。`);});
$('#import').addEventListener('click',()=>$('#import-file').click());
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>10*1024*1024)throw Error('備份檔超過 10 MB');const data=JSON.parse(await file.text());if(data.app!=='trading-in-the-zone'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>5000)throw Error('請選擇此網站匯出的版本 1 備份檔');const incoming=data.entries.map(validateEntry);const existing=new Set(entries.map(x=>x.id));const seen=new Set();const added=incoming.filter(x=>{if(existing.has(x.id)||seen.has(x.id))return false;seen.add(x.id);return true;});if(!added.length){notify('沒有新的手記可匯入；相同 ID 的既有紀錄已保留。');}else if(persist([...entries,...added]))notify(`已新增 ${added.length} 篇手記；重複紀錄保留目前版本。`);}catch(err){notify('匯入失敗：'+err.message+'。既有手記未變動。');}finally{e.target.value='';}});
// Use wall-clock time so background-tab throttling cannot extend the ritual.
let timerId=null,remaining=60,deadline=0;
function paintTimer(){ $('#timer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0'); }
function tick(){remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));paintTimer();if(remaining===0){clearInterval(timerId);timerId=null;$('#focus-start').textContent='再靜心一次';$('#focus-message').textContent='把注意力帶回計畫。準備好了再決定，等待也可以。';}}
$('#focus-start').addEventListener('click',()=>{if(timerId){tick();clearInterval(timerId);timerId=null;$('#focus-start').textContent='繼續靜心';return;}if(remaining===0)remaining=60;deadline=Date.now()+remaining*1000;timerId=setInterval(tick,250);$('#focus-start').textContent='暫停';$('#focus-message').textContent='放鬆肩膀，保持自然呼吸。只觀察，不急著做決定。';});
$('#focus-reset').addEventListener('click',()=>{clearInterval(timerId);timerId=null;remaining=60;paintTimer();$('#focus-start').textContent='靜心 60 秒';$('#focus-message').textContent='肩膀放鬆，呼吸自然。看著定點，讓衝動慢慢過去。';});
const ritualChecks=[...document.querySelectorAll('.ritual-checks input')];function ritualStatus(){const n=ritualChecks.filter(c=>c.checked).length;$('#ritual-status').textContent=n===ritualChecks.length?'準備已完成。仍由你依計畫決定是否交易。':`已確認 ${n} / ${ritualChecks.length} 項，先完成自己的準備。`;}
ritualChecks.forEach(c=>c.addEventListener('change',ritualStatus));$('#ritual-reset').addEventListener('click',()=>{ritualChecks.forEach(c=>c.checked=false);ritualStatus();});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(items=>{items.forEach(item=>{if(item.isIntersecting){document.querySelectorAll('.nav-link').forEach(a=>a.classList.toggle('active',a.hash==='#'+item.target.id));}});},{rootMargin:'-10% 0px -60% 0px',threshold:0});['overview','journal','library','ritual'].forEach(id=>observer.observe(document.getElementById(id)));}
render();
