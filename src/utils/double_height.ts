import { Point } from "../client/grid/point";
import { Rotation } from "../engine/game/map_settings";
import { assert, assertNever } from "./validate";

export class DoubleHeight {
  private static readonly staticMap = new Map<string, DoubleHeight>();

  private constructor(
    readonly col: number,
    readonly row: number,
  ) {}

  toPoint(size: number): Point {
    const x = ((size * 3) / 2) * this.col;
    const y = ((size * Math.sqrt(3)) / 2) * this.row;
    return { x, y };
  }

  rotateAndCenter(
    rotation: Rotation | undefined,
    topLeft: DoubleHeight,
    bottomRight: DoubleHeight,
  ): DoubleHeight {
    switch (rotation) {
      case undefined:
        return this.offset(-topLeft.col, -topLeft.row);
      case Rotation.CLOCKWISE:
        return DoubleHeight.from(
          this.col + topLeft.col,
          -this.row + bottomRight.row,
        );
      case Rotation.COUNTER_CLOCKWISE:
        return DoubleHeight.from(
          -this.col + bottomRight.col,
          this.row - topLeft.row,
        );
      default:
        assertNever(rotation);
    }
  }

  offset(byCol: number, byRow: number): DoubleHeight {
    return new DoubleHeight(this.col + byCol, this.row + byRow);
  }

  toColString(): string {
    return `${this.col}`;
  }

  toRowString(): string {
    let row = this.row >= 0 ? this.row : -1 - this.row;
    const strings = [];
    strings.push(String.fromCharCode("A".charCodeAt(0) + (row % 26)));
    // This isn't just a simple conversion, because to go from Z -> AA
    // isn't the same as going from 9 -> 10, because if A represents 0,
    // then technically Z -> BA is the equivalent as 9 -> 10, but this
    // is unexpected.
    assert(this.row < 26 * 26, "I honestly never expected this");
    if (row >= 26) {
      row = Math.floor(row / 26);
      strings.push(String.fromCharCode("A".charCodeAt(0) + row - 1));
    }
    if (this.row < 0) {
      strings.push("-");
    }
    return strings.reverse().join("");
  }

  toString(): string {
    return `${this.toRowString()}${this.toColString()}`;
  }

  static from(col: number, row: number): DoubleHeight {
    const key = `${col}|${row}`;
    if (!this.staticMap.has(key)) {
      this.staticMap.set(key, new DoubleHeight(col, row));
    }
    return this.staticMap.get(key)!;
  }
}
