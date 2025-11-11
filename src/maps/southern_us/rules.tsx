export function SouthernUsRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Setup:</b> Each town starts with a white cube (representing cotton).
          Atlanta starts with 4 goods, Charleston, Svannah, Mobile, New Orleans
          starts with 3, every other city starts with 1.
        </li>
        <li>
          <b>Actions:</b> When a town with a cotton good is urbanized, the
          existing cotton cube is placed on the new city.
        </li>
        <li>
          <b>Move Goods:</b> A cotton cube must end its movement when it enters
          one of the 4 major ports: Charleston, Savannah, Mobile or New Orleans.
          A cotton cube provides an additional bonus of +1 income. Once
          delivered, the cotton cube is removed from the game.
        </li>
        <li>
          <b>Goods Growth:</b> On turns 1-4, Atlanta always receives 1 goods
          cube every turn, drawn directly from the bag, in addition to any goods
          from the goods display.
        </li>
        <li>
          <b>Income Reduction:</b> On turn 4, income reduction is doubled.
        </li>
      </ul>
    </div>
  );
}
