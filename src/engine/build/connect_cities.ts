import z from "zod";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { MoneyManager } from "../game/money_manager";
import { injectCurrentPlayer, injectGrid } from "../game/state";
import { City, isCity } from "../map/city";
import { GridHelper } from "../map/grid_helper";
import { InterCityConnection } from "../state/inter_city_connection";
import { BuildDiscountManager } from "./discount";
import { BuilderHelper } from "./helper";
import { BUILD_STATE } from "./state";

export const ConnectCitiesData = z.object({
  id: z.string(),
});
export type ConnectCitiesData = z.infer<typeof ConnectCitiesData>;

export class ConnectCitiesAction implements ActionProcessor<ConnectCitiesData> {
  static readonly action = 'connect-cities';
  readonly assertInput = ConnectCitiesData.parse;

  protected readonly grid = injectGrid();
  protected readonly gridHelper = inject(GridHelper);
  protected readonly buildState = injectState(BUILD_STATE);
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly moneyHelper = inject(MoneyManager);
  protected readonly helper = inject(BuilderHelper);
  protected readonly discountManager = inject(BuildDiscountManager);
  protected readonly log = inject(Log);

  protected totalCost(data: ConnectCitiesData, connection: InterCityConnection) {
    const cost = connection.cost;
    return cost - this.discountManager.getDiscount(data, cost);
  }

  protected validateUrbanizedCities(connection: InterCityConnection): void {
    const cities = connection.connects.map((coordinates) => this.grid().get(coordinates));
    assert(cities.every(isCity), { invalidInput: 'Cannot connect cities until both have been urbanized' });
}

  validate(data: ConnectCitiesData): void {
    const maxTrack = this.helper.getMaxBuilds();
    assert(this.helper.buildsRemaining() > 0, { invalidInput: `You can only build at most ${maxTrack} track` });

    const connection = this.getConnection(data);
    assert(connection.owner == null, { invalidInput: 'City already connected' });
    assert(this.currentPlayer().money >= this.totalCost(data, connection), { invalidInput: 'Cannot afford purchase' });

    this.validateUrbanizedCities(connection);
  }

  process(data: ConnectCitiesData): boolean {
    const connection = this.getConnection(data);
    const cities = connection.connects.map(coordinates => this.grid().get(coordinates) as City);
    this.moneyHelper.addMoneyForCurrentPlayer(-this.totalCost(data, connection));
    this.discountManager.applyDiscount(data, connection.cost);
    this.gridHelper.setInterCityOwner(this.currentPlayer().color, connection);

    this.buildState.update((buildState) => {
      buildState.buildCount!++;
    });

    this.log.currentPlayer(`connects ${cities.map((city) => city.name()).join(', ')}`);

    this.helper.checkOwnershipMarkerLimits();

    return this.helper.isAtEndOfTurn();
  }

  private getConnection(data: ConnectCitiesData): InterCityConnection {
    const connection = this.grid().getConnection(data.id);
    assert(connection !== undefined, { invalidInput: 'Invalid connection' });
    return connection;
  }
}