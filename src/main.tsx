import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReactRouterAdapter } from "./routing/ReactRouterAdapter";
import { HashRouter } from "react-router-dom";
import "./index.css";
import "./monacoSetup";
import App from "./App.tsx";
import { ToastProvider } from "./components/primitives/Toast";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AnnotationsProvider } from "./annotations/AnnotationsContext";
import SettingsMenu from "./components/devtools/SettingsMenu";
import AnnotationsPanel from "./components/devtools/AnnotationsPanel";
import AnnotationsFrame from "./components/devtools/AnnotationsFrame";
import { setAssetBase } from "./utils/assets";
import ApiProvider from "./api/ApiProvider";

// Vite serves the replica under a base path; the library never reads it itself.
setAssetBase(import.meta.env.BASE_URL);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiProvider>
      <ThemeProvider>
        <HashRouter>
          <ReactRouterAdapter>
            <AnnotationsProvider>
              <ToastProvider>
                <AnnotationsFrame>
                  <App />
                </AnnotationsFrame>
              </ToastProvider>
              {/* Demo tooling, outside the Lightning UI: annotations and themes. */}
              <AnnotationsPanel />
              <SettingsMenu />
            </AnnotationsProvider>
          </ReactRouterAdapter>
        </HashRouter>
      </ThemeProvider>
    </ApiProvider>
  </StrictMode>
);
