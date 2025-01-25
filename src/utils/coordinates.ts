import { z } from "zod";
import { Rotation } from "../engine/game/map_settings";
import { Direction } from "../engine/state/tile";
import { DoubleHeight } from "./double_height";
import { assert, assertNever } from "./validate";

export class Coordinates {
  private static readonly staticMap = new Map<string, Coordinates>();

  private constructor(
    readonly q: number,
    readonly r: number,
  ) {
    assert(
      !Coordinates.staticMap.has(this.serialize()),
      "accidentally built a different version of coordinates",
    );
  }

  neighbor(dir: Direction): Coordinates {
    const offset = toOffset(dir);
    return Coordinates.from({ q: this.q + offset.q, r: this.r + offset.r });
  }

  equals(coordinates: Coordinates): boolean {
    return this.q === coordinates.q && this.r === coordinates.r;
  }

  serialize(): string {
    return `${this.q}|${this.r}`;
  }

  getDirection(to: Coordinates): Direction {
    return fromOffset({ q: to.q - this.q, r: to.r - this.r });
  }

  toDoubleHeight(
    rotation: Rotation | undefined,
    topLeft: DoubleHeight,
    bottomRight: DoubleHeight,
  ): DoubleHeight;
  toDoubleHeight(rotation: Rotation | undefined): DoubleHeight;
  toDoubleHeight(
    rotation: Rotation | undefined,
    topLeft?: DoubleHeight,
    bottomRight?: DoubleHeight,
  ): DoubleHeight {
    const col = this.q;
    const row = 2 * this.r + this.q;
    const doubleHeight = DoubleHeight.from(col, row);
    if (topLeft != null) {
      assert(bottomRight != null);
      return doubleHeight.rotateAndCenter(rotation, topLeft, bottomRight);
    }
    return doubleHeight;
  }

  static from({ q, r }: { q: number; r: number }): Coordinates {
    const key = `${q}|${r}`;
    if (Coordinates.staticMap.has(key)) {
      return Coordinates.staticMap.get(key)!;
    }
    const newCoordinates = new Coordinates(q, r);
    Coordinates.staticMap.set(key, newCoordinates);
    return newCoordinates;
  }

  static readonly ORIGIN = Coordinates.from({ q: 0, r: 0 });

  static fromCartesianString(str: string): Coordinates {
    const matches = str.match(/^\((\d+), (\d+)\)$/);
    assert(matches != null);
    const [_, q, r] = matches;
    return Coordinates.unserialize(`${q}|${r}`);
  }

  static unserialize(serialized: string): Coordinates {
    const [q, r] = serialized.split("|").map((num) => Number(num));
    return Coordinates.from({ q, r });
  }

  toString(): string {
    return `(${this.q}, ${this.r})`;
  }

  toJson(): string {
    return JSON.stringify({ q: this.q, r: this.r });
  }
}

export const RawCoordinates = z.object({ q: z.number(), r: z.number() });

export const CoordinatesZod = RawCoordinates.transform(Coordinates.from);

interface Offset {
  q: number;
  r: number;
}

function fromOffset(offset: Offset): Direction {
  if (offset.q === -1 && offset.r === 0) {
    return Direction.TOP_LEFT;
  } else if (offset.q === 0 && offset.r === -1) {
    return Direction.TOP;
  } else if (offset.q === 1 && offset.r === -1) {
    return Direction.TOP_RIGHT;
  } else if (offset.q === -1 && offset.r === 1) {
    return Direction.BOTTOM_LEFT;
  } else if (offset.q === 0 && offset.r === 1) {
    return Direction.BOTTOM;
  } else if (offset.q === 1 && offset.r === 0) {
    return Direction.BOTTOM_RIGHT;
  } else {
    assert(
      false,
      "cannot calculate direction of offset " + JSON.stringify(offset),
    );
  }
}

function toOffset(dir: Direction): Offset {
  switch (dir) {
    case Direction.TOP_LEFT:
      return { q: -1, r: 0 };
    case Direction.TOP:
      return { q: 0, r: -1 };
    case Direction.TOP_RIGHT:
      return { q: 1, r: -1 };
    case Direction.BOTTOM_LEFT:
      return { q: -1, r: 1 };
    case Direction.BOTTOM:
      return { q: 0, r: 1 };
    case Direction.BOTTOM_RIGHT:
      return { q: 1, r: 0 };
    default:
      assertNever(dir);
  }
}
