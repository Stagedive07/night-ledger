(() => {
  const DEF='t1-c05',ART='assets/card-art/crooked-tom.webp',MARK='lr216CrookedTomTestGranted';
  const baseCardMarkup=window.gameCardMarkup;
  if(typeof baseCardMarkup==='function'){
    window.gameCardMarkup=gameCardMarkup=function(inst,opts={}){
      let html=baseCardMarkup(inst,opts);
      if(inst?.defId===DEF){
        const img=`<img src="${ART}" alt="Crooked Tom" draggable="false">`;
        html=html.replace('<span class="art-placeholder">[ CARD ART TBD ]</span>',img).replace('[ CARD ART TBD ]',img);
      }
      return html;
    };
  }
  function ensureCrooked(){
    if(!state?.inventory||!GD?.CARD_MAP?.[DEF])return null;
    let card=state.inventory.find(c=>c.defId===DEF&&c.holo);
    if(!card){
      card=state.inventory.find(c=>c.defId===DEF);
      if(!card){
        card=createCardInstance(GD.CARD_MAP[DEF],1,GD.packBaseCost(1));
        card.isNew=false;
        state.inventory.push(card);
      }
      card.holo=true;
    }
    if(!state.discovered.includes(DEF))state.discovered.push(DEF);
    if(!state.holoSeen.includes(DEF))state.holoSeen.push(DEF);
    state[MARK]=true;save();return card;
  }
  function showFlipTest(){
    const card=ensureCrooked();if(!card)return;
    const back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal pack-modal lr216-crooked-modal"><div class="kicker">HOLOGRAPHIC TEST CARD</div><h2>CROOKED TOM</h2><p class="tiny">Tap the card to flip it.</p><div class="reveal-stack active lr216-reveal-stack" style="min-height:430px"><div class="reveal-card lr2-reveal-card lr216-reveal-card" id="lr216-crooked-card"><div class="flip-inner lr216-flip-inner" style="--lr-flip-angle:0deg;--lr-flip-x:0deg"><div class="reveal-face reveal-back"><img src="${back}" alt="Street Deck card back" draggable="false"></div><div class="reveal-face reveal-front">${gameCardMarkup(card,{showNew:false,showLevel:true})}</div></div></div></div><div class="btn-row"><button class="btn ghost" id="lr216-crooked-reset">RESET FLIP</button><button class="btn primary" id="lr216-crooked-close">CLOSE</button></div></div></div>`;
    const host=document.getElementById('lr216-crooked-card'),inner=host.querySelector('.flip-inner');let flipped=false,busy=false;
    const reset=()=>{flipped=false;busy=false;inner.classList.remove('faceup');inner.style.setProperty('--lr-flip-angle','0deg');inner.style.setProperty('--lr-flip-x','0deg');host.style.setProperty('--lr-flip-lift','0px');host.style.setProperty('--lr-flip-scale','1');};
    host.onclick=async()=>{if(flipped||busy)return;busy=true;window.LR2PackV16?.playSfx?.('flipUp');await window.LR2SpringFlip?.(inner,host);inner.classList.add('faceup');flipped=true;busy=false;window.LR2SimeyCard?.scan?.(host);};
    document.getElementById('lr216-crooked-reset').onclick=()=>{window.LR2PackV16?.playSfx?.('flipDown');reset();};
    document.getElementById('lr216-crooked-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
    window.LR2SimeyCard?.scan?.(modalRoot);
  }
  const base=window.renderSettings;
  if(typeof base==='function')window.renderSettings=function(){
    const out=base.apply(this,arguments),card=ensureCrooked(),host=screen.querySelector('.more-settings-v6')||screen.querySelector('.pixel-panel');
    if(card&&host&&!document.getElementById('lr216-crooked-test')){
      const b=document.createElement('button');b.className='btn primary';b.id='lr216-crooked-test';b.style.width='100%';b.style.marginTop='8px';b.textContent='TEST HOLOGRAPHIC CROOKED TOM';b.onclick=showFlipTest;host.appendChild(b);
    }
    return out;
  };
  const card=ensureCrooked();
  window.LR216CrookedTom={ensure:ensureCrooked,showFlipTest,uid:card?.uid||null};
})();