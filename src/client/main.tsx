import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import 'semantic-ui-css/semantic.min.css';
import "./index.css";
import {App} from "./root/app";

const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);
