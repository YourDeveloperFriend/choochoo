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
import { PlayerColor, playerColorToString } from "../../engine/state/player";
import { peek } from "../../utils/functions";
import { useAction } from "../services/action";
import { useGameVersionState } from "../services/game";
import { useIsAdmin } from "../services/me";
import {
  useGrid,
  useInjectedMemo,
  useMePlayer,
} from "../utils/injection_context";

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

  const handleClick = useCallback(() => {
    const allRoutes: Option[] = searcher.value.findAllRoutes().map((route) => ({
      route,
      income: moveAction.value.calculateIncome(route),
    }));
    allRoutes.sort((a, b) => {
      if (mePlayer == null) {
        return (
          [...a.income.values()].reduce((a, b) => a + b, 0) -
          [...b.income.values()].reduce((a, b) => a + b, 0)
        );
      }
      return (
        (a.income.get(mePlayer.color) ?? 0) -
        (b.income.get(mePlayer.color) ?? 0)
      );
    });
    setOptions(allRoutes);
  }, [searcher, moveAction, setOptions, mePlayer]);

  if (!isAdmin) {
    return <></>;
  }

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h2">Move Calculator</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div>
          <Button onClick={handleClick}>Calculate Moves</Button>
          {options != null && options.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Good</th>
                  <th>Starting City</th>
                  <th>Destination City</th>
                  <th>Income</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {options.map((option, index) => (
                  <tr key={index}>
                    <td>{goodToString(option.route.good)}</td>
                    <td>{grid.displayName(option.route.startingCity)}</td>
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
                    <td>
                      {canEmit && (
                        <Button onClick={() => emit(option.route)}>
                          Move good
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {options != null && options.length === 0 && <p>No moves available</p>}
          {options == null && (
            <p>Click &quot;calculate&quot; to see available moves</p>
          )}
        </div>
      </AccordionDetails>
    </Accordion>
  );
}
