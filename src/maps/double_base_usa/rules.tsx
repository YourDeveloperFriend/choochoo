import { Table, TableBody, TableCell, TableRow } from "semantic-ui-react";

export function DoubleBaseUsaRules() {
  return (
    <div>
      <ul>
        <li>
          <p>
            <b>Setup:</b> Component counts on this map combine two base set
            copies of track tiles, New Cities, town discs, and goods cubes. 4
            and 5 player games are 8 turns. 6/7/8 player games are 7 turns.
          </p>
          <p>
            Green cubes on the map represent Western Land Grants hexes that can
            be claimed (see below). The Goods Display is filled for the numbered
            Cities only; it is not filled for the New Cities.
          </p>
          <p>
            For a 6/7/8 player game a second &quot;Locomotive (single)&quot;
            action is available. See the description of this action below.
          </p>
          <p>Players start with two Bonus Locomotive discs.</p>
        </li>
        <li>
          <p>
            <b>Engine Track:</b> Locomotives start at 1 and can go up to 12.
            After you reach locomotive 4, each locomotive increase increments
            your locomotive value by two.
          </p>
          <div style={{ marginBottom: "1em" }}>
            <Table celled compact collapsing unstackable>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>6</TableCell>
                  <TableCell>8</TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>12</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </li>
        <li>
          <p>
            <b>Issue Shares Track:</b> Players start with 2 shares issued and
            $10 and may issue up to 30 shares.
          </p>
        </li>
        <li>
          <p>
            <b>First Turn Changes:</b> Players must start from one of the 8
            white Starting Cities on the East Coast (Portland, Boston, New York
            City, Philadelphia, Baltimore, Norfolk, Charleston, and
            Jacksonville). In a 6/7/8 player game, players may also start from
            Montreal; however, their track must be connected to an East Coast
            City and San Francisco in order to receive the Transcontinental
            Bonus (see details of this bonus below).
          </p>
          <p>
            On the first turn during the build phase, before your first track
            build, you will need to place a starting city. From one of the
            remaining starting city markers not yet chosen (initially there are
            1 blue, 1 yellow, 1 purple, 2 red, and 2 black markers) you select a
            marker and then a city. The city will be that color for the
            remainder of the game. Only one player may select each Starting
            City. Cities that are not selected remain white and act as a
            colorless City for the remainder of the game. Players must build
            track from their selected Starting City and may connect to other
            Starting Cities.
          </p>
          <p>
            Note: If Montreal is selected as a starting city, a starting city
            marker is not used and it remains black. If you run out of starting
            city markers (in an 8 player game) then the last player may select
            either Montreal or the last remaining colorless city as their
            starting city (and place no starting city marker).
          </p>
        </li>
        <li>
          <p>
            <b>Special Action Changes:</b>
          </p>
          <ul>
            <li>
              <p>
                <b>Locomotive Action:</b> This action has changed and does not
                provide a permanent increase in Engine Level. When selected, the
                player immediately gains two bonus locomotive discs. For 6/7/8
                player games, a second &quot;Locomotive (single)&quot; action is
                available, which grants just one bonus locomotive disc.
              </p>
              <p>
                During the Move Goods phase, Bonus Locomotive discs may be spent
                to temporarily increase a player&apos;s delivery length by 1 for
                each disc used during a delivery. The discs may be combined on a
                single delivery. The maximum delivery is the player&apos;s
                Engine Level plus how many discs are used; this may exceed a
                12-link delivery. To use your bonus loco discs this way, just
                perform a delivery exceeding your loco value; if you have
                sufficient bonus loco discs the move will be allowed and the
                required number of loco discs will be automatically spent. Note
                that each disc spent this way increases your delivery length by
                just 1, regardless of what the next engine level would be on the
                loco track; for example, if you a current engine level of 4 then
                spending one loco disc allows you to make a 5-length delivery.
              </p>
              <p>
                Bonus Locomotive discs may also be used to increase the Engine
                Level during the Move Goods phase (see below).
              </p>
            </li>
            <li>
              <p>
                <b>Engineer Action:</b> The player selecting this action may
                build 1 extra tile during the early turns and 2 extra tiles
                during later turns with increased build limits.
              </p>
            </li>
            <li>
              <p>
                <b>Urbanization Action:</b> The player selecting this action
                must place 1 New City tile during early turns and must place 2
                New City tiles during later turns when track build limits are
                doubled. See the Build Track changes for turns when this occurs.
                If a town with a good on it is urbanized, place the good on the
                New City tile.
              </p>
            </li>
            <li>
              <p>
                <b>Production Action:</b> The player selecting this action draws
                two goods and places one of the goods directly on a non-numbered
                City on the map (Starting City, Montreal, Houston, San
                Francisco, or a New City).
              </p>
            </li>
          </ul>
        </li>
        <li>
          <p>
            <b>Build Track:</b> The track build limit is normal (3 tiles) for
            early turns and is doubled (6 tiles) for later turns. The turn when
            the build limit is doubled depends on player count and lasts until
            the end of the game. For a 4 and 5 player game the track tile build
            limit is doubled starting in Turn 5. For a 6/7/8 player game the
            track tile build limit is doubled starting in Turn 4.
          </p>
          <p>
            A player&apos;s track network must be contiguous back to their
            starting City. Track costs are $2 for plains, $3 for river and lake
            hexes, $4 for mountains, and $6 for high mountains. All lake and
            river hexes have land shown on them and are buildable. The base cost
            for a town hex is $1 plus $1 per exit regardless of terrain type.
            Philadelphia and New York City can only be connected directly by
            paying $3 or $6 to place a disc on the spaces shown; two players can
            build here.
          </p>
        </li>

        <li>
          <p>
            <b>Transcontinental Bonus:</b> The first player to connect their
            rail network to San Francisco gets a $10 bonus and moves up the
            income track 1. This money is received after their build and cannot
            be used to pay for the build this turn.
          </p>
        </li>
        <li>
          <p>
            <b>Western Land Grants:</b> Green cubes on hexes in the West
            represent federal land grants to railroad companies. Historically
            these grants provided a source of revenue to the railroad for
            western expansion. When building track on hexes with Land Grant
            cubes, players receive the cube. Land grant hexes do not function
            like a town or City. Land Grant cubes may be used to build track or
            make an additional delivery (see Move Goods). Turn in a cube to
            build a track tile for free. This may be used for any track tile
            during a build and can be used to exceed the tile build limit.
          </p>
        </li>
        <li>
          <p>
            <b>Move Goods:</b>
          </p>
          <ul>
            <li>
              <p>
                <b>Western Expansion:</b> When a player has collected at least 3
                Land Grant cubes from track builds in the West, they may make an
                additional delivery by returning 3 green cubes to the supply
                during the Move Goods phase. Only one additional delivery is
                allowed per player per turn. This is done in turn order after
                all players have completed the two standard delivery phases.
                This bonus delivery can only be used to move goods.
              </p>
            </li>
            <li>
              <p>
                <b>Engine Level:</b> When a player passes one of their
                deliveries to increase their Engine Level they may increase
                their Engine one additional level by paying $10 and returning
                one of their discs from the Bonus Locomotive space to their
                supply. This allows a player to move up the Engine Level Track
                by 2 increments during the Move Goods phase. To use this option,
                select the &quot;Double Locomotive&quot; button during the move
                phase.
              </p>
            </li>
          </ul>
        </li>
        <li>
          <p>
            <b>Income and Expenses:</b> Income reduction continues to increase
            beyond 50, i.e., 51-60 income is -10, 61-70 income is -12, etc.
          </p>
        </li>
      </ul>
    </div>
  );
}
