import { MANIFEST_PENALTIES } from "./state";

export function Fac51ManifestReview({
  currentLevel,
  skipped,
}: {
  currentLevel: number;
  skipped: number;
}) {
  const nextLevel = currentLevel + skipped;
  const currentPenalty = MANIFEST_PENALTIES[currentLevel];
  const nextPenalty = MANIFEST_PENALTIES[nextLevel];
  return (
    <>
      {skipped > 0 ? (
        <p>
          This delivery skips{" "}
          <strong>
            {skipped} {skipped === 1 ? "city" : "cities"}
          </strong>{" "}
          that would accept this cube. Your Manifest advances by {skipped}{" "}
          {skipped === 1 ? "level" : "levels"}.
        </p>
      ) : (
        <p>This delivery does not increase your Manifest.</p>
      )}
      <table className="ui definition table">
        <tbody>
          <tr>
            <td>Current Manifest</td>
            <td>
              Level {currentLevel}/6 · −{currentPenalty} points
            </td>
          </tr>
          {nextLevel <= 6 ? (
            <>
              <tr>
                <td>Additional penalty for this delivery</td>
                <td>−{nextPenalty - currentPenalty} points</td>
              </tr>
              <tr>
                <td>Total Manifest after this delivery</td>
                <td>
                  Level {nextLevel}/6 · −{nextPenalty} points
                </td>
              </tr>
            </>
          ) : (
            <tr>
              <td colSpan={2}>
                This delivery would exceed the Manifest limit of six levels.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <p>Manifest points are deducted from your final score.</p>
    </>
  );
}
