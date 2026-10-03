(() => {
  const CARD_ART_LR2 = {
    't1-c01':'assets/card-art/ratknife.png',
    't1-c02':'assets/card-art/mira-voss.png',
    't1-c03':'assets/card-art/the-candleman.png',
    't1-c04':'assets/card-art/alley-surgeon.png'
  };

  let lr2LibraryFilter = 0;
  let lr2LibrarySort = 'rarityDps';
  let lr2LibrarySearch = '';
  let lr2SwapTargetUid = null;
  let lr2SyndicatePick = false;
  const lr2CopyCursor = {};

  function lr2Migrate(){
    state.settings ||= {};
    if(typeof state.settings.soundVolume !== 'number') state.settings.soundVolume = state.settings.sound ? .7 : 0;
    if(typeof state.settings.musicVolume !== 'number') state.settings.musicVolume = state.settings.music ? .45 : 0;
    state.settings.soundVolume = clamp(state.settings.soundVolume,0,1);
    state.settings.musicVolume = clamp(state.settings.musicVolume,0,1);
    state.settings.sound = state.settings.soundVolume > 0;
    state.settings.music = state.settings.musicVolume > 0;
    state.battle ||= {};
    if(!state.battle.abilityProcs || typeof state.battle.abilityProcs !== 'object') state.battle.abilityProcs = {};
    if(!state.battle.abilityProcOperation) state.battle.abilityProcOperation = state.currentOperation || 1;
    save();
  }

  const LR2_AUDIO = {
    flip:'assets/audio/card-flip-single-up.ogg',
    flipDown:'assets/audio/card-flip-single-down.ogg',
    place:'assets/audio/menu-click.ogg',
    select:'assets/audio/menu-click.ogg',
    menu:'assets/audio/menu-click.ogg',
    coin:'assets/audio/coin.ogg',
    packOpen:'assets/audio/full-pack-opening.ogg'
  };
  const LR2_MUSIC = 'assets/audio/lr-a-min.m4a';
  const lr2SfxCache = new Map();
  let lr2MusicPlayers = null;
  let lr2MusicActive = 0;
  let lr2MusicCrossfading = false;
  let lr2MusicFadeRaf = 0;

  function lr2Audio(url){
    if(!lr2SfxCache.has(url)){
      const a = new Audio(url); a.preload='auto'; lr2SfxCache.set(url,a);
    }
    return lr2SfxCache.get(url);
  }
  function lr2PlaySfx(kind='select'){
    const vol = clamp(Number(state?.settings?.soundVolume)||0,0,1);
    if(vol<=0)return;
    const src = LR2_AUDIO[kind] || LR2_AUDIO.select;
    try{const a=lr2Audio(src).cloneNode();a.volume=vol;a.play().catch(()=>{});}catch(e){}
  }
  window.playUISoundV5 = lr2PlaySfx;

  function lr2InitMusic(){
    if(lr2MusicPlayers)return;
    const make=()=>{const a=new Audio(LR2_MUSIC);a.preload='auto';a.loop=false;a.volume=0;a.addEventListener('timeupdate',lr2CheckMusicCrossfade);a.addEventListener('ended',()=>lr2StartMusicPlayer(1-lr2MusicActive,0));return a;};
    lr2MusicPlayers=[make(),make()];
  }
  function lr2MusicVol(){return clamp(Number(state?.settings?.musicVolume)||0,0,1)}
  function lr2StartMusicPlayer(index,startVol){
    lr2InitMusic();
    const a=lr2MusicPlayers[index];
    try{a.currentTime=0;}catch(e){}
    a.volume=clamp(startVol,0,1);
    a.play().catch(()=>{});
  }
  function lr2EnsureMusic(){
    lr2InitMusic();
    const v=lr2MusicVol();
    if(v<=0){lr2MusicPlayers.forEach(a=>a.pause());cancelAnimationFrame(lr2MusicFadeRaf);lr2MusicCrossfading=false;return;}
    const a=lr2MusicPlayers[lr2MusicActive];
    if(a.paused){a.volume=v;a.play().catch(()=>{});}else if(!lr2MusicCrossfading){a.volume=v;}
  }
  function lr2CheckMusicCrossfade(){
    if(lr2MusicCrossfading||lr2MusicVol()<=0||!lr2MusicPlayers)return;
    const a=lr2MusicPlayers[lr2MusicActive];
    if(!Number.isFinite(a.duration)||a.duration<=10)return;
    if(a.duration-a.currentTime<=10)lr2BeginMusicCrossfade();
  }
  function lr2BeginMusicCrossfade(){
    if(lr2MusicCrossfading||!lr2MusicPlayers)return;
    lr2MusicCrossfading=true;
    const fromIndex=lr2MusicActive,toIndex=1-fromIndex,from=lr2MusicPlayers[fromIndex],to=lr2MusicPlayers[toIndex];
    try{to.currentTime=0;}catch(e){}
    to.volume=0;to.play().catch(()=>{});
    const started=performance.now(),duration=10000;
    const step=t=>{
      const p=clamp((t-started)/duration,0,1),v=lr2MusicVol();
      from.volume=v*(1-p);to.volume=v*p;
      if(p<1&&v>0){lr2MusicFadeRaf=requestAnimationFrame(step);return;}
      from.pause();try{from.currentTime=0;}catch(e){}
      to.volume=v;lr2MusicActive=toIndex;lr2MusicCrossfading=false;
    };
    lr2MusicFadeRaf=requestAnimationFrame(step);
  }
  document.addEventListener('pointerdown',()=>lr2EnsureMusic(),{passive:true});

  function lr2IsNarrative(entry){return !!entry && !String(entry.id||'').startsWith('sys_');}
  function lr2StoryEntries(){
    const out=[],seen=new Set();
    const add=s=>{if(s&&lr2IsNarrative(s)&&!seen.has(s.id)){seen.add(s.id);out.push(s);}};
    add(SD.opening);
    if(state.firstPackOpened||state.storySeen.includes(SD.firstPack.id)) add(SD.firstPack);
    state.storySeen.forEach(id=>add(findStoryById(id)));
    if(activeStory?.entry) add(activeStory.entry);
    return out;
  }
  function lr2StoryChapter(entry){const list=lr2StoryEntries(),i=list.findIndex(s=>s.id===entry.id);return i>=0?i+1:list.length+1;}
  drawStoryPage = function(){
    if(!activeStory)return;
    const {entry}=activeStory,last=activeStoryPage===entry.pages.length-1,dots=entry.pages.map((_,i)=>`<i class="${i<=activeStoryPage?'on':''}"></i>`).join('');
    let label=last?'CLOSE':'CONTINUE';if(entry.id==='prestige1'&&last)label='BEGIN PRESTIGE I';
    const kicker=lr2IsNarrative(entry)?`CHAPTER ${String(lr2StoryChapter(entry)).padStart(2,'0')} // ${activeStoryPage+1}/${entry.pages.length}`:`FIELD NOTE // ${activeStoryPage+1}/${entry.pages.length}`;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal story-modal"><div class="story-kicker">${kicker}</div><h2>${escapeHtml(entry.title)}</h2><div class="story-copy">${escapeHtml(entry.pages[activeStoryPage])}</div><div class="story-progress">${dots}</div><div class="story-actions">${activeStoryPage>0?'<button class="btn ghost" id="story-back">BACK</button>':''}<button class="btn primary" id="story-next">${label}</button></div></div></div>`;
    const back=document.getElementById('story-back');if(back)back.onclick=()=>{activeStoryPage--;drawStoryPage();};
    document.getElementById('story-next').onclick=()=>{if(!last){activeStoryPage++;drawStoryPage();return;}if(!activeStory.replay&&!state.storySeen.includes(entry.id))state.storySeen.push(entry.id);const id=entry.id;activeStory=null;modalRoot.innerHTML='';modalOpen=false;clearTutorialCoach();if(id==='finale')enqueueStory(SD.prestige);else if(id==='prestige1'){performPrestige();return;}save();render();maybeShowNextStory();};
  };
  function lr2ShowStorySoFar(){
    const entries=lr2StoryEntries();
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal story-so-far"><div class="kicker">STORY LOG</div><h2>THE STORY SO FAR</h2><div class="story-so-far-copy">${entries.map((s,i)=>`<section><h3>${String(i+1).padStart(2,'0')} // ${escapeHtml(s.title)}</h3>${s.pages.map(p=>`<p>${escapeHtml(p)}</p>`).join('')}</section>`).join('')}</div><button class="btn primary" id="story-so-far-close">CLOSE</button></div></div>`;
    document.getElementById('story-so-far-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }
  function lr2ShowAllStories(){
    const entries=lr2StoryEntries();modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal all-stories-modal"><div class="kicker">STORY LOG</div><h2>CHAPTERS</h2><div class="all-story-list">${entries.map((s,i)=>`<button class="story-entry" data-lr2-story="${s.id}"><span class="story-chapter-num">${String(i+1).padStart(2,'0')}</span><b>${escapeHtml(s.title)}</b></button>`).join('')}</div><button class="btn ghost" id="all-story-close">CLOSE</button></div></div>`;
    document.querySelectorAll('[data-lr2-story]').forEach(b=>b.onclick=()=>{const s=findStoryById(b.dataset.lr2Story);modalRoot.innerHTML='';modalOpen=false;if(s)enqueueStory(s,true);});
    document.getElementById('all-story-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }

  gameCardMarkup = function(inst,opts={}){
    if(!inst)return'';
    const def=getDef(inst),td=GD.tierData(inst.tier),compact=!!opts.compact,showNew=opts.showNew??!!inst.isNew,showLevel=opts.showLevel??true;
    const hideLore=!!opts.hideLore,hideAbilityText=!!opts.hideAbilityText;
    const ability=def?.ability?`<div class="game-card-ability"><b>${escapeHtml(def.ability.name)}</b>${hideAbilityText?'':`<span>${escapeHtml(def.ability.text)}</span>`}</div>`:'';
    const lore=!hideLore&&def?.lore?`<div class="game-card-lore">${escapeHtml(def.lore)}</div>`:'';
    const textLen=(hideAbilityText?0:(def?.ability?.text?.length||0))+(hideLore?0:(def?.lore?.length||0));
    const textClass=textLen>210?'text-xxlong':textLen>165?'text-xlong':textLen>115?'text-long':'';
    const artSrc=CARD_ART_LR2[def?.id];
    const art=artSrc?`<img src="${artSrc}" alt="${escapeHtml(def.name)}" draggable="false">`:'<span class="art-placeholder">[ CARD ART TBD ]</span>';
    const holoTag=inst.holo?'<span class="holo-tag">HOLOGRAPHIC ✦</span>':'';
    const inDeck=state.deck.includes(inst.uid)?'<div class="card-zone-tag">IN DECK</div>':state.syndicate.includes(inst.uid)?'<div class="card-zone-tag">IN SYNDICATE</div>':'';
    return `<div class="game-card ${compact?'compact':''} ${hideLore?'no-lore':''} ${hideAbilityText?'no-ability-text':''} ${inst.holo?'holo':''} ${textClass}" style="border-color:${td.accent};--mx:50%;--my:50%">${showNew?'<span class="new-tag">NEW</span>':''}<div class="game-card-head"><div class="game-card-name">${escapeHtml(def.name)}</div><div class="game-card-deck" style="color:${td.accent}">${td.name.toUpperCase()} DECK</div>${inDeck}</div><div class="game-card-art">${art}${holoTag}</div><div class="game-card-bottom">${ability}${lore}<div class="game-card-footer">${showLevel?`<div class="game-card-level">LV ${inst.level}</div>`:'<span></span>'}<div class="game-card-dps">DPS ${GD.formatNum(GD.cardDps(inst))}</div></div></div></div>`;
  };
  function lr2BindHolo(){
    document.querySelectorAll('.game-card.holo').forEach(card=>{
      if(card.dataset.holoBound)return;card.dataset.holoBound='1';
      const move=e=>{const r=card.getBoundingClientRect(),p=e.touches?.[0]||e,x=clamp(((p.clientX-r.left)/r.width)*100,0,100),y=clamp(((p.clientY-r.top)/r.height)*100,0,100);card.style.setProperty('--mx',`${x}%`);card.style.setProperty('--my',`${y}%`);};
      card.addEventListener('pointermove',move,{passive:true});card.addEventListener('touchmove',move,{passive:true});
      card.addEventListener('pointerleave',()=>{card.style.setProperty('--mx','50%');card.style.setProperty('--my','50%');},{passive:true});
    });
  }

  function lr2EnsureProcState(){
    if(state.battle.abilityProcOperation!==state.currentOperation){state.battle.abilityProcOperation=state.currentOperation;state.battle.abilityProcs={};}
    state.battle.abilityProcs ||= {};
  }
  function lr2BumpProc(name,n=1){lr2EnsureProcState();state.battle.abilityProcs[name]=(state.battle.abilityProcs[name]||0)+n;}
  function lr2AbilityRows(){
    lr2EnsureProcState();const groups={};
    deckInstances().forEach(inst=>{const a=getDef(inst)?.ability;if(!a||a.zone!=='operation')return;(groups[a.name]||=[]).push(a);});
    const chanceNames=new Set(['Double Strike','Eviscerate','Execute','Shortcut']);
    return Object.entries(groups).map(([name,arr])=>{
      let effect='PASSIVE';
      if(name==='Double Strike'||name==='Eviscerate')effect=`${(100*(1-arr.reduce((q,a)=>q*(1-a.value),1))).toFixed(1)}% CHANCE`;
      else if(name==='Execute')effect=`${(100*Math.min(.10,sum(arr.map(a=>a.value)))).toFixed(1)}% CHANCE`;
      else if(name==='Shortcut')effect=`${(100*Math.min(.20,sum(arr.map(a=>a.value)))).toFixed(1)}% CHANCE`;
      else if(name==='Contract Killer')effect=`+${Math.round(arr[0].value*100)}% TARGET DMG`;
      else if(name==='Opening Strike')effect=`+${Math.round(arr[0].value*100)}% ABOVE 80%`;
      else if(name==='Finisher')effect=`+${Math.round(arr[0].value*100)}% BELOW 30%`;
      else if(name==='Momentum')effect=`+${(arr[0].value*100).toFixed(1)}% / KILL`;
      else if(name==='Patient Killer')effect=`+${(arr[0].value*100).toFixed(1)}% / SEC`;
      else if(name==='Sabotage')effect=`-${Math.round(Math.min(.25,sum(arr.map(a=>a.value)))*100)}% TARGET HP`;
      else if(name==='Inside Man')effect=`+${Math.min(3,arr.length)} START`;
      else if(name==='Contract Insight')effect=`+${Math.round(Math.min(.5,sum(arr.map(a=>a.value)))*100)}% INTEL`;
      const procs=chanceNames.has(name)?String(state.battle.abilityProcs[name]||0):'PASSIVE';
      return {name,count:arr.length,effect,procs};
    });
  }
  procCombatSecond=function(){
    const enemy=state.battle.enemy;if(!enemy)return;lr2EnsureProcState();const target=enemy.target,hpRatio=enemy.hp/enemy.maxHp;let bonusDamage=0,executeChance=0;
    deckInstances().forEach(inst=>{const a=getDef(inst)?.ability;if(!a)return;const cdps=GD.cardDps(inst);if(a.name==='Double Strike'&&Math.random()<a.value){bonusDamage+=cdps;lr2BumpProc('Double Strike');}if(a.name==='Eviscerate'&&Math.random()<a.value){bonusDamage+=cdps*5;lr2BumpProc('Eviscerate');floatingHit('EVISCERATE');}if(a.name==='Execute')executeChance+=a.value;});
    executeChance=Math.min(.10,executeChance);const threshold=target?.05:.15;if(hpRatio<=threshold&&Math.random()<executeChance){enemy.hp=0;lr2BumpProc('Execute');floatingHit('EXECUTE');return;}enemy.hp-=bonusDamage;
  };
  handleEnemyKilled=function(){
    const enemy=state.battle.enemy;if(!enemy)return;lr2EnsureProcState();const op=state.currentOperation,e=effectTotals(),mult=enemy.target?GD.targetRewardMultiplier():1;let gold=GD.normalGold(op)*mult*(1+e.bookkeeper),intel=GD.normalIntel(op)*mult*(1+e.informant);if(enemy.target)intel*=1+e.contractInsight;addGold(gold);addIntel(intel);state.stats.totalKills++;unlockGold();state.battle.momentumStacks=Math.min(10,state.battle.momentumStacks+1);state.battle.lastKillAt=now();
    if(enemy.target){state.stats.targetsKilled++;state.highestCleared=Math.max(state.highestCleared,op);if(op===1)unlockIntelAndHideout();if(SD.operations[op])enqueueStory(SD.operations[op]);addWhispers(packCost(GD.tierForHideout(state.hideoutLevel))*.05);if(op>=100){state.currentOperation=100;state.battle.enemy=null;state.battle.encounter=25;state.battle.paused=true;if(state.hideoutLevel>=20)triggerFinale();else{state.awaitingFinale=true;toast('Operation 100 cleared. Complete Hideout 20 to open the final door.');}}else{state.currentOperation=op+1;state.battle.encounter=1;state.battle.enemy=null;state.battle.targetFailed=false;state.battle.mode='push';}}
    else{let next=state.battle.encounter;if(state.battle.mode==='farm')next=24;else{next++;if(next<25&&Math.random()<e.shortcut){next++;lr2BumpProc('Shortcut');toast('Shortcut: skipped an encounter.');}next=Math.min(25,next);}state.battle.encounter=next;state.battle.enemy=null;}save();
  };
  const lr2BaseBeginOperation=beginOperation;
  beginOperation=function(){state.battle.abilityProcOperation=state.currentOperation;state.battle.abilityProcs={};lr2BaseBeginOperation();};

  renderBattle=function(){
    if(!state.firstPackOpened){screen.innerHTML=`<div class="empty-state"><b>NO OPERATIVES READY</b><p>Open your first Street pack.</p><button class="btn primary" data-nav="packs">GO TO PACKS</button></div>`;bindCommonActions();return;}
    if(state.battle.paused){screen.innerHTML=`<div class="pixel-panel operation-ready"><div class="battle-head"><div><div class="kicker">READY</div><div class="operation-title">OPERATION ${state.currentOperation}</div></div><div class="encounter-big">25 ENCOUNTERS</div></div><div class="empty-state"><b>YOUR OPERATIVES ARE READY</b><p>Begin when you are ready to follow the next lead.</p><button class="btn primary" id="begin-operation">BEGIN OPERATION</button></div></div>`;document.getElementById('begin-operation').onclick=()=>{beginOperation();};return;}
    if(!state.battle.enemy)spawnEnemy();lr2EnsureProcState();
    const enemy=state.battle.enemy,op=state.currentOperation,enc=state.battle.encounter,hp=Math.max(0,enemy?.hp||0),max=enemy?.maxHp||1,pct=100*hp/max,dps=estimateDeckDps(!!enemy?.target,enemy?hp/max:1),timer=enemy?.target?Math.max(0,(enemy.deadline-now())/1000):null;
    const dots=Array.from({length:25},(_,i)=>{const n=i+1;let c=n<enc?'done':'';if(n===enc)c+=' current';if(n===25)c+=' target';return `<i class="${c}"></i>`;}).join('');
    const lockedFinal=state.highestCleared>=100&&state.hideoutLevel<20,abilities=lr2AbilityRows();
    const abilityMarkup=abilities.length?abilities.map(a=>`<div class="op-ability-row"><b>${escapeHtml(a.name)}${a.count>1?` ×${a.count}`:''}</b><span>${a.effect}</span><strong>${a.procs==='PASSIVE'?'PASSIVE':`${a.procs} PROCS`}</strong></div>`).join(''):'<div class="op-ability-row"><b>NO CARD ABILITIES</b><span></span><strong>—</strong></div>';
    screen.innerHTML=`<div class="pixel-panel operation-panel"><div class="battle-head"><div><div class="kicker">${state.battle.mode==='farm'?'BIDING YOUR TIME':'ASSASSINATING'}</div><div class="operation-title">OPERATION ${op}</div></div><div class="encounter-big">ENCOUNTER ${enc}/25</div></div><div class="encounter-dots">${dots}</div>${lockedFinal?`<div class="empty-state"><b>THE FINAL DOOR IS SEALED</b><p>Rebuild the Hideout completely.</p></div>`:`<div class="enemy-card ${enemy?.target?'target':''}"><div><div class="enemy-meta"><span>${enemy?.target?'TARGET':'ENEMY'}</span><span>${enemy?.target?'ESCAPING':'ENGAGED'}</span></div><div class="art-box">[ ENEMY ART TBD ]</div></div><div><div class="enemy-name">${escapeHtml(enemy?.name||'...')}</div><div class="meter ${enemy?.target?'':'blue'}"><i style="width:${pct}%"></i></div><div class="meter-label"><span>${GD.formatNum(hp)} HP</span><span>${GD.formatNum(max)} HP</span></div>${enemy?.target?`<div class="meter gold" style="margin-top:7px"><i style="width:${clamp(timer/30*100,0,100)}%"></i></div><div class="meter-label"><span>ESCAPE</span><span>${timer.toFixed(1)}s</span></div>`:''}</div></div>`}</div><div class="stats-grid lr2-operation-stats"><div class="stat"><small>Deck DPS</small><b>${GD.formatNum(dps)}</b></div><div class="stat"><small>Highest Clear</small><b>OP ${state.highestCleared}</b></div><button class="stat info-stat" data-info-v6="momentum"><small>Momentum</small><b>${state.battle.momentumStacks}/10</b></button></div><div class="operation-actions"><button class="btn assassinate ${state.battle.mode==='push'?'selected':''}" data-battle-mode="push" ${lockedFinal?'disabled':''}>${state.battle.targetFailed?'RETRY TARGET':'ASSASSINATE'}</button><button class="btn bide ${state.battle.mode==='farm'?'selected':''}" data-battle-mode="farm" ${lockedFinal?'disabled':''}>BIDE YOUR TIME</button></div><div class="operation-abilities"><div class="op-ability-head"><b>DECK ABILITIES</b><span>CURRENT OPERATION</span></div><div class="op-ability-list">${abilityMarkup}</div></div>`;
    screen.querySelectorAll('[data-battle-mode]').forEach(b=>b.onclick=()=>{setBattleMode(b.dataset.battleMode);});
  };

  const LR2_HIDEOUT_STEPS=[
    null,[],['crate'],['crate','board'],['crate','board','shelf'],['crate','board','shelf','lamp2'],['crate','board','shelf','lamp2','gear'],['crate','board','shelf','lamp2','gear','rug'],['crate','board','shelf','lamp2','gear','rug','cache'],['crate','board','shelf','lamp2','gear','rug','cache','radio'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2','office'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2','office','signals'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2','office','signals','beam'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2','office','signals','beam','archive2'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2','office','signals','beam','archive2','route'],['crate','board','shelf','lamp2','gear','rug','cache','radio','ledger','archive','cabinet','map','table2','office','signals','beam','archive2','route','crest']
  ];
  function lr2HideoutFeatures(level){return (LR2_HIDEOUT_STEPS[clamp(level,1,20)]||[]).map(x=>`<i class="hideout-feature ${x}"></i>`).join('');}
  renderHideout=function(){
    if(!state.unlocks.hideout){screen.innerHTML=`<div class="empty-state"><b>HIDEOUT NOT RECLAIMED</b><p>Clear Operation 1.</p></div>`;return;}
    const h=state.hideoutLevel,max=h>=20,next=h+1,b=state.hideoutBuild,req=max?0:GD.hideoutOperationReq(next),cost=max?0:GD.hideoutIntelCost(next),effectiveM=max?0:GD.hideoutBuildMinutes(next)*(1-effectTotals().architect),nextTier=!max?GD.TIERS.find(t=>t.unlock===next):null;
    screen.innerHTML=`<div class="hideout-room-v6 lr2-hideout level-${h}"><div class="hideout-bg-wall"></div><div class="hideout-floor"></div><div class="hideout-window"></div><div class="hideout-desk"></div><div class="hideout-main-lamp"></div>${lr2HideoutFeatures(h)}<div class="hideout-level-badge">HIDEOUT // LEVEL ${h}</div></div><div class="hideout-bottom-grid"><div class="pixel-panel hideout-rebuild lr2-hideout-panel"><div class="panel-title"><h2>${max?'HIDEOUT COMPLETE':`LEVEL ${next}`}</h2><small>${nextTier?`${nextTier.name.toUpperCase()} CONTACTS`:max?'COMPLETE':'REBUILD'}</small></div>${max?`<div class="empty-state compact-empty"><b>THE HIDEOUT IS FULLY REBUILT</b></div>`:b?renderBuildProgress(b):`<div class="requirements"><div class="req ${state.intel>=cost?'ok':'bad'}">INTEL<br><b>${GD.formatNum(cost)}</b></div><div class="req ${state.highestCleared>=req?'ok':'bad'}">CLEAR<br><b>OP ${req}</b></div></div><div class="stat"><small>Build Time</small><b>${GD.formatTime(effectiveM*60)}</b></div><button class="btn primary" id="hideout-upgrade" ${state.intel<cost||state.highestCleared<req?'disabled':''}>BEGIN REBUILD</button>`}</div><button class="pixel-panel network-output-panel" data-info-v6="network"><div class="panel-title"><h3>THE NETWORK</h3><small>?</small></div><div class="stat"><small>Whispers</small><b>${GD.formatNum(whisperRate())} / HOUR</b></div></button></div>`;
    const up=document.getElementById('hideout-upgrade');if(up)up.onclick=()=>{startHideoutUpgrade();};
  };

  function lr2SortedDeck(){return deckInstances().slice().sort((a,b)=>b.tier-a.tier||GD.cardDps(b)-GD.cardDps(a));}
  function lr2DeckCard(inst){const cost=inst.level<GD.CARD_LEVEL_CAP?GD.cardLevelCost(inst.tier,inst.level):0;return `<div class="deck-slot-v6" data-lr2-deck-hold="${inst.uid}"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button><button class="deck-level-btn" data-deck-level="${inst.uid}" ${state.gold<cost||inst.level>=GD.CARD_LEVEL_CAP?'disabled':''}>${inst.level>=GD.CARD_LEVEL_CAP?'MAX LEVEL':`LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`}</button></div>`;}
  renderDeck=function(){
    const d=lr2SortedDeck(),rows=[d.slice(0,1),d.slice(1,3),d.slice(3,6),d.slice(6,10)];screen.innerHTML=`<div class="pixel-panel tight deck-head-v6"><div class="panel-title"><h2>OPERATION DECK</h2><small>${d.length}/10 ACTIVE</small></div><button class="btn primary" id="auto-deck-v6">AUTO EQUIP HIGHEST DPS</button><p>Tap to inspect. Hold to replace.</p></div><div class="deck-pyramid-v6">${rows.map((r,i)=>`<div class="deck-row-v6 count-${i+1}">${r.map(lr2DeckCard).join('')}</div>`).join('')}</div>`;
    document.getElementById('auto-deck-v6').onclick=()=>{autoFillDeck();save();render();};lr2BindDeckHold();
  };
  function lr2BindDeckHold(){screen.querySelectorAll('[data-lr2-deck-hold]').forEach(el=>{let timer=null,sx=0,sy=0;const run=()=>{lr2SwapTargetUid=el.dataset.lr2DeckHold;lr2SyndicatePick=false;currentScreen='library';save();render();};const start=e=>{const p=e.touches?.[0]||e;sx=p.clientX;sy=p.clientY;timer=setTimeout(()=>{timer=null;run();},520);};const stop=()=>{if(timer){clearTimeout(timer);timer=null;}};el.addEventListener('touchstart',start,{passive:true});el.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.abs(p.clientX-sx)>12||Math.abs(p.clientY-sy)>12)stop();},{passive:true});el.addEventListener('touchend',stop);el.addEventListener('mousedown',start);el.addEventListener('mouseup',stop);el.addEventListener('mouseleave',stop);el.addEventListener('contextmenu',e=>{e.preventDefault();run();});});}
  function lr2OrderedCopies(defId){const all=state.inventory.filter(c=>c.defId===defId);if(all.length<2)return all;const max=all.slice().sort((a,b)=>GD.cardDps(b)-GD.cardDps(a)||(b.holo?1:0)-(a.holo?1:0))[0];const rest=all.filter(c=>c.uid!==max.uid).sort((a,b)=>(b.holo?1:0)-(a.holo?1:0)||GD.cardDps(b)-GD.cardDps(a));return [max,...rest];}
  function lr2LibraryMatch(def,q){if(!q)return true;q=q.toLowerCase();const copies=state.inventory.filter(c=>c.defId===def.id),td=GD.tierData(def.tier),holo=copies.some(c=>c.holo),text=[def.name,td.name,`${td.name} deck`,def.ability?.name||'',def.ability?.text||'',holo?'holographic holo shiny':''].join(' ').toLowerCase();return text.includes(q);}
  function lr2BestStats(def){const copies=state.inventory.filter(c=>c.defId===def.id),best=Math.max(0,...copies.map(GD.cardDps));return{best,holo:copies.some(c=>c.holo)};}
  renderLibrary=function(){
    const unlocked=GD.TIERS.filter(t=>state.hideoutLevel>=t.unlock);if(lr2LibraryFilter&&!unlocked.some(t=>t.id===lr2LibraryFilter))lr2LibraryFilter=0;
    const filters=[`<button class="filter-btn ${lr2LibraryFilter===0?'on':''}" data-lr2-filter="0">ALL</button>`].concat(unlocked.map(t=>`<button class="filter-btn ${lr2LibraryFilter===t.id?'on':''}" data-lr2-filter="${t.id}">${t.name}</button>`)).join('');
    let defs=GD.CARDS.filter(def=>state.discovered.includes(def.id)).filter(def=>!lr2LibraryFilter||def.tier===lr2LibraryFilter).filter(def=>lr2LibraryMatch(def,lr2LibrarySearch));if(lr2SwapTargetUid)defs=defs.filter(isOperationDef);if(lr2SyndicatePick)defs=defs.filter(isSyndicateDef);
    defs.sort((a,b)=>{const A=lr2BestStats(a),B=lr2BestStats(b);if(lr2LibrarySort==='holo')return Number(B.holo)-Number(A.holo)||b.tier-a.tier||B.best-A.best;if(lr2LibrarySort==='rarity')return b.tier-a.tier||a.name.localeCompare(b.name);if(lr2LibrarySort==='dps')return B.best-A.best||b.tier-a.tier;if(lr2LibrarySort==='name')return a.name.localeCompare(b.name);return b.tier-a.tier||B.best-A.best;});
    const tiles=defs.map(def=>{const copies=lr2OrderedCopies(def.id);if(!copies.length)return'';const idx=clamp(lr2CopyCursor[def.id]||0,0,copies.length-1);lr2CopyCursor[def.id]=idx;const inst=copies[idx];return `<div class="library-card-shell-v6" data-lr2-shell="${def.id}">${copies.length>1?`<div class="copy-indicator-v6">${idx+1}/${copies.length}</div>`:''}<button class="collection-card-wrap" data-lr2-card="${def.id}" data-lr2-copy="${inst.uid}">${gameCardMarkup(inst,{showNew:false})}</button></div>`;}).join('');
    const mode=lr2SwapTargetUid?'<div class="lr2-swap-banner">CHOOSE THE OPERATIVE YOU WANT IN THIS DECK SLOT</div>':lr2SyndicatePick?'<div class="lr2-swap-banner">CHOOSE A SUPPORT OPERATIVE</div>':'';
    screen.innerHTML=`<div class="library-sticky-stack">${mode}<div class="pixel-panel tight library-head-v6"><div class="panel-title"><h2>LIBRARY</h2><small>${defs.length} FOUND</small></div><div class="library-toolbar"><input id="lr2-lib-search" placeholder="Search name, ability, deck, holo" value="${escapeHtml(lr2LibrarySearch)}"><label class="select-shell"><span>SORT</span><select id="lr2-lib-sort"><option value="rarityDps" ${lr2LibrarySort==='rarityDps'?'selected':''}>Rarity + DPS</option><option value="rarity" ${lr2LibrarySort==='rarity'?'selected':''}>Rarity</option><option value="dps" ${lr2LibrarySort==='dps'?'selected':''}>DPS</option><option value="holo" ${lr2LibrarySort==='holo'?'selected':''}>Holographic</option><option value="name" ${lr2LibrarySort==='name'?'selected':''}>Name</option></select></label></div><div class="filter-row">${filters}</div></div></div><div class="card-grid lr2-library-grid">${tiles||'<div class="library-empty">No matching cards.</div>'}</div>`;
    document.getElementById('lr2-lib-search').oninput=e=>{lr2LibrarySearch=e.target.value;renderLibrary();};document.getElementById('lr2-lib-sort').onchange=e=>{lr2LibrarySort=e.target.value;renderLibrary();};screen.querySelectorAll('[data-lr2-filter]').forEach(b=>b.onclick=()=>{lr2LibraryFilter=Number(b.dataset.lr2Filter);renderLibrary();});lr2BindLibrary();
  };
  function lr2BindLibrary(){
    screen.querySelectorAll('[data-lr2-shell]').forEach(shell=>{let x=0,y=0;const id=shell.dataset.lr2Shell;shell.addEventListener('touchstart',e=>{x=e.touches[0].clientX;y=e.touches[0].clientY;},{passive:true});shell.addEventListener('touchend',e=>{const p=e.changedTouches[0],dx=p.clientX-x,dy=p.clientY-y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){const copies=lr2OrderedCopies(id);if(copies.length>1){const scroll=screen.scrollTop;shell.classList.add(dx<0?'swipe-copy-left':'swipe-copy-right');lr2PlaySfx(dx<0?'flipDown':'flip');setTimeout(()=>{lr2CopyCursor[id]=(lr2CopyCursor[id]||0)+(dx<0?1:-1);if(lr2CopyCursor[id]<0)lr2CopyCursor[id]=copies.length-1;if(lr2CopyCursor[id]>=copies.length)lr2CopyCursor[id]=0;renderLibrary();requestAnimationFrame(()=>screen.scrollTop=scroll);},160);}}},{passive:true});});
    screen.querySelectorAll('[data-lr2-card]').forEach(b=>b.onclick=()=>{const uid=b.dataset.lr2Copy;if(lr2SwapTargetUid){const idx=state.deck.indexOf(lr2SwapTargetUid);if(idx>=0){const existing=state.deck.indexOf(uid);if(existing>=0)[state.deck[idx],state.deck[existing]]=[state.deck[existing],state.deck[idx]];else state.deck[idx]=uid;state.syndicate=state.syndicate.filter(x=>x!==uid);}lr2SwapTargetUid=null;save();currentScreen='deck';render();return;}if(lr2SyndicatePick){const slots=GD.syndicateSlots(state.hideoutLevel);if(!state.syndicate.includes(uid)){if(state.syndicate.length>=slots)state.syndicate.shift();state.deck=state.deck.filter(x=>x!==uid);state.syndicate.push(uid);}lr2SyndicatePick=false;save();currentScreen='syndicate';render();return;}showCardDetail(uid);});
  }
  renderSyndicate=function(){
    if(!state.unlocks.syndicate){screen.innerHTML=`<div class="empty-state"><b>SYNDICATE LOCKED</b><p>Continue rebuilding the Hideout.</p></div>`;return;}const slotsN=GD.syndicateSlots(state.hideoutLevel),active=syndicateInstances(),slots=Array.from({length:slotsN},(_,i)=>{const inst=active[i];return inst?`<div class="syndicate-slot-v6"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button></div>`:'<div class="syndicate-slot-v6 empty">EMPTY</div>';}).join(''),e=effectTotals();
    screen.innerHTML=`<div class="pixel-panel tight syndicate-panel-v6"><div class="panel-title"><h2>SYNDICATE</h2><small>${active.length}/${slotsN} ACTIVE</small></div><p>Support operatives work from the Hideout.</p><div class="syndicate-grid-v6">${slots}</div><div class="syndicate-actions"><button class="btn primary" id="lr2-syn-choose">CHOOSE OPERATIVE</button><button class="btn ghost" data-info-v6="syndicate">HOW IT WORKS</button></div></div><div class="stats-grid syndicate-stats-v6"><div class="stat"><small>Build Speed</small><b>-${Math.round(e.architect*100)}%</b></div><div class="stat"><small>Pack Cost</small><b>-${Math.round(e.broker*100)}%</b></div><div class="stat"><small>Card Quality</small><b>+${Math.round(e.appraiser*100)}%</b></div><div class="stat"><small>Sale Return</small><b>+${Math.round(e.salvager*100)}%</b></div></div>`;
    document.getElementById('lr2-syn-choose').onclick=()=>{lr2SyndicatePick=true;lr2SwapTargetUid=null;currentScreen='library';save();render();};
  };

  renderSettings=function(){
    const entries=lr2StoryEntries(),recent=entries.slice(-3),tester=TESTER_MODE?`<div class="pixel-panel"><div class="panel-title"><h3>TESTER</h3></div><div class="dev-grid"><button class="btn ghost" data-dev="gold">+1M GOLD</button><button class="btn ghost" data-dev="intel">+1M INTEL</button><button class="btn ghost" data-dev="whispers">+1M WHISPERS</button><button class="btn ghost" data-dev="build">FINISH BUILD</button><button class="btn ghost" data-dev="kill">KILL ENEMY</button><button class="btn ghost" data-dev="clear">CLEAR OP</button><button class="btn danger" data-dev="reset">RESET SAVE</button></div></div>`:'';
    screen.innerHTML=`<div class="pixel-panel more-settings-v6"><div class="panel-title"><h2>MORE</h2><small>AUDIO</small></div><div class="audio-control"><div><b>SOUND</b><span id="lr2-sfx-label">${Math.round(state.settings.soundVolume*100)}%</span></div><input id="lr2-sfx" type="range" min="0" max="100" step="1" value="${Math.round(state.settings.soundVolume*100)}"></div><div class="audio-control"><div><b>MUSIC</b><span id="lr2-music-label">${Math.round(state.settings.musicVolume*100)}%</span></div><input id="lr2-music" type="range" min="0" max="100" step="1" value="${Math.round(state.settings.musicVolume*100)}"></div><div class="setting"><b>REDUCED MOTION</b><button class="mini-btn" id="lr2-motion">${state.settings.reducedMotion?'ON':'OFF'}</button></div></div><div class="pixel-panel story-panel-v6"><div class="panel-title"><h3>STORY LOG</h3><small>${entries.length} CHAPTER${entries.length===1?'':'S'}</small></div><button class="btn primary story-so-far-btn" id="lr2-story-so-far">READ THE STORY SO FAR</button><div class="story-log-compact">${recent.map(s=>{const n=entries.findIndex(x=>x.id===s.id)+1;return `<button class="story-entry" data-lr2-replay="${s.id}"><span class="story-chapter-num">${String(n).padStart(2,'0')}</span><b>${escapeHtml(s.title)}</b></button>`;}).join('')}</div><button class="btn ghost story-view-all" id="lr2-story-all">ALL CHAPTERS</button></div>${tester}`;
    const sfx=document.getElementById('lr2-sfx'),music=document.getElementById('lr2-music');
    sfx.oninput=e=>{state.settings.soundVolume=Number(e.target.value)/100;state.settings.sound=state.settings.soundVolume>0;document.getElementById('lr2-sfx-label').textContent=`${e.target.value}%`;save();};sfx.onchange=()=>{};
    music.oninput=e=>{state.settings.musicVolume=Number(e.target.value)/100;state.settings.music=state.settings.musicVolume>0;document.getElementById('lr2-music-label').textContent=`${e.target.value}%`;save();lr2EnsureMusic();};
    document.getElementById('lr2-motion').onclick=()=>{state.settings.reducedMotion=!state.settings.reducedMotion;save();renderSettings();};document.getElementById('lr2-story-so-far').onclick=lr2ShowStorySoFar;document.getElementById('lr2-story-all').onclick=lr2ShowAllStories;screen.querySelectorAll('[data-lr2-replay]').forEach(b=>b.onclick=()=>{const s=findStoryById(b.dataset.lr2Replay);if(s)enqueueStory(s,true);});screen.querySelectorAll('[data-dev]').forEach(b=>b.onclick=()=>devAction(b.dataset.dev));
  };

  const lr2BaseShowPackOpening=showPackOpening;
  showPackOpening=function(...args){lr2BaseShowPackOpening(...args);const cover=document.getElementById('pack-cover');if(cover)cover.addEventListener('click',()=>lr2PlaySfx('packOpen'),{once:true,capture:true});};

  const lr2BaseRender=render;
  render=function(){lr2BaseRender();requestAnimationFrame(()=>{lr2BindHolo();lr2EnsureMusic();});};

  lr2Migrate();
  render();
})();
