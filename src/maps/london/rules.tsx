export function LondonRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Building Track:</b> During the build phase you may build on up to 5
          hexes instead of the usual 3.
        </li>
        <li>
          <b>Engineer Special Action:</b> Instead of providing additional
          builds, the Engineer special action reduces the cost of union overtime
          fees. See the next rule for the cost chart.
        </li>
        <li>
          <b>Union Overtime Fees:</b> In addition to the usual track cost you
          will need to pay union overtime fees depending on how many tiles you
          have built.
          <table>
            <thead>
              <tr>
                <th># Tiles</th>
                <th>1</th>
                <th>2</th>
                <th>3</th>
                <th>4</th>
                <th>5</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Normal</td>
                <td>1</td>
                <td>3</td>
                <td>6</td>
                <td>10</td>
                <td>15</td>
              </tr>
              <tr>
                <td>Engineer</td>
                <td>0</td>
                <td>1</td>
                <td>2</td>
                <td>4</td>
                <td>8</td>
              </tr>
            </tbody>
          </table>
        </li>
        <li>
          <b>Urbanization:</b> A town may only be urbanized if there if there is
          track laid on the tile. Urbanizing does not count towards union
          overtime fees, but laying track on the tile as a prerequisite does.
        </li>
        <li>
          <p>
            <b>Instant Production:</b> When a goods cube is delivered, the
            player who delivered that cube immediately takes a goods cube from
            the top of the production chart column of the originating or
            destination city, placing the cube directly on that city. The
            newly-placed cube is immediately available for delivery. If there
            are no more cubes on the production chart for the city the player
            elects to produce from, then a random cube is drawn from the cup and
            placed on that city’s column in the production chart; in this case
            no cube is placed on the map.
          </p>
          <p>There is no Production action or Goods Growth phase.</p>
        </li>
        <li>
          <b>VP Calculations:</b> Victory point calculation at the end of the
          game has changed to: ((income-shares) * 2) + track. As a result, track
          is worth 50% more than in the standard rules.
        </li>
        <li>
          <b>Game Length:</b> The game lasts 1 less round than usual.
        </li>
        <li>
          <b>Shares:</b> This map has a limit of 20 shares.
        </li>
        <li>
          <p>The lighter green hexes visually indicate Central London, but have no effect on gameplay.</p>
        </li>
      </ul>
    </div>
  );
}
