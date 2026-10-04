(() => {
  const BUILD='LR3.28';
  const CROOKED='t1-c05';
  const HOLOS=[
    ['galaxy','GALAXY / COSMOS'],
    ['amazing','AMAZING RARE'],
    ['radiant','RADIANT HOLOFOIL'],
    ['trainer','TRAINER GALLERY'],
    ['v-full','V FULL ART'],
    ['vmax','VMAX RAINBOW']
  ];

  function makeTestCard(style){
    const def=GD.CARD_MAP[CROOKED]||GD.CARDS[0];
    if(!def)return null;
    const inst=createCardInstance(def,def.tier,GD.packBaseCost(def.tier));
    inst.uid=`lr3-test-holo-${style}-${Date.now()}`;
    inst.holo=true;
    inst.holoStyle=style;
    inst.holoStyleVersion=1;
    inst.isNew=false;
    inst.__lrTest=true;
    return inst;
  }

  function closeTestModal(){modalRoot.innerHTML='';modalOpen=false;render();}

  function showHoloTest(style){
    if(!HOLOS.some(([id])=>id===style))return;
    const inst=makeTestCard(style);if(!inst)return;
    const label=HOLOS.find(([id])=>id===style)?.[1]||style.toUpperCase();
    modalOpen=true;
    modalRoot.innerHTML=`<div class="modal-backdrop"><div class="modal card-detail lr3-holo-test-modal"><div class="kicker">HOLOGRAPHIC EFFECT TEST</div><h2>${escapeHtml(label)}</h2><p class="tiny">Move or drag across the card to test the foil. This is a temporary preview only.</p><div class="lr3-holo-test-card">${gameCardMarkup(inst,{showNew:false,showLevel:true})}</div><div class="lr3-holo-test-switcher">${HOLOS.map(([id,name])=>`<button class="mini-btn ${id===style?'on':''}" data-lr3-holo-test="${id}">${escapeHtml(name)}</button>`).join('')}</div><button class="btn primary" id="lr3-holo-test-close" style="width:100%">CLOSE</button></div></div>`;
    window.LR3HoloVariants?.scan?.(modalRoot);window.LR2SimeyCard?.scan?.(modalRoot);
    modalRoot.querySelectorAll('[data-lr3-holo-test]').forEach(b=>b.onclick=()=>showHoloTest(b.dataset.lr3HoloTest));
    document.getElementById('lr3-holo-test-close').onclick=closeTestModal;
  }

  function testPack(tier){
    const t=GD.tierData(Number(tier));if(!t)return;
    const price=GD.packBaseCost(t.id),pack=generatePack(t.id,price);
    pack.forEach(c=>{c.__lrTest=true;c.isNew=false;});
    document.body.classList.add('lr3-test-pack');
    showPackOpening(t.id,pack,0,()=>{document.body.classList.remove('lr3-test-pack');render();});
    const modal=modalRoot.querySelector('.pack-modal');
    if(modal){modal.classList.add('lr3-test-pack-modal');const badge=document.createElement('div');badge.className='lr3-test-pack-badge';badge.textContent='TEST OPENING · CARDS WILL NOT BE ADDED';modal.prepend(badge);}
  }

  function addTesterControls(){
    const tester=screen.querySelector('[data-dev="gold"]')?.closest('.pixel-panel');
    if(!tester||tester.querySelector('.lr3-test-lab'))return;
    const lab=document.createElement('div');lab.className='lr3-test-lab';
    lab.innerHTML=`<div class="lr3-test-section"><div class="kicker">HOLOGRAPHIC EFFECTS</div><div class="dev-grid">${HOLOS.map(([id,name])=>`<button class="btn ghost" data-lr3-holo-test="${id}">${escapeHtml(name)}</button>`).join('')}</div></div><div class="lr3-test-section"><div class="kicker">PACK OPENINGS · NO SAVE CHANGES</div><div class="dev-grid">${GD.TIERS.map(t=>`<button class="btn ghost" data-lr3-pack-test="${t.id}">TEST ${escapeHtml(t.name.toUpperCase())} PACK</button>`).join('')}</div></div>`;
    tester.appendChild(lab);
    lab.querySelectorAll('[data-lr3-holo-test]').forEach(b=>b.onclick=()=>showHoloTest(b.dataset.lr3HoloTest));
    lab.querySelectorAll('[data-lr3-pack-test]').forEach(b=>b.onclick=()=>testPack(Number(b.dataset.lr3PackTest)));
  }

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function')window.renderSettings=renderSettings=function(){
    const out=baseSettings.apply(this,arguments);document.getElementById('lr216-crooked-test')?.remove();addTesterControls();
    const stamp=document.getElementById('lr-build-stamp');if(stamp)(stamp.querySelector('span')||stamp).textContent=BUILD;return out;
  };
  window.LR3TestLab={build:BUILD,showHoloTest,testPack};
})();
