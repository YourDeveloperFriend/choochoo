export function PuertoRicoRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> Two cubes on each town.
        </li>
        <li>
          <table>
            <thead>
              <tr>
                <th>Difficulty Level</th>
                <th>Red Cubes</th>
                <th>Black Cubes</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Novicio</td>
                <td>17</td>
                <td>5</td>
              </tr>
              <tr>
                <td>Estudiante</td>
                <td>16</td>
                <td>6</td>
              </tr>
              <tr>
                <td>Versado</td>
                <td>15</td>
                <td>7</td>
              </tr>
              <tr>
                <td>Maestro</td>
                <td>14</td>
                <td>8</td>
              </tr>
              <tr>
                <td>Conquistador</td>
                <td>13</td>
                <td>9</td>
              </tr>
              <tr>
                <td>Dios</td>
                <td>12</td>
                <td>10</td>
              </tr>
            </tbody>
          </table>
        </li>
        <li>
          <b>Choosing Actions:</b> You may pay $5 to choose the Engineer action
          or the Locomotive action (no other actions are available). If you do
          not choose one of these two actions, you pay nothing.
        </li>
        <li>
          <b>Delivering Cubes:</b>Both red and black Goods cubes may be
          delivered to San Juan. Only red cubes score income.
        </li>
        <li>
          <b>Phases:</b>There are no Auction or Goods Growth phases.
        </li>
        <li>
          <b>Game End:</b>The game ends after 10 turns. If any black Goods cubes
          have not been deliveried, you score is reduced by 10 income for each
          black cube remaining.
        </li>
      </ul>
    </div>
  );
}
