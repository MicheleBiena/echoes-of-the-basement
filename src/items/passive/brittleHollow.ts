import {
  DamageFlag,
  EffectVariant,
  EntityGridCollisionClass,
  EntityType,
  ModCallback,
  SoundEffect,
  TearVariant,
} from "isaac-typescript-definitions";
import {
  Callback,
  getEffects,
  getGridEntitiesInRadius,
  getNPCs,
  isActiveEnemy,
  isGridEntityBreakableByExplosion,
  isGridEntityBroken,
  ModFeature,
  spawn,
  spawnTear,
} from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

const { BRITTLE_HOLLOW } = ITEM_IDS;

const HOLLOW_EFFECT_KEY = "echoesOfTheBasementBrittleHollowEffect";
const HOLLOW_FRAGMENT_KEY = "echoesOfTheBasementBrittleHollowFragment";
const HOLLOW_FRAGMENT_TARGET_SEED_KEY =
  "echoesOfTheBasementBrittleHollowFragmentTargetSeed";
const HOLLOW_TARGET_COOLDOWN_KEY =
  "echoesOfTheBasementBrittleHollowTargetCooldown";
const HOLLOW_EFFECT_VARIANT = EffectVariant.RIFT;
const HOLLOW_SPAWN_CHANCE = 0.08;
const HOLLOW_MAX_ACTIVE_RIFTS = 3;
const HOLLOW_GLOBAL_COOLDOWN_FRAMES = 10;
const HOLLOW_TARGET_COOLDOWN_FRAMES = 45;
const HOLLOW_DURATION_FRAMES = 90;
const HOLLOW_PULL_RADIUS = 140;
const HOLLOW_PULL_VELOCITY_STRENGTH = 1.1;
const HOLLOW_PULL_POSITION_STRENGTH = 1.4;
const HOLLOW_MIN_FORCE_MULTIPLIER = 0.25;
const HOLLOW_DAMAGE = 2;
const HOLLOW_DAMAGE_INTERVAL_FRAMES = 12;
const HOLLOW_ROCK_BREAK_RADIUS = 160;
const HOLLOW_ROCK_PARTICLE_COUNT = 5;
const HOLLOW_ROCK_PARTICLE_SPEED = 6;
const HOLLOW_FRAGMENT_COUNT = 4;
const HOLLOW_FRAGMENT_SPAWN_MARGIN = 90;
const HOLLOW_FRAGMENT_SPEED = 8;
const HOLLOW_FRAGMENT_HOMING_STRENGTH = 0.22;
const HOLLOW_FRAGMENT_DAMAGE = 5;
const HOLLOW_FRAGMENT_SCALE = 1.15;
const HOLLOW_FRAGMENT_HEIGHT = -8;
const HOLLOW_FRAGMENT_FALLING_SPEED = 0;
const HOLLOW_FRAGMENT_FALLING_ACCELERATION = 0;
const HOLLOW_FRAGMENT_IMPACT_DISTANCE = 18;
const HOLLOW_FRAGMENT_MAX_LIFETIME_FRAMES = 90;
const HOLLOW_POSITION_CLAMP_MARGIN = 20;
const HOLLOW_COLOR = Color(0.35, 0.15, 0.8, 1);
const HOLLOW_OPEN_SOUND_VOLUME = 0.85;
const HOLLOW_OPEN_SOUND_PITCH = 0.9;

let lastHollowSpawnFrame = -HOLLOW_GLOBAL_COOLDOWN_FRAMES;

export class BrittleHollow extends ModFeature {
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

    const player = getBrittleHollowPlayerFromDamageSource(source);
    if (player === undefined) {
      return undefined;
    }

    trySpawnHollow(npc);
    return undefined;
  }

  @Callback(ModCallback.POST_EFFECT_UPDATE, HOLLOW_EFFECT_VARIANT)
  postHollowUpdate(effect: EntityEffect): void {
    if (!isHollowEffect(effect)) {
      return;
    }

    if (effect.FrameCount > HOLLOW_DURATION_FRAMES) {
      effect.Remove();
      return;
    }

    effect.SetColor(HOLLOW_COLOR, 2, 100_000, false, false);
    applyHollowPull(effect);
    applyHollowDamage(effect);
  }

  @Callback(ModCallback.POST_TEAR_UPDATE)
  postFragmentUpdate(tear: EntityTear): void {
    if (!isHollowFragment(tear)) {
      return;
    }

    updateHollowFragment(tear);
  }
}

export function forceSpawnBrittleHollowRift(target: EntityNPC): boolean {
  if (!canForceSpawnHollow(target)) {
    return false;
  }

  return spawnHollow(target);
}

function getBrittleHollowPlayerFromDamageSource(
  source: EntityRef,
): EntityPlayer | undefined {
  const sourceEntity = source.Entity;
  const tear = sourceEntity?.ToTear();
  const player = tear?.SpawnerEntity?.ToPlayer();

  if (player === undefined || !player.HasCollectible(BRITTLE_HOLLOW)) {
    return undefined;
  }

  return player;
}

function trySpawnHollow(target: EntityNPC) {
  if (!canSpawnHollow(target)) {
    return;
  }

  if (math.random() >= HOLLOW_SPAWN_CHANCE) {
    return;
  }

  spawnHollow(target);
}

function spawnHollow(target: EntityNPC): boolean {
  const effect = spawn(
    EntityType.EFFECT,
    HOLLOW_EFFECT_VARIANT,
    0,
    target.Position,
  ).ToEffect();

  if (effect === undefined) {
    return false;
  }

  markHollowEffect(effect);
  setTargetHollowCooldown(target);
  lastHollowSpawnFrame = Game().GetFrameCount();

  effect.SetColor(HOLLOW_COLOR, 100_000, 100_000, false, false);
  breakNearbyRocks(effect);
  spawnHollowFragments(effect);
  SFXManager().Play(
    SoundEffect.OCULAR_RIFT_PORTAL,
    HOLLOW_OPEN_SOUND_VOLUME,
    0,
    false,
    HOLLOW_OPEN_SOUND_PITCH,
  );

  return true;
}

function canSpawnHollow(target: EntityNPC) {
  const currentFrame = Game().GetFrameCount();

  if (currentFrame - lastHollowSpawnFrame < HOLLOW_GLOBAL_COOLDOWN_FRAMES) {
    return false;
  }

  if (getActiveHollowCount() >= HOLLOW_MAX_ACTIVE_RIFTS) {
    return false;
  }

  return !isTargetOnHollowCooldown(target);
}

function canForceSpawnHollow(target: EntityNPC) {
  if (getActiveHollowCount() >= HOLLOW_MAX_ACTIVE_RIFTS) {
    return false;
  }

  return !isTargetOnHollowCooldown(target);
}

function isTargetOnHollowCooldown(target: EntityNPC) {
  const lastTargetFrame = target.GetData()[HOLLOW_TARGET_COOLDOWN_KEY];

  return (
    typeof lastTargetFrame === "number"
    && Game().GetFrameCount() - lastTargetFrame < HOLLOW_TARGET_COOLDOWN_FRAMES
  );
}

function setTargetHollowCooldown(target: EntityNPC) {
  target.GetData()[HOLLOW_TARGET_COOLDOWN_KEY] = Game().GetFrameCount();
}

function getActiveHollowCount(): int {
  let count = 0;

  for (const effect of getEffects(HOLLOW_EFFECT_VARIANT)) {
    if (isHollowEffect(effect)) {
      count++;
    }
  }

  return count;
}

function markHollowEffect(effect: EntityEffect) {
  effect.GetData()[HOLLOW_EFFECT_KEY] = true;
}

function isHollowEffect(effect: EntityEffect) {
  return effect.GetData()[HOLLOW_EFFECT_KEY] === true;
}

function spawnHollowFragments(effect: EntityEffect) {
  for (let i = 0; i < HOLLOW_FRAGMENT_COUNT; i++) {
    spawnHollowFragment(effect);
  }

  SFXManager().Play(SoundEffect.ROCK_CRUMBLE);
}

function spawnHollowFragment(effect: EntityEffect) {
  const spawnPosition = getHollowFragmentSpawnPosition();
  const velocity = effect.Position.sub(spawnPosition)
    .Normalized()
    .mul(HOLLOW_FRAGMENT_SPEED);
  const tear = spawnTear(TearVariant.ROCK, 0, spawnPosition, velocity, effect);

  tear.CollisionDamage = HOLLOW_FRAGMENT_DAMAGE;
  tear.Scale = HOLLOW_FRAGMENT_SCALE;
  tear.Height = HOLLOW_FRAGMENT_HEIGHT;
  tear.FallingSpeed = HOLLOW_FRAGMENT_FALLING_SPEED;
  tear.FallingAcceleration = HOLLOW_FRAGMENT_FALLING_ACCELERATION;
  tear.GridCollisionClass = EntityGridCollisionClass.NONE;
  tear.GetData()[HOLLOW_FRAGMENT_KEY] = true;
  tear.GetData()[HOLLOW_FRAGMENT_TARGET_SEED_KEY] = effect.InitSeed;

  Game().SpawnParticles(spawnPosition, EffectVariant.ROCK_PARTICLE, 2, 0);
}

function getHollowFragmentSpawnPosition(): Vector {
  const room = Game().GetRoom();
  const topLeft = room.GetTopLeftPos();
  const bottomRight = room.GetBottomRightPos();
  const side = math.random(1, 4);

  switch (side) {
    case 1: {
      return Vector(
        randomFloat(topLeft.X, bottomRight.X),
        topLeft.Y - HOLLOW_FRAGMENT_SPAWN_MARGIN,
      );
    }

    case 2: {
      return Vector(
        bottomRight.X + HOLLOW_FRAGMENT_SPAWN_MARGIN,
        randomFloat(topLeft.Y, bottomRight.Y),
      );
    }

    case 3: {
      return Vector(
        randomFloat(topLeft.X, bottomRight.X),
        bottomRight.Y + HOLLOW_FRAGMENT_SPAWN_MARGIN,
      );
    }

    default: {
      return Vector(
        topLeft.X - HOLLOW_FRAGMENT_SPAWN_MARGIN,
        randomFloat(topLeft.Y, bottomRight.Y),
      );
    }
  }
}

function randomFloat(min: float, max: float): float {
  return min + math.random() * (max - min);
}

function isHollowFragment(tear: EntityTear) {
  return tear.GetData()[HOLLOW_FRAGMENT_KEY] === true;
}

function updateHollowFragment(tear: EntityTear) {
  if (tear.FrameCount > HOLLOW_FRAGMENT_MAX_LIFETIME_FRAMES) {
    removeHollowFragment(tear);
    return;
  }

  const target = getHollowFragmentTarget(tear);
  if (target === undefined) {
    removeHollowFragment(tear);
    return;
  }

  const distance = tear.Position.Distance(target.Position);
  if (distance <= HOLLOW_FRAGMENT_IMPACT_DISTANCE) {
    Game().SpawnParticles(
      tear.Position,
      EffectVariant.ROCK_PARTICLE,
      HOLLOW_ROCK_PARTICLE_COUNT,
      HOLLOW_ROCK_PARTICLE_SPEED,
    );
    removeHollowFragment(tear);
    return;
  }

  const targetVelocity = target.Position.sub(tear.Position)
    .Normalized()
    .mul(HOLLOW_FRAGMENT_SPEED);
  tear.Velocity = tear.Velocity.Lerp(
    targetVelocity,
    HOLLOW_FRAGMENT_HOMING_STRENGTH,
  );
  tear.FallingSpeed = HOLLOW_FRAGMENT_FALLING_SPEED;
  tear.FallingAcceleration = HOLLOW_FRAGMENT_FALLING_ACCELERATION;
  tear.GridCollisionClass = EntityGridCollisionClass.NONE;
}

function removeHollowFragment(tear: EntityTear) {
  tear.Remove();
}

function getHollowFragmentTarget(tear: EntityTear): EntityEffect | undefined {
  const targetSeed = tear.GetData()[HOLLOW_FRAGMENT_TARGET_SEED_KEY];

  if (typeof targetSeed !== "number") {
    return undefined;
  }

  for (const effect of getEffects(HOLLOW_EFFECT_VARIANT)) {
    if (effect.InitSeed === targetSeed && isHollowEffect(effect)) {
      return effect;
    }
  }

  return undefined;
}

function breakNearbyRocks(effect: EntityEffect) {
  let brokeGridEntity = false;

  for (const gridEntity of getGridEntitiesInRadius(
    effect.Position,
    HOLLOW_ROCK_BREAK_RADIUS,
  )) {
    if (
      !isGridEntityBreakableByExplosion(gridEntity)
      || isGridEntityBroken(gridEntity)
    ) {
      continue;
    }

    Game().GetRoom().DestroyGrid(gridEntity.GetGridIndex(), false);
    Game().SpawnParticles(
      gridEntity.Position,
      EffectVariant.ROCK_PARTICLE,
      HOLLOW_ROCK_PARTICLE_COUNT,
      HOLLOW_ROCK_PARTICLE_SPEED,
    );
    brokeGridEntity = true;
  }

  if (brokeGridEntity) {
    SFXManager().Play(SoundEffect.ROCK_CRUMBLE);
  }
}

function applyHollowPull(effect: EntityEffect) {
  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    const distance = npc.Position.Distance(effect.Position);
    if (distance > HOLLOW_PULL_RADIUS || distance <= 0) {
      continue;
    }

    const direction = effect.Position.sub(npc.Position).Normalized();
    const distanceMultiplier = math.max(
      HOLLOW_MIN_FORCE_MULTIPLIER,
      1 - distance / HOLLOW_PULL_RADIUS,
    );
    const velocityForce = direction.mul(
      HOLLOW_PULL_VELOCITY_STRENGTH * distanceMultiplier,
    );
    const positionOffset = direction.mul(
      HOLLOW_PULL_POSITION_STRENGTH * distanceMultiplier,
    );

    npc.Velocity = npc.Velocity.add(velocityForce);
    npc.Position = Game()
      .GetRoom()
      .GetClampedPosition(
        npc.Position.add(positionOffset),
        HOLLOW_POSITION_CLAMP_MARGIN,
      );
  }
}

function applyHollowDamage(effect: EntityEffect) {
  if (effect.FrameCount % HOLLOW_DAMAGE_INTERVAL_FRAMES !== 0) {
    return;
  }

  for (const npc of getNPCs()) {
    if (
      !isAffectedNPC(npc)
      || npc.Position.Distance(effect.Position) > HOLLOW_PULL_RADIUS
    ) {
      continue;
    }

    npc.TakeDamage(
      HOLLOW_DAMAGE,
      DamageFlag.NO_MODIFIERS,
      EntityRef(effect),
      0,
    );
  }
}

function isAffectedNPC(npc: EntityNPC) {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
