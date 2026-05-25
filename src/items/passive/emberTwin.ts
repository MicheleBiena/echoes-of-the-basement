import {
  CacheFlag,
  CoinSubType,
  ModCallback,
  PlayerType,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  ModCallbackCustom,
  ModFeature,
} from "isaacscript-common";
import {
  spawnCoinAtRandomRoomPosition,
  spawnHolyCardAtRandomRoomPosition,
} from "../../utils/playerRewards";
import type { RoomTierProgressState } from "../../utils/roomTierProgress";
import {
  newRoomTierProgressState,
  RoomTierProgress,
} from "../../utils/roomTierProgress";
import { ITEM_IDS } from "../itemRegistry";

const { EMBER_TWIN } = ITEM_IDS;

const TIER_1_ROOMS = 3;
const TIER_2_ROOMS = 6;
const TIER_3_ROOMS = 9;
const TIER_THRESHOLDS = [TIER_1_ROOMS, TIER_2_ROOMS, TIER_3_ROOMS] as const;

const TIER_1_DAMAGE_BONUS = 0.4;
const TIER_2_DAMAGE_BONUS = 0.8;
const TIER_1_SPEED_PENALTY = 0.08;
const TIER_2_SPEED_PENALTY = 0.14;

interface EmberTwinSaveData {
  level: {
    progress: RoomTierProgressState;
  };
}

export class EmberTwin extends ModFeature {
  public v: EmberTwinSaveData = {
    level: {
      progress: newRoomTierProgressState(),
    },
  };

  private readonly getProgressState = (): RoomTierProgressState =>
    this.v.level.progress;

  private readonly progress = new RoomTierProgress(
    TIER_THRESHOLDS,
    this.getProgressState,
  );

  @CallbackCustom(ModCallbackCustom.POST_NEW_LEVEL_REORDERED)
  postNewLevel(): void {
    this.progress.resetFloor();
    this.refreshStats();
  }

  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, undefined)
  postGameStarted(isContinued: boolean): void {
    if (!isContinued) {
      this.progress.resetRun();
    }
    this.refreshStats();
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  postNewRoom(): void {
    const player = Isaac.GetPlayer();
    if (!player.HasCollectible(EMBER_TWIN)) {
      return;
    }

    const newTier = this.progress.recordCurrentRoom();
    if (newTier === undefined) {
      return;
    }

    if (newTier === 3) {
      addHeartContainerForCharacter(player);
    }

    this.refreshStats();
    player.AnimateHappy();
    Game().GetHUD().ShowItemText("Ember Twin", getTierMessage(newTier));
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.DAMAGE)
  evaluateDamage(player: EntityPlayer): void {
    if (!player.HasCollectible(EMBER_TWIN)) {
      return;
    }

    player.Damage += getDamageBonus(this.progress.getTier());
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.SPEED)
  evaluateSpeed(player: EntityPlayer): void {
    if (!player.HasCollectible(EMBER_TWIN)) {
      return;
    }

    player.MoveSpeed -= getSpeedPenalty(this.progress.getTier());
  }

  private refreshStats(): void {
    const player = Isaac.GetPlayer();
    player.AddCacheFlags(CacheFlag.DAMAGE);
    player.AddCacheFlags(CacheFlag.SPEED);
    player.EvaluateItems();
  }
}

function getDamageBonus(tier: int): float {
  if (tier >= 2) {
    return TIER_2_DAMAGE_BONUS;
  }

  if (tier >= 1) {
    return TIER_1_DAMAGE_BONUS;
  }

  return 0;
}

function getSpeedPenalty(tier: int): float {
  if (tier >= 2) {
    return TIER_2_SPEED_PENALTY;
  }

  if (tier >= 1) {
    return TIER_1_SPEED_PENALTY;
  }

  return 0;
}

function addHeartContainerForCharacter(player: EntityPlayer): void {
  switch (player.GetPlayerType()) {
    case PlayerType.LOST:
    case PlayerType.LOST_B: {
      spawnHolyCardAtRandomRoomPosition();
      break;
    }

    case PlayerType.KEEPER:
    case PlayerType.KEEPER_B: {
      for (const _ of $range(0, 5)) {
        spawnCoinAtRandomRoomPosition(CoinSubType.NICKEL);
      }
      break;
    }

    case PlayerType.BETHANY: {
      player.AddSoulCharge(3);
      break;
    }

    case PlayerType.BETHANY_B: {
      player.AddBloodCharge(3);
      break;
    }

    case PlayerType.BLUE_BABY:
    case PlayerType.BLUE_BABY_B: {
      player.AddSoulHearts(2);
      break;
    }

    default: {
      player.AddMaxHearts(2, true);
      break;
    }
  }
}

function getTierMessage(tier: int): string {
  switch (tier) {
    case 1: {
      return "The sands begin to rise...";
    }

    case 2: {
      return "The weight settles in...";
    }

    case 3: {
      return "The heart is buried deep.";
    }

    default: {
      return "The sands shift...";
    }
  }
}
