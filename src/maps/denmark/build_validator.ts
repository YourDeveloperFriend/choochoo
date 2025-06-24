import {Key} from "../../engine/framework/key";
import z from "zod";
import {BuildPhase} from "../../engine/build/phase";
import {injectState} from "../../engine/framework/execution_context";
import {assert} from "../../utils/validate";
import {ConnectCitiesAction, ConnectCitiesData} from "../../engine/build/connect_cities";
import {arrayEqualsIgnoreOrder} from "../../utils/functions";
import {InterCityConnection} from "../../engine/state/inter_city_connection";
import {BuildInfo, InvalidBuildReason, Validator} from "../../engine/build/validator";
import {DenmarkMapData} from "./map_data";
import {BuildAction, BuildData} from "../../engine/build/build";
import {calculateTrackInfo, Land} from "../../engine/map/location";
import {Direction} from "../../engine/state/tile";
import {Coordinates} from "../../utils/coordinates";
import {TOWN, TrackInfo} from "../../engine/map/track";
import {City} from "../../engine/map/city";
import {isTownTile} from "../../engine/map/tile";
import {PlayerColor} from "../../engine/state/player";

const FERRY_CLAIM_COUNT = new Key("FERRY_CLAIM_COUNT", { parse: z.number().parse });

export class DenmarkBuildPhase extends BuildPhase {
    private readonly ferryClaimCount = injectState(FERRY_CLAIM_COUNT);

    onStartTurn(): void {
        this.ferryClaimCount.initState(0);
        return super.onStartTurn();
    }

    onEndTurn(): void {
        this.ferryClaimCount.delete();
        return super.onEndTurn();
    }
}

export class DenmarkConnectCitiesAction extends ConnectCitiesAction {
    private readonly ferryClaimCount = injectState(FERRY_CLAIM_COUNT);

    protected validateUrbanizedCities(connection: InterCityConnection): void {
        // On the Denmark map, towns do not need to be urbanized to claim a link, though goods cannot
        // be moved across until a route is built. See DenmarkMoveValidator.
    }

    validate(data: ConnectCitiesData): void {
        assert(this.ferryClaimCount() < 2, {
            invalidInput: "Can only claim two ferry routes per turn",
        });

        // Validate this player does not already have a ferry link between these two cities
        const thisConnection = this.grid().getConnection(data.id);
        assert(thisConnection !== undefined, { invalidInput: "Invalid connection ID" });
        for (const connection of this.grid().connections) {
            if (connection.id === data.id) {
                continue;
            }
            if (arrayEqualsIgnoreOrder(connection.connects, thisConnection.connects)) {
                assert(!connection.owner || connection.owner.color !== this.currentPlayer().color,
                    { invalidInput: "Cannot claim the same ferry link twice" });
            }
        }

        return super.validate(data);
    }

    process(data: ConnectCitiesData): boolean {
        this.ferryClaimCount.set(this.ferryClaimCount() + 1);
        return super.process(data);
    }
}

export class DenmarkBuildValidator extends Validator {
    getInvalidBuildReason(coordinates: Coordinates, buildData: BuildInfo): InvalidBuildReason | undefined {
        const reason = super.getInvalidBuildReason(coordinates, buildData);
        if (reason !== undefined) {
            return reason;
        }

        const grid = this.grid();
        const space = grid.get(coordinates);
        assert(space !== undefined && !(space instanceof City));
        const newTileData = calculateTrackInfo(buildData);
        const { preserved, rerouted, newTracks } = this.partitionTracks(space, newTileData);
        const trackToValidate = newTracks.concat(rerouted);
/*
        for (const track of trackToValidate) {
            const [firstExit, secondExit] = track.exits;
            const [firstCoordinates, firstEndExit] = this.getEnd(coordinates, firstExit);
            const [secondCoordinates, secondEndExit] = this.getEnd(coordinates, secondExit);

            const src = (firstEndExit === TOWN) ? firstCoordinates : firstCoordinates.neighbor(firstEndExit);
            const dst = (secondEndExit === TOWN) ? secondCoordinates : secondCoordinates.neighbor(secondEndExit);
            const srcTile = grid.get(src)!;
            const dstTile = grid.get(dst)!;
            srcTile.

            if (firstEndExit === TOWN) {
                return secondEndExit === TOWN && firstCoordinates.equals(secondCoordinates);
            }
            if (secondEndExit === TOWN) {
                return false;
            }
            const first = grid.get(firstCoordinates.neighbor(firstEndExit))!;
            const second = grid.get(secondCoordinates.neighbor(secondEndExit))!;
            if (first instanceof City && second instanceof City) {
                return first.isSameCity(second);
            }
            return false;

        }

 */
    }

    protected newTrackExtendsPrevious(playerColor: PlayerColor, space: Land, newTracks: TrackInfo[]): boolean {
        if (space.hasTown()) {
            const mapData = space.getMapSpecific(DenmarkMapData.parse);
            if (mapData?.ferryLinks) {
                for (const ferryLink of mapData.ferryLinks) {
                    const linkedCity = this.grid().cities().find(city => city.name() === ferryLink.city)!;
                    const hasFerryConnection = this.grid().connections
                        .some(connection =>
                            connection.owner != null
                            && arrayEqualsIgnoreOrder(connection.connects, [space.coordinates, linkedCity.coordinates]));

                    if (hasFerryConnection) {
                        for (const newTrack of newTracks) {
                            if (newTrack.exits.some(exit => exit === ferryLink.direction)) {
                                return true;
                            }
                        }
                    }
                }
            }
        }

        return super.newTrackExtendsPrevious(playerColor, space, newTracks);
    }

    protected connectionAllowed(land: Land, exit: Direction): InvalidBuildReason|undefined {
        // Allow builds that are establishing ferry links
        const mapData = land.getMapSpecific(DenmarkMapData.parse);
        if (mapData?.ferryLinks !== undefined) {
            for (const ferryLink of mapData.ferryLinks) {
                if (exit === ferryLink.direction) {
                    return undefined;
                }
            }
        }

        return super.connectionAllowed(land, exit);
    }

    protected townDiscCount(): number {
        return 99;
    }
}

export class DenmarkBuildAction extends BuildAction {
    process(data: BuildData): boolean {
        const result = super.process(data);

        // No-one can own the ferry-link connection. Unset the ownership if it got set by the processor
        const location = this.gridHelper.lookup(data.coordinates);
        assert(location instanceof Land);
        const mapData = location.getMapSpecific(DenmarkMapData.parse);
        if (mapData?.ferryLinks !== undefined) {
            for (const ferryLink of mapData.ferryLinks) {
                for (const track of location.getTrack()) {
                    if (track.hasExit(ferryLink.direction) && track.getOwner() !== undefined) {
                        this.gridHelper.setRouteOwner(track, undefined);
                    }
                }
            }
        }

        return result;
    }
}
