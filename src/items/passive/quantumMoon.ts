import {
  CollectibleType,
  EntityType,
  ItemPoolType,
  ItemType,
  ModCallback,
  PickupVariant,
  RoomType,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getPlayers,
  getRoomGridIndex,
  ModCallbackCustom,
  ModFeature,
  spawn,
} from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

const { QUANTUM_MOON } = ITEM_IDS;

const MAX_OBSERVED_ITEMS = 6;
const ITEM_ROLL_ATTEMPTS = 24;
const PICKUP_POSITION_TOLERANCE = 18;
const PICKUP_COLOR_DURATION = 3;
const PICKUP_COLOR_PRIORITY = 100_000;

// Index = number of already observed states before the next observation.
const DISAPPEAR_CHANCE_BY_SEEN_COUNT = [
  0,
  0.12,
  0.24,
  0.42,
  0.64,
  0.82,
  1,
] as const;

const QUANTUM_PICKUP_COLOR = Color(0.55, 0.75, 1, 0.35);
const NORMAL_PICKUP_COLOR = Color(1, 1, 1, 1);

interface QuantumMoonRoomState {
  collapsed: boolean;
  currentItem: CollectibleType;
  positionX: float;
  positionY: float;
  roomIndex: int;
  seenItems: CollectibleType[];
  vanished: boolean;
}

interface QuantumMoonSaveData {
  level: {
    rooms: QuantumMoonRoomState[];
  };
}

// Treasure Room items change state when not looked at, then collapse into wisps.
export class QuantumMoon extends ModFeature {
  public v: QuantumMoonSaveData = {
    level: {
      rooms: [],
    },
  };

  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, undefined)
  postGameStarted(isContinued: boolean): void {
    if (!isContinued) {
      this.v.level.rooms = [];
    }
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_LEVEL_REORDERED)
  postNewLevel(): void {
    this.v.level.rooms = [];
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  postNewRoom(): void {
    const player = getQuantumMoonPlayer();
    if (player === undefined || !isTreasureRoom()) {
      return;
    }

    const roomIndex = getRoomGridIndex();
    const state = this.getRoomState(roomIndex);
    if (state === undefined) {
      this.createRoomState(roomIndex);
      return;
    }

    if (state.collapsed) {
      return;
    }

    if (state.vanished || shouldDisappear(state)) {
      this.vanishState(state);
      return;
    }

    state.currentItem = getNextTreasureItem(state, player);
    state.seenItems.push(state.currentItem);

    const pickup = this.getOrSpawnQuantumPickup(state);
    if (pickup !== undefined) {
      applyQuantumPickup(pickup, state.currentItem);
    }
  }

  @Callback(ModCallback.POST_PICKUP_UPDATE, PickupVariant.COLLECTIBLE)
  postPickupUpdate(pickup: EntityPickup): void {
    const state = this.getActiveStateForPickup(pickup);
    if (state === undefined) {
      return;
    }

    applyQuantumPickup(pickup, state.currentItem);
  }

  @Callback(ModCallback.PRE_PICKUP_COLLISION, PickupVariant.COLLECTIBLE)
  prePickupCollision(
    pickup: EntityPickup,
    collider: Entity,
  ): boolean | undefined {
    const player = collider.ToPlayer();
    if (player === undefined) {
      return undefined;
    }

    const state = this.getActiveStateForPickup(pickup);
    if (state === undefined) {
      return undefined;
    }

    state.collapsed = true;
    pickup.Wait = 0;
    pickup.SetColor(
      NORMAL_PICKUP_COLOR,
      PICKUP_COLOR_DURATION,
      PICKUP_COLOR_PRIORITY,
      false,
      false,
    );
    addSkippedItemWisps(player, state);

    return undefined;
  }

  private createRoomState(roomIndex: int): void {
    const pickup = findFirstCollectiblePickup();
    if (pickup === undefined || !isValidCollectible(pickup.SubType)) {
      return;
    }

    const state: QuantumMoonRoomState = {
      collapsed: false,
      currentItem: pickup.SubType,
      positionX: pickup.Position.X,
      positionY: pickup.Position.Y,
      roomIndex,
      seenItems: [pickup.SubType],
      vanished: false,
    };

    this.v.level.rooms.push(state);
    applyQuantumPickup(pickup, state.currentItem);
  }

  private getActiveStateForPickup(
    pickup: EntityPickup,
  ): QuantumMoonRoomState | undefined {
    if (!isTreasureRoom()) {
      return undefined;
    }

    const roomIndex = getRoomGridIndex();
    return this.v.level.rooms.find(
      (state) =>
        !state.collapsed
        && !state.vanished
        && state.roomIndex === roomIndex
        && pickup.Position.Distance(getStatePosition(state))
          <= PICKUP_POSITION_TOLERANCE,
    );
  }

  private getOrSpawnQuantumPickup(
    state: QuantumMoonRoomState,
  ): EntityPickup | undefined {
    const pickup = findCollectiblePickupAt(getStatePosition(state));
    if (pickup !== undefined) {
      return pickup;
    }

    const entity = spawn(
      EntityType.PICKUP,
      PickupVariant.COLLECTIBLE,
      state.currentItem,
      getStatePosition(state),
    );

    return entity.ToPickup();
  }

  private getRoomState(roomIndex: int): QuantumMoonRoomState | undefined {
    return this.v.level.rooms.find((state) => state.roomIndex === roomIndex);
  }

  private vanishState(state: QuantumMoonRoomState): void {
    state.vanished = true;

    const pickup = findCollectiblePickupAt(getStatePosition(state));
    if (pickup !== undefined) {
      pickup.Remove();
    }
  }
}

function getQuantumMoonPlayer(): EntityPlayer | undefined {
  return getPlayers().find((player) => player.HasCollectible(QUANTUM_MOON));
}

function isTreasureRoom(): boolean {
  return Game().GetRoom().GetType() === RoomType.TREASURE;
}

function findFirstCollectiblePickup(): EntityPickup | undefined {
  for (const entity of Isaac.FindByType(
    EntityType.PICKUP,
    PickupVariant.COLLECTIBLE,
  )) {
    const pickup = entity.ToPickup();
    if (pickup !== undefined && isValidCollectible(pickup.SubType)) {
      return pickup;
    }
  }

  return undefined;
}

function findCollectiblePickupAt(position: Vector): EntityPickup | undefined {
  for (const entity of Isaac.FindByType(
    EntityType.PICKUP,
    PickupVariant.COLLECTIBLE,
  )) {
    const pickup = entity.ToPickup();
    if (
      pickup !== undefined
      && pickup.Position.Distance(position) <= PICKUP_POSITION_TOLERANCE
    ) {
      return pickup;
    }
  }

  return undefined;
}

function applyQuantumPickup(
  pickup: EntityPickup,
  item: CollectibleType,
): void {
  if (pickup.SubType !== item) {
    pickup.Morph(
      EntityType.PICKUP,
      PickupVariant.COLLECTIBLE,
      item,
      false,
      true,
      true,
    );
  }

  pickup.AutoUpdatePrice = false;
  pickup.OptionsPickupIndex = 0;
  pickup.Price = 0;
  pickup.ShopItemId = -1;
  pickup.Touched = false;
  pickup.Wait = 0;
  pickup.SetColor(
    QUANTUM_PICKUP_COLOR,
    PICKUP_COLOR_DURATION,
    PICKUP_COLOR_PRIORITY,
    false,
    false,
  );
}

function shouldDisappear(state: QuantumMoonRoomState): boolean {
  const seenCount = state.seenItems.length;
  if (seenCount >= MAX_OBSERVED_ITEMS) {
    return true;
  }

  const chance = DISAPPEAR_CHANCE_BY_SEEN_COUNT[seenCount] ?? 1;
  return Math.random() < chance;
}

function getNextTreasureItem(
  state: QuantumMoonRoomState,
  player: EntityPlayer,
): CollectibleType {
  const itemPool = Game().GetItemPool();

  for (const _ of $range(0, ITEM_ROLL_ATTEMPTS - 1)) {
    const item = itemPool.GetCollectible(ItemPoolType.TREASURE, false);
    if (
      isValidCollectible(item)
      && !state.seenItems.includes(item)
      && !player.HasCollectible(item)
    ) {
      return item;
    }
  }

  const fallbackItem = itemPool.GetCollectible(ItemPoolType.TREASURE, false);
  return isValidCollectible(fallbackItem)
    ? fallbackItem
    : CollectibleType.BREAKFAST;
}

function addSkippedItemWisps(
  player: EntityPlayer,
  state: QuantumMoonRoomState,
): void {
  for (const item of state.seenItems) {
    if (item !== state.currentItem) {
      addWispForItem(player, item);
    }
  }
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

function isValidCollectible(item: int): item is CollectibleType {
  return (
    item !== CollectibleType.NULL
    && Isaac.GetItemConfig().GetCollectible(item) !== undefined
  );
}

function getStatePosition(state: QuantumMoonRoomState): Vector {
  return Vector(state.positionX, state.positionY);
}
