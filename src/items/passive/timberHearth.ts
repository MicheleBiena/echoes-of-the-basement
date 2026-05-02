import {
  CardType,
  EntityType,
  GridEntityType,
  LevelStage,
  ModCallback,
  PickupVariant,
  PlayerType,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getRoomGridIndex,
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

function healForCharacter(player: EntityPlayer): void {
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
      for (let i = 0; i < 2; i++) {
        spawn(EntityType.PICKUP, PickupVariant.COIN, 2, getRandomRoomPosition(), Vector(0,0));
      }
      break;
    }

    case PlayerType.BETHANY: {
      player.AddSoulCharge(2);
      break;
    }

    case PlayerType.BETHANY_B: {
      player.AddBloodCharge(2);
      break;
    }

    case PlayerType.BLUE_BABY: {
      player.AddSoulHearts(2);
      break;
    }

    default: {
      if (player.GetHearts() > 0) {
        player.AddHearts(999);
      } else {
        player.AddSoulHearts(2);
      }
      break;
    }
  }
}

const sound = SFXManager();
const music = MusicManager();
const TIMBER_HEARTH = Isaac.GetItemIdByName("Timber Hearth");
const TIMBER_HEARTH_FIREPLACE_VARIANT = 9500;
const ROOM_CENTER_OFFSET = 20;
let isActiveBonfire = false;
const TIMBER_HEARTH_GUITAR = Isaac.GetSoundIdByName("Timber Hearth Guitar");

export class TimberHearth extends ModFeature {
  // Creates the bonfire when entering the new floor.
  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  timberHearthBonfire(): void {
    const level = Game().GetLevel();
    const room = Game().GetRoom();

    if (
      Isaac.GetPlayer().HasCollectible(TIMBER_HEARTH) &&
      level.GetStage() !== LevelStage.BASEMENT_1 &&
      getRoomGridIndex() === level.GetStartingRoomIndex()
    ) {
      const centerPos = room.GetCenterPos();
      centerPos.Y -= ROOM_CENTER_OFFSET;
      centerPos.X += ROOM_CENTER_OFFSET;

      // Spawn the bonfire.
      const bonfire = spawn(
        EntityType.EFFECT,
        TIMBER_HEARTH_FIREPLACE_VARIANT,
        0,
        centerPos,
      );

      const sprite = bonfire.GetSprite();
      sprite.Load("gfx/effects/timberHearthBonfire.anm2", true);
      sprite.Play("Idle", true);
      bonfire.SpriteOffset = Vector(0, -15);
      bonfire.DepthOffset = -10;

      // Spawn an invisible wall (if not exists).
      const gridIndex = room.GetGridIndex(centerPos);
      if (!room.GetGridEntity(gridIndex)) {
        room.SpawnGridEntity(
          gridIndex,
          GridEntityType.WALL,
          0,
          Game().GetSeeds().GetNextSeed(),
          0,
        );
      }
    }
  }

  // Resets the bonfire healing feature.
  @CallbackCustom(ModCallbackCustom.POST_NEW_LEVEL_REORDERED)
  bonfireUseReset(): void {
    const player = Isaac.GetPlayer();
    if (player.HasCollectible(TIMBER_HEARTH)) {
      isActiveBonfire = true;
    }
  }

  // Handles the bonfire healing effect.
  @Callback(ModCallback.POST_UPDATE)
  bonfireHeal(): void {
    if (isActiveBonfire) {
      isActiveBonfire = false;

      const player = Isaac.GetPlayer();
      player.FullCharge();
      healForCharacter(player);

      music.Pause();
      sound.Play(TIMBER_HEARTH_GUITAR);
      Game().GetHUD().ShowItemText("Timber Hearth", "You feel warmed...");
    }
  }

  // Displays a message when the bonfire is used.
  @Callback(ModCallback.POST_RENDER)
  bonfireMessage(): void {
    if (!isActiveBonfire) {
      music.Resume();
    }
  }
}
