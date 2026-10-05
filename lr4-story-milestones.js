(() => {
  const BUILD='LR4.11';

  /* Every tenth Operation is a reserved story boss. These names never appear in
     the generic target rotation, so the milestone encounters remain distinct. */
  const MILESTONE_TARGETS={
    10:'The Black Clerk',
    20:'Minister Sorn',
    30:'The Ledger Warden',
    40:'The Grey Witness',
    50:'The Cipher Saint',
    60:'The Bound Hand',
    70:'The Crownless Envoy',
    80:'The Memory Keeper',
    90:'The Last Warden',
    100:'The Nameless Keeper'
  };

  const baseEnemyName=GD.enemyName.bind(GD);
  GD.enemyName=function(operation,encounter,target=false){
    const op=Math.max(1,Math.min(100,Math.floor(Number(operation)||1)));
    if(target&&MILESTONE_TARGETS[op])return MILESTONE_TARGETS[op];
    return baseEnemyName(operation,encounter,target);
  };

  /* Reuse the existing authored story beats, but put the major progression on a
     predictable ten-Operation cadence. Early Operations 1/2/3/5 remain as the
     opening/tutorial story sequence. */
  const moves={30:25,60:65,70:75,80:85,90:95,100:99};
  Object.entries(moves).forEach(([toRaw,fromRaw])=>{
    const to=Number(toRaw),from=Number(fromRaw),entry=SD.operations?.[from];
    if(!entry)return;
    SD.operations[to]={...entry,id:`op${to}`};

    /* Existing saves that already saw the old placement should not receive the
       same chapter a second time under its new milestone id. */
    if(Array.isArray(state?.storySeen)&&state.storySeen.includes(entry.id)&&!state.storySeen.includes(`op${to}`)){
      state.storySeen.push(`op${to}`);
    }
  });

  [25,65,75,85,95,99].forEach(op=>{if(SD.operations)delete SD.operations[op];});
  try{save();}catch(e){}

  window.LR4StoryMilestones={build:BUILD,milestoneTargets:{...MILESTONE_TARGETS}};
})();
