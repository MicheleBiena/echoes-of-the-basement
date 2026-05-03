import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";

const ESKER_WHISTLE = Isaac.GetItemIdByName("Esker's Whistle");

export class EskerWhistle extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, ESKER_WHISTLE)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Esker's Whistle used (placeholder)");
    return undefined;
  }
}
