import { useMemo, useState } from "react";
import { BuilderHelper, TileManifestEntry } from "../../engine/build/helper";
import { inject } from "../../engine/framework/execution_context";
import { Grid } from "../../engine/map/grid";
import { Land } from "../../engine/map/location";
import { isComplexTile } from "../../engine/map/tile";
import { SpaceType } from "../../engine/state/location_type";
import { Direction, TileType } from "../../engine/state/tile";
import { MapRegistry } from "../../maps/registry";
import { Coordinates } from "../../utils/coordinates";
import { HexGrid } from "../grid/hex_grid";
import { useGameKey, useInject } from "../utils/injection_context";
import * as styles from "./tile_manifest.module.css";
import {
  Accordion,
  AccordionContent,
  AccordionTitle,
  Menu,
  MenuItem,
} from "semantic-ui-react";

export function TileManifest() {
  const manifest = useInject(() => inject(BuilderHelper).trackManifest(), []);
  const [expanded, setExpanded] = useState<boolean>(false);

  return (
    <Accordion as={Menu} vertical fluid>
      <MenuItem>
        <AccordionTitle
          active={expanded}
          index={0}
          onClick={() => setExpanded(!expanded)}
          content="Tile Manifest"
        />
        <AccordionContent active={expanded}>
          {expanded && (
            <div className={styles.tiles}>
              {[...manifest.entries()].map(([tileType, info]) => (
                <TileInfo key={tileType} tileType={tileType} info={info} />
              ))}
            </div>
          )}
        </AccordionContent>
      </MenuItem>
    </Accordion>
  );
}

function TileInfo({
  tileType,
  info,
}: {
  tileType: TileType;
  info: TileManifestEntry;
}) {
  const mapSettings = MapRegistry.singleton.get(useGameKey());
  const grid = useMemo(() => {
    const tile = new Land(Coordinates.from({ q: 0, r: 0 }), {
      type: SpaceType.PLAIN,
      tile: {
        tileType,
        orientation: Direction.TOP,
        owners: [undefined, undefined],
      },
    });
    return Grid.fromSpaces(mapSettings, [tile], []);
  }, [mapSettings]);

  const towns = info.remainingIgnoringTowns - info.remaining;

  return (
    <div className={styles.tileContainer}>
      <HexGrid grid={grid} />
      <div>
        {info.remaining}{" "}
        {towns > 0 && isComplexTile(tileType) ? (
          <>(Used for towns: {towns})</>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}
