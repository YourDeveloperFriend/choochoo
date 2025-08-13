import { Module } from "../engine/module/module";
import { ConnectCitiesAction } from "../engine/build/connect_cities";
import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { Land } from "../engine/map/location";
import { Direction } from "../engine/state/tile";
import { InvalidBuildReason, Validator } from "../engine/build/validator";
import { SpaceType } from "../engine/state/location_type";

export class TownsAndSeaLinksModule extends Module {
  installMixins(): void {
    this.installMixin(ConnectCitiesAction, skipCityValidationMixin);
    this.installMixin(Validator, allowTownConnectionMixin);
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
        land: Land,
        exit: Direction,
      ): InvalidBuildReason | undefined {
        if (this.isExitTowardsSea(land, exit)
            && land.hasTown()
            && this.isExitTowardsInterCity(land, exit)) {
          return undefined;
        }
        return super.connectionAllowed(land, exit);
      }
    
      protected isExitTowardsSea(space: Land, exit: Direction): boolean {
        const neighbor = this.grid().getNeighbor(space.coordinates, exit)?.data.type;
        if (neighbor === SpaceType.WATER) {return true}
        return false ;
      }

      protected isExitTowardsInterCity(space: Land, exit: Direction): boolean {
        return this.grid().connections.some(connection =>
          connection.connects.some(c => c.equals(space.coordinates)) 
          && (
                Array.isArray(connection.connectedTownExit)
                ? connection.connectedTownExit.includes(exit)
                : connection.connectedTownExit === exit
              )
    );
}
  }
}