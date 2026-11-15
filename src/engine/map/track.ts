import { Coordinates } from "../../utils/coordinates";
import { assert, fail } from "../../utils/validate";
import { PlayerColor } from "../state/player";
import { Direction } from "../state/tile";
import { rotateDirectionClockwise } from "./direction";

export class Track {
  constructor(
    readonly ownerIndex: number,
    readonly coordinates: Coordinates,
    private readonly track: TrackInfo,
  ) {}

  /** Returns the exits for the track */
  getExits(): [Exit, Exit] {
    return this.track.exits;
  }

  otherExit(lookingFor: Exit): Exit {
    const [first, second] = this.track.exits;
    if (first === lookingFor) {
      return second;
    }
    if (second === lookingFor) {
      return first;
    }
    fail(
      `cannot find other exit when exit not found: lookingFor=${lookingFor} exits=${first},${second}`,
    );
  }

  /** Returns the owner of the track */
  getOwner(): PlayerColor | undefined {
    return this.track.owner;
  }

  /** Returns whether this track exits this direction */
  hasExit(exit: Exit): boolean {
    return this.track.exits.includes(exit);
  }

  wasClaimed(): boolean {
    return this.track.claimableCost != null && this.getOwner() != null;
  }

  isClaimable(): boolean {
    return this.track.claimableCost != null && this.getOwner() == null;
  }

  claimCost(): number {
    assert(this.isClaimable());
    return this.track.claimableCost!;
  }

  equals(other: Track | TrackInfo): boolean {
    if (other instanceof Track && !this.coordinates.equals(other.coordinates)) {
      return false;
    }
    const otherExits = other instanceof Track ? other.getExits() : other.exits;
    return this.getExits().every((e) => otherExits.includes(e));
  }
}

export function tupleMap<T, R>(tuple: [T, T], updateFn: (t: T) => R): [R, R] {
  return tuple.map(updateFn) as [R, R];
}

export const TOWN = 9;

type Town = typeof TOWN;

export type Exit = Direction | Town;

export interface TrackInfo {
  exits: [Exit, Exit];
  owner?: PlayerColor;
  claimableCost?: number;
}

export function rotateExitClockwise(exit: Exit): Exit {
  if (exit === TOWN) {
    return exit;
  }
  return rotateDirectionClockwise(exit);
}
