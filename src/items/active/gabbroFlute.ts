import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";

const GABRO_FLUTE = Isaac.GetItemIdByName("Gabbro's Flute");

export class GabbroFlute extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, GABRO_FLUTE)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Gabbro's Flute used (placeholder)");
    return undefined;
  }
}
