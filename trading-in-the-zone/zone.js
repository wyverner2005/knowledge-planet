'use strict';
const query=document.getElementById('query');
const categoryButtons = [...document.querySelectorAll('.catalog-filter')];
let selectedCategory = '';

function selectCategory(category) {
  selectedCategory = category;
  for (const button of categoryButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.category === category));
  }
  search();
}
const toggle=document.getElementById('theme-toggle');
function themeLabel(){const dark=document.documentElement.dataset.theme==='dark';toggle.textContent=dark?'淺色模式':'深色模式';toggle.setAttribute('aria-pressed',String(dark));}
themeLabel();
toggle.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('zone-theme',theme);}catch(e){}themeLabel();});
function textElement(tag,text,className){const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;}
function snippet(text,terms){const lower=text.toLocaleLowerCase();const indexes=terms.map(t=>lower.indexOf(t)).filter(i=>i>=0);const start=Math.max(0,(indexes.length?Math.min(...indexes):0)-32);return (start?'…':'')+text.slice(start,start+170)+(start+170<text.length?'…':'');}
function search(){
 const terms=query.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
 const selected=selectedCategory;
 const articles=window.ZONE_ARTICLES||[];
 const filtered=articles.filter(a=>(!selected||a.categories.includes(selected))&&terms.every(t=>(a.title+' '+a.summary+' '+a.keywords+' '+a.sections.map(s=>s.title+' '+s.text).join(' ')).toLocaleLowerCase().includes(t)));
 const visiblePaths = new Set(filtered.map(article => article.path));
 for (const card of document.querySelectorAll('#notes [data-article]')) {
   card.hidden = !visiblePaths.has(card.dataset.article);
 }
 document.getElementById('status').textContent=terms.length||selected?`顯示 ${filtered.length} / ${articles.length} 篇文章`:`已收錄 ${articles.length} 篇文章`;
 document.getElementById('empty').hidden=!!filtered.length;
 const list=document.getElementById('section-results');list.replaceChildren();
 if(terms.length){filtered.forEach(article=>{article.sections.filter(section=>terms.every(t=>(section.title+' '+section.text).toLocaleLowerCase().includes(t))).forEach(section=>{const li=document.createElement('li');const a=document.createElement('a');a.className='match';a.href=article.path+'#'+section.id;a.append(textElement('small',article.title),textElement('h3',section.title),textElement('p',snippet(section.text,terms)));li.append(a);list.append(li);});});}
 document.getElementById('matches').hidden=!list.children.length;
}
document.getElementById('search-form').addEventListener('submit',e=>{e.preventDefault();search();});query.addEventListener('input',search);
for (const button of categoryButtons) {
  button.addEventListener('click', () => selectCategory(button.dataset.category));
}
document.getElementById('clear-search').addEventListener('click',()=>{query.value = ''; selectCategory(''); query.focus();});
search();
