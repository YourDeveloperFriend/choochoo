import {
  BLACK,
  BLUE,
  Good,
  PURPLE,
  RED,
  YELLOW,
} from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { CityData, LandData, SpaceData } from "../../engine/state/space";
import {
  black,
  city,
  grid,
  MOUNTAIN,
  PLAIN,
  town,
  UNPASSABLE,
  white,
} from "../factory";
import { MauiCityData, MauiLandData } from "./map_data";

// Terrain: the engine has no beach or forest, so Maui borrows two existing land types, and
// settings.ts prices them. Beach (light tan) = DESERT. Forest (dark green) = HILL. Plains are
// PLAIN and mountains are MOUNTAIN.
const BEACH: LandData = { type: SpaceType.DESERT };
const FOREST: LandData = { type: SpaceType.HILL };

/** A hex with a flat printed price. The board renders `terrainCost` on the hex automatically. */
function flatCostHex(cost: number): LandData {
  const mapSpecific: MauiLandData = { noInitialComplexTrack: true };
  return { ...PLAIN, terrainCost: cost, mapSpecific };
}

/**
 * A hex whose printed price depends on the first tile: `straight` if it is a straight tile
 * connecting the two cities on either side of the hex, or `curve` for anything else. Not yet rendered on the board.
 */
function variableCostHex(straight: number, curve: number): LandData {
  const mapSpecific: MauiLandData = {
    noInitialComplexTrack: true,
    fixedTileCost: { straight, curve },
  };
  return { ...PLAIN, mapSpecific };
}

/** Hāna: colorless, no dice, starts with 2 cubes like any other city, and accepts the colors of the cubes currently in its hex. */
function hana(name = "Hāna"): CityData {
  const mapSpecific: MauiCityData = { cubeCollector: true };
  return { ...city(name, undefined, undefined, 2), mapSpecific };
}

/** ʻĪao Valley and Haleakalā: no number on the goods display, no starting cubes, and one cube drawn from the bag into the city every Goods Growth. */
function growthCity(name: string, color: Good | Good[]): CityData {
  const mapSpecific: MauiCityData = { growthDraws: 1 };
  return { ...city(name, color, undefined, 0), mapSpecific };
}

const HALEAKALA_SAME_CITY = 1;

/** Haleakalā spans three hexes; only the middle one receives cubes. */
function haleakalaPart(): CityData {
  return {
    ...city("Haleakalā", RED, undefined, 0),
    sameCity: HALEAKALA_SAME_CITY,
  };
}

// Short names so the grid below stays readable.
const X = UNPASSABLE;
const P = PLAIN;
const F = FOREST;
const B = BEACH;
const M = MOUNTAIN;

// The map is drawn with pointy-top hexes, so the grid is stored rotated 90 degrees and shown
// using `rotation: COUNTER_CLOCKWISE` in settings.ts. Each array below is one row of the printed
// map (bottom row first), read left to right.
export const map = grid<SpaceData>([
  [X, X, X, X, X, X, X, X, X, X, M, B, P],
  [X, X, X, X, X, X, X, X, B, P, P, P, P, P],
  [
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    town("Mākena"),
    P,
    P,
    P,
    M,
    M,
    P,
    P,
    P,
    P,
    town("Kaupo"),
  ],
  [
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    B,
    P,
    town("ʻUlupalakua"),
    M,
    M,
    M,
    M,
    M,
    M,
    F,
    F,
    F,
  ],
  [
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    city("Wailea", YELLOW, black(5), 2),
    P,
    P,
    P,
    M,
    M,
    M,
    M,
    M,
    M,
    M,
    F,
    city("Kīpahulu", BLUE, black(6), 2),
    F,
  ],
  [
    X,
    X,
    X,
    X,
    X,
    X,
    X,
    B,
    P,
    P,
    town("Keokea"),
    F,
    M,
    M,
    haleakalaPart(),
    { ...growthCity("Haleakalā", RED), sameCity: HALEAKALA_SAME_CITY },
    haleakalaPart(),
    M,
    M,
    F,
    F,
    F,
  ],
  [X, X, X, X, X, X, X, X, B, P, P, P, F, M, M, M, M, M, M, F, F, B],
  [
    X,
    X,
    X,
    X,
    P,
    X,
    X,
    city("Kīhei", BLUE, black(4), 2),
    P,
    P,
    P,
    P,
    town("Kula"),
    M,
    M,
    M,
    M,
    M,
    F,
    F,
    F,
    hana(),
  ],
  [
    X,
    X,
    X,
    P,
    B,
    town("Maalaea"),
    B,
    P,
    P,
    P,
    P,
    P,
    P,
    F,
    M,
    M,
    F,
    F,
    F,
    town("Nahiku"),
    F,
    B,
  ],
  [
    X,
    B,
    F,
    M,
    M,
    P,
    P,
    town("Puunene"),
    P,
    P,
    city("Pukalani", PURPLE, black(3), 2),
    P,
    P,
    F,
    F,
    F,
    town("Wailua"),
    F,
    F,
  ],
  [
    X,
    P,
    F,
    M,
    M,
    F,
    P,
    flatCostHex(8),
    flatCostHex(8),
    P,
    P,
    P,
    P,
    city("Makawao", PURPLE, black(2), 2),
    F,
    F,
    F,
    F,
  ],
  [
    town("Lahaina"),
    P,
    M,
    growthCity("ʻĪao Valley", BLUE),
    variableCostHex(12, 7),
    city("Wailuku", PURPLE, white(2), 2),
    variableCostHex(14, 8),
    city("Kahului", BLACK, [white(3), white(4), white(5)], 2),
    flatCostHex(8),
    P,
    P,
    P,
    P,
    F,
    F,
    town("Ke'anae"),
  ],
  [X, B, F, M, M, F, P, X, X, B, B, P, P, P, F, F],
  [
    B,
    P,
    M,
    M,
    F,
    town("Waihe'e"),
    X,
    X,
    X,
    X,
    city("Pā'ia", YELLOW, white(6), 2),
    B,
    P,
    city("Ha'ikū", BLUE, black(1), 2),
  ],
  [X, city("Napili", YELLOW, white(1), 2), P, M, F, P],
  [X, B, F, F, M],
  [X, X, X, F],
]);
