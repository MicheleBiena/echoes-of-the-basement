import { initModFeatures, isRepentogon, ModCallbackCustom, upgradeMod } from "isaacscript-common";
import { name } from "../package.json";
import { eidDescriptions, eidDescriptionsIta } from "./eid-descriptions";
import { AshTwin } from "./items/passive/ashTwin";
import { Attlerock } from "./items/passive/attlerock";
import { BrittleHollow } from "./items/passive/brittleHollow";
import { DarkBramble } from "./items/passive/darkBramble";
import { EmberTwin } from "./items/passive/emberTwin";
import { GiantsDeep } from "./items/passive/giantsDeep";
import { HearthianSpacesuit } from "./items/passive/hearthianSpacesuit";
import { Interloper } from "./items/passive/interloper";
import { QuantumMoon } from "./items/passive/quantumMoon";
import { TheStranger } from "./items/passive/theStranger";
import { TimberHearth } from "./items/passive/timberHearth";

const modFeatures = [
  TimberHearth,
  Attlerock,
  AshTwin,
  EmberTwin,
  BrittleHollow,
  GiantsDeep,
  DarkBramble,
  QuantumMoon,
  Interloper,
  TheStranger,
  HearthianSpacesuit
] as const;



export function main(): void {
  const baseMod = RegisterMod(name, 1);
  const mod = upgradeMod(baseMod);
  initModFeatures(mod, modFeatures);

  mod.AddCallbackCustom(ModCallbackCustom.POST_GAME_STARTED_REORDERED_LAST, checkRepentogon, false);

  if (EID) {
    // English descriptions
    const entries = Object.entries(eidDescriptions) as Array<[
      keyof typeof eidDescriptions,
      (typeof eidDescriptions)[keyof typeof eidDescriptions]
    ]>;

    for (const [_, item] of entries) {
      EID.addCollectible(Isaac.GetItemIdByName(item.idName), item.description);
    }

    // Italian descriptions
    const entriesIta = Object.entries(eidDescriptionsIta) as Array<[
      keyof typeof eidDescriptionsIta,
      (typeof eidDescriptionsIta)[keyof typeof eidDescriptionsIta]
    ]>;

    for (const [_, item] of entriesIta) {
      EID.addCollectible(
        Isaac.GetItemIdByName(item.idName),
        item.description,
        undefined,
        "ita",
      );
    }
  }

}

function checkRepentogon() {
  if (isRepentogon()) {
    Isaac.GetPlayer().AnimateHappy()
  }
}



