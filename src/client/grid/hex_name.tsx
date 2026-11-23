import { useId } from "react";
import { Rotation } from "../../engine/game/map_settings";
import { Point } from "../../utils/point";
import { Rotate } from "../components/rotation";

interface HexNameProps {
  name: string;
  center: Point;
  size: number;
  rotation?: Rotation;
  fill?: string;
}

export function HexName(props: HexNameProps) {
  const pathId = useId();

  // There are some odd things that happen when the name gets too long.
  const division = 4 + Math.floor(props.name.length / 10);

  return (
    <Rotate rotation={props.rotation} reverse={true} center={props.center}>
      <path
        id={"curve" + pathId}
        stroke="none"
        fill="none"
        d={`M ${props.center.x - props.size / 1.6} ${props.center.y} a ${props.size / 2} ${props.size / 2.2} 0 0 0 ${(2 * props.size) / 1.6} 0`}
      />
      <text
        fontSize={props.size / division}
        fill={props.fill ?? "white"}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        <textPath xlinkHref={"#curve" + pathId} startOffset="50%">
          {props.name}
        </textPath>
      </text>
    </Rotate>
  );
}
