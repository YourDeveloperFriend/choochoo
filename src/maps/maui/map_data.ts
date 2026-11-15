import z from "zod";

/** Marks a city as Hāna-like and/or one that receives cubes every Goods Growth. */
export const MauiCityData = z.object({
  /** Accepts deliveries of whichever colors currently have a cube in the city (Hāna). */
  cubeCollector: z.boolean().optional(),
  /** Cubes drawn from the bag and added to this city during every Goods Growth. */
  growthDraws: z.number().optional(),
});
export type MauiCityData = z.infer<typeof MauiCityData>;

/** Marks one of the five land hexes with a price printed on the board. */
export const MauiLandData = z.object({
  /** Complex track cannot be initially placed here. */
  noInitialComplexTrack: z.boolean().optional(),
  /**
   * For the variable-price hexes only: the first tile costs `straight` if it is a straight tile
   * connecting the two cities on either side of the hex, and `curve` otherwise. Flat-price hexes use `terrainCost` instead,
   * which the board renders automatically.
   */
  fixedTileCost: z
    .object({
      straight: z.number(),
      curve: z.number(),
    })
    .optional(),
});
export type MauiLandData = z.infer<typeof MauiLandData>;
