(() => {
  const BUILD='LR2.16';
  const AUDIO={
    flipUp:['assets/audio/card-flip-single-up.m4a','assets/audio/card-flip-single-up.ogg'],
    flipDown:['assets/audio/card-flip-single-down.m4a','assets/audio/card-flip-single-down.ogg'],
    stack:['assets/audio/card-flip-10-stack.m4a','assets/audio/card-flip-10-stack.ogg'],
    packOpen:['assets/audio/full-pack-opening.m4a','assets/audio/full-pack-opening.ogg'],
    coin:['assets/audio/coin.m4a','assets/audio/coin.ogg']
  };
  const preloaded=new Map();
  const clamp01=n=>Math.max(0,Math.min(1,Number(n)||0));
  const sfxVol=()=>clamp01(state?.settings?.soundVolume ?? (state?.settings?.sound ? .7 : 0));

  function makeAudio(kind){
    const sources=AUDIO[kind]||AUDIO.flipDown;
    let proto=preloaded.get(kind);
    if(!proto){
      proto=new Audio();
      proto.preload='auto';
      proto.src=sources[0];
      proto.dataset.fallback=sources[1]||'';
      proto.addEventListener('error',()=>{
        if(proto.dataset.fallback && proto.src.indexOf(proto.dataset.fallback)===-1){
          proto.src=proto.dataset.fallback;
          proto.load();
        }
      },{once:true});
      preloaded.set(kind,proto);
    }
    return proto;
  }

  function playSfx(kind){
    const volume=sfxVol();
    if(volume<=0)return;
    const sources=AUDIO[kind]||AUDIO.flipDown;
    try{
      const base=makeAudio(kind);
      const a=base.cloneNode(true);
      a.volume=volume;
      a.currentTime=0;
      const attempt=a.play();
      if(attempt?.catch){
        attempt.catch(()=>{
          if(sources[1] && !String(a.src).includes(sources[1])){
            a.src=sources[1];
            a.volume=volume;
            a.play().catch(()=>{});
          }
        });
      }
    }catch(e){ console.warn('LR SFX',kind,e); }
  }
  Object.keys(AUDIO).forEach(makeAudio);
  window.lr2PlayExactSfx=playSfx;
  window.playUISoundV5=function(kind='select'){
    if(kind==='flip')return playSfx('flipUp');
    if(kind==='flipDown')return playSfx('flipDown');
    if(kind==='coin')return playSfx('coin');
    if(kind==='packOpen')return playSfx('packOpen');
    if(kind==='stack'||kind==='place')return playSfx('stack');
    return playSfx('flipDown');
  };

  function springFlip(inner,card){
    if(!inner)return Promise.resolve();
    if(state?.settings?.reducedMotion){
      inner.style.setProperty('--lr-flip-angle','180deg');
      inner.style.setProperty('--lr-flip-x','0deg');
      card?.style.setProperty('--lr-flip-lift','0px');
      card?.style.setProperty('--lr-flip-scale','1');
      return Promise.resolve();
    }
    return new Promise(resolve=>{
      let angle=0,velocity=0,last=performance.now(),started=last;
      inner.classList.add('lr216-spring-flip');
      card?.classList.add('lr216-spring-card');
      inner.style.setProperty('--lr-flip-angle','0deg');
      const tick=now=>{
        const frame=Math.max(.45,Math.min(1.8,(now-last)/16.667));
        last=now;
        const delta=180-angle;
        velocity=(velocity + delta*.05*frame) * Math.pow(.70,frame);
        angle += velocity*frame;
        const progress=Math.max(0,Math.min(1,angle/180));
        const arc=Math.sin(progress*Math.PI);
        inner.style.setProperty('--lr-flip-angle',`${angle.toFixed(3)}deg`);
        inner.style.setProperty('--lr-flip-x',`${(-2.4*arc).toFixed(3)}deg`);
        card?.style.setProperty('--lr-flip-lift',`${(-11*arc).toFixed(2)}px`);
        card?.style.setProperty('--lr-flip-scale',`${(1+.055*arc).toFixed(4)}`);
        card?.style.setProperty('--lr-flip-shadow',String(arc));
        if((Math.abs(delta)<.08 && Math.abs(velocity)<.08 && now-started>300) || now-started>840){
          inner.style.setProperty('--lr-flip-angle','180deg');
          inner.style.setProperty('--lr-flip-x','0deg');
          card?.style.setProperty('--lr-flip-lift','0px');
          card?.style.setProperty('--lr-flip-scale','1');
          card?.style.setProperty('--lr-flip-shadow','0');
          inner.classList.remove('lr216-spring-flip');
          card?.classList.remove('lr216-spring-card');
          resolve();
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }
  window.LR2SpringFlip=springFlip;

  window.showPackOpening=function(packTier,pack,price,done){
    modalOpen=true;
    const t=GD.tierData(packTier),back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
    playSfx('packOpen');
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal pack-modal"><div class="pack-stage" id="pack-stage"><div class="pack-rip" id="pack-rip"></div><button class="pack-cover pack-cover-v6" id="pack-cover" aria-label="Open ${escapeHtml(t.name)} pack"><img src="${back}" alt="" draggable="false"></button><div class="reveal-stack" id="reveal-stack"></div></div></div></div>`;
    const cover=document.getElementById('pack-cover');
    cover.classList.add('lr2-pack-opening');
    cover.onclick=()=>{
      if(cover.dataset.opening)return;
      cover.dataset.opening='1';
      cover.classList.add('shake');
      setTimeout(()=>{
        cover.classList.remove('shake');
        cover.classList.add('opening','lr2-pack-rip-away');
        document.getElementById('pack-rip')?.classList.add('fly');
        setTimeout(()=>window.startReveal(packTier,pack,price,done),state.settings.reducedMotion?10:700);
      },state.settings.reducedMotion?10:400);
    };
  };

  window.startReveal=function(packTier,pack,price,done){
    document.getElementById('pack-cover')?.style.setProperty('display','none');
    const stack=document.getElementById('reveal-stack');if(!stack)return;
    stack.classList.add('active','lr2-reveal-stack','lr216-reveal-stack');
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
      window.LR2SimeyCard?.scan?.(stack);
      stack.querySelectorAll('[data-equip-v6]').forEach(b=>b.onclick=()=>equipPackCard(b.dataset.equipV6));
      document.getElementById('done-v6').onclick=()=>{playSfx('flipDown');modalRoot.innerHTML='';modalOpen=false;done();};
    }

    function draw(){
      if(index>=pack.length){renderSummary(true);return;}
      faceUp=false;busy=false;
      stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;
      const count=Math.min(4,pack.length-index);
      for(let j=count-1;j>=0;j--){
        const inst=pack[index+j],el=document.createElement('div');
        el.className=`reveal-card lr2-reveal-card lr216-reveal-card${inst.holo?' contains-holo':''}`;
        el.style.zIndex=10-j;
        el.style.setProperty('--stack-i',String(j));
        el.style.transform=['translate(0,0) rotate(0deg) scale(1)','translate(13px,17px) rotate(2deg) scale(.96)','translate(-12px,28px) rotate(-2.5deg) scale(.92)','translate(18px,39px) rotate(3deg) scale(.88)'][j];
        el.innerHTML=`<div class="flip-inner lr216-flip-inner" style="--lr-flip-angle:0deg;--lr-flip-x:0deg">${face(inst)}</div>`;
        if(j===0)el.onclick=async()=>{
          if(busy)return;
          const inner=el.querySelector('.flip-inner');
          if(!faceUp){
            busy=true;faceUp=true;
            playSfx('flipUp');
            el.classList.add('lr2-flipping-up');
            await springFlip(inner,el);
            inner.classList.add('faceup');
            el.classList.remove('lr2-flipping-up');
            busy=false;
            const hint=stack.querySelector('.reveal-hint');if(hint)hint.textContent='TAP FOR NEXT CARD';
            window.LR2SimeyCard?.scan?.(el);
          }else{
            busy=true;
            playSfx('flipDown');
            el.onclick=null;el.classList.add('lr2-sorting-out');
            if(state.settings.reducedMotion){index++;draw();}
            else{el.classList.add(['swipe-r0','swipe-r1','swipe-r2','swipe-r3'][index%4]);setTimeout(()=>{index++;draw();},470);}
          }
        };
        stack.appendChild(el);
      }
      const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent='TAP TO FLIP';stack.appendChild(hint);
    }
    draw();
  };

  if(typeof sellCard==='function' && !sellCard.__lr216NativeCoin){
    const previous=sellCard;
    const wrapped=function(id){
      const inst=getInstance(id),shouldPlay=!!(inst&&canSell(inst));
      if(shouldPlay)playSfx('coin');
      const prior=state?.settings?.soundVolume;
      if(shouldPlay && typeof prior==='number')state.settings.soundVolume=0;
      try{return previous(id);}finally{if(shouldPlay && typeof prior==='number')state.settings.soundVolume=prior;}
    };
    wrapped.__lr216NativeCoin=true;
    sellCard=wrapped;
  }

  window.LR2PackV16={build:BUILD,playSfx,springFlip};
})();
