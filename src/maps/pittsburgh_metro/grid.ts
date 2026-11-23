import { z } from "zod";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { LandData, SpaceData } from "../../engine/state/space";
import { allDirections } from "../../engine/state/tile";
import { city, grid, HILL, PLAIN, town } from "../factory";

export const GOLF_STYLE = "golf";
export const WATER_STYLE = "water";
export const PARK_STYLE = "mountain";

const STREET: LandData = {
  type: SpaceType.STREET,
};

const RIVER: LandData = {
  type: SpaceType.RIVER,
  style: WATER_STYLE,
};

const GOLF: LandData = {
  type: SpaceType.DARK_MOUNTAIN,
  style: GOLF_STYLE,
};

export const PittsburghMetroMapData = z.object({
  parkName: z.string().optional(),
});

function park(name: string): LandData {
  return {
    ...PLAIN,
    style: PARK_STYLE,
    unpassableEdges: allDirections,
    mapSpecific: { parkName: name },
  };
}

function hillTown(townName: string): LandData {
  return { ...HILL, townName };
}

function streetTown(name: string): LandData {
  return {
    ...STREET,
    townName: name,
  };
}

export const map = grid<SpaceData>([
  [
    city("Sewickley Country Club", Good.WHITE, [], 0),
    GOLF,
    STREET,
    STREET,
    RIVER,
    town("Sheraden"),
    HILL,
    STREET,
    HILL,
    GOLF,
    city("Botanic Garden", Good.WHITE, [], 0),
  ],
  [
    GOLF,
    town("Brighton Heights"),
    STREET,
    city("Rooney Stadium", Good.BLACK, [], 4),
    RIVER,
    HILL,
    STREET,
    town("Beechview"),
    HILL,
    GOLF,
  ],
  [
    HILL,
    PLAIN,
    STREET,
    PLAIN,
    RIVER,
    RIVER,
    STREET,
    park("Olympia Park"),
    HILL,
    hillTown("Mt. Lebanon"),
    HILL,
  ],
  [
    STREET,
    STREET,
    STREET,
    RIVER,
    streetTown("Point State Park"),
    RIVER,
    hillTown("Mt. Washington"),
    HILL,
    HILL,
    HILL,
  ],
  [
    town("Perry North"),
    park("Allegheny Commons"),
    city("Clemente Field", Good.YELLOW, [], 3),
    RIVER,
    PLAIN,
    STREET,
    RIVER,
    HILL,
    HILL,
    HILL,
    HILL,
  ],
  [
    HILL,
    HILL,
    RIVER,
    city("Lawrence Center", Good.BLACK, [], 3),
    PLAIN,
    city("Market Square", Good.RED, [], 3),
    RIVER,
    HILL,
    city("Brookline", Good.PURPLE, [], 4),
    HILL,
  ],
  [HILL, HILL, RIVER, STREET, PLAIN, PLAIN, STREET, RIVER, HILL, HILL, HILL],
  [
    hillTown("Spring Hill"),
    RIVER,
    PLAIN,
    STREET,
    PLAIN,
    PLAIN,
    streetTown("County Courthouse"),
    RIVER,
    town("Southside Flats"),
    HILL,
  ],
  [
    HILL,
    RIVER,
    PLAIN,
    STREET,
    city("Steel Plaza", Good.BLACK, [], 5),
    PLAIN,
    PLAIN,
    STREET,
    RIVER,
    PLAIN,
    PLAIN,
  ],
  [
    RIVER,
    town("Strip District"),
    HILL,
    STREET,
    PLAIN,
    PLAIN,
    PLAIN,
    streetTown("Uptown"),
    RIVER,
    STREET,
  ],
  [
    RIVER,
    PLAIN,
    HILL,
    HILL,
    hillTown("Lemieux Place"),
    HILL,
    hillTown("Oakland"),
    HILL,
    STREET,
    { ...RIVER, terrainCost: 5 },
    city("Kenny's Grove", Good.WHITE, [], 0),
  ],
  [
    PLAIN,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    HILL,
    STREET,
    { ...RIVER, terrainCost: 5 },
  ],
  [
    town("Lawrenceville"),
    HILL,
    city("Polish Hill", Good.RED, [], 3),
    HILL,
    city("University of Pittsburgh", Good.YELLOW, [], 4),
    HILL,
    HILL,
    hillTown("Greenfield"),
    park("Hazelwood Greenway"),
    streetTown("Hazelwood"),
    RIVER,
  ],
  [
    HILL,
    HILL,
    HILL,
    HILL,
    city("Carnegie Mellon", Good.BLACK, [], 3),
    park("Schenley Park"),
    HILL,
    HILL,
    STREET,
    PLAIN,
  ],
  [
    hillTown("Stanton Heights"),
    HILL,
    hillTown("Bloomfield"),
    HILL,
    HILL,
    HILL,
    hillTown("Squirrel Hill"),
    HILL,
    STREET,
    city("Swisshelm Park", Good.RED, [], 4),
    PLAIN,
  ],
]);
