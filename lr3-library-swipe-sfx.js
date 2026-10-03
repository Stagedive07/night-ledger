(() => {
  const BUILD='LR3.10';
  const audio=window.LR2PackV16;
  if(!audio?.playSfx)return;
  const basePlay=audio.playSfx.bind(audio);
  let pendingLibrarySwipe=false,nextSound='flipUp',startShell=null,startX=0,startY=0;

  function externalPlay(kind){
    if(kind==='stack')return basePlay('flipDown');
    if(pendingLibrarySwipe&&(kind==='flipUp'||kind==='flipDown')){
      pendingLibrarySwipe=false;
      const chosen=nextSound;
      nextSound=nextSound==='flipUp'?'flipDown':'flipUp';
      return basePlay(chosen);
    }
    return basePlay(kind);
  }
  audio.playSfx=externalPlay;
  window.lr2PlayExactSfx=externalPlay;
  const baseUiSound=window.playUISoundV5;
  if(typeof baseUiSound==='function')window.playUISoundV5=function(kind='select'){
    if(kind==='stack')return basePlay('flipDown');
    return baseUiSound(kind);
  };

  document.addEventListener('touchstart',e=>{
    if(typeof currentScreen!=='undefined'&&currentScreen!=='library')return;
    const shell=e.target.closest?.('[data-lr216-shell]');
    if(!shell||!shell.querySelector('.copy-indicator-v6'))return;
    const p=e.touches?.[0];if(!p)return;
    startShell=shell;startX=p.clientX;startY=p.clientY;
  },{capture:true,passive:true});

  document.addEventListener('touchend',e=>{
    if(!startShell)return;
    const shell=startShell;startShell=null;
    const p=e.changedTouches?.[0];if(!p)return;
    const dx=p.clientX-startX,dy=p.clientY-startY;
    if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)&&shell.isConnected){
      pendingLibrarySwipe=true;
      setTimeout(()=>{pendingLibrarySwipe=false;},0);
    }
  },{capture:true,passive:true});

  document.addEventListener('touchcancel',()=>{startShell=null;pendingLibrarySwipe=false;},{capture:true,passive:true});
  window.LR3LibrarySwipeSfx={build:BUILD};
})();
