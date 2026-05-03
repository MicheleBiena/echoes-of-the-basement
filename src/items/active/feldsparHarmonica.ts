import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";

const FELDSPAR_HARMONICA = Isaac.GetItemIdByName("Feldspar's Harmonica");

export class FeldsparHarmonica extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, FELDSPAR_HARMONICA)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Feldspar's Harmonica used (placeholder)");
    return undefined;
  }
}
