'use strict';
{
 const dialog=document.createElement('dialog');dialog.className='review-diagram-dialog';
 const close=document.createElement('button');close.type='button';close.textContent='關閉 ×';
 const content=document.createElement('div');dialog.append(close,content);document.body.append(dialog);
 close.addEventListener('click',()=>dialog.close());
 document.querySelectorAll('.visual-box svg').forEach(svg=>{const button=document.createElement('button');button.type='button';button.className='ctrl-btn';button.textContent='放大圖解';svg.parentElement.after(button);button.addEventListener('click',()=>{content.replaceChildren(svg.cloneNode(true));dialog.showModal()})});
}
