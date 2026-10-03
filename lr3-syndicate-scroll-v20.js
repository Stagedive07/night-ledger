(() => {
  const BUILD='LR3.21';
  const baseRender=window.render;
  if(typeof baseRender!=='function')return;

  window.render=render=function(){
    const out=baseRender.apply(this,arguments);
    // These screens can exceed the phone viewport and must remain independently scrollable.
    const shouldScroll=currentScreen==='deck'||currentScreen==='library'||currentScreen==='syndicate'||currentScreen==='settings';
    document.body.classList.toggle('screen-scroll',shouldScroll);
    document.body.classList.toggle('screen-fixed',!shouldScroll);
    return out;
  };

  window.LR3SyndicateScroll={build:BUILD};
})();
