import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  // Track page view and log to console
  useEffect(() => {
    document.title = "Playground Home | Bklit";
    console.log("🎯 PLAYGROUND: Tracking page view on home page");
    if (window.trackPageView) {
      window.trackPageView();
      console.log("🎯 PLAYGROUND: trackPageView called successfully");
    } else {
      console.warn("🎯 PLAYGROUND: trackPageView function not available");
    }
  }, []);
  return (
    <>
      <h1>Vite + React Playground</h1>
      <p className="read-the-docs">
        This site is a testbed for Bklit analytics.
      </p>
      <nav style={{ marginBottom: 16 }}>
        <Link to="/">Home</Link> | <Link to="/products">Products</Link>
      </nav>

      <button data-bklit-event="test-me" type="button">
        Click Me
      </button>
    </>
  );
}
