import "../event-app.css";
import "../assistant.css";
import type { ReactNode } from "react";
import { Header, Footer } from "@/components/shell";

export default function EventsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="event-app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
    </div>
  );
}
