(() => {
  const CARD_ART = {
    't1-c01': 'assets/card-art/ratknife.png',
    't1-c02': 'assets/card-art/mira-voss.png',
    't1-c03': 'assets/card-art/the-candleman.png',
    't1-c04': 'assets/card-art/alley-surgeon.png'
  };

  gameCardMarkup = function(inst, opts={}) {
    if (!inst) return '';
    const def = getDef(inst), td = GD.tierData(inst.tier);
    const compact = !!opts.compact;
    const showNew = opts.showNew ?? !!inst.isNew;
    const showLevel = opts.showLevel ?? true;
    const ability = def?.ability ? `<div class="game-card-ability"><b>${escapeHtml(def.ability.name)}</b>${escapeHtml(def.ability.text)}</div>` : '';
    const lore = def?.lore ? `<div class="game-card-lore">${escapeHtml(def.lore)}</div>` : '';
    const artSrc = CARD_ART[def?.id];
    const art = artSrc
      ? `<img src="${artSrc}" alt="${escapeHtml(def.name)}" loading="lazy" draggable="false">`
      : '[ CARD ART TBD ]';
    return `<div class="game-card ${compact?'compact':''} ${inst.holo?'holo':''}" style="border-color:${td.accent}">${inst.holo?'<span class="holo-tag">HOLO</span>':''}${showNew?'<span class="new-tag">NEW</span>':''}<div class="game-card-head"><div class="game-card-name">${escapeHtml(def.name)}</div><div class="game-card-deck" style="color:${td.accent}">${td.name.toUpperCase()} DECK</div></div><div class="game-card-art">${art}</div><div class="game-card-bottom">${ability}${lore}${showLevel?`<div class="game-card-level">LV ${inst.level}</div>`:''}<div class="game-card-dps">DPS ${GD.formatNum(inst.baseDps)}</div></div></div>`;
  };

  deckCardGridMarkup = function(cards, total=10, opts={}) {
    const allowLevel = opts.allowLevel !== false;
    return Array.from({length:total}, (_,i) => {
      const inst = cards[i];
      if (!inst) return `<div class="deck-card-cell empty">EMPTY</div>`;
      const cost = inst.level < GD.CARD_LEVEL_CAP ? GD.cardLevelCost(inst.tier, inst.level) : 0;
      const levelLabel = inst.level >= GD.CARD_LEVEL_CAP ? 'MAX LEVEL' : `LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`;
      return `<div class="deck-card-cell"><button class="deck-card-tap" data-card-detail="${inst.uid}" aria-label="View ${escapeHtml(getDef(inst)?.name||'card')}">${gameCardMarkup(inst,{compact:true,showNew:false})}</button>${allowLevel?`<button class="deck-level-btn" data-deck-level="${inst.uid}" ${state.gold<cost||inst.level>=GD.CARD_LEVEL_CAP?'disabled':''}>${levelLabel}</button>`:''}</div>`;
    }).join('');
  };

  renderInventoryRow = function(inst) {
    const def=getDef(inst), td=GD.tierData(inst.tier), cost=inst.level<GD.CARD_LEVEL_CAP?GD.cardLevelCost(inst.tier,inst.level):0, zone=isSyndicateDef(def)?'syndicate':'deck';
    const levelLabel = inst.level>=GD.CARD_LEVEL_CAP ? 'MAX LEVEL' : `LEVEL UP<span>${GD.formatNum(cost)} GOLD</span>`;
    return `<div class="inventory-row"><div><div class="name" style="color:${td.accent}">${inst.holo?'◇ ':''}${escapeHtml(def.name)}</div><div class="meta">${td.name} · LV ${inst.level} · ${GD.formatNum(GD.cardDps(inst))} DPS${def.ability?` · ${escapeHtml(def.ability.name)}`:''}</div></div><div class="inventory-actions">${zone==='deck'?`<button class="mini-btn" data-equip-deck="${inst.uid}">${state.deck.includes(inst.uid)?'REMOVE':'EQUIP'}</button>`:`<button class="mini-btn" data-equip-syn="${inst.uid}">${state.syndicate.includes(inst.uid)?'REMOVE':'ASSIGN'}</button>`}${zone==='deck'?`<button class="mini-btn level-action" data-level="${inst.uid}" ${state.gold<cost||inst.level>=GD.CARD_LEVEL_CAP?'disabled':''}>${levelLabel}</button>`:''}<button class="mini-btn" data-detail="${inst.uid}">VIEW</button><button class="mini-btn" data-sell="${inst.uid}" ${canSell(inst)?'':'disabled'}>SELL${canSell(inst)?`<span>${GD.formatNum(sellRefund(inst))}</span>`:''}</button></div></div>`;
  };
})();
