import z from "zod";

export enum GameKey {
  CYPRUS = "cyprus",
  DETROIT = "detroit-bankruptcy",
  GERMANY = "germany",
  INDIA_STEAM_BROTHERS = "india",
  IRELAND = "ireland",
  KOREA_WALLACE = "korea",
  MADAGASCAR = "madagascar",
  MONTREAL_METRO = "montreal-metro",
  REVERSTEAM = "reversteam",
  RUST_BELT = "rust-belt",
  SWEDEN = "SwedenRecycling",
}

export const GameKeyZod = z.nativeEnum(GameKey);
