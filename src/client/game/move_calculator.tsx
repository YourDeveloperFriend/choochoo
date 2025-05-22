import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { useCallback } from "react";
import { Button } from "semantic-ui-react";
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
import { useIsAdmin } from "../services/me";
import {
  useGrid,
  useInjectedMemo,
  useMePlayer,
} from "../utils/injection_context";
import * as styles from "./move_calculator.module.css";

interface Option {
  route: MoveData;
  income: Map<PlayerColor | undefined, number>;
}

export function MoveCalculator() {
  const grid = useGrid();
  const isAdmin = useIsAdmin();
  const { emit, canEmit } = useAction(MoveAction);
  const searcher = useInjectedMemo(MoveSearcher);
  const moveAction = useInjectedMemo(MoveAction);
  const mePlayer = useMePlayer();
  const [options, setOptions] = useGameVersionState<Option[] | undefined>(
    undefined,
  );

  const calculateRoutes = useCallback(() => {
    const startTimeStart = performance.now();

    const allRoutes: Option[] = searcher.value
      .findAllRoutes(mePlayer ?? ({ locomotive: 6 } as PlayerData))
      .map((route) => ({
        route,
        income: moveAction.value.calculateIncome(route),
      }));
    console.log("counter", Math.floor(performance.now() - startTimeStart));
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
  }, [searcher, moveAction, setOptions, mePlayer]);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h2">Move Calculator</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div>
          {options == null && (
            <Button onClick={calculateRoutes}>Calculate Moves</Button>
          )}
          {options != null && options.length > 0 && (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Starting City</th>
                  <th>Good</th>
                  <th>Destination City</th>
                  <th>Income</th>
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
                    {canEmit && (
                      <td>
                        <Button onClick={() => emit(option.route)}>
                          Move good
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {options != null && options.length === 0 && <p>No moves available</p>}
          {options == null && (
            <p>
              Click &quot;calculate&quot; to see available moves (this might
              take ~30 seconds).
            </p>
          )}
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
