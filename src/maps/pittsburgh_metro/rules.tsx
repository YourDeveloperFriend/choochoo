export function PittsburghMetroRules() {
  return (
    <div>
      <ul>
        <li>
          Each round, a town is automatically urbanized before the Issue Shares
          phase. The towns and order the new cities are randomly determined
          during setup.
        </li>
        <li>
          <b>Auction:</b> In a 3 player game, if two or more players pass
          without taking a bid, those players do not get a special action.
        </li>
        <li>
          <b>Special Actions:</b> The Urbanization and Production special
          actions are not used. Turn Order Pass is only available at 4+ player
          counts. Stroll is a new special action available at all player counts.
        </li>
        <li>
          <b>Stroll:</b> The player who selects this special action may
          immediately move one cube from one city to a different city within
          three hexes.
        </li>
        <li>
          <b>Building Track:</b> The water hexes represent river spaces. The
          base cost for building on plains (light green) is $2, hills (medium
          green) are $3, roads and river hexes are $4, and golf courses (dark
          green) are $6. Furthermore, complex track may never be built on river
          hexes.
        </li>
        <li>
          The Tourist Attraction cities function as white cities: they accept
          white cubes, white cubes cannot pass through them, and all other
          colors may pass through them.
        </li>
        <li>
          <b>Goods Growth:</b> is skipped.
        </li>
        <li>
          <b>Game Length:</b> is 9 rounds for 3 players, 8 rounds for 4 players,
          and 7 rounds for 5 players.
        </li>
      </ul>
    </div>
  );
}
