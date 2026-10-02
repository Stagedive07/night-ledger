(() => {
  const CARD_ART = {
    't1-c01':'assets/card-art/ratknife.png',
    't1-c02':'assets/card-art/mira-voss.png',
    't1-c03':'assets/card-art/the-candleman.png',
    't1-c04':'assets/card-art/alley-surgeon.png'
  };
  const INFO = {
    momentum:{title:'Momentum',text:'Consecutive kills build Momentum for operatives that use it. The bonus fades if too much time passes between kills.'},
    resolve:{title:'Resolve',text:'Resolve is a lasting damage bonus earned through major progression. It affects your whole Operation Deck.'},
    whispers:{title:'Whispers',text:'Whispers are favors, introductions, and debts gathered by your Hideout. Spend them on Booster Packs.'},
    gold:{title:'Gold',text:'Gold trains your operatives. Spend it to level cards and raise their damage.'},
    intel:{title:'Intel',text:'Intel is recovered from Operations and used to rebuild the Hideout.'},
    syndicate:{title:'The Syndicate',text:'The Syndicate is where support operatives work outside the field. Their effects help your Hideout, resources, and recruitment.'},
    network:{title:'Hideout Network',text:'As the Hideout is rebuilt, old contacts begin working again. Their network gathers Whispers for you over time, even while you are away.'}
  };
  const TUTORIAL_COPY = {
    battle:'Operations are where your active operatives hunt targets. Assassinate to advance, or Bide Your Time when you need to build strength.',
    hideout:'Rebuild the Hideout with Intel. Each level strengthens the network and opens new opportunities.',
    packs:'Spend Whispers on Booster Packs. The card back hides every rarity until the card flips.',
    deck:'Your Operation Deck holds ten operatives. Higher deck tiers are favored first, then stronger DPS within the same tier.',
    library:'The Library contains only cards you have discovered. Search, filter, sort, inspect copies, and choose replacements here.',
    syndicate:'The Syndicate assigns support operatives who work outside Operations. Their passive effects remain active while assigned.',
    settings:'Use More to control sound and music, review story chapters, and revisit important information.'
  };
  let packPageV5 = 0;
  let libraryFilterV5 = 0;
  let librarySortV5 = 'rarity';
  let librarySearchV5 = '';
  let swapTargetUidV5 = null;
  let syndicatePickModeV5 = false;
  const copyIndexV5 = {};
  let audioCtxV5 = null;

  function migrateV5(){
    state.settings ||= {};
    if(typeof state.settings.sound !== 'boolean') state.settings.sound = true;
    if(typeof state.settings.music !== 'boolean') state.settings.music = false;
    state.uiHelpSeen ||= {};
    state.tutorial ||= {};
    save();
  }
  function renameBrandV5(){
    document.title = 'Like-Rogue';
    const b=document.querySelector('.brand-copy b'); if(b)b.textContent='LIKE-ROGUE';
    const s=document.querySelector('.brand-copy small'); if(s)s.textContent='THE VEIL REMEMBERS';
  }
  function playUISoundV5(kind='select'){
    if(!state?.settings?.sound) return;
    try{
      audioCtxV5 ||= new (window.AudioContext||window.webkitAudioContext)();
      if(audioCtxV5.state==='suspended') audioCtxV5.resume();
      const t=audioCtxV5.currentTime;
      if(kind==='flip'){
        const buffer=audioCtxV5.createBuffer(1,Math.floor(audioCtxV5.sampleRate*.09),audioCtxV5.sampleRate);
        const d=buffer.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*(1-i/d.length);
        const src=audioCtxV5.createBufferSource(); src.buffer=buffer;
        const filter=audioCtxV5.createBiquadFilter(); filter.type='bandpass';filter.frequency.value=1800;filter.Q.value=.7;
        const gain=audioCtxV5.createGain();gain.gain.setValueAtTime(.12,t);gain.gain.exponentialRampToValueAtTime(.001,t+.09);
        src.connect(filter).connect(gain).connect(audioCtxV5.destination);src.start(t);
      } else {
        const o=audioCtxV5.createOscillator(),g=audioCtxV5.createGain();o.type='square';o.frequency.setValueAtTime(kind==='place'?220:420,t);o.frequency.exponentialRampToValueAtTime(kind==='place'?120:260,t+.055);g.gain.setValueAtTime(kind==='place'?.08:.045,t);g.gain.exponentialRampToValueAtTime(.001,t+.06);o.connect(g).connect(audioCtxV5.destination);o.start(t);o.stop(t+.065);
      }
    }catch(e){}
  }
  window.playUISoundV5=playUISoundV5;

  function showInfoV5(keyOrTitle,text){
    const data=text?{title:keyOrTitle,text}:INFO[keyOrTitle]; if(!data)return;
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal info-modal"><div class="kicker">HOW IT WORKS</div><h2>${escapeHtml(data.title)}</h2><p>${escapeHtml(data.text)}</p><button class="btn primary" id="info-close" style="width:100%">GOT IT</button></div></div>`;
    document.getElementById('info-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }
  window.showInfoV5=showInfoV5;

  function maybeScreenIntroV5(){
    if(modalOpen||activeStory||state.uiHelpSeen?.[currentScreen])return;
    const copy=TUTORIAL_COPY[currentScreen]; if(!copy)return;
    state.uiHelpSeen[currentScreen]=true;save();
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal info-modal"><div class="kicker">NEW // ${escapeHtml(currentScreen.toUpperCase())}</div><h2>${currentScreen==='battle'?'OPERATIONS':escapeHtml(currentScreen.toUpperCase())}</h2><p>${escapeHtml(copy)}</p><button class="btn primary" id="intro-close" style="width:100%">CONTINUE</button></div></div>`;
    document.getElementById('intro-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};
  }

  gameCardMarkup = function(inst,opts={}){
    if(!inst)return'';
    const def=getDef(inst),td=GD.tierData(inst.tier),compact=!!opts.compact,showNew=opts.showNew??!!inst.isNew,showLevel=opts.showLevel??true;
    const hideLore=!!opts.hideLore,hideAbilityText=!!opts.hideAbilityText;
    const ability=def?.ability?`<div class="game-card-ability"><b>${escapeHtml(def.ability.name)}</b>${hideAbilityText?'':escapeHtml(def.ability.text)}</div>`:'';
    const lore=!hideLore&&def?.lore?`<div class="game-card-lore">${escapeHtml(def.lore)}</div>`:'';
    const artSrc=CARD_ART[def?.id];
    const art=artSrc?`<img src="${artSrc}" alt="${escapeHtml(def.name)}" draggable="false">`:'[ CARD ART TBD ]';
    return `<div class="game-card ${compact?'compact':''} ${hideLore?'no-lore':''} ${hideAbilityText?'no-ability-text':''} ${inst.holo?'holo':''}" style="border-color:${td.accent}">${inst.holo?'<span class="holo-tag">HOLO</span>':''}${showNew?'<span class="new-tag">NEW</span>':''}<div class="game-card-head"><div class="game-card-name">${escapeHtml(def.name)}</div><div class="game-card-deck" style="color:${td.accent}">${td.name.toUpperCase()} DECK</div></div><div class="game-card-art">${art}</div><div class="game-card-bottom">${ability}${lore}${showLevel?`<div class="game-card-level">LV ${inst.level}</div>`:''}<div class="game-card-dps">DPS ${GD.formatNum(GD.cardDps(inst))}</div></div></div>`;
  };

  const oldRender = render;
  render = function(){
    oldRender();
    document.body.classList.toggle('screen-scroll',currentScreen==='deck'||currentScreen==='library');
    document.body.classList.toggle('screen-fixed',currentScreen!=='deck'&&currentScreen!=='library');
    renameBrandV5();
    bindV5Global();
    setTimeout(maybeScreenIntroV5,0);
  };

  renderBattle = function(){
    if(!state.firstPackOpened){screen.innerHTML=`<div class="empty-state"><b>NO OPERATIVES READY</b><p>Open your first Street pack.</p><button class="btn primary" data-nav="packs">GO TO PACKS</button></div>`;bindCommonActions();return;}
    if(state.battle.paused){screen.innerHTML=`<div class="pixel-panel"><div class="battle-head"><div><div class="kicker">READY</div><div class="operation-title">OPERATION ${state.currentOperation}</div></div><div class="encounter-big">25 ENCOUNTERS</div></div><div class="empty-state"><b>YOUR OPERATIVES ARE READY</b><p>Begin when you are ready to follow the next lead.</p><button class="btn primary" id="begin-operation">BEGIN OPERATION</button></div></div>`;document.getElementById('begin-operation').onclick=()=>{playUISoundV5('place');beginOperation();};return;}
    if(!state.battle.enemy)spawnEnemy();
    const enemy=state.battle.enemy,op=state.currentOperation,enc=state.battle.encounter,hp=Math.max(0,enemy?.hp||0),max=enemy?.maxHp||1,pct=100*hp/max,dps=estimateDeckDps(!!enemy?.target,enemy?hp/max:1),timer=enemy?.target?Math.max(0,(enemy.deadline-now())/1000):null;
    const dots=Array.from({length:25},(_,i)=>{const n=i+1;let c=n<enc?'done':'';if(n===enc)c+=' current';if(n===25)c+=' target';return `<i class="${c}"></i>`}).join('');
    const lockedFinal=state.highestCleared>=100&&state.hideoutLevel<20;
    screen.innerHTML=`<div class="pixel-panel"><div class="battle-head"><div><div class="kicker">${state.battle.mode==='farm'?'BIDING YOUR TIME':'ASSASSINATING'}</div><div class="operation-title">OPERATION ${op}</div></div><div class="encounter-big">ENCOUNTER ${enc}/25</div></div><div class="encounter-dots">${dots}</div>${lockedFinal?`<div class="empty-state"><b>THE FINAL DOOR IS SEALED</b><p>Rebuild the Hideout completely.</p></div>`:`<div class="enemy-card ${enemy?.target?'target':''}"><div><div class="enemy-meta"><span>${enemy?.target?'TARGET':'ENEMY'}</span><span>${enemy?.target?'ESCAPING':'ENGAGED'}</span></div><div class="art-box">[ ENEMY ART TBD ]</div></div><div><div class="enemy-name">${escapeHtml(enemy?.name||'...')}</div><div class="meter ${enemy?.target?'':'blue'}"><i style="width:${pct}%"></i></div><div class="meter-label"><span>${GD.formatNum(hp)} HP</span><span>${GD.formatNum(max)} HP</span></div>${enemy?.target?`<div class="meter gold" style="margin-top:7px"><i style="width:${clamp(timer/30*100,0,100)}%"></i></div><div class="meter-label"><span>ESCAPE</span><span>${timer.toFixed(1)}s</span></div>`:''}</div></div>`}</div><div class="stats-grid operation-stats"><div class="stat"><small>Deck DPS</small><b>${GD.formatNum(dps)}</b></div><div class="stat"><small>Highest Clear</small><b>OP ${state.highestCleared}</b></div><button class="stat info-stat" data-info-v5="momentum"><small>Momentum</small><b>${state.battle.momentumStacks}/10</b></button><button class="stat info-stat" data-info-v5="resolve"><small>Resolve</small><b>+${Math.round((state.resolveBonus||0)*100)}%</b></button></div><div class="operation-actions"><button class="btn assassinate ${state.battle.mode==='push'?'selected':''}" data-battle-mode="push" ${lockedFinal?'disabled':''}>${state.battle.targetFailed?'RETRY TARGET':'ASSASSINATE'}</button><button class="btn bide ${state.battle.mode==='farm'?'selected':''}" data-battle-mode="farm" ${lockedFinal?'disabled':''}>BIDE YOUR TIME</button></div>`;
    screen.querySelectorAll('[data-battle-mode]').forEach(b=>b.onclick=()=>{playUISoundV5('select');setBattleMode(b.dataset.battleMode);});bindV5Global();
  };

  function hideoutSceneClass(level){return level>=18?'level-max':level>=10?'level-high':level>=4?'level-mid':'level-low';}
  renderHideout = function(){
    if(!state.unlocks.hideout){screen.innerHTML=`<div class="empty-state"><b>HIDEOUT NOT RECLAIMED</b><p>Clear Operation 1.</p></div>`;return;}
    const h=state.hideoutLevel,max=h>=20,next=h+1,b=state.hideoutBuild,req=max?0:GD.hideoutOperationReq(next),cost=max?0:GD.hideoutIntelCost(next),effectiveM=max?0:GD.hideoutBuildMinutes(next)*(1-effectTotals().architect),nextTier=!max?GD.TIERS.find(t=>t.unlock===next):null;
    screen.innerHTML=`<div class="hideout-room-v5 ${hideoutSceneClass(h)}"><div class="wall"></div><div class="floor"></div><div class="window"></div><div class="shelf"></div><div class="map"></div><div class="rack"></div><div class="table2"></div><div class="archive"></div><div class="desk"></div><div class="lantern"></div><div class="hideout-level-badge">HIDEOUT // LEVEL ${h}</div></div><div class="pixel-panel" style="margin-top:8px"><div class="panel-title"><h2>${max?'HIDEOUT COMPLETE':`REBUILD LEVEL ${next}`}</h2><small>${nextTier?`${nextTier.name.toUpperCase()} CONTACTS`:max?'MAX LEVEL':'EXPANSION'}</small></div>${max?`<div class="empty-state"><b>THE HIDEOUT IS FULLY REBUILT</b></div>`:b?renderBuildProgress(b):`<div class="requirements"><div class="req ${state.intel>=cost?'ok':'bad'}">INTEL<br><b>${GD.formatNum(cost)}</b></div><div class="req ${state.highestCleared>=req?'ok':'bad'}">CLEAR<br><b>OP ${req}</b></div></div><div class="stat"><small>Build Time</small><b>${GD.formatTime(effectiveM*60)}</b></div><button class="btn primary" id="hideout-upgrade" style="width:100%;margin-top:8px" ${state.intel<cost||state.highestCleared<req?'disabled':''}>BEGIN REBUILD</button>`}</div><button class="pixel-panel network-output-panel" data-info-v5="network" style="width:100%;text-align:left"><div class="panel-title"><h3>THE NETWORK</h3><small>TAP TO LEARN</small></div><div class="stat"><small>Whispers Gathered</small><b>${GD.formatNum(whisperRate())} / HOUR</b></div></button>`;
    const up=document.getElementById('hideout-upgrade');if(up)up.onclick=()=>{playUISoundV5('place');startHideoutUpgrade();};bindV5Global();
  };

  renderPacks = function(){
    const all=GD.TIERS,per=2,pages=Math.ceil(all.length/per);packPageV5=clamp(packPageV5,0,pages-1);const shown=all.slice(packPageV5*per,packPageV5*per+per),highest=GD.tierForHideout(state.hideoutLevel),e=effectTotals();
    const cards=shown.map(t=>{const locked=state.hideoutLevel<t.unlock,price=packCost(t.id),free=state.freeStreetPack&&t.id===1;const name=locked?'UNKNOWN PACK':`${t.name.toUpperCase()} DECK`;const accent=locked?'#515961':t.accent;return `<div class="pack-card-v5 ${locked?'locked':''}" style="color:${accent}"><div class="pack-mini"><div><b>${name}</b><small>${locked?'SEALED':'BOOSTER PACK'}</small></div></div><div>${locked?`<div class="pack-lock-copy">Its identity remains hidden until the Hideout reaches Level ${t.unlock}.</div>`:`<div class="pack-lock-copy">10 cards. At least one ${escapeHtml(t.name)} card.</div>`}<div class="pack-cost">${free?'FREE FIRST PACK':`${GD.formatNum(price)} WHISPERS`}</div><button class="btn ${!locked&&t.id===highest?'primary':''}" data-open-pack="${t.id}" ${locked?'disabled':''} style="width:100%;margin-top:8px">${free?'OPEN':'BUY'}</button></div></div>`}).join('');
    screen.innerHTML=`<div class="pixel-panel tight"><div class="panel-title"><h2 class="pack-title-v5">BOOSTER PACKS</h2><small>10 CARDS EACH</small></div><p class="tiny">Choose a pack. Rarity stays hidden until each card flips.</p></div><div class="pack-grid-v5">${cards}</div><div class="pack-pager"><button class="btn ghost" id="pack-prev" ${packPageV5===0?'disabled':''}>PREV</button><div class="pack-page">${packPageV5+1}/${pages}</div><button class="btn ghost" id="pack-next" ${packPageV5===pages-1?'disabled':''}>NEXT</button></div>`;
    document.getElementById('pack-prev').onclick=()=>{packPageV5--;renderPacks();};document.getElementById('pack-next').onclick=()=>{packPageV5++;renderPacks();};screen.querySelectorAll('[data-open-pack]').forEach(b=>b.onclick=()=>{playUISoundV5('place');openPack(Number(b.dataset.openPack),state.freeStreetPack&&Number(b.dataset.openPack)===1);});
  };

  showPackOpening = function(packTier,pack,price,done){
    modalOpen=true;const t=GD.tierData(packTier);
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal pack-modal"><div class="pack-stage" id="pack-stage"><div class="pack-rip" id="pack-rip"></div><div class="pack-cover" id="pack-cover" aria-label="Open ${escapeHtml(t.name)} pack"></div><div class="reveal-stack" id="reveal-stack"></div></div></div></div>`;
    const cover=document.getElementById('pack-cover');cover.onclick=()=>{if(cover.dataset.opening)return;playUISoundV5('flip');cover.dataset.opening='1';cover.classList.add('shake');setTimeout(()=>{cover.classList.remove('shake');cover.classList.add('opening');document.getElementById('pack-rip').classList.add('fly');setTimeout(()=>startReveal(packTier,pack,price,done),state.settings.reducedMotion?10:500)},state.settings.reducedMotion?10:500);};
  };
  startReveal = function(packTier,pack,price,done){
    const cover=document.getElementById('pack-cover');if(cover)cover.style.display='none';const stack=document.getElementById('reveal-stack');stack.classList.add('active');let index=0,faceUp=false;
    function cardFace(inst){return `<div class="reveal-face reveal-back"></div><div class="reveal-face reveal-front">${gameCardMarkup(inst,{showNew:inst.isNew,showLevel:false})}</div>`;}
    function draw(){if(index>=pack.length)return showSummary();stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;const maxVisible=Math.min(4,pack.length-index);for(let j=maxVisible-1;j>=0;j--){const inst=pack[index+j],el=document.createElement('div');el.className=`reveal-card ${inst.holo?'holo':''}`;el.style.zIndex=10-j;const poses=['translate(0,0) rotate(0deg) scale(1)','translate(13px,17px) rotate(2deg) scale(.96)','translate(-12px,28px) rotate(-2.5deg) scale(.92)','translate(18px,39px) rotate(3deg) scale(.88)'];el.style.transform=poses[j];el.innerHTML=`<div class="flip-inner ${j===0&&faceUp?'faceup':''}">${cardFace(inst)}</div>`;if(j===0)el.onclick=()=>{if(!faceUp){faceUp=true;playUISoundV5('flip');el.querySelector('.flip-inner').classList.add('faceup');return;}playUISoundV5('select');el.onclick=null;if(state.settings.reducedMotion){index++;faceUp=false;draw();}else{el.classList.add(['swipe-r0','swipe-r1','swipe-r2','swipe-r3'][index%4]);setTimeout(()=>{index++;faceUp=false;draw();},320);}};stack.appendChild(el);}const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent=faceUp?'TAP FOR NEXT CARD':'TAP TO FLIP';stack.appendChild(hint);}
    function showSummary(){const rows=pack.map(c=>gameCardMarkup(c,{compact:false,showNew:c.isNew,showLevel:false})).join('');stack.innerHTML=`<div class="pack-summary"><div class="kicker">PACK COMPLETE</div><h2>${GD.tierData(packTier).name.toUpperCase()} DECK</h2><div class="summary-grid">${rows}</div><button class="btn primary" id="pack-done" style="width:100%;margin-top:14px">DONE</button></div>`;document.getElementById('pack-done').onclick=()=>{playUISoundV5('place');modalRoot.innerHTML='';modalOpen=false;done();};}
    draw();
  };

  function sortedDeckV5(){return deckInstances().slice().sort((a,b)=>b.tier-a.tier||GD.cardDps(b)-GD.cardDps(a));}
  function deckCardV5(inst){const cost=inst.level<GD.CARD_LEVEL_CAP?GD.cardLevelCost(inst.tier,inst.level):0;return `<div class="deck-slot-v5" data-long-card="${inst.uid}"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button><button class="deck-level-btn" data-deck-level="${inst.uid}" ${state.gold<cost||inst.level>=GD.CARD_LEVEL_CAP?'disabled':''}>${inst.level>=GD.CARD_LEVEL_CAP?'MAX LEVEL':`LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`}</button></div>`;}
  renderDeck = function(){
    const d=sortedDeckV5(),rows=[d.slice(0,1),d.slice(1,3),d.slice(3,6),d.slice(6,10)];
    screen.innerHTML=`<div class="pixel-panel tight"><div class="panel-title"><h2>OPERATION DECK</h2><small>${d.length}/10 ACTIVE</small></div><p class="deck-help">Tap a card to inspect it. Hold a card to choose a replacement from the Library.</p></div><div class="deck-pyramid">${rows.map((r,i)=>`<div class="deck-pyramid-row count-${i+1}">${r.map(deckCardV5).join('')}</div>`).join('')}</div>`;
    bindCommonActions();bindLongPressSwapV5();
  };
  function bindLongPressSwapV5(){
    screen.querySelectorAll('[data-long-card]').forEach(el=>{let timer=null,startX=0,startY=0;const begin=e=>{const p=e.touches?.[0]||e;startX=p.clientX;startY=p.clientY;timer=setTimeout(()=>{timer=null;playUISoundV5('place');openSwapLibraryV5(el.dataset.longCard);},550);};const end=()=>{if(timer){clearTimeout(timer);timer=null;}};el.addEventListener('touchstart',begin,{passive:true});el.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.abs(p.clientX-startX)>12||Math.abs(p.clientY-startY)>12)end();},{passive:true});el.addEventListener('touchend',end);el.addEventListener('mousedown',begin);el.addEventListener('mouseup',end);el.addEventListener('mouseleave',end);el.addEventListener('contextmenu',e=>{e.preventDefault();openSwapLibraryV5(el.dataset.longCard);});});
  }
  function openSwapLibraryV5(uid){swapTargetUidV5=uid;syndicatePickModeV5=false;currentScreen='library';save();render();}
  function openSyndicateLibraryV5(){swapTargetUidV5=null;syndicatePickModeV5=true;currentScreen='library';save();render();}

  renderLibrary = function(){
    const unlocked=GD.TIERS.filter(t=>state.hideoutLevel>=t.unlock);if(libraryFilterV5&&!unlocked.some(t=>t.id===libraryFilterV5))libraryFilterV5=0;
    const filters=[`<button class="filter-btn ${libraryFilterV5===0?'on':''}" data-lib-filter="0">ALL</button>`].concat(unlocked.map(t=>`<button class="filter-btn ${libraryFilterV5===t.id?'on':''}" data-lib-filter="${t.id}">${t.name}</button>`)).join('');
    let defs=GD.CARDS.filter(def=>state.discovered.includes(def.id)).filter(def=>!libraryFilterV5||def.tier===libraryFilterV5).filter(def=>!librarySearchV5||def.name.toLowerCase().includes(librarySearchV5.toLowerCase()));
    if(swapTargetUidV5)defs=defs.filter(def=>isOperationDef(def));if(syndicatePickModeV5)defs=defs.filter(def=>isSyndicateDef(def));
    defs.sort((a,b)=>{const ac=state.inventory.filter(c=>c.defId===a.id),bc=state.inventory.filter(c=>c.defId===b.id),ad=Math.max(0,...ac.map(GD.cardDps)),bd=Math.max(0,...bc.map(GD.cardDps));if(librarySortV5==='dps')return bd-ad||b.tier-a.tier;if(librarySortV5==='name')return a.name.localeCompare(b.name);return b.tier-a.tier||bd-ad;});
    const tiles=defs.map(def=>{const copies=state.inventory.filter(c=>c.defId===def.id).sort((a,b)=>GD.cardDps(b)-GD.cardDps(a));if(!copies.length)return'';const idx=clamp(copyIndexV5[def.id]||0,0,copies.length-1);copyIndexV5[def.id]=idx;const inst=copies[idx];return `<div class="library-card-shell" data-lib-shell="${def.id}">${copies.length>1?`<div class="copy-indicator">${idx+1}/${copies.length}</div>`:''}<button class="collection-card-wrap" data-lib-card="${def.id}" data-lib-copy="${inst.uid}">${gameCardMarkup(inst,{compact:false,showNew:false})}</button></div>`;}).join('');
    const mode=swapTargetUidV5?`<div class="swap-banner">Choose a replacement card. Tap a card to swap it into your Operation Deck.</div>`:syndicatePickModeV5?`<div class="swap-banner">Choose a support operative for the Syndicate.</div>`:'';
    screen.innerHTML=`${mode}<div class="pixel-panel tight"><div class="panel-title"><h2>LIBRARY</h2><small>${defs.length} DISCOVERED</small></div><div class="library-toolbar"><input id="lib-search" placeholder="Search cards" value="${escapeHtml(librarySearchV5)}"><select id="lib-sort"><option value="rarity" ${librarySortV5==='rarity'?'selected':''}>Rarity + DPS</option><option value="dps" ${librarySortV5==='dps'?'selected':''}>DPS</option><option value="name" ${librarySortV5==='name'?'selected':''}>Name</option></select></div><div class="filter-row">${filters}</div></div><div class="card-grid">${tiles||'<div class="library-empty">No matching cards.</div>'}</div>`;
    document.getElementById('lib-search').oninput=e=>{librarySearchV5=e.target.value;renderLibrary();};document.getElementById('lib-sort').onchange=e=>{librarySortV5=e.target.value;renderLibrary();};screen.querySelectorAll('[data-lib-filter]').forEach(b=>b.onclick=()=>{libraryFilterV5=Number(b.dataset.libFilter);renderLibrary();});
    bindLibraryCardsV5();
  };
  function bindLibraryCardsV5(){
    screen.querySelectorAll('[data-lib-shell]').forEach(shell=>{let x=0,y=0;const id=shell.dataset.libShell;shell.addEventListener('touchstart',e=>{x=e.touches[0].clientX;y=e.touches[0].clientY;},{passive:true});shell.addEventListener('touchend',e=>{const p=e.changedTouches[0],dx=p.clientX-x,dy=p.clientY-y;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)){const copies=state.inventory.filter(c=>c.defId===id).sort((a,b)=>GD.cardDps(b)-GD.cardDps(a));if(copies.length>1){copyIndexV5[id]=(copyIndexV5[id]||0)+(dx<0?1:-1);if(copyIndexV5[id]<0)copyIndexV5[id]=copies.length-1;if(copyIndexV5[id]>=copies.length)copyIndexV5[id]=0;playUISoundV5('flip');renderLibrary();}}},{passive:true});});
    screen.querySelectorAll('[data-lib-card]').forEach(b=>b.onclick=()=>{const uid=b.dataset.libCopy;if(swapTargetUidV5){swapDeckCardV5(uid);return;}if(syndicatePickModeV5){assignSyndicateFromLibraryV5(uid);return;}playUISoundV5('select');showCardDetail(uid);});
  }
  function swapDeckCardV5(newUid){const idx=state.deck.indexOf(swapTargetUidV5);if(idx<0)return;const existing=state.deck.indexOf(newUid);if(existing>=0){[state.deck[idx],state.deck[existing]]=[state.deck[existing],state.deck[idx]];}else state.deck[idx]=newUid;swapTargetUidV5=null;playUISoundV5('place');save();currentScreen='deck';render();toast('Operation Deck updated.');}
  function assignSyndicateFromLibraryV5(uid){const slots=GD.syndicateSlots(state.hideoutLevel);if(state.syndicate.includes(uid)){toast('Already assigned to Syndicate.');return;}if(state.syndicate.length>=slots)state.syndicate.shift();state.deck=state.deck.filter(x=>x!==uid);state.syndicate.push(uid);syndicatePickModeV5=false;playUISoundV5('place');save();currentScreen='syndicate';render();}

  renderSyndicate = function(){
    if(!state.unlocks.syndicate){screen.innerHTML=`<div class="empty-state"><b>SYNDICATE LOCKED</b><p>Continue rebuilding the Hideout.</p></div>`;return;}
    const slotsN=GD.syndicateSlots(state.hideoutLevel),active=syndicateInstances(),slots=Array.from({length:slotsN},(_,i)=>{const inst=active[i];return inst?`<div class="syndicate-slot-v5" data-syndicate-card="${inst.uid}"><button class="deck-card-tap" data-card-detail="${inst.uid}">${gameCardMarkup(inst,{compact:true,showNew:false,hideLore:true,hideAbilityText:true})}</button></div>`:`<div class="syndicate-slot-v5 empty">EMPTY</div>`;}).join(''),e=effectTotals();
    screen.innerHTML=`<div class="pixel-panel tight"><div class="panel-title"><h2>SYNDICATE</h2><small>${active.length}/${slotsN} ACTIVE</small></div><p class="syndicate-intro">Support operatives work from the Hideout instead of joining Operations. Hold an assigned card to read what its support effect does.</p><div class="syndicate-grid-v5">${slots}</div><div class="syndicate-actions"><button class="btn primary" id="syn-manage">CHOOSE OPERATIVE</button><button class="btn ghost" data-info-v5="syndicate">HOW IT WORKS</button></div></div><div class="stats-grid"><div class="stat"><small>Build Speed</small><b>-${Math.round(e.architect*100)}%</b></div><div class="stat"><small>Pack Cost</small><b>-${Math.round(e.broker*100)}%</b></div><div class="stat"><small>Card Quality</small><b>+${Math.round(e.appraiser*100)}%</b></div><div class="stat"><small>Sale Return</small><b>+${Math.round(e.salvager*100)}%</b></div></div>`;
    document.getElementById('syn-manage').onclick=()=>{playUISoundV5('select');openSyndicateLibraryV5();};bindCommonActions();bindSyndicateLongV5();bindV5Global();
  };
  function bindSyndicateLongV5(){screen.querySelectorAll('[data-syndicate-card]').forEach(el=>{let timer;const run=()=>{const inst=getInstance(el.dataset.syndicateCard),a=getDef(inst)?.ability;if(a)showInfoV5(a.name,a.text);};el.addEventListener('touchstart',()=>{timer=setTimeout(run,550);},{passive:true});el.addEventListener('touchend',()=>clearTimeout(timer));el.addEventListener('touchmove',()=>clearTimeout(timer),{passive:true});el.addEventListener('contextmenu',e=>{e.preventDefault();run();});});}

  renderSettings = function(){
    const narrative=state.storySeen.map(id=>findStoryById(id)).filter(Boolean).filter(s=>!s.id.startsWith('sys_'));const numbered=narrative.map((s,i)=>({s,n:i+1}));const recent=numbered.slice(-4);const tester=TESTER_MODE?`<div class="pixel-panel"><div class="panel-title"><h3>TESTER</h3></div><div class="dev-grid"><button class="btn ghost" data-dev="gold">+1M GOLD</button><button class="btn ghost" data-dev="intel">+1M INTEL</button><button class="btn ghost" data-dev="whispers">+1M WHISPERS</button><button class="btn ghost" data-dev="build">FINISH BUILD</button><button class="btn ghost" data-dev="kill">KILL ENEMY</button><button class="btn ghost" data-dev="clear">CLEAR OP</button><button class="btn danger" data-dev="reset">RESET SAVE</button></div></div>`:'';
    screen.innerHTML=`<div class="pixel-panel"><div class="panel-title"><h2 class="more-title">MORE</h2><small>SETTINGS</small></div><div class="settings-list"><div class="setting"><div><b>SOUND</b><div class="tiny">Card flips, selections, and deck movement.</div></div><button class="mini-btn" id="toggle-sound">${state.settings.sound?'ON':'OFF'}</button></div><div class="setting"><div><b>MUSIC</b><div class="tiny">Music is reserved for a later audio pass.</div></div><button class="mini-btn" id="toggle-music">${state.settings.music?'ON':'OFF'}</button></div><div class="setting"><div><b>REDUCED MOTION</b><div class="tiny">Shortens pack and card transitions.</div></div><button class="mini-btn" id="toggle-motion">${state.settings.reducedMotion?'ON':'OFF'}</button></div></div></div><div class="pixel-panel"><div class="panel-title"><h3>STORY LOG</h3><small>CHAPTERS</small></div><div class="story-log-compact">${recent.length?recent.map(({s,n})=>`<button class="story-entry" data-story-replay="${s.id}"><b>CHAPTER ${String(n).padStart(2,'0')} · ${escapeHtml(s.title)}</b><span class="story-chapter-num">${String(n).padStart(2,'0')}</span></button>`).join(''):'<div class="empty-state">NO CHAPTERS YET</div>'}</div>${numbered.length>4?'<button class="btn ghost story-view-all" id="story-all">VIEW ALL CHAPTERS</button>':''}</div>${tester}`;
    document.getElementById('toggle-sound').onclick=()=>{state.settings.sound=!state.settings.sound;save();if(state.settings.sound)playUISoundV5('select');renderSettings();};document.getElementById('toggle-music').onclick=()=>{state.settings.music=!state.settings.music;save();renderSettings();};document.getElementById('toggle-motion').onclick=()=>{state.settings.reducedMotion=!state.settings.reducedMotion;save();renderSettings();};screen.querySelectorAll('[data-story-replay]').forEach(b=>b.onclick=()=>{const s=findStoryById(b.dataset.storyReplay);if(s)enqueueStory(s,true);});screen.querySelectorAll('[data-dev]').forEach(b=>b.onclick=()=>devAction(b.dataset.dev));const all=document.getElementById('story-all');if(all)all.onclick=()=>showAllStoriesV5(numbered);
  };
  function showAllStoriesV5(numbered){modalOpen=true;modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="panel-title"><h2>STORY CHAPTERS</h2><small>${numbered.length}</small></div><div class="story-log" style="max-height:62dvh;overflow:auto">${numbered.map(({s,n})=>`<button class="story-entry" data-full-story="${s.id}"><b>CHAPTER ${String(n).padStart(2,'0')} · ${escapeHtml(s.title)}</b><span class="story-chapter-num">${String(n).padStart(2,'0')}</span></button>`).join('')}</div><button class="btn primary" id="story-all-close" style="width:100%;margin-top:8px">CLOSE</button></div></div>`;document.getElementById('story-all-close').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;render();};modalRoot.querySelectorAll('[data-full-story]').forEach(b=>b.onclick=()=>{modalRoot.innerHTML='';modalOpen=false;const s=findStoryById(b.dataset.fullStory);if(s)enqueueStory(s,true);});}

  function bindV5Global(){
    document.querySelectorAll('[data-info-v5]').forEach(el=>el.onclick=e=>{e.preventDefault();e.stopPropagation();playUISoundV5('select');showInfoV5(el.dataset.infoV5);});
    const chips=[...document.querySelectorAll('.resource-chip')];chips.forEach(ch=>{const k=ch.querySelector('span')?.textContent==='G'?'gold':ch.querySelector('span')?.textContent==='I'?'intel':'whispers';ch.onclick=()=>showInfoV5(k);});
    document.querySelectorAll('[data-card-detail]').forEach(b=>{b.onclick=()=>{playUISoundV5('select');showCardDetail(b.dataset.cardDetail);};});
    document.querySelectorAll('[data-deck-level]').forEach(b=>{b.onclick=e=>{e.stopPropagation();playUISoundV5('select');levelCard(b.dataset.deckLevel,1);};});
  }

  updateHideoutTimerOnly = function(){if(!state.hideoutBuild)return;const b=state.hideoutBuild,rem=Math.max(0,b.endsAt-now()),total=Math.max(1,b.endsAt-b.startedAt),p=clamp(100*(1-rem/total),0,100),el=document.getElementById('build-time-left');if(el)el.textContent=GD.formatTime(rem/1000);const fill=document.getElementById('build-progress-fill');if(fill)fill.style.width=`${p}%`;};

  const oldUnlockIntel = unlockIntelAndHideout;
  unlockIntelAndHideout = function(){const before=state.unlocks.hideout;oldUnlockIntel();if(!before&&state.unlocks.hideout)state.uiHelpSeen.hideout=false;};
  const oldCompleteHideout = completeHideoutIfReady;
  completeHideoutIfReady = function(force=false){const prev=state.hideoutLevel;oldCompleteHideout(force);if(prev<3&&state.hideoutLevel>=3){state.uiHelpSeen.syndicate=false;save();}};

  migrateV5();renameBrandV5();render();
})();
