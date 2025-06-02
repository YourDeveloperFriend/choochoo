import { useCallback, useState } from "react";
import { MoveData } from "../../engine/move/move";
import { useInjected, useViewSettings} from "../utils/injection_context";
import { MoveInterceptor } from "../../engine/move/interceptor";

interface InterceptMoveModalProps {
  cityName?: string;
  moveData?: MoveData;
  clearMoveData(): void;
}

export function useMoveInterceptionState() {
  const moveInterceptor = useInjected(MoveInterceptor);
  const [[cityName, moveData], setInternalState] = useState<
    [string, MoveData] | [undefined, undefined]
  >([undefined, undefined]);
  const clearMoveData = useCallback(() => {
    setInternalState([undefined, undefined]);
  }, []);
  const maybeInterceptMove = useCallback(
    (moveData: MoveData, cityName: string) => {
      const intercept = moveInterceptor.shouldInterceptMove(moveData, cityName);
      if (intercept) {
        setInternalState([cityName, moveData]);
        return true;
      }
      return false;
    },
    [setInternalState, moveInterceptor],
  );
  return {
    moveData,
    cityName,
    clearMoveData,
    maybeInterceptMove,
  };
}

export function InterceptMoveModal(props: InterceptMoveModalProps) {
  const mapSettings = useViewSettings();
  if (!mapSettings.moveInterceptModal) {
    return null;
  }
  const Modal = mapSettings.moveInterceptModal;
  return <Modal {...props} />;
}
