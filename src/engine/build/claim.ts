import z from "zod";
import { CoordinatesZod } from "../../utils/coordinates";
import { assert } from "../../utils/validate";
import { inject, injectState } from "../framework/execution_context";
import { ActionProcessor } from "../game/action";
import { Log } from "../game/log";
import { PlayerHelper } from "../game/player";
import { CURRENT_PLAYER, injectGrid } from "../game/state";
import { City } from "../map/city";
import { GridHelper } from "../map/grid_helper";
import { Land } from "../map/location";
import { SpaceType } from "../state/location_type";
import { BuilderHelper } from "./helper";
import { BUILD_STATE } from "./state";

export const ClaimData = z.object({
  coordinates: CoordinatesZod,
});

export type ClaimData = z.infer<typeof ClaimData>;

export class ClaimAction implements ActionProcessor<ClaimData> {
  static readonly action = 'claim';
  readonly assertInput = ClaimData.parse;

  protected readonly log = inject(Log);
  protected readonly helper = inject(BuilderHelper);
  protected readonly buildState = injectState(BUILD_STATE);
  protected readonly grid = injectGrid();
  protected readonly gridHelper = inject(GridHelper);
  protected readonly currentPlayer = injectState(CURRENT_PLAYER);
  protected readonly playerHelper = inject(PlayerHelper);

  validate(data: ClaimData): void {
    const space = this.grid().get(data.coordinates);
    assert(!(space instanceof City), { invalidInput: 'cannot claim on a city' });
    assert(space != null, { invalidInput: 'cannot call claim on an invalid space' });
    assert(space.getTrack().some((track) => track.isClaimable()), { invalidInput: 'No claimable track on given space' });
  }

  process(data: ClaimData): boolean {
    const space = this.grid().get(data.coordinates);
    assert(space instanceof Land);
    const track = space.getTrack().find((track) => track.isClaimable());
    assert(track != null);

    const route = this.grid().getRoute(track);

    this.log.currentPlayer(`claimes the route at ${data.coordinates.toString()}`);

    for (const t of route) {
      this.gridHelper.update(t.coordinates, (space) => {
        assert(space.type !== SpaceType.CITY);
        space.tile!.owners[t.ownerIndex] = this.currentPlayer();
      });
    }

    this.buildState.update(({ previousBuilds }) => {
      previousBuilds.push(data.coordinates);
    });

    this.playerHelper.addMoneyForCurrentPlayer(track.claimCost());
    return this.helper.isAtEndOfTurn();
  }
}