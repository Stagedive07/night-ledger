(() => {
  const TRACKS=['assets/audio/lr-a-min.m4a'];

  // app-lr2.js owns the actual two-player 10-second crossfade engine.
  // Keep only one music engine active; this module makes the More slider
  // update that engine immediately instead of creating a second set of players.
  function clamp01(n){return Math.max(0,Math.min(1,Number(n)||0));}

  function sliderVolume(slider){
    const raw=Number(slider?.value)||0;
    const max=Number(slider?.max)||100;
    return clamp01(max>1?raw/max:raw);
  }

  function applySlider(slider){
    if(!slider||!window.state)return;
    const v=sliderVolume(slider);
    state.settings ||= {};
    state.settings.musicVolume=v;
    state.settings.music=v>0;
    try{save();}catch(e){}

    // The original music engine listens for pointerdown and applies the current
    // state.settings.musicVolume to its active player(s). Dispatch synchronously
    // from the real slider gesture so volume changes are audible immediately.
    try{document.dispatchEvent(new Event('pointerdown'));}catch(e){}
  }

  const oldRender=window.renderSettings;
  if(typeof oldRender==='function'){
    window.renderSettings=function(){
      const r=oldRender.apply(this,arguments);
      const slider=document.getElementById('lr2-music');
      if(slider&&!slider.dataset.lr216Volume){
        slider.dataset.lr216Volume='1';
        slider.addEventListener('input',()=>applySlider(slider));
        slider.addEventListener('change',()=>applySlider(slider));
      }
      return r;
    };
  }

  window.LR2MusicV16={
    tracks:TRACKS,
    ensure(){try{document.dispatchEvent(new Event('pointerdown'));}catch(e){}},
    setVolume(v){
      state.settings ||= {};
      state.settings.musicVolume=clamp01(v);
      state.settings.music=state.settings.musicVolume>0;
      try{save();}catch(e){}
      try{document.dispatchEvent(new Event('pointerdown'));}catch(e){}
    }
  };
})();