"use client"; // Error boundaries must be Client Components

// Replaces the whole document when the root layout itself fails, so it cannot use the app's
// stylesheet, fonts or theme. Self-contained on purpose; it follows the OS light/dark setting.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <title>Something went wrong — Stockpile</title>
        <style>{`
          body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: system-ui, sans-serif; background: #fafaf9; color: #18181b; }
          main { max-width: 26rem; padding: 2rem; text-align: center; }
          p { color: #52525b; line-height: 1.5; }
          button { margin-top: 0.5rem; padding: 0.6rem 1.2rem; border: 0; border-radius: 0.5rem; background: #047857; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
          small { display: block; margin-top: 1rem; color: #71717a; }
          @media (prefers-color-scheme: dark) { body { background: #09090b; color: #fafafa; } p { color: #a1a1aa; } small { color: #71717a; } }
        `}</style>
        <main>
          <h1>Something went wrong</h1>
          <p>The app hit an unexpected problem. Trying again usually fixes it.</p>
          <button onClick={() => retry()}>Try again</button>
          {error.digest && <small>Reference: {error.digest}</small>}
        </main>
      </body>
    </html>
  );
}
