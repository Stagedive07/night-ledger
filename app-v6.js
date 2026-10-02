(() => {
  const CARD_ART_V6 = {
    't1-c01':'assets/card-art/ratknife.png',
    't1-c02':'assets/card-art/mira-voss.png',
    't1-c03':'assets/card-art/the-candleman.png',
    't1-c04':'assets/card-art/alley-surgeon.png'
  };

  const GUIDE_V6 = {
    battle:{title:'OPERATIONS',text:'Assassinate to follow the trail forward. Bide Your Time when you want to stay put and gather resources.'},
    hideout:{title:'THE HIDEOUT',text:'Use Intel to rebuild the Hideout. Each room brings more of the old network back within reach.'},
    packs:{title:'BOOSTER PACKS',text:'Choose a pack to recruit new operatives.'},
    deck:{title:'OPERATION DECK',text:'These are the operatives going with you. Tap a card to inspect it, or hold it to choose a replacement.'},
    library:{title:'THE LIBRARY',text:'Every operative you have found is kept here. Search by name, ability, deck, or Holographic.'},
    syndicate:{title:'THE SYNDICATE',text:'Assign support operatives here. Their specialties help the Hideout while they are assigned.'},
    settings:{title:'MORE',text:'Sound, music, and your story chapters are kept here.'}
  };

  const INFO_V6 = {
    momentum:{title:'Momentum',text:'Some operatives grow stronger as you keep defeating enemies without a long break.'},
    resolve:{title:'Resolve',text:'Resolve strengthens every operative in your Operation Deck.'},
    whispers:{title:'Whispers',text:'Your contacts gather Whispers over time. Spend them on Booster Packs.'},
    gold:{title:'Gold',text:'Spend Gold to level your operatives and increase their damage.'},
    intel:{title:'Intel',text:'Intel is recovered during Operations and used to rebuild the Hideout.'},
    network:{title:'The Network',text:'As the Hideout grows, old contacts return and gather Whispers for you.'},
    syndicate:{title:'The Syndicate',text:'Support operatives assigned here use their specialties from the Hideout instead of joining Operations.'}
  };

  let packPageV6=0;
  let libraryFilterV6=0;
  let librarySortV6='rarity';
  let librarySearchV6='';
  let swapTargetUidV6=null;
  let syndicatePickV6=false;
  const copyCursorV6={};

  state.uiHelpSeen ||= {};
  state.uiGuideSeenV6 ||= {};

  function showInfoV6(key,titleText){
    const d=titleText?{title:key,text:titleText}:INFO_V6[key];
    if(!d)return;
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal info-modal"><h2>${escapeHtml(d.title)}</h2><p>${escapeHtml(d.text)}</p><button class="btn primary" id="v6-info-close" style="width:100%">CLOSE</button></div></div>`;
    document.getElementById('v6-info-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }

  function maybeGuideV6(){
    if(modalOpen||activeStory||state.uiGuideSeenV6?.[currentScreen])return;
    const guide=GUIDE_V6[currentScreen];if(!guide)return;
    state.uiGuideSeenV6[currentScreen]=true;save();
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal info-modal"><h2>${escapeHtml(guide.title)}</h2><p>${escapeHtml(guide.text)}</p><button class="btn primary" id="v6-guide-close" style="width:100%">CONTINUE</button></div></div>`;
    document.getElementById('v6-guide-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }

  function bindInfoV6(){
    document.querySelectorAll('[data-info-v6]').forEach(el=>el.onclick=e=>{e.preventDefault();e.stopPropagation();playUISoundV5?.('select');showInfoV6(el.dataset.infoV6);});
    document.querySelectorAll('.resource-chip').forEach(ch=>{const label=ch.querySelector('span')?.textContent;const k=label==='G'?'gold':label==='I'?'intel':'whispers';ch.onclick=()=>showInfoV6(k);});
    document.querySelectorAll('[data-card-detail]').forEach(b=>b.onclick=()=>{playUISoundV5?.('select');showCardDetail(b.dataset.cardDetail);});
    document.querySelectorAll('[data-deck-level]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();playUISoundV5?.('select');levelCard(b.dataset.deckLevel,1);});
  }

  gameCardMarkup = function(inst,opts={}){
    if(!inst)return'';
    const def=getDef(inst),td=GD.tierData(inst.tier),compact=!!opts.compact,showNew=opts.showNew??!!inst.isNew,showLevel=opts.showLevel??true;
    const hideLore=!!opts.hideLore,hideAbilityText=!!opts.hideAbilityText;
    const ability=def?.ability?`<div class="game-card-ability"><b>${escapeHtml(def.ability.name)}</b>${hideAbilityText?'':escapeHtml(def.ability.text)}</div>`:'';
    const lore=!hideLore&&def?.lore?`<div class="game-card-lore">${escapeHtml(def.lore)}</div>`:'';
    const artSrc=CARD_ART_V6[def?.id];
    const art=artSrc?`<img src="${artSrc}" alt="${escapeHtml(def.name)}" draggable="false">`:'[ CARD ART TBD ]';
    const inDeck=state.deck.includes(inst.uid)?'<div class="card-zone-tag">IN DECK</div>':state.syndicate.includes(inst.uid)?'<div class="card-zone-tag">IN SYNDICATE</div>':'';
    return `<div class="game-card ${compact?'compact':''} ${hideLore?'no-lore':''} ${hideAbilityText?'no-ability-text':''} ${inst.holo?'holo':''}" style="border-color:${td.accent}">${inst.holo?'<span class="holo-tag">HOLOGRAPHIC ✦</span>':''}${showNew?'<span class="new-tag">NEW</span>':''}<div class="game-card-head"><div class="game-card-name">${escapeHtml(def.name)}</div><div class="game-card-deck" style="color:${td.accent}">${td.name.toUpperCase()} DECK</div>${inDeck}</div><div class="game-card-art">${art}</div><div class="game-card-bottom">${ability}${lore}${showLevel?`<div class="game-card-level">LV ${inst.level}</div>`:''}<div class="game-card-dps">DPS ${GD.formatNum(GD.cardDps(inst))}</div></div></div>`;
  };

  const renderV5=render;
  render=function(){
    state.uiHelpSeen ||= {};
    state.uiHelpSeen[currentScreen]=true;
    renderV5();
    document.body.classList.toggle('screen-scroll',currentScreen==='deck'||currentScreen==='library');
    document.body.classList.toggle('screen-fixed',currentScreen!=='deck'&&currentScreen!=='library');
    bindInfoV6();
    setTimeout(maybeGuideV6,0);
  };

  renderBattle=function(){
    if(!state.firstPackOpened){screen.innerHTML=`<div class="empty-state"><b>NO OPERATIVES READY</b><p>Open your first Street pack.</p><button class="btn primary" data-nav="packs">GO TO PACKS</button></div>`;bindCommonActions();return;}
    if(state.battle.paused){screen.innerHTML=`<div class="pixel-panel operation-ready"><div class="battle-head"><div><div class="kicker">READY</div><div class="operation-title">OPERATION ${state.currentOperation}</div></div><div class="encounter-big">25 ENCOUNTERS</div></div><div class="empty-state"><b>YOUR OPERATIVES ARE READY</b><p>Begin when you are ready to follow the next lead.</p><button class="btn primary" id="begin-operation">BEGIN OPERATION</button></div></div>`;document.getElementById('begin-operation').onclick=()=>{playUISoundV5?.('place');beginOperation();};return;}
    if(!state.battle.enemy)spawnEnemy();
    const enemy=state.battle.enemy,op=state.currentOperation,enc=state.battle.encounter,hp=Math.max(0,enemy?.hp||0),max=enemy?.maxHp||1,pct=100*hp/max,dps=estimateDeckDps(!!enemy?.target,enemy?hp/max:1),timer=enemy?.target?Math.max(0,(enemy.deadline-now())/1000):null;
    const dots=Array.from({length:25},(_,i)=>{const n=i+1;let c=n<enc?'done':'';if(n===enc)c+=' current';if(n===25)c+=' target';return `<i class="${c}"></i>`}).join('');
    const lockedFinal=state.highestCleared>=100&&state.hideoutLevel<20;
    screen.innerHTML=`<div class="pixel-panel operation-panel"><div class="battle-head"><div><div class="kicker">${state.battle.mode==='farm'?'BIDING YOUR TIME':'ASSASSINATING'}</div><div class="operation-title">OPERATION ${op}</div></div><div class="encounter-big">ENCOUNTER ${enc}/25</div></div><div class="encounter-dots">${dots}</div>${lockedFinal?`<div class="empty-state"><b>THE FINAL DOOR IS SEALED</b><p>Rebuild the Hideout completely.</p></div>`:`<div class="enemy-card ${enemy?.target?'target':''}"><div><div class="enemy-meta"><span>${enemy?.target?'TARGET':'ENEMY'}</span><span>${enemy?.target?'ESCAPING':'ENGAGED'}</span></div><div class="art-box">[ ENEMY ART TBD ]</div></div><div><div class="enemy-name">${escapeHtml(enemy?.name||'...')}</div><div class="meter ${enemy?.target?'':'blue'}"><i style="width:${pct}%"></i></div><div class="meter-label"><span>${GD.formatNum(hp)} HP</span><span>${GD.formatNum(max)} HP</span></div>${enemy?.target?`<div class="meter gold" style="margin-top:7px"><i style="width:${clamp(timer/30*100,0,100)}%"></i></div><div class="meter-label"><span>ESCAPE</span><span>${timer.toFixed(1)}s</span></div>`:''}</div></div>`}</div><div class="stats-grid operation-stats"><div class="stat"><small>Deck DPS</small><b>${GD.formatNum(dps)}</b></div><div class="stat"><small>Highest Clear</small><b>OP ${state.highestCleared}</b></div><button class="stat info-stat" data-info-v6="momentum"><small>Momentum</small><b>${state.battle.momentumStacks}/10</b></button><button class="stat info-stat" data-info-v6="resolve"><small>Resolve</small><b>+${Math.round((state.resolveBonus||0)*100)}%</b></button></div><div class="operation-actions"><button class="btn assassinate ${state.battle.mode==='push'?'selected':''}" data-battle-mode="push" ${lockedFinal?'disabled':''}>${state.battle.targetFailed?'RETRY TARGET':'ASSASSINATE'}</button><button class="btn bide ${state.battle.mode==='farm'?'selected':''}" data-battle-mode="farm" ${lockedFinal?'disabled':''}>BIDE YOUR TIME</button></div>`;
    screen.querySelectorAll('[data-battle-mode]').forEach(b=>b.onclick=()=>{playUISoundV5?.('select');setBattleMode(b.dataset.battleMode);});bindInfoV6();
  };

  function hideoutPropsV6(level){let html='';for(let n=2;n<=Math.min(20,level);n++)html+=`<i class="hideout-prop p${n}"></i>`;return html;}
  renderHideout=function(){
    if(!state.unlocks.hideout){screen.innerHTML=`<div class="empty-state"><b>HIDEOUT NOT RECLAIMED</b><p>Clear Operation 1.</p></div>`;return;}
    const h=state.hideoutLevel,max=h>=20,next=h+1,b=state.hideoutBuild,req=max?0:GD.hideoutOperationReq(next),cost=max?0:GD.hideoutIntelCost(next),effectiveM=max?0:GD.hideoutBuildMinutes(next)*(1-effectTotals().architect),nextTier=!max?GD.TIERS.find(t=>t.unlock===next):null;
    screen.innerHTML=`<div class="hideout-room-v6 level-${h}"><div class="wall"></div><div class="floor"></div><div class="window"></div><div class="desk"></div><div class="lantern"></div>${hideoutPropsV6(h)}<div class="hideout-level-badge">HIDEOUT // LEVEL ${h}</div></div><div class="hideout-bottom-grid"><div class="pixel-panel hideout-rebuild"><div class="panel-title"><h2>${max?'HIDEOUT COMPLETE':`LEVEL ${next}`}</h2><small>${nextTier?`${nextTier.name.toUpperCase()} CONTACTS`:max?'COMPLETE':'REBUILD'}</small></div>${max?`<div class="empty-state compact-empty"><b>THE HIDEOUT IS FULLY REBUILT</b></div>`:b?renderBuildProgress(b):`<div class="requirements"><div class="req ${state.intel>=cost?'ok':'bad'}">INTEL<br><b>${GD.formatNum(cost)}</b></div><div class="req ${state.highestCleared>=req?'ok':'bad'}">CLEAR<br><b>OP ${req}</b></div></div><div class="stat"><small>Build Time</small><b>${GD.formatTime(effectiveM*60)}</b></div><button class="btn primary" id="hideout-upgrade" style="width:100%;margin-top:6px" ${state.intel<cost||state.highestCleared<req?'disabled':''}>BEGIN REBUILD</button>`}</div><button class="pixel-panel network-output-panel" data-info-v6="network"><div class="panel-title"><h3>THE NETWORK</h3><small>?</small></div><div class="stat"><small>Whispers</small><b>${GD.formatNum(whisperRate())} / HOUR</b></div></button></div>`;
    const up=document.getElementById('hideout-upgrade');if(up)up.onclick=()=>{playUISoundV5?.('place');startHideoutUpgrade();};bindInfoV6();
  };

  renderPacks=function(){
    const all=GD.TIERS,per=4,pages=Math.ceil(all.length/per);packPageV6=clamp(packPageV6,0,pages-1);const shown=all.slice(packPageV6*per,packPageV6*per+per),highest=GD.tierForHideout(state.hideoutLevel);
    const cards=shown.map(t=>{const locked=state.hideoutLevel<t.unlock,price=packCost(t.id),free=state.freeStreetPack&&t.id===1,name=locked?'UNKNOWN PACK':`${t.name.toUpperCase()} DECK`,accent=locked?'#555e67':t.accent;return `<div class="pack-card-v6 ${locked?'locked':''}" style="color:${accent}"><div class="pack-mini"><div><b>${name}</b><small>${locked?'LOCKED':'10 CARDS'}</small></div></div><div class="pack-card-copy">${locked?`Hideout Level ${t.unlock}`:`${escapeHtml(t.name)} contacts`}</div><div class="pack-cost">${free?'FREE':`${GD.formatNum(price)} WHISPERS`}</div><button class="btn ${!locked&&t.id===highest?'primary':''}" data-open-pack="${t.id}" ${locked?'disabled':''}>${free?'OPEN':'BUY'}</button></div>`;}).join('');
    screen.innerHTML=`<div class="pixel-panel tight packs-heading"><div class="panel-title"><h2>BOOSTER PACKS</h2><small>10 CARDS EACH</small></div><p>Choose a pack to recruit new operatives.</p></div><div class="pack-grid-v6">${cards}</div><div class="pack-pager"><button class="btn ghost" id="pack-prev" ${packPageV6===0?'disabled':''}>PREV</button><div class="pack-page">${packPageV6+1}/${pages}</div><button class="btn ghost" id="pack-next" ${packPageV6===pages-1?'disabled':''}>NEXT</button></div>`;
    document.getElementById('pack-prev').onclick=()=>{packPageV6--;renderPacks();};document.getElementById('pack-next').onclick=()=>{packPageV6++;renderPacks();};screen.querySelectorAll('[data-open-pack]').forEach(b=>b.onclick=()=>{playUISoundV5?.('place');openPack(Number(b.dataset.openPack),state.freeStreetPack&&Number(b.dataset.openPack)===1);});
  };

  function lowestDeckCardV6(){return deckInstances().filter(c=>isOperationDef(getDef(c))).sort((a,b)=>GD.cardDps(a)-GD.cardDps(b))[0]||null;}
  function cardDeltaV6(inst){if(state.deck.includes(inst.uid))return{v:0,text:'IN DECK',cls:'delta-zero',inDeck:true};const low=lowestDeckCardV6();const base=state.deck.length<10?0:(low?GD.cardDps(low):0);const v=GD.cardDps(inst)-base;return{v,text:`${v>0?'+':''}${GD.formatNum(v)} DPS`,cls:v>0?'delta-pos':v<0?'delta-neg':'delta-zero'};}
  function equipFromPackV6(uid){
    const inst=getInstance(uid);if(!inst)return;const def=getDef(inst);
    if(isSyndicateDef(def)){if(!state.unlocks.syndicate)return toast('The Syndicate is not available yet.');if(state.syndicate.includes(uid))return;const slots=GD.syndicateSlots(state.hideoutLevel);if(state.syndicate.length>=slots){const old=state.syndicate.shift();if(old===uid)return;}state.deck=state.deck.filter(x=>x!==uid);state.syndicate.push(uid);save();playUISoundV5?.('place');return;}
    if(state.deck.includes(uid))return;state.syndicate=state.syndicate.filter(x=>x!==uid);if(state.deck.length<10)state.deck.push(uid);else{const low=lowestDeckCardV6();const idx=low?state.deck.indexOf(low.uid):-1;if(idx>=0)state.deck[idx]=uid;else state.deck[0]=uid;}save();playUISoundV5?.('place');
  }
  function packSummaryV6(packTier,pack,done,stack){
    const rows=pack.map(c=>{const def=getDef(c);if(isSyndicateDef(def)){const assigned=state.syndicate.includes(c.uid);return `<div class="pack-result-card">${gameCardMarkup(c,{showNew:c.isNew,showLevel:false})}<div class="pack-equip-note delta-zero">${assigned?'IN SYNDICATE':'SUPPORT OPERATIVE'}</div><button class="btn pack-equip-btn" data-pack-equip="${c.uid}" ${assigned||!state.unlocks.syndicate?'disabled':''}>${assigned?'ASSIGNED':'ASSIGN'}</button></div>`;}const d=cardDeltaV6(c);return `<div class="pack-result-card">${gameCardMarkup(c,{showNew:c.isNew,showLevel:false})}<div class="pack-equip-note ${d.cls}">${d.text}</div><button class="btn pack-equip-btn" data-pack-equip="${c.uid}" ${d.inDeck?'disabled':''}>${d.inDeck?'EQUIPPED':'EQUIP'}</button></div>`;}).join('');
    stack.innerHTML=`<div class="pack-summary"><h2>${GD.tierData(packTier).name.toUpperCase()} DECK</h2><div class="summary-grid">${rows}</div><button class="btn primary" id="pack-done" style="width:100%;margin-top:14px">DONE</button></div>`;
    stack.querySelectorAll('[data-pack-equip]').forEach(b=>b.onclick=()=>{equipFromPackV6(b.dataset.packEquip);packSummaryV6(packTier,pack,done,stack);});document.getElementById('pack-done').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;done();};
  }

  showPackOpening=function(packTier,pack,price,done){
    modalOpen=true;modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal pack-modal"><div class="pack-stage" id="pack-stage"><div class="pack-rip" id="pack-rip"></div><div class="pack-cover" id="pack-cover" aria-label="Open pack"></div><div class="reveal-stack" id="reveal-stack"></div></div></div></div>`;
    const cover=document.getElementById('pack-cover');cover.onclick=()=>{if(cover.dataset.opening)return;playUISoundV5?.('flip');cover.dataset.opening='1';cover.classList.add('shake');setTimeout(()=>{cover.classList.remove('shake');cover.classList.add('opening');document.getElementById('pack-rip').classList.add('fly');setTimeout(()=>startReveal(packTier,pack,price,done),state.settings.reducedMotion?10:420)},state.settings.reducedMotion?10:420);};
  };
  startReveal=function(packTier,pack,price,done){
    const cover=document.getElementById('pack-cover');if(cover)cover.style.display='none';const stack=document.getElementById('reveal-stack');stack.classList.add('active');let index=0,faceUp=false;
    function face(inst){return `<div class="reveal-face reveal-back"></div><div class="reveal-face reveal-front">${gameCardMarkup(inst,{showNew:inst.isNew,showLevel:false})}</div>`;}
    function draw(){if(index>=pack.length)return packSummaryV6(packTier,pack,done,stack);stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;const maxVisible=Math.min(4,pack.length-index);for(let j=maxVisible-1;j>=0;j--){const inst=pack[index+j],el=document.createElement('div');el.className=`reveal-card ${inst.holo?'holo':''}`;el.style.zIndex=10-j;const poses=['translate(0,0) rotate(0deg) scale(1)','translate(13px,17px) rotate(2deg) scale(.96)','translate(-12px,28px) rotate(-2.5deg) scale(.92)','translate(18px,39px) rotate(3deg) scale(.88)'];el.style.transform=poses[j];el.innerHTML=`<div class="flip-inner ${j===0&&faceUp?'faceup':''}">${face(inst)}</div>`;if(j===0)el.onclick=()=>{if(!faceUp){faceUp=true;playUISoundV5?.('flip');el.querySelector('.flip-inner').classList.add('faceup');return;}el.onclick=null;playUISoundV5?.('select');if(state.settings.reducedMotion){index++;faceUp=false;draw();}else{el.classList.add(['swipe-r0','swipe-r1','swipe-r2','swipe-r3'][index%4]);setTimeout(()=>{index++;faceUp=false;draw();},300);}};stack.appendChild(el);}const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent=faceUp?'TAP FOR NEXT CARD':'TAP TO FLIP';stack.appendChild(hint);}draw();
  };

  function sortedDeckV6(){return deckInstances().slice().sort((a,b)=>b.tier-a.tier||GD.cardDps(b)-GD.cardDps(a));}
  function deckCardV6(inst){const cost=inst.level<GD.CARD_LEVEL_CAP?GD.cardLevelCost(inst.tier,inst.level):0;return `<div class="deck-slot-v6" data-long-card-v6="${inst.uid}"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button><button class="deck-level-btn" data-deck-level="${inst.uid}" ${state.gold<cost||inst.level>=GD.CARD_LEVEL_CAP?'disabled':''}>${inst.level>=GD.CARD_LEVEL_CAP?'MAX LEVEL':`LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`}</button></div>`;}
  renderDeck=function(){
    const d=sortedDeckV6(),rows=[d.slice(0,1),d.slice(1,3),d.slice(3,6),d.slice(6,10)];screen.innerHTML=`<div class="pixel-panel tight deck-head-v6"><div class="panel-title"><h2>OPERATION DECK</h2><small>${d.length}/10 ACTIVE</small></div><button class="btn primary" id="auto-deck-v6">AUTO EQUIP HIGHEST DPS</button><p>Tap to inspect. Hold to replace.</p></div><div class="deck-pyramid-v6">${rows.map((r,i)=>`<div class="deck-row-v6 count-${i+1}">${r.map(deckCardV6).join('')}</div>`).join('')}</div>`;document.getElementById('auto-deck-v6').onclick=()=>{autoFillDeck();save();playUISoundV5?.('place');render();};bindInfoV6();bindDeckHoldV6();
  };
  function bindDeckHoldV6(){screen.querySelectorAll('[data-long-card-v6]').forEach(el=>{let timer=null,sx=0,sy=0;const start=e=>{const p=e.touches?.[0]||e;sx=p.clientX;sy=p.clientY;timer=setTimeout(()=>{timer=null;swapTargetUidV6=el.dataset.longCardV6;syndicatePickV6=false;currentScreen='library';save();render();},520);};const stop=()=>{if(timer){clearTimeout(timer);timer=null;}};el.addEventListener('touchstart',start,{passive:true});el.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.abs(p.clientX-sx)>12||Math.abs(p.clientY-sy)>12)stop();},{passive:true});el.addEventListener('touchend',stop);el.addEventListener('mousedown',start);el.addEventListener('mouseup',stop);el.addEventListener('mouseleave',stop);el.addEventListener('contextmenu',e=>{e.preventDefault();swapTargetUidV6=el.dataset.longCardV6;syndicatePickV6=false;currentScreen='library';save();render();});});}

  function orderedCopiesV6(defId){const all=state.inventory.filter(c=>c.defId===defId);if(all.length<2)return all;const max=all.slice().sort((a,b)=>GD.cardDps(b)-GD.cardDps(a)||(b.holo?1:0)-(a.holo?1:0))[0];const rest=all.filter(c=>c.uid!==max.uid).sort((a,b)=>(b.holo?1:0)-(a.holo?1:0)||GD.cardDps(b)-GD.cardDps(a));return [max,...rest];}
  function libraryMatchV6(def,q){if(!q)return true;q=q.toLowerCase();const copies=state.inventory.filter(c=>c.defId===def.id),td=GD.tierData(def.tier),holo=copies.some(c=>c.holo),text=[def.name,td.name,`${td.name} deck`,def.ability?.name||'',def.ability?.text||'',holo?'holographic holo shiny':''].join(' ').toLowerCase();return text.includes(q);}
  renderLibrary=function(){
    const unlocked=GD.TIERS.filter(t=>state.hideoutLevel>=t.unlock);if(libraryFilterV6&&!unlocked.some(t=>t.id===libraryFilterV6))libraryFilterV6=0;const filters=[`<button class="filter-btn ${libraryFilterV6===0?'on':''}" data-lib-filter-v6="0">ALL</button>`].concat(unlocked.map(t=>`<button class="filter-btn ${libraryFilterV6===t.id?'on':''}" data-lib-filter-v6="${t.id}">${t.name}</button>`)).join('');let defs=GD.CARDS.filter(def=>state.discovered.includes(def.id)).filter(def=>!libraryFilterV6||def.tier===libraryFilterV6).filter(def=>libraryMatchV6(def,librarySearchV6));if(swapTargetUidV6)defs=defs.filter(def=>isOperationDef(def));if(syndicatePickV6)defs=defs.filter(def=>isSyndicateDef(def));defs.sort((a,b)=>{const ad=Math.max(0,...state.inventory.filter(c=>c.defId===a.id).map(GD.cardDps)),bd=Math.max(0,...state.inventory.filter(c=>c.defId===b.id).map(GD.cardDps));if(librarySortV6==='dps')return bd-ad||b.tier-a.tier;if(librarySortV6==='name')return a.name.localeCompare(b.name);return b.tier-a.tier||bd-ad;});const tiles=defs.map(def=>{const copies=orderedCopiesV6(def.id);if(!copies.length)return'';const idx=clamp(copyCursorV6[def.id]||0,0,copies.length-1);copyCursorV6[def.id]=idx;const inst=copies[idx];return `<div class="library-card-shell-v6" data-lib-shell-v6="${def.id}">${copies.length>1?`<div class="copy-indicator-v6">${idx+1}/${copies.length}</div>`:''}<button class="collection-card-wrap" data-lib-card-v6="${def.id}" data-lib-copy-v6="${inst.uid}">${gameCardMarkup(inst,{showNew:false})}</button></div>`;}).join('');const mode=swapTargetUidV6?'<div class="swap-banner">Choose the operative you want in this deck slot.</div>':syndicatePickV6?'<div class="swap-banner">Choose a support operative.</div>':'';screen.innerHTML=`${mode}<div class="pixel-panel tight library-head-v6"><div class="panel-title"><h2>LIBRARY</h2><small>${defs.length} FOUND</small></div><div class="library-toolbar"><input id="lib-search-v6" placeholder="Search name, ability, deck, holo" value="${escapeHtml(librarySearchV6)}"><select id="lib-sort-v6"><option value="rarity" ${librarySortV6==='rarity'?'selected':''}>Rarity + DPS</option><option value="dps" ${librarySortV6==='dps'?'selected':''}>DPS</option><option value="name" ${librarySortV6==='name'?'selected':''}>Name</option></select></div><div class="filter-row">${filters}</div></div><div class="card-grid">${tiles||'<div class="library-empty">No matching cards.</div>'}</div>`;document.getElementById('lib-search-v6').oninput=e=>{librarySearchV6=e.target.value;renderLibrary();};document.getElementById('lib-sort-v6').onchange=e=>{librarySortV6=e.target.value;renderLibrary();};screen.querySelectorAll('[data-lib-filter-v6]').forEach(b=>b.onclick=()=>{libraryFilterV6=Number(b.dataset.libFilterV6);renderLibrary();});bindLibraryV6();
  };
  function bindLibraryV6(){
    screen.querySelectorAll('[data-lib-shell-v6]').forEach(shell=>{let x=0,y=0;const id=shell.dataset.libShellV6;shell.addEventListener('touchstart',e=>{x=e.touches[0].clientX;y=e.touches[0].clientY;},{passive:true});shell.addEventListener('touchend',e=>{const p=e.changedTouches[0],dx=p.clientX-x,dy=p.clientY-y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){const copies=orderedCopiesV6(id);if(copies.length>1){const scroll=screen.scrollTop;shell.classList.add(dx<0?'swipe-copy-left':'swipe-copy-right');playUISoundV5?.('flip');setTimeout(()=>{copyCursorV6[id]=(copyCursorV6[id]||0)+(dx<0?1:-1);if(copyCursorV6[id]<0)copyCursorV6[id]=copies.length-1;if(copyCursorV6[id]>=copies.length)copyCursorV6[id]=0;renderLibrary();requestAnimationFrame(()=>screen.scrollTop=scroll);},145);}}},{passive:true});});screen.querySelectorAll('[data-lib-card-v6]').forEach(b=>b.onclick=()=>{const uid=b.dataset.libCopyV6;if(swapTargetUidV6){const idx=state.deck.indexOf(swapTargetUidV6);if(idx>=0){const existing=state.deck.indexOf(uid);if(existing>=0)[state.deck[idx],state.deck[existing]]=[state.deck[existing],state.deck[idx]];else state.deck[idx]=uid;state.syndicate=state.syndicate.filter(x=>x!==uid);}swapTargetUidV6=null;save();playUISoundV5?.('place');currentScreen='deck';render();return;}if(syndicatePickV6){const slots=GD.syndicateSlots(state.hideoutLevel);if(!state.syndicate.includes(uid)){if(state.syndicate.length>=slots)state.syndicate.shift();state.deck=state.deck.filter(x=>x!==uid);state.syndicate.push(uid);}syndicatePickV6=false;save();playUISoundV5?.('place');currentScreen='syndicate';render();return;}showCardDetail(uid);});
  }

  renderSyndicate=function(){
    if(!state.unlocks.syndicate){screen.innerHTML=`<div class="empty-state"><b>SYNDICATE LOCKED</b><p>Continue rebuilding the Hideout.</p></div>`;return;}const slotsN=GD.syndicateSlots(state.hideoutLevel),active=syndicateInstances(),slots=Array.from({length:slotsN},(_,i)=>{const inst=active[i];return inst?`<div class="syndicate-slot-v6" data-syn-card-v6="${inst.uid}"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button></div>`:'<div class="syndicate-slot-v6 empty">EMPTY</div>';}).join(''),e=effectTotals();screen.innerHTML=`<div class="pixel-panel tight syndicate-panel-v6"><div class="panel-title"><h2>SYNDICATE</h2><small>${active.length}/${slotsN} ACTIVE</small></div><p>Support operatives work from the Hideout. Hold a card to read its specialty.</p><div class="syndicate-grid-v6">${slots}</div><div class="syndicate-actions"><button class="btn primary" id="syn-choose-v6">CHOOSE OPERATIVE</button><button class="btn ghost" data-info-v6="syndicate">HOW IT WORKS</button></div></div><div class="stats-grid syndicate-stats-v6"><div class="stat"><small>Build Speed</small><b>-${Math.round(e.architect*100)}%</b></div><div class="stat"><small>Pack Cost</small><b>-${Math.round(e.broker*100)}%</b></div><div class="stat"><small>Card Quality</small><b>+${Math.round(e.appraiser*100)}%</b></div><div class="stat"><small>Sale Return</small><b>+${Math.round(e.salvager*100)}%</b></div></div>`;document.getElementById('syn-choose-v6').onclick=()=>{syndicatePickV6=true;swapTargetUidV6=null;currentScreen='library';save();render();};bindInfoV6();bindSynHoldV6();
  };
  function bindSynHoldV6(){screen.querySelectorAll('[data-syn-card-v6]').forEach(el=>{let timer;const run=()=>{const inst=getInstance(el.dataset.synCardV6),a=getDef(inst)?.ability;if(a)showInfoV6(a.name,a.text);};el.addEventListener('touchstart',()=>{timer=setTimeout(run,520);},{passive:true});el.addEventListener('touchend',()=>clearTimeout(timer));el.addEventListener('touchmove',()=>clearTimeout(timer),{passive:true});el.addEventListener('contextmenu',e=>{e.preventDefault();run();});});}

  renderSettings=function(){
    const narrative=state.storySeen.map(id=>findStoryById(id)).filter(Boolean).filter(s=>!s.id.startsWith('sys_')),numbered=narrative.map((s,i)=>({s,n:i+1})),recent=numbered.slice(-4),tester=TESTER_MODE?`<div class="pixel-panel"><div class="panel-title"><h3>TESTER</h3></div><div class="dev-grid"><button class="btn ghost" data-dev="gold">+1M GOLD</button><button class="btn ghost" data-dev="intel">+1M INTEL</button><button class="btn ghost" data-dev="whispers">+1M WHISPERS</button><button class="btn ghost" data-dev="build">FINISH BUILD</button><button class="btn ghost" data-dev="kill">KILL ENEMY</button><button class="btn ghost" data-dev="clear">CLEAR OP</button><button class="btn danger" data-dev="reset">RESET SAVE</button></div></div>`:'';screen.innerHTML=`<div class="pixel-panel more-settings-v6"><div class="panel-title"><h2>MORE</h2><small>SETTINGS</small></div><div class="settings-list"><div class="setting"><b>SOUND</b><button class="mini-btn" id="toggle-sound-v6">${state.settings.sound?'ON':'OFF'}</button></div><div class="setting"><b>MUSIC</b><button class="mini-btn" id="toggle-music-v6">${state.settings.music?'ON':'OFF'}</button></div><div class="setting"><b>REDUCED MOTION</b><button class="mini-btn" id="toggle-motion-v6">${state.settings.reducedMotion?'ON':'OFF'}</button></div></div></div><div class="pixel-panel story-panel-v6"><div class="panel-title"><h3>STORY LOG</h3><small>CHAPTERS</small></div><div class="story-log-compact">${recent.length?recent.map(({s,n})=>`<button class="story-entry" data-story-replay-v6="${s.id}"><b>${escapeHtml(s.title)}</b><span class="story-chapter-num">${String(n).padStart(2,'0')}</span></button>`).join(''):'<div class="empty-state compact-empty">NO CHAPTERS YET</div>'}</div>${numbered.length>4?'<button class="btn ghost story-view-all" id="story-all-v6">ALL CHAPTERS</button>':''}</div>${tester}`;document.getElementById('toggle-sound-v6').onclick=()=>{state.settings.sound=!state.settings.sound;save();renderSettings();};document.getElementById('toggle-music-v6').onclick=()=>{state.settings.music=!state.settings.music;save();renderSettings();};document.getElementById('toggle-motion-v6').onclick=()=>{state.settings.reducedMotion=!state.settings.reducedMotion;save();renderSettings();};screen.querySelectorAll('[data-story-replay-v6]').forEach(b=>b.onclick=()=>{const s=findStoryById(b.dataset.storyReplayV6);if(s)enqueueStory(s,true);});screen.querySelectorAll('[data-dev]').forEach(b=>b.onclick=()=>devAction(b.dataset.dev));
  };

  state.uiHelpSeen.packs=true;state.uiHelpSeen.deck=true;state.uiHelpSeen.library=true;state.uiHelpSeen.syndicate=true;state.uiHelpSeen.hideout=true;state.uiHelpSeen.battle=true;state.uiHelpSeen.settings=true;save();render();
})();