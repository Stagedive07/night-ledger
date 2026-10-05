(() => {
  const BUILD='LR4.3';
  const LR=window.LR216=window.LR216||{};

  function packDiscovery(tier){
    if(window.LR3PackDiscovery?.packDiscovery)return window.LR3PackDiscovery.packDiscovery(Number(tier));
    const defs=GD.CARDS.filter(c=>c.tier===Number(tier));
    const seen=new Set(state.packDiscovered?.[tier]||[]);
    return{
      defs,
      found:defs.filter(c=>seen.has(c.id)).length,
      total:defs.length,
      odds:GD.packOdds(Number(tier),state.hideoutLevel,effectTotals().appraiser)
    };
  }

  function showPackInfo(tier){
    const t=GD.tierData(Number(tier)),d=packDiscovery(tier);
    const rows=d.odds.slice().sort((a,b)=>b.tier-a.tier).map(o=>`<div class="lr-pack-odds-row"><b>${escapeHtml(GD.tierData(o.tier).name)}</b><span>${(o.p*100).toFixed(o.p<.01?2:1)}%</span></div>`).join('');
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal lr-pack-info"><div class="kicker">${escapeHtml(t.name.toUpperCase())} DECK</div><h2>PACK INFORMATION</h2><div class="detail-stat"><small>DISCOVERED FROM THIS PACK</small><b>${d.found} / ${d.total}</b></div><h3>RANDOM CARD RARITY CHANCES</h3><div class="lr-pack-odds">${rows}</div><p class="tiny">Each pack also guarantees one ${escapeHtml(t.name)} card.</p><button class="btn primary" id="lr43-pack-info-close" style="width:100%">CLOSE</button></div></div>`;
    document.getElementById('lr43-pack-info-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }

  /* Packs are no longer gated by Hideout level. Price remains the progression
     gate, while the player's real Hideout level still feeds packOdds normally. */
  window.openPack=openPack=function(packTier,free=false){
    clearTutorialCoach();
    const tier=GD.tierData(packTier);
    if(!tier)return;
    const price=free?0:packCost(packTier);
    if(!free&&state.whispers<price)return toast('Not enough Whispers.');
    if(!free)state.whispers-=price;
    if(free)state.freeStreetPack=false;
    const before=new Set(state.discovered),pack=generatePack(packTier,free?GD.packBaseCost(packTier):price);
    let hadDuplicate=false,hadHolo=false;
    pack.forEach(c=>{
      c.isNew=!before.has(c.defId)&&!state.discovered.includes(c.defId);
      if(!c.isNew)hadDuplicate=true;
      if(!state.discovered.includes(c.defId)){state.discovered.push(c.defId);state.stats.cardsSeen++;}
      if(c.holo&&!state.holoSeen.includes(c.defId)){state.holoSeen.push(c.defId);state.stats.holosSeen++;hadHolo=true;}
      state.inventory.push(c);
    });
    state.stats.packsOpened++;
    if(!state.firstPackOpened){
      state.firstPackOpened=true;
      state.tutorial.pack=true;
      autoFillDeck();
      state.battle.paused=true;
      state.battle.enemy=null;
      currentScreen='battle';
    }
    save();
    showPackOpening(packTier,pack,price,()=>{
      if(hadDuplicate)enqueueStory(SD.system.firstDuplicate);
      if(hadHolo)enqueueStory(SD.system.shiny);
      render();
      maybeShowNextStory();
    });
  };

  window.renderPacks=renderPacks=function(){
    const all=GD.TIERS,per=2,pages=Math.ceil(all.length/per);
    LR.packPage=clamp(Number(LR.packPage)||0,0,pages-1);
    const shown=all.slice(LR.packPage*per,LR.packPage*per+per);
    const cards=shown.map(t=>{
      const price=packCost(t.id),free=state.freeStreetPack&&t.id===1,d=packDiscovery(t.id);
      return `<div class="pack-card-v5 lr-pack-card" style="color:${t.accent}" data-lr43-pack-info="${t.id}"><div class="pack-mini"><div><b>${t.name.toUpperCase()} DECK</b><small>BOOSTER PACK</small></div></div><div><div class="pack-lock-copy">10 cards · Discovered ${d.found}/${d.total}<br><span class="lr-tap-info">Tap pack for rarity chances.</span></div><div class="pack-cost">${free?'FREE FIRST PACK':`${GD.formatNum(price)} WHISPERS`}</div><button class="btn" data-open-pack="${t.id}">${free?'OPEN':'BUY'}</button></div></div>`;
    }).join('');
    screen.innerHTML=`<div class="pixel-panel tight packs-heading"><div class="panel-title"><h2>BOOSTER PACKS</h2><small>10 CARDS EACH</small></div><p>Tap a pack for odds and discovery progress.</p></div><div class="pack-grid-v5">${cards}</div><div class="pack-pager"><button class="btn ghost" id="prev-v6" ${LR.packPage===0?'disabled':''}>PREV</button><div class="pack-page">${LR.packPage+1}/${pages}</div><button class="btn ghost" id="next-v6" ${LR.packPage===pages-1?'disabled':''}>NEXT</button></div>`;
    document.getElementById('prev-v6').onclick=()=>{LR.packPage--;renderPacks();};
    document.getElementById('next-v6').onclick=()=>{LR.packPage++;renderPacks();};
    screen.querySelectorAll('[data-lr43-pack-info]').forEach(card=>card.onclick=e=>{
      if(e.target.closest('[data-open-pack]'))return;
      showPackInfo(Number(card.dataset.lr43PackInfo));
    });
    screen.querySelectorAll('[data-open-pack]').forEach(b=>b.onclick=e=>{
      e.stopPropagation();
      openPack(Number(b.dataset.openPack),state.freeStreetPack&&Number(b.dataset.openPack)===1);
    });
  };

  /* Hideout tiers still matter, but they no longer unlock packs. Remove stale
     player-facing copy that says otherwise. */
  if(typeof window.renderHideout==='function'){
    const baseRenderHideout=window.renderHideout;
    window.renderHideout=renderHideout=function(){
      const out=baseRenderHideout.apply(this,arguments);
      screen.querySelectorAll('.panel-title small').forEach(el=>{
        if(/PACK UNLOCK/i.test(el.textContent||''))el.textContent='NETWORK EXPANSION';
      });
      return out;
    };
  }

  if(typeof window.completeHideoutIfReady==='function'){
    const baseComplete=window.completeHideoutIfReady;
    window.completeHideoutIfReady=completeHideoutIfReady=function(){
      const originalToast=window.toast;
      if(typeof originalToast==='function')window.toast=function(msg){
        if(/\bpack unlocked\.?$/i.test(String(msg||'')))return;
        return originalToast.apply(this,arguments);
      };
      try{return baseComplete.apply(this,arguments);}
      finally{if(typeof originalToast==='function')window.toast=originalToast;}
    };
  }

  window.LR4PackAccess={build:BUILD,packDiscovery,showPackInfo};
})();
