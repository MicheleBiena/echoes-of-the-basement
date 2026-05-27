import type { EffectVariant } from "isaac-typescript-definitions";
import {
  CacheFlag,
  DamageFlag,
  EntityType,
  ModCallback,
  SoundEffect,
  TearFlag,
} from "isaac-typescript-definitions";
import {
  addFlag,
  Callback,
  CallbackCustom,
  getEffects,
  getNPCs,
  getPlayers,
  getTears,
  isActiveEnemy,
  ModCallbackCustom,
  ModFeature,
  spawn,
} from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

const { GIANTS_DEEP } = ITEM_IDS;

const GIANTS_DEEP_POLARITY_KEY = "echoesOfTheBasementGiantsDeepPolarity";
const GIANTS_DEEP_CYCLONE_EFFECT_SEED_KEY =
  "echoesOfTheBasementGiantsDeepCycloneEffectSeed";
const GIANTS_DEEP_CYCLONE_TEAR_SEED_KEY =
  "echoesOfTheBasementGiantsDeepCycloneTearSeed";
const GIANTS_DEEP_SUPER_TYPHOON_KEY =
  "echoesOfTheBasementGiantsDeepSuperTyphoon";
const GIANTS_DEEP_SUPER_TYPHOON_BURST_DONE_KEY =
  "echoesOfTheBasementGiantsDeepSuperTyphoonBurstDone";
const ATTRACT_POLARITY = "attract";
const REPEL_POLARITY = "repel";
const GIANTS_DEEP_CYCLONE_EFFECT_VARIANT = 9501 as EffectVariant;
const GIANTS_DEEP_CYCLONE_SPRITE = "gfx/effects/giantsDeepCyclone.anm2";
const GIANTS_DEEP_ATTRACT_CYCLONE_ANIMATION = "Attract";
const GIANTS_DEEP_REPEL_CYCLONE_ANIMATION = "Repel";
const ATTRACT_POLARITY_CHANCE = 1 / 6;
const TEAR_SPEED_MULTIPLIER = 0.35;
const CYCLONE_TEAR_HEIGHT = -12;
const CYCLONE_FALLING_SPEED = 0;
const CYCLONE_FALLING_ACCELERATION = 0;
const CYCLONE_SPRITE_OFFSET = Vector(0, -8);
const CYCLONE_TEAR_COLLISION_SIZE_MULTIPLIER = 1.2;
const CYCLONE_MIN_VISUAL_SCALE = 0.65;
const CYCLONE_MAX_VISUAL_SCALE = 2.2;
const CYCLONE_LIFETIME_FRAMES = 240;
const SUPER_TYPHOON_BASE_CHANCE = 0.005;
const SUPER_TYPHOON_CHANCE_PER_LUCK = 0.0015;
const SUPER_TYPHOON_MAX_CHANCE = 0.05;
const SUPER_TYPHOON_TEAR_COLLISION_SIZE_MULTIPLIER = 2.5;
const SUPER_TYPHOON_VISUAL_SCALE_MULTIPLIER = 2.4;
const SUPER_TYPHOON_MAX_VISUAL_SCALE = 4;
const SUPER_TYPHOON_DAMAGE = 100;
const SUPER_TYPHOON_PLAYER_RECOIL_STRENGTH = 12;
const SUPER_TYPHOON_PORTAL_SOUND_VOLUME = 1.2;
const SUPER_TYPHOON_PORTAL_SOUND_PITCH = 0.75;
const SUPER_TYPHOON_THUNDER_SOUND_VOLUME = 0.65;
const SUPER_TYPHOON_THUNDER_SOUND_PITCH = 1.1;
const SUPER_TYPHOON_VELOCITY_FORCE_STRENGTH = 24;
const SUPER_TYPHOON_POSITION_FORCE_STRENGTH = 18;
const SUPER_TYPHOON_SHOCKWAVE_AMPLITUDE = 0.12;
const SUPER_TYPHOON_SHOCKWAVE_SPEED = 0.06;
const SUPER_TYPHOON_SHOCKWAVE_DURATION = 18;
const TEAR_RANGE_BONUS = 1600;
const FIRE_DELAY_PENALTY = 14;
const FORCE_RADIUS = 220;
const VELOCITY_FORCE_STRENGTH = 2.4;
const POSITION_FORCE_STRENGTH = 5.5;
const MIN_FORCE_MULTIPLIER = 0.35;
const ENEMY_VELOCITY_DAMPING = 0.75;
const ENEMY_POSITION_CLAMP_MARGIN = 20;
const ATTRACT_COLOR = Color(0.35, 0.75, 1, 1);
const REPEL_COLOR = Color(0.25, 1, 0.45, 1);

type GiantsDeepPolarity = typeof ATTRACT_POLARITY | typeof REPEL_POLARITY;

export class GiantsDeep extends ModFeature {
  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.TEAR_FLAG)
  evaluateTearFlags(player: EntityPlayer): void {
    if (!player.HasCollectible(GIANTS_DEEP)) {
      return;
    }

    player.TearFlags = addFlag(player.TearFlags, TearFlag.BOUNCE);
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.RANGE)
  evaluateRange(player: EntityPlayer): void {
    if (!player.HasCollectible(GIANTS_DEEP)) {
      return;
    }

    player.TearRange += TEAR_RANGE_BONUS;
  }

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FIRE_DELAY)
  evaluateFireDelay(player: EntityPlayer): void {
    if (!player.HasCollectible(GIANTS_DEEP)) {
      return;
    }

    player.MaxFireDelay += FIRE_DELAY_PENALTY;
  }

  @Callback(ModCallback.POST_FIRE_TEAR)
  postFireTear(tear: EntityTear): void {
    const player = tear.SpawnerEntity?.ToPlayer();
    if (player === undefined || !player.HasCollectible(GIANTS_DEEP)) {
      return;
    }

    const shouldUseSuperTyphoon = shouldFireSuperTyphoon(player);
    const polarity = shouldUseSuperTyphoon
      ? REPEL_POLARITY
      : getRandomPolarity();
    setTearPolarity(tear, polarity);

    tear.AddTearFlags(TearFlag.BOUNCE);
    tear.Velocity = tear.Velocity.mul(TEAR_SPEED_MULTIPLIER);
    tear.ContinueVelocity = tear.ContinueVelocity.mul(TEAR_SPEED_MULTIPLIER);
    tear.Size *= CYCLONE_TEAR_COLLISION_SIZE_MULTIPLIER;
    if (shouldUseSuperTyphoon) {
      setSuperTyphoon(tear);
      tear.Size *= SUPER_TYPHOON_TEAR_COLLISION_SIZE_MULTIPLIER;
      tear.CollisionDamage = math.max(
        tear.CollisionDamage,
        SUPER_TYPHOON_DAMAGE,
      );
      pushPlayerBackFromSuperTyphoon(player, tear);
      playSuperTyphoonSound();
    }
    suspendCycloneTear(tear);
    hideCycloneTear(tear);
    spawnCycloneEffect(tear, polarity);
  }

  @Callback(ModCallback.POST_TEAR_UPDATE)
  postTearUpdate(tear: EntityTear): void {
    const polarity = getTearPolarity(tear);
    if (polarity === undefined) {
      return;
    }

    if (tear.FrameCount > CYCLONE_LIFETIME_FRAMES) {
      removeCycloneEffect(tear);
      tear.Remove();
      return;
    }

    suspendCycloneTear(tear);
    hideCycloneTear(tear);
    syncCycloneEffect(tear, polarity);
    if (isSuperTyphoon(tear)) {
      triggerSuperTyphoonBurst(tear);
      applySuperTyphoonForce(tear);
    } else {
      applyPolarityForce(tear, polarity);
    }
  }

  @Callback(ModCallback.POST_EFFECT_UPDATE, GIANTS_DEEP_CYCLONE_EFFECT_VARIANT)
  postCycloneEffectUpdate(effect: EntityEffect): void {
    const tear = getCycloneTear(effect);
    if (tear === undefined) {
      effect.Remove();
      return;
    }

    const polarity = getTearPolarity(tear);
    if (polarity === undefined) {
      effect.Remove();
      return;
    }

    syncCycloneEffectToTear(effect, tear, polarity);
  }

  @CallbackCustom(ModCallbackCustom.POST_PLAYER_COLLECTIBLE_ADDED, GIANTS_DEEP)
  postPlayerCollectibleAdded(player: EntityPlayer): void {
    this.refreshStats(player);
  }

  @CallbackCustom(
    ModCallbackCustom.POST_PLAYER_COLLECTIBLE_REMOVED,
    GIANTS_DEEP,
  )
  postPlayerCollectibleRemoved(player: EntityPlayer): void {
    this.refreshStats(player);
  }

  @CallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED, undefined)
  postGameStarted(): void {
    for (const player of getPlayers()) {
      this.refreshStats(player);
    }
  }

  private refreshStats(player: EntityPlayer): void {
    player.AddCacheFlags(CacheFlag.TEAR_FLAG);
    player.AddCacheFlags(CacheFlag.RANGE);
    player.AddCacheFlags(CacheFlag.FIRE_DELAY);
    player.EvaluateItems();
  }
}

function getRandomPolarity(): GiantsDeepPolarity {
  return math.random() < ATTRACT_POLARITY_CHANCE
    ? ATTRACT_POLARITY
    : REPEL_POLARITY;
}

function shouldFireSuperTyphoon(player: EntityPlayer) {
  const luckBonus = math.max(0, player.Luck) * SUPER_TYPHOON_CHANCE_PER_LUCK;
  const chance = math.min(
    SUPER_TYPHOON_MAX_CHANCE,
    SUPER_TYPHOON_BASE_CHANCE + luckBonus,
  );

  return math.random() < chance;
}

function setTearPolarity(tear: EntityTear, polarity: GiantsDeepPolarity) {
  tear.GetData()[GIANTS_DEEP_POLARITY_KEY] = polarity;
}

function getTearPolarity(tear: EntityTear): GiantsDeepPolarity | undefined {
  const polarity = tear.GetData()[GIANTS_DEEP_POLARITY_KEY];

  if (polarity === ATTRACT_POLARITY || polarity === REPEL_POLARITY) {
    return polarity;
  }

  return undefined;
}

function getPolarityColor(polarity: GiantsDeepPolarity): Color {
  return polarity === ATTRACT_POLARITY ? ATTRACT_COLOR : REPEL_COLOR;
}

function setSuperTyphoon(tear: EntityTear) {
  tear.GetData()[GIANTS_DEEP_SUPER_TYPHOON_KEY] = true;
}

function isSuperTyphoon(tear: EntityTear) {
  return tear.GetData()[GIANTS_DEEP_SUPER_TYPHOON_KEY] === true;
}

function hasSuperTyphoonBurstTriggered(tear: EntityTear) {
  return tear.GetData()[GIANTS_DEEP_SUPER_TYPHOON_BURST_DONE_KEY] === true;
}

function setSuperTyphoonBurstTriggered(tear: EntityTear) {
  tear.GetData()[GIANTS_DEEP_SUPER_TYPHOON_BURST_DONE_KEY] = true;
}

function suspendCycloneTear(tear: EntityTear) {
  tear.Height = CYCLONE_TEAR_HEIGHT;
  tear.FallingSpeed = CYCLONE_FALLING_SPEED;
  tear.FallingAcceleration = CYCLONE_FALLING_ACCELERATION;
}

function hideCycloneTear(tear: EntityTear) {
  tear.Visible = false;
}

function spawnCycloneEffect(tear: EntityTear, polarity: GiantsDeepPolarity) {
  const effect = spawn(
    EntityType.EFFECT,
    GIANTS_DEEP_CYCLONE_EFFECT_VARIANT,
    0,
    tear.Position,
  ).ToEffect();

  if (effect === undefined) {
    return;
  }

  tear.GetData()[GIANTS_DEEP_CYCLONE_EFFECT_SEED_KEY] = effect.InitSeed;
  effect.GetData()[GIANTS_DEEP_CYCLONE_TEAR_SEED_KEY] = tear.InitSeed;

  const sprite = effect.GetSprite();
  sprite.Load(GIANTS_DEEP_CYCLONE_SPRITE, true);
  playCycloneAnimation(sprite, polarity);

  syncCycloneEffectToTear(effect, tear, polarity);
}

function syncCycloneEffect(tear: EntityTear, polarity: GiantsDeepPolarity) {
  const effect = getCycloneEffect(tear);

  if (effect === undefined) {
    spawnCycloneEffect(tear, polarity);
    return;
  }

  syncCycloneEffectToTear(effect, tear, polarity);
}

function syncCycloneEffectToTear(
  effect: EntityEffect,
  tear: EntityTear,
  polarity: GiantsDeepPolarity,
) {
  effect.Position = tear.Position;
  effect.Velocity = tear.Velocity;
  effect.SpriteOffset = CYCLONE_SPRITE_OFFSET;
  effect.DepthOffset = 10;
  effect.SpriteScale = getCycloneVisualScale(tear);
  playCycloneAnimation(effect.GetSprite(), polarity);
  effect.SetColor(getPolarityColor(polarity), 2, 100_000, false, false);
}

function getCycloneVisualScale(tear: EntityTear): Vector {
  const tearScale =
    math.abs(tear.BaseScale - 1) > math.abs(tear.Scale - 1)
      ? tear.BaseScale
      : tear.Scale;
  const visualScale = isSuperTyphoon(tear)
    ? tearScale * SUPER_TYPHOON_VISUAL_SCALE_MULTIPLIER
    : tearScale;
  const maxScale = isSuperTyphoon(tear)
    ? SUPER_TYPHOON_MAX_VISUAL_SCALE
    : CYCLONE_MAX_VISUAL_SCALE;
  const clampedScale = math.min(
    maxScale,
    math.max(CYCLONE_MIN_VISUAL_SCALE, visualScale),
  );

  return Vector(clampedScale, clampedScale);
}

function playCycloneAnimation(sprite: Sprite, polarity: GiantsDeepPolarity) {
  const animation = getCycloneAnimation(polarity);

  if (sprite.GetAnimation() !== animation) {
    sprite.Play(animation, true);
  }
}

function getCycloneAnimation(polarity: GiantsDeepPolarity): string {
  return polarity === ATTRACT_POLARITY
    ? GIANTS_DEEP_ATTRACT_CYCLONE_ANIMATION
    : GIANTS_DEEP_REPEL_CYCLONE_ANIMATION;
}

function removeCycloneEffect(tear: EntityTear) {
  const effect = getCycloneEffect(tear);

  if (effect !== undefined) {
    effect.Remove();
  }
}

function getCycloneEffect(tear: EntityTear): EntityEffect | undefined {
  const effectSeed = tear.GetData()[GIANTS_DEEP_CYCLONE_EFFECT_SEED_KEY];

  if (typeof effectSeed !== "number") {
    return undefined;
  }

  for (const effect of getEffects(GIANTS_DEEP_CYCLONE_EFFECT_VARIANT)) {
    if (effect.InitSeed === effectSeed) {
      return effect;
    }
  }

  return undefined;
}

function getCycloneTear(effect: EntityEffect): EntityTear | undefined {
  const tearSeed = effect.GetData()[GIANTS_DEEP_CYCLONE_TEAR_SEED_KEY];

  if (typeof tearSeed !== "number") {
    return undefined;
  }

  for (const tear of getTears()) {
    if (tear.InitSeed === tearSeed) {
      return tear;
    }
  }

  return undefined;
}

function triggerSuperTyphoonBurst(tear: EntityTear) {
  if (hasSuperTyphoonBurstTriggered(tear)) {
    return;
  }

  setSuperTyphoonBurstTriggered(tear);
  Game().MakeShockwave(
    tear.Position,
    SUPER_TYPHOON_SHOCKWAVE_AMPLITUDE,
    SUPER_TYPHOON_SHOCKWAVE_SPEED,
    SUPER_TYPHOON_SHOCKWAVE_DURATION,
  );

  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    npc.TakeDamage(
      SUPER_TYPHOON_DAMAGE,
      DamageFlag.EXPLOSION,
      EntityRef(tear),
      0,
    );
    pushNPCFromSuperTyphoon(tear, npc);
  }
}

function pushPlayerBackFromSuperTyphoon(
  player: EntityPlayer,
  tear: EntityTear,
) {
  if (tear.Velocity.LengthSquared() <= 0) {
    return;
  }

  const recoilDirection = tear.Velocity.Normalized().mul(-1);
  player.Velocity = player.Velocity.add(
    recoilDirection.mul(SUPER_TYPHOON_PLAYER_RECOIL_STRENGTH),
  );
}

function playSuperTyphoonSound() {
  const sound = SFXManager();

  sound.Play(
    SoundEffect.OCULAR_RIFT_PORTAL,
    SUPER_TYPHOON_PORTAL_SOUND_VOLUME,
    0,
    false,
    SUPER_TYPHOON_PORTAL_SOUND_PITCH,
  );
  sound.Play(
    SoundEffect.THUNDER,
    SUPER_TYPHOON_THUNDER_SOUND_VOLUME,
    0,
    false,
    SUPER_TYPHOON_THUNDER_SOUND_PITCH,
  );
}

function applySuperTyphoonForce(tear: EntityTear) {
  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    pushNPCFromSuperTyphoon(tear, npc);
  }
}

function pushNPCFromSuperTyphoon(tear: EntityTear, npc: EntityNPC) {
  const direction = getSuperTyphoonPushDirection(tear, npc);

  npc.Velocity = direction.mul(SUPER_TYPHOON_VELOCITY_FORCE_STRENGTH);
  npc.Position = Game()
    .GetRoom()
    .GetClampedPosition(
      npc.Position.add(direction.mul(SUPER_TYPHOON_POSITION_FORCE_STRENGTH)),
      ENEMY_POSITION_CLAMP_MARGIN,
    );
}

function getSuperTyphoonPushDirection(
  tear: EntityTear,
  npc: EntityNPC,
): Vector {
  const positionDirection = npc.Position.sub(tear.Position);

  if (positionDirection.LengthSquared() > 0) {
    return positionDirection.Normalized();
  }

  if (tear.Velocity.LengthSquared() > 0) {
    return tear.Velocity.Normalized();
  }

  return Vector(1, 0);
}

function applyPolarityForce(tear: EntityTear, polarity: GiantsDeepPolarity) {
  const directionMultiplier = polarity === ATTRACT_POLARITY ? 1 : -1;

  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc)) {
      continue;
    }

    const distance = npc.Position.Distance(tear.Position);
    if (distance > FORCE_RADIUS || distance <= 0) {
      continue;
    }

    const direction = tear.Position.sub(npc.Position).Normalized();
    const distanceMultiplier = math.max(
      MIN_FORCE_MULTIPLIER,
      1 - distance / FORCE_RADIUS,
    );
    const velocityForce = direction.mul(
      VELOCITY_FORCE_STRENGTH * distanceMultiplier * directionMultiplier,
    );
    const positionOffset = direction.mul(
      POSITION_FORCE_STRENGTH * distanceMultiplier * directionMultiplier,
    );

    npc.Velocity = npc.Velocity.mul(ENEMY_VELOCITY_DAMPING).add(velocityForce);
    npc.Position = Game()
      .GetRoom()
      .GetClampedPosition(
        npc.Position.add(positionOffset),
        ENEMY_POSITION_CLAMP_MARGIN,
      );
  }
}

function isAffectedNPC(npc: EntityNPC) {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
