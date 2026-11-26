'use strict';
const root=document.documentElement;
const toggle=document.getElementById('themeToggle');
function syncTheme(){const dark=root.dataset.theme==='dark';document.getElementById('themeIcon').textContent=dark?'◐':'◑';document.getElementById('themeText').textContent=dark?'切換亮色':'切換暗色';}
syncTheme();toggle.addEventListener('click',()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('zone-theme',root.dataset.theme);}catch(e){}syncTheme();});
const svgDialog=document.getElementById('svg-dialog');
document.querySelectorAll('.svg-scroll').forEach(box=>{const svg=box.querySelector('svg');if(!svg)return;const caption=box.closest('.svg-box')?.querySelector('.svg-caption')?.textContent.trim()||'圖解放大檢視';svg.setAttribute('role','img');svg.setAttribute('aria-label',caption);const wrap=document.createElement('div');wrap.className='diagram-tools';const button=document.createElement('button');button.type='button';button.textContent='放大圖解';wrap.append(button);box.after(wrap);const hint=document.createElement('p');hint.className='diagram-hint';hint.textContent='手機可在圖解內左右滑動，或點選放大圖解。';wrap.before(hint);button.addEventListener('click',()=>{document.getElementById('svg-title').textContent=caption;document.getElementById('svg-full').replaceChildren(svg.cloneNode(true));svgDialog.showModal();});});
document.getElementById('svg-close').addEventListener('click',()=>svgDialog.close());
let lastFrame;
document.querySelectorAll('.chart-frame').forEach(frame=>{frame.tabIndex=0;frame.setAttribute('role','button');frame.setAttribute('aria-label','放大圖表：'+(frame.querySelector('img')?.alt||'實戰圖表'));frame.addEventListener('click',()=>lastFrame=frame);frame.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();frame.click();document.querySelector('.lightbox-close').focus();}});});
const lightbox=document.getElementById('lightbox');lightbox.setAttribute('role','dialog');lightbox.setAttribute('aria-label','實戰圖表放大檢視');lightbox.setAttribute('aria-modal','true');const closeBox=document.querySelector('.lightbox-close');closeBox.setAttribute('aria-label','關閉圖表');
const observer=new MutationObserver(()=>{const opened=lightbox.classList.contains('open');lightbox.setAttribute('aria-hidden',String(!opened));if(opened){closeBox.focus();}else{lastFrame?.focus();}});observer.observe(lightbox,{attributes:true,attributeFilter:['class']});lightbox.setAttribute('aria-hidden','true');
lightbox.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();closeBox.focus();}});

function enhanceArticleContents() {
  const navigation = document.querySelector('.nav-card');
  const chapters = [...document.querySelectorAll('main > .chapter')];
  if (!navigation || !chapters.length) return;

  const contents = document.createElement('details');
  contents.className = 'chapter-contents';
  const title = document.createElement('summary');
  title.textContent = '文章目錄';
  const links = navigation.querySelector('.nav-grid');
  contents.append(title, links);
  navigation.replaceChildren(contents);

  const layout = document.createElement('div');
  layout.className = 'chapter-layout';
  const body = document.createElement('div');
  body.className = 'chapter-body';
  navigation.before(layout);
  layout.append(navigation, body);
  body.append(...chapters);

  const desktop = matchMedia('(min-width: 960px)');
  function setDefaultOpen() {
    contents.open = desktop.matches;
  }
  setDefaultOpen();
  desktop.addEventListener('change', setDefaultOpen);

  const chapterLinks = [...links.querySelectorAll('a')];
  function markChapter() {
    const hash = location.hash || chapterLinks[0].hash;
    for (const link of chapterLinks) {
      if (link.hash === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }
  markChapter();
  window.addEventListener('hashchange', markChapter);
  for (const link of chapterLinks) {
    link.addEventListener('click', () => {
      if (!desktop.matches) contents.open = false;
    });
  }

  // The initial anchor can be scrolled to before the layout enhancement runs.
  const initialChapter = chapters.find(chapter => '#' + chapter.id === location.hash);
  if (initialChapter) initialChapter.scrollIntoView({ behavior: 'instant' });
}

enhanceArticleContents();
