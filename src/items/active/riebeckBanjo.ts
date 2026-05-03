import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";

const RIEBECK_BANJO = Isaac.GetItemIdByName("Riebeck's Banjo");

export class RiebeckBanjo extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, RIEBECK_BANJO)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Riebeck's Banjo used (placeholder)");
    return undefined;
  }
}
