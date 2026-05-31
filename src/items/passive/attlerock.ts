import type { FamiliarVariant } from "isaac-typescript-definitions";
import {
  CacheFlag,
  EffectVariant,
  EntityType,
  ModCallback,
  SoundEffect,
  TearVariant,
} from "isaac-typescript-definitions";
import {
  Callback,
  getClosestEntityTo,
  getNPCs,
  getProjectiles,
  getRandomSeed,
  isActiveEnemy,
  ModFeature,
  setSeed,
  spawnTear,
} from "isaacscript-common";
import { getEskerWhistleAttlerockCount } from "../../utils/eskerWhistleAttlerocks";
import { ITEM_IDS } from "../itemRegistry";

const { THE_ATTLEROCK } = ITEM_IDS;
const CONFIG_ATTLEROCK = Isaac.GetItemConfig().GetCollectible(THE_ATTLEROCK);
const ATTLEROCK_VARIANT = Isaac.GetEntityVariantByName(
  "The Attlerock",
) as FamiliarVariant;

/** Radius around the familiar in which enemy projectiles are absorbed. */
const ABSORB_RADIUS = 28;

/** Number of projectiles to absorb before firing a burst. */
const BURST_THRESHOLD = 3;

/** Base speed of reflected tears. */
const TEAR_SPEED = 12;

/** Base damage per reflected tear. */
const BASE_TEAR_DAMAGE = 3.5;

/** Extra damage added per absorbed projectile beyond the threshold. */
const BONUS_DAMAGE_PER_PROJECTILE = 0.5;

/** Delay in frames between each tear in a burst. */
const BURST_FIRE_INTERVAL = 3;

/** Orbit layer used by the Attlerock familiar. */
const ORBIT_LAYER = 99;

export class Attlerock extends ModFeature {
  private absorbedCount = 0;
  private burstQueue = 0;
  private burstCooldown = 0;
  private burstDamage = 0;

  @Callback(ModCallback.EVALUATE_CACHE, CacheFlag.FAMILIARS)
  evaluateCache(player: EntityPlayer): void {
    const effects = player.GetEffects();
    const count =
      effects.GetCollectibleEffectNum(THE_ATTLEROCK)
      + player.GetCollectibleNum(THE_ATTLEROCK)
      + getEskerWhistleAttlerockCount(player);

    const rng = RNG();
    const seed = getRandomSeed();
    setSeed(rng, seed);

    player.CheckFamiliar(ATTLEROCK_VARIANT, count, rng, CONFIG_ATTLEROCK);
  }

  @Callback(ModCallback.POST_FAMILIAR_INIT, ATTLEROCK_VARIANT)
  handleInit(familiar: EntityFamiliar): void {
    familiar.AddToOrbit(ORBIT_LAYER);
  }

  @Callback(ModCallback.POST_FAMILIAR_UPDATE, ATTLEROCK_VARIANT)
  handleUpdate(familiar: EntityFamiliar): void {
    const sprite = familiar.GetSprite();
    sprite.Play("Float", true);

    // Orbit around the owning player.
    const player = familiar.Player;
    familiar.Velocity = familiar
      .GetOrbitPosition(player.Position.add(player.Velocity))
      .sub(familiar.Position);

    this.absorbProjectiles(familiar);
    this.processBurst(familiar);
  }

  // Scan for enemy projectiles near the familiar and absorb them. When enough projectiles have been
  // absorbed, queue a burst toward the nearest enemy.
  private absorbProjectiles(familiar: EntityFamiliar): void {
    const projectiles = getProjectiles();

    for (const proj of projectiles) {
      if (proj.SpawnerEntity?.Type === EntityType.PLAYER) {
        continue;
      }

      const dist = familiar.Position.Distance(proj.Position);
      if (dist > ABSORB_RADIUS) {
        continue;
      }

      // Absorb the projectile.
      proj.Remove();
      this.absorbedCount++;

      Game().SpawnParticles(familiar.Position, EffectVariant.IMPACT, 1, 0);
      SFXManager().Play(SoundEffect.TOOTH_AND_NAIL);

      // Visual feedback: brief white flash on the familiar.
      familiar.SetColor(Color(2, 2, 2), 4, 0, true, false);

      if (this.absorbedCount >= BURST_THRESHOLD) {
        this.triggerBurst();
      }
    }
  }

  /** Queue a burst of reflected tears and reset the absorption counter. */
  private triggerBurst(): void {
    this.burstQueue = this.absorbedCount;
    this.burstDamage =
      BASE_TEAR_DAMAGE
      + Math.max(0, this.absorbedCount - BURST_THRESHOLD)
        * BONUS_DAMAGE_PER_PROJECTILE;
    this.burstCooldown = 0;
    this.absorbedCount = 0;
  }

  // Fire one tear per interval from the burst queue, aimed at the nearest enemy. If no enemies
  // remain, fire outward from the player.
  private processBurst(familiar: EntityFamiliar): void {
    if (this.burstQueue <= 0) {
      return;
    }

    this.burstCooldown--;
    if (this.burstCooldown > 0) {
      return;
    }

    this.burstCooldown = BURST_FIRE_INTERVAL;
    this.burstQueue--;

    const aliveNPCs = getNPCs().filter(
      (npc) => isActiveEnemy(npc) && npc.IsVulnerableEnemy(),
    );
    const target = getClosestEntityTo(familiar, aliveNPCs);

    let velocity: Vector;
    if (target === undefined) {
      // No enemies left: fire outward from the player.
      const outward = familiar.Position.sub(familiar.Player.Position);
      velocity =
        outward.Length() > 0
          ? outward.Normalized().mul(TEAR_SPEED)
          : Vector(TEAR_SPEED, 0);
    } else {
      velocity = target.Position.sub(familiar.Position)
        .Normalized()
        .mul(TEAR_SPEED);
    }

    const tear = spawnTear(
      TearVariant.ROCK,
      0,
      familiar.Position,
      velocity,
      familiar,
    );
    tear.CollisionDamage = this.burstDamage;

    SFXManager().Play(SoundEffect.ROCK_CRUMBLE);
    Game().SpawnParticles(familiar.Position, EffectVariant.ROCK_PARTICLE, 3, 0);
  }
}
