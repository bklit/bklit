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

const IS_DEV = import.meta.env.DEV;

// WebSocket configuration
// Development: ws://localhost:8080 (local WebSocket server)
// Production: wss://bklit.ws
const WS_HOST = IS_DEV ? "ws://localhost:8080" : "wss://bklit.ws";

const API_KEY =
  import.meta.env.VITE_BKLIT_API_KEY || import.meta.env.BKLIT_API_KEY;

if (PROJECT_ID) {
  console.log("🎯 Playground: Initializing Bklit SDK...", {
    projectId: PROJECT_ID,
    wsHost: WS_HOST,
    mode: IS_DEV ? "development (WebSocket)" : "production",
  });

  try {
    initBklit({
      projectId: PROJECT_ID,
      wsHost: WS_HOST,
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
      <div className="fixed top-0 right-0 left-0 z-50 flex flex-col bg-blue-700 pb-0">
        <div className="flex h-12 items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <BklitLogo size={16} theme="dark" />
            <span className="block font-medium text-sm text-white sm:hidden">
              Demo store
            </span>
            <span className="hidden font-medium text-sm text-white sm:block">
              Demo this store's analytics in the{" "}
              <a
                className="font-bold text-white underline transition-colors hover:text-blue-100 hover:no-underline"
                href="https://app.bklit.com/?utm_source=playground&utm_medium=referral&utm_campaign=playground"
                rel="noopener noreferrer"
                target="_blank"
              >
                Bklit dashboard
              </a>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="mono">
              <a
                href="https://app.bklit.com/?utm_source=playground&utm_medium=referral&utm_campaign=playground"
                rel="noopener noreferrer"
                target="_blank"
              >
                <BklitLogo className="text-black" size={16} theme="light" />
                Open in Bklit
              </a>
            </Button>
          </div>
        </div>
        <div className="absolute -bottom-4 left-0 z-10 flex size-4 bg-blue-700 after:absolute after:bottom-0 after:left-0 after:h-4 after:w-full after:rounded-tl-xl after:bg-background after:content-['']" />
        <div className="absolute right-0 -bottom-4 z-10 flex size-4 bg-blue-700 after:absolute after:right-0 after:bottom-0 after:h-4 after:w-full after:rounded-tr-xl after:bg-background after:content-['']" />
      </div>
      <div className="flex flex-1 flex-col bg-background pt-12">
        <RouterProvider router={router} />
      </div>
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>
);
