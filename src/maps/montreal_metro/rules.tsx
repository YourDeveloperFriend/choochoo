export function MontrealMetroRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>All track:</b> must be contiguous and branch off cities already
          connected by yours, other players&apos;, or the government&apos;s
          track.
        </li>
        <li>
          <b>Goverment track:</b> at the beginning of each round, one complete
          link (at most 3 track) is built for the government, following normal
          build rules. It will be marked in Purple.
        </li>
        <li>
          <b>Locomotive:</b> uses the locomotive track. The Locomotive action
          moves you up the track <i>only</i>. You can only move right on the
          track in lieu of a delivery during move goods. The second number in
          locomotive allows you to use the Goverment track (but still no
          income). Your total expense will be the sum of both numbers (plus
          shares as normal).
        </li>
        <li>
          <b>New Cities:</b> start with one cube. There is no Goods Growth or
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
          <b>Urbanization:</b> uses one of your 3 builds.
        </li>
        <li>
          <b>All track:</b> must be contiguous with each other.
        </li>
        <li>
          <b>Hills:</b> cost $3. Street costs $4. Water costs $6.
        </li>
        <li>
          <b>Parc Mont-Royal:</b> may not be built on, as indicated by the red
          border.
        </li>
      </ul>
    </div>
  );
}
