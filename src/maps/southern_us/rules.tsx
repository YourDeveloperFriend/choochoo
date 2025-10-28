export function SouthernUsRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> Each town starts with a wite cube (representing cotton).
          Atlanta starts with 4 goods, Charleston, Svannah, Mobile, New Orleans
          starts with 3, every other city starts with 1.
        </li>
        <li>
          <b>Actions:</b> When a Town with a Cotton Good is Urbanized, the
          existing Cotton cube is placed on the New City..
        </li>
        <li>
          <b>Move Goods:</b> A Cotton cube must end its movement when it enters
          one of the 4 major ports: Charleston, Savannah, Mobile or New Orleans.
          A Cotton cube provides an additional bonus of +1 Income. Once
          delivered, the Cotton cube is removed from the game..
        </li>
        <li>
          <b>Goods Growth:</b> On Turns 1-4, Atlanta always receives 1 Goods
          cube every turn, drawn directly from the bag, in addition to any Goods
          from the Goods display.
        </li>
        <li>
          <b>Income Reduction:</b> On Turn 4, Income Reduction is doubled.
        </li>
      </ul>
    </div>
  );
}
