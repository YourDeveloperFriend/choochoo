import { beforeEach, expect, it, vi } from "vitest";
import { useContext } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Grid } from "../../engine/map/grid";
import { Good } from "../../engine/state/good";
import { ClickTarget } from "../../client/grid/click_target";
import { HoneybeeHiveMindMapSettings } from "./settings";
import { boardCoordinates as c } from "./grid";
import { useWaggleMapClick } from "./waggle_view";
import {
  scopedWaggleDraft,
  useWaggleDraft,
  WagglePreviewContext,
  WagglePreviewProvider,
} from "./waggle_preview";

const hooks = vi.hoisted(() => ({
  useAction: vi.fn(),
  useGame: vi.fn(),
  useGrid: vi.fn(),
}));
vi.mock("../../client/services/action", () => ({ useAction: hooks.useAction }));
vi.mock("../../client/services/game", () => ({ useGame: hooks.useGame }));
vi.mock("../../client/utils/injection_context", () => ({
  useGrid: hooks.useGrid,
}));

const settings = new HoneybeeHiveMindMapSettings();
const grid = Grid.fromData(
  settings,
  settings.startingGrid.map((space) => ({ ...space, goods: [Good.YELLOW] })),
  settings.interCityConnections,
);
const setData = vi.fn();
const move = { from: c(5, 5), to: c(6, 6) };
const saved = { gameId: 6, version: 12, moves: [move] };
let pending = false;
beforeEach(() => {
  vi.clearAllMocks();
  pending = false;
  hooks.useGame.mockReturnValue({ id: 6, version: 12 });
  hooks.useGrid.mockReturnValue(grid);
  hooks.useAction.mockImplementation(() => ({
    data: saved,
    setData,
    canEmit: true,
    isPending: pending,
    emit: vi.fn(),
    getErrorMessage: () => undefined,
  }));
});

it("discards drafts from another game even at the same version, and from older versions", () => {
  expect(scopedWaggleDraft(saved, 6, 12)).toBe(saved);
  expect(scopedWaggleDraft(saved, 7, 12)).toEqual({});
  expect(scopedWaggleDraft(saved, 6, 13)).toEqual({});
  expect(scopedWaggleDraft({ version: 12, moves: [move] }, 6, 12)).toEqual({});
});

it("shares one action handler across consumers and stamps draft edits with their game", () => {
  const states: ReturnType<typeof useWaggleDraft>[] = [];
  function Consumer() {
    states.push(useWaggleDraft());
    return null;
  }
  renderToStaticMarkup(
    <WagglePreviewProvider>
      <Consumer />
      <Consumer />
      <Consumer />
    </WagglePreviewProvider>,
  );
  expect(hooks.useAction).toHaveBeenCalledTimes(1);
  expect(states[1]).toBe(states[0]);
  expect(states[2]).toBe(states[0]);
  states[0].setDraft({ moves: [] });
  expect(setData).toHaveBeenCalledWith({ gameId: 6, version: 12, moves: [] });
});

it("blocks draft edits and map interactions throughout the shared pending request", () => {
  pending = true;
  hooks.useAction.mockImplementation(() => ({
    data: { ...saved, source: c(5, 5) },
    setData,
    canEmit: true,
    isPending: pending,
  }));
  const register = vi.fn();
  let state: ReturnType<typeof useWaggleDraft> | undefined;
  function Consumer() {
    state = useWaggleDraft();
    expect(useWaggleMapClick(register)).toBe(true);
    expect(useContext(WagglePreviewContext).selectBee).toBeUndefined();
    return null;
  }
  renderToStaticMarkup(
    <WagglePreviewProvider>
      <Consumer />
    </WagglePreviewProvider>,
  );
  expect(hooks.useAction).toHaveBeenCalledTimes(1);
  expect(register).not.toHaveBeenCalledWith(
    ClickTarget.CITY,
    expect.anything(),
  );
  state!.setDraft({ moves: [] });
  expect(setData).not.toHaveBeenCalled();
});
