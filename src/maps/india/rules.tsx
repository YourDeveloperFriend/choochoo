import {ReactNode} from "react";

export const RULES: ReactNode = <div>
    <p>Same as base game with the following changes:</p>
    <ul>
      <li><b>Goods growth:</b> does not happen naturally, but happens every time a new player connects a track to a city.</li>
      <li><b>Urbanization:</b> comes with goods for each player connected to that new city.</li>
      <li><b>Production:</b> select one city, draw 2 goods, and place one of those goods in that city.</li>
      <li><b>Monsoon:</b> before collecting income, every player randomly pays a monsoon expense based on a die roll (1=$0, 2-5=$1, 6=$2).</li>
      <li><b>Expensive mountains:</b> cost $6.</li>
      <li><b>Deserts:</b> cost $3.</li>
    </ul>
  </div>;
