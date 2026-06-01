import type { CollectibleType } from "isaac-typescript-definitions";
import {
  DamageFlag,
  DoorSlot,
  EffectVariant,
  EntityType,
  ModCallback,
  SoundEffect,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getDoorSlotsForRoomShape,
  getGridEntitiesInRadius,
  getNPCs,
  getPlayers,
  isActiveEnemy,
  isDoorSlotValidAtGridIndexForRedRoom,
  isGridEntityBreakableByExplosion,
  isGridEntityBroken,
  ModCallbackCustom,
  ModFeature,
} from "isaacscript-common";
import { freezeDarkBrambleAnglerfish } from "../../entities/darkBrambleAnglerfish";
import { ITEM_IDS, ITEM_NAMES } from "../itemRegistry";
import { playInstrumentUse } from "./instrumentBehavior";

const { DARK_BRAMBLE, FELDSPAR_HARMONICA } = ITEM_IDS;

const FELDSPAR_DASH_UNTIL_FRAME_KEY =
  "echoesOfTheBasementFeldsparDashUntilFrame";
const FELDSPAR_DASH_DIRECTION_X_KEY =
  "echoesOfTheBasementFeldsparDashDirectionX";
const FELDSPAR_DASH_DIRECTION_Y_KEY =
  "echoesOfTheBasementFeldsparDashDirectionY";
const FELDSPAR_DASH_OPENED_WALL_KEY =
  "echoesOfTheBasementFeldsparDashOpenedWall";
const FELDSPAR_DASH_HIT_FRAME_PREFIX =
  "echoesOfTheBasementFeldsparDashHitFrame";

const DASH_DURATION_FRAMES = 14;
const DASH_SPEED = 16;
const DASH_POSITION_STEP = 11;
const DASH_CONTROLS_COOLDOWN_FRAMES = 2;
const DASH_DAMAGE_MULTIPLIER = 4;
const DASH_MIN_DAMAGE = 16;
const DASH_ENEMY_HIT_RADIUS = 24;
const DASH_ENEMY_HIT_COOLDOWN_FRAMES = 10;
const DASH_ENEMY_KNOCKBACK = 9;
const DASH_GRID_BREAK_RADIUS = 38;
const DASH_WALL_CHECK_DISTANCE = 34;
const DASH_WALL_MARGIN = 24;
const DASH_WALL_RECOIL = 3;
const DASH_PARTICLE_COUNT = 5;
const DASH_PARTICLE_SPEED = 5;
const DARK_BRAMBLE_FREEZE_FRAMES = 40 * 30;

export class FeldsparHarmonica extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, FELDSPAR_HARMONICA)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    startFeldsparDash(player);

    if (player.HasCollectible(DARK_BRAMBLE)) {
      freezeDarkBrambleAnglerfish(DARK_BRAMBLE_FREEZE_FRAMES);
    }

    playInstrumentUse(
      player,
      FELDSPAR_HARMONICA,
      ITEM_NAMES.FELDSPAR_HARMONICA,
    );

    return undefined;
  }

  @CallbackCustom(ModCallbackCustom.POST_PLAYER_UPDATE_REORDERED, undefined)
  postPlayerUpdate(player: EntityPlayer): void {
    if (!isFeldsparDashActive(player)) {
      return;
    }

    updateFeldsparDash(player);
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED, undefined)
  postNewRoom(): void {
    for (const player of getPlayers()) {
      clearFeldsparDash(player);
    }
  }
}

function startFeldsparDash(player: EntityPlayer): void {
  const direction = getDashDirection(player);
  const data = player.GetData();

  data[FELDSPAR_DASH_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + DASH_DURATION_FRAMES;
  data[FELDSPAR_DASH_DIRECTION_X_KEY] = direction.X;
  data[FELDSPAR_DASH_DIRECTION_Y_KEY] = direction.Y;
  data[FELDSPAR_DASH_OPENED_WALL_KEY] = false;

  player.AddControlsCooldown(DASH_CONTROLS_COOLDOWN_FRAMES);
  player.Velocity = direction.mul(DASH_SPEED);
}

function updateFeldsparDash(player: EntityPlayer): void {
  const direction = getStoredDashDirection(player);
  if (direction === undefined) {
    clearFeldsparDash(player);
    return;
  }

  player.AddControlsCooldown(DASH_CONTROLS_COOLDOWN_FRAMES);
  movePlayerDuringDash(player, direction);
  player.Velocity = direction.mul(DASH_SPEED);

  damageDashEnemies(player, direction);
  breakNearbyGridEntities(player);

  if (tryOpenWallPassage(player, direction)) {
    player.Velocity = direction.mul(-DASH_WALL_RECOIL);
    clearFeldsparDash(player);
  }
}

function getDashDirection(player: EntityPlayer): Vector {
  const inputDirection = normalizeOrUndefined(player.GetMovementInput());
  if (inputDirection !== undefined) {
    return inputDirection;
  }

  const movementDirection = normalizeOrUndefined(player.GetMovementVector());
  if (movementDirection !== undefined) {
    return movementDirection;
  }

  const aimDirection = normalizeOrUndefined(player.GetAimDirection());
  if (aimDirection !== undefined) {
    return aimDirection;
  }

  const recentMovementDirection = normalizeOrUndefined(
    player.GetRecentMovementVector(),
  );
  if (recentMovementDirection !== undefined) {
    return recentMovementDirection;
  }

  return Vector(1, 0);
}

function movePlayerDuringDash(player: EntityPlayer, direction: Vector): void {
  const room = Game().GetRoom();
  const nextPosition = player.Position.add(direction.mul(DASH_POSITION_STEP));

  if (!room.IsPositionInRoom(nextPosition, DASH_WALL_MARGIN)) {
    return;
  }

  player.Position = room.GetClampedPosition(nextPosition, DASH_WALL_MARGIN);
}

function normalizeOrUndefined(vector: Readonly<Vector>): Vector | undefined {
  if (vector.LengthSquared() <= 0) {
    return undefined;
  }

  return Vector(vector.X, vector.Y).Normalized();
}

function isFeldsparDashActive(player: EntityPlayer): boolean {
  const dashUntilFrame = player.GetData()[FELDSPAR_DASH_UNTIL_FRAME_KEY];

  return (
    typeof dashUntilFrame === "number"
    && Game().GetFrameCount() <= dashUntilFrame
  );
}

function getStoredDashDirection(player: EntityPlayer): Vector | undefined {
  const data = player.GetData();
  const directionX = data[FELDSPAR_DASH_DIRECTION_X_KEY];
  const directionY = data[FELDSPAR_DASH_DIRECTION_Y_KEY];

  if (typeof directionX !== "number" || typeof directionY !== "number") {
    return undefined;
  }

  const direction = Vector(directionX, directionY);
  if (direction.LengthSquared() <= 0) {
    return undefined;
  }

  return direction.Normalized();
}

function clearFeldsparDash(player: EntityPlayer): void {
  const data = player.GetData();

  data[FELDSPAR_DASH_UNTIL_FRAME_KEY] = undefined;
  data[FELDSPAR_DASH_DIRECTION_X_KEY] = undefined;
  data[FELDSPAR_DASH_DIRECTION_Y_KEY] = undefined;
  data[FELDSPAR_DASH_OPENED_WALL_KEY] = undefined;
}

function damageDashEnemies(player: EntityPlayer, direction: Vector): void {
  const damage = getDashDamage(player);
  const sourceRef = EntityRef(player);

  for (const npc of getNPCs()) {
    if (!isAffectedNPC(npc) || !isPlayerTouchingNPC(player, npc)) {
      continue;
    }

    if (isDashHitOnCooldown(player, npc)) {
      continue;
    }

    npc.TakeDamage(damage, DamageFlag.NO_MODIFIERS, sourceRef, 0);
    npc.Velocity = npc.Velocity.add(direction.mul(DASH_ENEMY_KNOCKBACK));
    markDashHit(player, npc);
    Game().SpawnParticles(
      npc.Position,
      EffectVariant.IMPACT,
      DASH_PARTICLE_COUNT,
      DASH_PARTICLE_SPEED,
    );
    SFXManager().Play(SoundEffect.MEAT_IMPACTS, 0.7);
  }
}

function getDashDamage(player: EntityPlayer): float {
  return math.max(DASH_MIN_DAMAGE, player.Damage * DASH_DAMAGE_MULTIPLIER);
}

function isPlayerTouchingNPC(player: EntityPlayer, npc: EntityNPC): boolean {
  return (
    player.Position.Distance(npc.Position)
    <= player.Size + npc.Size + DASH_ENEMY_HIT_RADIUS
  );
}

function isDashHitOnCooldown(
  player: EntityPlayer,
  npc: EntityNPC,
): boolean {
  const lastHitFrame = npc.GetData()[getDashHitFrameKey(player)];

  return (
    typeof lastHitFrame === "number"
    && Game().GetFrameCount() - lastHitFrame < DASH_ENEMY_HIT_COOLDOWN_FRAMES
  );
}

function markDashHit(player: EntityPlayer, npc: EntityNPC): void {
  npc.GetData()[getDashHitFrameKey(player)] = Game().GetFrameCount();
}

function getDashHitFrameKey(player: EntityPlayer): string {
  return `${FELDSPAR_DASH_HIT_FRAME_PREFIX}${player.InitSeed}`;
}

function breakNearbyGridEntities(player: EntityPlayer): void {
  let brokeGridEntity = false;
  const sourceRef = EntityRef(player);

  for (const gridEntity of getGridEntitiesInRadius(
    player.Position,
    DASH_GRID_BREAK_RADIUS,
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
      DASH_PARTICLE_COUNT,
      DASH_PARTICLE_SPEED,
    );
    brokeGridEntity = true;
  }

  for (const fireplace of Isaac.FindByType(EntityType.FIREPLACE)) {
    if (fireplace.Position.Distance(player.Position) > DASH_GRID_BREAK_RADIUS) {
      continue;
    }

    fireplace.TakeDamage(
      DASH_MIN_DAMAGE,
      DamageFlag.EXPLOSION,
      sourceRef,
      0,
    );
    Game().SpawnParticles(
      fireplace.Position,
      EffectVariant.IMPACT,
      DASH_PARTICLE_COUNT,
      DASH_PARTICLE_SPEED,
    );
    brokeGridEntity = true;
  }

  if (brokeGridEntity) {
    SFXManager().Play(SoundEffect.ROCK_CRUMBLE, 0.8);
  }
}

function tryOpenWallPassage(
  player: EntityPlayer,
  direction: Vector,
): boolean {
  if (player.GetData()[FELDSPAR_DASH_OPENED_WALL_KEY] === true) {
    return false;
  }

  const room = Game().GetRoom();
  const wallCheckPosition = player.Position.add(
    direction.mul(DASH_WALL_CHECK_DISTANCE),
  );
  if (room.IsPositionInRoom(wallCheckPosition, DASH_WALL_MARGIN)) {
    return false;
  }

  player.GetData()[FELDSPAR_DASH_OPENED_WALL_KEY] = true;

  const doorSlot = getClosestDoorSlotForDash(player.Position, direction);
  if (doorSlot === undefined) {
    return true;
  }

  if (openExistingDoor(player, doorSlot) || createRedRoomDoor(doorSlot)) {
    Game().SpawnParticles(
      room.GetDoorSlotPosition(doorSlot),
      EffectVariant.ROCK_PARTICLE,
      DASH_PARTICLE_COUNT,
      DASH_PARTICLE_SPEED,
    );
    SFXManager().Play(SoundEffect.UNLOCK_DOOR);
    return true;
  }

  SFXManager().Play(SoundEffect.STONE_IMPACT, 0.8);
  return true;
}

function openExistingDoor(
  player: EntityPlayer,
  doorSlot: DoorSlot,
): boolean {
  const level = Game().GetLevel();

  level.UncoverHiddenDoor(level.GetCurrentRoomIndex(), doorSlot);

  const room = Game().GetRoom();
  const door = room.GetDoor(doorSlot);
  if (door === undefined) {
    return false;
  }

  door.TryBlowOpen(false, player);
  door.TryUnlock(player, true);
  door.Open();
  door.SpawnDust();

  return true;
}

function createRedRoomDoor(doorSlot: DoorSlot): boolean {
  const level = Game().GetLevel();
  const currentRoomIndex = level.GetCurrentRoomIndex();

  if (!isDoorSlotValidAtGridIndexForRedRoom(doorSlot, currentRoomIndex)) {
    return false;
  }

  const created = level.MakeRedRoomDoor(currentRoomIndex, doorSlot);
  if (!created) {
    return false;
  }

  level.UpdateVisibility();

  const door = Game().GetRoom().GetDoor(doorSlot);
  if (door !== undefined) {
    door.Open();
    door.SpawnDust();
  }

  return true;
}

function getClosestDoorSlotForDash(
  position: Vector,
  direction: Vector,
): DoorSlot | undefined {
  const room = Game().GetRoom();
  const possibleDoorSlots = getDoorSlotsForRoomShape(room.GetRoomShape());
  const sideDoorSlots = getDoorSlotsForDirection(direction);
  let closestDoorSlot: DoorSlot | undefined;
  let closestDistance = math.huge;

  for (const doorSlot of sideDoorSlots) {
    if (!possibleDoorSlots.has(doorSlot) || !room.IsDoorSlotAllowed(doorSlot)) {
      continue;
    }

    const distance = position.Distance(room.GetDoorSlotPosition(doorSlot));
    if (distance >= closestDistance) {
      continue;
    }

    closestDistance = distance;
    closestDoorSlot = doorSlot;
  }

  return closestDoorSlot;
}

function getDoorSlotsForDirection(direction: Vector): readonly DoorSlot[] {
  if (math.abs(direction.X) >= math.abs(direction.Y)) {
    return direction.X < 0
      ? [DoorSlot.LEFT_0, DoorSlot.LEFT_1]
      : [DoorSlot.RIGHT_0, DoorSlot.RIGHT_1];
  }

  return direction.Y < 0
    ? [DoorSlot.UP_0, DoorSlot.UP_1]
    : [DoorSlot.DOWN_0, DoorSlot.DOWN_1];
}

function isAffectedNPC(npc: EntityNPC): boolean {
  return isActiveEnemy(npc) && npc.IsVulnerableEnemy();
}
