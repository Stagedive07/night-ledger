(() => {
  const BUILD='LR4.16';
  const LR=window.LR216=window.LR216||{libraryFilter:0,librarySort:'rarityDps',librarySearch:'',copyCursor:{},swapTargetUid:null,syndicatePick:false,detailUid:null,packPage:0};

  function libraryCorpus(def){
    const copies=state.inventory.filter(c=>c.defId===def.id);
    const tier=GD.tierData(def.tier);
    return [
      def.name,
      tier?.name||'',
      def.ability?.name||'',
      def.ability?.text||'',
      copies.some(c=>c.holo)?'holographic holo':''
    ].join(' ').toLowerCase();
  }

  function filterLibraryInPlace(){
    if(currentScreen!=='library')return;
    const q=String(LR.librarySearch||'').trim().toLowerCase();
    let visible=0;
    screen.querySelectorAll('[data-lr216-shell]').forEach(shell=>{
      const def=GD.CARD_MAP[shell.dataset.lr216Shell];
      const show=!!def&&(!q||libraryCorpus(def).includes(q));
      shell.hidden=!show;
      if(show)visible++;
    });
    const count=screen.querySelector('.library-head-v6 .panel-title small');
    if(count)count.textContent=`${visible} FOUND`;
  }

  /* LR2 rebuilt the entire Library on every input event. On mobile that destroys
     the focused input node, so the keyboard closes after every character.
     Render the full current Library once, then filter the existing card shells. */
  const baseRenderLibrary=window.renderLibrary;
  window.renderLibrary=renderLibrary=function(){
    const search=String(LR.librarySearch||'');
    LR.librarySearch='';
    const out=baseRenderLibrary.apply(this,arguments);
    LR.librarySearch=search;

    const input=document.getElementById('lr216-search');
    if(input){
      input.value=search;
      input.oninput=e=>{
        LR.librarySearch=e.target.value;
        filterLibraryInPlace();
      };
    }
    filterLibraryInPlace();
    return out;
  };

  function isReplay(){
    const op=Number(state.currentOperation)||1;
    return !!state.battle?.replayActive&&op<=Number(state.highestCleared||0);
  }

  /* opEntryFlags is intentionally permanent for first-clear progression, but a
     replay is a fresh run of that Operation. Give Inside Man one entry trigger
     per replay attempt instead of letting the old first-clear flag suppress it. */
  const baseEnterCurrentOperation=window.enterCurrentOperation;
  window.enterCurrentOperation=enterCurrentOperation=function(){
    if(!isReplay())return baseEnterCurrentOperation.apply(this,arguments);

    const op=Number(state.currentOperation)||1;
    const b=state.battle||(state.battle={});
    const alreadyApplied=!!b.replayInsideManApplied&&Number(b.replayInsideManOperation)===op;
    if(alreadyApplied)return;

    /* Do not move an already-in-progress replay backward when this patch first
       loads. Inside Man applies when a replay is actually beginning at 1. */
    if((Number(b.encounter)||1)>1){
      b.replayInsideManApplied=true;
      b.replayInsideManOperation=op;
      return;
    }

    const skip=Math.max(0,Math.floor(Number(effectTotals().insideMan)||0));
    b.encounter=Math.min(24,1+skip);
    b.replayInsideManApplied=true;
    b.replayInsideManOperation=op;
  };

  /* LR3 resets a completed replay to Encounter 1 so the same Operation can be
     replayed again. Arm Inside Man for that next run before LR3 saves the reset. */
  const baseHandleEnemyKilled=window.handleEnemyKilled;
  window.handleEnemyKilled=handleEnemyKilled=function(){
    const enemy=state.battle?.enemy;
    const replayTarget=!!enemy?.target&&isReplay();
    if(replayTarget)state.battle.replayInsideManApplied=false;
    return baseHandleEnemyKilled.apply(this,arguments);
  };

  window.LR4LibraryReplayFix={
    build:BUILD,
    filterLibraryInPlace,
    replayInsideMan:()=>({
      active:isReplay(),
      stacks:Math.max(0,Math.floor(Number(effectTotals().insideMan)||0)),
      encounter:Number(state.battle?.encounter)||1
    })
  };
})();
