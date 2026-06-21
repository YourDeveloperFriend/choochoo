import { injectState } from "../../engine/framework/execution_context";
import { GameStarter } from "../../engine/game/starter";
import { DISFAVOR_TRACK, LOCO_TRACK } from "./state";
import { LocoRow } from "./track_data";

export class StalinistRussiaStarter extends GameStarter {
  private readonly locoTrack = injectState(LOCO_TRACK);
  private readonly disfavorTrack = injectState(DISFAVOR_TRACK);

  protected onStartGame(): void {
    super.onStartGame();

    this.locoTrack.initState(
      new Map(
        this.turnOrder().map((color) => [color, { box: 0, row: LocoRow.MANY }]),
      ),
    );
    this.disfavorTrack.initState(
      new Map(this.turnOrder().map((color) => [color, 0])),
    );
  }
}
