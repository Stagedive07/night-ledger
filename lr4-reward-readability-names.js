(() => {
  const BUILD='LR4.10';

  function ensureRewardFeed(){
    let host=document.getElementById('lr-global-reward-feed');
    if(!host){
      host=document.createElement('div');
      host.id='lr-global-reward-feed';
      host.className='lr-reward-feed lr-global-reward-feed';
      host.setAttribute('aria-live','polite');
      document.body.appendChild(host);
    }
    return host;
  }

  function showUnifiedReplayReward(op,gold,intel,whispers){
    const host=ensureRewardFeed();
    const el=document.createElement('div');
    el.className='lr-reward-pop';
    el.innerHTML=`<b>OPERATION ${op} REPLAY COMPLETE</b><span class="gold">+${GD.formatNum(gold)} GOLD</span><span class="intel">+${GD.formatNum(intel)} INTEL</span><span class="whispers">+${GD.formatNum(whispers)} WHISPERS TOTAL</span>`;
    host.appendChild(el);
    setTimeout(()=>el.classList.add('show'),10);
    setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250);},2200);
  }

  /* LR3 creates the replay-complete toast and LR4 Contract Desk adds a second
     toast afterward. Snapshot the reward feed around target death, remove only
     the notices created by that one kill, then replace them with a single total. */
  const baseHandleEnemyKilled=window.handleEnemyKilled;
  window.handleEnemyKilled=handleEnemyKilled=function(){
    const enemy=state.battle?.enemy;
    const replayTarget=!!enemy?.target&&!!state.battle?.replayActive&&Number(state.currentOperation)<=Number(state.highestCleared||0);
    if(!replayTarget)return baseHandleEnemyKilled.apply(this,arguments);

    const op=Number(state.currentOperation)||1;
    const before={gold:Number(state.gold)||0,intel:Number(state.intel)||0,whispers:Number(state.whispers)||0};
    const existing=new Set(document.querySelectorAll('#lr-global-reward-feed .lr-reward-pop'));
    const result=baseHandleEnemyKilled.apply(this,arguments);
    const totals={
      gold:Math.max(0,(Number(state.gold)||0)-before.gold),
      intel:Math.max(0,(Number(state.intel)||0)-before.intel),
      whispers:Math.max(0,(Number(state.whispers)||0)-before.whispers)
    };

    document.querySelectorAll('#lr-global-reward-feed .lr-reward-pop').forEach(el=>{
      if(!existing.has(el))el.remove();
    });
    showUnifiedReplayReward(op,totals.gold,totals.intel,totals.whispers);
    return result;
  };

  const style=document.createElement('style');
  style.textContent=`
    /* Hideout Rooms were 10px/9px, with an 8px narrow-phone override. */
    .lr44-facilities-panel .panel-title h3{font-size:18px!important;line-height:1.15!important}
    .lr44-facilities-panel .panel-title small{font-size:13px!important;line-height:1.2!important}
    .lr44-facility-head b{font-size:14px!important;line-height:1.2!important}
    .lr44-facility-head span{font-size:13px!important;line-height:1.2!important}
    .lr44-facility-effect{font-size:13px!important;line-height:1.3!important;min-height:34px!important}
    .lr44-facility-up{font-size:13px!important;line-height:1.2!important;min-height:36px!important}

    /* Card names may wrap to additional lines, but are never ellipsized/clamped. */
    .game-card-name,
    .deck-slot-v6 .game-card-name,
    .library-card-shell-v6 .game-card-name,
    .syndicate-slot-v6 .game-card-name{
      white-space:normal!important;
      overflow:visible!important;
      text-overflow:clip!important;
      max-width:none!important;
      max-height:none!important;
      -webkit-line-clamp:unset!important;
      line-clamp:unset!important;
      overflow-wrap:anywhere!important;
    }
    .game-card-head{height:auto!important;min-height:0!important;overflow:visible!important}
  `;
  document.head.appendChild(style);

  window.LR4RewardReadabilityNames={build:BUILD};
})();
