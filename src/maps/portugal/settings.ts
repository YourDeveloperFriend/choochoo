import { GameKey } from "../../api/game_key";
import {
  KAOSKODY,
  MapSettings,
  ReleaseStage,
} from "../../engine/game/map_settings";
import { Module } from "../../engine/module/module";
import { BOTTOM, TOP } from "../../engine/state/tile";
import { OneClaimLimitModule } from "../../modules/one_claim_limit";
import { TownsAndSeaLinksModule } from "../../modules/towns_and_sea_links";
import { interCityConnections } from "../factory";
import { PortugalGoodsGrowthPhase } from "./goods";
import { map } from "./grid";
import {
  LisboaBuildAction,
  LisboaConnectAction,
  PortugalMoveValidator,
  PortugalBuildPhase,
} from "./lisboa";

export class PortugalMapSettings implements MapSettings {
  readonly key = GameKey.PORTUGAL;
  readonly name = "Portugal";
  readonly designer = "Vital Lacerda";
  readonly implementerId = KAOSKODY;
  readonly minPlayers = 3;
  readonly maxPlayers = 6;
  readonly startingGrid = map;
  readonly stage = ReleaseStage.ALPHA;
  readonly interCityConnections = interCityConnections(map, [
    {
      connects: ["Lisboa", "Açores"],
      cost: 6,
      center: [11, 11],
      offset: { direction: BOTTOM, distance: 0.2 },
    },
    {
      connects: ["Lisboa", "Açores"],
      cost: 6,
      center: [11, 12],
      offset: { direction: TOP, distance: 0.6 },
    },
    {
      connects: ["Lisboa", "Açores"],
      cost: 6,
      center: [11, 12],
      offset: { direction: BOTTOM, distance: 0.6 },
    },
    {
      connects: ["Lisboa", "Açores"],
      cost: 6,
      center: [11, 13],
      offset: { direction: TOP, distance: 0.2 },
    },
    { connects: ["Sagres", "Madeira"], cost: 6, center: [17, 7], connectedTownExit: BOTTOM },
    { connects: ["Sagres", "Madeira"], cost: 6, center: [17, 8], connectedTownExit: BOTTOM },
    { connects: ["Sagres", "Madeira"], cost: 6, center: [17, 9], connectedTownExit: BOTTOM },
    { connects: ["Sagres", "Madeira"], cost: 6, center: [17, 10], connectedTownExit: BOTTOM },
    { connects: ["Lisboa", "Porto"], cost: 6, center: [6, 13] },
    { connects: ["Lisboa", "Sines"], cost: 6, center: [13, 9], connectedTownExit: BOTTOM },
  ]);

  getOverrides() {
    return [
      LisboaBuildAction,
      LisboaConnectAction,
      PortugalGoodsGrowthPhase,
      PortugalMoveValidator,
      PortugalBuildPhase,
    ];
  }

  getModules(): Array<Module> {
    return [
      new OneClaimLimitModule(),
      new TownsAndSeaLinksModule(),
    ];
  }
}