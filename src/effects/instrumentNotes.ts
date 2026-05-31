import {
  EffectVariant,
  EntityType,
  ModCallback,
} from "isaac-typescript-definitions";
import { Callback, ModFeature, spawn } from "isaacscript-common";

const INSTRUMENT_NOTES_EFFECT_VARIANT = 9503 as EffectVariant;
const INSTRUMENT_NOTES_SPRITE = "gfx/effects/instrumentNotes.anm2";
const INSTRUMENT_NOTES_ANIMATION = "Rise";
const INSTRUMENT_NOTES_MAX_FRAMES = 42;
const INSTRUMENT_NOTES_DEPTH_OFFSET = 80;
const INSTRUMENT_NOTES_SPRITE_OFFSET = Vector(0, -10);

export class InstrumentNotes extends ModFeature {
  @Callback(ModCallback.POST_EFFECT_UPDATE, INSTRUMENT_NOTES_EFFECT_VARIANT)
  postEffectUpdate(effect: EntityEffect): void {
    const sprite = effect.GetSprite();
    if (
      effect.FrameCount > INSTRUMENT_NOTES_MAX_FRAMES
      || sprite.IsFinished(INSTRUMENT_NOTES_ANIMATION)
    ) {
      effect.Remove();
    }
  }
}

export function spawnInstrumentNotes(player: EntityPlayer): void {
  const effect = spawn(
    EntityType.EFFECT,
    INSTRUMENT_NOTES_EFFECT_VARIANT,
    0,
    player.Position.add(Vector(math.random(-3, 3), 0)),
  ).ToEffect();

  if (effect === undefined) {
    return;
  }

  effect.DepthOffset = INSTRUMENT_NOTES_DEPTH_OFFSET;
  effect.SpriteOffset = INSTRUMENT_NOTES_SPRITE_OFFSET;

  const sprite = effect.GetSprite();
  sprite.Load(INSTRUMENT_NOTES_SPRITE, true);
  sprite.Play(INSTRUMENT_NOTES_ANIMATION, true);
}
