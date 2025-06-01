import {assert} from "../../utils/validate";
import {Land} from "../../engine/map/location";
import {UrbanizeAction, UrbanizeData} from "../../engine/build/urbanize";

export class LondonUrbanizeAction extends UrbanizeAction {
    validate(data: UrbanizeData): void {
        super.validate(data);
        const space = this.gridHelper.lookup(data.coordinates);
        assert(space instanceof Land, 'cannot urbanize on non-land tile');
        const tileType = space.getTileType();
        assert(tileType !== undefined, 'cannot urbanize on tile without any built track');
    }
}
