(() => {
  const BUILD='LR3.17';
  const playSfx=kind=>window.LR2PackV16?.playSfx?.(kind);
  const wait=ms=>new Promise(r=>setTimeout(r,ms));

  window.startReveal=function(packTier,pack,price,done){
    document.getElementById('pack-cover')?.style.setProperty('display','none');
    const stack=document.getElementById('reveal-stack');if(!stack)return;
    stack.className='reveal-stack active lr2-reveal-stack lr317-reveal-stack';
    let index=0,faceUp=false,busy=false;
    const back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';

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
      document.getElementById('done-v6').onclick=()=>{playSfx('flipDown');modalRoot.innerHTML='';modalOpen=false;done();};
    }

    function draw(){
      if(index>=pack.length){renderSummary(true);return;}
      faceUp=false;busy=false;
      stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;

      /* Only the active card gets full card markup/effects. The three cards behind
         it are back-image shells, avoiding 4x holo DOM/paint work per reveal. */
      const remaining=Math.min(4,pack.length-index);
      for(let depth=remaining-1;depth>=1;depth--){
        const shell=document.createElement('div');
        shell.className='reveal-card lr317-back-card';shell.dataset.depth=String(depth);
        shell.innerHTML=`<img src="${back}" alt="" draggable="false">`;stack.appendChild(shell);
      }

      const inst=pack[index],el=document.createElement('div');
      el.className=`reveal-card lr317-reveal-card${inst.holo?' contains-holo':''}`;
      el.innerHTML=`<div class="lr317-flipper"><div class="lr317-face lr317-back"><img src="${back}" alt="" draggable="false"></div><div class="lr317-face lr317-front">${gameCardMarkup(inst,{showNew:inst.isNew,showLevel:false})}</div></div>`;
      stack.appendChild(el);
      window.LR3HoloVariants?.scan?.(el);window.LR2SimeyCard?.scan?.(el);

      let pointerStart=null,moved=false;
      el.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY};moved=false;},{passive:true});
      el.addEventListener('pointermove',e=>{if(!pointerStart)return;if(Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>7)moved=true;},{passive:true});
      const endPointer=()=>{pointerStart=null;};el.addEventListener('pointerup',endPointer,{passive:true});el.addEventListener('pointercancel',endPointer,{passive:true});

      el.onclick=async()=>{
        if(busy)return;
        if(moved){moved=false;return;}
        if(!faceUp){
          busy=true;faceUp=true;playSfx('flipUp');el.classList.add('face-up');
          await wait(state.settings.reducedMotion?35:430);
          busy=false;
          const hint=stack.querySelector('.reveal-hint');if(hint)hint.textContent='TAP FOR NEXT CARD';
        }else{
          busy=true;playSfx('flipDown');el.classList.add('sorting-out');
          await wait(state.settings.reducedMotion?35:275);index++;draw();
        }
      };

      const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent='TAP TO FLIP';stack.appendChild(hint);
    }
    draw();
  };

  window.LR3PackUnify={build:BUILD};
})();
