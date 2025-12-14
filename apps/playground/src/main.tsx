import "@bklit/ui/globals.css";
import { initBklit } from "@bklit/sdk";
import { Button } from "@bklit/ui/components/button";
import { Toaster } from "@bklit/ui/components/sonner";
import { BklitLogo } from "@bklit/ui/icons/bklit";
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
      <div className="flex flex-col bg-blue-700 pb-0 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-3 h-12">
          <div className="flex items-center gap-2">
            <BklitLogo size={16} theme="dark" />
            <span className="text-sm text-white font-medium block sm:hidden">
              Demo store
            </span>
            <span className="text-sm text-white font-medium hidden sm:block">
              Demo this store's analytics in the{" "}
              <a
                href="https://app.bklit.com/?utm_source=playground&utm_medium=referral&utm_campaign=playground"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-white hover:text-blue-100 transition-colors underline hover:no-underline"
              >
                Bklit dashboard
              </a>
            </span>
          </div>
          <Button variant="mono" size="sm" asChild>
            <a
              href="https://app.bklit.com/?utm_source=playground&utm_medium=referral&utm_campaign=playground"
              target="_blank"
              rel="noopener noreferrer"
            >
              <BklitLogo size={16} className="text-black" />
              Open in Bklit
            </a>
          </Button>
        </div>
        <div className="flex bg-blue-700 size-4 absolute left-0 -bottom-4 z-10 after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-4 after:bg-background after:rounded-tl-xl" />
        <div className="flex bg-blue-700 size-4 absolute right-0 -bottom-4 z-10 after:content-[''] after:absolute after:right-0 after:bottom-0 after:w-full after:h-4 after:bg-background after:rounded-tr-xl" />
      </div>
      <div className="flex flex-col flex-1 bg-background pt-12">
        <RouterProvider router={router} />
      </div>
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);
