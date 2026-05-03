import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";

const THE_PRISONER_THEREMIN = Isaac.GetItemIdByName("The Prisoner's Theremin");

export class ThePrisonerTheremin extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, THE_PRISONER_THEREMIN)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("The Prisoner's Theremin used (placeholder)");
    return undefined;
  }
}
