(() => {
  const BUILD='LR3.10';
  const LR=window.LR216=window.LR216||{libraryFilter:0,librarySort:'rarityDps',librarySearch:'',copyCursor:{},swapTargetUid:null,syndicatePick:false,detailUid:null,packPage:0};

  function ensureStore(){
    state.packDiscovered ||= {};
    for(const tier of GD.TIERS)state.packDiscovered[tier.id] ||= [];
  }
  function addSeen(tier,defId){
    ensureStore();
    const def=GD.CARD_MAP[defId];
    if(!def||def.tier!==Number(tier))return;
    const bucket=state.packDiscovered[tier];
    if(!bucket.includes(defId))bucket.push(defId);
  }
  function migrateExisting(){
    ensureStore();
    let changed=false;
    for(const inst of state.inventory||[]){
      const tier=Number(inst.sourcePackTier);
      if(!tier||inst.tier!==tier)continue;
      if(inst.defId==='t1-c05'&&state.lr216CrookedTomTestGranted)continue;
      const before=state.packDiscovered[tier].length;
      addSeen(tier,inst.defId);
      if(state.packDiscovered[tier].length!==before)changed=true;
    }
    if(changed)save();
  }
  function recordPack(tier,pack){
    ensureStore();
    (pack||[]).forEach(card=>addSeen(Number(tier),card.defId));
    save();
  }
  function packDiscovery(tier){
    ensureStore();
    const defs=GD.CARDS.filter(c=>c.tier===Number(tier));
    const seen=new Set(state.packDiscovered[tier]||[]);
    const odds=GD.packOdds(Number(tier),state.hideoutLevel,effectTotals().appraiser);
    return{defs,found:defs.filter(c=>seen.has(c.id)).length,total:defs.length,odds};
  }
  function showPackInfo(tier){
    const t=GD.tierData(tier),d=packDiscovery(tier);
    const rows=d.odds.slice().sort((a,b)=>b.tier-a.tier).map(o=>`<div class="lr-pack-odds-row"><b>${escapeHtml(GD.tierData(o.tier).name)}</b><span>${(o.p*100).toFixed(o.p<.01?2:1)}%</span></div>`).join('');
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal lr-pack-info"><div class="kicker">${escapeHtml(t.name.toUpperCase())} DECK</div><h2>PACK INFORMATION</h2><div class="detail-stat"><small>DISCOVERED FROM THIS PACK</small><b>${d.found} / ${d.total}</b></div><h3>RANDOM CARD RARITY CHANCES</h3><div class="lr-pack-odds">${rows}</div><p class="tiny">Each pack also guarantees one ${escapeHtml(t.name)} card.</p><button class="btn primary" id="lr-pack-info-close" style="width:100%">CLOSE</button></div></div>`;
    document.getElementById('lr-pack-info-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }

  const baseShow=window.showPackOpening;
  if(typeof baseShow==='function')window.showPackOpening=showPackOpening=function(packTier,pack,price,done){
    recordPack(packTier,pack);
    return baseShow(packTier,pack,price,done);
  };

  window.renderPacks=renderPacks=function(){
    const all=GD.TIERS,per=2,pages=Math.ceil(all.length/per);
    LR.packPage=clamp(LR.packPage||0,0,pages-1);
    const shown=all.slice(LR.packPage*per,LR.packPage*per+per),highest=GD.tierForHideout(state.hideoutLevel);
    const cards=shown.map(t=>{
      const locked=state.hideoutLevel<t.unlock,price=packCost(t.id),free=state.freeStreetPack&&t.id===1,d=locked?null:packDiscovery(t.id);
      return `<div class="pack-card-v5 lr-pack-card ${locked?'locked':''}" style="color:${locked?'#515961':t.accent}" data-pack-info="${t.id}"><div class="pack-mini"><div><b>${locked?'UNKNOWN PACK':`${t.name.toUpperCase()} DECK`}</b><small>${locked?'SEALED':'BOOSTER PACK'}</small></div></div><div>${locked?`<div class="pack-lock-copy">Reach Hideout Level ${t.unlock} to unlock.</div>`:`<div class="pack-lock-copy">10 cards · Discovered ${d.found}/${d.total}<br><span class="lr-tap-info">Tap pack for rarity chances.</span></div>`}<div class="pack-cost">${free?'FREE FIRST PACK':`${GD.formatNum(price)} WHISPERS`}</div><button class="btn ${!locked&&t.id===highest?'primary':''}" data-open-pack="${t.id}" ${locked?'disabled':''}>${free?'OPEN':'BUY'}</button></div></div>`;
    }).join('');
    screen.innerHTML=`<div class="pixel-panel tight packs-heading"><div class="panel-title"><h2>BOOSTER PACKS</h2><small>10 CARDS EACH</small></div><p>Tap a pack for odds and discovery progress.</p></div><div class="pack-grid-v5">${cards}</div><div class="pack-pager"><button class="btn ghost" id="prev-v6" ${LR.packPage===0?'disabled':''}>PREV</button><div class="pack-page">${LR.packPage+1}/${pages}</div><button class="btn ghost" id="next-v6" ${LR.packPage===pages-1?'disabled':''}>NEXT</button></div>`;
    document.getElementById('prev-v6').onclick=()=>{LR.packPage--;renderPacks();};
    document.getElementById('next-v6').onclick=()=>{LR.packPage++;renderPacks();};
    screen.querySelectorAll('[data-pack-info]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-open-pack]'))return;const id=Number(card.dataset.packInfo);if(state.hideoutLevel>=GD.tierData(id).unlock)showPackInfo(id);});
    screen.querySelectorAll('[data-open-pack]').forEach(b=>b.onclick=e=>{e.stopPropagation();openPack(Number(b.dataset.openPack),state.freeStreetPack&&Number(b.dataset.openPack)===1);});
  };

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function')window.renderSettings=renderSettings=function(){
    const out=baseSettings.apply(this,arguments);
    const stamp=document.getElementById('lr-build-stamp');
    if(stamp)(stamp.querySelector('span')||stamp).textContent=BUILD;
    return out;
  };

  migrateExisting();
  window.LR3PackDiscovery={build:BUILD,packDiscovery,recordPack};
})();
