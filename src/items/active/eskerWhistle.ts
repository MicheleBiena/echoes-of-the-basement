import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

export class EskerWhistle extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, ITEM_IDS.ESKER_WHISTLE)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Esker's Whistle used (placeholder)");
    return undefined;
  }
}
