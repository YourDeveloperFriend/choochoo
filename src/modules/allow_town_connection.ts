import { Module } from "../engine/module/module";
import { ConnectCitiesAction } from "../engine/build/connect_cities";
import { SimpleConstructor } from "../engine/framework/dependency_stack";

export class AllowTownConnectionModule extends Module {
  installMixins(): void {
    this.installMixin(ConnectCitiesAction, allowTownConnectionMixin);
  }
}

function allowTownConnectionMixin(
  Ctor: SimpleConstructor<ConnectCitiesAction>
): SimpleConstructor<ConnectCitiesAction> {
  return class extends Ctor {
    protected validateUrbanizedCities(): void {}
  };
}
