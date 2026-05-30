import { inject } from "../../engine/framework/execution_context";
import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { Good } from "../../engine/state/good";
import { assert } from "../../utils/validate";
import { MexicoRoleHelper } from "./roles";

export class MexicoUrbanizeAction extends UrbanizeAction {
  private readonly roles = inject(MexicoRoleHelper);

  validate(data: UrbanizeData): void {
    super.validate(data);
    const playerColor = this.currentPlayer().color;
    const city = this.availableCities()[data.cityIndex];
    const cityColor = Array.isArray(city.color) ? city.color[0] : city.color;

    if (this.roles.isState(playerColor)) {
      assert(cityColor !== Good.RED, {
        invalidInput: "The State cannot urbanize the red New City",
      });
    } else {
      assert(cityColor !== Good.BLACK, {
        invalidInput: "The Cartel cannot urbanize the black New City",
      });
    }
  }
}
