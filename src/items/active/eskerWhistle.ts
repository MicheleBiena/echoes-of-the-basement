import type { CollectibleType } from "isaac-typescript-definitions";
import {
  CacheFlag,
  EffectVariant,
  ModCallback,
  SoundEffect,
} from "isaac-typescript-definitions";
import {
  Callback,
  CallbackCustom,
  getPlayers,
  ModCallbackCustom,
  ModFeature,
} from "isaacscript-common";
import {
  addEskerWhistleAttlerocks,
  clearEskerWhistleAttlerocks,
  getEskerWhistleAttlerockCount,
} from "../../utils/eskerWhistleAttlerocks";
import { ITEM_IDS } from "../itemRegistry";

const { ESKER_WHISTLE, THE_ATTLEROCK } = ITEM_IDS;

const BASE_TEMPORARY_ATTLEROCKS = 1;
const SYNERGY_TEMPORARY_ATTLEROCKS = 3;
const SUMMON_PARTICLE_COUNT = 8;
const SUMMON_PARTICLE_SPEED = 5;

export class EskerWhistle extends ModFeature {
  @Callback(ModCallback.PRE_USE_ITEM, ESKER_WHISTLE)
  preUseItem(
    _collectibleType: CollectibleType,
    _rng: RNG,
    player: EntityPlayer,
  ): boolean | undefined {
    const count = player.HasCollectible(THE_ATTLEROCK)
      ? SYNERGY_TEMPORARY_ATTLEROCKS
      : BASE_TEMPORARY_ATTLEROCKS;

    addEskerWhistleAttlerocks(player, count);
    refreshAttlerockFamiliars(player);

    Game().SpawnParticles(
      player.Position,
      EffectVariant.POOF_1,
      SUMMON_PARTICLE_COUNT,
      SUMMON_PARTICLE_SPEED,
    );
    SFXManager().Play(SoundEffect.WHISTLE);
    player.AnimateHappy();

    return undefined;
  }

  @CallbackCustom(ModCallbackCustom.POST_NEW_ROOM_REORDERED)
  postNewRoom(): void {
    for (const player of getPlayers()) {
      if (getEskerWhistleAttlerockCount(player) <= 0) {
        continue;
      }

      clearEskerWhistleAttlerocks(player);
      refreshAttlerockFamiliars(player);
    }
  }
}

function refreshAttlerockFamiliars(player: EntityPlayer): void {
  player.AddCacheFlags(CacheFlag.FAMILIARS);
  player.EvaluateItems();
}
