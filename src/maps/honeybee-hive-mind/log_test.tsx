import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Grid } from "../../engine/map/grid";
import { Good } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { CityGroup } from "../../engine/state/city_group";
import { HoneybeeHiveMindMapSettings } from "./settings";
import { HoneybeeLogText, honeybeeLogParts } from "./log";
import { boardCoordinates as c } from "./grid";

const settings = new HoneybeeHiveMindMapSettings();
const grid = Grid.fromData(settings, settings.startingGrid, []);

it("replaces delivery terms with correctly colored symbols and full hover text", () => {
  const text = "moves a Red good from Dark 1 (L5) to Light 5 (M6)";
  const parts = honeybeeLogParts(text, grid);
  expect(parts.map((p) => (typeof p === "string" ? p : p.label)).join("")).toBe(
    text,
  );
  const symbols = parts.filter((p) => typeof p !== "string");
  expect(symbols).toMatchObject([
    { kind: "cube", color: Good.RED, label: "Red good" },
    {
      kind: "city",
      color: Good.PURPLE,
      numeral: "1",
      large: true,
      light: false,
      label: "Dark 1 (L5)",
    },
    {
      kind: "city",
      color: Good.BLACK,
      numeral: "5",
      large: false,
      light: true,
      label: "Light 5 (M6)",
    },
  ]);
  const markup = renderToStaticMarkup(
    <HoneybeeLogText text={text} grid={grid} />,
  );
  expect(markup).toContain('title="Dark 1 (L5)"');
  expect(markup).toContain('aria-label="Red good"');
  expect(markup).not.toContain(">Red good<");
  expect(markup).not.toContain(">Dark 1 (L5)<");
  expect(markup).toContain('viewBox="0 0 72 42"');
});

it("handles connections, bees and New Cities while preserving unknown text and action names", () => {
  for (const text of [
    "connects Dark 2, Dark 3",
    "relocates a bee from Dark 3 (O6) to Light 5 (M6)",
    "places city A in C4",
    "New City F (D2)",
  ]) {
    const parts = honeybeeLogParts(text, grid);
    expect(
      parts.map((p) => (typeof p === "string" ? p : p.label)).join(""),
    ).toBe(text);
    expect(parts.some((p) => typeof p !== "string")).toBe(true);
  }
  expect(honeybeeLogParts("selected Dominant Worker Bee", grid)).toEqual([
    "selected Dominant Worker Bee",
  ]);
  expect(honeybeeLogParts("New City E, Light 9, ordinary text", grid)).toEqual([
    "New City E, Light 9, ordinary text",
  ]);
  expect(
    honeybeeLogParts("Dark 2 and Dark 3", grid).filter(
      (p) => typeof p !== "string",
    ),
  ).toMatchObject([
    { large: true, color: Good.RED },
    { large: true, color: Good.BLUE },
  ]);
});

it("recognizes unnamed urbanized Cities by delivery coordinates", () => {
  const coord = c(0, 0);
  const urbanGrid = Grid.fromData(
    settings,
    settings.startingGrid.set(coord, {
      type: SpaceType.CITY,
      name: "",
      color: Good.RED,
      goods: [],
      urbanized: true,
      onRoll: [{ group: CityGroup.WHITE, onRoll: 3, goods: [] }],
    }),
    [],
  );
  const coordinate = urbanGrid.toDoubleHeightDisplay(coord).toString();
  const parts = honeybeeLogParts(
    `moves a Blue good to ${coordinate}`,
    urbanGrid,
  );
  expect(parts.filter((p) => typeof p !== "string")).toMatchObject([
    { kind: "cube", color: Good.BLUE },
    {
      kind: "city",
      numeral: "A",
      color: Good.RED,
      label: `New City A (${coordinate})`,
    },
  ]);
});
