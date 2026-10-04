(() => {
  const BUILD='LR3.30';
  const STYLES=['galaxy','amazing','radiant','trainer','v-full','vmax'];
  const validStyle=s=>STYLES.includes(s);

  function ensureHoloStyle(inst,random=true){
    if(!inst?.holo)return'';
    if(validStyle(inst.holoStyle))return inst.holoStyle;
    const i=random?Math.floor(Math.random()*STYLES.length):0;
    inst.holoStyle=STYLES[Math.max(0,Math.min(STYLES.length-1,i))];
    inst.holoStyleVersion=1;
    return inst.holoStyle;
  }

  let migrated=false;
  (state.inventory||[]).forEach(inst=>{
    if(inst?.holo&&!validStyle(inst.holoStyle)){
      ensureHoloStyle(inst,true);
      migrated=true;
    }
  });
  if(migrated)save();

  const baseCreate=window.createCardInstance||createCardInstance;
  createCardInstance=window.createCardInstance=function(){
    const inst=baseCreate.apply(this,arguments);
    if(inst?.holo)ensureHoloStyle(inst,true);
    return inst;
  };

  const baseMarkup=window.gameCardMarkup||gameCardMarkup;
  gameCardMarkup=window.gameCardMarkup=function(inst,opts={}){
    let html=baseMarkup(inst,opts);
    if(!inst?.holo)return html;
    const style=ensureHoloStyle(inst,true);
    html=html.replace('<div class="game-card ',`<div class="game-card holo-variant-${style} `);
    html=html.replace(' style="border-color:',` data-holo-style="${style}" data-card-uid="${String(inst.uid||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}" style="border-color:`);
    return html;
  };

  function addVariantLayer(card){
    if(!card?.classList?.contains('holo'))return;
    if(!card.dataset.holoStyle){
      const uid=card.dataset.cardUid;
      const inst=uid?getInstance(uid):null;
      if(inst?.holo){
        const style=ensureHoloStyle(inst,true);
        card.dataset.holoStyle=style;
        card.classList.add(`holo-variant-${style}`);
        save();
      }
    }
    if(!card.querySelector(':scope > .lr-simey-foil')){
      const foil=document.createElement('span');
      foil.className='lr-simey-foil';
      foil.setAttribute('aria-hidden','true');
      card.appendChild(foil);
    }
  }

  function scan(root=document){
    if(root.matches?.('.game-card.holo'))addVariantLayer(root);
    root.querySelectorAll?.('.game-card.holo').forEach(addVariantLayer);
    window.LR2SimeyCard?.scan?.(root);
  }

  const mo=new MutationObserver(records=>{
    for(const rec of records){
      for(const node of rec.addedNodes){
        if(node.nodeType===1)scan(node);
      }
    }
  });
  mo.observe(document.body,{childList:true,subtree:true});
  requestAnimationFrame(()=>scan(document));

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function')renderSettings=window.renderSettings=function(){
    const out=baseSettings.apply(this,arguments);
    const stamp=document.getElementById('lr-build-stamp');
    if(stamp){const target=stamp.querySelector('span')||stamp;target.textContent=BUILD;}
    return out;
  };

  window.LR3HoloVariants={build:BUILD,styles:[...STYLES],ensureHoloStyle,scan};
})();
