import { OrderedMap } from "immutable";
import { Coordinates } from "../../utils/coordinates";
import { CityData, LandData } from "./space";

/**
 * A map's starting layout.
 *
 * Ordered rather than a plain Immutable Map, because the order this is iterated
 * in decides which city gets which goods cube: GameStarter.drawCubesForCities
 * walks it and pops from the shuffled bag as it goes.
 *
 * Immutable documents Map's iteration order as undefined -- it is a hash trie,
 * and for object keys the hash is a process-local counter assigned on first use.
 * Coordinates are interned and shared between maps, so whichever map's grid was
 * built first claimed the low hashes and every other map's order followed from
 * that. The board a seed dealt therefore depended on module load order, which
 * changed whenever the set of registered maps did.
 *
 * OrderedMap guarantees iteration in insertion order, and factory.ts inserts by
 * looping over each map's grid literal, so the order is now the source layout.
 */
export type GridData = OrderedMap<Coordinates, CityData | LandData>;
