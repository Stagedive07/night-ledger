(() => {
  const BUILD='LR3.35';
  const LR=window.LR216;
  if(!LR||typeof window.renderLibrary!=='function'||typeof window.showDefinitionDetail!=='function')return;

  const equippedIds=()=>new Set([...(state.deck||[]),...(state.syndicate||[])]);
  const copiesFor=defId=>(state.inventory||[]).filter(c=>c.defId===defId);
  const strength=inst=>Number(GD.cardDps(inst))||0;

  function bestCopy(copies){
    return copies.slice().sort((a,b)=>strength(b)-strength(a)||(b.holo?1:0)-(a.holo?1:0))[0]||null;
  }

  function keepBestAndHoloCandidates(defId){
    const copies=copiesFor(defId);
    if(copies.length<2)return [];
    const keep=equippedIds();
    const best=bestCopy(copies);
    if(best)keep.add(best.uid);
    copies.filter(c=>c.holo).forEach(c=>keep.add(c.uid));
    return copies.filter(c=>!keep.has(c.uid));
  }

  function allInactiveDuplicateCandidates(){
    const groups=new Map();
    (state.inventory||[]).forEach(c=>{
      if(!groups.has(c.defId))groups.set(c.defId,[]);
      groups.get(c.defId).push(c);
    });
    const equipped=equippedIds(),sell=[];
    groups.forEach(copies=>{
      if(copies.length<2)return;
      const keep=new Set(equipped);
      const best=bestCopy(copies);
      if(best)keep.add(best.uid);
      copies.filter(c=>c.holo).forEach(c=>keep.add(c.uid));
      copies.forEach(c=>{if(!keep.has(c.uid))sell.push(c);});
    });
    return sell;
  }

  const refundFor=list=>list.reduce((sum,c)=>sum+(Number(sellRefund(c))||0),0);

  function playCoin(){
    if(typeof window.lr2PlayExactSfx==='function')window.lr2PlayExactSfx('coin');
    else if(window.LR2PackV16?.playSfx)window.LR2PackV16.playSfx('coin');
    else if(typeof window.playUISoundV5==='function')window.playUISoundV5('coin');
  }

  function sellList(list){
    if(!list.length)return 0;
    const ids=new Set(list.map(c=>c.uid));
    const refund=refundFor(list);
    state.inventory=state.inventory.filter(c=>!ids.has(c.uid));
    addWhispers(refund);
    Object.keys(LR.copyCursor||{}).forEach(defId=>{
      const count=copiesFor(defId).length;
      if(!count)delete LR.copyCursor[defId];
      else LR.copyCursor[defId]=Math.max(0,Math.min(Number(LR.copyCursor[defId])||0,count-1));
    });
    save();
    return refund;
  }

  function confirmSale(title,body,list,after){
    if(!list.length)return;
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal lr-confirm"><div class="kicker">CONFIRM SALE</div><h2>${escapeHtml(title)}</h2><p>${body}</p><div class="btn-row"><button class="btn ghost" id="lr335-sale-no">CANCEL</button><button class="btn danger" id="lr335-sale-yes">SELL</button></div></div></div>`;
    document.getElementById('lr335-sale-no').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
    document.getElementById('lr335-sale-yes').onclick=()=>{
      sellList(list);playCoin();modalRoot.innerHTML='';modalOpen=false;
      if(typeof after==='function')after();else render();
    };
  }

  /* Card detail keeps the existing KEEP BEST option. Replace the old
     KEEP HOLOGRAPHICS action with KEEP BEST & HOLOGRAPHIC, so the strongest
     copy is protected even when a weaker holo copy also exists. */
  const baseShowDefinitionDetail=window.showDefinitionDetail;
  window.showDefinitionDetail=showDefinitionDetail=function(defId,instId=null){
    const out=baseShowDefinitionDetail.apply(this,arguments);
    const list=keepBestAndHoloCandidates(defId);
    const refund=refundFor(list);
    let button=document.getElementById('lr-sell-holo');

    if(!list.length){
      if(button)button.remove();
      return out;
    }

    if(!button){
      button=document.createElement('button');
      button.className='btn ghost lr-bulk-sell';
      button.id='lr-sell-holo';
      const close=document.getElementById('detail-close');
      if(close)close.insertAdjacentElement('beforebegin',button);
    }
    button.innerHTML=`SELL DUPLICATES · KEEP BEST &amp; HOLOGRAPHIC<br><small>${list.length} COPIES · ${GD.formatNum(refund)} WHISPERS</small>`;
    button.onclick=()=>confirmSale(
      'Sell duplicate copies?',
      `Keep the strongest copy, every Holographic copy, and all equipped Deck/Syndicate copies. Sell <b>${list.length}</b> copies for <b>${GD.formatNum(refund)} Whispers</b>.`,
      list,
      ()=>{
        const remaining=copiesFor(defId);
        if(remaining.length)showDefinitionDetail(defId,remaining[0].uid);
        else{modalRoot.innerHTML='';modalOpen=false;render();}
      }
    );
    return out;
  };

  /* Add one Library-wide cleanup action only in normal browsing mode. It never
     sells an equipped card, a best copy, or a holographic copy. */
  const baseRenderLibrary=window.renderLibrary;
  window.renderLibrary=renderLibrary=function(){
    const out=baseRenderLibrary.apply(this,arguments);
    if(currentScreen!=='library'||LR.swapTargetUid||LR.syndicatePick)return out;

    const list=allInactiveDuplicateCandidates();
    const refund=refundFor(list);
    const panel=document.createElement('div');
    panel.className='pixel-panel tight lr335-library-bulk';
    panel.innerHTML=`<button class="btn danger" id="lr335-sell-all" style="width:100%" ${list.length?'':'disabled'}>SELL ALL INACTIVE DUPLICATES<br><small>KEEP EQUIPPED, BEST, AND HOLOGRAPHICS${list.length?` · ${list.length} COPIES · ${GD.formatNum(refund)} WHISPERS`:''}</small></button>`;
    screen.appendChild(panel);

    const button=document.getElementById('lr335-sell-all');
    if(list.length)button.onclick=()=>confirmSale(
      'Sell all inactive duplicates?',
      `This keeps every equipped card, the strongest copy of each card, and every Holographic copy. Sell <b>${list.length}</b> inactive duplicates for <b>${GD.formatNum(refund)} Whispers</b>.`,
      list
    );
    return out;
  };

  window.LR3LibraryBulkSell={build:BUILD,keepBestAndHoloCandidates,allInactiveDuplicateCandidates};
})();
