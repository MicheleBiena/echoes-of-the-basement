import { ModCallbackRepentogon } from "isaac-typescript-definitions-repentogon";
import type { ModUpgraded } from "isaacscript-common";

const HEARTHIAN_SPACESUIT = Isaac.GetItemIdByName("Hearthian Spacesuit");

export class HearthianSpacesuit {
  constructor(mod: ModUpgraded) {
    mod.AddCallbackRepentogon(
      ModCallbackRepentogon.PRE_PLANETARIUM_CALCULATE_FINAL,
      (currentChance: number): number => {
        const player = Isaac.GetPlayer();
        if (player === undefined || !player.HasCollectible(HEARTHIAN_SPACESUIT)) {
          return currentChance;
        }
        return 100;
      },
    );
  }
}
