import z from "zod";

export enum GameKey {
  SCANDINAVIA = "scandinavia",
  NEW_ENGLAND = "new-england",
  SCOTLAND = "scotland",
  ALABAMA_RAILWAYS = "alabama-railways",
  SICILY = "sicily",
  CYPRUS = "cyprus",
  DETROIT = "detroit-bankruptcy",
  GERMANY = "germany",
  DISCO_INFERNO = "disco-inferno",
  INDIA_STEAM_BROTHERS = "india",
  IRELAND = "ireland",
  KOREA_WALLACE = "korea",
  MADAGASCAR = "madagascar",
  MONTREAL_METRO = "montreal-metro",
  REVERSTEAM = "reversteam",
  ST_LUCIA = "st-lucia",
  PITTSBURGH = "pittsburgh",
  MOON = "moon",
  RUST_BELT = "rust-belt",
  SOUL_TRAIN = "soul-train",
  SWEDEN = "SwedenRecycling",
  JAMAICA = "jamaica",
  HEAVY_CARDBOARD = "heavy-cardboard",
}

export const GameKeyZod = z.nativeEnum(GameKey);
