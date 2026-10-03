(() => {
  const TRACKS=['assets/audio/lr-a-min.m4a'];
  let players=null,active=0,index=0,crossfading=false,raf=0;
  const vol=()=>Math.max(0,Math.min(1,Number(state?.settings?.musicVolume)||0));
  function make(src){const a=new Audio(src);a.preload='auto';a.loop=false;a.volume=0;a.addEventListener('timeupdate',check);a.addEventListener('ended',()=>{if(!crossfading)restartFallback();});return a;}
  function init(){if(players)return;players=[make(TRACKS[0]),make(TRACKS[TRACKS.length>1?1:0])];}
  function stop(){if(!players)return;players.forEach(a=>a.pause());cancelAnimationFrame(raf);crossfading=false;}
  function ensure(){init();const v=vol();if(v<=0){stop();return;}const a=players[active];if(a.paused){a.volume=v;try{a.currentTime=Math.max(0,a.currentTime||0)}catch(e){};a.play().catch(()=>{});}else if(!crossfading)a.volume=v;}
  function prepareNext(to){const next=(index+1)%TRACKS.length;if(!to.src.endsWith(TRACKS[next]))to.src=TRACKS[next];try{to.currentTime=0}catch(e){}return next;}
  function check(){if(crossfading||vol()<=0||!players)return;const from=players[active];if(!Number.isFinite(from.duration)||from.duration<=10)return;if(from.duration-from.currentTime<=10)begin();}
  function begin(){if(crossfading||!players)return;crossfading=true;const fromIdx=active,toIdx=1-fromIdx,from=players[fromIdx],to=players[toIdx],next=prepareNext(to);to.volume=0;to.play().catch(()=>{});const started=performance.now(),duration=10000;const frame=t=>{const p=Math.max(0,Math.min(1,(t-started)/duration)),v=vol();from.volume=v*(1-p);to.volume=v*p;if(p<1&&v>0){raf=requestAnimationFrame(frame);return;}from.pause();try{from.currentTime=0}catch(e){}active=toIdx;index=next;to.volume=v;crossfading=false;};raf=requestAnimationFrame(frame);}
  function restartFallback(){if(!players)return;const to=1-active,next=prepareNext(players[to]);players[to].volume=vol();players[to].play().catch(()=>{});active=to;index=next;}
  document.addEventListener('pointerdown',ensure,{passive:true});document.addEventListener('touchstart',ensure,{passive:true});
  const oldRender=window.renderSettings; if(typeof oldRender==='function')window.renderSettings=function(){const r=oldRender.apply(this,arguments),slider=document.getElementById('lr2-music');if(slider&&!slider.dataset.v16){slider.dataset.v16='1';slider.addEventListener('input',()=>setTimeout(ensure,0));}return r;};
  window.LR2MusicV16={ensure,stop,tracks:TRACKS};
})();