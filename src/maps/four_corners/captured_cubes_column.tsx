import { useInjectedState } from "../../client/utils/injection_context";
import { Good, goodToString } from "../../engine/state/good";
import { PlayerData } from "../../engine/state/player";
import { CAPTURED_CUBES } from "./move";

interface PlayerStatColumnProps {
  player: PlayerData;
}

export function CapturedCubesCell({ player }: PlayerStatColumnProps) {
  const capturedCubes = useInjectedState(CAPTURED_CUBES);
  const playerCubes = capturedCubes.get(player.color) || [];

  if (playerCubes.length === 0) {
    return <>-</>;
  }

  // Group cubes by type and count them
  const cubesSummary = playerCubes.reduce((acc: Map<Good, number>, cube) => {
    acc.set(cube, (acc.get(cube) || 0) + 1);
    return acc;
  }, new Map());

  // Format as "Blue:2, Red:1"
  const cubesText = Array.from(cubesSummary.entries())
    .map(([good, count]) => `${goodToString(good)}:${count}`)
    .join(", ");

  return <>{cubesText}</>;
}

export const capturedCubesColumn = {
  header: "Captured",
  cell: CapturedCubesCell,
};
