(() => {
  const BUILD='LR2.15';
  window.LR_BUILD=BUILD;

  // New audio system migration: older saves may carry the legacy sound toggle as OFF,
  // which previously migrated the new SFX slider to 0%. Give the new SFX system one
  // explicit default of 70%; after this migration, the user's slider choice is preserved.
  try{
    state.settings ||= {};
    if(state.settings.lrAudioMigration !== 2){
      state.settings.soundVolume=.70;
      state.settings.sound=true;
      if(typeof state.settings.musicVolume!=='number') state.settings.musicVolume=0;
      state.settings.lrAudioMigration=2;
      save();
    }
  }catch(e){console.warn('LR audio migration',e);}

  // Make the loaded build obvious in More and give SFX a direct test button.
  const baseRenderSettings=window.renderSettings;
  if(typeof baseRenderSettings==='function'){
    window.renderSettings=function(...args){
      const out=baseRenderSettings.apply(this,args);
      const first=screen.querySelector('.more-settings-v6');
      if(first && !document.getElementById('lr-build-stamp')){
        const row=document.createElement('div');
        row.className='setting';
        row.id='lr-build-stamp';
        row.innerHTML=`<b>BUILD</b><span style="font-weight:900">${BUILD}</span>`;
        first.appendChild(row);
        const test=document.createElement('button');
        test.className='btn ghost';
        test.id='lr-sfx-test';
        test.style.width='100%';
        test.style.marginTop='8px';
        test.textContent='TEST SFX';
        test.onclick=()=>window.lr2PlayExactSfx?.('flipUp');
        first.appendChild(test);
      }
      const sfx=document.getElementById('lr2-sfx');
      if(sfx && !sfx.dataset.lrPreview){
        sfx.dataset.lrPreview='1';
        sfx.addEventListener('change',()=>window.lr2PlayExactSfx?.('flipUp'));
      }
      return out;
    };
  }

  // Prewarm exact uploaded SFX as soon as possible.
  window.LR2ExactAudio?.preload?.();

  // Development cache guard. This no-store version file lets an older cached build
  // detect a newer deployment and reopen the document with a unique query string.
  fetch(`build-version.txt?t=${Date.now()}`,{cache:'no-store'})
    .then(r=>r.ok?r.text():BUILD)
    .then(v=>{
      const latest=String(v).trim();
      if(latest && latest!==BUILD){
        const u=new URL(location.href);
        if(u.searchParams.get('build')!==latest){
          u.searchParams.set('build',latest);
          location.replace(u.toString());
        }
      }
    }).catch(()=>{});

  // Re-render once so the migration/build stamp is immediately reflected.
  try{render();}catch(e){}
})();
