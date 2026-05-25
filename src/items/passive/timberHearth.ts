/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import {
  CoinSubType,
  EntityType,
  GridEntityType,
  LevelStage,
  ModCallback,
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
import {
  spawnCoinAtRandomRoomPosition,
  spawnHolyCardAtRandomRoomPosition,
} from "../../utils/playerRewards";
import { ITEM_IDS } from "../itemRegistry";

function healForCharacter(player: EntityPlayer): void {
  switch (player.GetPlayerType()) {
    case PlayerType.LOST:
    case PlayerType.LOST_B: {
      // TODO: Balance this.
      spawnHolyCardAtRandomRoomPosition();
      break;
    }

    case PlayerType.KEEPER:
    case PlayerType.KEEPER_B: {
      for (let i = 0; i < 2; i++) {
        // TODO: Maybe a random coin.
        spawnCoinAtRandomRoomPosition(CoinSubType.NICKEL);
      }
      break;
    }

    case PlayerType.JUDAS_B:
    case PlayerType.BETHANY_B:
    case PlayerType.BLUE_BABY_B:
    case PlayerType.BLUE_BABY: {
      player.AddSoulHearts(2);
      break;
    }

    default: {
      if (player.GetHearts() > 0) {
        player.AddHearts(999);
      }
      break;
    }
  }
}

const sound = SFXManager();
const music = MusicManager();
const { TIMBER_HEARTH } = ITEM_IDS;
const TIMBER_HEARTH_FIREPLACE_VARIANT = 9500;
const ROOM_CENTER_OFFSET = 20;
const BONFIRE_WARMTH_RADIUS = 48;
let isBonfireAvailable = false;
let bonfirePosition: Vector | undefined;
let shouldResumeMusic = false;
const TIMBER_HEARTH_GUITAR = Isaac.GetSoundIdByName("Timber Hearth Guitar");

export class TimberHearth extends ModFeature {
  // Creates the bonfire when entering the new floor.
  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  timberHearthBonfire(): void {
    const level = Game().GetLevel();
    const room = Game().GetRoom();

    if (
      Isaac.GetPlayer().HasCollectible(TIMBER_HEARTH)
      && level.GetStage() !== LevelStage.BASEMENT_1
      && getRoomGridIndex() === level.GetStartingRoomIndex()
    ) {
      const centerPos = getBonfirePosition();
      if (bonfirePosition === undefined) {
        isBonfireAvailable = true;
      }
      bonfirePosition = centerPos;

      // Spawn the bonfire.
      if (!hasBonfireEffect()) {
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
      }

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
    isBonfireAvailable = false;
    bonfirePosition = undefined;
  }

  // Handles the bonfire healing effect.
  @Callback(ModCallback.POST_UPDATE)
  bonfireHeal(): void {
    if (
      !isBonfireAvailable
      || bonfirePosition === undefined
      || !isBonfireRoom()
    ) {
      return;
    }

    const player = Isaac.GetPlayer();
    if (player.Position.Distance(bonfirePosition) > BONFIRE_WARMTH_RADIUS) {
      return;
    }

    isBonfireAvailable = false;

    // TODO: Don't do anything if jacob_b .
    player.FullCharge();
    healForCharacter(player);

    music.Pause();
    sound.Play(TIMBER_HEARTH_GUITAR);
    shouldResumeMusic = true;
    Game().GetHUD().ShowItemText("Timber Hearth", "You feel warmed...");
  }

  // Displays a message when the bonfire is used.
  @Callback(ModCallback.POST_RENDER)
  bonfireMessage(): void {
    if (shouldResumeMusic && !sound.IsPlaying(TIMBER_HEARTH_GUITAR)) {
      music.Resume();
      shouldResumeMusic = false;
    }
  }
}

function getBonfirePosition(): Vector {
  const centerPos = Game().GetRoom().GetCenterPos();
  centerPos.Y -= ROOM_CENTER_OFFSET;
  centerPos.X += ROOM_CENTER_OFFSET;

  return centerPos;
}

function hasBonfireEffect() {
  return (
    Isaac.FindByType(EntityType.EFFECT, TIMBER_HEARTH_FIREPLACE_VARIANT).length
    > 0
  );
}

function isBonfireRoom() {
  const level = Game().GetLevel();

  return (
    level.GetStage() !== LevelStage.BASEMENT_1
    && getRoomGridIndex() === level.GetStartingRoomIndex()
  );
}
