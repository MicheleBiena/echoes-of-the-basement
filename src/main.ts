/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable no-new */
import { ModCallback } from "isaac-typescript-definitions";
import {
  initModFeatures,
  ISCFeature,
  isRepentogon,
  ModCallbackCustom,
  upgradeMod,
} from "isaacscript-common";
import { name } from "../package.json";
import { eidDescriptions, eidDescriptionsIta } from "./eid-descriptions";
import { ChertDrums } from "./items/active/chertDrums";
import { EskerWhistle } from "./items/active/eskerWhistle";
import { FeldsparHarmonica } from "./items/active/feldsparHarmonica";
import { GabbroFlute } from "./items/active/gabbroFlute";
import { RiebeckBanjo } from "./items/active/riebeckBanjo";
import { SolanumKeyboard } from "./items/active/solanumKeyboard";
import { ThePrisonerTheremin } from "./items/active/thePrisonerTheremin";
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

let renderWarningText = false;
let warningFramesLeft = 0;

interface EIDItemDescription {
  readonly description: string;
  readonly idName: string;
  readonly quality?: string;
}

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
  FeldsparHarmonica,
  ChertDrums,
  RiebeckBanjo,
  GabbroFlute,
  SolanumKeyboard,
  EskerWhistle,
  ThePrisonerTheremin,
] as const;

export function main(): void {
  const baseMod = RegisterMod(name, 1);
  const mod = upgradeMod(baseMod, [ISCFeature.SAVE_DATA_MANAGER] as const);
  initModFeatures(mod, modFeatures);
  new HearthianSpacesuit(mod);

  mod.AddCallbackCustom(
    ModCallbackCustom.POST_GAME_STARTED_REORDERED_LAST,
    checkRepentogon,
    false,
  );
  mod.AddCallback(ModCallback.POST_RENDER, renderWarning);

  if (EID) {
    // English descriptions
    const entries = Object.entries(eidDescriptions) as Array<
      [
        keyof typeof eidDescriptions,
        (typeof eidDescriptions)[keyof typeof eidDescriptions],
      ]
    >;

    for (const [_, item] of entries) {
      addEIDCollectibleDescription(item);
    }

    // Italian descriptions
    const entriesIta = Object.entries(eidDescriptionsIta) as Array<
      [
        keyof typeof eidDescriptionsIta,
        (typeof eidDescriptionsIta)[keyof typeof eidDescriptionsIta],
      ]
    >;

    for (const [_, item] of entriesIta) {
      addEIDCollectibleDescription(item, "ita");
    }
  }
}

function addEIDCollectibleDescription(
  item: EIDItemDescription,
  language?: string,
): void {
  const description = getEIDDescriptionWithQuality(item);
  EID?.addCollectible(
    Isaac.GetItemIdByName(item.idName),
    description,
    undefined,
    language,
  );
}

function getEIDDescriptionWithQuality(item: EIDItemDescription): string {
  if (item.quality === undefined) {
    return item.description;
  }

  return `{{${item.quality}}} ${item.description}`;
}

function checkRepentogon() {
  if (isRepentogon()) {
    return;
  }

  renderWarningText = true;
  warningFramesLeft = 2400;
}

function renderWarning() {
  if (!renderWarningText) {
    return;
  }
  if (warningFramesLeft <= 0) {
    renderWarningText = false;
    return;
  }
  Isaac.RenderScaledText(
    "PLEASE INSTALL REPENTOGON AND RESTART THE GAME\nSome features of Echoes of the Basement won't function\nproperly without it.",
    100,
    100,
    1.2,
    1.2,
    255,
    0,
    0,
    255,
  );
  warningFramesLeft--;
}
