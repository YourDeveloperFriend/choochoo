import {MoveValidator, RouteInfo} from "../../engine/move/validator";
import {Land} from "../../engine/map/location";
import {City} from "../../engine/map/city";
import {OwnedInterCityConnection} from "../../engine/state/inter_city_connection";
import {DenmarkMapData} from "./map_data";

export class DenmarkMoveValidator extends MoveValidator {
    protected getAdditionalRoutesFromLand(location: Land): RouteInfo[] {
        const grid = this.grid();
        return grid.connections
            .filter((connection) =>
                connection.connects.some((c) => c.equals(location.coordinates)),
            )
            .filter((connection) => connection.owner != null)
            .flatMap((connection) => {
                const otherEnd = grid.get(
                    connection.connects.find((c) => !location.coordinates.equals(c))!,
                ) as City;
                if (this.isFerryLinked(location, otherEnd)) {
                    return [{
                        type: "connection",
                        destination: otherEnd.coordinates,
                        connection: connection as OwnedInterCityConnection,
                        owner: connection.owner!.color,
                    }];
                }
                return [];
            });
    }

    protected getAdditionalRoutesFromCity(originCity: City): RouteInfo[] {
        const grid = this.grid();
        return grid.connections
            .filter((connection) =>
                connection.connects.some((c) => c.equals(originCity.coordinates)),
            )
            .filter((connection) => connection.owner != null)
            .flatMap((connection) => {
                const otherEnd = grid.get(
                    connection.connects.find((c) => !originCity.coordinates.equals(c))!,
                );
                if (otherEnd != null && !(otherEnd instanceof City) && otherEnd.hasTown() && this.isFerryLinked(otherEnd, originCity)) {
                    return [{
                        type: "connection",
                        destination: otherEnd.coordinates,
                        connection: connection as OwnedInterCityConnection,
                        owner: connection.owner!.color,
                    }];
                }
                return [];
            });
    }

    private isFerryLinked(fromTown: Land, toCity: City): boolean {
        const mapData = fromTown.getMapSpecific(DenmarkMapData.parse);
        if (mapData?.ferryLinks !== undefined) {
            for (const ferryLink of mapData.ferryLinks) {
                if (ferryLink.city === toCity.name()) {
                    if (fromTown.getTrack().some(track => track.hasExit(ferryLink.direction))) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
