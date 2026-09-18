export function IsleOfWightRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Length:</b> 9 turns at three players, 8 turns at four players.
        </li>
        <li>
          <b>Shares:</b> players may issue up to 25 shares.
        </li>
        <li>
          <b>No locomotive track:</b> range comes from train cards instead. A
          new Buy Trains step runs after the auction, in reverse player order.
        </li>
        <li>
          <b>Buy Trains:</b> you may only buy from the lowest layer of trains
          still in the deck, and may never hold more than 2 trains. You buy all
          of your trains for the turn at once.
        </li>
        <li>
          <b>Deliveries:</b> each train card has numbered boxes. Using a train
          fills its next open box (left to right) with the delivered cube, and
          the number in that box is the range of the delivery. Each train may
          only be used once per turn, and each delivery needs its own train, so
          two deliveries require two trains.
        </li>
        <li>
          <b>Work in the factories:</b> instead of a delivery, exhaust an unused
          train (even a full one) and add a cube of the matching colour, drawn
          from the bag, to a city you are connected to by complete or dangling
          track.
        </li>
        <li>
          <b>Build track:</b> only the simple tiles and lollipops are available
          at first, and only 2 tile lays per turn. The first 3-train sold
          releases the dedicated three-exit town tiles; the first 5-train sold
          releases the complex tiles and raises the limit to 3 tile lays.
        </li>
        <li>
          <b>Roles:</b> Locomotive, Engineer and Production do not exist. Two
          new roles do:
          <ul>
            <li>
              <b>Repair Crew:</b> immediately remove up to 2 goods, in total,
              from your train cards. Goods are remove from trains right-to-left.
              You can remove goods twice from a single train, or remove one good
              from two different trains.
            </li>
            <li>
              <b>Haggle:</b> receive a coupon, usable at any time, for 50% off a
              train (discount rounded down). Two coupons on one train make it
              free.
            </li>
          </ul>
          Turn Order Pass does not exist at three players.
        </li>
        <li>
          <b>Auction:</b> at three players, if 2+ players pass without bidding,
          they get no role.
        </li>
        <li>
          <b>Expenses:</b> shares only. Trains have no upkeep.
        </li>
        <li>
          <b>Scrap:</b> after income and expenses, in reverse player order,
          players may discard any of their trains. Goods on a scrapped train go
          back to the bag.
        </li>
        <li>
          <b>No goods growth.</b> Cities and towns start with their cubes, and
          new city tiles come with cubes already on them.
        </li>
        <li>
          <b>Terrain:</b> hills cost $3 base. Terrain under a town is ignored
          when working out the cost.
        </li>
      </ul>
    </div>
  );
}
