import { BuildAction, BuildData } from "../engine/build/build";
import { DoneAction } from "../engine/build/done";
import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { injectCurrentPlayer, injectGrid } from "../engine/game/state";
import { Land } from "../engine/map/location";
import { Module } from "../engine/module/module";
import { assert } from "../utils/validate";

export class CompleteLinkBuldModule extends Module {
  installMixins() {
    this.installMixin(BuildAction, CompleteLinkBuildActionMixin);
    this.installMixin(DoneAction, CompleteLinkDoneActionMixin);
  }
}

function CompleteLinkDoneActionMixin(
  Ctor: SimpleConstructor<DoneAction>,
): SimpleConstructor<DoneAction> {
  return class extends Ctor {
    private readonly grid = injectGrid();
    private readonly currentPlayer = injectCurrentPlayer();

    validate() {
      super.validate();

      assert(this.grid().getDanglers(this.currentPlayer().color).length === 0, {
        invalidInput: "cannot end your turn with dangling track",
      });
    }
  };
}

function CompleteLinkBuildActionMixin(
  Ctor: SimpleConstructor<BuildAction>,
): SimpleConstructor<BuildAction> {
  return class extends Ctor {
    validate(data: BuildData) {
      super.validate(data);

      assert(!this.resultsInDangling(data), {
        invalidInput: "cannot end your turn with dangling track",
      });
    }

    private resultsInDangling(data: BuildData): boolean {
      if (this.helper.buildsRemaining() > 1) {
        return false;
      }
      const newTile = super.newTile(data);
      const oldSpace = this.grid().get(data.coordinates) as Land;
      const newLandData = { ...oldSpace.data, tile: newTile };
      const newSpace = new Land(data.coordinates, newLandData);
      const newGrid = this.grid().setSpace(data.coordinates, newSpace);
      return newGrid.getDanglers(this.currentPlayer().color).length > 0;
    }
  };
}
