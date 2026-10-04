(() => {
  const BUILD='LR3.31';
  const REPLAY_WHISPER_RATE=.25;
  state.battle ||= {};
  state.battle.firstClearWhispersByOperation ||= {};

  const frontierOperation=()=>state.highestCleared>=100?100:Math.max(1,(Number(state.highestCleared)||0)+1);
  const hasUnclearedFrontier=()=>Number(state.highestCleared||0)<100;
  const isReplay=()=>!!state.battle.replayActive && Number(state.currentOperation)<=Number(state.highestCleared||0);

  /* First-clear Whispers historically depended on the player's Hideout/pack tier at
     the moment the Operation was cleared. Record that exact value from now on so a
     replay can always pay 25% of THAT Operation's own initial target drop.

     Old saves predate this ledger. For them, estimate the maximum Hideout level that
     could have been unlocked at that Operation, then use that tier's base pack cost.
     This prevents OP 1 from inheriting the reward value of the player's newest clear. */
  function estimatedOriginalWhispers(op){
    op=Math.max(1,Number(op)||1);
    let eligibleHideout=1;
    for(let level=2;level<=20;level++){
      if(Number(GD.hideoutOperationReq(level))<=op)eligibleHideout=level;
      else break;
    }
    const tier=GD.tierForHideout(eligibleHideout);
    const basePackCost=typeof GD.packBaseCost==='function'?GD.packBaseCost(tier):packCost(tier);
    return Math.max(0,Number(basePackCost)||0)*.05;
  }
  function originalWhispersFor(op){
    const saved=Number(state.battle.firstClearWhispersByOperation?.[op]);
    return saved>0?saved:estimatedOriginalWhispers(op);
  }
  function replayWhispersFor(op){
    return Math.max(1,Math.round(originalWhispersFor(op)*REPLAY_WHISPER_RATE));
  }

  function snapshotFrontier(){
    if(state.battle.frontierSnapshot||!hasUnclearedFrontier())return;
    const frontier=frontierOperation();
    if(Number(state.currentOperation)!==frontier)return;
    state.battle.frontierSnapshot={
      operation:frontier,
      encounter:Math.max(1,Number(state.battle.encounter)||1),
      mode:state.battle.mode||'push',
      farmEncounter:Number(state.battle.farmEncounter)||null,
      targetFailed:!!state.battle.targetFailed,
      paused:!!state.battle.paused
    };
  }

  function selectOperation(op){
    op=Math.max(1,Math.min(frontierOperation(),Number(op)||1));
    if(op===Number(state.currentOperation))return;
    const frontier=frontierOperation();
    if(hasUnclearedFrontier()&&op<frontier)snapshotFrontier();

    if(hasUnclearedFrontier()&&op===frontier){
      const s=state.battle.frontierSnapshot;
      state.currentOperation=frontier;
      state.battle.replayActive=false;
      state.battle.enemy=null;
      if(s&&s.operation===frontier){
        state.battle.encounter=Math.max(1,Math.min(25,Number(s.encounter)||1));
        state.battle.mode=s.mode||'push';
        state.battle.farmEncounter=s.farmEncounter;
        state.battle.targetFailed=!!s.targetFailed;
        state.battle.paused=!!s.paused;
      }else{
        state.battle.encounter=Math.max(1,Math.min(25,Number(state.battle.operationReached?.[frontier])||1));
        state.battle.mode='push';state.battle.targetFailed=false;state.battle.paused=false;
      }
      state.battle.frontierSnapshot=null;
    }else{
      state.currentOperation=op;
      state.battle.replayActive=true;
      state.battle.enemy=null;
      state.battle.encounter=1;
      state.battle.mode='push';
      state.battle.farmEncounter=1;
      state.battle.targetFailed=false;
      state.battle.paused=false;
      state.battle.abilityProcs={};
    }
    save();render();
  }

  /* In a replay, Bide Your Time farms the encounter reached in THIS replay.
     It never uses the old first-clear operationReached=25 value to jump ahead. */
  const baseSetBattleMode=window.setBattleMode;
  window.setBattleMode=function(mode){
    if(!isReplay())return baseSetBattleMode(mode);
    if(mode==='farm'){
      state.battle.mode='farm';
      state.battle.farmEncounter=Math.min(24,Math.max(1,Number(state.battle.encounter)||1));
      state.battle.enemy=null;
    }else{
      if(state.battle.targetFailed&&Number(state.battle.encounter)===25){retryTarget();return;}
      state.battle.mode='push';
      state.battle.encounter=Math.max(1,Math.min(25,Number(state.battle.encounter)||1));
      state.battle.enemy=null;
    }
    save();render();
  };

  function showReplayReward(items,title){
    let host=document.getElementById('lr-global-reward-feed');
    if(!host){host=document.createElement('div');host.id='lr-global-reward-feed';host.className='lr-reward-feed lr-global-reward-feed';host.setAttribute('aria-live','polite');document.body.appendChild(host);}
    const el=document.createElement('div');el.className='lr-reward-pop';
    el.innerHTML=`<b>${escapeHtml(title)}</b>${items.map(x=>`<span class="${x.kind}">+${GD.formatNum(x.value)} ${x.label}</span>`).join('')}`;
    host.appendChild(el);setTimeout(()=>el.classList.add('show'),10);setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),250)},2200);
  }

  const baseHandleEnemyKilled=window.handleEnemyKilled;
  window.handleEnemyKilled=function(){
    const enemy=state.battle.enemy;

    /* Capture the exact first-clear target Whisper drop before the base handler
       advances highestCleared/currentOperation. Never overwrite an existing record. */
    if(!isReplay()){
      if(enemy?.target){
        const op=Number(state.currentOperation)||1;
        const firstClear=op>Number(state.highestCleared||0);
        if(firstClear&&!Number(state.battle.firstClearWhispersByOperation[op])){
          state.battle.firstClearWhispersByOperation[op]=packCost(GD.tierForHideout(state.hideoutLevel))*.05;
        }
      }
      return baseHandleEnemyKilled();
    }
    if(!enemy?.target)return baseHandleEnemyKilled();

    const op=Number(state.currentOperation)||1,e=effectTotals(),mult=GD.targetRewardMultiplier();
    let gold=GD.normalGold(op)*mult*(1+e.bookkeeper);
    let intel=GD.normalIntel(op)*mult*(1+e.informant)*(1+e.contractInsight);
    const whispers=replayWhispersFor(op);

    addGold(gold);addIntel(intel);addWhispers(whispers);
    state.stats.totalKills++;state.stats.targetsKilled++;
    unlockGold();
    state.battle.momentumStacks=Math.min(10,(Number(state.battle.momentumStacks)||0)+1);
    state.battle.lastKillAt=now();
    showReplayReward([
      {kind:'gold',value:gold,label:'GOLD'},
      {kind:'intel',value:intel,label:'INTEL'},
      {kind:'whispers',value:whispers,label:'WHISPERS'}
    ],`OPERATION ${op} REPLAY COMPLETE`);

    /* Stay on the selected cleared Operation so it can be deliberately replayed again. */
    state.battle.enemy=null;
    state.battle.encounter=1;
    state.battle.mode='push';
    state.battle.farmEncounter=1;
    state.battle.targetFailed=false;
    state.battle.abilityProcs={};
    save();
  };

  function injectOperationNav(){
    if(!state.firstPackOpened||document.querySelector('.lr318-operation-nav'))return;
    const head=screen.querySelector('.battle-head');if(!head)return;
    const op=Number(state.currentOperation)||1,frontier=frontierOperation();
    const nav=document.createElement('div');nav.className='lr318-operation-nav';
    const replay=op<=Number(state.highestCleared||0);
    const replayReward=replay?replayWhispersFor(op):0;
    nav.innerHTML=`
      <button class="mini-btn" data-lr-op="${op-1}" ${op<=1?'disabled':''}>← PREV OP</button>
      <div class="lr318-operation-status"><b>${replay?'REPLAY':'CURRENT PROGRESS'}</b><small>${replay?`${Math.round(REPLAY_WHISPER_RATE*100)}% OF OP ${op} ORIGINAL · ${GD.formatNum(replayReward)} WHISPERS`:`OP ${op} OF ${frontier}`}</small></div>
      <button class="mini-btn" data-lr-op="${op+1}" ${op>=frontier?'disabled':''}>NEXT OP →</button>`;
    head.insertAdjacentElement('afterend',nav);
    nav.querySelectorAll('[data-lr-op]').forEach(b=>b.onclick=()=>selectOperation(b.dataset.lrOp));
  }

  const baseRenderBattle=window.renderBattle;
  window.renderBattle=function(){const out=baseRenderBattle.apply(this,arguments);injectOperationNav();return out;};

  window.LR3OperationReplay={build:BUILD,replayWhisperRate:REPLAY_WHISPER_RATE,selectOperation,originalWhispersFor,replayWhispersFor};
})();
