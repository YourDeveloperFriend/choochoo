import { Rotation } from "../../engine/game/map_settings";
import { City } from "../../engine/map/city";
import { CityGroup, toLetter } from "../../engine/state/city_group";
import { OnRollData, OnRoll as OnRollValue } from "../../engine/state/roll";
import { peek } from "../../utils/functions";
import { Point } from "../../utils/point";
import { Rotate } from "../components/rotation";

interface OnRollProps {
  city: City;
  center: Point;
  size: number;
  rotation?: Rotation;
}

export function OnRoll({ city, center, size, rotation }: OnRollProps) {
  const onRoll = city.onRoll();
  if (onRoll.length === 0) {
    return <></>;
  }
  return (
    <>
      <circle
        cx={center.x}
        cy={center.y}
        fill={onRoll[0].group == CityGroup.WHITE ? "#ffffff" : "#222222"}
        r={size * 0.4}
      />
      <Rotate rotation={rotation} reverse={true} center={center}>
        <text
          fontSize={size / 2}
          fill={
            city.onRoll()[0]?.group == CityGroup.BLACK ? "#ffffff" : "#222222"
          }
          x={center.x}
          y={center.y + size / 20}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          {city.isUrbanized() ? toLetter(onRoll[0]) : formatOnRoll(onRoll)}
        </text>
      </Rotate>
      ;
    </>
  );
}

function formatOnRoll(onRoll: OnRollData[]): string {
  const groups = new Map<CityGroup, OnRollValue[]>([
    [CityGroup.BLACK, []],
    [CityGroup.WHITE, []],
  ]);
  for (const curr of onRoll) {
    groups.get(curr.group)!.push(curr.onRoll);
  }
  const single = [...groups.entries()].filter(
    ([_, entries]) => entries.length > 0,
  );
  if (single.length === 1) {
    const onRolls = single[0][1];
    if (onRolls.length < 3) {
      return single[0][1].join(",");
    }
    onRolls.sort();
    const incrementalOrder = onRolls.every(
      (v, i) => i === 0 || v === onRolls[i - 1] + 1,
    );
    if (incrementalOrder) {
      return `${onRolls[0]}-${peek(onRolls)}`;
    }
    return onRolls.join(",");
  }
  // The only time we have two groups (currently) is DC Metro. In that case, just show the white 1.
  return formatOnRoll(onRoll.filter((r) => r.group === CityGroup.WHITE));
}
