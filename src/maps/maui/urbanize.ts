import { UrbanizeAction, UrbanizeData } from "../../engine/build/urbanize";
import { assert } from "../../utils/validate";

export class MauiUrbanizeAction extends UrbanizeAction {
  validate(data: UrbanizeData) {
    super.validate(data);
    assert(this.helper.buildCount() === 0, {
      invalidInput: "urbanization must be done before track builds",
    });
  }
}
