import { initModFeatures, upgradeMod } from "isaacscript-common";
import { name } from "../package.json";
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
}

