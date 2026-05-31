import {
  CacheFlag,
  CollectibleType,
  EffectVariant,
  ItemType,
  ModCallback,
  SoundEffect,
} from "isaac-typescript-definitions";
import {
  addTearsStat,
  Callback,
  getNPCs,
  getPlayers,
  isActiveEnemy,
  ModFeature,
} from "isaacscript-common";
import { ITEM_IDS, ITEM_NAMES } from "../itemRegistry";
import { forceSpawnBrittleHollowRift } from "../passive/brittleHollow";
import { fireSolanumGiantsDeepCyclones } from "../passive/giantsDeep";
import { spawnInterloperBurst } from "../passive/interloper";
import { playInstrumentUse } from "./instrumentBehavior";

declare const ItemOverlay: {
  readonly Show: (
    this: void,
    giantbookID: int,
    delay?: int,
    player?: EntityPlayer,
  ) => void;
};

const { SOLANUM_KEYBOARD } = ITEM_IDS;

const SOLANUM_ASH_ACTIVE_UNTIL_FRAME_KEY =
  "echoesOfTheBasementSolanumAshActiveUntilFrame";
const SOLANUM_EMBER_ACTIVE_UNTIL_FRAME_KEY =
  "echoesOfTheBasementSolanumEmberActiveUntilFrame";
const SOLANUM_EMBER_WAFER_APPLIED_KEY =
  "echoesOfTheBasementSolanumEmberWaferApplied";
const SOLANUM_STAT_BONUS_WAS_ACTIVE_KEY =
  "echoesOfTheBasementSolanumStatBonusWasActive";

const SOLANUM_TEMP_STAT_DURATION_FRAMES = 8 * 30;
const SOLANUM_ASH_SPEED_BONUS = 0.14;
const SOLANUM_ASH_TEARS_BONUS = 0.65;
const SOLANUM_EMBER_DAMAGE_BONUS = 1.2;
const SOLANUM_EMBER_SPEED_PENALTY = 0.15;
const SOLANUM_TIMBER_RED_HEARTS = 2;
const SOLANUM_TIMBER_SOUL_HEARTS = 2;
const SOLANUM_BRITTLE_MAX_FORCED_RIFTS = 3;
const SOLANUM_DARK_BRAMBLE_FEAR_DURATION_FRAMES = 180;
const SOLANUM_GIANTBOOK_DELAY_FRAMES = 3;

type SolanumMemory =
  | "ash_twin"
  | "brittle_hollow"
  | "dark_bramble"
  | "ember_twin"
  | "giants_deep"
  | "interloper"
  | "quantum_moon"
  | "timber_hearth";

const SOLANUM_MEMORIES = [
  "timber_hearth",
  "ash_twin",
  "ember_twin",
  "brittle_hollow",
  "giants_deep",
  "dark_bramble",
  "quantum_moon",
  "interloper",
] as const satisfies readonly SolanumMemory[];

const SOLANUM_GIANTBOOK_NAMES = {
  ash_twin: "Solanum Memory Ash Twin",
  brittle_hollow: "Solanum Memory Brittle Hollow",
  dark_bramble: "Solanum Memory Dark Bramble",
  ember_twin: "Solanum Memory Ember Twin",
  giants_deep: "Solanum Memory Giants Deep",
  interloper: "Solanum Memory Interloper",
  quantum_moon: "Solanum Memory Quantum Moon",
  timber_hearth: "Solanum Memory Timber Hearth",
} as const satisfies Record<SolanumMemory, string>;

export class SolanumKeyboard extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, SOLANUM_KEYBOARD)
  preUseItem(
    _collectibleType: CollectibleType,
    rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    const memory = getRandomSolanumMemory(rng);

    applySolanumMemory(player, memory);
    showSolanumGiantbook(player, memory);
    playInstrumentUse(player, SOLANUM_KEYBOARD, ITEM_NAMES.SOLANUM_KEYBOARD);

    return undefined;
  }

  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    for (const player of getPlayers()) {
      syncSolanumTemporaryEffects(player);
    }
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.SPEED)
  evaluateSpeed(player: EntityPlayer): void {
    if (isSolanumAshActive(player)) {
      player.MoveSpeed += SOLANUM_ASH_SPEED_BONUS;
    }

    if (isSolanumEmberActive(player)) {
      player.MoveSpeed -= SOLANUM_EMBER_SPEED_PENALTY;
    }
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FIRE_DELAY)
  evaluateFireDelay(player: EntityPlayer): void {
    if (!isSolanumAshActive(player)) {
      return;
    }

    addTearsStat(player, SOLANUM_ASH_TEARS_BONUS);
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.DAMAGE)
  evaluateDamage(player: EntityPlayer): void {
    if (!isSolanumEmberActive(player)) {
      return;
    }

    player.Damage += SOLANUM_EMBER_DAMAGE_BONUS;
  }
}

function getRandomSolanumMemory(rng: RNG): SolanumMemory {
  const index = rng.RandomInt(SOLANUM_MEMORIES.length);
  return SOLANUM_MEMORIES[index] ?? "timber_hearth";
}

function showSolanumGiantbook(
  player: EntityPlayer,
  memory: SolanumMemory,
): void {
  const giantbookID = Isaac.GetGiantBookIdByName(
    SOLANUM_GIANTBOOK_NAMES[memory],
  );

  if ((giantbookID as number) === -1) {
    return;
  }

  ItemOverlay.Show(giantbookID, SOLANUM_GIANTBOOK_DELAY_FRAMES, player);
}

function applySolanumMemory(
  player: EntityPlayer,
  memory: SolanumMemory,
): void {
  switch (memory) {
    case "timber_hearth": {
      applyTimberHearthMemory(player);
      break;
    }

    case "ash_twin": {
      setSolanumAshActive(player);
      break;
    }

    case "ember_twin": {
      setSolanumEmberActive(player);
      break;
    }

    case "brittle_hollow": {
      forceBrittleHollowRifts();
      break;
    }

    case "giants_deep": {
      fireSolanumGiantsDeepCyclones(player);
      break;
    }

    case "dark_bramble": {
      fearEnemies(player);
      break;
    }

    case "quantum_moon": {
      addRandomInventoryWisp(player);
      break;
    }

    case "interloper": {
      spawnInterloperBurst(player);
      break;
    }
  }
}

function applyTimberHearthMemory(player: EntityPlayer): void {
  if (player.GetMaxHearts() > 0) {
    player.AddHearts(SOLANUM_TIMBER_RED_HEARTS);
  } else {
    player.AddSoulHearts(SOLANUM_TIMBER_SOUL_HEARTS);
  }

  Game().SpawnParticles(player.Position, EffectVariant.HEART, 4, 4);
  SFXManager().Play(SoundEffect.VAMP_GULP);
}

function setSolanumAshActive(player: EntityPlayer): void {
  player.GetData()[SOLANUM_ASH_ACTIVE_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + SOLANUM_TEMP_STAT_DURATION_FRAMES;
  refreshSolanumStats(player);
}

function setSolanumEmberActive(player: EntityPlayer): void {
  const data = player.GetData();
  data[SOLANUM_EMBER_ACTIVE_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + SOLANUM_TEMP_STAT_DURATION_FRAMES;

  if (data[SOLANUM_EMBER_WAFER_APPLIED_KEY] !== true) {
    player.GetEffects().AddCollectibleEffect(CollectibleType.WAFER, false, 1);
    data[SOLANUM_EMBER_WAFER_APPLIED_KEY] = true;
  }

  refreshSolanumStats(player);
}

function forceBrittleHollowRifts(): void {
  let spawnedRifts = 0;

  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    if (forceSpawnBrittleHollowRift(npc)) {
      spawnedRifts++;
    }

    if (spawnedRifts >= SOLANUM_BRITTLE_MAX_FORCED_RIFTS) {
      return;
    }
  }
}

function fearEnemies(player: EntityPlayer): void {
  const source = EntityRef(player);

  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    npc.AddFear(source, SOLANUM_DARK_BRAMBLE_FEAR_DURATION_FRAMES);
  }

  SFXManager().Play(SoundEffect.DEATH_CARD);
}

function addRandomInventoryWisp(player: EntityPlayer): void {
  const inventoryItems = getPlayerInventoryItems(player);
  if (inventoryItems.length === 0) {
    return;
  }

  const item = inventoryItems[math.random(0, inventoryItems.length - 1)];

  if (item === undefined) {
    return;
  }

  addWispForItem(player, item);
  SFXManager().Play(SoundEffect.HOLY);
}

function getPlayerInventoryItems(player: EntityPlayer): CollectibleType[] {
  const items: CollectibleType[] = [];
  const itemConfig = Isaac.GetItemConfig();
  const collectibleCount = itemConfig.GetCollectibles().Size;

  for (let i = 1; i < collectibleCount; i++) {
    const item = itemConfig.GetCollectible(i as CollectibleType);
    if (
      item === undefined
      || item.ID === CollectibleType.NULL
      || !player.HasCollectible(item.ID, true)
    ) {
      continue;
    }

    items.push(item.ID);
  }

  return items;
}

function addWispForItem(player: EntityPlayer, item: CollectibleType): void {
  const itemConfig = Isaac.GetItemConfig().GetCollectible(item);
  if (itemConfig === undefined) {
    return;
  }

  if (itemConfig.Type === ItemType.ACTIVE) {
    player.AddWisp(item, player.Position, true);
    return;
  }

  player.AddItemWisp(item, player.Position, true);
}

function syncSolanumTemporaryEffects(player: EntityPlayer): void {
  const isStatBonusActive =
    isSolanumAshActive(player) || isSolanumEmberActive(player);
  const data = player.GetData();
  const wasStatBonusActive =
    data[SOLANUM_STAT_BONUS_WAS_ACTIVE_KEY] === true;

  if (isStatBonusActive && !wasStatBonusActive) {
    data[SOLANUM_STAT_BONUS_WAS_ACTIVE_KEY] = true;
    refreshSolanumStats(player);
  }

  if (!isStatBonusActive && wasStatBonusActive) {
    data[SOLANUM_STAT_BONUS_WAS_ACTIVE_KEY] = false;
    refreshSolanumStats(player);
  }

  if (
    !isSolanumEmberActive(player)
    && data[SOLANUM_EMBER_WAFER_APPLIED_KEY] === true
  ) {
    player.GetEffects().RemoveCollectibleEffect(CollectibleType.WAFER, 1);
    data[SOLANUM_EMBER_WAFER_APPLIED_KEY] = false;
  }
}

function isSolanumAshActive(player: EntityPlayer) {
  return isSolanumTemporaryEffectActive(
    player,
    SOLANUM_ASH_ACTIVE_UNTIL_FRAME_KEY,
  );
}

function isSolanumEmberActive(player: EntityPlayer) {
  return isSolanumTemporaryEffectActive(
    player,
    SOLANUM_EMBER_ACTIVE_UNTIL_FRAME_KEY,
  );
}

function isSolanumTemporaryEffectActive(
  player: EntityPlayer,
  key: string,
) {
  const activeUntilFrame = player.GetData()[key];

  return (
    typeof activeUntilFrame === "number"
    && Game().GetFrameCount() <= activeUntilFrame
  );
}

function refreshSolanumStats(player: EntityPlayer): void {
  player.AddCacheFlags(CacheFlag.SPEED);
  player.AddCacheFlags(CacheFlag.FIRE_DELAY);
  player.AddCacheFlags(CacheFlag.DAMAGE);
  player.EvaluateItems();
}

function isAffectedNPC(npc: EntityNPC) {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
