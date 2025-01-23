

export function DetroitRules() {
  return <div>
    <p>Same as base game with the following changes:</p>
    <ul>
      <li><b>Limitted goods:</b> only 1 cube on the goods display for each city and no production action.</li>
      <li><b>In debt:</b> Every player starts with 5/25 shares and no cash.</li>
      <li><b>Engineer:</b> let's you build the cheapest build for free.</li>
      <li><b>Moving goods:</b> must use mostly your track.</li>
      <li><b>Extra expenses:</b> expenses include shares + loco + current round number.</li>
      <li><b>Infinite game:</b> game only ends when everyone but one player goes bankrupt.</li>
      <li><b>Income reduction:</b> lose 1 income for every 5 (instead of 2 for every 10).</li>
      <li><b>Winner:</b> last one remaining, or, if multiple go bankrupt in one round, whoever has the highest income.</li>
    </ul>
  </div>;
}