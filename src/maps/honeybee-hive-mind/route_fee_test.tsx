import { DOMINANT_WORKER_BEE } from "./actions";
import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { City } from "../../engine/map/city";
import { Grid } from "../../engine/map/grid";
import { Good } from "../../engine/state/good";
import { Action } from "../../engine/state/action";
import { CityGroup } from "../../engine/state/city_group";
import { SpaceType } from "../../engine/state/location_type";
import { PlayerColor, PlayerData } from "../../engine/state/player";
import { MoveData } from "../../engine/move/move";
import { Rotation } from "../../engine/game/map_settings";
import { coordinatesToCenter } from "../../utils/point";
import { Rotate } from "../../client/components/rotation";
import { HoneybeeHiveMindMapSettings } from "./settings";
import { HoneybeeCity } from "./city_visuals";
import { HoneybeeRouteFee } from "./route_fee";
import { boardCoordinates as c } from "./grid";

const settings = new HoneybeeHiveMindMapSettings();
const grid = Grid.fromData(
  settings,
  settings.startingGrid.map((space, coord) => ({
    ...space,
    goods: coord.equals(c(5, 5))
      ? [Good.YELLOW]
      : coord.equals(c(6, 7))
        ? [Good.YELLOW, Good.YELLOW]
        : [],
  })),
  [],
);
const player = {
  color: PlayerColor.RED,
  selectedAction: Action.FIRST_MOVE,
  money: 13,
  shares: 5,
  locomotive: 4,
  income: 2,
} as PlayerData;
const move: MoveData = {
  startingCity: c(6, 5),
  good: Good.BLUE,
  path: [
    { endingStop: c(5, 5), owner: PlayerColor.RED },
    { endingStop: c(6, 7), owner: PlayerColor.RED },
  ],
};

it("updates the live annotation as a route extends and retracts, and hides it when waived or cleared", () => {
  const render = (route: MoveData, who = player) =>
    renderToStaticMarkup(
      <HoneybeeRouteFee
        grid={grid}
        size={70}
        rotation={Rotation.CLOCKWISE}
        move={route}
        player={who}
        incomeGain={
          route.path.filter((step) => step.owner === who.color).length
        }
      />,
    );
  expect(render({ ...move, path: move.path.slice(0, 1) })).toContain(
    'data-honeybee-route-fee="1"',
  );
  expect(render(move)).toContain('data-honeybee-route-fee="3"');
  expect(render(move)).toContain("Payment/New Expenses: $13 - $3 ");
  expect(render(move)).toContain(
    'fill="#b42318" font-weight="bold">(-$5)</tspan>',
  );
  expect(render({ ...move, path: move.path.slice(0, 1) })).toContain(
    "Payment/New Expenses: $13 - $1 ",
  );
  expect(render({ ...move, path: move.path.slice(0, 1) })).toContain(
    'data-honeybee-route-fee="1"',
  );
  expect(render({ ...move, path: [] })).toBe("");
  expect(
    render({
      ...move,
      path: [{ endingStop: c(6, 6), owner: PlayerColor.RED }],
    }),
  ).toBe("");
  expect(render(move, { ...player, selectedAction: DOMINANT_WORKER_BEE })).toBe(
    "",
  );
  const sharedRoute = {
    ...move,
    path: [move.path[0], { ...move.path[1], owner: PlayerColor.BLUE }],
  };
  expect(render(sharedRoute)).toContain(">(-$6)</tspan>");
  expect(render(move, { ...player, income: 10 })).toContain(
    'fill="#187238" font-weight="bold">(+$3)</tspan>',
  );
  expect(render(move)).not.toMatch(/NaN|Infinity/);
  expect(render(move)).toContain('pointer-events="none"');
});

it("keeps New City letters and bee artwork upright in the holder and on the rotated board", () => {
  const city = new City(c(3, 2), {
    type: SpaceType.CITY,
    name: "",
    color: Good.RED,
    goods: [],
    urbanized: true,
    onRoll: [{ group: CityGroup.WHITE, onRoll: 3, goods: [] }],
  });
  const props = { grid, city, size: 70, clickable: false, highlighted: false };
  const holder = renderToStaticMarkup(<HoneybeeCity {...props} />);
  const placed = renderToStaticMarkup(
    <Rotate rotation={Rotation.CLOCKWISE}>
      <HoneybeeCity {...props} rotation={Rotation.CLOCKWISE} />
    </Rotate>,
  );
  const center = coordinatesToCenter(city.coordinates, 70);
  expect(holder).toContain(">A</text>");
  expect(placed).toContain(">A</text>");
  expect(holder).toContain("city-bee-white.svg");
  expect(placed).toContain("city-bee-white.svg");
  expect(placed).toContain(`rotate(-90 ${center.x} ${center.y})`);
  expect(placed).toContain("rotate(90 )");
});
