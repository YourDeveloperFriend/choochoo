import { BuildAction, BuildData } from "../../engine/build/build";
import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { inject } from "../../engine/framework/execution_context";
import { GoodsHelper } from "../../engine/goods_growth/helper";
import { City } from "../../engine/map/city";
import { calculateTrackInfo } from "../../engine/map/location";
import { TOWN } from "../../engine/map/track";
import { PlayerColor } from "../../engine/state/player";
import { allDirections } from "../../engine/state/tile";
import { Coordinates } from "../../utils/coordinates";
import { assert } from "../../utils/validate";

export class IndiaSteamBrothersBuildAction extends BuildAction {
  private readonly goodsHelper = inject(GoodsHelper);

  process(data: BuildData): boolean {
    for (const city of this.getNewConnectedCities(data)) {
      this.goodsHelper.moveGoodsToCity(city.coordinates, 0, 1);
    }
    return super.process(data);
  }

  private getNewConnectedCities(data: BuildData): City[] {
    const currentColor = this.currentPlayer().color;
    return calculateTrackInfo(this.newTile(data))
      .filter((track) => track.owner === currentColor)
      .flatMap(({ exits }) => exits)
      .filter((exit) => exit !== TOWN)
      .map((exit) => this.grid().getNeighbor(data.coordinates, exit))
      .filter((neighbor) => neighbor instanceof City)
      .filter((city) => {
        for (const direction of allDirections) {
          const cityConnection = this.grid().getTrackConnection(
            city.coordinates,
            direction,
          );
          if (cityConnection == null) continue;
          if (cityConnection.getOwner() === currentColor) return false;
        }
        return true;
      });
  }
}

export class IndiaSteamBrothersUrbanizeAction extends UrbanizeAction {
  private readonly goodsHelper = inject(GoodsHelper);

  process(data: UrbanizeData): boolean {
    const result = super.process(data);
    const count = this.countConnectedPlayers(data.coordinates);

    this.goodsHelper.moveGoodsToCity(data.coordinates, 0, count);
    return result;
  }

  private countConnectedPlayers(coordinates: Coordinates): number {
    const city = this.grid().get(coordinates);
    assert(city instanceof City);

    const connectedPlayers = new Set<PlayerColor | undefined>();

    for (const direction of allDirections) {
      const connection = this.grid().getTrackConnection(coordinates, direction);
      if (connection == null) continue;
      connectedPlayers.add(connection.getOwner());
    }

    // The rules aren't clear on this, but I think it only counts if the track is owned by a player.
    connectedPlayers.delete(undefined);
    return connectedPlayers.size;
  }
}
