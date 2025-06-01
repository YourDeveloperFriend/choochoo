import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";

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
          <p>
            <b>Union Overtime Fees:</b> In addition to the usual track cost you
            will need to pay union overtime fees depending on how many tiles you
            have built.
          </p>
          <div style={{ marginBottom: "1em" }}>
            <Table celled compact collapsing>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell># Tiles</TableHeaderCell>
                  <TableHeaderCell>1</TableHeaderCell>
                  <TableHeaderCell>2</TableHeaderCell>
                  <TableHeaderCell>3</TableHeaderCell>
                  <TableHeaderCell>4</TableHeaderCell>
                  <TableHeaderCell>5</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Normal</TableCell>
                  <TableCell>$1</TableCell>
                  <TableCell>$3</TableCell>
                  <TableCell>$6</TableCell>
                  <TableCell>$10</TableCell>
                  <TableCell>$15</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Engineer</TableCell>
                  <TableCell>$0</TableCell>
                  <TableCell>$1</TableCell>
                  <TableCell>$2</TableCell>
                  <TableCell>$4</TableCell>
                  <TableCell>$8</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
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
          <p>
            The lighter green hexes visually indicate Central London, but have
            no effect on gameplay.
          </p>
        </li>
      </ul>
    </div>
  );
}
