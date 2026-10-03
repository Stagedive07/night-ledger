(() => {
  const BUILD='LR2.16r7';
  const playSfx=kind=>window.LR2PackV16?.playSfx?.(kind);

  function springValue(from,to,{stiffness=.066,damping=.25,precision=.025,maxMs=1400,onFrame}={}){
    return new Promise(resolve=>{
      let x=from,v=0,last=performance.now(),start=last;
      const friction=Math.max(0,1-damping);
      const frame=now=>{
        const dt=Math.max(.35,Math.min(2,(now-last)/16.667));
        last=now;
        v += (to-x)*stiffness*dt;
        v *= Math.pow(friction,dt);
        x += v*dt;
        onFrame?.(x,v);
        if((Math.abs(to-x)<precision&&Math.abs(v)<precision&&now-start>220)||now-start>maxMs){onFrame?.(to,0);resolve();return;}
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  async function simeyRevealTurn(rotator,translater){
    if(!rotator)return;
    if(state?.settings?.reducedMotion){rotator.style.setProperty('--lr7-turn','360deg');translater?.style.setProperty('--lr7-scale','1');translater?.style.setProperty('--lr7-z','0px');return;}
    const rotate=springValue(180,360,{stiffness:.066,damping:.25,precision:.035,maxMs:1450,onFrame:x=>rotator.style.setProperty('--lr7-turn',`${x.toFixed(3)}deg`)});
    const popUp=springValue(1,1.085,{stiffness:.033,damping:.45,precision:.0006,maxMs:950,onFrame:x=>{translater?.style.setProperty('--lr7-scale',x.toFixed(5));const z=Math.max(0,(x-1)*760);translater?.style.setProperty('--lr7-z',`${z.toFixed(2)}px`);}});
    await Promise.all([rotate,popUp]);
    await springValue(1.085,1,{stiffness:.033,damping:.45,precision:.0006,maxMs:850,onFrame:x=>{translater?.style.setProperty('--lr7-scale',x.toFixed(5));const z=Math.max(0,(x-1)*760);translater?.style.setProperty('--lr7-z',`${z.toFixed(2)}px`);}});
    rotator.style.setProperty('--lr7-turn','360deg');
  }

  async function simeyExitTurn(rotator,card){
    if(state?.settings?.reducedMotion)return;
    await Promise.all([
      springValue(360,438,{stiffness:.066,damping:.25,precision:.08,maxMs:650,onFrame:x=>rotator?.style.setProperty('--lr7-turn',`${x.toFixed(2)}deg`)}),
      springValue(0,1,{stiffness:.08,damping:.34,precision:.01,maxMs:600,onFrame:x=>{if(!card)return;const side=(Number(card.dataset.lr7Index||0)%2===0?1:-1);card.style.setProperty('--lr7-exit-x',`${(side*x*118).toFixed(2)}px`);card.style.setProperty('--lr7-exit-y',`${(-x*18).toFixed(2)}px`);card.style.setProperty('--lr7-exit-r',`${(side*x*9).toFixed(2)}deg`);card.style.opacity=String(Math.max(0,1-x*.92));}})
    ]);
  }

  window.startReveal=function(packTier,pack,price,done){
    document.getElementById('pack-cover')?.style.setProperty('display','none');
    const stack=document.getElementById('reveal-stack');if(!stack)return;
    stack.classList.add('active','lr2-reveal-stack','lr7-reveal-stack');
    let index=0,faceUp=false,busy=false;
    const back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
    const packAccent=GD.tierData(packTier).accent;
    const face=inst=>`<div class="lr7-face lr7-front" style="--pack-accent:${packAccent}">${gameCardMarkup(inst,{showNew:inst.isNew,showLevel:false})}</div><div class="lr7-face lr7-back"><img src="${back}" alt="" draggable="false"></div>`;

    function equipPackCard(uid){const inst=getInstance(uid),def=getDef(inst);if(!inst||!def)return;if(isOperationDef(def)){if(state.deck.includes(uid))return;state.syndicate=state.syndicate.filter(x=>x!==uid);if(state.deck.length<10)state.deck.push(uid);else{let low=0;for(let i=1;i<state.deck.length;i++){const a=getInstance(state.deck[i]),b=getInstance(state.deck[low]);if(a&&b&&GD.cardDps(a)<GD.cardDps(b))low=i;}state.deck[low]=uid;}}else{if(!state.unlocks.syndicate){toast('The Syndicate has not been restored yet.');return;}const slots=GD.syndicateSlots(state.hideoutLevel);if(state.syndicate.includes(uid))return;state.deck=state.deck.filter(x=>x!==uid);if(state.syndicate.length>=slots)state.syndicate.shift();state.syndicate.push(uid);}playSfx('flipDown');save();renderSummary(false);}
    function deltaHtml(c){if(!isOperationDef(getDef(c)))return '<div class="pack-delta neutral">SYNDICATE</div>';if(state.deck.includes(c.uid))return '<div class="pack-delta neutral">EQUIPPED</div>';const deck=deckInstances();let delta;if(deck.length<10)delta=GD.cardDps(c);else{const low=deck.reduce((m,x)=>!m||GD.cardDps(x)<GD.cardDps(m)?x:m,null);delta=GD.cardDps(c)-GD.cardDps(low);}const cls=delta>0?'positive':delta<0?'negative':'neutral',sign=delta>0?'+':'';return `<div class="pack-delta ${cls}">${sign}${GD.formatNum(delta)} DPS</div>`;}
    function renderSummary(withSound=true){if(withSound)playSfx('stack');const rows=pack.map((c,i)=>`<div class="pack-summary-card-v6 lr2-summary-card" style="--summary-i:${i}">${gameCardMarkup(c,{compact:true,showNew:c.isNew,showLevel:false})}${deltaHtml(c)}<button class="mini-btn pack-equip-v6" data-equip-v6="${c.uid}">${isOperationDef(getDef(c))?(state.deck.includes(c.uid)?'EQUIPPED':'EQUIP'):(state.syndicate.includes(c.uid)?'ASSIGNED':'ASSIGN')}</button></div>`).join('');stack.innerHTML=`<div class="pack-summary pack-summary-v6 ${withSound?'lr2-stack-in':''}"><div class="kicker">PACK COMPLETE</div><h2>${GD.tierData(packTier).name.toUpperCase()} DECK</h2><div class="summary-grid summary-grid-v6">${rows}</div><button class="btn primary" id="done-v6" style="width:100%;margin-top:10px">DONE</button></div>`;window.LR2SimeyCard?.scan?.(stack);stack.querySelectorAll('[data-equip-v6]').forEach(b=>b.onclick=()=>equipPackCard(b.dataset.equipV6));document.getElementById('done-v6').onclick=()=>{playSfx('flipDown');modalRoot.innerHTML='';modalOpen=false;done();};}

    function draw(){if(index>=pack.length){renderSummary(true);return;}faceUp=false;busy=false;stack.innerHTML=`<div class="reveal-counter">${index+1}/10</div>`;const count=Math.min(4,pack.length-index);for(let j=count-1;j>=0;j--){const inst=pack[index+j],el=document.createElement('div');el.className=`reveal-card lr7-reveal-card${inst.holo?' contains-holo':''}`;el.dataset.lr7Index=String(index);el.style.zIndex=10-j;el.style.setProperty('--stack-i',String(j));el.style.setProperty('--stack-x',`${[0,13,-12,18][j]}px`);el.style.setProperty('--stack-y',`${[0,17,28,39][j]}px`);el.style.setProperty('--stack-r',`${[0,2,-2.5,3][j]}deg`);el.style.setProperty('--stack-s',String([1,.96,.92,.88][j]));el.innerHTML=`<div class="lr7-translater" style="--lr7-scale:1;--lr7-z:0px"><div class="lr7-rotator" style="--lr7-turn:180deg">${face(inst)}</div></div>`;if(j===0)el.onclick=async()=>{if(busy)return;const rotator=el.querySelector('.lr7-rotator'),translater=el.querySelector('.lr7-translater');if(!faceUp){busy=true;faceUp=true;playSfx('flipUp');el.classList.add('lr7-interacting');await simeyRevealTurn(rotator,translater);busy=false;const hint=stack.querySelector('.reveal-hint');if(hint)hint.textContent='TAP FOR NEXT CARD';window.LR2SimeyCard?.scan?.(el);}else{busy=true;playSfx('flipDown');await simeyExitTurn(rotator,el);index++;draw();}};stack.appendChild(el);}const hint=document.createElement('div');hint.className='reveal-hint';hint.textContent='TAP TO FLIP';stack.appendChild(hint);}draw();
  };

  const priorSettings=window.renderSettings;
  if(typeof priorSettings==='function')window.renderSettings=function(){const out=priorSettings.apply(this,arguments);const stamp=document.getElementById('lr-build-stamp');if(stamp){const v=stamp.querySelector('span')||stamp;v.textContent=BUILD;}return out;};
  window.LR2SimeyFlipR7={build:BUILD,springValue,simeyRevealTurn};
})();
