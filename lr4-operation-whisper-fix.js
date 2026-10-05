(() => {
  const BUILD='LR4.2';

  /*
    First-clear Whispers are progression rewards, so they must be determined only
    by the Operation being cleared. They must not change with the player's current
    Hideout level or with Broker's pack-price discount.
  */
  function eligibleHideoutForOperation(operation){
    const op=Math.max(1,Math.min(100,Math.floor(Number(operation)||1)));
    let level=1;
    for(let next=2;next<=20;next++){
      if(Number(GD.hideoutOperationReq(next))<=op)level=next;
      else break;
    }
    return level;
  }

  function firstClearWhispersFor(operation){
    const hideoutLevel=eligibleHideoutForOperation(operation);
    const tier=GD.tierForHideout(hideoutLevel);
    const basePackCost=Number(GD.packBaseCost(tier))||0;
    return Math.max(0,basePackCost*.05);
  }

  function normalizeRecordedFirstClears(){
    state.battle ||= {};
    state.battle.firstClearWhispersByOperation ||= {};
    const highest=Math.max(0,Math.min(100,Math.floor(Number(state.highestCleared)||0)));
    let changed=false;
    for(let op=1;op<=highest;op++){
      const correct=firstClearWhispersFor(op);
      if(Number(state.battle.firstClearWhispersByOperation[op])!==correct){
        state.battle.firstClearWhispersByOperation[op]=correct;
        changed=true;
      }
    }
    return changed;
  }

  /* Repair any old ledger entries that captured a Hideout/Broker-dependent value.
     LR3 replay rewards already read this ledger, so correcting it also makes replay
     rewards use the same canonical Operation-based first-clear value. */
  if(normalizeRecordedFirstClears())save();

  const baseHandleEnemyKilled=window.handleEnemyKilled;
  window.handleEnemyKilled=function(){
    const enemy=state.battle?.enemy;
    const op=Math.max(1,Math.min(100,Math.floor(Number(state.currentOperation)||1)));
    const replay=!!state.battle?.replayActive && op<=Number(state.highestCleared||0);
    const firstClear=!!enemy?.target && !replay && op>Number(state.highestCleared||0);

    if(!firstClear)return baseHandleEnemyKilled.apply(this,arguments);

    const correctReward=firstClearWhispersFor(op);
    state.battle ||= {};
    state.battle.firstClearWhispersByOperation ||= {};

    /* Pre-fill the ledger so the older LR3 wrapper cannot capture a dynamic
       packCost() value that includes Broker or the current Hideout tier. */
    state.battle.firstClearWhispersByOperation[op]=correctReward;

    const whispersBefore=Number(state.whispers)||0;
    const earnedBefore=Number(state.stats?.whispersEarned)||0;
    const result=baseHandleEnemyKilled.apply(this,arguments);

    /* The original combat handler still awards its legacy dynamic 5% packCost.
       Replace only that Whisper delta with the canonical Operation reward while
       preserving every other kill/clear side effect. */
    const legacyDelta=(Number(state.whispers)||0)-whispersBefore;
    state.whispers=(Number(state.whispers)||0)+(correctReward-legacyDelta);
    if(state.stats)state.stats.whispersEarned=earnedBefore+correctReward;

    save();
    if(typeof updateTopbar==='function')updateTopbar();
    return result;
  };

  window.LR4OperationWhispers={
    build:BUILD,
    eligibleHideoutForOperation,
    firstClearWhispersFor,
    normalizeRecordedFirstClears
  };
})();
