import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "semantic-ui-react";

function TerrainHex({ color, label }: { color: string; label: string }) {
  return (
    <svg
      width="28"
      height="30"
      viewBox="0 0 28 30"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <polygon
        points="14,1 26,8 26,22 14,29 2,22 2,8"
        fill={color}
        stroke="#8b7543"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function HoneybeeHiveMindRules() {
  return (
    <div>
      <h2>Build Track</h2>
      <Table celled compact collapsing unstackable>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Track laid directly</TableHeaderCell>
            <TableHeaderCell textAlign="center">
              <TerrainHex color="#f5e1a6" label="Pale yellow hex" />
            </TableHeaderCell>
            <TableHeaderCell textAlign="center">
              <TerrainHex color="#d6ac70" label="Brown hex" />
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Simple Track</TableCell>
            <TableCell textAlign="center">$2</TableCell>
            <TableCell textAlign="center">$3</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Complex Coexisting</TableCell>
            <TableCell textAlign="center">$3</TableCell>
            <TableCell textAlign="center">$4</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Complex Crossing</TableCell>
            <TableCell textAlign="center">$4</TableCell>
            <TableCell textAlign="center">$5</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <p>Replacing and redirecting costs are standard.</p>
      <p>
        Claim an empty interurban circle for $2. You may own only one direct
        Link between any pair of the four central Cities, including built track
        between large Cities.
      </p>
      <p>
        With 5 players, each player may establish at most two of the three
        large-City pairings per turn, through interurban claims or built track.
      </p>

      <h2>Move Goods</h2>
      <p>
        Yellow cubes are replaced by bee swarms and cannot be delivered. Pay $1
        per swarm in each City entered (to/through) during a delivery.
      </p>

      <h2>Special Actions</h2>
      <p>
        <b>Waggle Dance</b> – At the beginning of the Move Goods phase,
        optionally relocate up to three yellow cubes to different Cities.
      </p>
      <p>
        <b>Dominant Worker Bee</b> – Waives delivery fees for swarms.
      </p>

      <h2>End of Game</h2>
      <p>One fewer turn than normal.</p>
    </div>
  );
}
