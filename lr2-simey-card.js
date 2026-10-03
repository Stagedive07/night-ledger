(() => {
  const BUILD = 'LR2.15';
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cardState = new WeakMap();

  const clampN = (n, min=0, max=100) => Math.min(max, Math.max(min, n));
  const mapRange = (n, a, b, c, d) => c + ((n-a)/(b-a))*(d-c);

  function addLayers(card){
    if(!card || card.dataset.lrSimey === '1') return;
    card.dataset.lrSimey = '1';
    card.classList.add('lr-simey-card');

    if(card.classList.contains('holo')){
      const art = card.querySelector('.game-card-art');
      if(art && !art.querySelector(':scope > .lr-simey-shine')){
        const shine = document.createElement('span');
        shine.className = 'lr-simey-shine';
        shine.setAttribute('aria-hidden','true');
        art.appendChild(shine);
      }
      if(!card.querySelector(':scope > .lr-simey-glare')){
        const glare = document.createElement('span');
        glare.className = 'lr-simey-glare';
        glare.setAttribute('aria-hidden','true');
        card.appendChild(glare);
      }
    }

    const s = {
      current:{px:50,py:50,bx:50,by:50,rx:0,ry:0,o:0},
      target:{px:50,py:50,bx:50,by:50,rx:0,ry:0,o:0},
      velocity:{px:0,py:0,bx:0,by:0,rx:0,ry:0,o:0},
      raf:0,
      touching:false
    };
    cardState.set(card,s);
    writeVars(card,s.current);

    const canTouchInteract = () => !coarse || !!card.closest('.reveal-card,.modal,.pack-summary-v6');

    card.addEventListener('pointerdown', e => {
      if(e.pointerType === 'touch' && !canTouchInteract()) return;
      s.touching = true;
      interact(card,e);
    }, {passive:true});

    card.addEventListener('pointermove', e => {
      if(e.pointerType === 'touch' && !s.touching) return;
      if(e.pointerType === 'touch' && !canTouchInteract()) return;
      interact(card,e);
    }, {passive:true});

    const end = () => {
      s.touching = false;
      reset(card);
    };
    card.addEventListener('pointerup',end,{passive:true});
    card.addEventListener('pointercancel',end,{passive:true});
    card.addEventListener('pointerleave',end,{passive:true});
  }

  function writeVars(card,v){
    const hyp = clampN(Math.hypot(v.px-50,v.py-50)/50,0,1);
    card.style.setProperty('--lr-pointer-x', `${v.px}%`);
    card.style.setProperty('--lr-pointer-y', `${v.py}%`);
    card.style.setProperty('--lr-background-x', `${v.bx}%`);
    card.style.setProperty('--lr-background-y', `${v.by}%`);
    card.style.setProperty('--lr-rotate-x', `${v.rx}deg`);
    card.style.setProperty('--lr-rotate-y', `${v.ry}deg`);
    card.style.setProperty('--lr-card-opacity', String(clampN(v.o,0,1)));
    card.style.setProperty('--lr-pointer-from-center', String(hyp));
  }

  function interact(card,e){
    if(state?.settings?.reducedMotion) return;
    const s = cardState.get(card); if(!s) return;
    const r = card.getBoundingClientRect();
    if(!r.width || !r.height) return;
    const px = clampN(((e.clientX-r.left)/r.width)*100);
    const py = clampN(((e.clientY-r.top)/r.height)*100);
    const cx = px-50, cy = py-50;
    s.target = {
      px, py,
      bx: mapRange(px,0,100,37,63),
      by: mapRange(py,0,100,33,67),
      rx: -(cx/3.5),
      ry:  (cy/3.5),
      o: 1
    };
    card.classList.add('lr-simey-interacting');
    animate(card);
  }

  function reset(card){
    const s = cardState.get(card); if(!s) return;
    s.target = {px:50,py:50,bx:50,by:50,rx:0,ry:0,o:0};
    card.classList.remove('lr-simey-interacting');
    animate(card);
  }

  function animate(card){
    const s = cardState.get(card); if(!s || s.raf) return;
    const keys = ['px','py','bx','by','rx','ry','o'];
    const tick = () => {
      let moving = false;
      for(const k of keys){
        const stiffness = k === 'o' ? .075 : .085;
        const damping = k === 'o' ? .70 : .74;
        const delta = s.target[k] - s.current[k];
        s.velocity[k] = (s.velocity[k] + delta*stiffness) * damping;
        s.current[k] += s.velocity[k];
        if(Math.abs(delta) > .025 || Math.abs(s.velocity[k]) > .025) moving = true;
      }
      writeVars(card,s.current);
      if(moving){
        s.raf = requestAnimationFrame(tick);
      }else{
        s.current = {...s.target};
        keys.forEach(k => s.velocity[k]=0);
        writeVars(card,s.current);
        s.raf = 0;
      }
    };
    s.raf = requestAnimationFrame(tick);
  }

  function scan(root=document){
    root.querySelectorAll?.('.game-card').forEach(addLayers);
  }

  const mo = new MutationObserver(records => {
    for(const rec of records){
      for(const node of rec.addedNodes){
        if(node.nodeType !== 1) continue;
        if(node.matches?.('.game-card')) addLayers(node);
        scan(node);
      }
    }
  });
  mo.observe(document.body,{childList:true,subtree:true});

  requestAnimationFrame(()=>scan(document));
  window.LR2SimeyCard = {scan, build:BUILD};
})();
