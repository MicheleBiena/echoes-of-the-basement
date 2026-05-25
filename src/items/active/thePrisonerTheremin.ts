import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

export class ThePrisonerTheremin extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, ITEM_IDS.THE_PRISONER_THEREMIN)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("The Prisoner's Theremin used (placeholder)");
    return undefined;
  }
}
