import { useCallback, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Button,
  Menu,
  MenuItem,
} from "semantic-ui-react";
import { MoveAction, MoveData } from "../../engine/move/move";
import { MoveSearcher } from "../../engine/move/searcher";
import { goodToString } from "../../engine/state/good";
import {
  PlayerColor,
  playerColorToString,
  PlayerData,
} from "../../engine/state/player";
import { peek } from "../../utils/functions";
import { useAction } from "../services/action";
import { useGameVersionState } from "../services/game";
import {
  useGrid,
  useInjectedMemo,
  useMePlayer,
  useViewSettings,
} from "../utils/injection_context";
import * as styles from "./move_calculator.module.css";

interface Option {
  route: MoveData;
  income: Map<PlayerColor | undefined, number>;
}

export function MoveCalculator() {
  const grid = useGrid();
  const viewSettings = useViewSettings();
  const [pendingMove, setPendingMove] = useState<MoveData>();
  const { emit, canEmit } = useAction(MoveAction);
  const searcher = useInjectedMemo(MoveSearcher);
  const moveAction = useInjectedMemo(MoveAction);
  const mePlayer = useMePlayer();
  const FeeModal = viewSettings.getMoveCost
    ? viewSettings.moveInterceptModal
    : undefined;
  const [options, setOptions] = useGameVersionState<Option[] | undefined>(
    undefined,
  );
  const [expanded, setExpanded] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);

  const calculateRoutes = useCallback(() => {
    const allRoutes: Option[] = searcher.value
      .findAllRoutes(
        mePlayer ?? ({ locomotive: 6, money: Infinity } as PlayerData),
      )
      .map((route) => ({
        route,
        income: moveAction.value.calculateIncome(route),
      }));
    allRoutes.sort((a, b) => {
      const totalSum =
        [...b.income.values()].reduce((a, b) => a + b, 0) -
        [...a.income.values()].reduce((a, b) => a + b, 0);
      if (mePlayer == null) {
        return totalSum;
      }
      const result1 =
        (b.income.get(mePlayer.color) ?? 0) -
        (a.income.get(mePlayer.color) ?? 0);
      if (result1 !== 0) {
        return result1;
      }
      return -totalSum;
    });
    setOptions(allRoutes);
    setRunning(false);
  }, [searcher, moveAction, setOptions, mePlayer, setRunning]);

  return (
    <Accordion as={Menu} vertical fluid>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Move Calculator"
        />
        <AccordionContent active={expanded}>
          <div>
            {options == null && (
              <>
                <Button
                  color="green"
                  loading={running}
                  disabled={running}
                  onClick={() => {
                    setRunning(true);
                    setTimeout(calculateRoutes, 0);
                  }}
                >
                  Calculate Moves
                </Button>
                <p>
                  Click &quot;calculate&quot; to see available moves (this might
                  take ~30 seconds).
                </p>
              </>
            )}
            {options != null && options.length > 0 && (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Starting City</th>
                    <th>Good</th>
                    <th>Destination City</th>
                    <th>Income</th>
                    {viewSettings.getMoveCost && <th>Cash fee</th>}
                    {canEmit && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {options.map((option, index) => (
                    <tr key={index}>
                      <td>{grid.displayName(option.route.startingCity)}</td>
                      <td>{goodToString(option.route.good)}</td>
                      <td>
                        {grid.displayName(peek(option.route.path).endingStop)}
                      </td>
                      <td>
                        {[...option.income].map(([playerColor, income]) => (
                          <p key={playerColor}>
                            {playerColorToString(playerColor)}: {income}
                          </p>
                        ))}
                      </td>
                      {viewSettings.getMoveCost && (
                        <td>
                          $
                          {viewSettings.getMoveCost(
                            grid,
                            mePlayer ?? ({ money: Infinity } as PlayerData),
                            option.route,
                          )}
                        </td>
                      )}
                      {canEmit && (
                        <td>
                          <Button
                            onClick={() =>
                              FeeModal
                                ? setPendingMove(option.route)
                                : emit(option.route)
                            }
                          >
                            Move good
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {options != null && options.length === 0 && (
              <p>No moves available</p>
            )}
          </div>
        </AccordionContent>
      </MenuItem>
      {FeeModal && (
        <FeeModal
          moveData={pendingMove}
          cityName={
            pendingMove
              ? grid.displayName(peek(pendingMove.path).endingStop)
              : undefined
          }
          clearMoveData={() => setPendingMove(undefined)}
        />
      )}
    </Accordion>
  );
}
