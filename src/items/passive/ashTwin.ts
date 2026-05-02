import {
  CardType,
  EntityType,
  ModCallback,
  PickupVariant,
  PlayerType,
  TearFlag,
} from "isaac-typescript-definitions";
import {
  addFlag,
  Callback,
  CallbackCustom,
  ModCallbackCustom,
  ModFeature,
  spawn,
} from "isaacscript-common";

function getRandomRoomPosition(): Vector {
  const room = Game().GetRoom();
  const topLeft = room.GetTopLeftPos();
  const bottomRight = room.GetBottomRightPos();
  const x = topLeft.X + Math.random() * (bottomRight.X - topLeft.X);
  const y = topLeft.Y + Math.random() * (bottomRight.Y - topLeft.Y);
  return Vector(x, y);
}

function addHeartContainerForCharacter(player: EntityPlayer) {
  switch (player.GetPlayerType()) {
    case PlayerType.LOST:
    case PlayerType.LOST_B: {
      spawn(
        EntityType.PICKUP,
        PickupVariant.CARD,
        CardType.HOLY,
        getRandomRoomPosition(),
        Vector(0, 0),
      );
      break;
    }

    case PlayerType.KEEPER:
    case PlayerType.KEEPER_B: {
      for (let i = 0; i < 5; i++) {
        spawn(
          EntityType.PICKUP,
          PickupVariant.COIN,
          2,
          getRandomRoomPosition(),
          Vector(0, 0),
        );
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

    case PlayerType.BLUE_BABY: {
      player.AddSoulHearts(2);
      break;
    }

    default: {
      player.AddMaxHearts(2, true);
      break;
    }
  }
}

const ASH_TWIN = Isaac.GetItemIdByName("Ash Twin");

const MILESTONE_1 = 3;
const MILESTONE_2 = 6;
const MILESTONE_3 = 9;

export class AshTwin extends ModFeature {
  private roomClearCount = 0;
  private milestoneReached = 0;
  private hasItem = false;

  @CallbackCustom(ModCallbackCustom.POST_NEW_LEVEL_REORDERED)
  postNewLevel(): void {
    this.roomClearCount = 0;
    this.milestoneReached = 0;
  }

  @Callback(ModCallback.POST_PLAYER_INIT)
  postPlayerInit(): void {
    this.roomClearCount = 0;
    this.milestoneReached = 0;
    this.hasItem = false;
  }

  @CallbackCustom(ModCallbackCustom.POST_ROOM_CLEAR_CHANGED)
  onRoomClearChanged(isCleared: boolean): void {
    if (!isCleared || !this.hasItem) {
      return;
    }

    this.roomClearCount++;
    this.checkMilestones();
  }

  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    const player = Isaac.GetPlayer();
    this.hasItem = player.HasCollectible(ASH_TWIN);
  }

  @Callback(ModCallback.POST_GAME_STARTED)
  postGameStarted(): void {
    this.roomClearCount = 0;
    this.milestoneReached = 0;
  }

  private checkMilestones(): void {
    if (this.milestoneReached < 1 && this.roomClearCount >= MILESTONE_1) {
      this.applyMilestone(0);
      this.milestoneReached = 1;
    }
    if (this.milestoneReached < 2 && this.roomClearCount >= MILESTONE_2) {
      this.applyMilestone(1);
      this.milestoneReached = 2;
    }
    if (this.milestoneReached < 3 && this.roomClearCount >= MILESTONE_3) {
      this.applyMilestone(2);
      this.milestoneReached = 3;
    }
  }

  private applyMilestone(index: number): void {
    const player = Isaac.GetPlayer();

    switch (index) {
      case 0: {
        player.Damage += 0.3;

        break;
      }

      case 1: {
        const newFireDelay = player.FireDelay - 3;
        player.FireDelay = Math.max(newFireDelay, 0);
        player.TearFlags = addFlag(player.TearFlags, TearFlag.HOMING);

        break;
      }

      case 2: {
        addHeartContainerForCharacter(player);

        break;
      }
      // No default
    }

    player.AnimateHappy();
    Game().GetHUD().ShowItemText("Ash Twin", "The sands thin out...");
  }
}
