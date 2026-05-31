import type { CollectibleType } from "isaac-typescript-definitions";
import { PlayerItemAnimation } from "isaac-typescript-definitions";
import { spawnInstrumentNotes } from "../../effects/instrumentNotes";

export function playInstrumentUse(
  player: EntityPlayer,
  collectibleType: CollectibleType,
  soundName: string,
): void {
  player.AnimateCollectible(collectibleType, PlayerItemAnimation.USE_ITEM);
  spawnInstrumentNotes(player);
  SFXManager().Play(Isaac.GetSoundIdByName(soundName));
}
