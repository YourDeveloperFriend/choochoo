import { Module } from "../engine/module/module";
import { ConnectCitiesAction } from "../engine/build/connect_cities";
import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { Land } from "../engine/map/location";
import { Direction } from "../engine/state/tile";
import { InvalidBuildReason, Validator } from "../engine/build/validator";
import { MoveValidator, RouteInfo } from "../engine/move/validator";
import { SpaceType } from "../engine/state/location_type";
import { City } from "../engine/map/city";
import { OwnedInterCityConnection } from "../engine/state/inter_city_connection";
import { BuildPhase } from "../engine/build/phase";
import { DanglerInfo } from "../engine/map/grid";
import { PlayerColor } from "../engine/state/player";

export class TownsAndSeaLinksModule extends Module {
  installMixins(): void {
    this.installMixin(ConnectCitiesAction, skipCityValidationMixin);
    this.installMixin(Validator, allowTownConnectionMixin);
    this.installMixin(MoveValidator, allowGoodsMovementMixin);
    this.installMixin(BuildPhase, noSeaRouteDanglersMixin);
  }
}

function skipCityValidationMixin(
  Ctor: SimpleConstructor<ConnectCitiesAction>
): SimpleConstructor<ConnectCitiesAction> {
  return class extends Ctor {
    protected validateUrbanizedCities(): void {}
  };
}

function allowTownConnectionMixin(
  Ctor: SimpleConstructor<Validator>
): SimpleConstructor<Validator> {
  return class extends Ctor {
    protected connectionAllowed(
        playerColor: PlayerColor,
        land: Land,
        exit: Direction,
      ): InvalidBuildReason | undefined {
        if (this.isExitTowardsSea(land, exit)
            && land.hasTown()
            && this.isExitTowardsInterCity(land, exit)) {
          return undefined;
        }
        return super.connectionAllowed(playerColor, land, exit);
      }
    
      protected isExitTowardsSea(space: Land, exit: Direction): boolean {
        const neighbor = this.grid().getNeighbor(space.coordinates, exit)?.data.type;
        if (neighbor === SpaceType.WATER) {return true}
        return false ;
      }

      protected isExitTowardsInterCity(space: Land, exit: Direction): boolean {
        return this.grid().connections.some(connection =>
          connection.connects.some(c => c.equals(space.coordinates)) 
          && Array.isArray(connection.connectedTownExits)
          && connection.connectedTownExits.includes(exit)
        );
      }
  }
}

function allowGoodsMovementMixin(
  Ctor: SimpleConstructor<MoveValidator>
): SimpleConstructor<MoveValidator> {
  return class extends Ctor {
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
            );
            if (!(otherEnd instanceof City)) {
              return [];
            }
              return [
                {
                  type: "connection",
                  destination: otherEnd.coordinates,
                  connection: connection as OwnedInterCityConnection,
                  owner: connection.owner!.color,
                },
              ];

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
          if (
            otherEnd != null &&
            !(otherEnd instanceof City) &&
            otherEnd.hasTown() 
          ) {
            return [
              {
                type: "connection",
                destination: otherEnd.coordinates,
                connection: connection as OwnedInterCityConnection,
                owner: connection.owner!.color,
              },
            ];
          }
          return [];
        });
    }
  }
}

function noSeaRouteDanglersMixin(
  Ctor: SimpleConstructor<BuildPhase>
): SimpleConstructor<BuildPhase> {
  return class extends Ctor {
      getDanglersAsInfo(color?: PlayerColor): DanglerInfo[] {
        const ownedConnectionsWithSeaRoutes = this.grid().connections
          .filter(connection =>
            Array.isArray(connection.connectedTownExits) &&
            connection.owner != undefined
          );

        return this.grid()
          .getDanglers(color)
          .filter(track => {
            const matchingConnection = ownedConnectionsWithSeaRoutes.find(conn =>
              conn.connects.some(coord =>
                coord.q === track.coordinates.q 
                && coord.r === track.coordinates.r
              )
            );

            if (!matchingConnection) return true;

            const immovableExit = this.grid().getImmovableExitReference(track);
            const isMatchingExit = matchingConnection.connectedTownExits?.includes(immovableExit) ?? false;

            if (isMatchingExit) { return false }
            return true;
          })
          .map(track => ({
            coordinates: track.coordinates,
            immovableExit: this.grid().getImmovableExitReference(track),
            length: this.grid().getRoute(track).length,
          }));
      }
  };
}