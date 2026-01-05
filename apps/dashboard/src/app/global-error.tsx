"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ padding: "2rem", textAlign: "center" }}>
          <h2>Something went wrong!</h2>
          <button onClick={() => reset()} type="button">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
