import { useState } from "react";
import { Button } from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { getPlayerColorCss } from "../../client/components/player_color";
import { useUserUnsuspended } from "../../client/services/user";
import { useGame } from "../../client/services/game";
import { GameStatus } from "../../api/game";
import { getRowList, RowProps } from "../../client/game/final_overview_row";
import { GoodBlock } from "../../client/grid/good_block";
import { useAction, useEmptyAction } from "../../client/services/action";
import {
  useActiveGameState,
  useGrid,
  useInjectedState,
  useInject,
} from "../../client/utils/injection_context";
import { ROUND } from "../../engine/game/round";
import { injectAllPlayersUnsafe } from "../../engine/game/state";
import { Rotation } from "../../engine/game/map_settings";
import { PassAction } from "../../engine/goods_growth/pass";
import { ActionNamingProvider } from "../../engine/state/action";
import { allGoods, Good, goodToString } from "../../engine/state/good";
import { Phase } from "../../engine/state/phase";
import { PlayerData, playerColorToString } from "../../engine/state/player";
import {
  CityGoodsProps,
  MapViewSettings,
  TexturesProps,
} from "../view_settings";
import {
  Fac51City,
  Fac51Town,
  Fac51FactoryBoard,
  FACTORY_FLOOR,
} from "./graphics";
import { BLOCKED_ACTIONS } from "./actions";
import { ChangeDeliveryAction } from "./goods_growth";
import { Fac51MoveInterceptModal } from "./move_intercept_modal";
import { Fac51Rules } from "./rules";
import { Fac51MapSettings } from "./settings";
import * as factoryStyles from "./factory.module.css";
import {
  DELIVERY_SPACES,
  isDelivery,
  MANIFEST,
  MANIFEST_PENALTIES,
} from "./state";

export class Fac51ViewSettings
  extends Fac51MapSettings
  implements MapViewSettings
{
  getMapRules = Fac51Rules;
  hideImplementerCredit = true;
  hideRiverEditor = true;
  spaceAfterMapHeader = true;
  playerCountNote = (
    <>
      Map 3 of the AoSUK - for more info visit{" "}
      <a href="https://www.ageofsteamuk.com">www.ageofsteamuk.com</a>
    </>
  );
  renderCity = Fac51City;
  renderTown = Fac51Town;
  renderCityGoods = Fac51CityGoods;
  additionalSliders = [ManifestChart];
  moveInterceptModal = Fac51MoveInterceptModal;

  getLandFill() {
    return FACTORY_FLOOR;
  }

  getTexturesLayer(props: TexturesProps) {
    return <Fac51FactoryBoard {...props} />;
  }

  // The existing move calculator uses this hook to open a map's confirmation.
  // FAC51 has no cash fee; the modal reviews Manifest points instead.
  getMoveCost() {
    return 0;
  }

  getActionSummary(phase: Phase | undefined) {
    return phase === Phase.GOODS_GROWTH ? DeliveryProduction : undefined;
  }

  getPlayerStatColumns() {
    return [{ header: "Manifest", cell: ManifestCell }];
  }

  getFinalOverviewRows() {
    const rows = getRowList();
    rows.splice(6, 0, ManifestPoints);
    return rows;
  }

  moveGoodsMessage() {
    return "Start from a Deliveries marker. Continuing through a station missing your colour costs one Manifest level; stations already holding it are free to pass.";
  }
}

function Fac51CityGoods({
  city,
  center,
  size,
  rotation,
  clickable,
  selectedGood,
}: CityGoodsProps) {
  return (
    <g pointerEvents={isDelivery(city) ? undefined : "none"}>
      {city.getGoods().map((good, index) => (
        <GoodBlock
          key={`${good}-${index}`}
          good={good}
          offset={index}
          goodsCount={city.getGoods().length}
          center={
            rotation === Rotation.COUNTER_CLOCKWISE
              ? {
                  x: center.x - size * (isDelivery(city) ? 0.3 : 0.18),
                  y: center.y,
                }
              : rotation === Rotation.CLOCKWISE
                ? {
                    x: center.x + size * (isDelivery(city) ? 0.3 : 0.18),
                    y: center.y,
                  }
                : {
                    x: center.x,
                    y: center.y + size * (isDelivery(city) ? 0.3 : 0.18),
                  }
          }
          size={size}
          coordinates={city.coordinates}
          rotation={rotation}
          clickable={clickable && isDelivery(city)}
          highlighted={
            selectedGood?.coordinates === city.coordinates &&
            selectedGood.good === good
          }
        />
      ))}
    </g>
  );
}

function ManifestCell({ player }: { player: PlayerData }) {
  const levels = useInjectedState(MANIFEST);
  const level = levels.get(player.color) ?? 0;
  return (
    <span>
      {level}/6 (−{MANIFEST_PENALTIES[level]} VP)
    </span>
  );
}

function ManifestPoints({ players }: RowProps) {
  const levels = useInjectedState(MANIFEST);
  return (
    <tr>
      <th>Manifest penalty</th>
      {players.map(({ player }) => (
        <td key={player.playerId}>
          {-MANIFEST_PENALTIES[levels.get(player.color) ?? 0]}
        </td>
      ))}
    </tr>
  );
}

function ManifestChart() {
  const game = useGame();
  const round = useActiveGameState(ROUND);
  const levels = useInjectedState(MANIFEST);
  const players = useInject(() => injectAllPlayersUnsafe()(), []);
  return (
    <div className={factoryStyles.manifestPanel}>
      <h3 className={factoryStyles.manifestHeading}>Manifest</h3>
      <p className={factoryStyles.roundStatus}>
        {game.status === GameStatus.enum.ENDED
          ? "Game finished"
          : round == null
            ? "Seven-round action conveyor"
            : `Round ${round} of 7 · Blocked: ${new ActionNamingProvider().getActionString(BLOCKED_ACTIONS[round - 1])}`}
      </p>
      <table className={factoryStyles.manifestTable}>
        <thead>
          <tr>
            <th>Skipped stations</th>
            <th>Player discs</th>
            <th>Final VP penalty</th>
          </tr>
        </thead>
        <tbody>
          {MANIFEST_PENALTIES.map((penalty, level) => (
            <tr key={level}>
              <td>{level}</td>
              <td>
                <div className={factoryStyles.manifestDiscs}>
                  {players
                    .filter(
                      (player) => (levels.get(player.color) ?? 0) === level,
                    )
                    .map((player) => (
                      <ManifestDisc
                        key={player.playerId}
                        player={player}
                        level={level}
                      />
                    ))}
                </div>
              </td>
              <td>{-penalty}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Discs show each player’s current Manifest level. Hover over a disc to
        see the player’s name. Delivery cubes rotate clockwise after Production.
      </p>
    </div>
  );
}

function ManifestDisc({
  player,
  level,
}: {
  player: PlayerData;
  level: number;
}) {
  const { data } = useUserUnsuspended(player.playerId);
  const name =
    data?.body.user.username ?? `${playerColorToString(player.color)} player`;
  const label = `${name}${player.outOfGame ? " (Eliminated)" : ""}: Manifest ${level}, −${MANIFEST_PENALTIES[level]} VP`;
  return (
    <span className={getPlayerColorCss(player.color)} title={label}>
      <svg
        className={`${factoryStyles.manifestDisc} ${player.outOfGame ? factoryStyles.eliminatedDisc : ""}`}
        viewBox="0 0 28 28"
        role="img"
        aria-label={label}
      >
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="currentColor"
          stroke="#242825"
          strokeWidth="1.5"
        />
        <circle
          cx="14"
          cy="14"
          r="9"
          fill="none"
          stroke="white"
          strokeOpacity="0.35"
        />
        {player.outOfGame && (
          <path d="M 8 8 L 20 20 M 20 8 L 8 20" stroke="#fff" strokeWidth="2" />
        )}
      </svg>
    </span>
  );
}

function DeliveryProduction() {
  const grid = useGrid();
  const { emit, canEmit, canEmitUserId, isPending } =
    useAction(ChangeDeliveryAction);
  const { emit: pass, isPending: passing } = useEmptyAction(PassAction);
  const [selected, setSelected] = useState<Good>(Good.BLUE);
  if (canEmitUserId == null) {
    return <></>;
  }
  if (!canEmit) {
    return (
      <p>
        <Username userId={canEmitUserId} /> may replace a duplicated delivery
        marker.
      </p>
    );
  }
  const duplicated = DELIVERY_SPACES.filter((coordinates) => {
    const good = grid.get(coordinates)!.getGoods()[0];
    return (
      DELIVERY_SPACES.filter((other) => grid.get(other)!.getGoods()[0] === good)
        .length === 2
    );
  });
  return (
    <div>
      <p>
        Optionally replace either duplicated marker with a different colour. All
        markers then rotate clockwise.
      </p>
      <label>
        New colour:{" "}
        <select
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value) as Good)}
        >
          {[...allGoods].map((good) => (
            <option key={good} value={good}>
              {goodToString(good)}
            </option>
          ))}
        </select>
      </label>
      <div>
        {duplicated.map((coordinates) => (
          <Button
            key={coordinates.serialize()}
            disabled={
              isPending ||
              passing ||
              grid.get(coordinates)!.getGoods()[0] === selected
            }
            onClick={() => emit({ coordinates, good: selected })}
          >
            Replace {grid.get(coordinates)!.name()} (
            {goodToString(grid.get(coordinates)!.getGoods()[0])})
          </Button>
        ))}
        <Button disabled={isPending || passing} onClick={pass}>
          Keep colours
        </Button>
      </div>
    </div>
  );
}
