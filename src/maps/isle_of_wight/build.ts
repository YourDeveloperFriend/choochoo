import { ImmutableMap } from "../../utils/immutable";
import { inject } from "../../engine/framework/execution_context";
import { BuilderHelper } from "../../engine/build/helper";
import { TileType } from "../../engine/state/tile";
import { TrainHelper } from "./trains";

export class IsleOfWightBuilderHelper extends BuilderHelper {
  private readonly trainHelper = inject(TrainHelper);

  getMaxBuilds(): number {
    return this.trainHelper.getMaxBuilds();
  }

  protected startingManifest(): ImmutableMap<TileType, number> {
    let manifest = super.startingManifest();
    manifest = this.trainHelper.adjustTileManifest(manifest);
    return manifest;
  }
}
