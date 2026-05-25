import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import { ITEM_IDS } from "../itemRegistry";

export class SolanumKeyboard extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, ITEM_IDS.SOLANUM_KEYBOARD)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Solanum's Keyboard used (placeholder)");
    return undefined;
  }
}
