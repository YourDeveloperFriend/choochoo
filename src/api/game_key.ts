import z from "zod";

export enum GameKey {
  CYPRUS = "cyprus",
  DETROIT = "detroit-bankruptcy",
  GERMANY = "germany",
  INDIA = "india",
  IRELAND = "ireland",
  KOREA = "korea",
  MADAGASCAR = "madagascar",
  MONTREAL_METRO = "montreal-metro",
  REVERSTEAM = "reversteam",
  RUST_BELT = "rust-belt",
  SWEDEN = "SwedenRecycling",
}

export const GameKeyZod = z.nativeEnum(GameKey);
