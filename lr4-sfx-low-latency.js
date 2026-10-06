(() => {
  const BUILD='LR4.14';
  const SOURCES={
    menu:'assets/audio/menu-click.ogg?v=LR4.14',
    coin:'assets/audio/coin.m4a?v=LR4.14',
    flipUp:'assets/audio/card-flip-single-up.m4a?v=LR4.14',
    flipDown:'assets/audio/card-flip-single-down.m4a?v=LR4.14',
    stack:'assets/audio/card-flip-10-stack.m4a?v=LR4.14',
    packOpen:'assets/audio/full-pack-opening.m4a?v=LR4.14'
  };
  const MATCHERS=[
    ['menu','menu-click'],
    ['coin','coin.'],
    ['flipUp','card-flip-single-up'],
    ['flipDown','card-flip-single-down'],
    ['stack','card-flip-10-stack'],
    ['packOpen','full-pack-opening']
  ];
  const buffers=new Map(),failed=new Set(),active=new Set(),nativePools=new Map();
  const AC=window.AudioContext||window.webkitAudioContext;
  let ctx=null;
  try{if(AC)ctx=new AC();}catch(e){}

  const previousMediaPlay=HTMLMediaElement.prototype.play;

  function volume(){
    if(state?.settings?.soundEnabled===false)return 0;
    if(state?.settings?.sound===false)return 0;
    return Math.max(0,Math.min(1,Number(state?.settings?.soundVolume ?? .7)||0));
  }
  function sourceOf(media){return String(media?.currentSrc||media?.src||media?.querySelector?.('source')?.src||'');}
  function kindFromUrl(url){
    const value=String(url||'').toLowerCase();
    for(const [kind,needle] of MATCHERS)if(value.includes(needle.toLowerCase()))return kind;
    return null;
  }
  function stopAll(){
    active.forEach(src=>{try{src.stop(0);}catch(e){}});
    active.clear();
  }
  function buildNativePool(kind){
    if(nativePools.has(kind))return nativePools.get(kind);
    const pool=Array.from({length:kind==='packOpen'?1:3},()=>{
      try{const a=new Audio(SOURCES[kind]);a.preload='auto';a.load();return a;}catch(e){return null;}
    }).filter(Boolean);
    nativePools.set(kind,{pool,index:0});
    return nativePools.get(kind);
  }
  function playNativeReady(kind,gain){
    const holder=buildNativePool(kind);if(!holder?.pool?.length)return false;
    for(let i=0;i<holder.pool.length;i++){
      const idx=(holder.index+i)%holder.pool.length,a=holder.pool[idx];
      if(a.readyState<2)continue;
      holder.index=(idx+1)%holder.pool.length;
      try{a.pause();a.currentTime=0;a.volume=gain;previousMediaPlay.call(a)?.catch?.(()=>{});return true;}catch(e){return false;}
    }
    return false;
  }
  function play(kind){
    const gainValue=volume();
    if(!gainValue||document.hidden)return false;
    const buffer=buffers.get(kind);
    if(ctx&&buffer&&ctx.state==='running'){
      try{
        const src=ctx.createBufferSource(),gain=ctx.createGain();
        src.buffer=buffer;gain.gain.value=gainValue;src.connect(gain).connect(ctx.destination);
        active.add(src);src.onended=()=>active.delete(src);src.start(0);return true;
      }catch(e){return false;}
    }
    /* Never schedule a source on a suspended context. That is what causes a
       backlog of taps to fire together later. A missed sound is preferable. */
    if(failed.has(kind)||!ctx)return playNativeReady(kind,gainValue);
    return false;
  }
  function warm(){
    if(document.hidden||!ctx||ctx.state!=='suspended'||volume()<=0)return;
    try{ctx.resume().catch(()=>{});}catch(e){}
  }
  function preload(){
    if(!ctx){Object.keys(SOURCES).forEach(kind=>{failed.add(kind);buildNativePool(kind);});return;}
    Object.entries(SOURCES).forEach(([kind,url])=>{
      fetch(url,{cache:'force-cache'})
        .then(r=>r.ok?r.arrayBuffer():Promise.reject(new Error('sfx fetch')))
        .then(data=>ctx.decodeAudioData(data))
        .then(buffer=>buffers.set(kind,buffer))
        .catch(()=>{failed.add(kind);buildNativePool(kind);});
    });
  }

  /* Route every legacy HTMLAudio SFX call through the decoded engine. Music is
     left on the existing media path so the LR4.8 background policy still owns it. */
  HTMLMediaElement.prototype.play=function(...args){
    const kind=kindFromUrl(sourceOf(this));
    if(kind){play(kind);return Promise.resolve();}
    return previousMediaPlay.apply(this,args);
  };

  document.addEventListener('pointerdown',warm,{capture:true,passive:true});
  document.addEventListener('keydown',warm,{capture:true});
  document.addEventListener('click',()=>{if(volume()<=0)stopAll();});
  document.addEventListener('change',()=>{if(volume()<=0)stopAll();});
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){stopAll();try{ctx?.suspend?.();}catch(e){}}
  });
  window.addEventListener('pagehide',()=>{stopAll();try{ctx?.suspend?.();}catch(e){}},{passive:true});

  preload();
  window.LR4SfxLowLatency={build:BUILD,play,warm,stopAll,ready:kind=>buffers.has(kind)};
})();
