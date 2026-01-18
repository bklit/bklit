import "@bklit/ui/globals.css";
import { initBklit, endSession } from "@bklit/sdk";

// #region agent log - DEBUG: Track beforeunload
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'playground/main.tsx:beforeunload',message:'Browser beforeunload fired',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1A'})}).catch(()=>{});
  });
}
// #endregion
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
const IS_DEV = import.meta.env.DEV;

// In development, use the new ingestion service (port 3001)
// In production, use the dashboard API
// Note: SDK will auto-replace /track with /track-event for custom events
const API_HOST = NGROK_URL
  ? `${NGROK_URL}/api/track`
  : IS_DEV
    ? "http://localhost:3001/track"
    : "http://localhost:3000/api/track";

const API_KEY =
  import.meta.env.VITE_BKLIT_API_KEY || import.meta.env.BKLIT_API_KEY;

if (PROJECT_ID) {
  console.log("🎯 Playground: Initializing Bklit SDK...", {
    projectId: PROJECT_ID,
    apiHost: API_HOST,
    mode: IS_DEV ? "development (ingestion service)" : "production",
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                endSession();
                console.log("🔴 Manual session end triggered");
              }}
            >
              End Session
            </Button>
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
