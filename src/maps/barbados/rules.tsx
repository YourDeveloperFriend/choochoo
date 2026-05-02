export function BarbadosRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          When an action is selected, it cannot be selected until all other
          actions have been selected at least once.
        </li>
        <li>Only one share may be issued per turn.</li>
        <li>
          At the end of the game, use cash to buy back each share for $5 each.
          You lose if you cannot buy back every share. Your score is your money
          left over.
        </li>
      </ul>
    </div>
  );
}
