import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

export class ChertDrums extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, ITEM_IDS.CHERT_DRUMS)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Chert's Drums used (placeholder)");
    return undefined;
  }
}
