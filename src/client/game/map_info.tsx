import { MapRegistry } from "../../maps";
import { CyprusMapSettings } from "../../maps/cyprus/settings";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { CyprusRules } from "./maps/cyprus";
import { IrelandRules } from "./maps/ireland";
import { SwedenRecyclingRules } from "./sweden/rules";

export function MapInfo({ gameKey }: { gameKey: string }) {
  const selectedMap = MapRegistry.singleton.get(gameKey);
  return <div>
    <h2>{selectedMap.name}</h2>
    <p>Details:</p>
    <ul>
      {selectedMap.bestAt && <li>Best at: {selectedMap.bestAt} players</li>}
      {selectedMap.recommendedPlayerCount && <li>Recommended: {selectedMap.recommendedPlayerCount} players</li>}
      <li>Supports: {selectedMap.minPlayers}{selectedMap.minPlayers === selectedMap.maxPlayers ? '' : `-${selectedMap.maxPlayers}`} players</li>
    </ul>
    <h3>Rules</h3>
    <AlternateRules gameKey={gameKey} />
  </div>
}

export function AlternateRules({ gameKey }: { gameKey: string }) {
  switch (gameKey) {
    case 'ireland':
      return <IrelandRules />;
    case SwedenRecyclingMapSettings.key:
      return <SwedenRecyclingRules />;
    case CyprusMapSettings.key:
      return <CyprusRules />;
    default:
      return <p>No changes from base game.</p>;
  }
}