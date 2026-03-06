import * as React from "react";
import { useId, useMemo, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";
import { GameKey } from "../../api/game_key";
import {
  PlayerCountRating,
  ReleaseStage,
  releaseStageToString,
} from "../../engine/game/map_settings";
import { MapViewSettings } from "../../maps/view_settings";
import {
  dialogContent,
  filterField,
  filterSection,
  mapTable,
  ratingCell,
  tableContainer,
  visuallyHidden,
} from "./map_selector_dialog.module.css";

interface MapSelectorDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectMap: (gameKey: GameKey) => void;
  initialSelection?: GameKey;
  availableMaps: MapViewSettings[];
}

export function MapSelectorDialog({
  open,
  onClose,
  onSelectMap,
  initialSelection,
  availableMaps,
}: MapSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [designerFilter, setDesignerFilter] = useState("");
  const [playerCountFilter, setPlayerCountFilter] = useState<number | null>(
    null,
  );
  const [hoveredRowKey, setHoveredRowKey] = useState<GameKey | null>(null);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const ratingsGuideId = useId();
  const resultsStatusId = useId();

  const getRatingForCount = (map: MapViewSettings, count: number) => {
    if (count < map.minPlayers || count > map.maxPlayers) {
      return PlayerCountRating.NOT_SUPPORTED;
    }

    const explicitRating = map.playerCountRatings?.[count];
    if (explicitRating) {
      return explicitRating;
    }

    return PlayerCountRating.NO_DATA;
  };

  const filteredMaps = useMemo(() => {
    return availableMaps.filter((map) => {
      // Name filter
      if (
        searchTerm &&
        !map.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }

      // Designer filter
      if (
        designerFilter &&
        !map.designer.toLowerCase().includes(designerFilter.toLowerCase())
      ) {
        return false;
      }

      // Player count filter
      if (playerCountFilter !== null) {
        // Only show maps that support this player count
        const rating = getRatingForCount(map, playerCountFilter);
        if (rating === PlayerCountRating.NOT_SUPPORTED) {
          return false;
        }
      }

      return true;
    });
  }, [availableMaps, searchTerm, designerFilter, playerCountFilter]);

  const handleSelectMap = (gameKey: GameKey) => {
    onSelectMap(gameKey);
    onClose();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setDesignerFilter("");
    setPlayerCountFilter(null);
  };

  const getRatingCellState = (rating: PlayerCountRating) => {
    if (
      rating === PlayerCountRating.RECOMMENDED ||
      rating === PlayerCountRating.HIGHLY_RECOMMENDED
    ) {
      return { positive: true };
    }

    if (rating === PlayerCountRating.NOT_RECOMMENDED) {
      return { negative: true };
    }

    if (rating === PlayerCountRating.MIXED) {
      return { warning: true };
    }

    if (rating === PlayerCountRating.NOT_SUPPORTED) {
      return { disabled: true };
    }

    return {};
  };

  const playerCounts = [1, 2, 3, 4, 5, 6, 7, 8];

  const handleCellMouseEnter = (rowKey: GameKey, column: number) => {
    setHoveredRowKey(rowKey);
    setHoveredColumn(column);
  };

  const clearHoveredCell = () => {
    setHoveredRowKey(null);
    setHoveredColumn(null);
  };

  return (
    <Modal
      closeIcon
      open={open}
      onClose={onClose}
      size="fullscreen"
      data-map-selector-dialog
    >
      <ModalHeader>Select a Map</ModalHeader>
      <ModalContent className={dialogContent}>
        <div className={filterSection} aria-label="Map filters" role="region">
          <div className={filterField}>
            <label htmlFor="map-selector-name-filter">Map name</label>
            <Input
              id="map-selector-name-filter"
              placeholder="Search by name..."
              value={searchTerm}
              autoFocus
              aria-describedby={ratingsGuideId}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginRight: "1rem" }}
            />
          </div>
          <div className={filterField}>
            <label htmlFor="map-selector-designer-filter">Designer</label>
            <Input
              id="map-selector-designer-filter"
              placeholder="Filter by designer..."
              value={designerFilter}
              aria-describedby={ratingsGuideId}
              onChange={(e) => setDesignerFilter(e.target.value)}
              style={{ marginRight: "1rem" }}
            />
          </div>
          <div className={filterField}>
            <label htmlFor="map-selector-player-count-filter">Player count</label>
            <Input
              id="map-selector-player-count-filter"
              type="number"
              min={1}
              max={8}
              step={1}
              inputMode="numeric"
              placeholder="Player count..."
              value={playerCountFilter ?? ""}
              aria-describedby={`${ratingsGuideId} ${resultsStatusId}`}
              onChange={(e) => {
                const parsedCount = e.target.value ? parseInt(e.target.value, 10) : null;
                setPlayerCountFilter(
                  parsedCount !== null && Number.isNaN(parsedCount)
                    ? null
                    : parsedCount,
                );
              }}
              style={{ marginRight: "1rem", width: "150px" }}
            />
          </div>
          <Button onClick={handleClearFilters}>Clear Filters</Button>
        </div>

        <p id={ratingsGuideId}>
          Ratings guide: ? = no data, -- = not supported, - = not recommended,
          + = recommended, ++ = highly recommended, +- = mixed. These are map
          selection aids and not cross-map quality rankings. Source: {" "}
          <a
            href="https://boardgamegeek.com/thread/2930352/article/41563109#41563109"
            target="_blank"
            rel="noreferrer"
          >
            BoardGameGeek community list
          </a>
          .
        </p>
        <p id={resultsStatusId} aria-live="polite">
          Showing {filteredMaps.length} map{filteredMaps.length === 1 ? "" : "s"}.
        </p>

        <div className={tableContainer}>
          <Table celled compact sortable className={mapTable}>
            <caption className={visuallyHidden}>
              Map list with ratings for 1 through 8 players and an action to select a map.
            </caption>
            <TableHeader>
              <TableRow>
                <TableHeaderCell scope="col" active={hoveredColumn === 0}>
                  Map Name
                </TableHeaderCell>
                <TableHeaderCell scope="col" active={hoveredColumn === 1}>
                  Designer
                </TableHeaderCell>
                {playerCounts.map((count) => (
                  <TableHeaderCell
                    key={count}
                    textAlign="center"
                    scope="col"
                    active={hoveredColumn === count + 2}
                  >
                    {count}p
                  </TableHeaderCell>
                ))}
                <TableHeaderCell scope="col" active={hoveredColumn === 11}>
                  Range
                </TableHeaderCell>
                <TableHeaderCell scope="col" active={hoveredColumn === 12}>
                  Action
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaps.map((map) => (
                <TableRow
                  key={map.key}
                  active={map.key === initialSelection || map.key === hoveredRowKey}
                  data-map-row={map.key}
                  onClick={() => handleSelectMap(map.key)}
                  onKeyDown={(event: React.KeyboardEvent<HTMLTableRowElement>) => {
                    if (event.currentTarget !== event.target) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectMap(map.key);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-selected={map.key === initialSelection}
                >
                  <TableCell
                    as="th"
                    scope="row"
                    active={hoveredRowKey === map.key}
                    onMouseEnter={() => handleCellMouseEnter(map.key, 0)}
                    onMouseLeave={clearHoveredCell}
                  >
                    {map.name}
                    {map.stage !== ReleaseStage.PRODUCTION && (
                      <small> ({releaseStageToString(map.stage)})</small>
                    )}
                  </TableCell>
                  <TableCell
                    active={hoveredRowKey === map.key}
                    onMouseEnter={() => handleCellMouseEnter(map.key, 1)}
                    onMouseLeave={clearHoveredCell}
                  >
                    {map.designer}
                  </TableCell>
                  {playerCounts.map((count) => {
                    const column = count + 2;
                    const rating = getRatingForCount(map, count);
                    const ratingCellState = getRatingCellState(rating);
                    return (
                      <TableCell
                        key={`${map.key}-${count}`}
                        className={ratingCell}
                        {...ratingCellState}
                        active={hoveredRowKey === map.key}
                        onMouseEnter={() => handleCellMouseEnter(map.key, column)}
                        onMouseLeave={clearHoveredCell}
                      >
                        {rating}
                      </TableCell>
                    );
                  })}
                  <TableCell
                    active={hoveredRowKey === map.key}
                    onMouseEnter={() => handleCellMouseEnter(map.key, 11)}
                    onMouseLeave={clearHoveredCell}
                  >
                    {map.minPlayers === map.maxPlayers
                      ? map.minPlayers
                      : `${map.minPlayers}-${map.maxPlayers}`}
                  </TableCell>
                  <TableCell
                    active={hoveredRowKey === map.key}
                    onMouseEnter={() => handleCellMouseEnter(map.key, 12)}
                    onMouseLeave={clearHoveredCell}
                  >
                    <Button
                      primary
                      size="mini"
                      onKeyDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelectMap(map.key);
                      }}
                      data-map-select-button
                    >
                      Select
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredMaps.length === 0 && (
            <p style={{ textAlign: "center", padding: "2rem" }}>
              No maps match your filters.
            </p>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
