import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

import { AuthProvider } from "./context/AuthContext";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import AppLoader from "./components/AppLoader";

const Root = () => {
  const [booted, setBooted] = useState(false);

useEffect(() => {
  const id = requestAnimationFrame(() => {
    setBooted(true);

    const savedPath = sessionStorage.getItem('spa-path');
    if (savedPath) {
      sessionStorage.removeItem('spa-path');
      sessionStorage.removeItem('spa-redirected');
      window.history.replaceState(null, '', savedPath);
    }
  });

  return () => cancelAnimationFrame(id);
}, []);

  return (
    <>
      {!booted && <AppLoader />}
      <HelmetProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
