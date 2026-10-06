(() => {
  const BUILD='LR5.3';

  /* Exact original filenames supplied by the user. */
  const ORIGINALS=Object.freeze({
    'Captain Sorn':'Captain Sorn.png',
    'Courier':'Courier.png',
    'Gate Watch':'GateWatch.png',
    'Hall Sentry':'Hall Sentry.png',
    'House Blade':'House Blade.png',
    'Keyholder':'Keyholder.png',
    'Lantern Guard':'LanternGuard.png',
    'Lookout':'Lookout.png',
    'Lord Vane':'Lord Vane.png',
    'Master Kerr':'Master Kerr.png',
    'Minister Sorn':'Minister Sorn.png',
    'Night Watch':'Night Watch.png',
    'Roof Patrol':'RoofPatrol.png',
    'Silent Guard':'Silent Guard.png',
    'The Ash Bishop':'The Ash Bishop.png',
    'The Black Clerk':'The Black Clerk.png',
    'The Bound Hand':'The Bound Hand.png',
    'The Cipher Saint':'The Cipher Saint.png',
    'The Collector':'The Collector.png',
    'The Crownless Envoy':'The Crownless Envoy.png',
    'The Glass Widow':'The Glass Widow.png',
    'The Grey Witness':'The Grey Witness.png',
    'The Last Warden':'The Last Warden.png',
    'The Ledger Warden':'The Ledger Warden.png',
    'The Memory Keeper':'The Memory Keeper.png',
    'The Nameless Keeper':'The Nameless Keeper.png',
    'The Pale Hand':'The Pale Hand.png',
    'The Quiet Judge':'The Quiet Judge.png',
    'The Red Clerk':'The Red Clerk.png',
    'Warden Vey':'The Warden Vey.png',
    'Vault Guard':'Vault Guard.png',
    'Ward Hound':'Ward Hound.png'
  });

  /* [atlas row, atlas column]. Used only if the original PNG is unavailable. */
  const ART=Object.freeze({
    'Captain Sorn':[0,0],'Courier':[0,1],'Gate Watch':[0,2],'Hall Sentry':[0,3],
    'House Blade':[1,0],'Keyholder':[1,1],'Lantern Guard':[1,2],'Lookout':[1,3],
    'Lord Vane':[2,0],'Master Kerr':[2,1],'Minister Sorn':[2,2],'Night Watch':[2,3],
    'Roof Patrol':[3,0],'Silent Guard':[3,1],'The Ash Bishop':[3,2],'The Black Clerk':[3,3],
    'The Bound Hand':[4,0],'The Cipher Saint':[4,1],'The Collector':[4,2],'The Crownless Envoy':[4,3],
    'The Glass Widow':[5,0],'The Grey Witness':[5,1],'The Last Warden':[5,2],'The Ledger Warden':[5,3],
    'The Memory Keeper':[6,0],'The Nameless Keeper':[6,1],'The Pale Hand':[6,2],'The Quiet Judge':[6,3],
    'The Red Clerk':[7,0],'Warden Vey':[7,1],'Vault Guard':[7,2],'Ward Hound':[7,3]
  });

  const PARTS=Array.from({length:8},(_,i)=>`assets/enemies/atlas/part-${i}.b64?v=${BUILD}`);
  const missingOriginals=new Set();
  let atlasPromise=null;
  let atlasSrc='';

  const originalUrl=file=>'assets/enemies/original/'+file.split('/').map(encodeURIComponent).join('/')+'?v='+BUILD;

  function currentEnemy(){
    return window.__NL?.getState?.()?.battle?.enemy||null;
  }

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
        probe.onload=()=>{atlasSrc=src;resolve(src);};
        probe.onerror=()=>reject(new Error('Enemy atlas could not be decoded.'));
        probe.src=src;
      });
    }).catch(err=>{atlasPromise=null;throw err;});

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
    box.dataset.enemyArtSource='atlas-fallback';
  }

  function fallbackToAtlas(box,name){
    const slot=ART[name];
    if(!slot){
      box.classList.remove('enemy-art-loading');
      box.classList.add('enemy-art-missing');
      box.textContent='[ ENEMY ART MISSING ]';
      console.warn(`[${BUILD}] Missing enemy art mapping:`,name);
      return;
    }
    const [row,col]=slot;
    if(atlasSrc){
      renderAtlasInto(box,name,row,col,atlasSrc);
      return;
    }
    loadAtlas().then(src=>{
      const enemy=currentEnemy();
      const currentBox=document.querySelector('.enemy-card .art-box');
      if(!currentBox||currentBox!==box||enemy?.name!==name)return;
      renderAtlasInto(currentBox,name,row,col,src);
    }).catch(err=>{
      if(box.isConnected){
        box.classList.remove('enemy-art-loading');
        box.classList.add('enemy-art-missing');
        box.textContent='[ ENEMY ART FAILED ]';
      }
      console.warn(`[${BUILD}] enemy atlas load failed`,err);
    });
  }

  function renderOriginal(box,name,file){
    const img=document.createElement('img');
    img.className='enemy-art-original';
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.decoding='async';
    img.draggable=false;

    img.onload=()=>{
      if(!img.isConnected)return;
      box.classList.remove('enemy-art-loading','enemy-art-missing');
      box.dataset.enemyArt=name;
      box.dataset.enemyArtSource='original';
    };
    img.onerror=()=>{
      if(!img.isConnected)return;
      missingOriginals.add(name);
      fallbackToAtlas(box,name);
    };

    box.classList.add('enemy-art-loading');
    box.classList.remove('enemy-art-missing');
    box.replaceChildren(img);
    box.dataset.enemyArt=name;
    box.dataset.enemyArtSource='loading-original';
    img.src=originalUrl(file);
  }

  function applyEnemyArt(){
    const enemy=currentEnemy();
    const box=document.querySelector('.enemy-card .art-box');
    if(!enemy||!box)return;

    if(box.dataset.enemyArt===enemy.name&&box.querySelector('img'))return;

    const file=ORIGINALS[enemy.name];
    if(file&&!missingOriginals.has(enemy.name)){
      renderOriginal(box,enemy.name,file);
      return;
    }
    fallbackToAtlas(box,enemy.name);
  }

  function prepareOperationLayout(){
    if(typeof currentScreen==='undefined'||currentScreen!=='battle')return;
    if(screen.querySelector(':scope > .lr52-operation-shell'))return;

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
      const preserve=typeof currentScreen!=='undefined'&&currentScreen==='battle'&&
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
    originals:ORIGINALS,
    artMap:ART,
    expectedCount:32,
    loadAtlas,
    apply:applyEnemyArt
  };
})();