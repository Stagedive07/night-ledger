window.StoryData = (() => {
  const opening = { id:'opening', title:'ASH BEFORE DAWN', pages:[
    'Smoke has settled into the floorboards. The Hideout is quiet in the way a room becomes quiet after everyone who mattered has already left it.',
    'The east door hangs from one hinge. The hidden cabinet is open. The Ledger is gone.',
    'So is Rin.',
    'Under the broken table you find a strip of black cloth, damp with rain, and a brass token scratched with a symbol you do not recognize. Someone wanted you alive long enough to find it.',
    'You put the knife back in your sleeve. Whoever took Rin made one mistake: they left a trail.'
  ]};
  const firstPack = { id:'first_pack', title:'OLD CONTACTS', pages:[
    'The Veil is broken, but not every name in it is dead.',
    'An old dead-drop route delivers ten operative records from contacts who still answer the Veil’s signals.',
    'No portraits remain in the damaged archive. For now, names and records will have to be enough.'
  ]};
  const hideout = {
    2:{id:'h2',title:'A FALSE WALL',pages:['Behind a cracked wall you find the Hideout’s old contact chute. Someone has used it recently. The paper inside is still dry.','A single line is written in cipher: “CUT THE FIRST THREAD.” New contacts become reachable.']},
    3:{id:'h3',title:'THE SECOND TABLE',pages:['You clear the back room and uncover the old assignment board.','Not every operative belongs in the field. Some are more dangerous arranging the job from the dark. The Syndicate is restored.']},
    4:{id:'h4',title:'THE VEILED ROUTE',pages:['A map is folded beneath the floorboards. Three alleys are marked with the same black symbol from the raid.','One route ends at a door that has no address.']},
    5:{id:'h5',title:'A SMALL THING',pages:['In the ash you find something that belonged to Rin.','You remember it being lost weeks before the raid. The memory is clear. Too clear.','You pocket it anyway.']},
    6:{id:'h6',title:'THE HAND BEHIND IT',pages:['A Blackhand courier answers a signal no one outside the old Veil should know.','Before vanishing, they leave a message: “You were supposed to survive.”']},
    7:{id:'h7',title:'DATED WRONG',pages:['A coded note surfaces in an old lockbox.','The date is three days before the raid. The note describes the east door hanging from one hinge.','You check the date twice.']},
    8:{id:'h8',title:'NIGHT MARKET',pages:['The rebuilt Hideout reaches far enough to touch the night market.','Rare operatives trade through the night market under borrowed names. Some records arrive with strange foil marks that do not match any known printer.']},
    9:{id:'h9',title:'WATCHING THE WATCHERS',pages:['You find a listening device under the rebuilt stair.','It is wired correctly, but there is no transmitter. It could never have sent anything.','Someone still knew exactly where you would look.']},
    10:{id:'h10',title:'THE SECOND LEDGER',pages:['The stolen Ledger was never only a list of names.','A recovered cipher reveals a second layer beneath every entry: routes, debts, family, hidden rooms... and one column marked only with the same black symbol.','Rin’s entry has that mark.']},
    11:{id:'h11',title:'THE OLD VOICE',pages:['A surviving Veil operative swears the order did not come from outside.','“Someone opened the door for them,” they say. “Someone we trusted.”']},
    12:{id:'h12',title:'BLOOD OATH',pages:['The symbol appears again, carved inside a place built decades before the Veil existed.','You have seen it before. You cannot remember where.']},
    13:{id:'h13',title:'WHAT RIN SAID',pages:['A memory returns without warning: Rin at the window, saying, “If they come for me, do not follow the obvious trail.”','You do not remember answering.','You do remember the rain. There was no rain that night.']},
    14:{id:'h14',title:'ABOVE THE HAND',pages:['Orders taken from a dead intermediary point upward again.','Every mastermind you uncover seems to be reading from someone else’s page.']},
    15:{id:'h15',title:'KINGSHADE',pages:['The rebuilt network finally reaches the rooms where powerful people believe walls make them invisible.','The conspiracy is no longer under the city. It is inside the city.']},
    16:{id:'h16',title:'A PHRASE',pages:['A captured target looks directly at you and smiles.','“You always wake before the last door,” they whisper.','It is a phrase Rin used when you were children. You have never told anyone.']},
    17:{id:'h17',title:'THE SAME HALL',pages:['For a moment the Hideout corridor is not the Hideout corridor.','It is the hall from the raid. The lamp is burning in the wrong place. The east door is whole.','Then you blink, and the wall is brick again.']},
    18:{id:'h18',title:'DEATHBOUND',pages:['A late ledger fragment changes the shape of the hunt.','Rin did not leave only traces of capture. Some of the trail was placed deliberately.','For you.']},
    19:{id:'h19',title:'PRESENT TENSE',pages:['A message waits in a sealed compartment that should have been empty.','It is addressed to you by name.','The final sentence reads: “You are standing in front of this now.”']},
    20:{id:'h20',title:'NAMELESS',pages:['The last chamber beneath the Hideout opens.','Inside is a route to the hundredth target and a name that appears to explain everything.','Almost everything.','One line in the record is impossible. You decide you can worry about impossible things after Rin is safe.']}
  };
  const operations = {
    1:{id:'op1',title:'FIRST THREAD',pages:['The brass token leads to a counting room near the river.','Twenty-four guards stand between you and the person carrying the first real name.']},
    2:{id:'op2',title:'THE COUNTING ROOM',pages:['The second target keeps two ledgers: one for coin, one for names.','The names matter more. Three of them were once protected by the Veil.']},
    3:{id:'op3',title:'A DEAD DROP',pages:['A dead-drop route you thought abandoned has been used since the raid.','The message inside contains only a location and the words: “TOO SLOW.”']},
    5:{id:'op5',title:'THE SYMBOL',pages:['The same black symbol is stamped beneath the target’s desk.','They die without explaining it.']},
    10:{id:'op10',title:'INSIDE',pages:['A name in the recovered papers belongs to someone who once slept under the same roof as you.','The raid had help from inside the Veil.']},
    20:{id:'op20',title:'A WIDER MAP',pages:['The trail moves beyond alleys and thieves. Warehouses become offices. Offices become ministries.','Someone respectable is paying for very ugly work.']},
    25:{id:'op25',title:'THE FIRST MAJOR TARGET',pages:['The target finally says Rin’s name.','Not as a hostage. As an entry in a system.','The abduction and the Ledger were the same job.']},
    40:{id:'op40',title:'THE WRONG ENEMY',pages:['A target you expected to kill hands you evidence instead.','“You think we took Rin,” they say. “We were trying to find who did.”','For the first time, the trail splits.']},
    50:{id:'op50',title:'BENEATH THE NAMES',pages:['The hidden layer of the Ledger is finally readable.','It does not merely record people. It records pressure points: the one thing that can make each person move.','Beside your name is a single word: RIN.']},
    65:{id:'op65',title:'THE CHOICE',pages:['A document bears Rin’s cipher and a timestamp after the abduction.','Either Rin was alive long enough to write it... or someone knows the cipher perfectly.','The message says: “Keep going.”']},
    75:{id:'op75',title:'CHAIN OF COMMAND',pages:['The chain finally has a top.','A name. A location. A sealed wing no ordinary operative has ever entered.','It feels too clean. You go anyway.']},
    85:{id:'op85',title:'A MEMORY THAT CANNOT BE',pages:['The target describes a conversation you remember having with Rin.','They quote your answer exactly.','The conversation happened when you were alone.']},
    95:{id:'op95',title:'THE LAST ROUTE',pages:['Every remaining line points to the same place.','The black symbol is carved over the final door in your notes before you draw it.','You stop looking at the page.']},
    99:{id:'op99',title:'ONE DOOR',pages:['There is one target left.','For the first time since the raid, you are afraid not of failing, but of what success will prove.']}
  };
  const system = {
    whispers:{id:'sys_whispers',title:'WHISPERS',pages:['The old network traded in favors and introductions. Those debts were known as Whispers.','The rebuilt Hideout will gather Whispers over time. Spend them to recruit new operatives.']},
    gold:{id:'sys_gold',title:'BLOOD MONEY',pages:['The first guard carries coin meant for someone else. It will do more good in your hands.','Spend Gold to train operatives and increase their damage.']},
    intel:{id:'sys_intel',title:'INTEL',pages:['The target’s papers contain routes, ciphers, schedules and names.','Intel rebuilds the Hideout and opens deeper parts of the network.']},
    hideout:{id:'sys_hideout',title:'THE HIDEOUT',pages:['The ruined Hideout can be rebuilt one room at a time.','Each level expands the network and opens access to stronger contacts.']},
    syndicate:{id:'sys_syndicate',title:'THE SYNDICATE',pages:['The assignment board can hold operatives who never enter an Operation.','Assign operatives here when you want their support work helping the network.','Space is limited, so choose the operatives whose support matters most.']},
    shiny:{id:'sys_shiny',title:'HOLOGRAPHIC',pages:['One card catches the lamp and flashes in hard blocks of color.','No record explains the printing mark.','The Library marks it as Holographic.']},
    firstDuplicate:{id:'sys_duplicate',title:'THE FENCE',pages:['You already know this operative.','A fence will buy unwanted duplicate records for Whispers.']}
  };
  const finale = { id:'finale', title:'THE HUNDREDTH DOOR', pages:[
    'The final target falls.','Beyond them is the room you have been chasing for one hundred Operations.','Rin is there. The Ledger is there. The black symbol is carved into the table between you.','You reach for Rin’s hand.','The lamp goes out.','You wake on the floor of the ruined Hideout.','The east door hangs from one hinge. Smoke still moves through the room. Your blood is still wet on the boards.','No rebuilt Hideout. No hundred Operations. No army of operatives. A dream assembled from fear, memory, and things you could not possibly know.','Rin is still gone.','Your fist is closed around something sharp. When you open it, the brass token is there.','On its back is a mark you never saw before falling unconscious: the same route symbol that led you to the hundredth door.','This time, you are awake.'
  ]};
  const prestige = { id:'prestige1', title:'PRESTIGE I — AWAKE', pages:['The nightmare did not save Rin.','It did leave you a map made from memories you had not understood yet.','You stand, put the knife back in your sleeve, and begin again with one advantage you did not have before:','You know where the first thread leads.']};
  return {opening,firstPack,hideout,operations,system,finale,prestige};
})();