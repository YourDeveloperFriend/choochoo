import { BuilderHelper } from "../../engine/build/helper";
import { inject } from "../../engine/framework/execution_context";
import { getTileTypeString } from "../../engine/state/tile";
import { useIsAdmin } from "../services/me";
import { useInject } from "../utils/injection_context";

export function TrackManifest() {
  const adminMode = useIsAdmin();

  const manifest = useInject(() => inject(BuilderHelper).trackManifest(), []);

  if (!adminMode) return <></>;

  return (
    <div>
      <h3>Track Manifest</h3>
      {[...manifest.entries()].map(([key, value]) => (
        <p key={key}>
          {getTileTypeString(key)}={value}
        </p>
      ))}
    </div>
  );
}
