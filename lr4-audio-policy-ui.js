(() => {
  const BUILD='LR4.8';
  const trackedMedia=new Set();
  const nativePlay=HTMLMediaElement.prototype.play;
  const nativePause=HTMLMediaElement.prototype.pause;
  let foregroundGesture=false;

  function ensureAudioPrefs(){
    state.settings ||= {};
    if(typeof state.settings.soundEnabled!=='boolean'){
      state.settings.soundEnabled=state.settings.sound!==false&&Number(state.settings.soundVolume||0)>0;
    }
    if(typeof state.settings.musicEnabled!=='boolean'){
      state.settings.musicEnabled=state.settings.music!==false&&Number(state.settings.musicVolume||0)>0;
    }
    state.settings.sound=!!state.settings.soundEnabled;
    state.settings.music=!!state.settings.musicEnabled;
    return state.settings;
  }

  function sourceOf(media){
    return String(media?.currentSrc||media?.src||media?.querySelector?.('source')?.src||'');
  }
  function mediaKind(media){return sourceOf(media).includes('lr-a-min')?'music':'sfx';}
  function enabled(kind){
    const s=ensureAudioPrefs();
    return kind==='music'?!!s.musicEnabled:!!s.soundEnabled;
  }
  function setAmbientSession(){
    try{if(navigator.audioSession)navigator.audioSession.type='ambient';}catch(e){}
  }
  function pauseMedia(media){try{nativePause.call(media);}catch(e){}}
  function pauseKind(kind){trackedMedia.forEach(m=>{if(mediaKind(m)===kind)pauseMedia(m);});}
  function pauseAll(){trackedMedia.forEach(pauseMedia);}

  HTMLMediaElement.prototype.play=function(...args){
    trackedMedia.add(this);
    const kind=mediaKind(this);
    if(document.hidden||!foregroundGesture||!enabled(kind)){
      pauseMedia(this);
      return Promise.resolve();
    }
    setAmbientSession();
    return nativePlay.apply(this,args);
  };

  function setEnabled(kind,on){
    const s=ensureAudioPrefs();
    const value=!!on;
    if(kind==='music'){
      s.musicEnabled=value;
      s.music=value;
      if(!value)pauseKind('music');
      else if(foregroundGesture&&!document.hidden)window.LR2MusicV16?.ensure?.();
    }else{
      s.soundEnabled=value;
      s.sound=value;
      if(!value)pauseKind('sfx');
    }
    try{save();}catch(e){}
  }

  document.addEventListener('pointerdown',e=>{
    if(e.isTrusted&&!document.hidden){foregroundGesture=true;setAmbientSession();}
  },{capture:true,passive:true});
  document.addEventListener('keydown',e=>{
    if(e.isTrusted&&!document.hidden){foregroundGesture=true;setAmbientSession();}
  },{capture:true});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){foregroundGesture=false;pauseAll();}
    else{foregroundGesture=false;pauseAll();setAmbientSession();}
  });
  window.addEventListener('pagehide',()=>{foregroundGesture=false;pauseAll();},{passive:true});
  setAmbientSession();

  function syncLegacyFlags(){
    const s=ensureAudioPrefs();
    s.sound=!!s.soundEnabled;
    s.music=!!s.musicEnabled;
    try{save();}catch(e){}
  }

  function enhanceAudioSettings(){
    if(currentScreen!=='settings')return;
    const s=ensureAudioPrefs();
    const setup=(sliderId,kind,label)=>{
      const slider=document.getElementById(sliderId);if(!slider)return;
      const control=slider.closest('.audio-control');if(!control)return;
      const head=control.firstElementChild;if(!head)return;
      head.classList.add('lr48-audio-head');
      const name=head.querySelector('b');if(name)name.textContent=label;
      let toggle=head.querySelector(`[data-lr48-audio-toggle="${kind}"]`);
      if(!toggle){
        toggle=document.createElement('button');
        toggle.className='mini-btn lr48-audio-toggle';
        toggle.dataset.lr48AudioToggle=kind;
        head.appendChild(toggle);
      }
      const refresh=()=>{toggle.textContent=enabled(kind)?'ON':'OFF';toggle.classList.toggle('off',!enabled(kind));};
      refresh();
      toggle.onclick=e=>{e.preventDefault();e.stopPropagation();setEnabled(kind,!enabled(kind));refresh();};
      if(!slider.dataset.lr48ExplicitToggle){
        slider.dataset.lr48ExplicitToggle='1';
        const restore=()=>queueMicrotask(()=>{syncLegacyFlags();refresh();});
        slider.addEventListener('input',restore);
        slider.addEventListener('change',restore);
      }
    };
    setup('lr2-sfx','sfx','SFX');
    setup('lr2-music','music','MUSIC');
  }

  function liveDeckDps(){
    try{
      if(typeof estimateDeckDps==='function'){
        const enemy=state.battle?.enemy;
        const ratio=enemy?.maxHp?Math.max(0,Math.min(1,Number(enemy.hp)/Number(enemy.maxHp))):1;
        return Number(estimateDeckDps(!!enemy?.target,ratio))||0;
      }
    }catch(e){}
    return deckInstances().reduce((n,c)=>n+(Number(GD.cardDps(c))||0),0)*(1+(Number(state.resolveBonus)||0));
  }
  function updateHeaderDps(){
    const el=document.getElementById('lr46-total-dps');
    if(el)el.textContent=`${GD.formatNum(liveDeckDps())} DPS`;
  }

  function injectFutureHideoutCost(){
    screen.querySelector('.lr48-future-hideout')?.remove();
    const b=state.hideoutBuild;
    if(currentScreen!=='hideout'||!b)return;
    const future=Number(b.targetLevel||0)+1;
    if(future>20)return;
    const panel=screen.querySelector('.hideout-rebuild,.lr2-hideout-panel');
    if(!panel)return;
    const row=document.createElement('div');
    row.className='stat lr48-future-hideout';
    row.innerHTML=`<small>NEXT REBUILD · LEVEL ${future}</small><b>${GD.formatNum(GD.hideoutIntelCost(future))} INTEL</b>`;
    panel.appendChild(row);
  }

  const baseRenderSettings=window.renderSettings;
  window.renderSettings=renderSettings=function(){
    const out=baseRenderSettings.apply(this,arguments);
    enhanceAudioSettings();
    return out;
  };

  const baseRenderHideout=window.renderHideout;
  window.renderHideout=renderHideout=function(){
    const out=baseRenderHideout.apply(this,arguments);
    injectFutureHideoutCost();
    return out;
  };

  const baseUpdateTopbar=window.updateTopbar;
  window.updateTopbar=updateTopbar=function(){
    const out=baseUpdateTopbar.apply(this,arguments);
    updateHeaderDps();
    return out;
  };

  const baseRender=window.render;
  window.render=render=function(){
    const out=baseRender.apply(this,arguments);
    updateHeaderDps();
    if(currentScreen==='settings')enhanceAudioSettings();
    if(currentScreen==='hideout')injectFutureHideoutCost();
    return out;
  };

  const style=document.createElement('style');
  style.textContent=`
    .lr48-audio-head{display:grid!important;grid-template-columns:1fr auto auto;align-items:center;gap:8px}
    .lr48-audio-toggle{min-width:52px!important;padding:5px 8px!important}
    .lr48-audio-toggle.off{opacity:.58}
    .lr48-future-hideout{margin-top:7px;border-color:#3b4650!important}
    .lr48-future-hideout small{font-size:8px!important}
    .lr48-future-hideout b{font-size:13px!important}
    #lr46-total-dps{max-width:108px!important}
    @media(max-width:360px){#lr46-total-dps{max-width:84px!important;font-size:9px!important}.lr48-audio-toggle{min-width:46px!important}}
  `;
  document.head.appendChild(style);

  ensureAudioPrefs();
  syncLegacyFlags();
  updateHeaderDps();
  window.LR4AudioPolicy={build:BUILD,setEnabled,enabled,pauseAll,pauseKind,liveDeckDps};
})();
