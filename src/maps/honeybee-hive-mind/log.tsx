import { useId } from "react";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { CityGroup, toLetter } from "../../engine/state/city_group";
import { Good } from "../../engine/state/good";
import { HONEYBEE_GOOD_IMAGE } from "./identity";

interface Symbol {
  label: string;
  kind: "city" | "cube" | "bee";
  color: Good;
  numeral?: string;
  large?: boolean;
  light?: boolean;
}
const colors: Record<string, Good> = {
  red: Good.RED,
  blue: Good.BLUE,
  purple: Good.PURPLE,
  black: Good.BLACK,
  yellow: Good.YELLOW,
  white: Good.WHITE,
};
const fills = {
  [Good.RED]: "#d41e2d",
  [Good.BLUE]: "#00a2d3",
  [Good.PURPLE]: "#8d5a95",
  [Good.BLACK]: "#444444",
  [Good.YELLOW]: "#f5ac11",
  [Good.WHITE]: "#e9dcc9",
};
// New City colors and growth identities are fixed; E is absent from this map.
const newCities: Record<string, [Good, boolean]> = {
  A: [Good.RED, true],
  B: [Good.BLUE, true],
  C: [Good.BLACK, true],
  D: [Good.BLACK, true],
  F: [Good.PURPLE, false],
  G: [Good.BLACK, false],
  H: [Good.BLACK, false],
};
const terms =
  /\b(?:(?:Red|Blue|Purple|Black|Yellow|White) goods?|(?:Dark|Light) [1-6](?: \([A-Z]+\d+\))?|(?:New City|City) [A-H](?: \([A-Z]+\d+\))?|bee swarms?|bees?|yellow cubes?|[A-Z]{1,2}\d{1,2})(?!\w)/gi;

function citySymbol(city: City, label: string, grid: Grid): Symbol | undefined {
  const primary =
    grid.getSameCities(city).find((half) => half.onRoll().length) ?? city;
  const roll = primary.onRoll()[0];
  if (!roll) {
    return undefined;
  }
  return {
    kind: "city",
    label,
    color: primary.goodColors()[0],
    numeral: primary.isUrbanized() ? toLetter(roll) : String(roll.onRoll),
    large: primary.data.sameCity != null,
    light: primary.group() === CityGroup.WHITE,
  };
}

/** Display-only enrichment: persisted log strings remain intact and readable. */
export function honeybeeLogParts(
  text: string,
  grid: Grid,
): Array<string | Symbol> {
  const result: Array<string | Symbol> = [];
  let previous = 0;
  for (const match of text.matchAll(terms)) {
    const label = match[0],
      name = label.replace(/ \([A-Z]+\d+\)$/i, "");
    let symbol: Symbol | undefined;
    const good = /^(Red|Blue|Purple|Black|Yellow|White) goods?$/i.exec(name);
    if (good) {
      const color = colors[good[1].toLowerCase()];
      symbol = { kind: color === Good.YELLOW ? "bee" : "cube", color, label };
    } else if (/^(?:bee swarms?|bees?|yellow cubes?)$/i.test(name)) {
      if (/Dominant Worker $/i.test(text.slice(0, match.index))) {
        continue;
      }
      symbol = { kind: "bee", color: Good.YELLOW, label };
    } else if (/^(?:Dark|Light) [1-6]$/i.test(name)) {
      const city = grid
        .cities()
        .find((city) => city.name().toLowerCase() === name.toLowerCase());
      if (city) {
        symbol = citySymbol(city, label, grid);
      }
    } else {
      const letter = /^(?:New City|City) ([A-H])$/i
        .exec(name)?.[1]
        .toUpperCase();
      if (letter && newCities[letter]) {
        const [color, light] = newCities[letter];
        symbol = { kind: "city", color, light, numeral: letter, label };
      } else if (
        /^[A-Z]+\d+$/i.test(name) &&
        /\b(?:from|to|through)\s+$/i.test(text.slice(0, match.index))
      ) {
        const city = grid
          .cities()
          .find(
            (city) =>
              city.isUrbanized() &&
              grid
                .toDoubleHeightDisplay(city.coordinates)
                .toString()
                .toLowerCase() === name.toLowerCase(),
          );
        if (city) {
          symbol = citySymbol(city, label, grid);
          if (symbol) {
            symbol.label = `New City ${symbol.numeral} (${label})`;
          }
        }
      }
    }
    if (!symbol) {
      continue;
    }
    result.push(text.slice(previous, match.index), symbol);
    previous = match.index + label.length;
  }
  result.push(text.slice(previous));
  return result;
}

function LogSymbol({ symbol }: { symbol: Symbol }) {
  const hatch = `hive-log-${useId().replace(/:/g, "")}`;
  const city = symbol.kind === "city",
    large = city && symbol.large;
  const width = large ? 72 : city ? 40 : 32;
  const height = city ? 42 : 32;
  const fill = fills[symbol.color];
  return (
    <span
      role="img"
      aria-label={symbol.label}
      title={symbol.label}
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        lineHeight: 0,
        margin: "0 0.12em",
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={large ? "2.8em" : "1.65em"}
        height="1.7em"
        aria-hidden="true"
        focusable="false"
      >
        {symbol.kind === "bee" ? (
          <image href={HONEYBEE_GOOD_IMAGE} width="32" height="32" />
        ) : city ? (
          <>
            {symbol.color === Good.PURPLE && (
              <defs>
                <pattern
                  id={hatch}
                  width="7"
                  height="7"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(30)"
                >
                  <rect width="7" height="7" fill={fill} />
                  <rect width="3" height="7" fill="#ba8fc2" />
                </pattern>
              </defs>
            )}
            <polygon
              points={
                large
                  ? "2,11 19,1 36,11 53,1 70,11 70,31 53,41 36,31 19,41 2,31"
                  : "20,1 37,11 37,31 20,41 3,31 3,11"
              }
              fill={symbol.color === Good.PURPLE ? `url(#${hatch})` : fill}
              stroke="#948778"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <text
              x={large ? 36 : 20}
              y="22"
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily="Arial, sans-serif"
              fontWeight="bold"
              fontSize="24"
              fill={symbol.light ? "white" : "#181818"}
              stroke={
                !symbol.light && symbol.color === Good.BLACK
                  ? "#f5e9cf"
                  : undefined
              }
              strokeWidth="1.5"
              paintOrder="stroke"
            >
              {symbol.numeral}
            </text>
          </>
        ) : (
          <g
            fill={fill}
            stroke={symbol.color === Good.BLACK ? "#aaa" : "#242021"}
            strokeWidth="1.5"
            strokeLinejoin="round"
          >
            <path d="M3 3 H23 L29 9 V29 H9 L3 23 Z" />
            <path d="M3 23 H23 V3 M23 23 L29 29" fill="none" />
          </g>
        )}
      </svg>
    </span>
  );
}

export function HoneybeeLogText({ text, grid }: { text: string; grid: Grid }) {
  return (
    <>
      {honeybeeLogParts(text, grid).map((part, index) =>
        typeof part === "string" ? (
          part
        ) : (
          <LogSymbol key={index} symbol={part} />
        ),
      )}
    </>
  );
}
