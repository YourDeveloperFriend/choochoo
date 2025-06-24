import {Key} from "../../engine/framework/key";
import z from "zod";
import {BuildPhase} from "../../engine/build/phase";
import {injectState} from "../../engine/framework/execution_context";
import {assert} from "../../utils/validate";
import {ConnectCitiesAction, ConnectCitiesData} from "../../engine/build/connect_cities";
import {arrayEqualsIgnoreOrder, isNotNull} from "../../utils/functions";
import {InterCityConnection} from "../../engine/state/inter_city_connection";
import {BuildInfo, InvalidBuildReason, Validator} from "../../engine/build/validator";
import {DenmarkMapData} from "./map_data";
import {BuildAction, BuildData} from "../../engine/build/build";
import {calculateTrackInfo, Land} from "../../engine/map/location";
import {allDirections, Direction} from "../../engine/state/tile";
import {Coordinates} from "../../utils/coordinates";
import {TOWN, Track, TrackInfo} from "../../engine/map/track";
import {City} from "../../engine/map/city";
import {PlayerColor} from "../../engine/state/player";
import {RouteInfo} from "../../engine/move/validator";

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

        // Validate that the build does not cause the player to own two direct links between the same source/destination
        const grid = this.grid();
        const space = grid.get(coordinates);
        assert(space !== undefined && !(space instanceof City));
        const newTileData = calculateTrackInfo(buildData);
        const { rerouted, newTracks } = this.partitionTracks(space, newTileData);
        const trackToValidate = newTracks.concat(rerouted);

        for (const track of trackToValidate) {
            const routeEnds = this.getRouteEnds(coordinates, track);
            if (!routeEnds) {
                continue;
            }
            const existingRoutes = this.getRoutesFromSpace(routeEnds[0]);
            for (const existingRoute of existingRoutes) {
                if (existingRoute.owner === buildData.playerColor
                        && existingRoute.destination.equals(routeEnds[1])) {
                    return 'each player can only build a single direct link between each source/destination'
                }
            }
        }
    }

    private getRouteEnds(coordinates: Coordinates, track: TrackInfo): [Coordinates, Coordinates]|undefined {
        const [firstExit, secondExit] = track.exits;
        const [firstCoordinates, firstEndExit] = this.getEnd(coordinates, firstExit);
        const [secondCoordinates, secondEndExit] = this.getEnd(coordinates, secondExit);

        const src = (firstEndExit === TOWN) ? firstCoordinates : firstCoordinates.neighbor(firstEndExit);
        const dst = (secondEndExit === TOWN) ? secondCoordinates : secondCoordinates.neighbor(secondEndExit);

        if (firstEndExit !== TOWN && !(this.grid().get(src) instanceof City)) {
            return undefined;
        }
        if (secondEndExit !== TOWN && !(this.grid().get(dst) instanceof City)) {
            return undefined;
        }
        return [src, dst];
    }

    private getRoutesFromSpace(coordinates: Coordinates): RouteInfo[] {
        const space = this.grid().get(coordinates);
        assert(space !== undefined);
        if (space instanceof City) {
            return this.findRoutesFromCity(space);
        } else {
            return this.findRoutesFromTown(space);
        }
    }

    private findRoutesFromTown(origin: Land): RouteInfo[] {
        return origin
            .getTrack()
            .flatMap((track) => this.findRoutesFromTrack(track))
            .filter((route) => !route.destination.equals(origin.coordinates));
    }

    private findRoutesFromCity(originCity: City): RouteInfo[] {
        const grid = this.grid();
        const allCities = grid.getSameCities(originCity);
        return allCities.flatMap((originCity) =>
            allDirections
                .map((direction) =>
                    grid.getTrackConnection(originCity.coordinates, direction),
                )
                .filter(isNotNull)
                .flatMap((connection) => {
                    return this.findRoutesFromTrack(connection).filter(
                        (route) => route.destination !== originCity.coordinates,
                    );
                }),
        );
    }

    private findRoutesFromTrack(startingTrack: Track): RouteInfo[] {
        return startingTrack
            .getExits()
            .map((exit): RouteInfo | undefined => {
                const [end, endExit] = this.grid().getEnd(startingTrack, exit);
                if (endExit === TOWN) {
                    return {
                        type: "track",
                        destination: end,
                        startingTrack,
                        owner: startingTrack.getOwner(),
                    };
                }
                const next = this.grid().get(end.neighbor(endExit));
                if (next instanceof City) {
                    return {
                        type: "track",
                        destination: next.coordinates,
                        startingTrack,
                        owner: startingTrack.getOwner(),
                    };
                }
                return undefined;
            })
            .filter(isNotNull);
    }

    // Allow builds from an otherwise unconnected town to build a connection to a ferry link and then be considered connected
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

    // Town discs should be considered unlimited in this map
    protected townDiscCount(): number {
        return 99;
    }
}

export class DenmarkBuildAction extends BuildAction {
    process(data: BuildData): boolean {
        const result = super.process(data);

        // Noone can own the ferry-link connection. Unset the ownership if it got set by the processor
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
