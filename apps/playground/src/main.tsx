import "@bklit/ui/globals.css";
import { initBklit } from "@bklit/sdk";
import { Toaster } from "@bklit/ui/components/sonner";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "../components/theme-provider";
import routes from "./routes";

const YOUR_PROJECT_ID = import.meta.env.VITE_BKLIT_PROJECT_ID;
const PROJECT_ID = YOUR_PROJECT_ID || "cmh1rrwf7000122floz152tfo";

const NGROK_URL = import.meta.env.VITE_NGROK_URL;
const API_HOST = NGROK_URL
  ? `${NGROK_URL}/api/track`
  : "http://localhost:3000/api/track";

const API_KEY =
  import.meta.env.VITE_BKLIT_API_KEY || import.meta.env.BKLIT_API_KEY;

if (PROJECT_ID) {
  console.log("🎯 Playground: Initializing Bklit SDK...", {
    projectId: PROJECT_ID,
    apiHost: API_HOST,
  });

  try {
    initBklit({
      projectId: PROJECT_ID,
      apiHost: API_HOST,
      apiKey: API_KEY,
      debug: true,
    });
    console.log("✅ Playground: Bklit SDK initialized successfully");
  } catch (error) {
    console.error("❌ Playground: Error initializing Bklit SDK:", error);
  }
} else {
  console.warn("❌ Playground: SITE_ID not configured. Tracking disabled.");
}

const router = createBrowserRouter(routes);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);
