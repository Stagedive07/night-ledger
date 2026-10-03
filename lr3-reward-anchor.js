(() => {
  const BUILD='LR3.5';

  function navHost(){return document.querySelector('.bottom-nav');}
  function anchorRewardFeed(){
    const host=document.getElementById('lr-global-reward-feed');
    const nav=navHost();
    if(!host||!nav||host.parentElement===nav)return;
    nav.appendChild(host);
  }

  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(!(node instanceof Element))continue;
        if(node.id==='lr-global-reward-feed'||node.querySelector?.('#lr-global-reward-feed')){
          anchorRewardFeed();
          return;
        }
      }
    }
  });

  function start(){
    anchorRewardFeed();
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.body)start();
  else document.addEventListener('DOMContentLoaded',start,{once:true});

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function')renderSettings=window.renderSettings=function(){
    const out=baseSettings.apply(this,arguments);
    const stamp=document.getElementById('lr-build-stamp');
    if(stamp){const target=stamp.querySelector('span')||stamp;target.textContent=BUILD;}
    return out;
  };

  window.LR3RewardAnchor={build:BUILD,anchorRewardFeed};
})();
