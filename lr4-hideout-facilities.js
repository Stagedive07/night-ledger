(() => {
  const BUILD='LR4.4';
  const CORE=window.LR4FacilityCore;
  if(!CORE)return;
  const {CONFIG,MAX_LEVEL}=CORE;
  const SYN_KEYS={Architect:'architect',Broker:'broker',Appraiser:'appraiser',Salvager:'salvager',Bookkeeper:'bookkeeper',Informant:'informant','Hideout Keeper':'hideoutKeeper'};
  const CAPS={architect:.40,broker:.25,appraiser:.25,salvager:1,bookkeeper:.75,informant:.50,hideoutKeeper:Math.max(0,GD.MAX_OFFLINE_HOURS-GD.BASE_OFFLINE_HOURS)};

  CORE.ensureState();

  function level(key){return CORE.level(key);}
  function bonus(key){return CORE.bonus(key);}
  function pct(v){
    const n=v*100;
    return `${Number.isInteger(n)?n.toFixed(0):n.toFixed(1)}%`;
  }

  /* Passive Whisper income. */
  window.whisperRate=whisperRate=function(){
    return CORE.baseWhisperRate(state.hideoutLevel)*(1+bonus('whisperNetwork'));
  };

  /* Operation and offline resource bases. Syndicate Bookkeeper/Informant and
     Contract Insight remain multiplicative on top of these values. */
  GD.normalGold=function(operation){
    return CORE.baseNormalGold(operation)*(1+bonus('quartermaster'));
  };
  GD.normalIntel=function(operation){
    return CORE.baseNormalIntel(operation)*(1+bonus('intelligenceRoom'));
  };

  /* Armory is true global operative DPS. Because the late Syndicate override also
     uses GD.cardDps for support cards, leave support values untouched here. */
  const baseCardDps=GD.cardDps.bind(GD);
  GD.cardDps=function(inst){
    const value=baseCardDps(inst);
    const def=inst?getDef(inst):null;
    if(def?.ability?.zone==='syndicate')return value;
    return value*(1+bonus('armory'));
  };

  /* Recalculate Syndicate totals with the Office multiplier before applying the
     existing caps. This keeps the room useful without allowing capped support
     effects to grow beyond their intended limits. */
  const baseEffectTotals=window.effectTotals||effectTotals;
  window.effectTotals=effectTotals=function(){
    const totals=baseEffectTotals.apply(this,arguments);
    const office=1+bonus('syndicateOffice');
    if(office<=1)return totals;

    const supportValue=window.LR2SyndicateR6?.supportValue;
    if(typeof supportValue==='function'){
      const raw={architect:0,broker:0,appraiser:0,salvager:0,bookkeeper:0,informant:0,hideoutKeeper:0};
      syndicateInstances().forEach(inst=>{
        const name=getDef(inst)?.ability?.name,key=SYN_KEYS[name];
        if(key)raw[key]+=Number(supportValue(inst))||0;
      });
      Object.keys(raw).forEach(key=>{totals[key]=Math.min(CAPS[key],raw[key]*office);});
    }else{
      Object.keys(CAPS).forEach(key=>{totals[key]=Math.min(CAPS[key],(Number(totals[key])||0)*office);});
    }
    return totals;
  };

  function operationWhisperBonus(){return bonus('contractDesk');}
  function showContractReward(extra){
    if(!(extra>0))return;
    let host=document.getElementById('lr-global-reward-feed');
    if(!host){
      host=document.createElement('div');host.id='lr-global-reward-feed';host.className='lr-reward-feed lr-global-reward-feed';host.setAttribute('aria-live','polite');document.body.appendChild(host);
    }
    const el=document.createElement('div');el.className='lr-reward-pop';
    el.innerHTML=`<b>CONTRACT DESK</b><span class="whispers">+${GD.formatNum(extra)} WHISPERS</span>`;
    host.appendChild(el);setTimeout(()=>el.classList.add('show'),10);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250);},1900);
  }

  /* Contract Desk boosts both first clears and replays, but does not alter the
     canonical recorded first-clear value. A later upgrade therefore improves old
     replay farming too. */
  const baseHandleEnemyKilled=window.handleEnemyKilled;
  window.handleEnemyKilled=handleEnemyKilled=function(){
    const target=!!state.battle?.enemy?.target;
    const before=Number(state.whispers)||0;
    const result=baseHandleEnemyKilled.apply(this,arguments);
    if(target){
      const earned=(Number(state.whispers)||0)-before,b=operationWhisperBonus();
      if(earned>0&&b>0){
        const extra=earned*b;
        addWhispers(extra);
        save();
        updateTopbar?.();
        showContractReward(extra);
      }
    }
    return result;
  };

  function playUpgradeSfx(){
    if(typeof window.lr2PlayExactSfx==='function')window.lr2PlayExactSfx('coin');
    else if(window.LR2PackV16?.playSfx)window.LR2PackV16.playSfx('coin');
    else if(typeof window.playUISoundV5==='function')window.playUISoundV5('coin');
  }

  function facilityEffectText(key,lvl=level(key)){
    return `+${pct(CONFIG[key].step*lvl)} ${CONFIG[key].effect}`;
  }

  function facilityCard(key){
    const def=CONFIG[key],lvl=level(key),cap=Math.min(MAX_LEVEL,Math.max(1,Number(state.hideoutLevel)||1));
    const atMax=lvl>=MAX_LEVEL,atHideoutCap=!atMax&&lvl>=cap,next=lvl+1,cost=CORE.upgradeCost(key,next);
    const disabled=atMax||atHideoutCap||state.intel<cost;
    const button=atMax?'MAX':atHideoutCap?`HIDEOUT ${Math.min(20,lvl+1)}`:`UPGRADE · ${GD.formatNum(cost)} I`;
    return `<div class="lr44-facility">
      <div class="lr44-facility-head"><b>${escapeHtml(def.name)}</b><span>LV ${lvl}/${MAX_LEVEL}</span></div>
      <div class="lr44-facility-effect">${escapeHtml(facilityEffectText(key,lvl))}</div>
      <button class="mini-btn lr44-facility-up" data-lr44-facility="${key}" ${disabled?'disabled':''}>${button}</button>
    </div>`;
  }

  function upgradeFacility(key){
    const def=CONFIG[key];if(!def)return;
    CORE.ensureState();
    const current=level(key),cap=Math.min(MAX_LEVEL,Math.max(1,Number(state.hideoutLevel)||1));
    if(current>=MAX_LEVEL)return;
    if(current>=cap)return toast(`Upgrade the Hideout before raising ${def.name} again.`);
    const next=current+1,cost=CORE.upgradeCost(key,next);
    if(state.intel<cost)return toast('Not enough Intel.');
    state.intel-=cost;
    state.hideoutFacilities[key]=next;
    playUpgradeSfx();
    save();
    updateTopbar?.();
    render();
  }

  /* Add the six rooms to Hideout while replacing the old standalone Network Output
     panel so Hideout remains compact on mobile. */
  const baseRenderHideout=window.renderHideout;
  window.renderHideout=renderHideout=function(){
    const out=baseRenderHideout.apply(this,arguments);
    if(!state.unlocks.hideout)return out;

    [...screen.querySelectorAll('.pixel-panel')].forEach(panel=>{
      const title=panel.querySelector('.panel-title h3')?.textContent?.trim();
      if(title==='NETWORK OUTPUT')panel.remove();
    });
    screen.querySelector('.network-output-panel')?.remove();
    screen.querySelector('.lr44-facilities-panel')?.remove();

    const panel=document.createElement('div');
    panel.className='pixel-panel tight lr44-facilities-panel';
    panel.innerHTML=`<div class="panel-title"><h3>FACILITIES</h3><small>LEVEL CAP · HIDEOUT ${state.hideoutLevel}</small></div><div class="lr44-facility-grid">${Object.keys(CONFIG).map(facilityCard).join('')}</div>`;
    screen.appendChild(panel);
    panel.querySelectorAll('[data-lr44-facility]').forEach(btn=>btn.onclick=()=>upgradeFacility(btn.dataset.lr44Facility));
    return out;
  };

  /* Replay navigation should show the actual reward after Contract Desk. */
  if(typeof window.renderBattle==='function'){
    const baseRenderBattle=window.renderBattle;
    window.renderBattle=renderBattle=function(){
      const out=baseRenderBattle.apply(this,arguments);
      const op=Number(state.currentOperation)||1;
      if(state.battle?.replayActive&&window.LR3OperationReplay?.replayWhispersFor){
        const small=screen.querySelector('.lr318-operation-status small');
        if(small){
          const reward=window.LR3OperationReplay.replayWhispersFor(op)*(1+operationWhisperBonus());
          small.textContent=`25% OF OP ${op} ORIGINAL · ${GD.formatNum(reward)} WHISPERS`;
        }
      }
      return out;
    };
  }

  const style=document.createElement('style');
  style.textContent=`
    .lr44-facilities-panel{margin-top:8px;padding:9px!important}
    .lr44-facility-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
    .lr44-facility{min-width:0;border:1px solid #2b3239;background:#11161b;padding:7px}
    .lr44-facility-head{display:flex;gap:6px;align-items:flex-start;justify-content:space-between}
    .lr44-facility-head b{font-size:10px;line-height:1.15;letter-spacing:.04em}
    .lr44-facility-head span{font-size:9px;white-space:nowrap;opacity:.7}
    .lr44-facility-effect{font-size:9px;line-height:1.2;min-height:22px;margin:4px 0 5px;opacity:.82}
    .lr44-facility-up{width:100%;min-height:27px;padding:4px 5px;font-size:9px}
    @media(max-width:360px){.lr44-facility{padding:6px}.lr44-facility-head b,.lr44-facility-effect,.lr44-facility-up{font-size:8px}}
  `;
  document.head.appendChild(style);

  CORE.runtimeReady=true;
  window.LR4HideoutFacilities={build:BUILD,CONFIG,level,bonus,upgradeFacility,facilityEffectText};
})();