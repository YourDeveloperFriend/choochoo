export function PittsburghRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Towns:</b> are free to build.
        </li>
        <li>
          <b>Non-straight simple track:</b> costs $3.
        </li>
        <li>
          <b>Complex track w/o straight:</b> costs $4.
        </li>
        <li>
          <b>Any straight track:</b> costs $10 (incl. simple track, complex that
          adds a straight, redirecting to straight).
        </li>
        <li>
          <b>Commonwealth action:</b> Reduces the cost of one $10 build to $7.
        </li>
        <li>
          <b>Cities:</b> get goods from white and black sides of the goods
          growth.
        </li>
        <li>
          <b>Game ends:</b> after 8 turns.
        </li>
      </ul>
    </div>
  );
}
