import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Theme } from "@radix-ui/themes";
import { Provider } from "react-redux";
import store from "./redux toolkit/store";
import './i18n';
import ReactGA from "react-ga4";

ReactGA.initialize("G-58XC1WLCYW");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <React.StrictMode>
      <Theme>
        <App />
      </Theme>
    </React.StrictMode>
  </Provider>
);
