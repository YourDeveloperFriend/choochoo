import { Phase, PhaseNamingProvider } from "../../engine/state/phase";

export const WAGGLE_DANCE_PHASE = Phase.MAP_CUSTOM_PHASE_1;

export class HoneybeePhaseNamingProvider extends PhaseNamingProvider {
  getPhaseString(phase: Phase): string {
    if (phase === WAGGLE_DANCE_PHASE) {
      return "Waggle Dance";
    }
    return super.getPhaseString(phase);
  }
}
