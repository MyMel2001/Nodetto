import { Buffer } from "buffer";
import process from "process";

if (typeof window !== "undefined") {
  window.Buffer = Buffer;
  window.process = process;
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
