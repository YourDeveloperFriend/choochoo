export function StalinistRussiaRules() {
  return (
    <div>
      <h2>Turn-Order Auction</h2>
      <p>
        When you pass and this makes you last player, you advance on the
        Stalin&apos;s disfavor track which will give you negative points at the
        end of the game. (Note that the live score display in the player
        overview table includes this.) Additionally, every single build during
        the build phase costs one extra dollar; see the build phase section
        below.
      </p>
      <h2>Special Actions</h2>
      <ul>
        <li>
          <b>Engineer:</b> Is only available at five players, but otherwise
          functions normally, giving the player who takes it 4 builds instead of
          3.
        </li>
        <li>
          <b>Politburo Directive:</b> When you have selected this action, as one
          of your deliveries you may start from Moscow. See additional delivery
          rules concerning Moscow below.
        </li>
        <li>
          <b>Locomotive:</b> When you select this action, you go first during
          the Locomotive phase (see below).
        </li>
      </ul>
      <h2>Locomotive Phase</h2>
      <p>
        This map does not use the usual Locomotive track, and instead uses a
        special locomotive track. Advancing on this track may change both the
        length of your deliviries (the usual engine level) as well as the number
        of deliveries you can make. On this map, there are four delivery rounds
        every move goods phase, with players participating in later phases only
        if their position on the Locomotive track allows it.
      </p>
      <p>
        On this map, you cannot skip deliveries to increase your Locomotive.
        Instead, there is an additional Locomotive phase after choosing special
        actions and before the build phase. During this phase, players choose in
        turn order (with the player who selected the Locomotive special action,
        if any, going first) if they wish to increase their position on the
        Locomotive track. Only a single player may be in at a given box on the
        single-player row at any time. Players cannot increase to a box beyond
        the current round. Regardless of a player&apos;s current position on the
        Locomotive track, the cost to move on the Locomotive track is equal to
        the cost listed on the column. Locomotive does not contribute to
        expenses during the income and expenses phase.
      </p>
      <h2>Building</h2>
      <p>
        At 4 players, every player has 4 builds during the build phase and (as
        noted above) the Engineer special action is not available. At 5 players,
        every player has 3 builds and the Engineer special action is available
        and acts normally.
      </p>
      <p>
        Towns with rivers do cost an extra $1 on top of the usual cost. The
        player who is last in turn order (who received Stalin&apos;s Disfavor
        this round) pays $1 extra per tile lay during the build phase.
      </p>
      <h2>Moving Goods</h2>
      <p>
        Moscow is a special city and will only accept colors of cubes that are
        not already present in the city. When cubes are delivered to Moscow,
        they are left on Moscow rather than being returned to the bag. Cubes
        starting in Moscow cannot be moved out of Moscow unless the player has
        taken the Politburo Directive special action; note that the Politburo
        Directive special action can only be applied to a single delivery.
      </p>
      <h2>Income and Expenses</h2>
      <p>
        Your locomotive level does not contribute towards expenses, only the
        number of shares you have taken.
      </p>
    </div>
  );
}
