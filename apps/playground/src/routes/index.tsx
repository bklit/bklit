import { useEffect } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  // Might be able to remove this later
  useEffect(() => {
    document.title = "Playground Home | Bklit";
    if (window.trackPageView) window.trackPageView();
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
