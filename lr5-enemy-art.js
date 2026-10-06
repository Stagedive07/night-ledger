(() => {
  const BUILD='LR5.1';

  /* Every current Operation enemy/target has an explicit art slot.
     Arrays are [sprite sheet, zero-based cell]. */
  const ART=Object.freeze({
    'Captain Sorn':[1,0],
    'Courier':[1,1],
    'Gate Watch':[1,2],
    'Hall Sentry':[1,3],

    'House Blade':[2,0],
    'Keyholder':[2,1],
    'Lantern Guard':[2,2],
    'Lookout':[2,3],

    'Lord Vane':[3,0],
    'Master Kerr':[3,1],
    'Minister Sorn':[3,2],
    'Night Watch':[3,3],

    'Roof Patrol':[4,0],
    'Silent Guard':[4,1],
    'The Ash Bishop':[4,2],
    'The Black Clerk':[4,3],

    'The Bound Hand':[5,0],
    'The Cipher Saint':[5,1],
    'The Collector':[5,2],
    'The Crownless Envoy':[5,3],

    'The Glass Widow':[6,0],
    'The Grey Witness':[6,1],
    'The Last Warden':[6,2],
    'The Ledger Warden':[6,3],

    'The Memory Keeper':[7,0],
    'The Nameless Keeper':[7,1],
    'The Pale Hand':[7,2],
    'The Quiet Judge':[7,3],

    'The Red Clerk':[8,0],
    'Warden Vey':[8,1],
    'Vault Guard':[8,2],
    'Ward Hound':[8,3]
  });

  const spriteUrl=sheet=>`assets/enemies/enemies-${sheet}.png?v=${BUILD}`;

  /* These eight optimized sheets contain all 32 required pieces of art. */
  const preload=new Set();
  Object.values(ART).forEach(([sheet])=>{
    if(preload.has(sheet))return;
    preload.add(sheet);
    const img=new Image();
    img.decoding='async';
    img.src=spriteUrl(sheet);
  });

  function applyEnemyArt(){
    const enemy=window.__NL?.getState?.()?.battle?.enemy;
    const box=document.querySelector('.enemy-card .art-box');
    if(!enemy||!box)return;

    const slot=ART[enemy.name];
    if(!slot){
      box.classList.add('enemy-art-missing');
      box.textContent='[ ENEMY ART MISSING ]';
      console.warn(`[${BUILD}] Missing enemy art mapping:`,enemy.name);
      return;
    }

    const [sheet,cell]=slot;
    const img=document.createElement('img');
    img.className='enemy-art-sprite';
    img.src=spriteUrl(sheet);
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.decoding='async';
    img.draggable=false;
    img.style.setProperty('--enemy-cell',String(cell));

    box.classList.remove('enemy-art-missing');
    box.replaceChildren(img);
    box.dataset.enemyArt=enemy.name;
  }

  const baseRenderBattle=window.renderBattle;
  if(typeof baseRenderBattle==='function'){
    window.renderBattle=function(){
      const out=baseRenderBattle.apply(this,arguments);
      try{applyEnemyArt()}catch(err){console.warn(`[${BUILD}] enemy art render failed`,err)}
      return out;
    };
  }

  try{applyEnemyArt()}catch(err){console.warn(`[${BUILD}] initial enemy art render failed`,err)}

  window.LR5EnemyArt={
    build:BUILD,
    artMap:ART,
    apply:applyEnemyArt,
    expectedCount:32
  };
})();
