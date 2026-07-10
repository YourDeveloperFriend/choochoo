import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { Username } from "../../client/components/username";
import { GenericMessage } from "../../client/game/action_summary";
import { useAction, useEmptyAction } from "../../client/services/action";
import {
  useCurrentPlayer,
  useInjectedState,
} from "../../client/utils/injection_context";
import { ROUND } from "../../engine/game/round";
import { LocoAdvanceAction, LocoSkipAction } from "./locomotive_phase";
import { LOCO_TRACK } from "./state";
import {
  costToAdvanceInto,
  describeBox,
  LocoRow,
  MAX_LOCO_BOX,
} from "./track_data";

export function StalinistRussiaLocomotiveSummary() {
  const {
    canEmit,
    canEmitUserId,
    emit: emitAdvance,
    isPending: advancePending,
  } = useAction(LocoAdvanceAction);
  const { emit: emitSkip, isPending: skipPending } =
    useEmptyAction(LocoSkipAction);

  const currentPlayer = useCurrentPlayer();
  const round = useInjectedState(ROUND);
  const locoTrack = useInjectedState(LOCO_TRACK);

  const isPending = advancePending || skipPending;

  if (canEmitUserId == null) {
    return <></>;
  }

  if (!canEmit || currentPlayer == null) {
    return (
      <GenericMessage>
        <Username userId={canEmitUserId} /> may advance on the locomotive track.
      </GenericMessage>
    );
  }

  const currentPosition = locoTrack.get(currentPlayer.color) ?? {
    box: 0,
    row: LocoRow.MANY,
  };
  const currentBox = currentPosition.box;
  const money = currentPlayer.money;

  const occupiedSingleBoxes = new Set<number>();
  for (const [color, position] of locoTrack) {
    if (position.row === LocoRow.SINGLE && color != null) {
      occupiedSingleBoxes.add(position.box);
    }
  }

  const boxes = Array.from({ length: MAX_LOCO_BOX + 1 }, (_, box) => box);

  function isAvailable(box: number, row: LocoRow): boolean {
    if (box < 1) return false;
    if (box === currentBox && row === currentPosition.row) return false;
    if (box > round) return false;
    if (money < costToAdvanceInto(box)) return false;
    if (row === LocoRow.SINGLE && occupiedSingleBoxes.has(box)) return false;
    return true;
  }

  function renderCell(box: number, row: LocoRow) {
    return (
      <TableCell textAlign="center">
        <Button
          size="mini"
          primary={row === LocoRow.SINGLE}
          disabled={isPending || !isAvailable(box, row)}
          onClick={() => emitAdvance({ targetBox: box, row })}
        >
          {describeBox(box, row)}
        </Button>
      </TableCell>
    );
  }

  return (
    <div>
      <p>You may advance on the locomotive track, or pass.</p>
      <Table celled compact unstackable size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Round</TableHeaderCell>
            <TableHeaderCell>Cost</TableHeaderCell>
            <TableHeaderCell>Many players</TableHeaderCell>
            <TableHeaderCell>Single player</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boxes.map((box) => (
            <TableRow key={box}>
              <TableCell textAlign="center">{box}</TableCell>
              <TableCell textAlign="center">
                {box === 0 ? "—" : `$${costToAdvanceInto(box)}`}
              </TableCell>
              {renderCell(box, LocoRow.MANY)}
              {renderCell(box, LocoRow.SINGLE)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button negative disabled={isPending} onClick={emitSkip}>
        Pass
      </Button>
    </div>
  );
}
