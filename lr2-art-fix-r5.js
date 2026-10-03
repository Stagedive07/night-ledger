(() => {
  const BUILD='LR2.16r5';
  const CROOKED_ID='t1-c05';
  const CROOKED_ART='assets/card-art/crooked-tom.webp?v=LR2.16r5';

  function crookedImg(){
    const img=document.createElement('img');
    img.src=CROOKED_ART;
    img.alt='Crooked Tom';
    img.draggable=false;
    return img;
  }

  function patchRendered(root=document){
    root.querySelectorAll?.('.game-card').forEach(card=>{
      const name=card.querySelector('.game-card-name')?.textContent?.trim();
      if(name!=='Crooked Tom')return;
      const art=card.querySelector('.game-card-art');
      if(!art||art.querySelector('img'))return;
      const placeholder=art.querySelector('.art-placeholder');
      if(placeholder){placeholder.replaceWith(crookedImg());return;}
      const textNode=[...art.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.includes('CARD ART TBD'));
      if(textNode)textNode.replaceWith(crookedImg());
      else art.prepend(crookedImg());
    });
  }

  const base=window.gameCardMarkup;
  if(typeof base==='function'){
    window.gameCardMarkup=gameCardMarkup=function(inst,opts={}){
      let html=base(inst,opts);
      if(inst?.defId===CROOKED_ID){
        const img=`<img src="${CROOKED_ART}" alt="Crooked Tom" draggable="false">`;
        html=html.replace(/<span class="art-placeholder">[\s\S]*?<\/span>/,img);
        if(!html.includes(CROOKED_ART))html=html.replace('[ CARD ART TBD ]',img);
      }
      return html;
    };
  }

  const mo=new MutationObserver(records=>{
    for(const rec of records){
      for(const node of rec.addedNodes){
        if(node.nodeType===1)patchRendered(node);
      }
    }
  });
  mo.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(()=>patchRendered(document));

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function'){
    window.renderSettings=function(){
      const out=baseSettings.apply(this,arguments);
      const stamp=document.getElementById('lr-build-stamp');
      if(stamp){
        const value=stamp.querySelector('span')||stamp;
        value.textContent=BUILD;
      }
      patchRendered(screen);
      return out;
    };
  }

  window.LR2ArtFixR5={build:BUILD,patchRendered};
})();
