import { useId } from "react";
import { Rotate } from "../../client/components/rotation";
import { FloatingGoodBlock } from "../../client/grid/good_block";
import * as gridStyles from "../../client/grid/hex_grid.module.css";
import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { Land } from "../../engine/map/location";
import { CityGroup, toLetter } from "../../engine/state/city_group";
import { Good, goodToString } from "../../engine/state/good";
import { SpaceType } from "../../engine/state/location_type";
import { getCorners, polygon } from "../../utils/point";
import {
  CityGoodsProps,
  CityVisualProps,
  TownVisualProps,
} from "../view_settings";
import { MOSCOW } from "./grid";

const COLORS: Record<Good, string> = {
  [Good.BLUE]: "#00a2d3",
  [Good.BLACK]: "#444444",
  [Good.RED]: "#d41e2d",
  [Good.PURPLE]: "#8d5a95",
  [Good.YELLOW]: "#f5ac11",
  [Good.WHITE]: "#e9dcc9",
};

// The printed board's labels, including spellings in older saved games.
const PRINTED_NAMES: Record<string, string> = {
  "St Petersburg": "Leningrad",
  Kyiv: "Kiev",
  Kharkiv: "Kharkov",
  Kazan: "Nizhny Novgorod",
  Cherkasy: "Cherkassy",
  Oryol: "Kursk",
  Zaporizhzhia: "Dnipropetrovsk",
  Sloviansk: "Slavyansk",
  Syktyvkar: "Solvychegodsk",
};

const CYRILLIC: Record<string, string> = {
  Leningrad: "Ленинград",
  Arkhangelsk: "Архангельск",
  Minsk: "Минск",
  "Nizhny Novgorod": "Нижний Новгород",
  Tula: "Тула",
  Ulyanovsk: "Ульяновск",
  Kiev: "Киев",
  Tambov: "Тамбов",
  Kharkov: "Харьков",
  Stalingrad: "Сталинград",
  Odessa: "Одесса",
  Mariupol: "Мариуполь",
  Pskov: "Псков",
  Tikhvin: "Тихвин",
  Solvychegodsk: "Сольвычегодск",
  Vologda: "Вологда",
  Kalinin: "Калинин",
  Vitebsk: "Витебск",
  Murom: "Муром",
  Smolensk: "Смоленск",
  Ryazan: "Рязань",
  Gomel: "Гомель",
  Kursk: "Курск",
  Voronezh: "Воронеж",
  Balashov: "Балашов",
  Cherkassy: "Черкассы",
  Slavyansk: "Славянск",
  Uman: "Умань",
  Dnipropetrovsk: "Днепропетровск",
  Shakhty: "Шахты",
};

export function stalinistLandFill(space: Land): string | undefined {
  switch (space.getLandType()) {
    case SpaceType.PLAIN:
      return "#bba77f";
    case SpaceType.RIVER:
      return "#ae9b76";
    case SpaceType.WATER:
      return "#80b7e3";
    default:
      return undefined;
  }
}

function printedName(name: string): string {
  return PRINTED_NAMES[name] ?? name;
}

function cityLabel(city: City): string {
  const roll = city.onRoll()[0];
  return roll
    ? city.isUrbanized()
      ? toLetter(roll)
      : String(roll.onRoll)
    : "";
}

// Same purple base, lighter stripe, spacing and angle as Honeybee Hive Mind.
function PurpleStripes({
  id,
  size,
  rotation,
}: {
  id: string;
  size: number;
  rotation?: Rotation;
}) {
  return (
    <defs>
      <pattern
        id={id}
        patternUnits="userSpaceOnUse"
        width={size * 0.18}
        height={size * 0.18}
        patternTransform={`rotate(${rotation === Rotation.CLOCKWISE ? -60 : rotation === Rotation.COUNTER_CLOCKWISE ? 120 : 30})`}
      >
        <rect
          width={size * 0.18}
          height={size * 0.18}
          fill={COLORS[Good.PURPLE]}
        />
        <rect width={size * 0.075} height={size * 0.18} fill="#ba8fc2" />
      </pattern>
    </defs>
  );
}

export function StalinistCity({
  city,
  center,
  size,
  rotation,
  clickable,
}: CityVisualProps) {
  const hatchId = `stalin-city-${useId().replace(/:/g, "")}`;
  const moscow = city.name() === MOSCOW;
  const name = printedName(city.name());
  const label = cityLabel(city);
  const light = city.group() === CityGroup.WHITE;
  const purple = city.accepts(Good.PURPLE);
  const blackCity = city.accepts(Good.BLACK);
  const color = moscow
    ? "#ffffff"
    : (COLORS[city.goodColors()[0]] ?? "#ffffff");
  const ink =
    city.accepts(Good.BLACK) || city.accepts(Good.PURPLE)
      ? "#ffffff"
      : "#171717";
  const skylineBottom = 0.12;
  const title = name || `New City ${label}`;
  const splitName = name === "Nizhny Novgorod";
  const unplaced = name.length === 0;
  const twoRows = city.getGoods().length > 5;
  const badgeTop = twoRows ? 0.57 : 0.36;
  const badgeHeight = twoRows ? 0.27 : 0.44;

  return (
    <>
      {purple && <PurpleStripes id={hatchId} size={size} rotation={rotation} />}
      <polygon
        points={polygon(getCorners(center, size))}
        fill={purple ? `url(#${hatchId})` : color}
        stroke="#554d40"
        strokeWidth={size * 0.012}
        className={clickable ? gridStyles.clickable : undefined}
        data-coordinates={city.coordinates.serialize()}
        data-stalin-city={title}
      >
        <title>
          {title}
          {moscow
            ? " — Central Exchange"
            : ` — ${light ? "white" : "black"} goods growth ${label}`}
        </title>
      </polygon>
      <Rotate rotation={rotation} center={center} reverse>
        <g
          transform={`translate(${center.x} ${center.y})`}
          pointerEvents="none"
          fontFamily="Arial, sans-serif"
          textAnchor="middle"
        >
          {unplaced ? (
            <text
              y={size * 0.1}
              dominantBaseline="central"
              fontSize={size * 1.5}
              fontWeight="700"
              fill={ink}
              stroke={purple ? "#3d2146" : undefined}
              strokeWidth={purple ? size * 0.035 : undefined}
              strokeLinejoin="round"
              paintOrder="stroke"
              data-unplaced-city-letter={label}
            >
              {label}
            </text>
          ) : (
            <text
              y={size * (splitName ? -0.67 : -0.57)}
              fontSize={
                size *
                (!name
                  ? 0.38
                  : splitName
                    ? 0.19
                    : Math.min(0.22, 1.3 / (title.length * 0.62)))
              }
              fontWeight="700"
              fill={moscow ? "#171717" : ink}
              stroke={purple ? "#3d2146" : undefined}
              strokeWidth={purple ? size * 0.035 : undefined}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {splitName ? (
                <>
                  <tspan x="0">Nizhny</tspan>
                  <tspan x="0" dy={size * 0.2}>
                    Novgorod
                  </tspan>
                </>
              ) : (
                name || label
              )}
            </text>
          )}
          {unplaced ? null : moscow ? (
            <>
              <image
                href="/static/maps/stalinist-russia/moscow.svg"
                x={-size * 0.22}
                y={-size * 0.49}
                width={size * 0.44}
                height={size * 0.64}
              />
              <text y={size * 0.25} fontSize={size * 0.17} fill="#171717">
                Москва
              </text>
            </>
          ) : (
            <>
              <image
                href="/static/maps/stalinist-russia/cityscape.svg"
                style={blackCity ? { filter: "invert(1)" } : undefined}
                x={-size * 0.66}
                y={size * -0.4}
                width={size * 1.32}
                height={size * (skylineBottom + 0.4)}
                preserveAspectRatio="none"
              />
              {CYRILLIC[name] && (
                <rect
                  x={-size * 0.66}
                  y={size * (skylineBottom - 0.16)}
                  width={size * 1.32}
                  height={size * 0.16}
                  fill={blackCity ? "#ffffff" : "#000000"}
                />
              )}
              {CYRILLIC[name] && (
                <text
                  y={size * (skylineBottom - 0.035)}
                  fontSize={size * (name === "Nizhny Novgorod" ? 0.115 : 0.14)}
                  fill={blackCity ? "#171717" : "#ffffff"}
                >
                  {CYRILLIC[name]}
                </text>
              )}
              <rect
                x={-size * 0.25}
                y={size * badgeTop}
                width={size * 0.5}
                height={size * badgeHeight}
                fill={light ? "#ffffff" : "#222222"}
                stroke={light ? "#222222" : "#ffffff"}
                strokeWidth={size * 0.012}
              />
              <text
                y={size * (badgeTop + badgeHeight / 2 + 0.015)}
                dominantBaseline="middle"
                fontSize={size * (twoRows ? 0.27 : 0.38)}
                fontWeight="700"
                fill={light ? "#171717" : "#ffffff"}
              >
                {label}
              </text>
            </>
          )}
        </g>
      </Rotate>
    </>
  );
}

export function StalinistTown({
  town,
  center,
  size,
  rotation,
}: TownVisualProps) {
  const name = printedName(town.name() ?? "");
  return (
    <Rotate rotation={rotation} center={center} reverse>
      <g
        transform={`translate(${center.x} ${center.y})`}
        pointerEvents="none"
        fontFamily="Arial, sans-serif"
        textAnchor="middle"
        fill="#171717"
        data-stalin-town={name}
      >
        <circle r={size * 0.34} fill="#ffffff" />
        <image
          href="/static/maps/stalinist-russia/town-star.svg"
          x={-size * 0.305}
          y={-size * 0.305}
          width={size * 0.61}
          height={size * 0.61}
        />
        <text
          y={size * 0.53}
          fontSize={size * (name.length > 12 ? 0.145 : 0.18)}
          fontWeight="700"
          stroke={stalinistLandFill(town)}
          strokeWidth={size * 0.035}
          paintOrder="stroke"
        >
          {name}
        </text>
        {CYRILLIC[name] && (
          <text
            y={size * 0.71}
            fontSize={size * 0.145}
            fontWeight="400"
            stroke={stalinistLandFill(town)}
            strokeWidth={size * 0.025}
            paintOrder="stroke"
          >
            {CYRILLIC[name]}
          </text>
        )}
      </g>
    </Rotate>
  );
}

const MOSCOW_SLOTS = [
  { good: Good.BLACK, x: -0.32, y: 0.41 },
  { good: Good.BLUE, x: 0, y: 0.41 },
  { good: Good.YELLOW, x: 0.32, y: 0.41 },
  { good: Good.RED, x: -0.16, y: 0.68 },
  { good: Good.PURPLE, x: 0.16, y: 0.68 },
];

export function StalinistCityGoods({
  city,
  center,
  size,
  rotation,
  clickable,
  selectedGood,
}: CityGoodsProps) {
  const hatchId = `stalin-slot-${useId().replace(/:/g, "")}`;
  const goods = city.getGoods();
  const selected = selectedGood?.coordinates.equals(city.coordinates)
    ? selectedGood.good
    : undefined;

  return (
    <Rotate rotation={rotation} center={center} reverse>
      {city.name() === MOSCOW ? (
        <>
          <PurpleStripes id={hatchId} size={size * 0.4} />
          {MOSCOW_SLOTS.map(({ good, x, y }) => {
            const occupied = goods.includes(good);
            const position = { x: center.x + size * x, y: center.y + size * y };
            return (
              <g key={good} data-moscow-slot={good} data-occupied={occupied}>
                <title>{`${goodToString(good)} space — ${occupied ? "occupied" : "empty"}`}</title>
                <rect
                  x={position.x - size * 0.105}
                  y={position.y - size * 0.105}
                  width={size * 0.21}
                  height={size * 0.21}
                  fill="#c9c5c0"
                  pointerEvents="none"
                />
                <rect
                  x={position.x - size * 0.105}
                  y={position.y - size * 0.105}
                  width={size * 0.21}
                  height={size * 0.21}
                  fill={
                    good === Good.PURPLE ? `url(#${hatchId})` : COLORS[good]
                  }
                  fillOpacity={occupied ? 0.18 : 0.5}
                  stroke="#171717"
                  strokeWidth={size * 0.012}
                  pointerEvents="none"
                />
                {occupied && (
                  <FloatingGoodBlock
                    good={good}
                    coordinates={city.coordinates}
                    center={{
                      x: position.x - size * 0.0375,
                      y: position.y - size * 0.0375,
                    }}
                    size={size * 0.75}
                    highlighted={selected === good}
                    clickable={clickable}
                  />
                )}
              </g>
            );
          })}
        </>
      ) : (
        goods.map((good, index) => {
          const row = Math.floor(index / 5);
          const count = Math.min(5, goods.length - row * 5);
          // Match the standard GoodBlock cube size, horizontal overlap and
          // half-hex row spacing; move the rows below the English city name.
          const side = 1 / 3;
          const spacing = side * 0.75;
          const unplaced = city.name().length === 0;
          const y =
            (unplaced ? -0.61 : goods.length > 5 ? -0.15 : 0.11) + row * 0.5;
          return (
            <FloatingGoodBlock
              key={index}
              good={good}
              coordinates={city.coordinates}
              center={{
                x:
                  center.x +
                  size *
                    (((index % 5) - (count - 1) / 2) * spacing - side * 0.15),
                y: center.y + size * (y - side * 0.15),
              }}
              size={size}
              highlighted={selected === good && goods.indexOf(good) === index}
              clickable={clickable}
            />
          );
        })
      )}
    </Rotate>
  );
}
