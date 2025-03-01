import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@mui/material";
import { useMemo } from "react";
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

export function TileManifest() {
  const manifest = useInject(() => inject(BuilderHelper).trackManifest(), []);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography component="h2">Tile Manifest</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <div className={styles.tiles}>
          {[...manifest.entries()].map(([tileType, info]) => (
            <TileInfo key={tileType} tileType={tileType} info={info} />
          ))}
        </div>
      </AccordionDetails>
    </Accordion>
  );
}

export function TileInfo({
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
