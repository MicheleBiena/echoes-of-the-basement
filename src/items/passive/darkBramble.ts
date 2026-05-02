import { ModFeature } from "isaacscript-common";
// In every uncleared room, a teleport is generated at the center, which teleports the player to a
// random point in the room, granting a damage buff for 2 seconds.
const DARK_BRAMBLE = Isaac.GetItemIdByName("Dark Bramble");

export class DarkBramble extends ModFeature {}
