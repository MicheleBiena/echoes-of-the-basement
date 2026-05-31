import type { CollectibleType } from "isaac-typescript-definitions";
import { ModCallback } from "isaac-typescript-definitions";
import {
  Callback,
  getNPCs,
  getPlayers,
  isActiveEnemy,
  ModFeature,
} from "isaacscript-common";
import { ITEM_IDS, ITEM_NAMES } from "../itemRegistry";
import { activateGabbroCycloneChaos } from "../passive/giantsDeep";
import { playInstrumentUse } from "./instrumentBehavior";

const { GABBRO_FLUTE, GIANTS_DEEP } = ITEM_IDS;

const GABBRO_FLUTE_ACTIVE_UNTIL_FRAME_KEY =
  "echoesOfTheBasementGabbroFluteActiveUntilFrame";
const GABBRO_FLUTE_DIZZY_UNTIL_FRAME_KEY =
  "echoesOfTheBasementGabbroFluteDizzyUntilFrame";
const GABBRO_FLUTE_DURATION_FRAMES = 8 * 30;
const GABBRO_FLUTE_DIZZY_DURATION_FRAMES = 3 * 30;
const GABBRO_FLUTE_CONFUSION_DURATION_FRAMES = 90;
const GABBRO_FLUTE_CONFUSION_REFRESH_INTERVAL_FRAMES = 30;
const GABBRO_FLUTE_DIZZY_AMOUNT = 0.65;
const GABBRO_FLUTE_DIZZY_START_AMOUNT = 0.3;
const GABBRO_FLUTE_ENEMY_COLOR = Color(0.75, 0.55, 1, 1);

interface GameWithDizziness {
  SetDizzyAmount?: (targetIntensity: number, currentIntensity?: number) => void;
}

let wasGabbroFluteDizzy = false;

export class GabbroFlute extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, GABBRO_FLUTE)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    setGabbroFluteActive(player);
    setGabbroFluteDizzy(player);
    applyGabbroConfusion(player);
    applyGabbroDizziness(true, true);

    if (player.HasCollectible(GIANTS_DEEP)) {
      activateGabbroCycloneChaos(player, GABBRO_FLUTE_DURATION_FRAMES);
    }

    playInstrumentUse(player, GABBRO_FLUTE, ITEM_NAMES.GABBRO_FLUTE);
    return undefined;
  }

  @Callback(ModCallback.POST_UPDATE)
  postUpdate(): void {
    const players = getPlayers();
    const activePlayers = players.filter((player) =>
      isGabbroFluteActive(player),
    );
    const dizzyPlayers = players.filter((player) => isGabbroFluteDizzy(player));

    syncGabbroDizziness(dizzyPlayers.length > 0);

    if (activePlayers.length === 0) {
      return;
    }

    if (
      Game().GetFrameCount() % GABBRO_FLUTE_CONFUSION_REFRESH_INTERVAL_FRAMES
      !== 0
    ) {
      return;
    }

    for (const player of activePlayers) {
      applyGabbroConfusion(player);
    }
  }
}

function setGabbroFluteActive(player: EntityPlayer): void {
  player.GetData()[GABBRO_FLUTE_ACTIVE_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + GABBRO_FLUTE_DURATION_FRAMES;
}

function setGabbroFluteDizzy(player: EntityPlayer): void {
  player.GetData()[GABBRO_FLUTE_DIZZY_UNTIL_FRAME_KEY] =
    Game().GetFrameCount() + GABBRO_FLUTE_DIZZY_DURATION_FRAMES;
}

function isGabbroFluteActive(player: EntityPlayer): boolean {
  const activeUntilFrame =
    player.GetData()[GABBRO_FLUTE_ACTIVE_UNTIL_FRAME_KEY];

  return (
    typeof activeUntilFrame === "number"
    && Game().GetFrameCount() <= activeUntilFrame
  );
}

function isGabbroFluteDizzy(player: EntityPlayer): boolean {
  const dizzyUntilFrame = player.GetData()[GABBRO_FLUTE_DIZZY_UNTIL_FRAME_KEY];

  return (
    typeof dizzyUntilFrame === "number"
    && Game().GetFrameCount() <= dizzyUntilFrame
  );
}

function applyGabbroConfusion(player: EntityPlayer): void {
  const source = EntityRef(player);

  for (const npc of getNPCs()) {
    if (!isActiveEnemy(npc) || !npc.IsVulnerableEnemy()) {
      continue;
    }

    npc.AddConfusion(source, GABBRO_FLUTE_CONFUSION_DURATION_FRAMES);
    npc.SetColor(GABBRO_FLUTE_ENEMY_COLOR, 12, 100, true, false);
  }
}

function applyGabbroDizziness(isActive: boolean, forceStart = false): void {
  const game = Game() as GameWithDizziness;
  if (game.SetDizzyAmount === undefined) {
    return;
  }

  if (forceStart) {
    game.SetDizzyAmount(
      GABBRO_FLUTE_DIZZY_AMOUNT,
      GABBRO_FLUTE_DIZZY_START_AMOUNT,
    );
    return;
  }

  game.SetDizzyAmount(isActive ? GABBRO_FLUTE_DIZZY_AMOUNT : 0);
}

function syncGabbroDizziness(isActive: boolean): void {
  if (isActive) {
    wasGabbroFluteDizzy = true;
    applyGabbroDizziness(true);
    return;
  }

  if (!wasGabbroFluteDizzy) {
    return;
  }

  applyGabbroDizziness(false);
  wasGabbroFluteDizzy = false;
}
