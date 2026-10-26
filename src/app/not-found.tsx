import Link from "next/link";
export default function NotFound() {
  return (
    <main className="recovery-page">
      <h1>This page slipped off the guest list.</h1>
      <p>Create an event or return to your saved plans to get started.</p>
      <Link className="recovery-action" href="/events/new">
        Create an event
      </Link>
    </main>
  );
}
