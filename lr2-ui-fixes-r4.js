(() => {
  const BUILD='LR2.16r4';

  function closeCrookedTest(){
    modalRoot.innerHTML='';
    modalOpen=false;
    try{render();}catch(e){}
  }

  function bindDirectTilt(card){
    if(!card || card.dataset.lrDirectTilt==='1') return;
    card.dataset.lrDirectTilt='1';
    let active=false;
    const reset=()=>{
      active=false;
      card.style.setProperty('--lr-pointer-x','50%');
      card.style.setProperty('--lr-pointer-y','50%');
      card.style.setProperty('--lr-background-x','50%');
      card.style.setProperty('--lr-background-y','50%');
      card.style.setProperty('--lr-rotate-x','0deg');
      card.style.setProperty('--lr-rotate-y','0deg');
      card.style.setProperty('--lr-card-opacity','0');
      card.classList.remove('lr-simey-interacting');
    };
    const move=e=>{
      if(e.pointerType==='touch' && !active) return;
      const r=card.getBoundingClientRect();
      if(!r.width||!r.height)return;
      const px=Math.max(0,Math.min(100,((e.clientX-r.left)/r.width)*100));
      const py=Math.max(0,Math.min(100,((e.clientY-r.top)/r.height)*100));
      const rx=-(px-50)/3.5;
      const ry=(py-50)/3.5;
      card.style.setProperty('--lr-pointer-x',`${px}%`);
      card.style.setProperty('--lr-pointer-y',`${py}%`);
      card.style.setProperty('--lr-background-x',`${37+(px/100)*26}%`);
      card.style.setProperty('--lr-background-y',`${33+(py/100)*34}%`);
      card.style.setProperty('--lr-rotate-x',`${rx}deg`);
      card.style.setProperty('--lr-rotate-y',`${ry}deg`);
      card.style.setProperty('--lr-card-opacity','1');
      card.classList.add('lr-simey-interacting');
    };
    card.addEventListener('pointerdown',e=>{active=true;try{card.setPointerCapture?.(e.pointerId)}catch(err){};move(e);},{passive:true});
    card.addEventListener('pointermove',move,{passive:true});
    card.addEventListener('pointerup',reset,{passive:true});
    card.addEventListener('pointercancel',reset,{passive:true});
    card.addEventListener('pointerleave',e=>{if(e.pointerType!=='touch')reset();},{passive:true});
  }

  function showCrookedTest(){
    const card=window.LR216CrookedTom?.ensure?.();
    if(!card)return;
    const back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop lr-r4-crooked-backdrop"><div class="modal pack-modal lr216-crooked-modal lr-r4-crooked-modal"><button class="btn ghost lr-r4-crooked-back" id="lr-r4-crooked-back">← BACK TO MORE</button><div class="kicker">HOLOGRAPHIC TEST CARD</div><h2>CROOKED TOM</h2><p class="tiny">Tap to flip. Drag your finger across the front to tilt and move the foil.</p><div class="reveal-stack active lr216-reveal-stack" style="min-height:430px"><div class="reveal-card lr2-reveal-card lr216-reveal-card lr216-spring-card" id="lr-r4-crooked-card"><div class="flip-inner lr216-flip-inner" style="--lr-flip-angle:0deg;--lr-flip-x:0deg"><div class="reveal-face reveal-back"><img src="${back}" alt="Street Deck card back" draggable="false"></div><div class="reveal-face reveal-front">${gameCardMarkup(card,{showNew:false,showLevel:true})}</div></div></div></div><div class="btn-row"><button class="btn ghost" id="lr-r4-crooked-reset">RESET FLIP</button><button class="btn primary" id="lr-r4-crooked-close">CLOSE</button></div></div></div>`;
    const host=document.getElementById('lr-r4-crooked-card');
    const inner=host.querySelector('.lr216-flip-inner');
    const faceCard=host.querySelector('.game-card');
    let flipped=false,busy=false,dragged=false,downX=0,downY=0;
    window.LR2SimeyCard?.scan?.(modalRoot);
    bindDirectTilt(faceCard);
    const reset=()=>{
      flipped=false;busy=false;dragged=false;
      inner.classList.remove('faceup');
      inner.style.setProperty('--lr-flip-angle','0deg');
      inner.style.setProperty('--lr-flip-x','0deg');
      host.style.setProperty('--lr-flip-lift','0px');
      host.style.setProperty('--lr-flip-scale','1');
    };
    host.addEventListener('pointerdown',e=>{downX=e.clientX;downY=e.clientY;dragged=false;},{passive:true});
    host.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-downX,e.clientY-downY)>8)dragged=true;},{passive:true});
    host.addEventListener('click',async()=>{
      if(dragged||flipped||busy)return;
      busy=true;
      window.LR2PackV16?.playSfx?.('flipUp');
      if(window.LR2SpringFlip) await window.LR2SpringFlip(inner,host);
      else inner.style.setProperty('--lr-flip-angle','180deg');
      inner.classList.add('faceup');
      flipped=true;busy=false;
    });
    document.getElementById('lr-r4-crooked-reset').onclick=()=>{window.LR2PackV16?.playSfx?.('flipDown');reset();};
    document.getElementById('lr-r4-crooked-close').onclick=closeCrookedTest;
    document.getElementById('lr-r4-crooked-back').onclick=closeCrookedTest;
    modalRoot.querySelector('.lr-r4-crooked-backdrop').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCrookedTest();});
  }

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function'){
    window.renderSettings=function(){
      const out=baseSettings.apply(this,arguments);
      const b=document.getElementById('lr216-crooked-test');
      if(b)b.onclick=showCrookedTest;
      const stamp=document.getElementById('lr-build-stamp');
      if(stamp)stamp.querySelector('span').textContent=BUILD;
      return out;
    };
  }
  if(window.LR216CrookedTom)window.LR216CrookedTom.showFlipTest=showCrookedTest;

  const shortAbilityText=s=>{
    const text=String(s||'').replace(/\s+/g,' ').trim();
    if(text.length<=36)return text;
    const cut=text.slice(0,33).replace(/\s+\S*$/,'');
    return `${cut||text.slice(0,33)}…`;
  };
  const baseBattle=window.renderBattle;
  if(typeof baseBattle==='function'){
    window.renderBattle=function(){
      const out=baseBattle.apply(this,arguments);
      document.querySelectorAll('.operation-abilities .op-ability-row span').forEach(el=>{
        if(!el.dataset.lrFullAbility)el.dataset.lrFullAbility=el.textContent;
        el.textContent=shortAbilityText(el.dataset.lrFullAbility);
        el.title=el.dataset.lrFullAbility;
      });
      return out;
    };
  }

  function updateEscapeMeter(){
    try{
      const enemy=state?.battle?.enemy;
      if(enemy?.target){
        const bar=document.querySelector('.enemy-card.target .meter.gold i');
        const label=document.getElementById('lr-target-time');
        const remaining=Math.max(0,(enemy.deadline-now())/1000);
        if(bar)bar.style.width=`${Math.max(0,Math.min(100,(remaining/30)*100))}%`;
        if(label)label.textContent=`${remaining.toFixed(1)}s`;
      }
    }catch(e){}
    requestAnimationFrame(updateEscapeMeter);
  }
  requestAnimationFrame(updateEscapeMeter);
})();
