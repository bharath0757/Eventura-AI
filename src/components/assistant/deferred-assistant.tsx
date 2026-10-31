"use client";
import type { AssistantProps } from "./use-assistant";
import { openUtsav } from "../utsav/events";
export function DeferredAssistant({ event }: AssistantProps) {
  return (
    <section
      id="assistant"
      className="panel dashboard-section wide-section ai-panel"
      aria-labelledby="utsav-entry-title"
    >
      <p className="eyebrow">A little guidance, shaped around you</p>
      <h2 id="utsav-entry-title">Meet Utsav, your celebration companion.</h2>
      <p>
        Ideas, answers and protected budget options for {event.brief.name}. Your plan changes only
        after you confirm.
      </p>
      <button className="button button-dark" type="button" onClick={openUtsav}>
        Open assistant
      </button>
    </section>
  );
}
