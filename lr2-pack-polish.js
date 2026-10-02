(() => {
  const SFX = {
    flipUp: 'assets/audio/card-flip-single-up.ogg',
    flipDown: 'assets/audio/card-flip-single-down.ogg',
    stack: 'assets/audio/card-flip-10-stack.ogg',
    packOpen: 'assets/audio/full-pack-opening.ogg',
    coin: 'assets/audio/coin.ogg'
  };
  const cache = new Map();

  function volume(){
    if(typeof state?.settings?.soundVolume === 'number') return clamp(state.settings.soundVolume,0,1);
    return state?.settings?.sound ? .7 : 0;
  }
  function play(kind){
    const v=volume(),src=SFX[kind];
    if(v<=0||!src)return;
    try{
      let base=cache.get(src);
      if(!base){base=new Audio(src);base.preload='auto';cache.set(src,base);}
      const a=base.cloneNode();
      a.volume=v;
      a.play().catch(()=>{});
    }catch(e){}
  }
  window.lr2PlayExactSfx=play;

  // Keep older UI callers working while routing every sound to the supplied files.
  window.playUISoundV5=function(kind='select'){
    if(kind==='flip')return play('flipUp');
    if(kind==='flipDown')return play('flipDown');
    if(kind==='coin')return play('coin');
    if(kind==='packOpen')return play('packOpen');
    if(kind==='stack')return play('stack');
    return play('flipDown');
  };

  function bindHolo(root=document){
    root.querySelectorAll?.('.game-card.holo').forEach(card=>{
      if(card.dataset.lr2FoilBound)return;
      card.dataset.lr2FoilBound='1';
      const move=e=>{
        const r=card.getBoundingClientRect(),p=e.touches?.[0]||e;
        const x=clamp(((p.clientX-r.left)/r.width)*100,0,100);
        const y=clamp(((p.clientY-r.top)/r.height)*100,0,100);
        card.style.setProperty('--mx',`${x}%`);
        card.style.setProperty('--my',`${y}%`);
        card.style.setProperty('--rx',`${((y-50)/16).toFixed(2)}deg`);
        card.style.setProperty('--ry',`${((50-x)/13).toFixed(2)}deg`);
      };
      const reset=()=>{
        card.style.setProperty('--mx','50%');card.style.setProperty('--my','50%');
        card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');
      };
      card.addEventListener('pointermove',move,{passive:true});
      card.addEventListener('touchmove',move,{passive:true});
      card.addEventListener('pointerleave',reset,{passive:true});
      card.addEventListener('touchend',reset,{passive:true});
    });
  }

  showPackOpening=function(packTier,pack,price,done){
    modalOpen=true;
    const t=GD.tierData(packTier),back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal pack-modal"><div class="pack-stage" id="pack-stage"><div class="pack-rip" id="pack-rip"></div><button class="pack-cover pack-cover-v6" id="pack-cover" aria-label="Open ${escapeHtml(t.name)} pack"><img src="${back}" alt="" draggable="false"></button><div class="reveal-stack" id="reveal-stack"></div></div></div></div>`;
    const cover=document.getElementById('pack-cover');
    cover.onclick=()=>{
      if(cover.dataset.opening)return;
      cover.dataset.opening='1';
      // Full Pack opening long.ogg belongs to the pack-opening animation itself.
      play('packOpen');
      cover.classList.add('shake','lr2-pack-opening');
      setTimeout(()=>{
        cover.classList.remove('shake');cover.classList.add('opening','lr2-pack-rip-away');
        document.getElementById('pack-rip')?.classList.add('fly');
        setTimeout(()=>startReveal(packTier,pack,price,done),state.settings.reducedMotion?10:760);
      },state.settings.reducedMotion?10:440);
    };
  };

  startReveal=function(packTier,pack,price,done){
    document.getElementById('pack-cover')?.style.setProperty('display','none');
    const stack=document.getElementById('reveal-stack');if(!stack)return;
    stack.classList.add('active','lr2-reveal-stack');
    let index=0,faceUp=false,busy=false;
    const back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
    const face=inst=>`<div class="reveal-face reveal-back"><img src="${back}" alt="" draggable="false"></div><div class="reveal-face reveal-front">${gameCardMarkup(inst,{showNew:inst.isNew,showLevel:false})}</div>`;

    function equipPackCard(uid){
      const inst=getInstance(uid),def=getDef(inst);if(!inst||!def)return;
      if(isOperationDef(def)){
        if(state.deck.includes(uid))return;
        state.syndicate=state.syndicate.filter(x=>x!==uid);
        if(state.deck.length<10)state.deck.push(uid);
        else{
          let low=0;
          for(let i=1;i<state.deck.length;i++){
            const a=getInstance(state.deck[i]),b=getInstance(state.deck[low]);
            if(a&&b&&GD.cardDps(a)<GD.cardDps(b))low=i;
          }
          state.deck[low]=uid;
        }
      }else{
        if(!state.unlocks.syndicate){toast('The Syndicate has not been restored yet.');return;}
        const slots=GD.syndicateSlots(state.hideoutLevel);
        if(state.syndicate.includes(uid))return;
        state.deck=state.deck.filter(x=>x!==uid);
        if(state.syndicate.length>=slots)state.syndicate.shift();
        state.syndicate.push(uid);
      }
      play('flipDown');save();renderSummary(false);
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
      // CardFlip10Stack.ogg fires exactly as all 10 cards settle into the review grid.
      if(withSound)play('stack');
      const rows=pack.map((c,i)=>`<div class="pack-summary-card-v6 lr2-summary-card" style="--summary-i:${i}">${gameCardMarkup(c,{compact:true,showNew:c.isNew,showLevel:false})}${deltaHtml(c)}<button class="mini-btn pack-equip-v6" data-equip-v6="${c.uid}">${isOperationDef(getDef(c))?(state.deck.includes(c.uid)?'EQUIPPED':'EQUIP'):(state.syndicate.includes(c.uid)?'ASSIGNED':'ASSIGN')}</button></div>`).join('');
      stack.innerHTML=`<div class="pack-summary pack-summary-v6 ${withSound?'lr2-stack-in':''}"><div class="kicker">PACK COMPLETE</div><h2>${GD.tierData(packTier).name.toUpperCase()} DECK</h2><div class="summary-grid summary-grid-v6">${rows}</div><button class="btn primary" id="done-v6" style="width:100%;margin-top:10px">DONE</button></div>`;
      bindHolo(stack);
      stack.querySelectorAll('[data-equip-v6]').forEach(b=>b.onclick=()=>equipPackCard(b.dataset.equipV6));
      document.getElementById('done-v6').onclick=()=>{play('flipDown');modalRoot.innerHTML='';modalOpen=false;done();};
    }

    function draw(){
      if(index>=pack.length){renderSummary(true);return;}
      faceUp=false;busy=false;
      stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;
      const count=Math.min(4,pack.length-index);
      for(let j=count-1;j>=0;j--){
        const inst=pack[index+j],el=document.createElement('div');
        el.className=`reveal-card lr2-reveal-card${inst.holo?' contains-holo':''}`;
        el.style.zIndex=10-j;
        el.style.setProperty('--stack-i',String(j));
        el.style.transform=['translate(0,0) rotate(0deg) scale(1)','translate(13px,17px) rotate(2deg) scale(.96)','translate(-12px,28px) rotate(-2.5deg) scale(.92)','translate(18px,39px) rotate(3deg) scale(.88)'][j];
        el.innerHTML=`<div class="flip-inner">${face(inst)}</div>`;
        if(j===0)el.onclick=()=>{
          if(busy)return;
          const inner=el.querySelector('.flip-inner');
          if(!faceUp){
            busy=true;faceUp=true;
            // Face-down -> face-up uses CardFlipSingleUp.ogg.
            play('flipUp');
            el.classList.add('lr2-flipping-up');inner.classList.add('faceup','lr2-flip-forward');
            setTimeout(()=>{
              inner.classList.remove('lr2-flip-forward');el.classList.remove('lr2-flipping-up');busy=false;
              const hint=stack.querySelector('.reveal-hint');if(hint)hint.textContent='TAP FOR NEXT CARD';
              bindHolo(el);
            },state.settings.reducedMotion?20:860);
          }else{
            busy=true;
            // Sorting the revealed card away uses CardFlipSingleDown.ogg.
            play('flipDown');
            el.onclick=null;el.classList.add('lr2-sorting-out');
            if(state.settings.reducedMotion){index++;draw();}
            else{el.classList.add(['swipe-r0','swipe-r1','swipe-r2','swipe-r3'][index%4]);setTimeout(()=>{index++;draw();},500);}
          }
        };
        stack.appendChild(el);
      }
      const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent='TAP TO FLIP';stack.appendChild(hint);
    }
    draw();
  };

  // Coin.ogg fires only when an actual duplicate sale is allowed and submitted.
  if(typeof sellCard==='function'&&!sellCard.__lr2CoinWrapped){
    const baseSellCard=sellCard;
    const wrapped=function(id){
      const inst=getInstance(id);
      if(inst&&canSell(inst))play('coin');
      return baseSellCard(id);
    };
    wrapped.__lr2CoinWrapped=true;
    sellCard=wrapped;
  }

  // Bind foil interaction to cards rendered outside pack opening too.
  const baseRender=window.render;
  if(typeof baseRender==='function'&&!baseRender.__lr2FoilWrapped){
    const wrappedRender=function(...args){
      const out=baseRender.apply(this,args);
      requestAnimationFrame(()=>bindHolo(document));
      return out;
    };
    wrappedRender.__lr2FoilWrapped=true;
    window.render=wrappedRender;
  }
  requestAnimationFrame(()=>bindHolo(document));
})();
