import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { MapInfo } from "../../client/game/map_info";
import { ReleaseStage } from "../../engine/game/map_settings";
import { Fac51ViewSettings } from "./view_settings";

vi.mock("../../client/services/environment", () => ({
  environment: { stage: "test", apiHost: "", socketHost: "localhost" },
}));
vi.mock("../../client/services/client", () => ({ tsr: {} }));

vi.mock("../../client/components/username", () => ({
  Username: () => <span>Implementation user</span>,
}));

it("shows FAC51's series link after its player count without implementation or development labels", () => {
  const html = renderToStaticMarkup(<MapInfo gameKey="fac51" variant={{}} />);
  expect(html).not.toContain("Choo Choo Games implementation by:");
  expect(html).toContain('href="https://www.ageofsteamuk.com"');
  expect(html.indexOf("Map 3 of the AoSUK")).toBeGreaterThan(
    html.indexOf("Supports:"),
  );
  expect(html.indexOf("Map 3 of the AoSUK")).toBeLessThan(
    html.indexOf("Designer:"),
  );
  const settings = new Fac51ViewSettings();
  expect(settings.stage).toBe(ReleaseStage.PRODUCTION);
  expect(settings.hideRiverEditor).toBe(true);
});

it("keeps implementation credits and existing details on other maps", () => {
  const html = renderToStaticMarkup(
    <MapInfo gameKey="rust-belt" variant={{}} />,
  );
  expect(html).toContain("Choo Choo Games implementation by:");
  expect(html).toContain("Implementation user");
  expect(html).not.toContain("Map 3 of the AoSUK");
});
