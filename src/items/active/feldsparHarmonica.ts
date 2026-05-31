import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import { Callback, ModFeature } from "isaacscript-common";
import { ITEM_IDS, ITEM_NAMES } from "../itemRegistry";
import { playInstrumentUse } from "./instrumentBehavior";

const { FELDSPAR_HARMONICA } = ITEM_IDS;

export class FeldsparHarmonica extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, FELDSPAR_HARMONICA)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    // TODO: implement active effect.
    playInstrumentUse(
      player,
      FELDSPAR_HARMONICA,
      ITEM_NAMES.FELDSPAR_HARMONICA,
    );
    Isaac.DebugString("Feldspar's Harmonica used (placeholder)");

    return undefined;
  }
}
