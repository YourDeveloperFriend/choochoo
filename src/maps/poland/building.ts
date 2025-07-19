import { BuildAction, BuildData } from "../../engine/build/build";
import { assert } from "../../utils/validate";
import { isTownTile } from "../../engine/map/tile";
import { injectCurrentPlayer } from "../../engine/game/state";
import { inject } from "../../engine/framework/execution_context";
import { PlayerHelper } from "../../engine/game/player";
import { Log } from "../../engine/game/log";
import { GridHelper } from "../../engine/map/grid_helper";
import { Land } from "../../engine/map/location";

export class PolandBuildAction extends BuildAction {
  protected readonly currentPlayer = injectCurrentPlayer();
  protected readonly playerHelper = inject(PlayerHelper);
  protected readonly log = inject(Log);
  protected readonly gridHelper = inject(GridHelper);

  process(data: BuildData): boolean {
    const coordinates = data.coordinates;

    const location = this.gridHelper.lookup(coordinates);

    assert(location instanceof Land);
    if (isTownTile(data.tileType) && !location.data.tile) {
      this.playerHelper.updateCurrentPlayer((player) => player.income++);

      this.log.currentPlayer(
        `builds first connection to town ${this.grid().displayName(data.coordinates)}, and recieves 1 income`,
      );
    }

    return super.process(data);
  }
}
