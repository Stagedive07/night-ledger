(() => {
  const BUILD='LR4.9';
  const R6=window.LR2SyndicateR6;
  const CORE=window.LR4FacilityCore;
  const ABILITIES=['Architect','Broker','Appraiser','Salvager','Bookkeeper','Informant','Hideout Keeper'];
  const PLURAL={Architect:'ARCHITECTS',Broker:'BROKERS',Appraiser:'APPRAISERS',Salvager:'SALVAGERS',Bookkeeper:'BOOKKEEPERS',Informant:'INFORMANTS','Hideout Keeper':'HIDEOUT KEEPERS'};

  function supportDef(inst){
    const def=inst?getDef(inst):null;
    return def?.ability?.zone==='syndicate'?def:null;
  }

  function conciseSupportText(inst){
    const def=supportDef(inst);if(!def)return'';
    const a=def.ability;
    const v=Number(R6?.supportValue?.(inst))||Number(a.value)||0;
    const p=`${(v*100).toFixed(2)}%`;
    switch(a.name){
      case'Architect':return `Hideout build speed +${p}.`;
      case'Broker':return `Pack cost -${p}.`;
      case'Appraiser':return `Higher-tier card chance +${p}.`;
      case'Salvager':return `Sale refunds +${p}.`;
      case'Bookkeeper':return `Gold +${p} while active and offline.`;
      case'Informant':return `Intel +${p} while active and offline.`;
      case'Hideout Keeper':return `Offline rewards +${v.toFixed(2)} HR.`;
      default:return a.text||'';
    }
  }

  if(R6)R6.supportText=conciseSupportText;

  const baseMarkup=window.gameCardMarkup||gameCardMarkup;
  window.gameCardMarkup=gameCardMarkup=function(inst,opts={}){
    let html=baseMarkup(inst,opts);
    if(!supportDef(inst)||opts.hideAbilityText)return html;
    const def=getDef(inst);
    const original=def?.ability?.text?escapeHtml(def.ability.text):'';
    const verbose=(()=>{
      const a=def?.ability;if(!a)return'';
      const v=Number(R6?.supportValue?.(inst))||Number(a.value)||0,p=`${(v*100).toFixed(2)}%`;
      switch(a.name){
        case'Architect':return `Hideout construction is ${p} faster.`;
        case'Broker':return `Deck Booster Packs cost ${p} fewer Whispers.`;
        case'Appraiser':return `Improves the chance of finding higher-tier cards by ${p}.`;
        case'Salvager':return `Selling cards refunds ${p} more Whispers.`;
        case'Bookkeeper':return `+${p} Gold from Operations and while you are away.`;
        case'Informant':return `+${p} Intel from Operations and while you are away.`;
        case'Hideout Keeper':return `Offline rewards continue accumulating for ${v.toFixed(2)} additional hours.`;
        default:return a.text||'';
      }
    })();
    const concise=escapeHtml(conciseSupportText(inst));
    const verboseEsc=escapeHtml(verbose);
    if(verboseEsc&&html.includes(verboseEsc))html=html.replace(verboseEsc,concise);
    else if(original&&html.includes(original))html=html.replace(original,concise);
    return html;
  };

  function supportLevelGain(inst){
    if(!supportDef(inst)||inst.level>=GD.CARD_LEVEL_CAP)return'';
    const level1=Number(R6?.supportLevel1Value?.(inst))||0;
    const step=Number(R6?.levelStep)||.0025;
    const delta=level1*step;
    if(getDef(inst)?.ability?.name==='Hideout Keeper')return `+${delta.toFixed(2)} HR`;
    const points=delta*100;
    return `+${points.toFixed(points<.1?2:1)}% EFFECT`;
  }

  function supportLevelButtonHtml(inst){
    const max=inst.level>=GD.CARD_LEVEL_CAP;
    const cost=max?0:GD.cardLevelCost(inst.tier,inst.level);
    const disabled=max||state.gold<cost;
    return `<button class="deck-level-btn lr49-syn-level" data-lr49-syn-level="${inst.uid}" ${disabled?'disabled':''}>${max?'MAX LEVEL':`LEVEL UP<span>${supportLevelGain(inst)} · ${GD.formatNum(cost)} GOLD</span>`}</button>`;
  }

  function playCoin(){
    if(window.LR4AudioPolicy?.enabled?.('sfx')===false)return;
    if(typeof window.lr2PlayExactSfx==='function')window.lr2PlayExactSfx('coin');
    else if(window.LR2PackV16?.playSfx)window.LR2PackV16.playSfx('coin');
  }

  function levelSupport(uid){
    const inst=getInstance(uid);if(!supportDef(inst)||inst.level>=GD.CARD_LEVEL_CAP)return;
    const cost=GD.cardLevelCost(inst.tier,inst.level);
    if(state.gold<cost)return toast('Not enough Gold.');
    const y=screen.scrollTop;
    state.gold-=cost;inst.level++;
    playCoin();save();updateTopbar?.();render();
    requestAnimationFrame(()=>{if(currentScreen==='syndicate')screen.scrollTop=y;});
  }

  function equipAbility(name){
    const slots=Math.max(1,Number(GD.syndicateSlots(state.hideoutLevel))||6);
    const candidates=state.inventory
      .filter(inst=>supportDef(inst)?.ability?.name===name)
      .sort((a,b)=>(Number(R6?.supportValue?.(b))||0)-(Number(R6?.supportValue?.(a))||0)||b.tier-a.tier);
    if(!candidates.length)return toast(`No ${PLURAL[name]?.toLowerCase()||name} found.`);
    const chosen=candidates.slice(0,slots);
    const ids=new Set(chosen.map(c=>c.uid));
    state.deck=state.deck.filter(uid=>!ids.has(uid));
    state.syndicate=chosen.map(c=>c.uid);
    save();render();
  }

  function injectQuickEquip(){
    if(currentScreen!=='syndicate'||!state.unlocks.syndicate)return;
    screen.querySelector('.lr49-quick-equip')?.remove();
    const panel=screen.querySelector('.syndicate-panel-v6');if(!panel)return;
    const box=document.createElement('div');
    box.className='lr49-quick-equip';
    box.innerHTML=`<div class="lr49-quick-title">QUICK EQUIP BY ABILITY</div><div class="lr49-quick-grid">${ABILITIES.map(name=>{
      const count=state.inventory.filter(inst=>supportDef(inst)?.ability?.name===name).length;
      return `<button class="mini-btn" data-lr49-equip-ability="${escapeHtml(name)}" ${count?'':'disabled'}>${escapeHtml(PLURAL[name])}<span>${count}</span></button>`;
    }).join('')}</div>`;
    const grid=panel.querySelector('.syndicate-grid-v6');
    if(grid)grid.insertAdjacentElement('beforebegin',box);else panel.appendChild(box);
    box.querySelectorAll('[data-lr49-equip-ability]').forEach(btn=>btn.onclick=e=>{e.preventDefault();equipAbility(btn.dataset.lr49EquipAbility);});
  }

  function injectSyndicateLevelButtons(){
    if(currentScreen!=='syndicate'||!state.unlocks.syndicate)return;
    const active=syndicateInstances();
    const slots=[...screen.querySelectorAll('.syndicate-slot-v6')];
    slots.forEach((slot,i)=>{
      slot.querySelector('.lr49-syn-level')?.remove();
      const inst=active[i];if(!inst)return;
      slot.insertAdjacentHTML('beforeend',supportLevelButtonHtml(inst));
      const btn=slot.querySelector('.lr49-syn-level');
      if(btn)btn.onclick=e=>{e.preventDefault();e.stopPropagation();levelSupport(btn.dataset.lr49SynLevel);};
    });
  }

  function decorateDetail(){
    const uid=window.LR216?.detailUid;
    const inst=uid?getInstance(uid):null;
    if(!supportDef(inst))return;
    const ability=modalRoot.querySelector('.lr-detail-ability p');
    const concise=conciseSupportText(inst);
    if(ability&&ability.textContent!==concise)ability.textContent=concise;
    const btn=document.getElementById('detail-level');
    if(btn&&inst.level<GD.CARD_LEVEL_CAP){
      const cost=GD.cardLevelCost(inst.tier,inst.level);
      const text=`LEVEL UP · ${supportLevelGain(inst)} · ${GD.formatNum(cost)} GOLD`;
      if(btn.textContent!==text)btn.textContent=text;
    }
  }

  const detailObserver=new MutationObserver(()=>{if(modalOpen)decorateDetail();});
  detailObserver.observe(modalRoot,{subtree:true,childList:true,characterData:true});

  function directIntelGainForHideout(){return 0;}

  function injectHideoutPreview(){
    if(currentScreen!=='hideout'||!state.unlocks.hideout)return;
    const grid=screen.querySelector('.hideout-bottom-grid');if(!grid)return;
    grid.querySelector('.lr49-next-hideout')?.remove();
    const h=Math.max(1,Number(state.hideoutLevel)||1);
    const target=Math.min(20,Number(state.hideoutBuild?.targetLevel)||h+1);
    const future=target+1;
    if(target>=20||future>20){grid.classList.add('lr49-single');return;}
    grid.classList.remove('lr49-single');
    const networkBonus=Number(CORE?.bonus?.('whisperNetwork'))||0;
    const rateAt=lvl=>(Number(CORE?.baseWhisperRate?.(lvl))||Number(GD.whisperRatePerHour(lvl))||0)*(1+networkBonus);
    const whisperGain=Math.max(0,rateAt(future)-rateAt(target));
    const intelGain=directIntelGainForHideout(target,future);
    const preview=document.createElement('div');
    preview.className='pixel-panel lr49-next-hideout';
    preview.innerHTML=`<div class="panel-title"><h3>NEXT</h3><small>AFTER LEVEL ${target}</small></div><div class="lr49-next-level">LEVEL ${future}</div><div class="lr49-next-output"><div class="stat"><small>COST</small><b>${GD.formatNum(GD.hideoutIntelCost(future))} INTEL</b></div><div class="stat"><small>WHISPERS / HR</small><b>+${GD.formatNum(whisperGain)}</b></div><div class="stat"><small>INTEL / HR</small><b>+${GD.formatNum(intelGain)}</b></div></div>`;
    grid.appendChild(preview);
  }

  const baseRenderSyndicate=window.renderSyndicate;
  window.renderSyndicate=renderSyndicate=function(){
    const out=baseRenderSyndicate.apply(this,arguments);
    injectQuickEquip();injectSyndicateLevelButtons();
    const intro=screen.querySelector('.syndicate-panel-v6 > p');
    if(intro)intro.textContent='Support operatives work from the Hideout. Tap to inspect. Hold to replace.';
    return out;
  };

  const baseRenderHideout=window.renderHideout;
  window.renderHideout=renderHideout=function(){
    const out=baseRenderHideout.apply(this,arguments);
    injectHideoutPreview();
    return out;
  };

  const baseShowDefinitionDetail=window.showDefinitionDetail;
  if(typeof baseShowDefinitionDetail==='function')window.showDefinitionDetail=showDefinitionDetail=function(){
    const out=baseShowDefinitionDetail.apply(this,arguments);
    decorateDetail();
    return out;
  };

  const baseRender=window.render;
  window.render=render=function(){
    const out=baseRender.apply(this,arguments);
    if(currentScreen==='syndicate'){injectQuickEquip();injectSyndicateLevelButtons();}
    if(currentScreen==='hideout')injectHideoutPreview();
    return out;
  };

  const style=document.createElement('style');
  style.textContent=`
    .hideout-bottom-grid{grid-template-columns:1.45fr .95fr!important;align-items:stretch}
    .hideout-bottom-grid.lr49-single{grid-template-columns:1fr!important}
    .lr49-next-hideout{margin:0!important;padding:9px!important;display:flex;flex-direction:column;justify-content:flex-start;min-width:0}
    .lr49-next-hideout .panel-title{margin-bottom:6px!important}
    .lr49-next-hideout h3{font-size:13px!important}
    .lr49-next-level{font-size:24px;font-weight:900;line-height:1;margin:5px 0 10px}
    .lr49-next-output{display:grid;gap:6px}
    .lr49-next-output .stat{padding:7px!important}
    .lr49-next-output .stat small{font-size:7px!important}
    .lr49-next-output .stat b{font-size:13px!important}
    .lr49-quick-equip{border:1px solid #313a43;background:#0e1318;padding:7px;margin:6px 0 8px}
    .lr49-quick-title{font-size:8px;color:var(--muted);letter-spacing:.08em;margin-bottom:5px}
    .lr49-quick-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4px}
    .lr49-quick-grid .mini-btn{font-size:8px;min-height:31px;padding:4px;display:flex;justify-content:space-between;align-items:center;gap:4px}
    .lr49-quick-grid .mini-btn span{opacity:.65;font-size:8px}
    .lr49-syn-level{width:100%;min-height:38px!important;margin-top:4px;font-size:8px!important;line-height:1.05!important;padding:4px 3px!important}
    .lr49-syn-level span{display:block;font-size:6.5px!important;margin-top:2px;opacity:.8;white-space:normal}
    @media(max-width:390px){
      .hideout-bottom-grid{grid-template-columns:1.42fr .9fr!important}
      .lr49-next-level{font-size:20px}
      .lr49-next-output .stat b{font-size:11px!important}
      .lr49-quick-grid .mini-btn{font-size:7px}
      .lr49-syn-level{font-size:7px!important}.lr49-syn-level span{font-size:6px!important}
    }
  `;
  document.head.appendChild(style);

  window.LR4SyndicateHideoutUX={build:BUILD,conciseSupportText,supportLevelGain,equipAbility,injectHideoutPreview};
})();
