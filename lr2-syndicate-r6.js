(() => {
  const BUILD='LR2.16r6';
  const ROLL_MIN=.97,ROLL_MAX=1.03,LEVEL_STEP=.0025;
  const SYN_KEYS={Architect:'architect',Broker:'broker',Appraiser:'appraiser',Salvager:'salvager',Bookkeeper:'bookkeeper',Informant:'informant','Hideout Keeper':'hideoutKeeper'};

  function supportDef(inst){
    const def=inst?getDef(inst):null;
    return def?.ability?.zone==='syndicate'?def:null;
  }
  function ensureRoll(inst,random=true){
    if(!supportDef(inst))return 1;
    let q=Number(inst.supportRoll);
    if(!Number.isFinite(q)||q<ROLL_MIN||q>ROLL_MAX){
      q=ROLL_MIN+(random?Math.random():.5)*(ROLL_MAX-ROLL_MIN);
      inst.supportRoll=q;
      inst.supportRollVersion=1;
    }
    return q;
  }
  function levelScale(inst){return 1+LEVEL_STEP*Math.max(0,(Number(inst?.level)||1)-1);}
  function supportValue(inst){
    const def=supportDef(inst);if(!def)return 0;
    return Number(def.ability.value||0)*ensureRoll(inst)*levelScale(inst);
  }
  function supportLevel1Value(inst){
    const def=supportDef(inst);if(!def)return 0;
    return Number(def.ability.value||0)*ensureRoll(inst);
  }
  function pct(v){return `${(v*100).toFixed(2)}%`;}
  function valueLabel(inst){
    const def=supportDef(inst);if(!def)return '';
    const v=supportValue(inst);
    return def.ability.name==='Hideout Keeper'?`${v.toFixed(2)} HR`:pct(v);
  }
  function supportText(inst){
    const def=supportDef(inst);if(!def)return '';
    const a=def.ability,v=supportValue(inst),p=pct(v);
    switch(a.name){
      case'Architect':return `Hideout construction is ${p} faster.`;
      case'Broker':return `Deck Booster Packs cost ${p} fewer Whispers.`;
      case'Appraiser':return `Improves the chance of finding higher-tier cards by ${p}.`;
      case'Salvager':return `Selling cards refunds ${p} more Whispers.`;
      case'Bookkeeper':return `+${p} Gold from Operations and while you are away.`;
      case'Informant':return `+${p} Intel from Operations and while you are away.`;
      case'Hideout Keeper':return `Offline rewards continue accumulating for ${v.toFixed(2)} additional hours.`;
      default:return a.text||'';
    }
  }

  let migrated=false;
  (state.inventory||[]).forEach(inst=>{
    if(supportDef(inst)&&(!Number.isFinite(Number(inst.supportRoll))||Number(inst.supportRoll)<ROLL_MIN||Number(inst.supportRoll)>ROLL_MAX)){
      ensureRoll(inst,true);migrated=true;
    }
  });
  if(migrated)save();

  const baseCreate=window.createCardInstance||createCardInstance;
  createCardInstance=window.createCardInstance=function(def,packTier,packPrice){
    const inst=baseCreate(def,packTier,packPrice);
    if(def?.ability?.zone==='syndicate')ensureRoll(inst,true);
    return inst;
  };

  const baseCardDps=GD.cardDps.bind(GD);
  GD.cardDps=function(inst){
    return supportDef(inst)?supportValue(inst):baseCardDps(inst);
  };

  const baseEffects=window.effectTotals||effectTotals;
  effectTotals=window.effectTotals=function(){
    const t=baseEffects();
    t.architect=0;t.broker=0;t.appraiser=0;t.salvager=0;t.bookkeeper=0;t.informant=0;t.hideoutKeeper=0;
    syndicateInstances().forEach(inst=>{
      const def=supportDef(inst);if(!def)return;
      const key=SYN_KEYS[def.ability.name];if(key)t[key]+=supportValue(inst);
    });
    t.architect=Math.min(.40,t.architect);
    t.broker=Math.min(.25,t.broker);
    t.appraiser=Math.min(.25,t.appraiser);
    t.bookkeeper=Math.min(.75,t.bookkeeper);
    t.informant=Math.min(.50,t.informant);
    t.salvager=Math.min(1,t.salvager);
    t.hideoutKeeper=Math.min(GD.MAX_OFFLINE_HOURS-GD.BASE_OFFLINE_HOURS,t.hideoutKeeper);
    return t;
  };

  const baseMarkup=window.gameCardMarkup||gameCardMarkup;
  gameCardMarkup=window.gameCardMarkup=function(inst,opts={}){
    let html=baseMarkup(inst,opts);
    const def=supportDef(inst);if(!def)return html;
    if(!opts.hideAbilityText&&def.ability.text){
      const oldText=escapeHtml(def.ability.text),newText=escapeHtml(supportText(inst));
      if(html.includes(oldText))html=html.replace(oldText,newText);
    }
    const effect=`<div class="game-card-dps support-effect">EFFECT ${escapeHtml(valueLabel(inst))}</div>`;
    html=html.replace(/<div class="game-card-dps">[\s\S]*?<\/div>/,effect);
    return html;
  };

  const baseShowDefinitionDetail=window.showDefinitionDetail||showDefinitionDetail;
  showDefinitionDetail=window.showDefinitionDetail=function(defId,instId=null){
    const out=baseShowDefinitionDetail(defId,instId);
    const uid=instId||window.LR216?.detailUid;
    const inst=uid?getInstance(uid):null;
    if(!supportDef(inst))return out;
    modalRoot.querySelectorAll('.detail-stat').forEach(stat=>{
      const label=stat.querySelector('small');
      if(label&&label.textContent.trim()==='CURRENT DPS'){
        label.textContent='SUPPORT EFFECT';
        const b=stat.querySelector('b');if(b)b.textContent=valueLabel(inst);
      }
    });
    const ability=modalRoot.querySelector('.lr-detail-ability p');
    if(ability)ability.textContent=supportText(inst);
    return out;
  };

  const baseRenderSyndicate=window.renderSyndicate||renderSyndicate;
  renderSyndicate=window.renderSyndicate=function(){
    const out=baseRenderSyndicate.apply(this,arguments);
    const e=effectTotals();
    const values={
      'Build Speed':`-${pct(e.architect)}`,
      'Pack Cost':`-${pct(e.broker)}`,
      'Card Quality':`+${pct(e.appraiser)}`,
      'Sale Return':`+${pct(e.salvager)}`
    };
    screen.querySelectorAll('.syndicate-stats-v6 .stat').forEach(stat=>{
      const label=stat.querySelector('small')?.textContent?.trim();
      if(label&&values[label]){const b=stat.querySelector('b');if(b)b.textContent=values[label];}
    });
    const intro=screen.querySelector('.syndicate-panel-v6 > p');
    if(intro)intro.textContent='Support operatives work from the Hideout. Their Level 1 effect is individually rolled, then improves slightly with each level.';
    return out;
  };

  autoFillSyndicate=window.autoFillSyndicate=function(){
    const slots=GD.syndicateSlots(state.hideoutLevel),candidates=state.inventory.filter(c=>isSyndicateDef(getDef(c))),seen=new Set(),chosen=[];
    candidates.sort((a,b)=>b.tier-a.tier||supportValue(b)-supportValue(a));
    candidates.forEach(c=>{const n=getDef(c).ability.name;if(chosen.length<slots&&!seen.has(n)){chosen.push(c.uid);seen.add(n);}});
    candidates.forEach(c=>{if(chosen.length<slots&&!chosen.includes(c.uid))chosen.push(c.uid);});
    state.syndicate=chosen.slice(0,slots);save();render();
  };

  window.LR2SyndicateR6={build:BUILD,rollMin:ROLL_MIN,rollMax:ROLL_MAX,levelStep:LEVEL_STEP,supportValue,supportLevel1Value,valueLabel,supportText,ensureRoll};
  if(window.__NL){window.__NL.effectTotals=effectTotals;window.__NL.autoFillSyndicate=autoFillSyndicate;}

  const baseSettings=window.renderSettings;
  if(typeof baseSettings==='function')window.renderSettings=function(){
    const out=baseSettings.apply(this,arguments);
    const stamp=document.getElementById('lr-build-stamp');if(stamp){const s=stamp.querySelector('span')||stamp;s.textContent=BUILD;}
    return out;
  };
})();
