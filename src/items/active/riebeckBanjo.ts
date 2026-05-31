import type { CollectibleType } from "isaac-typescript-definitions";
import {
  DamageFlag,
  EffectVariant,
  EntityType,
  ModCallback,
  SoundEffect,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getEffects,
  getPlayers,
  getProjectiles,
  isActiveEnemy,
  ModCallbackCustom,
  ModFeature,
  spawn,
} from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";
import { forceSpawnBrittleHollowRift } from "../passive/brittleHollow";

const { BRITTLE_HOLLOW, RIEBECK_BANJO } = ITEM_IDS;

const RIEBECK_BANJO_ACTIVE_UNTIL_FRAME_KEY =
  "echoesOfTheBasementRiebeckBanjoActiveUntilFrame";
const RIEBECK_BANJO_FIELD_POSITION_X_KEY =
  "echoesOfTheBasementRiebeckBanjoFieldPositionX";
const RIEBECK_BANJO_FIELD_POSITION_Y_KEY =
  "echoesOfTheBasementRiebeckBanjoFieldPositionY";
const RIEBECK_BANJO_FIELD_OWNER_SEED_KEY =
  "echoesOfTheBasementRiebeckBanjoFieldOwnerSeed";

const RIEBECK_BANJO_FIELD_EFFECT_VARIANT = 9502 as EffectVariant;
const RIEBECK_BANJO_FIELD_SPRITE = "gfx/effects/riebeckBanjoField.anm2";
const RIEBECK_BANJO_FIELD_ANIMATION = "Pulse";
const STABLE_FIELD_DURATION_FRAMES = 8 * 30;
const STABLE_FIELD_RADIUS = 105;
const STABLE_FIELD_VISUAL_INTERVAL_FRAMES = 8;
const STABLE_FIELD_PARTICLE_COUNT = 2;
const STABLE_FIELD_PARTICLE_SPEED = 2;
const STABLE_FIELD_EFFECT_SPRITE_OFFSET = Vector(0, 2);
const STABLE_FIELD_EFFECT_SCALE = Vector(2, 2);
const STABLE_FIELD_EFFECT_DEPTH_OFFSET = -20;
const PROJECTILE_BLOCK_PARTICLE_COUNT = 2;
const PROJECTILE_BLOCK_PARTICLE_SPEED = 3;

export class RiebeckBanjo extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, RIEBECK_BANJO)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    setStableField(player, player.Position);
    player.AnimateHappy();
    Game().SpawnParticles(
      player.Position,
      EffectVariant.DUST_CLOUD,
      STABLE_FIELD_PARTICLE_COUNT + 4,
      STABLE_FIELD_PARTICLE_SPEED + 2,
    );
    SFXManager().Play(SoundEffect.SHELL_GAME);
    syncStableFieldEffect(player);

    return undefined;
  }

  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    for (const player of getPlayers()) {
      if (!isRiebeckBanjoActive(player)) {
        continue;
      }

      applyStableField(player);
      syncStableFieldEffect(player);
    }
  }

  @Callback(ModCallback.POST_EFFECT_UPDATE, RIEBECK_BANJO_FIELD_EFFECT_VARIANT)
  postStableFieldEffectUpdate(effect: EntityEffect): void {
    const player = getStableFieldOwner(effect);
    if (player === undefined || !isRiebeckBanjoActive(player)) {
      effect.Remove();
      return;
    }

    syncStableFieldEffectToCamp(effect, player);
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED, undefined)
  postNewRoom(): void {
    for (const player of getPlayers()) {
      clearStableField(player);
    }
  }

  @Callback(ModCallback.ENTITY_TAKE_DMG)
  entityTakeDamage(
    entity: Entity,
    _amount: float,
    _damageFlags: BitFlags<DamageFlag>,
    source: EntityRef,
    _countdownFrames: int,
  ): boolean | undefined {
    const npc = entity.ToNPC();
    if (npc === undefined || !isAffectedNPC(npc)) {
      return undefined;
    }

    const player = getPlayerFromTearSource(source);
    if (
      player === undefined
      || !player.HasCollectible(BRITTLE_HOLLOW)
      || !isRiebeckBanjoActive(player)
      || !isPlayerInsideStableField(player)
    ) {
      return undefined;
    }

    forceSpawnBrittleHollowRift(npc);
    return undefined;
  }
}

function syncStableFieldEffect(player: EntityPlayer): void {
  const effect = getStableFieldEffect(player);
  if (effect === undefined) {
    spawnStableFieldEffect(player);
    return;
  }

  syncStableFieldEffectToCamp(effect, player);
}

function spawnStableFieldEffect(player: EntityPlayer): void {
  const fieldPosition = getStableFieldPosition(player);
  if (fieldPosition === undefined) {
    return;
  }

  const effect = spawn(
    EntityType.EFFECT,
    RIEBECK_BANJO_FIELD_EFFECT_VARIANT,
    0,
    fieldPosition,
  ).ToEffect();

  if (effect === undefined) {
    return;
  }

  effect.GetData()[RIEBECK_BANJO_FIELD_OWNER_SEED_KEY] = player.InitSeed;

  const sprite = effect.GetSprite();
  sprite.Load(RIEBECK_BANJO_FIELD_SPRITE, true);
  sprite.Play(RIEBECK_BANJO_FIELD_ANIMATION, true);

  syncStableFieldEffectToCamp(effect, player);
}

function syncStableFieldEffectToCamp(
  effect: EntityEffect,
  player: EntityPlayer,
): void {
  const fieldPosition = getStableFieldPosition(player);
  if (fieldPosition === undefined) {
    effect.Remove();
    return;
  }

  effect.Position = fieldPosition;
  effect.Velocity = Vector(0, 0);
  effect.SpriteOffset = STABLE_FIELD_EFFECT_SPRITE_OFFSET;
  effect.SpriteScale = STABLE_FIELD_EFFECT_SCALE;
  effect.DepthOffset = STABLE_FIELD_EFFECT_DEPTH_OFFSET;

  const sprite = effect.GetSprite();
  if (!sprite.IsPlaying(RIEBECK_BANJO_FIELD_ANIMATION)) {
    sprite.Play(RIEBECK_BANJO_FIELD_ANIMATION, true);
  }
}

function getStableFieldEffect(player: EntityPlayer): EntityEffect | undefined {
  for (const effect of getEffects(RIEBECK_BANJO_FIELD_EFFECT_VARIANT)) {
    const ownerSeed = effect.GetData()[RIEBECK_BANJO_FIELD_OWNER_SEED_KEY];
    if (ownerSeed === player.InitSeed) {
      return effect;
    }
  }

  return undefined;
}

function getStableFieldOwner(effect: EntityEffect): EntityPlayer | undefined {
  const ownerSeed = effect.GetData()[RIEBECK_BANJO_FIELD_OWNER_SEED_KEY];
  if (typeof ownerSeed !== "number") {
    return undefined;
  }

  for (const player of getPlayers()) {
    if (player.InitSeed === ownerSeed) {
      return player;
    }
  }

  return undefined;
}

function setStableField(player: EntityPlayer, position: Vector): void {
  const data = player.GetData();
  data[RIEBECK_BANJO_ACTIVE_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + STABLE_FIELD_DURATION_FRAMES;
  data[RIEBECK_BANJO_FIELD_POSITION_X_KEY] = position.X;
  data[RIEBECK_BANJO_FIELD_POSITION_Y_KEY] = position.Y;
}

function clearStableField(player: EntityPlayer): void {
  const effect = getStableFieldEffect(player);
  if (effect !== undefined) {
    effect.Remove();
  }

  const data = player.GetData();
  data[RIEBECK_BANJO_ACTIVE_UNTIL_FRAME_KEY] = undefined;
  data[RIEBECK_BANJO_FIELD_POSITION_X_KEY] = undefined;
  data[RIEBECK_BANJO_FIELD_POSITION_Y_KEY] = undefined;
}

function isRiebeckBanjoActive(player: EntityPlayer): boolean {
  const activeUntilFrame =
    player.GetData()[RIEBECK_BANJO_ACTIVE_UNTIL_FRAME_KEY];

  return (
    typeof activeUntilFrame === "number"
    && Game().GetFrameCount() <= activeUntilFrame
  );
}

function applyStableField(player: EntityPlayer): void {
  const fieldPosition = getStableFieldPosition(player);
  if (fieldPosition === undefined) {
    return;
  }

  if (Game().GetFrameCount() % STABLE_FIELD_VISUAL_INTERVAL_FRAMES === 0) {
    Game().SpawnParticles(
      fieldPosition,
      EffectVariant.DUST_CLOUD,
      STABLE_FIELD_PARTICLE_COUNT,
      STABLE_FIELD_PARTICLE_SPEED,
    );
  }

  let blockedProjectile = false;
  for (const projectile of getProjectiles()) {
    if (!shouldBlockProjectile(fieldPosition, projectile)) {
      continue;
    }

    Game().SpawnParticles(
      projectile.Position,
      EffectVariant.IMPACT,
      PROJECTILE_BLOCK_PARTICLE_COUNT,
      PROJECTILE_BLOCK_PARTICLE_SPEED,
    );
    projectile.Remove();
    blockedProjectile = true;
  }

  if (blockedProjectile) {
    SFXManager().Play(SoundEffect.ROCK_CRUMBLE, 0.45);
  }
}

function shouldBlockProjectile(
  fieldPosition: Vector,
  projectile: EntityProjectile,
): boolean {
  if (projectile.SpawnerEntity?.Type === EntityType.PLAYER) {
    return false;
  }

  return fieldPosition.Distance(projectile.Position) <= STABLE_FIELD_RADIUS;
}

function isPlayerInsideStableField(player: EntityPlayer): boolean {
  const fieldPosition = getStableFieldPosition(player);
  return (
    fieldPosition !== undefined
    && player.Position.Distance(fieldPosition) <= STABLE_FIELD_RADIUS
  );
}

function getStableFieldPosition(player: EntityPlayer): Vector | undefined {
  const data = player.GetData();
  const x = data[RIEBECK_BANJO_FIELD_POSITION_X_KEY];
  const y = data[RIEBECK_BANJO_FIELD_POSITION_Y_KEY];

  if (typeof x !== "number" || typeof y !== "number") {
    return undefined;
  }

  return Vector(x, y);
}

function getPlayerFromTearSource(source: EntityRef): EntityPlayer | undefined {
  const tear = source.Entity?.ToTear();
  if (tear === undefined) {
    return undefined;
  }

  const player = tear.SpawnerEntity?.ToPlayer();
  if (player !== undefined) {
    return player;
  }

  return tear.SpawnerEntity?.ToFamiliar()?.Player;
}

function isAffectedNPC(npc: EntityNPC): boolean {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
