import { ViewRegistry } from "../../maps/view_registry";
import { MapViewSettings } from "../../maps/view_settings";

export function MapInfo({ gameKey }: { gameKey: string }) {
  const selectedMap = ViewRegistry.singleton.get(gameKey);
  return <div>
    <h2>{selectedMap.name}</h2>
    <p>Details:</p>
    <ul>
      {selectedMap.bestAt && <li>Best at: {selectedMap.bestAt} players</li>}
      {selectedMap.recommendedPlayerCount && <li>Recommended: {selectedMap.recommendedPlayerCount} players</li>}
      <li>Supports: {selectedMap.minPlayers}{selectedMap.minPlayers === selectedMap.maxPlayers ? '' : `-${selectedMap.maxPlayers}`} players</li>
    </ul>
    <h3>Rules</h3>
    <AlternateRules selectedMap={selectedMap} />
  </div>
}

export function AlternateRules({ selectedMap }: { selectedMap: MapViewSettings }) {
  if (selectedMap.getMapRules) {
    return selectedMap.getMapRules();
  }
  return <p>No changes from base game.</p>;
}