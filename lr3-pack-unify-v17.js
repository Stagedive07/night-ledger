(() => {
  const BUILD='LR3.18';
  const BACK='assets/card-art/street-deck-back.webp?v=LR3.18';
  const playSfx=kind=>window.LR2PackV16?.playSfx?.(kind);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  if(window.LRV6)window.LRV6.BACK=BACK;

  function animate(el,keyframes,options){
    if(!el||state?.settings?.reducedMotion)return Promise.resolve();
    try{
      const a=el.animate(keyframes,options);
      return a.finished.catch(()=>{});
    }catch(_){return wait(options?.duration||0);}
  }

  window.startReveal=function(packTier,pack,price,done){
    document.getElementById('pack-cover')?.style.setProperty('display','none');
    const stack=document.getElementById('reveal-stack');if(!stack)return;
    stack.className='reveal-stack active lr318-reveal-stack';
    let index=0,faceUp=false,busy=false,dragging=false,dragX=0,dragY=0,startX=0,startY=0,pointerId=null;

    function equipPackCard(uid){
      const inst=getInstance(uid),def=getDef(inst);if(!inst||!def)return;
      if(isOperationDef(def)){
        if(state.deck.includes(uid))return;
        state.syndicate=state.syndicate.filter(x=>x!==uid);
        if(state.deck.length<10)state.deck.push(uid);
        else{let low=0;for(let i=1;i<state.deck.length;i++){const a=getInstance(state.deck[i]),b=getInstance(state.deck[low]);if(a&&b&&GD.cardDps(a)<GD.cardDps(b))low=i;}state.deck[low]=uid;}
      }else{
        if(!state.unlocks.syndicate){toast('The Syndicate has not been restored yet.');return;}
        const slots=GD.syndicateSlots(state.hideoutLevel);if(state.syndicate.includes(uid))return;
        state.deck=state.deck.filter(x=>x!==uid);if(state.syndicate.length>=slots)state.syndicate.shift();state.syndicate.push(uid);
      }
      playSfx('flipDown');save();renderSummary(false);
    }

    function deltaHtml(c){
      if(!isOperationDef(getDef(c)))return '<div class="pack-delta neutral">SYNDICATE</div>';
      if(state.deck.includes(c.uid))return '<div class="pack-delta neutral">EQUIPPED</div>';
      const deck=deckInstances();let delta;
      if(deck.length<10)delta=GD.cardDps(c);
      else{const low=deck.reduce((m,x)=>!m||GD.cardDps(x)<GD.cardDps(m)?x:m,null);delta=GD.cardDps(c)-GD.cardDps(low);}
      const cls=delta>0?'positive':delta<0?'negative':'neutral',sign=delta>0?'+':'';
      return `<div class="pack-delta ${cls}">${sign}${GD.formatNum(delta)} DPS</div>`;
    }

    function renderSummary(withSound=true){
      if(withSound)playSfx('stack');
      const rows=pack.map((c,i)=>`<div class="pack-summary-card-v6 lr2-summary-card" style="--summary-i:${i}">${gameCardMarkup(c,{compact:true,showNew:c.isNew,showLevel:false})}${deltaHtml(c)}<button class="mini-btn pack-equip-v6" data-equip-v6="${c.uid}">${isOperationDef(getDef(c))?(state.deck.includes(c.uid)?'EQUIPPED':'EQUIP'):(state.syndicate.includes(c.uid)?'ASSIGNED':'ASSIGN')}</button></div>`).join('');
      stack.innerHTML=`<div class="pack-summary pack-summary-v6 ${withSound?'lr2-stack-in':''}"><div class="kicker">PACK COMPLETE</div><h2>${GD.tierData(packTier).name.toUpperCase()} DECK</h2><div class="summary-grid summary-grid-v6">${rows}</div><button class="btn primary" id="done-v6" style="width:100%;margin-top:10px">DONE</button></div>`;
      window.LR3HoloVariants?.scan?.(stack);window.LR2SimeyCard?.scan?.(stack);
      stack.querySelectorAll('[data-equip-v6]').forEach(b=>b.onclick=()=>equipPackCard(b.dataset.equipV6));
      document.getElementById('done-v6').onclick=()=>{modalRoot.innerHTML='';modalOpen=false;done();};
    }

    function resetDrag(card){
      dragX=dragY=0;dragging=false;pointerId=null;
      if(!card)return;
      card.classList.remove('lr318-dragging');
      card.style.setProperty('--lr318-drag-x','0px');
      card.style.setProperty('--lr318-drag-y','0px');
      card.style.setProperty('--lr318-drag-r','0deg');
    }

    async function flipToFront(card,surface,inst){
      busy=true;playSfx('flipUp');card.classList.add('lr318-flipping');
      if(!state.settings.reducedMotion){
        await animate(surface,[
          {transform:'perspective(760px) rotateY(0deg) translateY(0) scale(1)'},
          {transform:'perspective(760px) rotateY(88deg) translateY(-9px) scale(1.035)'}
        ],{duration:155,easing:'cubic-bezier(.3,.05,.7,.45)',fill:'forwards'});
      }
      surface.className='lr318-surface lr318-front-surface';
      surface.innerHTML=gameCardMarkup(inst,{showNew:inst.isNew,showLevel:false});
      window.LR3HoloVariants?.scan?.(surface);window.LR2SimeyCard?.scan?.(surface);
      if(!state.settings.reducedMotion){
        await animate(surface,[
          {transform:'perspective(760px) rotateY(-88deg) translateY(-9px) scale(1.035)'},
          {transform:'perspective(760px) rotateY(5deg) translateY(-2px) scale(1.012)',offset:.78},
          {transform:'perspective(760px) rotateY(0deg) translateY(0) scale(1)'}
        ],{duration:225,easing:'cubic-bezier(.18,.72,.2,1)',fill:'forwards'});
      }
      surface.style.transform='none';card.classList.remove('lr318-flipping');faceUp=true;busy=false;
      const hint=stack.querySelector('.reveal-hint');if(hint)hint.textContent='SWIPE RIGHT OR TAP FOR NEXT CARD';
    }

    async function advance(card){
      if(busy||!faceUp)return;
      busy=true;playSfx('flipDown');card.classList.add('lr318-sorting');
      const fromX=Math.max(0,dragX);
      await animate(card,[
        {transform:`translate(calc(-50% + ${fromX}px),-50%) rotate(${Math.min(9,fromX/20)}deg)`,opacity:1},
        {transform:'translate(calc(-50% + 110vw),calc(-50% - 16px)) rotate(14deg)',opacity:0}
      ],{duration:state.settings.reducedMotion?30:245,easing:'cubic-bezier(.2,.76,.25,1)',fill:'forwards'});
      index++;draw();
    }

    function bindActiveCard(card,surface,inst){
      card.addEventListener('pointerdown',e=>{
        if(busy)return;
        pointerId=e.pointerId;startX=e.clientX;startY=e.clientY;dragX=dragY=0;dragging=false;
        try{card.setPointerCapture(pointerId);}catch(_){}
      });
      card.addEventListener('pointermove',e=>{
        if(e.pointerId!==pointerId||busy)return;
        dragX=e.clientX-startX;dragY=e.clientY-startY;
        if(Math.hypot(dragX,dragY)>8)dragging=true;
        if(faceUp&&dragX>0&&Math.abs(dragX)>Math.abs(dragY)){
          e.preventDefault();
          card.classList.add('lr318-dragging');
          card.style.setProperty('--lr318-drag-x',`${Math.min(dragX,170)}px`);
          card.style.setProperty('--lr318-drag-y',`${Math.max(-18,Math.min(18,dragY*.15))}px`);
          card.style.setProperty('--lr318-drag-r',`${Math.min(9,dragX/20)}deg`);
        }
      },{passive:false});
      card.addEventListener('pointerup',async e=>{
        if(e.pointerId!==pointerId)return;
        const shouldSwipe=faceUp&&dragX>=58&&Math.abs(dragX)>Math.abs(dragY)*1.08;
        try{card.releasePointerCapture(pointerId);}catch(_){}
        if(shouldSwipe){await advance(card);return;}
        const wasDragging=dragging;resetDrag(card);
        if(wasDragging)return;
        if(!faceUp)await flipToFront(card,surface,inst);else await advance(card);
      });
      card.addEventListener('pointercancel',()=>resetDrag(card));
      card.addEventListener('contextmenu',e=>e.preventDefault());
    }

    function draw(){
      if(index>=pack.length){renderSummary(true);return;}
      faceUp=false;busy=false;dragging=false;dragX=dragY=0;pointerId=null;
      stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;

      const remaining=Math.min(4,pack.length-index);
      for(let depth=remaining-1;depth>=1;depth--){
        const shell=document.createElement('div');
        shell.className='lr318-stack-back';shell.dataset.depth=String(depth);
        shell.innerHTML=`<img src="${BACK}" alt="" draggable="false">`;stack.appendChild(shell);
      }

      const inst=pack[index];
      const card=document.createElement('div');card.className='lr318-card';
      const surface=document.createElement('div');surface.className='lr318-surface lr318-back-surface';
      surface.innerHTML=`<img src="${BACK}" alt="" draggable="false">`;
      card.appendChild(surface);stack.appendChild(card);bindActiveCard(card,surface,inst);

      const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent='TAP TO FLIP';stack.appendChild(hint);
    }
    draw();
  };

  window.LR3PackUnify={build:BUILD,back:BACK};
})();
