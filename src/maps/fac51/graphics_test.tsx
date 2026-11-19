import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Grid } from "../../engine/map/grid";
import { Fac51MapSettings } from "./settings";
import { Fac51FactoryBoard, rotationGeometry } from "./graphics";
import { DELIVERY_SPACES } from "./state";

it("draws six arrows to the exact next supply spaces used by goods rotation", () => {
  const settings = new Fac51MapSettings();
  const grid = Grid.fromData(settings, settings.startingGrid, []);
  const geometry = rotationGeometry(grid, 70)!;
  expect(geometry.arcs).toHaveLength(6);
  for (const [index, arc] of geometry.arcs.entries()) {
    expect(arc.from).toBe(DELIVERY_SPACES[index]);
    expect(arc.to).toBe(DELIVERY_SPACES[(index + 1) % 6]);
    expect(arc.path).toContain("0 0 1");
  }
  const svg = renderToStaticMarkup(
    <svg>
      <Fac51FactoryBoard grid={grid} size={70} rotation={settings.rotation} />
    </svg>,
  );
  expect(svg.match(/data-rotation-from=/g)).toHaveLength(6);
  expect(svg).toContain("one space after each round");
});
