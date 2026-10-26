"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="recovery-page">
      <h1>Something interrupted the plan.</h1>
      <p>Please try again. Your saved browser data has not been cleared.</p>
      <button className="recovery-action" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
