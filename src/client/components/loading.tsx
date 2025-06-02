import { loadingContainer } from "./loading.module.css";
import { Loader } from "semantic-ui-react";

export function Loading() {
  return (
    <div className={loadingContainer}>
      <Loader active inline />
    </div>
  );
}
