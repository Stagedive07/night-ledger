(() => {
  const BUILD='LR4.6';
  let currentBuild=BUILD;

  /* Six Syndicate operatives are available as soon as the Syndicate itself is
     unlocked. Hideout level no longer changes the slot count. */
  GD.syndicateSlots=function(){return 6;};

  function totalDeckDps(){
    const cards=deckInstances();
    if(!cards.length)return 0;
    const base=cards.reduce((sum,inst)=>sum+(Number(GD.cardDps(inst))||0),0);
    return base*(1+(Number(state.resolveBonus)||0));
  }

  function ensureDpsHeader(){
    const copy=document.querySelector('.topbar .brand-copy');
    if(!copy)return null;
    if(!copy.classList.contains('lr46-dps-copy')){
      copy.classList.add('lr46-dps-copy');
      copy.innerHTML='<small>TOTAL DPS</small><b id="lr46-total-dps">0</b>';
    }
    return document.getElementById('lr46-total-dps');
  }

  function updateGlobalDps(){
    const el=ensureDpsHeader();
    if(el)el.textContent=GD.formatNum(totalDeckDps());
  }

  const baseUpdateTopbar=updateTopbar;
  updateTopbar=window.updateTopbar=function(){
    const out=baseUpdateTopbar.apply(this,arguments);
    updateGlobalDps();
    return out;
  };

  function intelPerHour(){
    if(!state.firstPackOpened||!deckInstances().length)return 0;
    const op=Math.max(1,Number(state.highestCleared||state.currentOperation)||1);
    const hp=Math.max(1,Number(GD.normalEnemyHp(op))||1);
    const dps=Math.max(1,totalDeckDps());
    const ttk=Math.max(.5,hp/dps);
    const kills=3600/ttk;
    return kills*(Number(GD.normalIntel(op))||0)*(1+(Number(effectTotals().informant)||0));
  }

  function networkStrip(){
    const panel=document.createElement('div');
    panel.className='pixel-panel tight lr46-network-strip';
    panel.innerHTML=`<div class="lr46-network-title">NETWORK OUTPUT</div><div class="lr46-network-stats"><div class="stat"><small>WHISPERS / HR</small><b>${GD.formatNum(whisperRate())}</b></div><div class="stat"><small>INTEL / HR</small><b>${GD.formatNum(intelPerHour())}</b></div></div>`;
    return panel;
  }

  const baseRenderHideout=renderHideout;
  renderHideout=window.renderHideout=function(){
    const out=baseRenderHideout.apply(this,arguments);
    if(!state.unlocks.hideout)return out;
    screen.querySelector('.lr46-network-strip')?.remove();
    screen.prepend(networkStrip());
    return out;
  };

  /* Card detail can be dismissed by tapping the backdrop. Explicit CLOSE stays
     available as a fallback and other modal types keep their existing behavior. */
  modalRoot.addEventListener('click',e=>{
    const backdrop=e.target?.classList?.contains('modal-backdrop')?e.target:null;
    if(!backdrop)return;
    const cardDetail=backdrop.querySelector('.lr216-card-detail,.card-detail');
    if(!cardDetail)return;
    modalRoot.innerHTML='';
    modalOpen=false;
  });

  function updateBuildStamp(){
    window.LR_BUILD=currentBuild;
    const stamp=document.getElementById('lr-build-stamp');
    if(stamp){
      const value=stamp.querySelector('span')||stamp;
      value.textContent=currentBuild;
      return;
    }
    if(currentScreen!=='settings')return;
    const host=screen.querySelector('.more-settings-v6');
    if(!host)return;
    const row=document.createElement('div');
    row.className='setting';
    row.id='lr-build-stamp';
    row.innerHTML=`<b>BUILD</b><span style="font-weight:900">${escapeHtml(currentBuild)}</span>`;
    host.appendChild(row);
  }

  const baseRenderSettings=renderSettings;
  renderSettings=window.renderSettings=function(){
    const out=baseRenderSettings.apply(this,arguments);
    updateBuildStamp();
    return out;
  };

  fetch(`build-version.txt?t=${Date.now()}`,{cache:'no-store'})
    .then(r=>r.ok?r.text():BUILD)
    .then(v=>{
      const latest=String(v||'').trim();
      if(latest)currentBuild=latest;
      updateBuildStamp();
    })
    .catch(()=>updateBuildStamp());

  const baseRender=render;
  render=window.render=function(){
    const out=baseRender.apply(this,arguments);
    updateGlobalDps();
    if(currentScreen==='settings')updateBuildStamp();
    return out;
  };

  const style=document.createElement('style');
  style.textContent=`
    .topbar .brand-copy.lr46-dps-copy{min-width:0;align-items:flex-start}
    .topbar .brand-copy.lr46-dps-copy small{font-size:7px;color:var(--muted);letter-spacing:.08em;margin:0 0 2px}
    .topbar .brand-copy.lr46-dps-copy b{font-size:12px;letter-spacing:.02em;max-width:88px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .lr46-network-strip{margin-bottom:8px!important;padding:7px!important}
    .lr46-network-title{font-size:8px;color:var(--muted);letter-spacing:.08em;margin-bottom:5px}
    .lr46-network-stats{display:grid;grid-template-columns:1fr 1fr;gap:5px}
    .lr46-network-stats .stat{padding:6px}
    .lr46-network-stats .stat small{font-size:7px}
    .lr46-network-stats .stat b{font-size:12px}
    @media(max-width:360px){
      .topbar .brand-copy.lr46-dps-copy b{font-size:10px;max-width:68px}
      .topbar .brand-copy.lr46-dps-copy small{font-size:6px}
    }
  `;
  document.head.appendChild(style);

  updateGlobalDps();
  updateBuildStamp();
  window.LR4GlobalUI={build:BUILD,totalDeckDps,intelPerHour,updateGlobalDps};
})();
