(() => {
  // Final pack-opening timing pass. Full Pack opening long.ogg starts as soon as
  // the purchased pack opening appears, instead of waiting for the cover tap.
  const baseShowPackOpening=window.showPackOpening;
  if(typeof baseShowPackOpening==='function'){
    window.showPackOpening=function(packTier,pack,price,done){
      modalOpen=true;
      const t=GD.tierData(packTier),back=window.LRV6?.BACK||'assets/card-art/street-deck-back.png';
      window.lr2PlayExactSfx?.('packOpen');
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
          setTimeout(()=>startReveal(packTier,pack,price,done),state.settings.reducedMotion?10:760);
        },state.settings.reducedMotion?10:440);
      };
    };
  }

  // Keep exact supplied SFX prewarmed before a pack can be opened.
  window.LR2ExactAudio?.preload?.();
})();
