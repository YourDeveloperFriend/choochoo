import z from "zod";
import { ClaimAction, ClaimData } from "../../engine/build/claim";
import { ConnectCitiesAction } from "../../engine/build/connect_cities";
import { CoordinatesZod } from "../../utils/coordinates";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { TOWN, Track } from "../../engine/map/track";
import { assert } from "../../utils/validate";
import { BuildAction, BuildData } from "../../engine/build/build";

export class ScotlandClaimAction extends ClaimAction {
  validate(data: ClaimData): void {
    super.validate(data);
    const land = this.grid().get(data.coordinates) as Land;
    const track = land.getTrack().find((track) => track.isClaimable())!;
    assert(canClaim(this.grid(), track), {
      invalidInput:
        "Cannot claim track without urbanizing both of connected towns first.",
    });
  }
}

function canClaim(grid: Grid, track: Track) {
  return track.getExits().every((exit) => {
    if (exit === TOWN) return false;
    const neighbor = grid.get(track.coordinates.neighbor(exit));
    if (neighbor == null) return false;
    if (neighbor instanceof City) return true;
  });
}

export const ConnectCitiesData = z.object({
  connect: CoordinatesZod.array(),
});

export type ConnectCitiesData = z.infer<typeof ConnectCitiesData>;

export class ScotlandConnectCitiesAction extends ConnectCitiesAction {
  validate(data: ConnectCitiesData): void {
    const maxTrack = this.helper.getMaxBuilds();
    assert(this.helper.buildsRemaining() > 0, { invalidInput: `You can only build at most ${maxTrack} track` });

    assert(data.connect.length === 2, { invalidInput: 'Invalid connection' });

    const connection = this.grid().findConnection(data.connect);
    assert(connection != null, { invalidInput: 'Connection not found' });
    assert(connection.owner == null, { invalidInput: 'City already connected' });
    assert(this.currentPlayer().money >= this.totalCost(data, connection), { invalidInput: 'Cannot afford purchase' });
  }
}

export class ScotlandBuildAction extends BuildAction {
  validate(data: BuildData): void {
    super.validate(data);
    const land = this.grid().get(data.coordinates) as Land;
    if (land.name() === "Ayr") {
      assert(
        (data.orientation !== 3), {invalidInput:
        "Can only build track from Ayr to Glasgow via intercity connection."
      });
      assert(
        !(data.orientation === 4 && data.tileType === 104),{invalidInput:
        "Can only build track from Ayr to Glasgow via intercity connection."
      });
    }
  }
}

