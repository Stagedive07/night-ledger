(() => {
  const BUILD='LR2.16';
  window.LR_BUILD=BUILD;

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

  try{render();}catch(e){}
})();
