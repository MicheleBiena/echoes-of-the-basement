import type { CollectibleType } from "isaac-typescript-definitions";
import {
  CacheFlag,
  DamageFlag,
  ModCallback,
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
import { playInstrumentUse } from "./instrumentBehavior";

const { ASH_TWIN, CHERT_DRUMS, EMBER_TWIN } = ITEM_IDS;

const CHERT_DRUMS_ACTIVE_UNTIL_FRAME_KEY =
  "echoesOfTheBasementChertDrumsActiveUntilFrame";
const CHERT_DRUMS_MARKED_UNTIL_FRAME_KEY =
  "echoesOfTheBasementChertDrumsMarkedUntilFrame";
const CHERT_DRUMS_IGNORE_BONUS_DAMAGE_KEY =
  "echoesOfTheBasementChertDrumsIgnoreBonusDamage";
const CHERT_DRUMS_DURATION_FRAMES = 8 * 30;
const CHERT_DRUMS_MARK_REFRESH_INTERVAL_FRAMES = 15;
const CHERT_DRUMS_EROSION_INTERVAL_FRAMES = 30;
const CHERT_DRUMS_DAMAGE_MULTIPLIER = 0.25;
const CHERT_DRUMS_ASH_SPEED_BONUS = 0.12;
const CHERT_DRUMS_ASH_TEARS_BONUS = 0.5;
const CHERT_DRUMS_EMBER_DAMAGE_BONUS = 0.6;
const CHERT_DRUMS_EMBER_SPEED_PENALTY = 0.08;
const CHERT_DRUMS_EMBER_EROSION_DAMAGE = 1;
const CHERT_DRUMS_MARK_COLOR = Color(0.55, 0.75, 1, 1);
const CHERT_DRUMS_MARK_COLOR_DURATION = 24;
const CHERT_DRUMS_MARK_COLOR_PRIORITY = 100;

let wasChertDrumsStatBonusActive = false;

export class ChertDrums extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, CHERT_DRUMS)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    setChertDrumsActive(player);
    markEnemies(getChertDrumsActiveUntilFrame(player));
    refreshChertStats(player);

    playInstrumentUse(player, CHERT_DRUMS, ITEM_NAMES.CHERT_DRUMS);

    return undefined;
  }

  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    const activePlayers = getPlayers().filter((player) =>
      isChertDrumsActive(player),
    );

    syncChertStatBonus(activePlayers);
    if (activePlayers.length === 0) {
      return;
    }

    const frameCount = Game().GetFrameCount();
    if (frameCount % CHERT_DRUMS_MARK_REFRESH_INTERVAL_FRAMES === 0) {
      markEnemies(getLatestChertDrumsActiveUntilFrame(activePlayers));
    }

    if (frameCount % CHERT_DRUMS_EROSION_INTERVAL_FRAMES !== 0) {
      return;
    }

    const emberPlayers = activePlayers.filter((player) =>
      player.HasCollectible(EMBER_TWIN),
    );
    const emberPlayer = emberPlayers[0];
    if (emberPlayer === undefined) {
      return;
    }

    applyEmberErosion(emberPlayer);
  }

  @Callback(ModCallback.ENTITY_TAKE_DMG)
  entityTakeDamage(
    entity: Entity,
    amount: float,
    _damageFlags: BitFlags<DamageFlag>,
    source: EntityRef,
    _countdownFrames: int,
  ): boolean | undefined {
    const npc = entity.ToNPC();
    if (
      npc === undefined
      || amount <= 0
      || !isChertMarked(npc)
      || shouldIgnoreChertBonusDamage(npc)
    ) {
      return undefined;
    }

    applyChertBonusDamage(npc, amount, source);
    return undefined;
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.SPEED)
  evaluateSpeed(player: EntityPlayer): void {
    if (!isChertDrumsActive(player)) {
      return;
    }

    if (player.HasCollectible(ASH_TWIN)) {
      player.MoveSpeed += CHERT_DRUMS_ASH_SPEED_BONUS;
    }

    if (player.HasCollectible(EMBER_TWIN)) {
      player.MoveSpeed -= CHERT_DRUMS_EMBER_SPEED_PENALTY;
    }
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FIRE_DELAY)
  evaluateFireDelay(player: EntityPlayer): void {
    if (!isChertDrumsActive(player) || !player.HasCollectible(ASH_TWIN)) {
      return;
    }

    addTearsStat(player, CHERT_DRUMS_ASH_TEARS_BONUS);
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.DAMAGE)
  evaluateDamage(player: EntityPlayer): void {
    if (!isChertDrumsActive(player) || !player.HasCollectible(EMBER_TWIN)) {
      return;
    }

    player.Damage += CHERT_DRUMS_EMBER_DAMAGE_BONUS;
  }
}

function setChertDrumsActive(player: EntityPlayer): void {
  player.GetData()[CHERT_DRUMS_ACTIVE_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + CHERT_DRUMS_DURATION_FRAMES;
}

function getChertDrumsActiveUntilFrame(player: EntityPlayer): int {
  const activeUntilFrame = player.GetData()[CHERT_DRUMS_ACTIVE_UNTIL_FRAME_KEY];

  return typeof activeUntilFrame === "number" ? activeUntilFrame : 0;
}

function isChertDrumsActive(player: EntityPlayer): boolean {
  const activeUntilFrame = getChertDrumsActiveUntilFrame(player);

  return activeUntilFrame > 0 && Game().GetFrameCount() <= activeUntilFrame;
}

function getLatestChertDrumsActiveUntilFrame(
  players: readonly EntityPlayer[],
): int {
  let latestActiveUntilFrame = 0;
  for (const player of players) {
    latestActiveUntilFrame = math.max(
      latestActiveUntilFrame,
      getChertDrumsActiveUntilFrame(player),
    );
  }

  return latestActiveUntilFrame;
}

function markEnemies(markedUntilFrame: int): void {
  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    npc.GetData()[CHERT_DRUMS_MARKED_UNTIL_FRAME_KEY] = markedUntilFrame;
    npc.SetColor(
      CHERT_DRUMS_MARK_COLOR,
      CHERT_DRUMS_MARK_COLOR_DURATION,
      CHERT_DRUMS_MARK_COLOR_PRIORITY,
      true,
      false,
    );
  }
}

function isChertMarked(npc: EntityNPC): boolean {
  const markedUntilFrame = npc.GetData()[CHERT_DRUMS_MARKED_UNTIL_FRAME_KEY];

  return (
    typeof markedUntilFrame === "number"
    && Game().GetFrameCount() <= markedUntilFrame
  );
}

function applyChertBonusDamage(
  npc: EntityNPC,
  amount: float,
  source: EntityRef,
): void {
  const bonusDamage = amount * CHERT_DRUMS_DAMAGE_MULTIPLIER;
  if (bonusDamage <= 0) {
    return;
  }

  setIgnoreChertBonusDamage(npc, true);
  npc.TakeDamage(bonusDamage, DamageFlag.NO_MODIFIERS, source, 0);
  setIgnoreChertBonusDamage(npc, false);
}

function applyEmberErosion(player: EntityPlayer): void {
  const source = EntityRef(player);

  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc) || !isChertMarked(npc)) {
      continue;
    }

    setIgnoreChertBonusDamage(npc, true);
    npc.TakeDamage(
      CHERT_DRUMS_EMBER_EROSION_DAMAGE,
      DamageFlag.NO_MODIFIERS,
      source,
      0,
    );
    setIgnoreChertBonusDamage(npc, false);
  }
}

function shouldIgnoreChertBonusDamage(npc: EntityNPC): boolean {
  return npc.GetData()[CHERT_DRUMS_IGNORE_BONUS_DAMAGE_KEY] === true;
}

function setIgnoreChertBonusDamage(
  npc: EntityNPC,
  shouldIgnore: boolean,
): void {
  npc.GetData()[CHERT_DRUMS_IGNORE_BONUS_DAMAGE_KEY] = shouldIgnore;
}

function syncChertStatBonus(activePlayers: readonly EntityPlayer[]): void {
  const isStatBonusActive = activePlayers.some(
    (player) =>
      player.HasCollectible(ASH_TWIN) || player.HasCollectible(EMBER_TWIN),
  );

  if (isStatBonusActive) {
    wasChertDrumsStatBonusActive = true;
    return;
  }

  if (!wasChertDrumsStatBonusActive) {
    return;
  }

  for (const player of getPlayers()) {
    refreshChertStats(player);
  }
  wasChertDrumsStatBonusActive = false;
}

function refreshChertStats(player: EntityPlayer): void {
  player.AddCacheFlags(CacheFlag.SPEED);
  player.AddCacheFlags(CacheFlag.FIRE_DELAY);
  player.AddCacheFlags(CacheFlag.DAMAGE);
  player.EvaluateItems();
}

function isAffectedNPC(npc: EntityNPC): boolean {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
