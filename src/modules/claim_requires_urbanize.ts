import { ClaimAction, ClaimData } from "../engine/build/claim";
import { SimpleConstructor } from "../engine/framework/dependency_stack";
import { City } from "../engine/map/city";
import { Land } from "../engine/map/location";
import { TOWN, Track } from "../engine/map/track";
import { Module } from "../engine/module/module";
import { assert } from "../utils/validate";

export class ClaimRequiresUrbanizeModule extends Module {
  installMixins() {
    this.installMixin(ClaimAction, claimMixin);
  }
}

function claimMixin(
  Ctor: SimpleConstructor<ClaimAction>,
): SimpleConstructor<ClaimAction> {
  return class extends Ctor {
    validate(data: ClaimData): void {
      super.validate(data);

      const land = this.grid().get(data.coordinates) as Land;
      const track = land.getTrack().find((track) => track.isClaimable())!;
      assert(this.canClaim(track), {
        invalidInput: "cannot claim track without urbanizing neighboring towns",
      });
    }

    private canClaim(track: Track) {
      return track.getExits().every((exit) => {
        if (exit === TOWN) return false;
        const neighbor = this.grid().get(track.coordinates.neighbor(exit));
        if (neighbor == null) return false;
        return neighbor instanceof City;
      });
    }
  };
}
