export function ChicagoLRules() {
  return (
    <div>
      <p>Chicago L is a map for 3 players only.</p>
      <ul>
        <li>
          <b>All track:</b> must be contiguous and branch off cities already
          connected by yours, other players&apos;, or the government&apos;s
          track. This is called the &quot;master network.&quot;
        </li>
        <li>
          <b>Government track:</b> The person who placed 1st in the auction is
          compelled to build Government Track, if possible. The Government can
          only build 1 link each round, but can use up to 4 track to do so. It
          may not leave dangling track. The first Government Link must originate
          at the location that was randomly rolled during setup. Subsequent
          Government Links may be built anywhere as long as they legally connect
          to the master network.
        </li>
        <li>
          The Government Track is neutral track that anyone can ship over as
          though it was owned by another player. However, players who have
          advanced their locomotive <i>up</i> to the higher row of the
          Locomotive track can use some of it for <i>income</i>. Up to 1 of the
          Government Links may be run for Income at rows 2 and 3 of the chart,
          and up to 2 at rows 4 and 5. This is a power that may be used as part
          of your normal delivery allowance, it is not additive to your normal
          Locomotive range, which is the number inside the box.
        </li>
        <li>
          <b>Loop Demand:</b> The Loop demand track has a space for one cube
          each Turn that will be randomly drawn during setup. Each Turn, the
          next cube from this track will be returned to the bag and the color of
          The Loop will be changed to this color. The two hexes of The Loop
          should be treated as a single hex; goods not matching the color of The
          Loop may pass through it, optionally exiting from a different hex than
          the one they entered.
        </li>
        <li>
          Deliveries to The Loop give the current player a bonus $3. This is
          given to the current player regardless of what track was used for the
          delivery.
        </li>
        <li>
          Players may move their locomotive marker to the <i>right</i> on the
          Locomotive track by skipping one of their two goods movements as
          usual. If there is nowhere to move to the right, their Locomotive is
          stuck at that level until they move it <i>up</i> (by winning the
          Locomotive role during the auction).
        </li>
        <li>
          A player&apos;s row on the locomotive track does not impact expenses;
          only the value of their locomotive.
        </li>
        <li>
          <b>Building:</b> Players get 4 builds per turn instead of the normal
          3. Road hexes cost $4. The brown park/cemetery spaces are impassable
          and cannot be built on.
        </li>
        <li>
          <b>New Cities:</b> start with two cubes. There is no Goods Growth or
          production.
        </li>
        <li>
          <b>Shares limit:</b> increases to 20.
        </li>
        <li>
          <b>Auction:</b> if 2+ players pass without bidding, they get no
          special action.
        </li>
        <li>
          <b>Repopulation action:</b> immediately, draw 3 cubes, then place one
          in any city.
        </li>
        <li>
          <b>Engineer:</b> allows you to place one of your builds (the most
          expensive one) for free.
        </li>
        <li>
          <b>Urbanization:</b> uses one of your 4 builds. The two cubes on the
          new city placed with it.
        </li>
        <li>
          <b>Locomotive:</b> the locomotive special action allows you to move
          (vertically) up on the locomotive track, potentially increasing the
          amount of government track that can contribute to your income on a
          delivery. This is the only way to move vertically on the locomotive
          track. Note that not every vertical move increases how much government
          track contributes to income; this happens at every other row.
        </li>
        <li>
          <b>Issue Last:</b> this special action will cause the player who takes
          it to go last in the next issue shares phase.
        </li>
        <li>
          <b>End Game Scoring:</b> Victory point calculation at the end of the
          game has changed to: ((income-shares) * 2) + track.
        </li>
        <li>
          <b>Government track starting location:</b> The starting location for
          government track is chosen by a 2d6 die roll during setup. This city
          will be highlighted until the first government link has been built.
          You can also check the game log for which city was chosen.
          <br />
          2: Midway, 3: Dempster-Skokie, 4: Linden, 5: Damen, 6: Addison, 7: The
          Loop, 8: Belmont, 9: Cottage Grove, 10: Cermak, 11: Forest Park, 12:
          O&apos;Hare
        </li>
      </ul>
    </div>
  );
}
