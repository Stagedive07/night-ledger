(() => {
  const BUILD='LR4.1';
  const COIN_SRC='assets/audio/coin.ogg?v=LR4.1';
  let saveTimer=null,detailRefreshTimer=null;
  let suppressed=null,suppressRestoreTimer=null;
  let audioCtx=null,coinBuffer=null;
  let lastPointerUpgradeAt=0;

  const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));

  function desiredSfxVolume(){
    if(suppressed)return suppressed.volume;
    return clamp01(state?.settings?.soundVolume ?? (state?.settings?.sound ? .7 : 0));
  }

  /* Decode the upgrade sound ahead of time. The old path cloned a media element
     on click, which could make the sound arrive noticeably after the tap on mobile. */
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(AC){
      audioCtx=new AC();
      fetch(COIN_SRC,{cache:'force-cache'})
        .then(r=>r.ok?r.arrayBuffer():Promise.reject(new Error('coin fetch')))
        .then(b=>audioCtx.decodeAudioData(b))
        .then(b=>{coinBuffer=b;})
        .catch(()=>{});
    }
  }catch(e){}

  const coinFallback=Array.from({length:4},()=>{
    try{const a=new Audio(COIN_SRC);a.preload='auto';a.load();return a;}catch(e){return null;}
  });
  let fallbackIndex=0;

  function playFastCoin(){
    const volume=desiredSfxVolume();
    if(volume<=0)return;
    try{
      if(audioCtx&&coinBuffer){
        if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
        const src=audioCtx.createBufferSource(),gain=audioCtx.createGain();
        src.buffer=coinBuffer;gain.gain.value=volume;src.connect(gain).connect(audioCtx.destination);src.start(0);return;
      }
      const a=coinFallback[fallbackIndex++%coinFallback.length];
      if(a){a.pause();a.currentTime=0;a.volume=volume;a.play().catch(()=>{});}
    }catch(e){}
  }

  /* LR3's global click-SFX listener still sees upgrade clicks. Temporarily mute
     only that legacy click between pointer-down and click so we do not get a
     delayed second Coin sound after the preloaded one above. */
  function suppressLegacyCoin(){
    if(!state?.settings)return;
    if(!suppressed){
      const had=Object.prototype.hasOwnProperty.call(state.settings,'soundVolume');
      const raw=state.settings.soundVolume;
      suppressed={had,raw,volume:clamp01(raw ?? (state.settings.sound ? .7 : 0))};
    }
    state.settings.soundVolume=0;
    clearTimeout(suppressRestoreTimer);
    suppressRestoreTimer=setTimeout(restoreLegacyVolume,800);
  }

  function restoreLegacyVolume(){
    clearTimeout(suppressRestoreTimer);suppressRestoreTimer=null;
    if(!suppressed||!state?.settings)return;
    if(suppressed.had)state.settings.soundVolume=suppressed.raw;
    else delete state.settings.soundVolume;
    suppressed=null;
  }

  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer=setTimeout(()=>{saveTimer=null;save();},120);
  }

  function nextCost(inst){
    return inst.level<GD.CARD_LEVEL_CAP?GD.cardLevelCost(inst.tier,inst.level):0;
  }

  function canLevel(inst){
    return !!inst&&inst.level<GD.CARD_LEVEL_CAP&&state.gold>=nextCost(inst);
  }

  function levelOnce(inst){
    if(!canLevel(inst))return false;
    const cost=nextCost(inst);
    state.gold-=cost;
    inst.level++;
    updateTopbar();
    scheduleSave();
    return true;
  }

  function setLevelButton(button,inst,detail=false){
    if(!button||!inst)return;
    const max=inst.level>=GD.CARD_LEVEL_CAP,cost=max?0:nextCost(inst);
    button.disabled=max||state.gold<cost;
    if(detail)button.textContent=max?'MAX LEVEL':`LEVEL UP · ${GD.formatNum(cost)} GOLD`;
    else button.innerHTML=max?'MAX LEVEL':`LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`;
  }

  function refreshDeckButtons(){
    screen.querySelectorAll('[data-deck-level]').forEach(button=>{
      const inst=getInstance(button.dataset.deckLevel);
      if(inst)setLevelButton(button,inst,false);
    });
  }

  function pulse(button){
    button.classList.remove('lr4-level-hit');
    requestAnimationFrame(()=>button.classList.add('lr4-level-hit'));
    setTimeout(()=>button.classList.remove('lr4-level-hit'),130);
  }

  function refreshDeckCard(button,inst){
    const slot=button.closest('.deck-slot-v6,.deck-card-cell');
    if(slot){
      const level=slot.querySelector('.game-card-level');
      if(level)level.textContent=`LV ${inst.level}`;
      const stat=slot.querySelector('.game-card-dps');
      if(stat)stat.textContent=`DPS ${GD.formatNum(GD.cardDps(inst))}`;
    }
    refreshDeckButtons();
    pulse(button);
  }

  function supportLabel(inst){
    return window.LR2SyndicateR6?.valueLabel?.(inst)||GD.formatNum(GD.cardDps(inst));
  }

  function refreshDetail(button,inst){
    const detail=modalRoot.querySelector('.lr216-card-detail,.card-detail');
    if(!detail)return;
    const def=getDef(inst),support=isSyndicateDef(def);
    detail.querySelectorAll('.game-card-level').forEach(el=>el.textContent=`LV ${inst.level}`);
    detail.querySelectorAll('.game-card-dps').forEach(el=>{
      el.textContent=support?`EFFECT ${supportLabel(inst)}`:`DPS ${GD.formatNum(GD.cardDps(inst))}`;
    });
    detail.querySelectorAll('.detail-stat').forEach(stat=>{
      const label=stat.querySelector('small')?.textContent?.trim(),value=stat.querySelector('b');
      if(!value)return;
      if(label==='LEVEL')value.textContent=String(inst.level);
      if(label==='CURRENT DPS')value.textContent=GD.formatNum(GD.cardDps(inst));
      if(label==='SUPPORT EFFECT')value.textContent=supportLabel(inst);
    });
    if(support){
      const ability=detail.querySelector('.lr-detail-ability p');
      const text=window.LR2SyndicateR6?.supportText?.(inst);
      if(ability&&text)ability.textContent=text;
    }
    setLevelButton(button,inst,true);
    pulse(button);

    /* Best-copy bulk-sale choices can change after leveling. Rebuild the detail
       once the player stops tapping, rather than rebuilding the whole modal on
       every single level-up click. */
    clearTimeout(detailRefreshTimer);
    detailRefreshTimer=setTimeout(()=>{
      detailRefreshTimer=null;
      if(!modalOpen||!getInstance(inst.uid))return;
      const oldModal=modalRoot.querySelector('.modal'),scroll=oldModal?.scrollTop||0;
      showDefinitionDetail(inst.defId,inst.uid);
      requestAnimationFrame(()=>{const m=modalRoot.querySelector('.modal');if(m)m.scrollTop=scroll;});
    },220);
  }

  function upgradeButtonFromEvent(e){
    const b=e.target?.closest?.('[data-deck-level],#detail-level');
    return b&&!b.disabled?b:null;
  }

  document.addEventListener('pointerdown',e=>{
    const button=upgradeButtonFromEvent(e);if(!button)return;
    lastPointerUpgradeAt=performance.now();
    playFastCoin();
    suppressLegacyCoin();
  },true);

  document.addEventListener('click',e=>{
    const button=upgradeButtonFromEvent(e);if(!button)return;
    e.preventDefault();
    e.stopImmediatePropagation();

    /* Keyboard activation has no pointer-down, so play Coin here as a fallback. */
    if(performance.now()-lastPointerUpgradeAt>500)playFastCoin();

    const uid=button.dataset.deckLevel||window.LR216?.detailUid;
    const inst=uid?getInstance(uid):null;
    if(inst&&levelOnce(inst)){
      if(button.id==='detail-level')refreshDetail(button,inst);
      else refreshDeckCard(button,inst);
    }
    restoreLegacyVolume();
  },true);

  window.addEventListener('pagehide',()=>{if(saveTimer){clearTimeout(saveTimer);saveTimer=null;save();}},true);

  const style=document.createElement('style');
  style.textContent=`
    .deck-level-btn,#detail-level{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    .lr4-level-hit{transform:translateY(1px) scale(.985);filter:brightness(1.16);transition:none!important}
  `;
  document.head.appendChild(style);

  window.LR4ResponsiveLevel={build:BUILD};
})();
