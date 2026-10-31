"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { AIAssistant } from "../ai-assistant";
import type { EventRecord } from "@/types";
import { createChatHistory, type ChatMessage } from "@/lib/utsav/history";
import { chatResultSchema } from "@/lib/ai/chat-contracts";
import { formatDate } from "@/lib/dates";
import { recordStore } from "@/lib/storage/records";
const historyStore = createChatHistory();
function initial(thread: string) {
  try {
    return { messages: historyStore.load(thread), warning: "" };
  } catch (e) {
    return {
      messages: [] as ChatMessage[],
      warning:
        e instanceof Error
          ? e.message
          : "Chat history is unavailable. This conversation will remain in this session.",
    };
  }
}
function Invitation({ text }: { text: string }) {
  const id = useId();
  const [draft, setDraft] = useState(text);
  const [status, setStatus] = useState("");
  return (
    <div className="utsav-invitation">
      <label htmlFor={id}>Invitation draft</label>
      <textarea id={id} value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={4000} />
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(draft);
            setStatus("Invitation copied.");
          } catch {
            setStatus("Copy is unavailable. Select and copy the draft above.");
          }
        }}
      >
        Copy invitation
      </button>
      <span role="status">{status}</span>
    </div>
  );
}
export function ChatSession({
  thread,
  event,
  onSaved,
  onClose,
}: {
  thread: string;
  event?: EventRecord;
  onSaved: (record: EventRecord) => void;
  onClose: () => void;
}) {
  const [view, setView] = useState(() => initial(thread));
  const [input, setInput] = useState("");
  const [purpose, setPurpose] = useState<"chat" | "invitation">("chat");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tools, setTools] = useState<"recommendations" | "optimize" | null>(null);
  const [clearing, setClearing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | null>(null);
  const locked = useRef(false);
  const alive = useRef(true);
  const messages = useRef(view.messages);
  const context = event ? JSON.stringify([event.brief, event.plan]) : "general";
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView?.({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "nearest",
    });
  }, [view.messages.length, busy]);
  function persist(next: ChatMessage[]) {
    let warning = view.warning;
    let kept = next.slice(-50);
    try {
      kept = historyStore.save(thread, next);
      warning = "";
    } catch (e) {
      warning =
        e instanceof Error
          ? e.message
          : "Chat could not be saved. It remains available in this session.";
    }
    messages.current = kept;
    setView({ messages: kept, warning });
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setTools(null);
    const history = messages.current
      .slice(-8)
      .map(({ role, text }) => ({ role, text: text.slice(0, 2400) }));
    persist([...messages.current, { id: crypto.randomUUID(), role: "user", text: message }]);
    setInput("");
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 70_000);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history,
          purpose,
          ...(event ? { context: { brief: event.brief, plan: event.plan } } : {}),
        }),
        signal: abort.signal,
      });
      const raw: unknown = await response.json();
      if (!response.ok)
        throw new Error(
          typeof raw === "object" &&
            raw !== null &&
            "error" in raw &&
            typeof raw.error === "object" &&
            raw.error !== null &&
            "message" in raw.error &&
            typeof raw.error.message === "string"
            ? raw.error.message
            : "Utsav could not answer. Your plan is unchanged.",
        );
      const result = chatResultSchema.parse(raw);
      if (!alive.current || abort.signal.aborted) return;
      if (event) {
        const current = recordStore().get(event.id);
        if (!current || JSON.stringify([current.brief, current.plan]) !== context)
          throw new Error("Your event changed. Ask again using the updated plan.");
      }
      persist([
        ...messages.current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: result.reply,
          source: result.source,
          notice: result.message,
          purpose,
        },
      ]);
      setPurpose("chat");
    } catch (e) {
      if (alive.current) {
        setError(
          abort.signal.aborted
            ? "Request stopped. Your saved plan is unchanged."
            : e instanceof Error
              ? e.message
              : "Utsav is unavailable. Please try again.",
        );
        setInput(message);
      }
    } finally {
      clearTimeout(timer);
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function priorities() {
    if (!event || busy) return;
    const tasks = event.plan.timeline
      .filter((item) => item.status !== "completed")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3);
    const text = tasks.length
      ? tasks.map((item, i) => `${i + 1}. ${item.title} — ${formatDate(item.dueDate)}`).join("\n")
      : "Your timeline tasks are complete. Review your vendor checklist and confirm the final arrangements.";
    persist([
      ...messages.current,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text,
        source: "rule-based",
        notice: "From your saved plan. No AI request was made.",
      },
    ]);
    setTools(null);
  }
  const category = event?.brief.category ?? "community";
  return (
    <>
      <div className="utsav-toolbar">
        <button type="button" onClick={() => setTools(null)} aria-pressed={!tools}>
          Conversation
        </button>
        {event ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => setTools("recommendations")}
              aria-pressed={tools === "recommendations"}
            >
              Personalized ideas
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setTools("optimize")}
              aria-pressed={tools === "optimize"}
            >
              Review my budget
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => setClearing(true)}
          disabled={busy || view.messages.length === 0}
        >
          Clear chat
        </button>
      </div>
      {clearing ? (
        <div className="utsav-confirm">
          <p>Clear this conversation on this device? Your event plan will stay saved.</p>
          <button
            onClick={() => {
              try {
                historyStore.clear(thread);
                messages.current = [];
                setView({ messages: [], warning: "" });
                setClearing(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : "History could not be cleared.");
              }
            }}
          >
            Confirm clear chat
          </button>
          <button onClick={() => setClearing(false)}>Keep conversation</button>
        </div>
      ) : null}
      {view.warning ? (
        <p role="alert" className="utsav-warning">
          {view.warning} Messages remain available in this session.
        </p>
      ) : null}
      <div className="utsav-scroll">
        {tools && event ? (
          <div className="utsav-tools event-app">
            <AIAssistant key={tools} event={event} onSaved={onSaved} initialMode={tools} embedded />
          </div>
        ) : (
          <>
            {view.messages.length === 0 ? (
              <section className="utsav-welcome" aria-label="Welcome to Utsav">
                <Image
                  className="utsav-mascot"
                  src={`/images/utsav/${category}.png`}
                  alt="Utsav, a friendly ivory elephant with festive decorations"
                  width="210"
                  height="180"
                />
                <p className="utsav-kicker">A LITTLE JOY. A LITTLE GUIDANCE.</p>
                <h3>
                  Big moments.
                  <br />
                  <em>Let’s plan them together.</em>
                </h3>
                <p>
                  Namaste!{" "}
                  {event
                    ? `I’m here to help with ${event.brief.name}.`
                    : "I’m Utsav, your celebration companion."}
                </p>
                {event ? (
                  <div className="utsav-quick">
                    <button disabled={busy} onClick={priorities}>
                      What is next?
                    </button>
                    <button
                      onClick={() => {
                        setPurpose("invitation");
                        setInput(
                          "Draft an invitation for this event. Leave placeholders for missing details.",
                        );
                        inputRef.current?.focus();
                      }}
                    >
                      Draft an invitation
                    </button>
                  </div>
                ) : (
                  <div className="utsav-quick">
                    {["wedding", "birthday", "community"].map((item) => (
                      <Link
                        key={item}
                        href={`/events/new?category=${item}`}
                        prefetch={false}
                        onClick={onClose}
                      >
                        Plan a {item === "community" ? "gathering" : item}
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            ) : null}
            <div
              role="log"
              aria-label="Conversation history"
              aria-live="polite"
              aria-relevant="additions"
              className="utsav-messages"
            >
              {view.messages.map((item) => (
                <article className={`utsav-bubble utsav-bubble-${item.role}`} key={item.id}>
                  <strong>{item.role === "user" ? "You" : "Utsav"}</strong>
                  {item.purpose === "invitation" && item.role === "assistant" ? (
                    <Invitation text={item.text} />
                  ) : (
                    <p>{item.text}</p>
                  )}
                  {item.role === "assistant" ? (
                    <small>
                      {item.notice?.startsWith("From your saved plan")
                        ? "From your saved plan"
                        : item.source === "live-ai"
                          ? "AI-generated Â· Live Gemini"
                          : "Rule-based fallback"}
                    </small>
                  ) : null}
                  {item.notice ? <span className="utsav-source-note">{item.notice}</span> : null}
                </article>
              ))}
            </div>
            {busy ? (
              <p className="utsav-thinking" role="status">
                Utsav is thinking<span aria-hidden="true"> Â· Â· Â·</span>
              </p>
            ) : null}
            <div ref={bottom} />
          </>
        )}
      </div>
      <div className="utsav-composer-wrap">
        {error ? (
          <p role="alert" className="utsav-warning">
            {error}
          </p>
        ) : null}
        {event && view.messages.length > 0 && !tools ? (
          <div className="utsav-inline-actions">
            <button onClick={priorities} disabled={busy}>
              Next three priorities
            </button>
            <button
              disabled={busy}
              onClick={() => {
                setPurpose("invitation");
                setInput(
                  "Draft an invitation for this event. Leave placeholders for missing details.",
                );
                inputRef.current?.focus();
              }}
            >
              Draft invitation
            </button>
          </div>
        ) : null}
        <form onSubmit={send} className="utsav-composer">
          <label htmlFor="utsav-message" className="sr-only">
            Message Utsav
          </label>
          <textarea
            ref={inputRef}
            id="utsav-message"
            rows={2}
            maxLength={1000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              purpose === "invitation" ? "Describe your invitation…" : "Ask about your event…"
            }
            disabled={busy}
            aria-describedby="utsav-privacy"
          />
          <button
            type={busy ? "button" : "submit"}
            disabled={!busy && !input.trim()}
            onClick={busy ? () => controller.current?.abort() : undefined}
            aria-label={busy ? "Stop response" : "Send message"}
          >
            {busy ? "Stop" : "↑"}
          </button>
        </form>
        <p id="utsav-privacy" className="utsav-privacy">
          Only this conversation’s latest 8 messages{event ? " and selected event" : ""} are sent to
          Gemini when you send. History stays on this device. Your plan changes only after
          confirmation.
        </p>
      </div>
    </>
  );
}
