import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import { ITEM_IDS, ITEM_NAMES } from "../itemRegistry";
import { playInstrumentUse } from "./instrumentBehavior";

const { THE_PRISONER_THEREMIN } = ITEM_IDS;

export class ThePrisonerTheremin extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, THE_PRISONER_THEREMIN)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    // TODO: implement active effect.
    playInstrumentUse(
      player,
      THE_PRISONER_THEREMIN,
      ITEM_NAMES.THE_PRISONER_THEREMIN,
    );
    Isaac.DebugString("The Prisoner's Theremin used (placeholder)");

    return undefined;
  }
}
