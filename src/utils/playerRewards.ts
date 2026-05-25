import {
  CardType,
  type CoinSubType,
  EntityType,
  PickupVariant,
} from "isaac-typescript-definitions";
import { spawn } from "isaacscript-common";

export function getRandomRoomPosition(): Vector {
  const room = Game().GetRoom();
  const topLeft = room.GetTopLeftPos();
  const bottomRight = room.GetBottomRightPos();
  const x = topLeft.X + Math.random() * (bottomRight.X - topLeft.X);
  const y = topLeft.Y + Math.random() * (bottomRight.Y - topLeft.Y);

  return Vector(x, y);
}

export function spawnHolyCardAtRandomRoomPosition(): void {
  spawn(
    EntityType.PICKUP,
    PickupVariant.CARD,
    CardType.HOLY,
    getRandomRoomPosition(),
    Vector(0, 0),
  );
}

export function spawnCoinAtRandomRoomPosition(coinSubType: CoinSubType): void {
  spawn(
    EntityType.PICKUP,
    PickupVariant.COIN,
    coinSubType,
    getRandomRoomPosition(),
    Vector(0, 0),
  );
}
