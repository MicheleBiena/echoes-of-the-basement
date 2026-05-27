# Refactor Plan

## Baseline Decisions

- The project is still in active design, so placeholders are expected and should not be treated as cleanup targets by default.
- EID descriptions are out of scope until item effects are redesigned and stable.
- When EID work resumes, descriptions should be rebuilt as a dedicated bilingual pass: English first, then Italian.
- Language cleanup and CSpell issues are not part of the current baseline work.
- Known noisy warnings are not automatically actionable if `npm run build` and `npx tsc --noEmit` pass.
- Before changing each planned area, confirm whether the proposed approach is still the desired one.

## Explicitly Out of Scope For Now

- `src/eid-descriptions.ts`
- EID markup/content
- English/Italian language cleanup
- CSpell cleanup
- Placeholder item effects and placeholder XML descriptions
- Broad lint-warning cleanup that does not point to a real behavior issue
- Global Prettier-only churn

## Current Technical Baseline

- `npm run build` passes.
- `npx tsc --noEmit` passes.
- Current local worktree changes are considered intentional user work and should be preserved.
- ESLint inherits strict IsaacScript/Complete rules, but `@typescript-eslint/no-unnecessary-condition` is disabled because it produces false positives with IsaacScript/TSTL types and runtime APIs.
- `scripts/checkAssets.mjs` is ignored by ESLint because the type-aware parser only tracks files included in the TypeScript project service.
- `npm run lint` is the pragmatic WIP lint command; `npm run lint:strict` keeps the old `--max-warnings 0` behavior available for stricter cleanup passes.
- `scripts/tsconfig.json` explicitly includes Node types so lint/helper scripts can type-check `process` and `import.meta.dirname`.
- VS Code is configured to use the workspace TypeScript SDK and automatic ESLint working directory detection, so editor diagnostics should match CLI diagnostics more closely.

## Architecture Refactor

- Item names and runtime item IDs now live in `src/items/itemRegistry.ts`.
- Item feature files should import from the registry instead of calling `Isaac.GetItemIdByName(...)` directly.
- EID still resolves IDs from its own description data for now because EID work is explicitly deferred.
- Reusable reward mechanics now live in `src/utils/playerRewards.ts`; item files still decide their own character-specific reward rules.
- Asset references can be checked with `npm run check:assets`; this is informational and does not fail for missing placeholder assets.

## Implemented Item Notes

- `Timber Hearth` bonfire healing is proximity-based: the player is healed by entering the fire's warmth radius, without pressing an interaction key.
- `Ash Twin` and `Ember Twin` use first-entry room progression with the starting room excluded.
- `Ash Twin` empties out over three tiers: temporary speed, temporary tears, then a permanent tears stack for the run.
- `Ember Twin` fills up over three tiers: temporary damage with speed penalty, stronger temporary damage with speed penalty, then a permanent heart-style reward.
- Ash/Ember progression is persisted through IsaacScript's save data manager: run data stores Ash permanent stacks, level data stores current floor room progress.
- `Brittle Hollow` currently has a fixed non-luck proc on player tear damage: it opens a short-lived marked rift under the hit enemy, pulls nearby vulnerable enemies, deals periodic chip damage, breaks nearby explosion-breakable grid entities once on spawn, and summons rock-tear fragments from beyond the room edges toward the rift. It uses active-rift plus cooldown limits to avoid spam.
- `Giant's Deep` currently creates slow suspended bouncing cyclone tears with controlled lifetime; each fired tear has a 1-in-6 chance to become blue attraction, otherwise it becomes green repulsion, and pushes/pulls nearby vulnerable enemies through both velocity force and direct position nudging. It also applies a fire-delay penalty and uses a dedicated `giantsDeepCyclone` effect sprite/animation that follows the underlying invisible collision tear. It has a very rare luck-scaled giant green typhoon proc that damages all vulnerable enemies in the room, pushes them hard toward walls, and knocks the firing player backward.
- `Dark Bramble` is being scoped as the likely Q4 risk-reward item: after a floor timer, an unstoppable slow anglerfish-like pursuer follows Isaac across rooms; touch means death, extra lives consume/banish it for that floor and forfeit the reward, and reaching the next floor while it is active grants a large reward still to define.
- `npm run check:assets` reports missing XML-referenced assets without failing the build.
