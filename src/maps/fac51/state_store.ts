import { SerializedGameData, StateStore } from "../../engine/framework/state";
import { AVAILABLE_CITIES } from "../../engine/game/state";
import { NEW_CITY_SUPPLY } from "./state";

export class Fac51StateStore extends StateStore {
  merge(serialized: string): void {
    const data = SerializedGameData.parse(JSON.parse(serialized));
    const cities = data.gameData[AVAILABLE_CITIES.name];
    // Keep earlier FAC51 games and undo snapshots compatible with the single-choice UI.
    if (data.gameData[NEW_CITY_SUPPLY.name] == null && Array.isArray(cities)) {
      data.gameData[NEW_CITY_SUPPLY.name] = cities.length;
      data.gameData[AVAILABLE_CITIES.name] = cities.slice(0, 1);
    }
    super.merge(JSON.stringify(data));
  }
}
