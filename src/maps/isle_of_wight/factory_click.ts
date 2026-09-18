import { ClickTarget, OnClickRegister } from "../../client/grid/click_target";
import { useAction } from "../../client/services/action";
import { WorkInFactoriesAction } from "./factory";

/** Once a train is chosen, clicking a city sends its crew to the factories. */
export function useFactoryClick(on: OnClickRegister) {
  const { canEmit, emit, data, isPending } = useAction(WorkInFactoriesAction);

  if (canEmit && data?.trainIndex != null) {
    const trainIndex = data.trainIndex;
    on(ClickTarget.CITY, ({ coordinates }) => {
      emit({ trainIndex, coordinates });
    });
  }
  return isPending;
}
