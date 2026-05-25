import { CacheFlag, ModCallback } from "isaac-typescript-definitions";
import {
  addTearsStat,
  Callback,
  CallbackCustom,
  ModCallbackCustom,
  ModFeature,
} from "isaacscript-common";
import type { RoomTierProgressState } from "../../utils/roomTierProgress";
import {
  newRoomTierProgressState,
  RoomTierProgress,
} from "../../utils/roomTierProgress";
import { ITEM_IDS } from "../itemRegistry";

const { ASH_TWIN } = ITEM_IDS;

const TIER_1_ROOMS = 3;
const TIER_2_ROOMS = 6;
const TIER_3_ROOMS = 9;
const TIER_THRESHOLDS = [TIER_1_ROOMS, TIER_2_ROOMS, TIER_3_ROOMS] as const;

const TIER_1_SPEED_BONUS = 0.12;
const TIER_2_TEARS_BONUS = 0.5;
const PERMANENT_TEARS_BONUS = 0.15;

interface AshTwinSaveData {
  run: {
    permanentTearStacks: int;
  };
  level: {
    progress: RoomTierProgressState;
  };
}

export class AshTwin extends ModFeature {
  public v: AshTwinSaveData = {
    run: {
      permanentTearStacks: 0,
    },
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
      this.v.run.permanentTearStacks = 0;
    }
    this.refreshStats();
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  postNewRoom(): void {
    const player = Isaac.GetPlayer();
    if (!player.HasCollectible(ASH_TWIN)) {
      return;
    }

    const newTier = this.progress.recordCurrentRoom();
    if (newTier === undefined) {
      return;
    }

    if (newTier === 3) {
      this.v.run.permanentTearStacks++;
    }

    this.refreshStats();
    player.AnimateHappy();
    Game().GetHUD().ShowItemText("Ash Twin", getTierMessage(newTier));
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.SPEED)
  evaluateSpeed(player: EntityPlayer): void {
    if (!player.HasCollectible(ASH_TWIN) || this.progress.getTier() < 1) {
      return;
    }

    player.MoveSpeed += TIER_1_SPEED_BONUS;
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FIRE_DELAY)
  evaluateFireDelay(player: EntityPlayer): void {
    if (!player.HasCollectible(ASH_TWIN)) {
      return;
    }

    if (this.progress.getTier() >= 2) {
      addTearsStat(player, TIER_2_TEARS_BONUS);
    }

    if (this.v.run.permanentTearStacks > 0) {
      addTearsStat(
        player,
        this.v.run.permanentTearStacks * PERMANENT_TEARS_BONUS,
      );
    }
  }

  private refreshStats(): void {
    const player = Isaac.GetPlayer();
    player.AddCacheFlags(CacheFlag.SPEED);
    player.AddCacheFlags(CacheFlag.FIRE_DELAY);
    player.EvaluateItems();
  }
}

function getTierMessage(tier: int): string {
  switch (tier) {
    case 1: {
      return "The sands begin to recede...";
    }

    case 2: {
      return "The path opens below...";
    }

    case 3: {
      return "The tower stands clear.";
    }

    default: {
      return "The sands shift...";
    }
  }
}
