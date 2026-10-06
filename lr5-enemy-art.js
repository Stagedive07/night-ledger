(() => {
  const BUILD='LR5.2';

  /* [atlas row, atlas column]. Atlas is 4 columns x 8 rows. */
  const ART=Object.freeze({
    'Captain Sorn':[0,0],
    'Courier':[0,1],
    'Gate Watch':[0,2],
    'Hall Sentry':[0,3],

    'House Blade':[1,0],
    'Keyholder':[1,1],
    'Lantern Guard':[1,2],
    'Lookout':[1,3],

    'Lord Vane':[2,0],
    'Master Kerr':[2,1],
    'Minister Sorn':[2,2],
    'Night Watch':[2,3],

    'Roof Patrol':[3,0],
    'Silent Guard':[3,1],
    'The Ash Bishop':[3,2],
    'The Black Clerk':[3,3],

    'The Bound Hand':[4,0],
    'The Cipher Saint':[4,1],
    'The Collector':[4,2],
    'The Crownless Envoy':[4,3],

    'The Glass Widow':[5,0],
    'The Grey Witness':[5,1],
    'The Last Warden':[5,2],
    'The Ledger Warden':[5,3],

    'The Memory Keeper':[6,0],
    'The Nameless Keeper':[6,1],
    'The Pale Hand':[6,2],
    'The Quiet Judge':[6,3],

    'The Red Clerk':[7,0],
    'Warden Vey':[7,1],
    'Vault Guard':[7,2],
    'Ward Hound':[7,3]
  });

  const PARTS=Array.from({length:8},(_,i)=>`assets/enemies/atlas/part-${i}.b64?v=${BUILD}`);
  let atlasPromise=null;
  let atlasSrc='';

  function loadAtlas(){
    if(atlasSrc)return Promise.resolve(atlasSrc);
    if(atlasPromise)return atlasPromise;

    atlasPromise=Promise.all(PARTS.map(url=>
      fetch(url,{cache:'force-cache'}).then(r=>{
        if(!r.ok)throw new Error(`${r.status} loading ${url}`);
        return r.text();
      })
    )).then(parts=>{
      const b64=parts.join('').replace(/\s+/g,'');
      const src=`data:image/webp;base64,${b64}`;
      return new Promise((resolve,reject)=>{
        const probe=new Image();
        probe.onload=()=>{
          atlasSrc=src;
          resolve(src);
        };
        probe.onerror=()=>reject(new Error('Enemy atlas could not be decoded.'));
        probe.src=src;
      });
    }).catch(err=>{
      atlasPromise=null;
      throw err;
    });

    return atlasPromise;
  }

  function renderAtlasInto(box,name,row,col,src){
    const img=document.createElement('img');
    img.className='enemy-art-sprite';
    img.src=src;
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.decoding='async';
    img.draggable=false;
    img.style.setProperty('--enemy-x',`${col*-25}%`);
    img.style.setProperty('--enemy-y',`${row*-12.5}%`);

    box.classList.remove('enemy-art-loading','enemy-art-missing');
    box.replaceChildren(img);
    box.dataset.enemyArt=name;
  }

  function applyEnemyArt(){
    const enemy=window.__NL?.getState?.()?.battle?.enemy;
    const box=document.querySelector('.enemy-card .art-box');
    if(!enemy||!box)return;

    const slot=ART[enemy.name];
    if(!slot){
      box.classList.remove('enemy-art-loading');
      box.classList.add('enemy-art-missing');
      box.textContent='[ ENEMY ART MISSING ]';
      console.warn(`[${BUILD}] Missing enemy art mapping:`,enemy.name);
      return;
    }

    const [row,col]=slot;
    if(atlasSrc){
      renderAtlasInto(box,enemy.name,row,col,atlasSrc);
      return;
    }

    const expectedName=enemy.name;
    box.classList.add('enemy-art-loading');
    box.classList.remove('enemy-art-missing');
    box.textContent='';

    loadAtlas().then(src=>{
      const current=window.__NL?.getState?.()?.battle?.enemy;
      const currentBox=document.querySelector('.enemy-card .art-box');
      if(!currentBox||currentBox!==box||current?.name!==expectedName)return;
      renderAtlasInto(currentBox,expectedName,row,col,src);
    }).catch(err=>{
      const currentBox=document.querySelector('.enemy-card .art-box');
      if(currentBox===box){
        box.classList.remove('enemy-art-loading');
        box.classList.add('enemy-art-missing');
        box.textContent='[ ENEMY ART FAILED ]';
      }
      console.warn(`[${BUILD}] enemy atlas load failed`,err);
    });
  }

  function prepareOperationLayout(){
    if(typeof currentScreen==='undefined'||currentScreen!=='battle')return;
    const panel=screen.querySelector('.operation-panel');
    const card=panel?.querySelector('.enemy-card');
    if(!panel||!card)return;

    const nodes=Array.from(screen.childNodes);
    const shell=document.createElement('div');
    shell.className='lr52-operation-shell';
    screen.insertBefore(shell,nodes[0]||null);
    nodes.forEach(node=>shell.appendChild(node));

    panel.insertAdjacentElement('afterend',card);
  }

  function syncOperationScroll(){
    const on=typeof currentScreen!=='undefined'&&currentScreen==='battle';
    document.body.classList.toggle('lr52-operation-scroll',on);
    if(on){
      document.body.classList.add('screen-scroll');
      document.body.classList.remove('screen-fixed');
    }
  }

  const baseRenderBattle=window.renderBattle;
  if(typeof baseRenderBattle==='function'){
    window.renderBattle=function(){
      const preserve=typeof currentScreen!=='undefined'&&
        currentScreen==='battle'&&
        document.body.classList.contains('lr52-operation-scroll');
      const oldTop=preserve?screen.scrollTop:0;

      const out=baseRenderBattle.apply(this,arguments);
      try{
        prepareOperationLayout();
        applyEnemyArt();
        syncOperationScroll();
        if(preserve){
          const max=Math.max(0,screen.scrollHeight-screen.clientHeight);
          screen.scrollTop=Math.min(oldTop,max);
        }
      }catch(err){
        console.warn(`[${BUILD}] Operation layout patch failed`,err);
      }
      return out;
    };
  }

  const baseRender=window.render;
  if(typeof baseRender==='function'){
    window.render=function(){
      const out=baseRender.apply(this,arguments);
      syncOperationScroll();
      return out;
    };
  }

  /* Start loading immediately, and repair the already-rendered first screen. */
  loadAtlas().catch(()=>{});
  try{
    if(typeof currentScreen!=='undefined'&&currentScreen==='battle'){
      prepareOperationLayout();
      applyEnemyArt();
    }
    syncOperationScroll();
  }catch(err){
    console.warn(`[${BUILD}] initial Operation patch failed`,err);
  }

  window.LR5EnemyArt={
    build:BUILD,
    artMap:ART,
    expectedCount:32,
    loadAtlas,
    apply:applyEnemyArt
  };
})();
