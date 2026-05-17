import { Container, Header } from "semantic-ui-react";

export function InfoPage() {
  return (
    <Container>
      <Header as="h1">Rule Clarifications</Header>
      <p>
        Unless specified by map-specific rules, these are rules that apply by
        default. Whether or not this is consistent with rules written elsewhere,
        this is an explanation of the rules as has been implemented here.
      </p>
      <ul>
        <li>
          <b>Towns:</b> Unless indicated otherwise by map-specific rules, the
          cost to build on town hexes is not impacted by the terrain of the hex
          nor the presence of a river; both of these are strictly aesthetic.
        </li>
        <li>
          <b>Urbanization:</b> Urbanization can be performed at any time during
          the build phase. This is technically not consistent with rules as
          written, but almost never matters and greatly simplifies things. Some
          maps where this is more likely to matter have a different behavior and
          this is indicated in the map-specific rules.
        </li>
        <li>
          <b>Income Reduction:</b> Income reduction maxes out at -10 and starts
          at 50 income.
        </li>
      </ul>

      <Header as="h1">Abandoned Games and Karma</Header>
      <p>
        When you join a game, you are expected to take your turns within the
        length of time specified for the table and to play the game until it is
        completed. There are a few situations where a game could end
        prematurely:
        <ul>
          <li>
            If all players who have not yet been eliminated agree to concede,
            the game will end immediately. The current scores are used to
            determine placement and no one is considered to have abandoned the
            game.
          </li>
          <li>
            A player can choose to abandon a game. This causes the player to be
            treated as bankrupt and the remaining players can continue.
            Abandoning the game negatively impacts your karma score (see below).
            Because there are situations where a single player abandoning a game
            leaves it in a state not worth continuing, other players have the
            option to abandon the game without it impacting their karma.
          </li>
          <li>
            If another player has exceeded the allowed length of time to take
            their turn, any player at the table can kick that player from the
            table. This has the same effect as if the player had chosen to
            abandon the game as described above.
          </li>
        </ul>
      </p>
      <p>
        Karma is a measure of how many games you complete to the end.
        <ul>
          <li>You start at 75 karma.</li>
          <li>
            You gain one karma for every (multiplayer) game you complete, to a
            maximum of 100.
          </li>
          <li>
            You lose 10 karma for every game you abandon (whether voluntary or
            due to a kick out).
          </li>
        </ul>
      </p>
      <p>
        You can set restrictions for tables you create. You can set the minimum
        required karma no higher than your own, minus 5. For example, if you
        have 100 karma, you can make sure that only players with 95 or more can
        join your game!
      </p>
      <p>
        Pay attention to the turn duration of tables when you join them to make
        sure you are able to play games in the expected length of time. Failure
        to do say can result in you getting kicked from the table which will
        impact your karma and may prevent you from joining games in the future
        if done too often!
      </p>
    </Container>
  );
}
