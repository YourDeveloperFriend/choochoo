import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { ViewRegistry } from "../../maps/view_registry";

export function MapInfo({
  gameKey,
  variant,
}: {
  gameKey: GameKey;
  variant: VariantConfig;
}) {
  const selectedMap = ViewRegistry.singleton.get(gameKey);
  const Rules = selectedMap.getMapRules;
  return (
    <div>
      <h2>{selectedMap.name}</h2>
      <p>Details:</p>
      <ul>
        {selectedMap.bestAt && <li>Best at: {selectedMap.bestAt} players</li>}
        {selectedMap.recommendedPlayerCount && (
          <li>Recommended: {selectedMap.recommendedPlayerCount} players</li>
        )}
        <li>
          Supports: {selectedMap.minPlayers}
          {selectedMap.minPlayers === selectedMap.maxPlayers
            ? ""
            : `-${selectedMap.maxPlayers}`}{" "}
          players
        </li>
      </ul>
      <h3>Rules</h3>
      <Rules variant={variant} />
    </div>
  );
}
