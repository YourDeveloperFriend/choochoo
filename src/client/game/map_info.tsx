import { GameKey } from "../../api/game_key";
import { VariantConfig } from "../../api/variant_config";
import { ViewRegistry } from "../../maps/view_registry";
import { Username } from "../components/username";
import { useMemo } from "react";
import { Grid } from "../../engine/map/grid";
import { HexGrid } from "../grid/hex_grid";
import * as React from "react";
import { useLocalStorage } from "../services/local_storage";
import { River, RiverDots, RiverEditor, RiverPath } from "./river_editor";

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
        <li>Designer: {selectedMap.designer}</li>
        <li>
          Implementation by:{" "}
          <Username useLink userId={selectedMap.implementerId} />
        </li>
      </ul>
      <h3>Rules</h3>
      <Rules variant={variant} />
    </div>
  );
}

export function MapGridPreview({
  gameKey,
  showRiverEditor,
}: {
  gameKey: GameKey;
  showRiverEditor?: boolean;
}) {
  const [riverPath, setRiverPath] = useLocalStorage<RiverPath | undefined>(
    "riverPath",
  );

  const selectedMap = useMemo(() => {
    return ViewRegistry.singleton.get(gameKey);
  }, [gameKey]);

  const grid = useMemo(() => {
    return Grid.fromData(
      selectedMap,
      selectedMap.startingGrid,
      selectedMap.interCityConnections ?? [],
    );
  }, [selectedMap]);

  if (!grid) {
    return null;
  }

  return (
    <>
      {showRiverEditor && (
        <RiverEditor path={riverPath} setRiverPath={setRiverPath} />
      )}
      <HexGrid
        key={gameKey}
        gameKey={gameKey}
        rotation={selectedMap.rotation}
        grid={grid}
        fullMapVersion={true}
      >
        {showRiverEditor && (
          <>
            <River path={riverPath} />
            <RiverDots path={riverPath} setRiverPath={setRiverPath} />
          </>
        )}
      </HexGrid>
    </>
  );
}
