export const eidDescriptions = {
  timberHearth: {
    idName: "Timber Hearth",
    quality: "Quality3",
    description:
      "Spawns a bonfire in the starting room of each floor after Basement I# "
      + "{{Heart}} Stand near the fire to warm up once per floor# "
      + "{{Battery}} Fully recharges your active item# "
      + "{{Heart}} Restores red health# "
      + "{{SoulHeart}} Soul-only characters gain +1 Soul Heart# "
      + "{{Player10}} {{Player31}} The Lost gains a Holy Card# "
      + "{{Coin}} Keepers spawn 2 nickels instead",
  },
  attlerock: {
    idName: "The Attlerock",
    quality: "Quality2",
    description:
      "Orbital familiar# "
      + "Absorbs nearby enemy projectiles# "
      + "After absorbing 3 projectiles, fires them back as rock tears# "
      + "{{Damage}} Reflected burst deals 3.5 damage# "
      + "{{Damage}} +0.5 damage for each extra projectile absorbed",
  },
  ashTwin: {
    idName: "Ash Twin",
    quality: "Quality2",
    description:
      "The sands recede as you enter new rooms# "
      + "Starting room does not count# "
      + "{{Speed}} 3 rooms: +0.12 Speed# "
      + "{{Tears}} 6 rooms: +0.5 Fire Rate# "
      + "{{Tears}} 9 rooms: +0.15 permanent Fire Rate# "
      + "Temporary tier bonuses reset each floor",
  },
  emberTwin: {
    idName: "Ember Twin",
    quality: "Quality2",
    description:
      "The sands rise as you enter new rooms# "
      + "Starting room does not count# "
      + "{{Damage}} 3 rooms: +0.4 Damage# "
      + "{{Speed}} 3 rooms: -0.08 Speed# "
      + "{{Damage}} 6 rooms: +0.8 Damage# "
      + "{{Speed}} 6 rooms: -0.14 Speed# "
      + "{{Heart}} 9 rooms: +1 Heart Container or equivalent character reward",
  },
  brittleHollow: {
    idName: "Brittle Hollow",
    quality: "Quality3",
    description:
      "Fixed 8% chance on tear hit to open a rift under enemies# "
      + "Rifts pull nearby enemies inward# "
      + "{{Damage}} Rifts deal 2 damage every 12 frames# "
      + "{{Bomb}} Opening a rift breaks nearby explodable rocks# "
      + "Rock fragments fly in from outside the room toward the rift# "
      + "Up to 3 rifts can be active at once",
  },
  giantsDeep: {
    idName: "Giant's Deep",
    quality: "Quality3",
    description:
      "{{Tears}} Tears down# "
      + "{{Range}} Greatly increased range# "
      + "Tears become slow bouncing cyclones# "
      + "1 in 6 purple cyclones attract enemies# "
      + "Green cyclones launch enemies forward# "
      + "{{Damage}} Green cyclones deal tear damage on contact# "
      + "{{Damage}} Launched enemies take tear damage when they hit a wall or grid object# "
      + "{{Damage}} Each extra green cyclone hit adds +0.5x impact damage# "
      + "At 5 chained hits, impact damage triggers even without a wall# "
      + "{{Luck}} Rare huge green typhoon deals 100 damage and blasts enemies away",
  },
  quantumMoon: {
    idName: "Quantum Moon",
    quality: "Quality4",
    description:
      "{{TreasureRoom}} Only affects Treasure Room pedestals# "
      + "The item appears as a ghost until taken# "
      + "Leaving and re-entering the room may change it into a new item# "
      + "Risk: each new observation can make the pedestal disappear# "
      + "Disappearance chance rises with each seen item# "
      + "After 6 seen items, the next observation always removes it# "
      + "Taking the item collapses it into the current item# "
      + "Skipped seen items become wisps",
  },
  interloper: {
    idName: "Interloper",
    quality: "Quality3",
    description:
      "Every 20 seconds in combat, icy ghost-matter shards burst outward# "
      + "{{Damage}} Shards deal 80% of your damage, minimum 2# "
      + "{{Poison}} Hit enemies are poisoned# "
      + "{{Slow}} Hit enemies are slowed# "
      + "Small chance to freeze enemies on hit# "
      + "Does not spend the cooldown in empty rooms",
  },
  hearthianSpacesuit: {
    idName: "Hearthian Spacesuit",
    quality: "Quality3",
    description:
      "{{Planetarium}} Forces Planetarium chance to 100%# "
      + "{{Planetarium}} Planetariums always offer an available Echoes planetarium item",
  },
  eskerWhistle: {
    idName: "Esker's Whistle",
    quality: "Quality2",
    description:
      "Adds 1 temporary Attlerock orbital for the room# "
      + "If you have The Attlerock, adds 3 temporary orbitals instead# "
      + "Temporary Attlerocks absorb enemy shots and fire rock tears",
  },
  riebeckBanjo: {
    idName: "Riebeck's Banjo",
    quality: "Quality2",
    description:
      "Creates a stable field at Isaac's position for 8 seconds# "
      + "Enemy projectiles vanish when they enter the field# "
      + "Isaac must stay inside it to be protected# "
      + "{{Collectible}} With Brittle Hollow:# "
      + "While Isaac is inside the field, your tear hits force rifts under enemies",
  },
  gabbroFlute: {
    idName: "Gabbro's Flute",
    quality: "Quality2",
    description:
      "Briefly makes the room wavy# "
      + "For 8 seconds, enemies become confused# "
      + "{{Collectible}} With Giant's Deep:# "
      + "Cyclones move chaotically and warp around the room",
  },
} as const;

export const eidDescriptionsIta = {
  timberHearth: {
    idName: "Timber Hearth",
    quality: "Quality3",
    description:
      "Genera un falo nella stanza iniziale di ogni piano dopo Basement I# "
      + "{{Heart}} Avvicinati al fuoco per scaldarti una volta per piano# "
      + "{{Battery}} Ricarica completamente l'oggetto attivo# "
      + "{{Heart}} Cura i cuori rossi# "
      + "{{SoulHeart}} I personaggi senza cuori rossi ottengono +1 Cuore Anima# "
      + "{{Player10}} {{Player31}} The Lost ottiene una Holy Card# "
      + "{{Coin}} I Keeper generano 2 nickel invece",
  },
  attlerock: {
    idName: "The Attlerock",
    quality: "Quality2",
    description:
      "Familiar orbitale# "
      + "Assorbe i proiettili nemici vicini# "
      + "Dopo 3 proiettili assorbiti, li rispara come lacrime di roccia# "
      + "{{Damage}} La raffica riflessa infligge 3.5 danni# "
      + "{{Damage}} +0.5 danni per ogni proiettile extra assorbito",
  },
  ashTwin: {
    idName: "Ash Twin",
    quality: "Quality2",
    description:
      "La sabbia si ritira quando entri in nuove stanze# "
      + "La stanza iniziale non conta# "
      + "{{Speed}} 3 stanze: +0.12 Velocita# "
      + "{{Tears}} 6 stanze: +0.5 Fuoco# "
      + "{{Tears}} 9 stanze: +0.15 Fuoco permanente# "
      + "I bonus temporanei dei tier si resettano a ogni piano",
  },
  emberTwin: {
    idName: "Ember Twin",
    quality: "Quality2",
    description:
      "La sabbia sale quando entri in nuove stanze# "
      + "La stanza iniziale non conta# "
      + "{{Damage}} 3 stanze: +0.4 Danno# "
      + "{{Speed}} 3 stanze: -0.08 Velocita# "
      + "{{Damage}} 6 stanze: +0.8 Danno# "
      + "{{Speed}} 6 stanze: -0.14 Velocita# "
      + "{{Heart}} 9 stanze: +1 Container Cuore o ricompensa equivalente",
  },
  brittleHollow: {
    idName: "Brittle Hollow",
    quality: "Quality3",
    description:
      "8% fisso di aprire un rift sotto i nemici colpiti da lacrime# "
      + "I rift attirano i nemici vicini# "
      + "{{Damage}} I rift infliggono 2 danni ogni 12 frame# "
      + "{{Bomb}} All'apertura rompono le rocce esplodibili vicine# "
      + "Frammenti di roccia arrivano da fuori stanza verso il rift# "
      + "Massimo 3 rift attivi insieme",
  },
  giantsDeep: {
    idName: "Giant's Deep",
    quality: "Quality3",
    description:
      "{{Tears}} Fuoco ridotto# "
      + "{{Range}} Portata molto aumentata# "
      + "Le lacrime diventano cicloni lenti e rimbalzanti# "
      + "1 ciclone viola su 6 attira i nemici# "
      + "I cicloni verdi lanciano i nemici in avanti# "
      + "{{Damage}} I cicloni verdi infliggono danno lacrima al contatto# "
      + "{{Damage}} I nemici lanciati subiscono danno quando colpiscono muri o grid# "
      + "{{Damage}} Ogni altro ciclone verde toccato aggiunge +0.5x danno d'impatto# "
      + "A 5 tocchi in chain, il danno scatta anche senza muro# "
      + "{{Luck}} Raramente spara un tifone verde enorme da 100 danni",
  },
  quantumMoon: {
    idName: "Quantum Moon",
    quality: "Quality4",
    description:
      "{{TreasureRoom}} Agisce solo sui pedestal della Treasure Room# "
      + "L'oggetto appare come fantasma finche non viene preso# "
      + "Uscire e rientrare nella stanza puo cambiarlo in un nuovo oggetto# "
      + "Rischio: ogni nuova osservazione puo far sparire il pedestal# "
      + "La probabilita di sparizione aumenta per ogni oggetto visto# "
      + "Dopo 6 oggetti visti, la prossima osservazione lo rimuove sempre# "
      + "Prendere l'oggetto lo fa collassare nell'oggetto corrente# "
      + "Gli oggetti visti e saltati diventano wisps",
  },
  interloper: {
    idName: "Interloper",
    quality: "Quality3",
    description:
      "Ogni 20 secondi in combattimento, frammenti di ghost matter ghiacciata esplodono verso l'esterno# "
      + "{{Damage}} I frammenti infliggono l'80% del tuo danno, minimo 2# "
      + "{{Poison}} I nemici colpiti vengono avvelenati# "
      + "{{Slow}} I nemici colpiti vengono rallentati# "
      + "Piccola probabilita di congelare i nemici colpiti# "
      + "Non consuma il cooldown nelle stanze vuote",
  },
  hearthianSpacesuit: {
    idName: "Hearthian Spacesuit",
    quality: "Quality3",
    description:
      "{{Planetarium}} Imposta la probabilita Planetario al 100%# "
      + "{{Planetarium}} I Planetari offrono sempre un oggetto Echoes disponibile",
  },
  eskerWhistle: {
    idName: "Esker's Whistle",
    quality: "Quality2",
    description:
      "Aggiunge 1 Attlerock orbitale temporaneo per la stanza# "
      + "Se hai The Attlerock, aggiunge invece 3 orbitanti temporanei# "
      + "Gli Attlerock temporanei assorbono colpi nemici e sparano lacrime di roccia",
  },
  riebeckBanjo: {
    idName: "Riebeck's Banjo",
    quality: "Quality2",
    description:
      "Crea un campo stabile nella posizione di Isaac per 8 secondi# "
      + "I proiettili nemici si annullano quando entrano nel campo# "
      + "Isaac deve restare dentro per essere protetto# "
      + "{{Collectible}} Con Brittle Hollow:# "
      + "Se Isaac e' nel campo, i tuoi colpi creano rift sotto i nemici",
  },
  gabbroFlute: {
    idName: "Gabbro's Flute",
    quality: "Quality2",
    description:
      "Rende brevemente la stanza ondulata# "
      + "Per 8 secondi, i nemici vengono confusi# "
      + "{{Collectible}} Con Giant's Deep:# "
      + "I cicloni si muovono caoticamente e si teletrasportano nella stanza",
  },
} as const;
