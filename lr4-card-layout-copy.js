(() => {
  const BUILD='LR4.12';

  function pct(v){
    const n=(Number(v)||0)*100;
    return `${n<1?n.toFixed(1):Number.isInteger(n)?n.toFixed(0):n.toFixed(1)}%`;
  }

  function conciseAbilityText(def,inst=null){
    const a=def?.ability;
    if(!a)return'';
    let v=Number(a.value)||0;
    if(a.zone==='syndicate'&&inst&&window.LR2SyndicateR6?.supportValue){
      v=Number(window.LR2SyndicateR6.supportValue(inst))||v;
    }
    const p=pct(v);

    switch(a.name){
      case'Contract Killer':return `+${p} damage to targets.`;
      case'Opening Strike':return `+${p} damage above 80% HP.`;
      case'Finisher':return `+${p} damage below 30% HP.`;
      case'Double Strike':return `${p} chance to strike twice.`;
      case'Momentum':return `+${p} damage per kill, up to 10.`;
      case'Patient Killer':return `+${p} damage/sec vs same target.`;
      case'Eviscerate':return `${p} chance/sec for a 5x strike.`;
      case'Execute':return `${p} chance/sec to execute weakened enemies.`;
      case'Shortcut':return `${p} chance to skip an encounter after a kill.`;
      case'Sabotage':return `Targets start with ${p} less HP.`;
      case'Inside Man':return `Start Operations +1 encounter.`;
      case'Contract Insight':return `+${p} Intel from targets.`;
      case'Architect':return `+${p} Hideout build speed.`;
      case'Broker':return `-${p} pack cost.`;
      case'Appraiser':return `+${p} higher-tier card chance.`;
      case'Salvager':return `+${p} sale refunds.`;
      case'Bookkeeper':return `+${p} Gold active + offline.`;
      case'Informant':return `+${p} Intel active + offline.`;
      case'Hideout Keeper':return `+${v.toFixed(2)} hr offline rewards.`;
      default:return a.text||'';
    }
  }

  function decorateCard(card,inst=null){
    if(!card)return;
    const art=card.querySelector('.game-card-art');
    const head=card.querySelector('.game-card-head');
    if(!art||!head)return;

    const level=card.querySelector('.game-card-level');
    if(level){
      level.classList.remove('lr412-art-level');
      level.classList.add('lr412-head-level');
      if(level.parentElement!==head)head.appendChild(level);
    }

    const stat=card.querySelector('.game-card-dps');
    if(stat){
      stat.classList.add('lr412-art-stat');
      if(stat.parentElement!==art)art.appendChild(stat);
    }

    const def=inst?getDef(inst):null;
    const ability=card.querySelector('.game-card-ability');
    if(ability&&def?.ability){
      ability.innerHTML=`<b>${escapeHtml(def.ability.name)}</b>${escapeHtml(conciseAbilityText(def,inst))}`;
    }
  }

  function markupWithNewLayout(html,inst){
    try{
      const tpl=document.createElement('template');
      tpl.innerHTML=html;
      decorateCard(tpl.content.querySelector('.game-card'),inst);
      return tpl.innerHTML;
    }catch(e){return html;}
  }

  const baseMarkup=window.gameCardMarkup||gameCardMarkup;
  window.gameCardMarkup=gameCardMarkup=function(inst,opts={}){
    return markupWithNewLayout(baseMarkup.call(this,inst,opts),inst);
  };

  const baseShowDefinitionDetail=window.showDefinitionDetail;
  if(typeof baseShowDefinitionDetail==='function'){
    window.showDefinitionDetail=showDefinitionDetail=function(defId,instId=null){
      const out=baseShowDefinitionDetail.apply(this,arguments);
      const uid=instId||window.LR216?.detailUid;
      const inst=uid?getInstance(uid):null;
      const def=inst?getDef(inst):GD.CARD_MAP?.[defId];
      const p=modalRoot.querySelector('.lr-detail-ability p');
      if(p&&def?.ability)p.textContent=conciseAbilityText(def,inst);
      modalRoot.querySelectorAll('.game-card').forEach(card=>decorateCard(card,inst));
      return out;
    };
  }

  document.querySelectorAll('.game-card').forEach(card=>decorateCard(card,null));

  const style=document.createElement('style');
  style.textContent=`
    .game-card-head{position:relative!important;height:auto!important;min-height:0!important;overflow:visible!important;padding-right:54px!important}
    .game-card-head .lr412-head-level{
      position:absolute!important;
      right:5px!important;
      bottom:5px!important;
      top:auto!important;
      left:auto!important;
      z-index:8!important;
      width:auto!important;
      height:auto!important;
      margin:0!important;
      padding:2px 5px!important;
      background:rgba(9,12,15,.88)!important;
      border:1px solid rgba(184,190,197,.45)!important;
      line-height:1.05!important;
      white-space:nowrap!important;
      font-size:10px!important;
      pointer-events:none!important;
    }

    .game-card-art{position:relative!important;overflow:hidden}
    .game-card-art .lr412-art-stat{
      position:absolute!important;
      right:5px!important;
      bottom:5px!important;
      left:auto!important;
      top:auto!important;
      z-index:8!important;
      width:auto!important;
      height:auto!important;
      margin:0!important;
      padding:3px 6px!important;
      background:rgba(9,12,15,.90)!important;
      border:1px solid rgba(184,190,197,.55)!important;
      line-height:1.05!important;
      white-space:nowrap!important;
      font-size:10px!important;
      pointer-events:none!important;
    }

    .game-card-bottom{height:auto!important;min-height:0!important;overflow:visible!important;padding-bottom:8px!important}
    .game-card-ability,.game-card-lore{max-height:none!important;overflow:visible!important;-webkit-line-clamp:unset!important;line-clamp:unset!important}

    .game-card-name{white-space:normal!important;overflow:visible!important;text-overflow:clip!important;max-width:none!important;-webkit-line-clamp:unset!important;line-clamp:unset!important;overflow-wrap:anywhere!important}

    @media(min-width:500px){
      .game-card-head .lr412-head-level,.game-card-art .lr412-art-stat{font-size:12px!important;padding:4px 7px!important}
      .game-card-head{padding-right:66px!important}
    }
  `;
  document.head.appendChild(style);

  window.LR4CardLayoutCopy={build:BUILD,conciseAbilityText,decorateCard};
})();
