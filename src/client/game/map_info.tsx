import { MapRegistry } from "../../maps";
import { CyprusMapSettings } from "../../maps/cyprus/settings";
import { IndiaMapSettings } from "../../maps/india/settings";
import { KoreaMapSettings } from "../../maps/korea/settings";
import { MadagascarMapSettings } from "../../maps/madagascar/settings";
import { SwedenRecyclingMapSettings } from "../../maps/sweden/settings";
import { IndiaRules } from "./india/rules";
import { CyprusRules } from "./maps/cyprus";
import { IrelandRules } from "./maps/ireland";
import { KoreaRules } from "./maps/korea";
import { MadagascarRules } from "./maps/madagascar";
import { SwedenRecyclingRules } from "./sweden/rules";
import {GermanyMapSettings} from "../../maps/germany/settings";
import {GermanyRules} from "./maps/germany";

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
    case MadagascarMapSettings.key:
      return <MadagascarRules />;
    case IndiaMapSettings.key:
      return <IndiaRules />;
    case KoreaMapSettings.key:
      return <KoreaRules />;
    case GermanyMapSettings.key:
      return <GermanyRules />;
    default:
      return <p>No changes from base game.</p>;
  }
}