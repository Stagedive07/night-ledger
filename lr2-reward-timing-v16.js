(() => {
  // Existing combat code creates the reward popup and schedules an early removal.
  // Take ownership of each popup at the 2s mark so it can fade for a full second.
  const seen=new WeakSet();

  function ownReward(el){
    if(!el||seen.has(el))return;
    seen.add(el);
    setTimeout(()=>{
      if(!el.isConnected)return;
      const clone=el.cloneNode(true);
      clone.classList.add('show');
      clone.style.transition='opacity 1s ease, transform .22s ease';
      el.replaceWith(clone);
      requestAnimationFrame(()=>{
        requestAnimationFrame(()=>clone.classList.remove('show'));
      });
      setTimeout(()=>clone.remove(),1000);
    },2000);
  }

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof Element))continue;
        if(node.matches?.('.lr-reward-pop'))ownReward(node);
        node.querySelectorAll?.('.lr-reward-pop').forEach(ownReward);
      }
    }
  });

  function start(){
    observer.observe(document.body,{childList:true,subtree:true});
    document.querySelectorAll('.lr-reward-pop').forEach(ownReward);
  }

  if(document.body)start();
  else document.addEventListener('DOMContentLoaded',start,{once:true});
})();