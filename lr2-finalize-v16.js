(() => {
  // The reveal card's frame identifies the booster/deck it came from, not the rolled card tier.
  const baseStartReveal=window.startReveal;
  if(typeof baseStartReveal==='function'){
    window.startReveal=function(packTier,...args){
      const accent=GD.tierData(packTier)?.accent||'#73777f';
      const result=baseStartReveal.call(this,packTier,...args);
      const stack=document.getElementById('reveal-stack');
      if(!stack)return result;
      const apply=()=>stack.querySelectorAll('.reveal-front .game-card').forEach(card=>card.style.setProperty('border-color',accent,'important'));
      apply();
      const observer=new MutationObserver(apply);
      observer.observe(stack,{childList:true,subtree:true});
      const stop=()=>{try{observer.disconnect();}catch(e){}};
      stack.addEventListener('DOMNodeRemoved',e=>{if(e.target===stack)stop();},{once:true});
      setTimeout(stop,120000);
      return result;
    };
  }
})();