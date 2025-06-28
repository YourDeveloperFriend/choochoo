export function DenmarkRules() {
  return (
    <div>
      <p>
        Denmark supports 3 through 6 players and is particularly recommended for
        3 players. The rules for Denmark make significant changes to the way
        shares and increasing your Locomotive works.
      </p>
      <ul>
        <li>Each player starts with $12 and an income of -4.</li>
        <li>
          Players can have negative income and only go bankrupt if their income
          is at -10 or below during the expenses phase.
        </li>
        <li>
          When taking shares, each share is worth $6. Instead of increasing your
          shares, your income instead goes down by 1 for each share. There is no
          limit to the number of shares you can take.
        </li>
        <li>The color of Europe is randomly determined during setup.</li>
        <li>
          The same player may not build multiple direct connections between the
          same two locations (towns or cities).
        </li>
        <li>
          The aqua spaces are bays/fjords and cost $4 to build on. Towns cost
          their terrain price plus $1 per exit. All tile upgrades are $3.
        </li>
        <li>
          Players can build up to two sea links during their turn. A single
          player cannot claim both spots on a given sea link.
        </li>
        <li>
          Sea links can be built to towns even if the town is not yet urbanized.
          However, goods cannot be moved across the sea link until track is laid
          from the town to the sea link. When a player does this, the track is
          unowned: it does not contribute to income during move goods and does
          not count for points.
        </li>
        <li>The maximum loco is 9.</li>
        <li>
          <p>
            The trains needed when increasing loco are limited. Players may only
            increase to the next largest value which all of the other players
            have not reached or exceeded yet, limited by the maximum of 9. This
            may require increasing loco by more than +1 in a single step. The
            player&apos;s income is reduced by -$2 for each +1 increase in
            Links.
          </p>
          <p>
            Example: In a 3-player game, Alice has 2 loco, Bob has 6 loco, and
            Charles has 7 loco. The next available loco for Alice is 7.
            Bob&apos;s next available loco is also 7, and for Charles it is 8.
          </p>
          <p>
            Example: In another game, Alice has 3 loco while Bob and Charles
            both have 5. The next available loco for everyone is 6.
          </p>
        </li>
        <li>
          The Locomotive special action allows a player to deliver as if their
          Links were at the next larger available value during the current turn
          only.
        </li>
        <li>
          <b>Instant Production:</b> Immediately upon each delivery the active
          player removes the top cube from the matching space on the Goods
          Production Chart for either the city the cube was delivered from or
          the city it was delivered to, and places them in that city on the
          board. The new goods cubes are immediately available for delivery. If
          there are no more cubes on the Goods Production Chart to remove for
          the desired city then a random cube is drawn from the cup and placed
          on the Goods Production Chart for that city. In the case that both
          Goods Production Chart columns are empty the goods cube may be drawn
          before assignment to a city There is no Production action or
          Production Phase
        </li>
        <li>
          Income reduction is $2 for incomes of $1-$5, $4 for incomes of $6-$10,
          $6 for $11-$15, $8 for $16-$20 and $10 for everything larger than
          that.
        </li>
      </ul>
    </div>
  );
}
