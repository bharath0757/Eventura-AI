"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { AssistantProps } from "./use-assistant";
import { Button } from "../controls";

const Assistant = dynamic(() => import("../ai-assistant").then((module) => module.AIAssistant), {
  ssr: false,
  loading: () => <AssistantPlaceholder loading />,
});

function AssistantPlaceholder({
  loading = false,
  onOpen,
}: {
  loading?: boolean;
  onOpen?: () => void;
}) {
  return (
    <section
      id="assistant"
      className="panel dashboard-section wide-section ai-panel"
      aria-labelledby="assistant-title"
      aria-busy={loading}
    >
      <div className="ai-heading">
        <span className="ai-symbol" aria-hidden="true">
          ✦
        </span>
        <div>
          <p className="eyebrow">A little guidance, shaped around you</p>
          <h2 id="assistant-title">Your AI planning assistant.</h2>
          <p className="muted">Ideas, answers and budget options for your occasion.</p>
        </div>
      </div>
      {loading ? (
        <p role="status">Opening your assistant…</p>
      ) : (
        <>
          <p className="ai-privacy">
            Open the assistant to review ideas, ask a question or explore a budget option. Guidance
            is requested only when you choose an assistant action.
          </p>
          <Button onClick={onOpen}>Open assistant</Button>
        </>
      )}
    </section>
  );
}

/** Load below-the-fold assistant code only when the section becomes useful. */
export function DeferredAssistant(props: AssistantProps) {
  const container = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [focusOnLoad, setFocusOnLoad] = useState(false);

  useEffect(() => {
    if (open) return;
    const openFromHash = () => {
      if (window.location.hash !== "#assistant") return;
      // A direct hash can arrive before browser-local records have hydrated.
      container.current?.scrollIntoView?.({ block: "start" });
      setFocusOnLoad(true);
      setOpen(true);
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                setOpen(true);
                observer?.disconnect();
              }
            },
            { rootMargin: "300px" },
          );
    if (container.current) observer?.observe(container.current);
    return () => {
      observer?.disconnect();
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [open]);

  return (
    <div ref={container}>
      {open ? (
        <Assistant {...props} focusOnLoad={focusOnLoad} />
      ) : (
        <AssistantPlaceholder
          onOpen={() => {
            setFocusOnLoad(true);
            setOpen(true);
          }}
        />
      )}
    </div>
  );
}
