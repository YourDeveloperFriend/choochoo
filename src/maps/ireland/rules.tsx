import { IrelandVariantConfig } from "../../api/variant_config";
import { RulesProps } from "../view_settings";

export function IrelandRules({ variant: untyped }: RulesProps) {
  const variant = untyped as IrelandVariantConfig;
  return (
    <div>
      <p>Same as base game with the following changes:</p>
      <ul>
        <li>
          <b>Brown hexes:</b> start with a fixed number of goods and won&apos;t
          get any more for the rest of the game. They don&apos;t accept goods
          but still act as stops.
        </li>
        <li>
          <b>Less cities:</b> the game has four less cities and no urbanization
          action.
        </li>
        <li>
          <b>Shorter:</b> The game has one less turn than the base game.
        </li>
        <li>
          <b>Sea routes:</b> are pre-built track that can be claimed for
          $6/each. It counts as one of your builds, and can only be done once
          per turn.
        </li>
        <li>
          <b>Unpassable edges:</b> cannot build through edges of some hexes in
          the map.
        </li>
        <li>
          <b>Multiple color cities:</b> accept goods of multiple colors.
        </li>
        <li>
          <b>Deurbanization:</b> lets you remove any cube from the board just
          before the move goods action.
        </li>
        {variant.locoVariant && (
          <li>
            <b>[Variant] Locomotive:</b> only temporarily gives you a +1, does
            not increase your expenses and reverts at the end of the round.
          </li>
        )}
        {!variant.locoVariant && (
          <li>
            <b>Locomotive:</b> lets you perform the loco action for both move
            actions.
          </li>
        )}
      </ul>
    </div>
  );
}
