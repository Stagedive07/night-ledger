(() => {
  const BUILD='LR3.37';
  const LR=window.LR216;
  if(!LR||typeof window.showDefinitionDetail!=='function')return;

  function playCoin(){
    if(typeof window.lr2PlayExactSfx==='function')window.lr2PlayExactSfx('coin');
    else if(window.LR2PackV16?.playSfx)window.LR2PackV16.playSfx('coin');
    else if(typeof window.playUISoundV5==='function')window.playUISoundV5('coin');
  }

  function closeModal(){
    modalRoot.innerHTML='';
    modalOpen=false;
  }

  function sellOne(inst){
    if(!inst||!state.inventory.some(c=>c.uid===inst.uid))return 0;
    const refund=Number(sellRefund(inst))||0;
    state.deck=(state.deck||[]).filter(uid=>uid!==inst.uid);
    state.syndicate=(state.syndicate||[]).filter(uid=>uid!==inst.uid);
    state.inventory=(state.inventory||[]).filter(c=>c.uid!==inst.uid);
    if(refund>0)addWhispers(refund);
    const remaining=(state.inventory||[]).filter(c=>c.defId===inst.defId).length;
    if(!remaining)delete LR.copyCursor[inst.defId];
    else LR.copyCursor[inst.defId]=Math.max(0,Math.min(Number(LR.copyCursor[inst.defId])||0,remaining-1));
    save();
    return refund;
  }

  function confirmIndividualSale(inst,def){
    const refund=Number(sellRefund(inst))||0;
    const inDeck=(state.deck||[]).includes(inst.uid);
    const inSyndicate=(state.syndicate||[]).includes(inst.uid);
    const activeNote=inDeck?' This card is currently in your Operation Deck and will be removed from it.':inSyndicate?' This card is currently in your Syndicate and will be removed from it.':'';
    const holoNote=inst.holo?' This is a Holographic card.':'';
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal lr-confirm"><div class="kicker">CONFIRM SALE</div><h2>Sell ${escapeHtml(def?.name||'this card')}?</h2><p>You will receive <b>${GD.formatNum(refund)} Whispers</b>.${activeNote}${holoNote} This cannot be undone.</p><div class="btn-row"><button class="btn ghost" id="lr337-sale-no">CANCEL</button><button class="btn danger" id="lr337-sale-yes">YES, SELL</button></div></div></div>`;
    document.getElementById('lr337-sale-no').onclick=()=>showDefinitionDetail(inst.defId,inst.uid);
    document.getElementById('lr337-sale-yes').onclick=()=>{
      sellOne(inst);
      playCoin();
      closeModal();
      render();
    };
  }

  function beginReplace(inst,where){
    closeModal();
    if(where==='deck'){
      LR.swapTargetUid=inst.uid;
      LR.syndicatePick=false;
      LR.syndicateSwapTargetUid=null;
    }else{
      LR.syndicateSwapTargetUid=inst.uid;
      LR.syndicatePick=true;
      LR.swapTargetUid=null;
    }
    currentScreen='library';
    render();
  }

  const baseShowDefinitionDetail=window.showDefinitionDetail;
  window.showDefinitionDetail=showDefinitionDetail=function(defId,instId=null){
    const out=baseShowDefinitionDetail.apply(this,arguments);
    const inst=instId?getInstance(instId):getInstance(LR.detailUid);
    if(!inst)return out;
    const def=getDef(inst);
    const close=document.getElementById('detail-close');
    if(!close)return out;

    /* Individual selling is always available from card detail, including the last
       owned copy. Active cards are removed from their slot only after confirmation. */
    document.getElementById('lr-sell-one')?.remove();
    document.getElementById('lr337-sell-one')?.remove();
    const sell=document.createElement('button');
    sell.className='btn danger';
    sell.id='lr337-sell-one';
    sell.innerHTML=`SELL CARD · ${GD.formatNum(Number(sellRefund(inst))||0)} WHISPERS`;
    sell.onclick=()=>confirmIndividualSale(inst,def);
    close.insertAdjacentElement('beforebegin',sell);

    const inDeck=(state.deck||[]).includes(inst.uid);
    const inSyndicate=(state.syndicate||[]).includes(inst.uid);
    if(inDeck||inSyndicate){
      const replace=document.createElement('button');
      replace.className='btn primary';
      replace.id='lr337-replace';
      replace.textContent=inDeck?'REPLACE IN DECK':'REPLACE IN SYNDICATE';
      replace.onclick=()=>beginReplace(inst,inDeck?'deck':'syndicate');
      sell.insertAdjacentElement('beforebegin',replace);
    }
    return out;
  };

  if(typeof window.renderDeck==='function'){
    const baseRenderDeck=window.renderDeck;
    window.renderDeck=renderDeck=function(){
      const out=baseRenderDeck.apply(this,arguments);
      const hint=screen.querySelector('.deck-head-v6 > p');
      if(hint)hint.textContent='Tap a card to upgrade, sell, or replace it. Hold to replace still works.';
      return out;
    };
  }

  if(typeof window.renderSyndicate==='function'){
    const baseRenderSyndicate=window.renderSyndicate;
    window.renderSyndicate=renderSyndicate=function(){
      const out=baseRenderSyndicate.apply(this,arguments);
      const hint=screen.querySelector('.syndicate-panel-v6 > p');
      if(hint)hint.textContent='Tap a card to upgrade, sell, or replace it. Hold to replace still works.';
      return out;
    };
  }

  window.LR3CardActions={build:BUILD};
})();
