import { InterceptMoveModalProps } from "../../engine/move/interceptor";
import { useAction } from "../../client/services/action";
import { LondonMoveAction } from "./move_good";
import { useCallback, useMemo, useState } from "react";
import { useGrid } from "../../client/utils/injection_context";
import {
  Button,
  DropdownProps,
  Header,
  Modal,
  ModalActions,
  ModalContent,
  Select,
} from "semantic-ui-react";
import { City } from "../../engine/map/city";

export function LondonMoveInterceptorModal({
  cityName,
  moveData,
  clearMoveData: clearMoveDataExternal,
}: InterceptMoveModalProps) {
  const grid = useGrid();
  const { emit: emitMoveAction, isPending: isPending } =
    useAction(LondonMoveAction);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(
    undefined,
  );

  const clearMoveData = useCallback(() => {
    clearMoveDataExternal();
    setSelectedCity(undefined);
  }, [clearMoveDataExternal, setSelectedCity]);

  const options = useMemo(() => {
    if (moveData == null) return [];

    const result: Array<{ key: string; text: string; value: string }> = [];

    const start = grid.get(moveData.startingCity);
    if (start && start instanceof City) {
      result.push({
        key: start.name(),
        text: start.name(),
        value: start.name(),
      });
    }
    const end = grid.get(moveData.path[moveData.path.length - 1].endingStop);
    if (end && end instanceof City) {
      result.push({ key: end.name(), text: end.name(), value: end.name() });
    }

    return result;
  }, [grid, moveData]);

  const completeMove = useCallback(() => {
    emitMoveAction({
      city: selectedCity,
      ...moveData!,
    });
    clearMoveData();
    setSelectedCity(undefined);
  }, [emitMoveAction, clearMoveData, moveData, selectedCity]);

  const onChange = useCallback(
    (_: unknown, { value }: DropdownProps) => {
      setSelectedCity(value as string | undefined);
    },
    [setSelectedCity],
  );

  return (
    <Modal closeIcon open={moveData != null} onClose={clearMoveData}>
      <Header content={`Deliver to ${cityName}?`} />
      <ModalContent>
        <p>
          Select a city to which a good should be added for instant production.
        </p>
        <p>
          The top good from the goods display will be moved to the city. If
          there are no goods left, a random cube will be drawn from the bag and
          added to the goods display. This will make the action non-reversible.
        </p>
        <Select placeholder="City" options={options} onChange={onChange} />
      </ModalContent>
      <ModalActions>
        <Button onClick={clearMoveData} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={completeMove} disabled={isPending}>
          Select City
        </Button>
      </ModalActions>
    </Modal>
  );
}
