import { initBklit } from "@bklit/sdk";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import routes from "./routes";
import "./index.css";

const YOUR_PROJECT_ID = "cmh1rrwf7000122floz152tfo";

// Get the ngrok URL from environment variable
const NGROK_URL = import.meta.env.VITE_NGROK_URL;
const API_HOST = NGROK_URL
  ? `${NGROK_URL}/api/track`
  : "http://localhost:3000/api/track";

// Get the API key from environment variable
const API_KEY =
  import.meta.env.VITE_BKLIT_API_KEY || import.meta.env.BKLIT_API_KEY;

// Debug: Check if SDK is imported correctly
console.log("🔍 Playground: SDK import test", {
  initBklit: typeof initBklit,
  bklitModule: typeof initBklit === "function" ? "✅ Loaded" : "❌ Not loaded",
});

// Debug: Show which API endpoint is being used
console.log("🌐 Playground: API Configuration", {
  ngrokUrl: NGROK_URL || "Not configured",
  apiHost: API_HOST,
  usingNgrok: !!NGROK_URL,
  hasApiKey: !!API_KEY,
});

// Initialize Bklit SDK
if (YOUR_PROJECT_ID) {
  console.log("🎯 Playground: Initializing Bklit SDK...", {
    projectId: YOUR_PROJECT_ID,
    apiHost: API_HOST,
  });

  try {
    initBklit({
      projectId: YOUR_PROJECT_ID,
      apiHost: API_HOST,
      apiKey: API_KEY,
      debug: true, // Enable debug mode to see event tracking logs
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
    <RouterProvider router={router} />
  </React.StrictMode>,
);
