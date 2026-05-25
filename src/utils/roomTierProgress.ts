import { getRoomGridIndex } from "isaacscript-common";

export interface RoomTierProgressState {
  currentTier: int;
  visitedRoomIndexes: int[];
}

export function newRoomTierProgressState(): RoomTierProgressState {
  return {
    currentTier: 0,
    visitedRoomIndexes: [],
  };
}

export class RoomTierProgress {
  private readonly thresholds: readonly [int, int, int];
  private readonly getState: () => RoomTierProgressState;

  constructor(
    thresholds: readonly [int, int, int],
    getState: () => RoomTierProgressState,
  ) {
    this.thresholds = thresholds;
    this.getState = getState;
  }

  getTier(): int {
    return this.getState().currentTier;
  }

  resetFloor(): void {
    const state = this.getState();
    state.visitedRoomIndexes = [];
    state.currentTier = 0;
  }

  resetRun(): void {
    this.resetFloor();
  }

  recordCurrentRoom(): int | undefined {
    const state = this.getState();
    const level = Game().GetLevel();
    const roomIndex = getRoomGridIndex();

    if (
      roomIndex === level.GetStartingRoomIndex()
      || state.visitedRoomIndexes.includes(roomIndex)
    ) {
      return undefined;
    }

    state.visitedRoomIndexes.push(roomIndex);

    const nextTier = this.getHighestReachedTier();
    if (nextTier <= state.currentTier) {
      return undefined;
    }

    state.currentTier = nextTier;

    return nextTier;
  }

  private getHighestReachedTier(): int {
    const roomCount = this.getState().visitedRoomIndexes.length;

    if (roomCount >= this.thresholds[2]) {
      return 3;
    }

    if (roomCount >= this.thresholds[1]) {
      return 2;
    }

    if (roomCount >= this.thresholds[0]) {
      return 1;
    }

    return 0;
  }
}
