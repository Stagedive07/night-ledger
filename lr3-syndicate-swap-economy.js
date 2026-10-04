(() => {
  const BUILD='LR3.33';
  const LR=window.LR216;
  if(!LR||typeof window.renderSyndicate!=='function'||typeof window.renderLibrary!=='function')return;

  function playSwapFlip(){
    if(typeof window.lr2PlayExactSfx==='function')window.lr2PlayExactSfx('flipUp');
    else if(window.LR2PackV16?.playSfx)window.LR2PackV16.playSfx('flipUp');
    else if(typeof window.playUISoundV5==='function')window.playUISoundV5('flip');
  }

  function clearSwapMode(){
    LR.syndicateSwapTargetUid=null;
    LR.syndicatePick=false;
    LR.swapTargetUid=null;
  }

  /* Duplicate value is now determined by the card's own tier, not the pack it
     happened to come from. This keeps two copies of the same tier worth the same
     base amount while preserving the Salvager bonus. */
  window.sellRefund=sellRefund=function(inst){
    if(!inst)return 0;
    const tier=Math.max(1,Number(inst.tier)||Number(getDef(inst)?.tier)||1);
    const base=GD.packBaseCost(tier)*.02;
    return Math.max(1,Math.round(base*(1+effectTotals().salvager)));
  };

  const baseRenderSyndicate=window.renderSyndicate;
  window.renderSyndicate=renderSyndicate=function(){
    LR.syndicateSwapTargetUid=null;
    const out=baseRenderSyndicate.apply(this,arguments);
    if(currentScreen!=='syndicate'||!state.unlocks.syndicate)return out;

    const active=syndicateInstances();
    const slots=screen.querySelectorAll('.syndicate-slot-v6');
    slots.forEach((el,i)=>{
      const inst=active[i];
      if(!inst)return;
      el.dataset.lr3SyndicateHold=inst.uid;
      let timer=null,sx=0,sy=0;
      const run=()=>{
        timer=null;
        playSwapFlip();
        LR.syndicateSwapTargetUid=inst.uid;
        LR.syndicatePick=true;
        LR.swapTargetUid=null;
        currentScreen='library';
        render();
      };
      const start=e=>{
        const p=e.touches?.[0]||e;
        sx=p.clientX;sy=p.clientY;
        if(timer)clearTimeout(timer);
        timer=setTimeout(run,520);
      };
      const stop=()=>{if(timer){clearTimeout(timer);timer=null;}};
      el.addEventListener('touchstart',start,{passive:true});
      el.addEventListener('touchmove',e=>{
        const p=e.touches?.[0];
        if(p&&(Math.abs(p.clientX-sx)>12||Math.abs(p.clientY-sy)>12))stop();
      },{passive:true});
      el.addEventListener('touchend',stop);
      el.addEventListener('touchcancel',stop);
      el.addEventListener('mousedown',start);
      el.addEventListener('mouseup',stop);
      el.addEventListener('mouseleave',stop);
    });

    const intro=screen.querySelector('.syndicate-panel-v6 > p');
    if(intro&&!intro.textContent.includes('Hold a card'))intro.textContent+=' Hold a card to replace it.';
    return out;
  };

  const baseRenderLibrary=window.renderLibrary;
  window.renderLibrary=renderLibrary=function(){
    const targetUid=LR.syndicateSwapTargetUid;
    const out=baseRenderLibrary.apply(this,arguments);
    if(!targetUid||!LR.syndicatePick)return out;

    const banner=screen.querySelector('.lr2-swap-banner');
    if(banner)banner.textContent='CHOOSE THE OPERATIVE YOU WANT IN THIS SYNDICATE SLOT';

    screen.querySelectorAll('[data-lr216-card]').forEach(button=>{
      button.onclick=()=>{
        const uid=button.dataset.lr216Card;
        const targetIndex=state.syndicate.indexOf(targetUid);
        if(targetIndex<0){
          clearSwapMode();
          currentScreen='syndicate';
          render();
          return;
        }

        if(uid!==targetUid){
          const existingIndex=state.syndicate.indexOf(uid);
          if(existingIndex>=0){
            state.syndicate[targetIndex]=uid;
            state.syndicate[existingIndex]=targetUid;
          }else{
            state.syndicate[targetIndex]=uid;
            state.deck=state.deck.filter(x=>x!==uid);
          }
        }

        clearSwapMode();
        save();
        currentScreen='syndicate';
        render();
      };
    });
    return out;
  };

  window.LR3SyndicateSwapEconomy={build:BUILD};
})();
