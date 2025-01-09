import { SpaceType } from "../engine/state/location_type";
import { LandData } from "../engine/state/space";
import { TextureType } from "../engine/state/texture";
import { Direction } from "../engine/state/tile";


export function river(...exits: Direction[]): LandData {
  return {
    type: SpaceType.RIVER,
    texture: {
      type: TextureType.RIVER,
      exits,
    },
  };
}