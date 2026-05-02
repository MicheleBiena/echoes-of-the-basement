import {
  CallbackCustom,
  ModCallbackCustom,
  ModFeature,
} from "isaacscript-common";

const HEARTHIAN_SPACESUIT = Isaac.GetItemIdByName("Hearthian Spacesuit");

export class HearthianSpacesuit extends ModFeature {
  // Placeholder for Planetarium chance boost. Without REPENTOGON, native Planetarium chance cannot
  // be modified. Possible implementations:
  // 1. Use REPENTOGON's MC_PRE_PLANETARIUM_APPLY_ITEMS callback (requires REPENTOGON)
  // 2. Give player Telescope Lens effect via code (adds trinket to inventory)
  // 3. Manual room override on floor generation (complex, not recommended)

  @CallbackCustom(ModCallbackCustom.POST_PEFFECT_UPDATE_REORDERED)
  hearthianSpacesuitUpdate(player: EntityPlayer): void {
    if (player.HasCollectible(HEARTHIAN_SPACESUIT)) {
      // Costume is automatically applied via costumes2.xml . Effect logic to be implemented based
      // on chosen method.
    }
  }


}
