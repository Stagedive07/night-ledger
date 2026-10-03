(() => {
  const BUILD='LR3.7';
  const audio=window.LR2PackV16;
  if(!audio?.playSfx)return;
  const basePlay=audio.playSfx.bind(audio);
  let pendingLibrarySwipe=false,nextSound='flipUp',startShell=null,startX=0,startY=0;

  audio.playSfx=function(kind){
    if(pendingLibrarySwipe&&(kind==='flipUp'||kind==='flipDown')){
      pendingLibrarySwipe=false;
      const chosen=nextSound;
      nextSound=nextSound==='flipUp'?'flipDown':'flipUp';
      return basePlay(chosen);
    }
    return basePlay(kind);
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
