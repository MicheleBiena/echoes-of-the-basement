import {
  CollectibleType,
  EntityType,
  ItemConfigTag,
  ItemPoolType,
  ModCallback,
  PickupVariant,
  RoomType,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getPlayers,
  getRandomSeed,
  ModCallbackCustom,
  ModFeature,
  setSeed,
  spawn,
} from "isaacscript-common";
import {
  DARK_BRAMBLE_ANGLERFISH_ATE_PLAYER_KEY,
  clearDarkBrambleAnglerfishFreeze,
  getDarkBrambleAnglerfish,
  removeDarkBrambleAnglerfish,
  spawnDarkBrambleAnglerfish,
} from "../../entities/darkBrambleAnglerfish";
import { ITEM_IDS } from "../itemRegistry";

const { DARK_BRAMBLE } = ITEM_IDS;

const DARK_BRAMBLE_SPAWN_DELAY_FRAMES = 45 * 30;
const DARK_BRAMBLE_ROOM_EDGE_MARGIN = 38;
const DARK_BRAMBLE_RESPAWN_CHECK_INTERVAL_FRAMES = 15;
const DARK_BRAMBLE_REWARD_ROLL_ATTEMPTS = 240;
const DARK_BRAMBLE_REWARD_POSITION_OFFSET = Vector(0, 40);

const DARK_BRAMBLE_REWARD_POOLS = [
  ItemPoolType.TREASURE,
  ItemPoolType.SHOP,
  ItemPoolType.BOSS,
  ItemPoolType.DEVIL,
  ItemPoolType.ANGEL,
  ItemPoolType.SECRET,
  ItemPoolType.LIBRARY,
  ItemPoolType.GOLDEN_CHEST,
  ItemPoolType.RED_CHEST,
  ItemPoolType.BEGGAR,
  ItemPoolType.DEMON_BEGGAR,
  ItemPoolType.CURSE,
  ItemPoolType.KEY_MASTER,
  ItemPoolType.BATTERY_BUM,
  ItemPoolType.MOMS_CHEST,
  ItemPoolType.ULTRA_SECRET,
  ItemPoolType.PLANETARIUM,
  ItemPoolType.OLD_CHEST,
] as const;

let floorStartFrame = 0;
let isAnglerfishActiveThisFloor = false;
let isAnglerfishRewardLostThisFloor = false;
let isAnglerfishRewardSpawnedThisFloor = false;

export class DarkBramble extends ModFeature {
  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, undefined)
  postGameStarted(): void {
    resetDarkBrambleFloorState();
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_LEVEL_REORDERED)
  postNewLevel(): void {
    resetDarkBrambleFloorState();
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  postNewRoom(): void {
    if (!isDarkBrambleHuntRunning()) {
      return;
    }

    spawnAnglerfishForCurrentRoom();
  }

  @CallbackCustom(ModCallbackCustom.POST_ROOM_CLEAR_CHANGED, true)
  postRoomClearChanged(): void {
    if (!shouldSpawnDarkBrambleReward()) {
      return;
    }

    spawnDarkBrambleReward();
  }

  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    const owner = getDarkBrambleOwner();
    if (owner === undefined) {
      if (isAnglerfishActiveThisFloor) {
        stopDarkBrambleHunt();
      }
      return;
    }

    if (consumeAnglerfishAtePlayerFlag()) {
      isAnglerfishActiveThisFloor = false;
      isAnglerfishRewardLostThisFloor = true;
      removeDarkBrambleAnglerfish();
      return;
    }

    if (isAnglerfishRewardLostThisFloor || isAnglerfishRewardSpawnedThisFloor) {
      return;
    }

    if (!isAnglerfishActiveThisFloor && shouldStartDarkBrambleHunt()) {
      isAnglerfishActiveThisFloor = true;
      spawnAnglerfishForCurrentRoom();
      return;
    }

    if (
      isAnglerfishActiveThisFloor
      && Game().GetFrameCount() % DARK_BRAMBLE_RESPAWN_CHECK_INTERVAL_FRAMES
        === 0
    ) {
      spawnAnglerfishIfMissing(owner);
    }
  }
}

function resetDarkBrambleFloorState(): void {
  floorStartFrame = Game().GetFrameCount();
  isAnglerfishActiveThisFloor = false;
  isAnglerfishRewardLostThisFloor = false;
  isAnglerfishRewardSpawnedThisFloor = false;
  clearDarkBrambleAnglerfishFreeze();
  clearAnglerfishAtePlayerFlags();
  removeDarkBrambleAnglerfish();
}

function stopDarkBrambleHunt(): void {
  isAnglerfishActiveThisFloor = false;
  clearDarkBrambleAnglerfishFreeze();
  removeDarkBrambleAnglerfish();
}

function shouldStartDarkBrambleHunt(): boolean {
  return (
    Game().GetFrameCount() - floorStartFrame >= DARK_BRAMBLE_SPAWN_DELAY_FRAMES
  );
}

function isDarkBrambleHuntRunning(): boolean {
  return (
    isAnglerfishActiveThisFloor
    && !isAnglerfishRewardLostThisFloor
    && !isAnglerfishRewardSpawnedThisFloor
  );
}

function spawnAnglerfishForCurrentRoom(): void {
  const owner = getDarkBrambleOwner();
  if (owner === undefined) {
    return;
  }

  spawnAnglerfishIfMissing(owner);
}

function spawnAnglerfishIfMissing(player: EntityPlayer): void {
  if (getDarkBrambleAnglerfish().length > 0) {
    return;
  }

  spawnDarkBrambleAnglerfish(getAnglerfishSpawnPosition(player));
}

function getAnglerfishSpawnPosition(player: EntityPlayer): Vector {
  const room = Game().GetRoom();
  const topLeft = room.GetTopLeftPos();
  const bottomRight = room.GetBottomRightPos();
  const center = room.GetCenterPos();

  const spawnX =
    player.Position.X < center.X
      ? bottomRight.X - DARK_BRAMBLE_ROOM_EDGE_MARGIN
      : topLeft.X + DARK_BRAMBLE_ROOM_EDGE_MARGIN;

  return room.GetClampedPosition(
    Vector(spawnX, player.Position.Y),
    DARK_BRAMBLE_ROOM_EDGE_MARGIN,
  );
}

function getDarkBrambleOwner(): EntityPlayer | undefined {
  return getPlayers().find((player) => player.HasCollectible(DARK_BRAMBLE));
}

function shouldSpawnDarkBrambleReward(): boolean {
  return (
    isDarkBrambleHuntRunning()
    && getDarkBrambleOwner() !== undefined
    && Game().GetRoom().GetType() === RoomType.BOSS
  );
}

function spawnDarkBrambleReward(): void {
  const reward = getRandomHighQualityCollectible();
  const room = Game().GetRoom();
  const rewardPosition = room.FindFreePickupSpawnPosition(
    room.GetCenterPos().add(DARK_BRAMBLE_REWARD_POSITION_OFFSET),
    0,
    true,
  );

  spawn(EntityType.PICKUP, PickupVariant.COLLECTIBLE, reward, rewardPosition);

  isAnglerfishRewardSpawnedThisFloor = true;
  isAnglerfishActiveThisFloor = false;
  clearDarkBrambleAnglerfishFreeze();
  removeDarkBrambleAnglerfish();
}

function getRandomHighQualityCollectible(): CollectibleType {
  const itemPool = Game().GetItemPool();
  const rng = RNG();
  setSeed(rng, getRandomSeed());

  for (const _ of $range(0, DARK_BRAMBLE_REWARD_ROLL_ATTEMPTS - 1)) {
    const pool =
      DARK_BRAMBLE_REWARD_POOLS[
        rng.RandomInt(DARK_BRAMBLE_REWARD_POOLS.length)
      ];
    if (pool === undefined) {
      continue;
    }

    const item = itemPool.GetCollectible(pool, false, rng.Next());

    if (isHighQualityCollectible(item)) {
      return item;
    }
  }

  const fallbackItems = getAllHighQualityCollectibles();
  if (fallbackItems.length === 0) {
    return CollectibleType.BREAKFAST;
  }

  return (
    fallbackItems[rng.RandomInt(fallbackItems.length)]
    ?? CollectibleType.BREAKFAST
  );
}

function getAllHighQualityCollectibles(): CollectibleType[] {
  const itemConfig = Isaac.GetItemConfig();
  const collectibles = itemConfig.GetCollectibles();
  const highQualityItems: CollectibleType[] = [];

  for (const item of $range(1, collectibles.Size - 1)) {
    if (isHighQualityCollectible(item)) {
      highQualityItems.push(item);
    }
  }

  return highQualityItems;
}

function isHighQualityCollectible(item: int): item is CollectibleType {
  const itemConfig = Isaac.GetItemConfig().GetCollectible(item);

  return (
    itemConfig !== undefined
    && itemConfig.Quality >= 3
    && itemConfig.IsAvailable()
    && !itemConfig.Hidden
    && !itemConfig.HasTags(ItemConfigTag.QUEST)
  );
}

function consumeAnglerfishAtePlayerFlag(): boolean {
  let wasAnyPlayerEaten = false;

  for (const player of getPlayers()) {
    const data = player.GetData();
    if (data[DARK_BRAMBLE_ANGLERFISH_ATE_PLAYER_KEY] !== true) {
      continue;
    }

    data[DARK_BRAMBLE_ANGLERFISH_ATE_PLAYER_KEY] = undefined;
    wasAnyPlayerEaten = true;
  }

  return wasAnyPlayerEaten;
}

function clearAnglerfishAtePlayerFlags(): void {
  for (const player of getPlayers()) {
    player.GetData()[DARK_BRAMBLE_ANGLERFISH_ATE_PLAYER_KEY] = undefined;
  }
}
