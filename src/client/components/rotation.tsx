import { ReactNode } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { Point } from "../../utils/point";

interface RotateProps {
  rotation?: Rotation;
  reverse?: boolean;
  center?: Point;
  children: ReactNode;
}

export function Rotate({ rotation, reverse, center, children }: RotateProps) {
  const rotationNorm = reverse ? reverseRotation(rotation) : rotation;
  const rotationStr = (rotationNorm === Rotation.CLOCKWISE ? 1 : -1) * 90;
  const centerStr = center != null ? `${center.x} ${center.y}` : "";
  const rotateStr =
    rotationNorm != null ? `rotate(${rotationStr} ${centerStr})` : "";
  return <g transform={rotateStr}>{children}</g>;
}

function reverseRotation(rotation?: Rotation): Rotation | undefined {
  if (rotation == null) {
    return rotation;
  }
  return rotation === Rotation.CLOCKWISE
    ? Rotation.COUNTER_CLOCKWISE
    : Rotation.CLOCKWISE;
}
