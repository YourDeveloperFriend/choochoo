export function ScotlandRules() {
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Mountains with a river:</b> cost $5 to build over.
        </li>
        <li>
          <b>Ferry links:</b> the ferry connections (Stornoway-Ullapool & Belfast-Ayr) cost $6 and can only be built once both of respective towns on each side are urbanized.
        </li>
        <li>
          <b>Ayr-Glasgow connection:</b> can be claimed at the cost of $2 and functions as a link between the cities regardless if Ayr is urbanized or not.  
        </li>
        <li>
          <b>Turn Order action:</b> skips auction entirely on next turn giving priority to the player who has taken that action.
        </li>
        <li>
          <b>Goods growth:</b> rolls 4 dice each turn.
        </li>
        <li>
          <b>Game ends:</b> after 8 turns.
        </li>
      </ul>
      <p>This is a 2-player implementation of Scotland map on Choochoo. Please do check out <a href="https://eot.coderealms.io/">Era of Trains</a> for a higher player count variant and other maps.</p>
      <br />
    </div>
  );
}
