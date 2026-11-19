import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { injectState } from "../../engine/framework/execution_context";
import { Land } from "../../engine/map/location";
import { SpaceType } from "../../engine/state/location_type";
import { allDirections } from "../../engine/state/tile";
import { assert } from "../../utils/validate";
import { NEW_CITY_SUPPLY } from "./state";

export class Fac51UrbanizeAction extends UrbanizeAction {
  private readonly newCitySupply = injectState(NEW_CITY_SUPPLY);

  process(data: UrbanizeData): boolean {
    const location = this.gridHelper.lookup(data.coordinates);
    assert(location instanceof Land);

    // Preserve base-game ownership of complete, unowned links when a town becomes a city.
    const unownedConnections = allDirections.filter((direction) => {
      if (location.trackExiting(direction) != null) {
        return false;
      }
      const connection = this.grid().getTrackConnection(
        data.coordinates,
        direction,
      );
      return (
        connection != null &&
        connection.getOwner() == null &&
        this.grid()
          .getRoute(connection)
          .every((track) => !track.isClaimable())
      );
    });

    this.buildState.update((state) => {
      state.hasUrbanized = true;
    });
    // Older FAC51 saves stored a separate identical choice for every remaining tile.
    const remaining =
      this.newCitySupply.getOr(this.availableCities().length) - 1;
    this.newCitySupply.upsert(remaining);
    this.availableCities.set(
      remaining > 0 ? [{ color: [], goods: [], onRoll: [] }] : [],
    );
    this.gridHelper.set(data.coordinates, {
      type: SpaceType.CITY,
      name: location.name()!,
      color: [],
      goods: [],
      onRoll: [],
      urbanized: true,
      mapSpecific: location.data.mapSpecific,
    });

    for (const direction of unownedConnections) {
      const connection = this.grid().getTrackConnection(
        data.coordinates,
        direction,
      )!;
      this.gridHelper.setRouteOwner(connection, this.currentPlayer().color);
    }

    this.log.currentPlayer(
      `places a colourless assembly station in ${this.grid().displayName(data.coordinates)}`,
    );
    return this.helper.isAtEndOfTurn();
  }
}
