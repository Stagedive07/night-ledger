(() => {
  const BUILD='LR3.11';
  const DEF='t1-c05';
  const ART=`assets/card-art/crooked-tom.webp?v=${BUILD}`;

  function imgMarkup(){return `<img src="${ART}" alt="Crooked Tom" loading="eager" draggable="false">`;}
  function isCrooked(inst){return inst?.defId===DEF||getDef(inst)?.name==='Crooked Tom';}
  function forceMarkup(html,inst){
    if(!isCrooked(inst))return html;
    const art=`<div class="game-card-art">${imgMarkup()}</div>`;
    if(/<div class="game-card-art">[\s\S]*?<\/div>/.test(html))return html.replace(/<div class="game-card-art">[\s\S]*?<\/div>/,art);
    return html;
  }

  const base=window.gameCardMarkup;
  if(typeof base==='function'){
    window.gameCardMarkup=gameCardMarkup=function(inst,opts={}){
      return forceMarkup(base(inst,opts),inst);
    };
  }

  function patchCard(card){
    const name=card?.querySelector?.('.game-card-name')?.textContent?.trim();
    if(name!=='Crooked Tom')return;
    const art=card.querySelector('.game-card-art');
    if(!art)return;
    const img=art.querySelector('img');
    if(img&&img.getAttribute('src')===ART)return;
    art.innerHTML=imgMarkup();
  }
  function scan(root=document){
    if(root.matches?.('.game-card'))patchCard(root);
    root.querySelectorAll?.('.game-card').forEach(patchCard);
  }
  const observer=new MutationObserver(records=>{
    records.forEach(rec=>rec.addedNodes.forEach(node=>{if(node.nodeType===1)scan(node);}));
  });
  observer.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(()=>scan(document));
  window.LR3CrookedArt={build:BUILD,art:ART,scan};
})();
