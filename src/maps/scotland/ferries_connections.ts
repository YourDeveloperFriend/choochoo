import z from "zod";
import { ConnectCitiesAction } from "../../engine/build/connect_cities";
import { CoordinatesZod } from "../../utils/coordinates";
import { Land } from "../../engine/map/location";
import { assert } from "../../utils/validate";
import { BuildAction, BuildData } from "../../engine/build/build";

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

