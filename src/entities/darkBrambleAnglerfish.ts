import {
  DamageFlag,
  EntityCollisionClass,
  EntityFlag,
  EntityGridCollisionClass,
  EntityType,
  ModCallback,
} from "isaac-typescript-definitions";
import { Callback, getPlayers, ModFeature } from "isaacscript-common";

const DARK_BRAMBLE_ANGLERFISH_NAME = "Dark Bramble Anglerfish";
const DARK_BRAMBLE_ANGLERFISH_SPRITE =
  "gfx/monsters/darkBrambleAnglerfish.anm2";
const DARK_BRAMBLE_ANGLERFISH_ANIMATION = "Float";
const DARK_BRAMBLE_ANGLERFISH_CONSOLE_COMMAND = "eotb_anglerfish";
const DARK_BRAMBLE_ANGLERFISH_INITIALIZED_KEY =
  "echoesOfTheBasementDarkBrambleAnglerfishInitialized";
export const DARK_BRAMBLE_ANGLERFISH_ATE_PLAYER_KEY =
  "echoesOfTheBasementDarkBrambleAnglerfishAtePlayer";
const DARK_BRAMBLE_ANGLERFISH_MAX_HP = 999_999;
const DARK_BRAMBLE_ANGLERFISH_ACCELERATION = 0.045;
const DARK_BRAMBLE_ANGLERFISH_MAX_SPEED = 1.05;
const DARK_BRAMBLE_ANGLERFISH_DRAG = 0.965;
const DARK_BRAMBLE_ANGLERFISH_TOUCH_DAMAGE = 999;
const DARK_BRAMBLE_ANGLERFISH_TOUCH_DAMAGE_FLAGS = (DamageFlag.NO_PENALTIES
  | DamageFlag.IGNORE_ARMOR) as BitFlags<DamageFlag>;
const DARK_BRAMBLE_ANGLERFISH_TOUCH_RADIUS = 30;
const DARK_BRAMBLE_ANGLERFISH_SPAWN_OFFSET = Vector(90, 0);
const DARK_BRAMBLE_ANGLERFISH_SPRITE_OFFSET = Vector(0, -14);
const DARK_BRAMBLE_ANGLERFISH_DEPTH_OFFSET = 25;
const DARK_BRAMBLE_ANGLERFISH_GHOST_COLOR = Color(0.7, 0.85, 1, 0.82);

export const DARK_BRAMBLE_ANGLERFISH_TYPE = Isaac.GetEntityTypeByName(
  DARK_BRAMBLE_ANGLERFISH_NAME,
) as EntityType;

export class DarkBrambleAnglerfish extends ModFeature {
  @Callback(ModCallback.POST_NPC_INIT, DARK_BRAMBLE_ANGLERFISH_TYPE)
  postNPCInit(npc: EntityNPC): void {
    if (!isDarkBrambleAnglerfish(npc)) {
      return;
    }

    setupAnglerfish(npc);
  }

  @Callback(ModCallback.POST_NPC_UPDATE, DARK_BRAMBLE_ANGLERFISH_TYPE)
  postNPCUpdate(npc: EntityNPC): void {
    if (!isDarkBrambleAnglerfish(npc)) {
      return;
    }

    setupAnglerfish(npc);
    updateAnglerfishSprite(npc);
    damageTouchingPlayers(npc);

    const target = getClosestPlayer(npc.Position);
    if (target === undefined) {
      npc.Velocity = npc.Velocity.mul(DARK_BRAMBLE_ANGLERFISH_DRAG);
      return;
    }

    const direction = target.Position.sub(npc.Position);
    if (direction.Length() > 0) {
      const acceleration = direction
        .Normalized()
        .mul(DARK_BRAMBLE_ANGLERFISH_ACCELERATION);
      npc.Velocity = limitVelocity(
        npc.Velocity.mul(DARK_BRAMBLE_ANGLERFISH_DRAG).add(acceleration),
        DARK_BRAMBLE_ANGLERFISH_MAX_SPEED,
      );
    }

    npc.FlipX = target.Position.X < npc.Position.X;
  }

  @Callback(ModCallback.PRE_NPC_COLLISION, DARK_BRAMBLE_ANGLERFISH_TYPE)
  preNPCCollision(
    npc: EntityNPC,
    collider: Entity,
    _low: boolean,
  ): boolean | undefined {
    if (!isDarkBrambleAnglerfish(npc)) {
      return undefined;
    }

    const player = collider.ToPlayer();
    if (player === undefined) {
      return undefined;
    }

    damagePlayer(player, npc);

    return true;
  }

  @Callback(ModCallback.ENTITY_TAKE_DMG, DARK_BRAMBLE_ANGLERFISH_TYPE)
  entityTakeDamage(entity: Entity): boolean | undefined {
    const npc = entity.ToNPC();
    if (!isDarkBrambleAnglerfish(npc)) {
      return undefined;
    }

    setupAnglerfish(npc);
    entity.SetColor(Color(1.4, 1.6, 2, 0.9), 4, 0, true, false);

    return false;
  }

  @Callback(ModCallback.EXECUTE_CMD)
  executeCmd(command: string, _parameters: string, player: EntityPlayer): void {
    if (command !== DARK_BRAMBLE_ANGLERFISH_CONSOLE_COMMAND) {
      return;
    }

    spawnDarkBrambleAnglerfish(
      player.Position.add(DARK_BRAMBLE_ANGLERFISH_SPAWN_OFFSET),
    );
  }
}

export function spawnDarkBrambleAnglerfish(
  position: Vector,
): EntityNPC | undefined {
  return Isaac.Spawn(
    DARK_BRAMBLE_ANGLERFISH_TYPE,
    0,
    0,
    position,
    Vector(0, 0),
    undefined,
  ).ToNPC();
}

export function getDarkBrambleAnglerfish(): EntityNPC[] {
  const anglerfish: EntityNPC[] = [];

  for (const entity of Isaac.FindByType(DARK_BRAMBLE_ANGLERFISH_TYPE)) {
    const npc = entity.ToNPC();
    if (!isDarkBrambleAnglerfish(npc)) {
      continue;
    }

    anglerfish.push(npc);
  }

  return anglerfish;
}

export function removeDarkBrambleAnglerfish(): void {
  for (const npc of getDarkBrambleAnglerfish()) {
    npc.Remove();
  }
}

function setupAnglerfish(npc: EntityNPC | undefined): void {
  if (npc === undefined) {
    return;
  }

  npc.CanShutDoors = false;
  npc.EntityCollisionClass = EntityCollisionClass.PLAYER_ONLY;
  npc.GridCollisionClass = EntityGridCollisionClass.NONE;
  npc.SpriteOffset = DARK_BRAMBLE_ANGLERFISH_SPRITE_OFFSET;
  npc.DepthOffset = DARK_BRAMBLE_ANGLERFISH_DEPTH_OFFSET;
  npc.Friction = 1;
  npc.Mass = 999;

  npc.AddEntityFlags(EntityFlag.NO_STATUS_EFFECTS);
  npc.AddEntityFlags(EntityFlag.NO_TARGET);
  npc.AddEntityFlags(EntityFlag.NO_KNOCKBACK);
  npc.AddEntityFlags(EntityFlag.NO_PHYSICS_KNOCKBACK);
  npc.AddEntityFlags(EntityFlag.NO_BLOOD_SPLASH);
  npc.AddEntityFlags(EntityFlag.NO_DEATH_TRIGGER);
  npc.AddEntityFlags(EntityFlag.DONT_COUNT_BOSS_HP);

  npc.MaxHitPoints = DARK_BRAMBLE_ANGLERFISH_MAX_HP;
  npc.HitPoints = DARK_BRAMBLE_ANGLERFISH_MAX_HP;

  const data = npc.GetData();
  if (data[DARK_BRAMBLE_ANGLERFISH_INITIALIZED_KEY] === true) {
    return;
  }

  const sprite = npc.GetSprite();
  sprite.Load(DARK_BRAMBLE_ANGLERFISH_SPRITE, true);
  sprite.Play(DARK_BRAMBLE_ANGLERFISH_ANIMATION, true);
  data[DARK_BRAMBLE_ANGLERFISH_INITIALIZED_KEY] = true;
}

function isDarkBrambleAnglerfish(npc: EntityNPC | undefined): npc is EntityNPC {
  return npc !== undefined && npc.Type === DARK_BRAMBLE_ANGLERFISH_TYPE;
}

function updateAnglerfishSprite(npc: EntityNPC): void {
  const sprite = npc.GetSprite();
  if (!sprite.IsPlaying(DARK_BRAMBLE_ANGLERFISH_ANIMATION)) {
    sprite.Play(DARK_BRAMBLE_ANGLERFISH_ANIMATION, true);
  }

  npc.SetColor(DARK_BRAMBLE_ANGLERFISH_GHOST_COLOR, 2, 0, false, false);
}

function damageTouchingPlayers(npc: EntityNPC): void {
  for (const player of getPlayers()) {
    if (
      player.Position.Distance(npc.Position)
      > DARK_BRAMBLE_ANGLERFISH_TOUCH_RADIUS
    ) {
      continue;
    }

    damagePlayer(player, npc);
  }
}

function damagePlayer(player: EntityPlayer, npc: EntityNPC): void {
  const hasExtraLife = player.GetExtraLives() > 0;
  if (hasExtraLife) {
    player.GetData()[DARK_BRAMBLE_ANGLERFISH_ATE_PLAYER_KEY] = true;
  }

  player.TakeDamage(
    DARK_BRAMBLE_ANGLERFISH_TOUCH_DAMAGE,
    DARK_BRAMBLE_ANGLERFISH_TOUCH_DAMAGE_FLAGS,
    EntityRef(npc),
    0,
  );

  if (hasExtraLife) {
    removeDarkBrambleAnglerfish();
  }
}

function getClosestPlayer(position: Vector): EntityPlayer | undefined {
  let closestPlayer: EntityPlayer | undefined;
  let closestDistance = math.huge;

  for (const player of getPlayers()) {
    const distance = player.Position.Distance(position);
    if (distance >= closestDistance) {
      continue;
    }

    closestDistance = distance;
    closestPlayer = player;
  }

  return closestPlayer;
}

function limitVelocity(velocity: Vector, maxSpeed: number): Vector {
  if (velocity.Length() <= maxSpeed) {
    return velocity;
  }

  return velocity.Normalized().mul(maxSpeed);
}
