(() => {
  const BUILD='LR4.7';

  /*
    V6 marks every non-Deck/Library screen as screen-fixed and styles that state
    with overflow:hidden!important. Hideout now contains more content than one
    viewport, so make it an explicit scrollable screen after the older render
    wrappers finish applying their body classes.
  */
  function applyHideoutScrollMode(){
    const on=currentScreen==='hideout';
    document.body.classList.toggle('lr47-hideout-scroll',on);
    if(on){
      document.body.classList.add('screen-scroll');
      document.body.classList.remove('screen-fixed');
      screen.classList.add('lr47-hideout-scroll-screen');
    }else{
      screen.classList.remove('lr47-hideout-scroll-screen');
    }
  }

  const baseRender=window.render||render;
  window.render=render=function(){
    const preserve=currentScreen==='hideout'&&document.body.classList.contains('lr47-hideout-scroll');
    const oldScroll=preserve?screen.scrollTop:0;
    const out=baseRender.apply(this,arguments);
    applyHideoutScrollMode();
    if(preserve&&oldScroll>0){
      requestAnimationFrame(()=>{
        if(currentScreen==='hideout')screen.scrollTop=oldScroll;
      });
    }
    return out;
  };

  /* Also cover direct Hideout renders that bypass the top-level render(). */
  const baseRenderHideout=window.renderHideout;
  if(typeof baseRenderHideout==='function'){
    window.renderHideout=renderHideout=function(){
      const oldScroll=currentScreen==='hideout'?screen.scrollTop:0;
      const out=baseRenderHideout.apply(this,arguments);
      applyHideoutScrollMode();
      if(oldScroll>0)requestAnimationFrame(()=>{if(currentScreen==='hideout')screen.scrollTop=oldScroll;});
      return out;
    };
  }

  const style=document.createElement('style');
  style.textContent=`
    body.lr47-hideout-scroll .screen,
    body.lr47-hideout-scroll.screen-scroll .screen,
    body.lr47-hideout-scroll .screen.lr47-hideout-scroll-screen{
      overflow-y:auto!important;
      overflow-x:hidden!important;
      -webkit-overflow-scrolling:touch!important;
      touch-action:pan-y!important;
      overscroll-behavior-y:contain!important;
    }
    body.lr47-hideout-scroll .screen{padding-bottom:48px!important}
  `;
  document.head.appendChild(style);

  applyHideoutScrollMode();
  window.LR4HideoutScrollFix={build:BUILD,applyHideoutScrollMode};
})();
