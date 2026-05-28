import {
  CacheFlag,
  DamageFlag,
  EffectVariant,
  EntityType,
  GridCollisionClass,
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
  hasFlag,
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
const GIANTS_DEEP_REPEL_IMPACT_DAMAGE_KEY =
  "echoesOfTheBasementGiantsDeepRepelImpactDamage";
const GIANTS_DEEP_REPEL_LAUNCH_ID_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchID";
const GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_X_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchDirectionX";
const GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_Y_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchDirectionY";
const GIANTS_DEEP_REPEL_LAUNCH_DAMAGE_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchDamage";
const GIANTS_DEEP_REPEL_LAUNCH_MULTIPLIER_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchMultiplier";
const GIANTS_DEEP_REPEL_LAUNCH_BOUNCE_COUNT_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchBounceCount";
const GIANTS_DEEP_REPEL_LAUNCH_SOURCE_TEAR_SEED_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchSourceTearSeed";
const GIANTS_DEEP_REPEL_LAUNCH_TEAR_FLAGS_KEY =
  "echoesOfTheBasementGiantsDeepRepelLaunchTearFlags";
const GIANTS_DEEP_REPEL_LAUNCH_TEAR_HIT_PREFIX =
  "echoesOfTheBasementGiantsDeepRepelLaunchTearHit";
const GIANTS_DEEP_REPEL_TEAR_LAUNCH_COOLDOWN_PREFIX =
  "echoesOfTheBasementGiantsDeepRepelTearLaunchCooldown";
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
const CYCLONE_TEAR_COLLISION_SIZE_MULTIPLIER = 3.2;
const CYCLONE_MIN_VISUAL_SCALE = 0.65;
const CYCLONE_MAX_VISUAL_SCALE = 2.2;
const CYCLONE_LIFETIME_FRAMES = 240;
const MAX_ACTIVE_NORMAL_CYCLONES = 16;
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
const FORCE_RADIUS = 190;
const VELOCITY_FORCE_STRENGTH = 2.4;
const POSITION_FORCE_STRENGTH = 5.5;
const MIN_FORCE_MULTIPLIER = 0.35;
const ENEMY_VELOCITY_DAMPING = 0.75;
const ENEMY_POSITION_CLAMP_MARGIN = 20;
const REPEL_LAUNCH_SPEED = 16;
const REPEL_CHAIN_DAMAGE_MULTIPLIER_BONUS = 0.5;
const REPEL_CHAIN_MAX_DAMAGE_MULTIPLIER = 10;
const REPEL_CHAIN_IMPACT_BOUNCE_COUNT = 5;
const REPEL_TEAR_RELAUNCH_COOLDOWN_FRAMES = 18;
const REPEL_LAUNCH_GRID_SAMPLE_DISTANCE = 12;
const REPEL_IMPACT_PARTICLE_COUNT = 5;
const REPEL_IMPACT_PARTICLE_SPEED = 6;
const REPEL_STATUS_DURATION_FRAMES = 90;
const REPEL_FREEZE_DURATION_FRAMES = 45;
const REPEL_STATUS_DAMAGE_MULTIPLIER = 0.5;
const REPEL_CHAIN_SPLASH_RADIUS = 120;
const REPEL_CHAIN_SPLASH_DAMAGE_MULTIPLIER = 0.35;
const REPEL_EXPLOSIVE_SPLASH_RADIUS = 110;
const REPEL_EXPLOSIVE_SPLASH_DAMAGE_MULTIPLIER = 0.45;
const ATTRACT_COLOR = Color(0.62, 0.5, 0.78, 1);
const REPEL_COLOR = Color(0.48, 0.7, 0.55, 1);
const REPEL_SLOW_COLOR = Color(0.5, 0.7, 0.55, 1);

type GiantsDeepPolarity = typeof ATTRACT_POLARITY | typeof REPEL_POLARITY;

interface RepelLaunchState {
  readonly direction: Vector;
  readonly damage: float;
  readonly launchID: int;
  readonly multiplier: float;
  readonly bounceCount: int;
  readonly sourceTearSeed: int;
  readonly tearFlags: BitFlags<TearFlag>;
}

let nextRepelLaunchID = 1;

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
    } else if (polarity === REPEL_POLARITY) {
      setRepelImpactDamage(tear, tear.CollisionDamage);
    }
    suspendCycloneTear(tear);
    hideCycloneTear(tear);
    spawnCycloneEffect(tear, polarity);
    enforceActiveCycloneLimit();
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
    } else if (polarity === ATTRACT_POLARITY) {
      applyAttractForce(tear);
    } else {
      updateRepelCyclone(tear);
    }
  }

  @Callback(ModCallback.POST_NPC_UPDATE)
  postNPCUpdate(npc: EntityNPC): void {
    updateRepelLaunchedNPC(npc);
  }

  @Callback(ModCallback.PRE_TEAR_COLLISION)
  preTearCollision(
    tear: EntityTear,
    collider: Entity,
    _low: boolean,
  ): boolean | undefined {
    if (!isRepelCycloneTear(tear) || isSuperTyphoon(tear)) {
      return undefined;
    }

    const npc = collider.ToNPC();
    if (npc === undefined || !isAffectedNPC(npc)) {
      return undefined;
    }

    launchOrBoostNPCFromRepelCyclone(tear, npc);
    return true;
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

function enforceActiveCycloneLimit() {
  const cycloneTears = getActiveNormalCycloneTears();
  const extraCycloneCount = cycloneTears.length - MAX_ACTIVE_NORMAL_CYCLONES;

  if (extraCycloneCount <= 0) {
    return;
  }

  cycloneTears.sort((left, right) => right.FrameCount - left.FrameCount);

  for (let i = 0; i < extraCycloneCount; i++) {
    const cycloneTear = cycloneTears[i];

    if (cycloneTear !== undefined) {
      removeCycloneTear(cycloneTear);
    }
  }
}

function getActiveNormalCycloneTears() {
  const cycloneTears: EntityTear[] = [];

  for (const tear of getTears()) {
    if (getTearPolarity(tear) === undefined || isSuperTyphoon(tear)) {
      continue;
    }

    cycloneTears.push(tear);
  }

  return cycloneTears;
}

function removeCycloneTear(tear: EntityTear) {
  removeCycloneEffect(tear);
  tear.Remove();
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

function applyAttractForce(tear: EntityTear) {
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
      VELOCITY_FORCE_STRENGTH * distanceMultiplier,
    );
    const positionOffset = direction.mul(
      POSITION_FORCE_STRENGTH * distanceMultiplier,
    );

    const unclampedPosition = npc.Position.add(positionOffset);
    const clampedPosition = Game()
      .GetRoom()
      .GetClampedPosition(unclampedPosition, ENEMY_POSITION_CLAMP_MARGIN);

    npc.Velocity = npc.Velocity.mul(ENEMY_VELOCITY_DAMPING).add(velocityForce);
    npc.Position = clampedPosition;
  }
}

function updateRepelCyclone(tear: EntityTear) {
  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc) || !isRepelTearTouchingNPC(tear, npc)) {
      continue;
    }

    launchOrBoostNPCFromRepelCyclone(tear, npc);
  }
}

function launchOrBoostNPCFromRepelCyclone(tear: EntityTear, npc: EntityNPC) {
  const state = getRepelLaunchState(npc);
  if (state === undefined) {
    launchNPCFromRepelCyclone(tear, npc);
    return;
  }

  boostRepelLaunchedNPCFromTear(tear, npc, state);
}

function launchNPCFromRepelCyclone(tear: EntityTear, npc: EntityNPC) {
  if (isRepelTearLaunchOnCooldown(tear, npc)) {
    return;
  }

  const launchID = getNextRepelLaunchID();
  const direction = getRepelLaunchDirection(tear, npc);
  const damage = getRepelImpactDamage(tear);

  setRepelLaunchState(npc, {
    direction,
    damage,
    launchID,
    multiplier: 1,
    bounceCount: 1,
    sourceTearSeed: tear.InitSeed,
    tearFlags: tear.TearFlags,
  });
  markRepelLaunchTearHit(npc, tear, launchID);
  markRepelTearLaunchCooldown(tear, npc);
  npc.Velocity = direction.mul(REPEL_LAUNCH_SPEED);
}

function boostRepelLaunchedNPCFromTear(
  tear: EntityTear,
  npc: EntityNPC,
  state: RepelLaunchState,
) {
  if (hasRepelLaunchHitTear(npc, tear, state.launchID)) {
    return;
  }

  const direction = getRepelLaunchDirection(tear, npc);
  const multiplier = math.min(
    REPEL_CHAIN_MAX_DAMAGE_MULTIPLIER,
    state.multiplier + REPEL_CHAIN_DAMAGE_MULTIPLIER_BONUS,
  );
  const bounceCount = state.bounceCount + 1;
  const nextState = {
    direction,
    damage: state.damage,
    launchID: state.launchID,
    multiplier,
    bounceCount,
    sourceTearSeed: state.sourceTearSeed,
    tearFlags: addFlag(state.tearFlags, tear.TearFlags),
  };

  setRepelLaunchState(npc, nextState);
  markRepelLaunchTearHit(npc, tear, state.launchID);
  markRepelTearLaunchCooldown(tear, npc);

  if (bounceCount >= REPEL_CHAIN_IMPACT_BOUNCE_COUNT) {
    finishRepelLaunchImpact(npc, nextState);
    return;
  }

  npc.Velocity = direction.mul(REPEL_LAUNCH_SPEED);
}

function updateRepelLaunchedNPC(npc: EntityNPC) {
  const state = getRepelLaunchState(npc);
  if (state === undefined) {
    return;
  }

  if (!isAffectedNPC(npc)) {
    clearRepelLaunchState(npc);
    return;
  }

  boostRepelLaunchedNPCFromNearbyTears(npc, state);
  const updatedState = getRepelLaunchState(npc) ?? state;
  const {direction} = updatedState;
  const currentPosition = npc.Position;
  const nextPosition = currentPosition.add(direction.mul(REPEL_LAUNCH_SPEED));
  const clampedPosition = Game()
    .GetRoom()
    .GetClampedPosition(nextPosition, ENEMY_POSITION_CLAMP_MARGIN);
  const hitWall = wasPositionClamped(nextPosition, clampedPosition);
  const hitGrid = hasRepelLaunchHitGrid(
    currentPosition,
    clampedPosition,
    direction,
    npc.Size,
  );

  if (hitWall || hitGrid) {
    npc.Position = hitWall ? clampedPosition : currentPosition;
    finishRepelLaunchImpact(npc, updatedState);
    return;
  }

  npc.Velocity = direction.mul(REPEL_LAUNCH_SPEED);
  npc.Position = clampedPosition;
}

function boostRepelLaunchedNPCFromNearbyTears(
  npc: EntityNPC,
  state: RepelLaunchState,
) {
  let currentState: RepelLaunchState | undefined = state;

  for (const tear of getTears()) {
    currentState = getRepelLaunchState(npc);
    if (currentState === undefined) {
      return;
    }

    if (
      !isRepelCycloneTear(tear)
      || isSuperTyphoon(tear)
      || !isRepelTearTouchingNPC(tear, npc)
    ) {
      continue;
    }

    boostRepelLaunchedNPCFromTear(tear, npc, currentState);
  }
}

function finishRepelLaunchImpact(npc: EntityNPC, state: RepelLaunchState) {
  const source = getTearBySeed(state.sourceTearSeed) ?? npc;
  const damage = state.damage * state.multiplier;

  clearRepelLaunchState(npc);
  npc.Velocity = Vector(0, 0);
  applyRepelImpactTearFlagEffects(npc, state, source, damage);
  npc.TakeDamage(damage, DamageFlag.NO_MODIFIERS, EntityRef(source), 0);
  Game().SpawnParticles(
    npc.Position,
    EffectVariant.ROCK_PARTICLE,
    REPEL_IMPACT_PARTICLE_COUNT,
    REPEL_IMPACT_PARTICLE_SPEED,
  );
  SFXManager().Play(SoundEffect.ROCK_CRUMBLE);
}

function applyRepelImpactTearFlagEffects(
  npc: EntityNPC,
  state: RepelLaunchState,
  source: Entity,
  damage: float,
) {
  const sourceRef = EntityRef(source);
  const dotDamage = math.max(1, damage * REPEL_STATUS_DAMAGE_MULTIPLIER);

  if (hasFlag(state.tearFlags, TearFlag.POISON)) {
    npc.AddPoison(sourceRef, REPEL_STATUS_DURATION_FRAMES, dotDamage);
  }

  if (hasFlag(state.tearFlags, TearFlag.BURN)) {
    npc.AddBurn(sourceRef, REPEL_STATUS_DURATION_FRAMES, dotDamage);
  }

  if (
    hasFlag(state.tearFlags, TearFlag.SLOW)
    || hasFlag(state.tearFlags, TearFlag.GISH)
  ) {
    npc.AddSlowing(
      sourceRef,
      REPEL_STATUS_DURATION_FRAMES,
      0.5,
      REPEL_SLOW_COLOR,
    );
  }

  if (hasFlag(state.tearFlags, TearFlag.FEAR)) {
    npc.AddFear(sourceRef, REPEL_STATUS_DURATION_FRAMES);
  }

  if (hasFlag(state.tearFlags, TearFlag.CHARM)) {
    npc.AddCharmed(sourceRef, REPEL_STATUS_DURATION_FRAMES);
  }

  if (
    hasFlag(state.tearFlags, TearFlag.CONFUSION)
    || hasFlag(state.tearFlags, TearFlag.PERMANENT_CONFUSION)
  ) {
    npc.AddConfusion(sourceRef, REPEL_STATUS_DURATION_FRAMES);
  }

  if (
    hasFlag(state.tearFlags, TearFlag.FREEZE)
    || hasFlag(state.tearFlags, TearFlag.ICE)
  ) {
    npc.AddFreeze(sourceRef, REPEL_FREEZE_DURATION_FRAMES);
  }

  if (hasFlag(state.tearFlags, TearFlag.MIDAS)) {
    npc.AddMidasFreeze(sourceRef, REPEL_FREEZE_DURATION_FRAMES);
  }

  if (
    hasFlag(state.tearFlags, TearFlag.SHRINK)
    || hasFlag(state.tearFlags, TearFlag.GODS_FLESH)
  ) {
    npc.AddShrink(sourceRef, REPEL_STATUS_DURATION_FRAMES);
  }

  if (hasFlag(state.tearFlags, TearFlag.EXPLOSIVE)) {
    applyRepelImpactSplashDamage(
      npc,
      source,
      damage * REPEL_EXPLOSIVE_SPLASH_DAMAGE_MULTIPLIER,
      REPEL_EXPLOSIVE_SPLASH_RADIUS,
      DamageFlag.EXPLOSION,
    );
    spawn(EntityType.EFFECT, EffectVariant.BOMB_EXPLOSION, 0, npc.Position);
    SFXManager().Play(SoundEffect.EXPLOSION_WEAK);
  }

  if (
    hasFlag(state.tearFlags, TearFlag.CHAIN)
    || hasFlag(state.tearFlags, TearFlag.JACOBS)
  ) {
    applyRepelImpactSplashDamage(
      npc,
      source,
      damage * REPEL_CHAIN_SPLASH_DAMAGE_MULTIPLIER,
      REPEL_CHAIN_SPLASH_RADIUS,
      DamageFlag.NO_MODIFIERS,
    );
    Game().SpawnParticles(npc.Position, EffectVariant.IMPACT, 4, 6);
  }
}

function applyRepelImpactSplashDamage(
  impactNPC: EntityNPC,
  source: Entity,
  damage: float,
  radius: float,
  damageFlag: DamageFlag,
) {
  for (const npc of getNPCs()) {
    if (
      npc.InitSeed === impactNPC.InitSeed
      || !isAffectedNPC(npc)
      || npc.Position.Distance(impactNPC.Position) > radius
    ) {
      continue;
    }

    npc.TakeDamage(damage, damageFlag, EntityRef(source), 0);
  }
}

function setRepelImpactDamage(tear: EntityTear, damage: float) {
  tear.GetData()[GIANTS_DEEP_REPEL_IMPACT_DAMAGE_KEY] = damage;
}

function getRepelImpactDamage(tear: EntityTear): float {
  const damage = tear.GetData()[GIANTS_DEEP_REPEL_IMPACT_DAMAGE_KEY];

  if (tear.CollisionDamage > 0) {
    return tear.CollisionDamage;
  }

  return typeof damage === "number" ? damage : tear.BaseDamage;
}

function setRepelLaunchState(npc: EntityNPC, state: RepelLaunchState) {
  const data = npc.GetData();

  data[GIANTS_DEEP_REPEL_LAUNCH_ID_KEY] = state.launchID;
  data[GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_X_KEY] = state.direction.X;
  data[GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_Y_KEY] = state.direction.Y;
  data[GIANTS_DEEP_REPEL_LAUNCH_DAMAGE_KEY] = state.damage;
  data[GIANTS_DEEP_REPEL_LAUNCH_MULTIPLIER_KEY] = state.multiplier;
  data[GIANTS_DEEP_REPEL_LAUNCH_BOUNCE_COUNT_KEY] = state.bounceCount;
  data[GIANTS_DEEP_REPEL_LAUNCH_SOURCE_TEAR_SEED_KEY] =
    state.sourceTearSeed;
  data[GIANTS_DEEP_REPEL_LAUNCH_TEAR_FLAGS_KEY] = state.tearFlags;
}

function getRepelLaunchState(npc: EntityNPC): RepelLaunchState | undefined {
  const data = npc.GetData();
  const launchID = data[GIANTS_DEEP_REPEL_LAUNCH_ID_KEY];
  const directionX = data[GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_X_KEY];
  const directionY = data[GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_Y_KEY];
  const damage = data[GIANTS_DEEP_REPEL_LAUNCH_DAMAGE_KEY];
  const multiplier = data[GIANTS_DEEP_REPEL_LAUNCH_MULTIPLIER_KEY];
  const bounceCount = data[GIANTS_DEEP_REPEL_LAUNCH_BOUNCE_COUNT_KEY];
  const sourceTearSeed =
    data[GIANTS_DEEP_REPEL_LAUNCH_SOURCE_TEAR_SEED_KEY];
  const tearFlags = data[GIANTS_DEEP_REPEL_LAUNCH_TEAR_FLAGS_KEY];

  if (
    typeof launchID !== "number"
    || typeof directionX !== "number"
    || typeof directionY !== "number"
    || typeof damage !== "number"
    || typeof multiplier !== "number"
    || typeof bounceCount !== "number"
    || typeof sourceTearSeed !== "number"
    || typeof tearFlags !== "number"
  ) {
    return undefined;
  }

  return {
    direction: Vector(directionX, directionY),
    damage,
    launchID,
    multiplier,
    bounceCount,
    sourceTearSeed,
    tearFlags: tearFlags as unknown as BitFlags<TearFlag>,
  };
}

function clearRepelLaunchState(npc: EntityNPC) {
  const data = npc.GetData();

  data[GIANTS_DEEP_REPEL_LAUNCH_ID_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_X_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_DIRECTION_Y_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_DAMAGE_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_MULTIPLIER_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_BOUNCE_COUNT_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_SOURCE_TEAR_SEED_KEY] = undefined;
  data[GIANTS_DEEP_REPEL_LAUNCH_TEAR_FLAGS_KEY] = undefined;
}

function getNextRepelLaunchID(): int {
  const launchID = nextRepelLaunchID;

  nextRepelLaunchID++;
  return launchID;
}

function getRepelLaunchDirection(tear: EntityTear, npc: EntityNPC): Vector {
  if (tear.Velocity.LengthSquared() > 0) {
    return tear.Velocity.Normalized();
  }

  if (tear.ContinueVelocity.LengthSquared() > 0) {
    return tear.ContinueVelocity.Normalized();
  }

  const positionDirection = npc.Position.sub(tear.Position);
  if (positionDirection.LengthSquared() > 0) {
    return positionDirection.Normalized();
  }

  return Vector(1, 0);
}

function isRepelCycloneTear(tear: EntityTear) {
  return getTearPolarity(tear) === REPEL_POLARITY;
}

function isRepelTearTouchingNPC(tear: EntityTear, npc: EntityNPC) {
  return tear.Position.Distance(npc.Position) <= tear.Size + npc.Size;
}

function hasRepelLaunchHitTear(
  npc: EntityNPC,
  tear: EntityTear,
  launchID: int,
) {
  return npc.GetData()[getRepelLaunchTearHitKey(tear)] === launchID;
}

function markRepelLaunchTearHit(
  npc: EntityNPC,
  tear: EntityTear,
  launchID: int,
) {
  npc.GetData()[getRepelLaunchTearHitKey(tear)] = launchID;
}

function getRepelLaunchTearHitKey(tear: EntityTear) {
  return `${GIANTS_DEEP_REPEL_LAUNCH_TEAR_HIT_PREFIX}${tear.InitSeed}`;
}

function isRepelTearLaunchOnCooldown(tear: EntityTear, npc: EntityNPC) {
  const lastLaunchFrame = npc.GetData()[getRepelTearLaunchCooldownKey(tear)];

  return (
    typeof lastLaunchFrame === "number"
    && Game().GetFrameCount() - lastLaunchFrame
      < REPEL_TEAR_RELAUNCH_COOLDOWN_FRAMES
  );
}

function markRepelTearLaunchCooldown(tear: EntityTear, npc: EntityNPC) {
  npc.GetData()[getRepelTearLaunchCooldownKey(tear)] = Game().GetFrameCount();
}

function getRepelTearLaunchCooldownKey(tear: EntityTear) {
  return `${GIANTS_DEEP_REPEL_TEAR_LAUNCH_COOLDOWN_PREFIX}${tear.InitSeed}`;
}

function hasRepelLaunchHitGrid(
  currentPosition: Vector,
  nextPosition: Vector,
  direction: Vector,
  npcSize: float,
) {
  const sideOffset = math.max(4, npcSize * 0.5);
  const forwardOffset = math.max(
    REPEL_LAUNCH_GRID_SAMPLE_DISTANCE,
    npcSize * 0.75,
  );
  const perpendicular = Vector(-direction.Y, direction.X);
  const samplePositions = [
    nextPosition,
    nextPosition.add(direction.mul(forwardOffset)),
    nextPosition.add(perpendicular.mul(sideOffset)),
    nextPosition.sub(perpendicular.mul(sideOffset)),
  ];

  if (
    currentPosition.Distance(nextPosition) > REPEL_LAUNCH_GRID_SAMPLE_DISTANCE
  ) {
    samplePositions.push(
      currentPosition.add(direction.mul(REPEL_LAUNCH_GRID_SAMPLE_DISTANCE)),
    );
  }

  for (const position of samplePositions) {
    if (isSolidGridCollision(Game().GetRoom().GetGridCollisionAtPos(position))) {
      return true;
    }
  }

  return false;
}

function isSolidGridCollision(gridCollisionClass: GridCollisionClass) {
  return (
    gridCollisionClass === GridCollisionClass.OBJECT
    || gridCollisionClass === GridCollisionClass.SOLID
    || gridCollisionClass === GridCollisionClass.WALL
    || gridCollisionClass === GridCollisionClass.WALL_EXCEPT_PLAYER
  );
}

function getTearBySeed(seed: int): EntityTear | undefined {
  for (const tear of getTears()) {
    if (tear.InitSeed === seed) {
      return tear;
    }
  }

  return undefined;
}

function wasPositionClamped(position: Vector, clampedPosition: Vector) {
  return position.Distance(clampedPosition) > 0.1;
}

function isAffectedNPC(npc: EntityNPC) {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
