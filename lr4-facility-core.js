(() => {
  const BUILD='LR4.4';
  const MAX_LEVEL=20;
  const CONFIG={
    armory:{name:'Armory',step:.02,coefficient:520,effect:'GLOBAL DPS'},
    syndicateOffice:{name:'Syndicate Office',step:.02,coefficient:500,effect:'SUPPORT STRENGTH'},
    whisperNetwork:{name:'Whisper Network',step:.04,coefficient:600,effect:'WHISPERS / HR'},
    contractDesk:{name:'Contract Desk',step:.04,coefficient:540,effect:'OPERATION WHISPERS'},
    quartermaster:{name:'Quartermaster',step:.03,coefficient:460,effect:'GOLD'},
    intelligenceRoom:{name:'Intelligence Room',step:.025,coefficient:640,effect:'INTEL'}
  };

  function ensureState(){
    if(typeof state==='undefined'||!state)return false;
    let changed=false;
    if(!state.hideoutFacilities||typeof state.hideoutFacilities!=='object'){
      state.hideoutFacilities={};changed=true;
    }
    for(const key of Object.keys(CONFIG)){
      const raw=Number(state.hideoutFacilities[key]);
      const value=Number.isFinite(raw)?Math.max(0,Math.min(MAX_LEVEL,Math.floor(raw))):0;
      if(state.hideoutFacilities[key]!==value){state.hideoutFacilities[key]=value;changed=true;}
    }
    return changed;
  }

  function level(key){
    if(typeof state==='undefined'||!state)return 0;
    ensureState();
    return Math.max(0,Math.min(MAX_LEVEL,Number(state.hideoutFacilities[key])||0));
  }
  function bonus(key){const def=CONFIG[key];return def?level(key)*def.step:0;}
  function upgradeCost(key,nextLevel){
    const def=CONFIG[key],n=Math.max(1,Math.min(MAX_LEVEL,Math.floor(Number(nextLevel)||1)));
    return def?Math.round(def.coefficient*Math.pow(n,3)):0;
  }

  /* Keep pristine economy functions for startup offline rewards. app4 calls load()
     before the later LR4/LR3 override stack finishes loading. */
  const baseWhisperRate=GD.whisperRatePerHour.bind(GD);
  const baseNormalGold=GD.normalGold.bind(GD);
  const baseNormalIntel=GD.normalIntel.bind(GD);

  window.applyOfflineProgress=applyOfflineProgress=function(){
    ensureState();
    const last=Number(state.lastSavedAt||now()),elapsed=Math.max(0,(now()-last)/1000);
    if(elapsed<30)return;
    const cap=offlineCapHours()*3600,seconds=Math.min(elapsed,cap);
    const w=baseWhisperRate(state.hideoutLevel)*(1+bonus('whisperNetwork'))*seconds/3600;
    addWhispers(w);

    let kills=0,g=0,i=0;
    if(state.firstPackOpened&&deckInstances().length){
      const farmOp=Math.max(1,state.highestCleared||state.currentOperation),hp=GD.normalEnemyHp(farmOp);
      let dps=Math.max(1,estimateDeckDps(false,.5));
      const runtimeReady=!!window.LR4FacilityCore?.runtimeReady;
      if(!runtimeReady)dps*=1+bonus('armory');
      const ttk=Math.max(.5,hp/dps);
      kills=Math.min(Math.floor(seconds/ttk),250000);
      const e=effectTotals();
      let bookkeeper=Number(e.bookkeeper)||0,informant=Number(e.informant)||0;
      if(!runtimeReady){
        const office=1+bonus('syndicateOffice');
        bookkeeper=Math.min(.75,bookkeeper*office);
        informant=Math.min(.50,informant*office);
      }
      g=kills*baseNormalGold(farmOp)*(1+bookkeeper)*(1+bonus('quartermaster'));
      i=kills*baseNormalIntel(farmOp)*(1+informant)*(1+bonus('intelligenceRoom'));
      addGold(g);addIntel(i);state.stats.totalKills+=kills;
    }
    setTimeout(()=>showOfflineSummary(seconds,w,kills,g,i),350);
  };

  window.LR4FacilityCore={
    build:BUILD,MAX_LEVEL,CONFIG,ensureState,level,bonus,upgradeCost,
    baseWhisperRate,baseNormalGold,baseNormalIntel,runtimeReady:false
  };
})();