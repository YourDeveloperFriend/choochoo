import { Rotation } from "../../engine/game/map_settings";
import { TrackInfo } from "../../engine/map/track";
import { getExitPoint, Point } from "../../utils/point";
import { getPlayerColorCss } from "../components/player_color";
import { Rotate } from "../components/rotation";
import * as styles from "./track.module.css";

interface TrackProps {
  track: TrackInfo;
  center: Point;
  size: number;
  highlighted: boolean;
  rotation?: Rotation;
}

export function Track({
  track,
  center,
  size,
  highlighted,
  rotation,
}: TrackProps) {
  const point1 = getExitPoint(center, track.exits[0], size);
  const point2 = getExitPoint(center, track.exits[1], size);

  const curve = `M${point1.x} ${point1.y} Q ${center.x} ${center.y} ${point2.x} ${point2.y}`;
  return (
    <>
      {highlighted && (
        <path
          d={curve}
          stroke="yellow"
          strokeWidth="24"
          strokeLinecap="butt"
          fill="transparent"
        ></path>
      )}
      {!highlighted && (
        <path
          d={curve}
          stroke="white"
          strokeWidth="16"
          strokeLinecap="butt"
          fill="transparent"
        ></path>
      )}
      <path
        className={`${styles.track} ${getPlayerColorCss(track.owner)}`}
        d={curve}
        strokeWidth="12"
        strokeLinecap="butt"
        fill="transparent"
      ></path>
      {track.claimableCost != null && track.owner == null && (
        <ClaimableTrack
          center={center}
          size={size}
          cost={track.claimableCost}
          rotation={rotation}
        />
      )}
    </>
  );
}

interface ClaimableTrackProps {
  center: Point;
  size: number;
  cost: number;
  rotation?: Rotation;
}

function ClaimableTrack({ center, size, cost, rotation }: ClaimableTrackProps) {
  return (
    <>
      <circle
        cx={center.x}
        cy={center.y}
        className={styles.claimableCostContainer}
        r={size / 2}
      />
      <Rotate rotation={rotation} reverse={true} center={center}>
        <text
          data-claimable
          x={center.x}
          y={center.y}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          ${cost}
        </text>
      </Rotate>
    </>
  );
}
