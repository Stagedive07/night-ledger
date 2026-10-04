(() => {
  const BUILD='LR3.32';
  const LR=window.LR216;
  if(!LR||typeof window.renderDeck!=='function'||typeof window.render!=='function')return;

  let deckViewOrder=null;
  let lastRenderedScreen=null;

  function rankedDeck(){
    return deckInstances().slice().sort((a,b)=>b.tier-a.tier||GD.cardDps(b)-GD.cardDps(a));
  }

  function stableDeck(){
    const live=deckInstances();
    const byId=new Map(live.map(inst=>[inst.uid,inst]));

    if(!deckViewOrder){
      const ranked=rankedDeck();
      deckViewOrder=ranked.map(inst=>inst.uid);
      return ranked;
    }

    /* Preserve every card that was already visible in exactly the same slot order.
       If the deck membership changes while this tab is open, remove cards that left
       and append genuinely new cards without reshuffling the cards the player was
       already working through. A fresh DPS/rarity sort happens on the next visit. */
    const kept=deckViewOrder.filter(uid=>byId.has(uid));
    const known=new Set(kept);
    const added=rankedDeck().filter(inst=>!known.has(inst.uid)).map(inst=>inst.uid);
    deckViewOrder=[...kept,...added];
    return deckViewOrder.map(uid=>byId.get(uid)).filter(Boolean);
  }

  function clearLibraryMode(){
    LR.swapTargetUid=null;
    LR.syndicatePick=false;
  }

  function cardMarkup(inst){
    const cost=inst.level<GD.CARD_LEVEL_CAP?GD.cardLevelCost(inst.tier,inst.level):0;
    return `<div class="deck-slot-v6" data-lr216-hold="${inst.uid}"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button><button class="deck-level-btn" data-deck-level="${inst.uid}" ${state.gold<cost||inst.level>=GD.CARD_LEVEL_CAP?'disabled':''}>${inst.level>=GD.CARD_LEVEL_CAP?'MAX LEVEL':`LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`}</button></div>`;
  }

  function bindDeckHold(){
    screen.querySelectorAll('[data-lr216-hold]').forEach(el=>{
      let timer=null,sx=0,sy=0;
      const run=()=>{
        timer=null;
        LR.swapTargetUid=el.dataset.lr216Hold;
        LR.syndicatePick=false;
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
        const p=e.touches[0];
        if(Math.abs(p.clientX-sx)>12||Math.abs(p.clientY-sy)>12)stop();
      },{passive:true});
      el.addEventListener('touchend',stop);
      el.addEventListener('mousedown',start);
      el.addEventListener('mouseup',stop);
      el.addEventListener('mouseleave',stop);
    });
  }

  window.renderDeck=renderDeck=function(){
    clearLibraryMode();
    const d=stableDeck();
    const rows=[d.slice(0,1),d.slice(1,3),d.slice(3,6),d.slice(6,10)];
    screen.innerHTML=`<div class="pixel-panel tight deck-head-v6"><div class="panel-title"><h2>OPERATION DECK</h2><small>${d.length}/10 ACTIVE</small></div><button class="btn primary" id="auto-deck-v6">AUTO EQUIP HIGHEST DPS</button><p>Tap to inspect. Hold to replace.</p></div><div class="deck-pyramid-v6">${rows.map((r,i)=>`<div class="deck-row-v6 count-${i+1}">${r.map(cardMarkup).join('')}</div>`).join('')}</div>`;
    document.getElementById('auto-deck-v6').onclick=()=>{
      autoFillDeck();
      save();
      render();
    };
    bindDeckHold();
  };

  const baseRender=window.render;
  window.render=render=function(){
    /* A Deck visit is one ordering session. Level-up renders stay in the same
       session. Leaving Deck ends it, so returning performs a fresh rank sort. */
    if(currentScreen==='deck'&&lastRenderedScreen!=='deck')deckViewOrder=null;
    if(currentScreen!=='deck'&&lastRenderedScreen==='deck')deckViewOrder=null;
    const out=baseRender.apply(this,arguments);
    lastRenderedScreen=currentScreen;
    return out;
  };

  window.LR3DeckStableOrder={build:BUILD,reset:()=>{deckViewOrder=null;}};
})();
