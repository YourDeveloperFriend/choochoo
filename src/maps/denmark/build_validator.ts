import {BuildInfo, InvalidBuildReason, Validator} from "../../engine/build/validator";
import {Coordinates} from "../../utils/coordinates";
import {Grid} from "../../engine/map/grid";
import {TrackInfo} from "../../engine/map/track";

export class DenmarkBuildValidator extends Validator {
    protected townDiscCount(): number {
        return 99;
    }

    public getInvalidBuildReason(coordinates: Coordinates, buildData: BuildInfo): InvalidBuildReason | undefined {
        const reason = super.getInvalidBuildReason(coordinates, buildData);
        if (reason !== undefined) {
            return reason;
        }
    }

    private createsMultipleDirectLinks(grid: Grid, coordinates: Coordinates, newTileData: TrackInfo[]): boolean {
        // FIXME
        return false;
    }
}
