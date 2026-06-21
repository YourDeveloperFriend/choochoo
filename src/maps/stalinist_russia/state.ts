import { z } from "zod";
import { Key, MapKey } from "../../engine/framework/key";
import { PlayerColorZod } from "../../engine/state/player";
import { LocoRowZod } from "./track_data";

// Each player's position on the locomotive track: which box they occupy and
// which row they chose.
export const LocoTrackPosition = z.object({
  box: z.number(),
  row: LocoRowZod,
});
export type LocoTrackPosition = z.infer<typeof LocoTrackPosition>;

export const LOCO_TRACK = new MapKey(
  "StalinLocoTrack",
  PlayerColorZod.parse,
  LocoTrackPosition.parse,
);

// Stalin's disfavor track. Stores each player's position (an index into
// DISFAVOR_VALUES) which yields negative points at the end of the game.
export const DISFAVOR_VALUES: readonly number[] = [
  0, -3, -9, -18, -30, -45, -63, -84, -108,
];

export const MAX_DISFAVOR = DISFAVOR_VALUES.length - 1;

export const DISFAVOR_TRACK = new MapKey(
  "StalinDisfavorTrack",
  PlayerColorZod.parse,
  z.number().parse,
);

// Players who have already used their Politburo Directive (start from Moscow)
// during the current move goods phase. The directive may only be applied to a
// single delivery.
export const POLITBURO_USED = new Key("StalinPolitburoUsed", {
  parse: PlayerColorZod.array().parse,
});
