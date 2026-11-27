'use strict';
{
 const nav=document.querySelector('.toc-card');
 if(nav){const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='文章目錄';const grid=nav.querySelector('.toc-grid');details.append(summary,grid);nav.replaceChildren(details);const chapters=[...document.querySelectorAll('main > .chapter')];const layout=document.createElement('div'),body=document.createElement('div');layout.className='lesson-layout';body.className='chapter-body';nav.before(layout);layout.append(nav,body);body.append(...chapters);const wide=matchMedia('(min-width:1100px)');const update=()=>details.open=wide.matches;update();wide.addEventListener('change',update);grid.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{if(!wide.matches)details.open=false}));}
 const box=document.getElementById('lightbox');
 if(box){const close=document.createElement('button');close.type='button';close.className='lesson-close';close.textContent='關閉 ×';box.prepend(close);close.addEventListener('click',()=>box.classList.remove('open'));document.addEventListener('keydown',e=>{if(e.key==='Escape')box.classList.remove('open')});document.querySelectorAll('.figure-box img,.figure-box svg').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();close.focus()}})});}
 const toggle=document.getElementById('themeToggle');if(toggle)toggle.textContent=document.documentElement.dataset.theme==='dark'?'護眼淺黃':'深色模式';
 if(location.hash)requestAnimationFrame(()=>document.getElementById(location.hash.slice(1))?.scrollIntoView());
}
