import "jasmine";
import { PlayerColor } from "../../engine/state/player";
import {
  moveColorChipBeforeUser,
  ParsedMessagePart,
  PlayerColorContainer,
} from "./message_parts";

describe("moveColorChipBeforeUser", () => {
  const user631: ParsedMessagePart = { type: "user", id: 631 };
  const redChip: PlayerColorContainer = {
    type: "playerColor",
    colorName: "red",
    playerColor: PlayerColor.RED,
  };

  it("keeps a trailing user token safe when followed only by whitespace", () => {
    const input: ParsedMessagePart[] = ["", user631, " "];

    expect(() => moveColorChipBeforeUser(input)).not.toThrow();
    expect(moveColorChipBeforeUser(input)).toEqual(input);
  });

  it("moves immediate player color before user and inserts one space", () => {
    const input: ParsedMessagePart[] = [user631, redChip, " joined"];

    expect(moveColorChipBeforeUser(input)).toEqual([
      redChip,
      " ",
      user631,
      " joined",
    ]);
  });

  it("moves player color before user when a whitespace token sits in between", () => {
    const input: ParsedMessagePart[] = [
      "prefix ",
      user631,
      " ",
      redChip,
      " joined",
    ];

    expect(moveColorChipBeforeUser(input)).toEqual([
      "prefix ",
      redChip,
      " ",
      user631,
      " joined",
    ]);
  });
});
