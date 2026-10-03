(() => {
  const DEF='t1-c05',MARK='lr216CrookedTomTestGranted';
  function ensureCrooked(){
    if(!state?.inventory||!GD?.CARD_MAP?.[DEF])return null;
    let card=state.inventory.find(c=>c.defId===DEF&&c.holo);
    if(!card){card=state.inventory.find(c=>c.defId===DEF);if(!card){card=createCardInstance(DEF);state.inventory.push(card);}card.holo=true;}
    if(!state.discovered.includes(DEF))state.discovered.push(DEF);
    if(!state.holoSeen.includes(DEF))state.holoSeen.push(DEF);
    state[MARK]=true;save();return card;
  }
  const base=window.renderSettings;
  if(typeof base==='function')window.renderSettings=function(){const out=base.apply(this,arguments),card=ensureCrooked(),host=screen.querySelector('.more-settings-v6')||screen.querySelector('.pixel-panel');if(card&&host&&!document.getElementById('lr216-crooked-test')){const b=document.createElement('button');b.className='btn primary';b.id='lr216-crooked-test';b.style.width='100%';b.style.marginTop='8px';b.textContent='VIEW HOLOGRAPHIC CROOKED TOM';b.onclick=()=>showCardDetail(card.uid);host.appendChild(b);}return out;};
  const card=ensureCrooked();
  window.LR216CrookedTom={ensure:ensureCrooked,uid:card?.uid||null};
})();