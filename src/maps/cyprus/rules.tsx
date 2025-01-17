import {ReactNode} from "react";

export const RULES: ReactNode = <div>
    <p>Same as base game with the following changes:</p>
    <ul>
      <li><b>Limitted builds:</b> only two builds per round (3 w/ Engineer).</li>
      <li><b>Blocked actions:</b> Locomotive is not available on odd rounds, engineer is not available on even rounds.</li>
      <li><b>The UN (Green):</b> cannot select the urbanize action.</li>
      <li><b>Greece (Blue):</b> cannot deliver goods to the northern side of the map.</li>
      <li><b>Turkey (Red):</b> cannot deliver goods to the southern side of the map.</li>
      <li><b>Nikosia:</b> is a neutral city and can accept goods from all players.</li>
    </ul>
  </div>;
