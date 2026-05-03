import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";

const SOLANUM_KEYBOARD = Isaac.GetItemIdByName("Solanum's Keyboard");

export class SolanumKeyboard extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, SOLANUM_KEYBOARD)
  preUseItem(_collectibleType: CollectibleType, _rng: RNG, _: EntityPlayer): boolean | undefined {
    // TODO: implement active effect
    Isaac.DebugString("Solanum's Keyboard used (placeholder)");
    return undefined;
  }
}
