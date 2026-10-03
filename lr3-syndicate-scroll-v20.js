(() => {
  const BUILD='LR3.20';
  const baseRender=window.render;
  if(typeof baseRender!=='function')return;

  window.render=render=function(){
    const out=baseRender.apply(this,arguments);
    const shouldScroll=currentScreen==='deck'||currentScreen==='library'||currentScreen==='syndicate';
    document.body.classList.toggle('screen-scroll',shouldScroll);
    document.body.classList.toggle('screen-fixed',!shouldScroll);
    return out;
  };

  window.LR3SyndicateScroll={build:BUILD};
})();
