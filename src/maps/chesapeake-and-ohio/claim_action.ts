import { ClaimAction, ClaimData } from "../../engine/build/claim";
import { assert } from "../../utils/validate";
import { City } from "../../engine/map/city";
import { TOWN } from "../../engine/map/track";

export class ChesapeakeAndOhioClaimAction extends ClaimAction {
  validate(data: ClaimData): void {
    super.validate(data);

    const space = this.grid().get(data.coordinates);
    assert(space != null);
    assert(!(space instanceof City));
    const track = space.getTrack().find((track) => track.isClaimable());
    assert(track != null);

    for (const exit of track.getExits()) {
      const [endCoordinate, endExit] = this.grid().getEnd(track, exit);
      assert(endExit !== TOWN);
      const neighbor = this.grid().getNeighbor(endCoordinate, endExit);
      assert(neighbor !== undefined);
      assert(neighbor instanceof City, {
        invalidInput: "cannot claim unless town has been urbanized",
      });
    }
  }
}
