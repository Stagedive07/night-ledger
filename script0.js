window.GameData = (() => {
  const TIERS = [
    { id: 1, name: 'Street', unlock: 1, accent: '#73777f' },
    { id: 2, name: 'Cutthroat', unlock: 2, accent: '#4f8c62' },
    { id: 3, name: 'Veiled', unlock: 4, accent: '#4e7096' },
    { id: 4, name: 'Blackhand', unlock: 6, accent: '#665792' },
    { id: 5, name: 'Nightborn', unlock: 8, accent: '#85406f' },
    { id: 6, name: 'Dreadmarked', unlock: 10, accent: '#944646' },
    { id: 7, name: 'Bloodsworn', unlock: 12, accent: '#a9573f' },
    { id: 8, name: 'Kingshade', unlock: 15, accent: '#aa8b45' },
    { id: 9, name: 'Deathbound', unlock: 18, accent: '#b9bdc1' },
    { id: 10, name: 'Nameless', unlock: 20, accent: '#e2ded2' },
  ];
  const PACK_HOURS_AT_UNLOCK = [0.25, 1, 1.6, 2.5, 4.1, 6.5, 10.3, 16.5, 26.3, 48];
  const TOP_CHANCE_BASE = [1, 0.25, 0.1558, 0.0971, 0.0605, 0.0377, 0.0235, 0.0146, 0.0091, 1 - Math.pow(0.95, 1 / 9)];
  const LOWER_WEIGHTS = [9, 20, 40, 20, 10];
  const SHINY_CHANCE = 0.02;
  const BASE_OFFLINE_HOURS = 8;
  const MAX_OFFLINE_HOURS = 24;
  const CARD_LEVEL_CAP = 100;
  const firstNames = ['Mira','Venn','Sable','Tarin','Nox','Ilya','Rook','Kest','Vale','Corin','Mara','Joss','Vera','Kade','Tessa','Bran','Nira','Oren','Lysa','Dain','Riven','Sera','Cairn','Voss','Eris'];
  const lastNames = ['Voss','Hale','Crow','Morn','Kerr','Vale','Ash','Rook','Sorn','Vane','Dusk','Mire','Flint','Kross','Wren','Thorn','Grey','Locke','Marl','Drake','Vex','Sable','Kell','Rane','Noir'];
  const epithetA = ['Crooked','Quiet','Pale','Red','Black','Last','Broken','Hollow','Velvet','Iron','Ashen','Cinder','Blind','Cold','Grim','Silver','Ragged','Scarlet','Silent','Wicked','Old','Thin','Shrouded','Burned','Hidden'];
  const epithetB = ['Knife','Crow','Widow','Fox','Hound','Adder','Saint','Bell','Jackal','Raven','Viper','Moth','Spider','Wolf','Candle','Needle','Hook','Rat','Mask','Harrow','Bishop','Warden','Butcher','Scribe','Prince'];
  const fieldAbilities = ['Contract Killer','Opening Strike','Finisher','Double Strike','Momentum','Patient Killer','Eviscerate','Execute','Shortcut','Sabotage','Inside Man','Contract Insight'];
  const syndicateAbilities = ['Architect','Broker','Appraiser','Salvager','Bookkeeper','Informant','Hideout Keeper'];
  const simpleCutthroatAbilities = ['Contract Killer','Opening Strike','Finisher','Double Strike','Momentum','Patient Killer','Eviscerate','Execute'];
  const streetLore = ["A gutter thief who works the narrow alleys with twin blades and a habit of disappearing before anyone realizes what was taken.", "Mira prefers rooftops and routes no one else notices. Most people remember seeing her only after something has already gone wrong.", "He sells candles in the poorest streets, but the real business happens when customers lower their voices. His lantern has marked more than one place that never opened again.", "No one knows where he learned to stitch knife wounds in rooms with no windows. In the undercity, that knowledge is worth more than a clean reputation.", "Tom can move stolen goods through half the district before sunrise and still make everyone involved think they got the better deal.", "She treats chimneys and slate roofs like ordinary streets, using paths that guards rarely think to watch.", "Kate earned her name because she wastes almost no movement when she fights. People who survive her usually remember how little warning they had.", "Jack is called when subtlety has already failed. He has a talent for making difficult conversations end quickly.", "An old injury left Venn with poor hearing on one side, so he learned to pay attention to everything else. He notices details most people miss.", "Crow has spent years watching doors and people who think they are being careful. Very little surprises him anymore.", "Raised around cargo holds and smuggler crews, he knows which crates get checked and which names keep questions away.", "Soot never seems to leave his clothes or skin, which makes him easy to overlook in the factory streets where he does most of his work.", "Rook survives by letting people underestimate him, then taking advantage of the moment they stop paying attention.", "Joss spent years collecting debts in places where words rarely settled anything. His hands still show the work.", "Whatever happened to Vale before he returned to the streets changed the way he speaks and the way he fights. Nobody has managed to get the full story from him.", "Mara rarely raises her voice, even when things turn violent. People who work beside her learn to trust that calm.", "Locks interest Latch more than the things kept behind them. Give him enough time with a door and he usually finds a way through.", "The hooked blade gave him his name long before anyone bothered to learn the real one. He uses it to pull opponents off balance before closing the distance.", "Nox spends enough time in back rooms and taverns that people often forget he is listening. By the time they remember, he usually has what he came for.", "She knows the burned quarters better than most guards know their own streets. Smoke and abandoned buildings make useful cover.", "Kerr has a face people struggle to describe afterward. He considers that one of his better qualities.", "Vera is good at noticing what makes people hesitate. Once she finds it, getting the rest of the truth is usually easier.", "Tarin waits longer than most fighters are comfortable with, then commits the moment he sees an opening he trusts.", "Kade prefers the hours just before dawn, when guards are tired and streets have gone quiet. Most of his work is finished before the city properly wakes.", "He once carried bags and messages through wealthy houses, learning which doors were watched and which servants were ignored. Those lessons became more useful after he left."];
  function loreFor(tier, index) { if (tier === 1) return streetLore[index] || ''; return ''; }
  function titleCaseName(tier, i) {
    if (tier === 1) { const streetNames = ['Ratknife','Mira Voss','The Candleman','Alley Surgeon','Crooked Tom','Rooftop Runner','Needle Kate','Black Jack','Tin-Ear Venn','Old Crow','Dock Rat','Sootface','Little Rook','Knuckle Joss','Broken Vale','Mara Flint','Latch','Grey Hook','Nox Hale','Ash Runner','Sable Kerr','Vera Locke','Tarin Wren','Kade Morn','The Bellboy']; return streetNames[i]; }
    if (tier === 2 && i === 22) return 'Tarin Quill';
    if (tier <= 4) return `${firstNames[(i + tier * 3) % firstNames.length]} ${lastNames[(i * 7 + tier * 5) % lastNames.length]}`;
    if (tier <= 7) return `The ${epithetA[(i * 3 + tier) % epithetA.length]} ${epithetB[(i * 5 + tier) % epithetB.length]}`;
    if (tier === 8) return `${epithetA[(i + 7) % epithetA.length]} ${['Regent','Duchess','Confessor','Chancellor','Heir','Prelate','Marshal','Consort','Herald','Steward','Oracle','Magistrate','Emissary','Viscount','Keeper','Usurper','Seneschal','Prince','Baron','Adjudicator','Envoy','Viceroy','Curator','Executioner','Minister'][i]}`;
    if (tier === 9) return `${['Last','Pale','Grave','Final','Hollow','Dead','Still','White','Cold','Red','Black','Silent','Ash','Bleak','Severed','Empty','Iron','Scarred','Fallen','Buried','Lost','Drowned','Shorn','Withered','Blind'][i]} ${['Witness','Knife','Widow','Saint','King','Crow','Bell','Warden','Viper','Scribe','Hound','Judge','Raven','Hand','Mask','Bishop','Fox','Harrow','Butcher','Prince','Adder','Wolf','Moth','Hook','Blade'][i]}`;
    return `${['The Nameless','The Unwritten','The Unseen','The Last Knife','Mother Night','The Quiet Between','The Empty Throne','The First Poison','The Final Witness','The Black Horizon','The Unmade','The Uncounted','The Sleepless','The Crownless','The Unburied','The Red Silence','The Hollow King','The Last Shadow','The Pale Oath','The Severed Name','The Closed Eye','The Black Saint','The Unspoken','The End of Kings','The Other Hand'][i]}`;
  }
  function abilityFor(tier, index) { if (tier === 1) return null; if (tier === 2) return makeAbility(simpleCutthroatAbilities[index % simpleCutthroatAbilities.length], tier, index); const useSyndicate = index % 5 === 4 || index % 7 === 5; const pool = useSyndicate ? syndicateAbilities : fieldAbilities; return makeAbility(pool[(index * 3 + tier) % pool.length], tier, index); }
  function makeAbility(name, tier, index) {
    const q = tier - 1; let value = 0; let zone = 'operation'; let text = '';
    switch (name) {
      case 'Contract Killer': value = 0.035 + q * 0.008; text = `+${pct(value)} damage to Operation targets.`; break;
      case 'Opening Strike': value = 0.04 + q * 0.008; text = `+${pct(value)} damage while the enemy is above 80% HP.`; break;
      case 'Finisher': value = 0.04 + q * 0.008; text = `+${pct(value)} damage while the enemy is below 30% HP.`; break;
      case 'Double Strike': value = 0.015 + q * 0.004; text = `${pct(value)} chance for this operative to strike twice.`; break;
      case 'Momentum': value = 0.004 + q * 0.001; text = `Each kill adds ${pct(value)} damage. The bonus can build from up to 10 consecutive kills.`; break;
      case 'Patient Killer': value = 0.003 + q * 0.0008; text = `Damage rises ${pct(value)} per second against the same target.`; break;
      case 'Eviscerate': value = 0.004 + q * 0.001; text = `${pct(value)} chance each second to deal a brutal 5x strike.`; break;
      case 'Execute': value = 0.006 + q * 0.0012; text = `${pct(value)} chance each second to execute weakened enemies.`; break;
      case 'Shortcut': value = 0.01 + q * 0.002; text = `${pct(value)} chance after a kill to skip the next normal encounter.`; break;
      case 'Sabotage': value = 0.015 + q * 0.004; text = `Operation targets begin with ${pct(value)} less HP.`; break;
      case 'Inside Man': value = 1; text = `Begin a new Operation one encounter ahead.`; break;
      case 'Contract Insight': value = 0.03 + q * 0.008; text = `+${pct(value)} Intel from defeated Operation targets.`; break;
      case 'Architect': zone = 'syndicate'; value = 0.035 + q * 0.008; text = `Hideout construction is ${pct(value)} faster.`; break;
      case 'Broker': zone = 'syndicate'; value = 0.025 + q * 0.005; text = `Deck Booster Packs cost ${pct(value)} fewer Whispers.`; break;
      case 'Appraiser': zone = 'syndicate'; value = 0.025 + q * 0.005; text = `Improves the chance of finding higher-tier cards by ${pct(value)}.`; break;
      case 'Salvager': zone = 'syndicate'; value = 0.08 + q * 0.015; text = `Selling cards refunds ${pct(value)} more Whispers.`; break;
      case 'Bookkeeper': zone = 'syndicate'; value = 0.04 + q * 0.008; text = `+${pct(value)} Gold from Operations and while you are away.`; break;
      case 'Informant': zone = 'syndicate'; value = 0.03 + q * 0.006; text = `+${pct(value)} Intel from Operations and while you are away.`; break;
      case 'Hideout Keeper': zone = 'syndicate'; value = Math.min(1 + Math.floor(q / 2), 5); text = `Offline rewards continue accumulating for ${value} additional hour${value===1?'':'s'}.`; break;
    }
    return { name, value, zone, text };
  }
  function pct(x) { return `${(x * 100).toFixed(x < 0.01 ? 1 : 0)}%`; }
  const CARDS = [];
  for (let tier = 1; tier <= 10; tier++) {
    for (let i = 0; i < 25; i++) CARDS.push({ id:`t${tier}-c${String(i+1).padStart(2,'0')}`, tier, index:i, name:titleCaseName(tier,i), lore:loreFor(tier,i), ability:abilityFor(tier,i) });
  }
  const CARD_MAP = Object.fromEntries(CARDS.map(c => [c.id, c]));
  function tierData(tier) { return TIERS[tier - 1]; }
  function tierForHideout(h) { let result=1; TIERS.forEach(t=>{if(h>=t.unlock)result=t.id}); return result; }
  function whisperRatePerHour(hideoutLevel) { return 100 * Math.pow(1.32, hideoutLevel - 1); }
  function normalEnemyHp(operation) { return 500 * Math.pow(1.18, operation - 1) * Math.pow(1.001, ((operation - 1) * (operation - 2)) / 2); }
  function targetHp(operation) { return normalEnemyHp(operation) * 6; }
  function normalGold(operation) { return 10 * Math.pow(1.15, operation - 1); }
  function normalIntel(operation) { return 2 * Math.pow(1.09, operation - 1); }
  function targetRewardMultiplier() { return 20; }
  function baseDpsMid(tier) { return 10 * Math.pow(4.2, tier - 1); }
  function rollBaseDps(tier) { return baseDpsMid(tier) * (0.9 + Math.random() * 0.2); }
  function cardDps(instance) { return instance.baseDps * Math.pow(1.10, instance.level - 1); }
  function cardLevelCost(tier, level) { return 25 * Math.pow(4.2, tier - 1) * Math.pow(1.18, level - 1); }
  function hideoutOperationReq(level) { if (level <= 1) return 0; return Math.round(2 * (level - 1) + 0.13 * Math.pow(level - 1, 2)); }
  function hideoutIntelCost(level) { if (level <= 1) return 0; return 500 * Math.pow(1.9, level - 2); }
  function hideoutBuildMinutes(level) { if(level<=1)return 0; return 5*Math.pow(576,(level-2)/18); }
  function packBaseCost(tier) { const unlock=tierData(tier).unlock; return Math.round(whisperRatePerHour(unlock)*PACK_HOURS_AT_UNLOCK[tier-1]); }
  function syndicateSlots(h){if(h<3)return 0;if(h<6)return 2;if(h<10)return 3;if(h<15)return 4;if(h<20)return 5;return 6;}
  function packOdds(packTier, hideoutLevel, appraiserRelative = 0) {
    if (packTier <= 1) return [{ tier: 1, p: 1 }];
    const topUnlock=tierData(packTier).unlock, levelsSinceUnlock=Math.max(0,hideoutLevel-topUnlock), topP=Math.min(.80,TOP_CHANCE_BASE[packTier-1]*Math.pow(1.18,levelsSinceUnlock));
    const probs=new Map([[packTier,topP]]), lowerTiers=[]; for(let d=1;d<=5;d++){const t=packTier-d;if(t>=1)lowerTiers.push({tier:t,weight:LOWER_WEIGHTS[d-1]});}
    const wSum=lowerTiers.reduce((a,b)=>a+b.weight,0); lowerTiers.forEach(x=>probs.set(x.tier,(1-topP)*x.weight/wSum));
    const capped=Math.max(0,Number(appraiserRelative)||0); if(capped>0){const weighted=[];let total=0;[...probs.entries()].forEach(([tier,p])=>{const rank=tier/packTier,w=p*(1+capped*rank);weighted.push([tier,w]);total+=w});return weighted.map(([tier,w])=>({tier,p:w/total})).sort((a,b)=>a.tier-b.tier)}
    return [...probs.entries()].map(([tier,p])=>({tier,p})).sort((a,b)=>a.tier-b.tier);
  }
  function randomCardDefFromTier(tier){const list=CARDS.filter(c=>c.tier===tier);return list[Math.floor(Math.random()*list.length)]}
  function rollTier(odds){const r=Math.random();let c=0;for(const row of odds){c+=row.p;if(r<=c)return row.tier}return odds[odds.length-1].tier}
  const enemyNames=['Gate Watch','Roof Patrol','Lantern Guard','Hall Sentry','Courier','Ward Hound','Lookout','Vault Guard','House Blade','Night Watch','Keyholder','Silent Guard'];
  const targetTitles=['The Collector','Warden Vey','The Red Clerk','Captain Sorn','The Quiet Judge','The Glass Widow','Master Kerr','The Ash Bishop','Lord Vane','The Pale Hand'];
  function enemyName(operation,encounter,target=false){if(target)return targetTitles[(operation-1)%targetTitles.length];return enemyNames[(operation*5+encounter*3)%enemyNames.length]}
  function formatNum(n){if(!Number.isFinite(n))return '∞';const abs=Math.abs(n);if(abs<1000)return n<100?n.toFixed(1).replace('.0',''):Math.floor(n).toString();const units=['K','M','B','T','Qa','Qi'];let v=n,i=-1;while(Math.abs(v)>=1000&&i<units.length-1){v/=1000;i++}return `${v>=100?v.toFixed(0):v>=10?v.toFixed(1):v.toFixed(2)}${units[i]}`}
  function formatTime(seconds){seconds=Math.max(0,Math.ceil(seconds));const d=Math.floor(seconds/86400);seconds%=86400;const h=Math.floor(seconds/3600);seconds%=3600;const m=Math.floor(seconds/60),s=seconds%60;if(d)return `${d}d ${h}h`;if(h)return `${h}h ${m}m`;if(m)return `${m}m ${s}s`;return `${s}s`}
  return {TIERS,CARDS,CARD_MAP,CARD_LEVEL_CAP,SHINY_CHANCE,BASE_OFFLINE_HOURS,MAX_OFFLINE_HOURS,tierData,tierForHideout,whisperRatePerHour,normalEnemyHp,targetHp,normalGold,normalIntel,targetRewardMultiplier,baseDpsMid,rollBaseDps,cardDps,cardLevelCost,hideoutOperationReq,hideoutIntelCost,hideoutBuildMinutes,packBaseCost,syndicateSlots,packOdds,randomCardDefFromTier,rollTier,enemyName,formatNum,formatTime,pct};
})();