import {
  DamageFlag,
  EffectVariant,
  ModCallback,
  SoundEffect,
  TearFlag,
  TearVariant,
} from "isaac-typescript-definitions";
import {
  Callback,
  getNPCs,
  getPlayers,
  isActiveEnemy,
  ModFeature,
  spawnTear,
} from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

const { INTERLOPER } = ITEM_IDS;

const INTERLOPER_LAST_BURST_FRAME_KEY =
  "echoesOfTheBasementInterloperLastBurstFrame";
const INTERLOPER_TEAR_KEY = "echoesOfTheBasementInterloperTear";

const BURST_INTERVAL_FRAMES = 20 * 30;
const BURST_TEAR_COUNT = 12;
const BURST_TEAR_SPEED = 11;
const BURST_TEAR_SPAWN_DISTANCE = 14;
const BURST_TEAR_DAMAGE_MULTIPLIER = 0.8;
const BURST_TEAR_MIN_DAMAGE = 2;
const BURST_TEAR_SCALE = 1.15;
const BURST_TEAR_HEIGHT = -12;
const BURST_TEAR_FALLING_SPEED = 0;
const BURST_TEAR_FALLING_ACCELERATION = 0;
const BURST_TEAR_MAX_LIFETIME_FRAMES = 90;

const POISON_DURATION_FRAMES = 120;
const POISON_DAMAGE_MULTIPLIER = 0.35;
const POISON_MIN_DAMAGE = 1;
const SLOW_DURATION_FRAMES = 120;
const SLOW_MULTIPLIER = 0.55;
const FREEZE_CHANCE = 0.18;
const FREEZE_DURATION_FRAMES = 45;

const ICE_COLOR = Color(0.6, 0.95, 0.9, 1);
const SLOW_COLOR = Color(0.55, 0.9, 0.9, 1);

// Every 20 seconds in combat, icy ghost-matter shards burst out from Isaac.
export class Interloper extends ModFeature {
  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    if (!hasAffectedEnemy()) {
      return;
    }

    const frameCount = Game().GetFrameCount();
    for (const player of getPlayers()) {
      if (!player.HasCollectible(INTERLOPER)) {
        continue;
      }

      if (!shouldBurst(player, frameCount)) {
        continue;
      }

      setLastBurstFrame(player, frameCount);
      spawnInterloperBurst(player);
    }
  }

  @Callback(ModCallback.POST_TEAR_UPDATE, TearVariant.ICE)
  postTearUpdate(tear: EntityTear): void {
    if (!isInterloperTear(tear)) {
      return;
    }

    if (tear.FrameCount > BURST_TEAR_MAX_LIFETIME_FRAMES) {
      tear.Remove();
      return;
    }

    keepTearSuspended(tear);
    tear.SetColor(ICE_COLOR, 2, 100_000, false, false);
  }

  @Callback(ModCallback.PRE_TEAR_COLLISION, TearVariant.ICE)
  preTearCollision(
    tear: EntityTear,
    collider: Entity,
    _low: boolean,
  ): boolean | undefined {
    if (!isInterloperTear(tear)) {
      return undefined;
    }

    const npc = collider.ToNPC();
    if (npc === undefined || !isAffectedEnemy(npc)) {
      return undefined;
    }

    applyInterloperStatusEffects(tear, npc);
    return undefined;
  }
}

function shouldBurst(player: EntityPlayer, frameCount: int): boolean {
  const lastBurstFrame = getLastBurstFrame(player);
  if (lastBurstFrame === undefined) {
    return true;
  }

  return frameCount - lastBurstFrame >= BURST_INTERVAL_FRAMES;
}

function getLastBurstFrame(player: EntityPlayer): int | undefined {
  const lastBurstFrame = player.GetData()[INTERLOPER_LAST_BURST_FRAME_KEY];

  return typeof lastBurstFrame === "number" ? lastBurstFrame : undefined;
}

function setLastBurstFrame(player: EntityPlayer, frameCount: int): void {
  player.GetData()[INTERLOPER_LAST_BURST_FRAME_KEY] = frameCount;
}

function spawnInterloperBurst(player: EntityPlayer): void {
  for (let i = 0; i < BURST_TEAR_COUNT; i++) {
    const angle = (360 / BURST_TEAR_COUNT) * i;
    const direction = Vector.FromAngle(angle);
    spawnInterloperTear(player, direction);
  }

  Game().SpawnParticles(player.Position, EffectVariant.WATER_SPLASH, 8, 5);
  SFXManager().Play(SoundEffect.FREEZE);
}

function spawnInterloperTear(
  player: EntityPlayer,
  direction: Vector,
): void {
  const position = player.Position.add(direction.mul(BURST_TEAR_SPAWN_DISTANCE));
  const tear = spawnTear(
    TearVariant.ICE,
    0,
    position,
    direction.mul(BURST_TEAR_SPEED),
    player,
  );

  tear.CollisionDamage = math.max(
    BURST_TEAR_MIN_DAMAGE,
    player.Damage * BURST_TEAR_DAMAGE_MULTIPLIER,
  );
  tear.Scale *= BURST_TEAR_SCALE;
  tear.AddTearFlags(TearFlag.POISON);
  tear.AddTearFlags(TearFlag.SLOW);
  tear.AddTearFlags(TearFlag.ICE);
  tear.GetData()[INTERLOPER_TEAR_KEY] = true;
  keepTearSuspended(tear);
  tear.SetColor(ICE_COLOR, 100_000, 100_000, false, false);
}

function keepTearSuspended(tear: EntityTear): void {
  tear.Height = BURST_TEAR_HEIGHT;
  tear.FallingSpeed = BURST_TEAR_FALLING_SPEED;
  tear.FallingAcceleration = BURST_TEAR_FALLING_ACCELERATION;
}

function applyInterloperStatusEffects(
  tear: EntityTear,
  npc: EntityNPC,
): void {
  const source = EntityRef(tear);
  const poisonDamage = math.max(
    POISON_MIN_DAMAGE,
    tear.CollisionDamage * POISON_DAMAGE_MULTIPLIER,
  );

  npc.AddPoison(source, POISON_DURATION_FRAMES, poisonDamage);
  npc.AddSlowing(source, SLOW_DURATION_FRAMES, SLOW_MULTIPLIER, SLOW_COLOR);

  if (math.random() < FREEZE_CHANCE) {
    npc.AddFreeze(source, FREEZE_DURATION_FRAMES);
    npc.TakeDamage(
      tear.CollisionDamage,
      DamageFlag.NO_MODIFIERS,
      source,
      0,
    );
  }
}

function isInterloperTear(tear: EntityTear): boolean {
  return tear.GetData()[INTERLOPER_TEAR_KEY] === true;
}

function hasAffectedEnemy(): boolean {
  return getNPCs().some((npc) => isAffectedEnemy(npc));
}

function isAffectedEnemy(npc: EntityNPC): boolean {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
