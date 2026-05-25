/* eslint-disable @typescript-eslint/no-extraneous-class */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import type { CollectibleType } from "isaac-typescript-definitions";
import { ItemPoolType, ModCallback } from "isaac-typescript-definitions";
import { ModCallbackRepentogon } from "isaac-typescript-definitions-repentogon";
import type { ModUpgraded } from "isaacscript-common";
import { ITEM_IDS, PLANETARIUM_ITEM_IDS } from "../itemRegistry";

const PLANETARIUM_FORCE_CHANCE = 22;
const BASE_MOD_ITEM_CHANCE = 0.5;
const SPACESUIT_MOD_ITEM_CHANCE = 1; // 100% for testing


export class HearthianSpacesuit {
  constructor(mod: ModUpgraded) {
    // Force planetarium chance if you have spacesuit (in applicable floors).
    mod.AddCallbackRepentogon(
      ModCallbackRepentogon.PRE_PLANETARIUM_CALCULATE_FINAL,
      (currentChance: number): number => {
        const player = Isaac.GetPlayer();
        if (player === undefined || !player.HasCollectible(ITEM_IDS.HEARTHIAN_SPACESUIT)) {
          return currentChance;
        }
        return PLANETARIUM_FORCE_CHANCE;
      },
    );

    // Modify loot in planetariums.
    mod.AddCallback(
      ModCallback.PRE_GET_COLLECTIBLE, // Gets called when picking an item from a pool.
      (poolType: ItemPoolType, _decrease: boolean, _seed: Seed): CollectibleType | undefined => {
        if (poolType !== ItemPoolType.PLANETARIUM) {
          return undefined;
        }

        const player = Isaac.GetPlayer();
        if (player === undefined) {
          return undefined;
        }

        const hasSpacesuit = player.HasCollectible(ITEM_IDS.HEARTHIAN_SPACESUIT);
        const modItemChance = hasSpacesuit ? SPACESUIT_MOD_ITEM_CHANCE : BASE_MOD_ITEM_CHANCE;

        if (Math.random() < modItemChance) {
          const availableItems = PLANETARIUM_ITEM_IDS.filter(
            (itemId) => !player.HasCollectible(itemId)
          );

          if (availableItems.length === 0) {
            return undefined;
          }

          const randomIndex = Math.floor(Math.random() * availableItems.length);
          return availableItems[randomIndex] as CollectibleType;
        }

        return undefined;
      },
    );
  }
}
