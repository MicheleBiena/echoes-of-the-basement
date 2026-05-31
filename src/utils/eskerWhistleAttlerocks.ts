const ESKER_WHISTLE_ATTLEROCK_COUNT_KEY =
  "echoesOfTheBasementEskerWhistleAttlerockCount";

const MAX_ESKER_WHISTLE_ATTLEROCKS = 16;

export function addEskerWhistleAttlerocks(
  player: EntityPlayer,
  count: int,
): void {
  const currentCount = getEskerWhistleAttlerockCount(player);
  player.GetData()[ESKER_WHISTLE_ATTLEROCK_COUNT_KEY] = math.min(
    MAX_ESKER_WHISTLE_ATTLEROCKS,
    currentCount + count,
  );
}

export function clearEskerWhistleAttlerocks(player: EntityPlayer): void {
  player.GetData()[ESKER_WHISTLE_ATTLEROCK_COUNT_KEY] = undefined;
}

export function getEskerWhistleAttlerockCount(player: EntityPlayer): int {
  const count = player.GetData()[ESKER_WHISTLE_ATTLEROCK_COUNT_KEY];

  return typeof count === "number" ? count : 0;
}
