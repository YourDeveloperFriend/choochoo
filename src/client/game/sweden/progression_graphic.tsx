import { inject } from "../../../engine/framework/execution_context";
import { Incinerator } from "../../../maps/sweden/incinerator";
import { SwedenRecyclingMapSettings } from "../../../maps/sweden/settings";
import { useGameKey, useInject } from "../../utils/injection_context";
import { FactoryBlack } from "./factory_black";
import { FactoryBlue } from "./factory_blue";
import { FactoryEmpty } from "./factory_empty";
import { FactoryRed } from "./factory_red";
import { FactoryYellow } from "./factory_yellow";

export function SwedenProgressionGraphic() {
  const gameKey = useGameKey();
  if (gameKey !== SwedenRecyclingMapSettings.key) {
    return <></>;
  }

  return <ProgressionGraphic />;
}

function ProgressionGraphic() {
  const garbageCount = useInject(() => {
    const incinerator = inject(Incinerator);
    return incinerator.getGarbageCount();
  }, []);

  let translateY = 0;
  return (
    <g transform="translate(1300,800) scale(0.9)">
      <FactoryYellow translateY={translateY} />
      <DownArrow translateY={(translateY += 120)} />
      <FactoryRed translateY={(translateY += 120)} />
      <DownArrow translateY={(translateY += 120)} />
      <FactoryBlue translateY={(translateY += 120)} />
      <DownArrow translateY={(translateY += 120)} />
      <FactoryBlack translateY={(translateY += 120)} />
      <DownArrow translateY={(translateY += 120)} />
      <FactoryEmpty translateY={(translateY += 120)} />
      <text
        x={50}
        y={translateY + 70}
        dominantBaseline="middle"
        textAnchor="middle"
      >
        {garbageCount}
      </text>
    </g>
  );
}

function DownArrow({ translateY }: { translateY: number }) {
  const naturalWidth = 18.399930953979492;
  const naturalOffset = 4.795654296875;
  const goalWidth = 100.09603118896484;
  const scale = 3;
  const actualWidth = naturalWidth * scale;
  const leftMargin = (goalWidth - actualWidth) / 2 - naturalOffset * scale;
  return (
    <g transform={`translate(${leftMargin}, ${translateY}) scale(${scale})`}>
      <path d="M12 3C12.5523 3 13 3.44772 13 4V17.5858L18.2929 12.2929C18.6834 11.9024 19.3166 11.9024 19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L12.7071 20.7071C12.3166 21.0976 11.6834 21.0976 11.2929 20.7071L4.29289 13.7071C3.90237 13.3166 3.90237 12.6834 4.29289 12.2929C4.68342 11.9024 5.31658 11.9024 5.70711 12.2929L11 17.5858V4C11 3.44772 11.4477 3 12 3Z"></path>
    </g>
  );
}
