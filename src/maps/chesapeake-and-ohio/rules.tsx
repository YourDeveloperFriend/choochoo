export function ChesapeakeAndOhioRules() {
  return (
    <div>
      <ul>
        <li>
          The Harbor Tunnel link from Baltimore to Newport News may only be
          claimed if Newport News is urbanized.
        </li>
        <li>
          <b>Building:</b> Players may elect to, in lieu of building track,
          build a factory in any city that does not already have one. Building a
          Factory costs $8. There may never be more than one Factory per city.
          Factories are represented by a disc of the player&apos;s color on the
          city.
        </li>
        <li>
          <b>Factory Action:</b> The player that selects the Factory action may
          build track as normal and still build a Factory (at its usual cost of
          $8).
        </li>
        <li>
          <b>Urbanization:</b> When a town is urbanized to a city, a random cube
          from the supply is placed on the New City, along with any cubes that
          had been on the town.
        </li>
        <li>
          <p>
            <b>Moving Goods</b>: When moving goods, a player may move a single
            good the full length allowed by his current Locomotive level, or may
            elect to move multiple goods shorter distances, up to the total
            allowed by his current locomotive level. When moving multiple goods,
            you may not use the same link more than once (across all chained
            deliveries), and each cube after the first must be picked up in the
            city where the last cube was delivered.
          </p>
          <p>
            When a good is moved to a city with a Factory, the player that owns
            the factory in that city gains one income, and 2 goods cube are
            randomly taken from the supply and placed in the city. The cubes are
            placed in the city with the Factory immediately, and may be moved
            immediately if the player has movement available to do so.
          </p>
        </li>
        <li>
          <b>Expenses:</b> In addition to the usual expenses, players also need
          to pay $1 during the expenses phase for each factory they have built.
        </li>
        <li>
          <b>Goods Growth:</b> There is no Goods Growth phase nor is there a
          Production special action.
        </li>
      </ul>
    </div>
  );
}
