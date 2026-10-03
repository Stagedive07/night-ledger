(() => {
  const BUILD='LR3.18';
  const REPLAY_WHISPER_RATE=.25;
  state.battle ||= {};

  const frontierOperation=()=>state.highestCleared>=100?100:Math.max(1,(Number(state.highestCleared)||0)+1);
  const hasUnclearedFrontier=()=>Number(state.highestCleared||0)<100;
  const isReplay=()=>!!state.battle.replayActive && Number(state.currentOperation)<=Number(state.highestCleared||0);

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
    if(!isReplay()||!enemy?.target)return baseHandleEnemyKilled();

    const op=Number(state.currentOperation)||1,e=effectTotals(),mult=GD.targetRewardMultiplier();
    let gold=GD.normalGold(op)*mult*(1+e.bookkeeper);
    let intel=GD.normalIntel(op)*mult*(1+e.informant)*(1+e.contractInsight);
    const firstClearWhispers=packCost(GD.tierForHideout(state.hideoutLevel))*.05;
    const whispers=Math.max(1,Math.round(firstClearWhispers*REPLAY_WHISPER_RATE));

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
    nav.innerHTML=`
      <button class="mini-btn" data-lr-op="${op-1}" ${op<=1?'disabled':''}>← PREV OP</button>
      <div class="lr318-operation-status"><b>${replay?'REPLAY':'CURRENT PROGRESS'}</b><small>${replay?`${Math.round(REPLAY_WHISPER_RATE*100)}% WHISPER REWARD`:`OP ${op} OF ${frontier}`}</small></div>
      <button class="mini-btn" data-lr-op="${op+1}" ${op>=frontier?'disabled':''}>NEXT OP →</button>`;
    head.insertAdjacentElement('afterend',nav);
    nav.querySelectorAll('[data-lr-op]').forEach(b=>b.onclick=()=>selectOperation(b.dataset.lrOp));
  }

  const baseRenderBattle=window.renderBattle;
  window.renderBattle=function(){const out=baseRenderBattle.apply(this,arguments);injectOperationNav();return out;};

  window.LR3OperationReplay={build:BUILD,replayWhisperRate:REPLAY_WHISPER_RATE,selectOperation};
})();
