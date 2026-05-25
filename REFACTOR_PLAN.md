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

## Architecture Refactor

- Item names and runtime item IDs now live in `src/items/itemRegistry.ts`.
- Item feature files should import from the registry instead of calling `Isaac.GetItemIdByName(...)` directly.
- EID still resolves IDs from its own description data for now because EID work is explicitly deferred.
- Reusable reward mechanics now live in `src/utils/playerRewards.ts`; item files still decide their own character-specific reward rules.
- Asset references can be checked with `npm run check:assets`; this is informational and does not fail for missing placeholder assets.
- `npm run check:assets` reports missing XML-referenced assets without failing the build.
