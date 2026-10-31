"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useEvents } from "../use-events";
import { ChatSession } from "./session";
import type { EventRecord } from "@/types";
import "./panel.css";
import "../../app/event-app.css";
import "../../app/assistant.css";
export default function UtsavPanel({
  routeEventId,
  onClose,
}: {
  routeEventId?: string;
  onClose: () => void;
}) {
  const { snapshot, error, reload, replaceSaved } = useEvents();
  const [selection, setSelection] = useState(routeEventId ?? "general");
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const event = snapshot?.events.find((item) => item.id === selection);
  const theme = event?.brief.category ?? "general";
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    heading.current?.focus();
    const viewport = window.visualViewport;
    const size = () => {
      const height = viewport?.height ?? window.innerHeight;
      node.style.setProperty("--utsav-height", `${Math.min(740, height - 24)}px`);
      node.style.setProperty(
        "--utsav-bottom",
        `${Math.max(12, window.innerHeight - height - (viewport?.offsetTop ?? 0) + 12)}px`,
      );
    };
    size();
    viewport?.addEventListener("resize", size);
    viewport?.addEventListener("scroll", size);
    return () => {
      viewport?.removeEventListener("resize", size);
      viewport?.removeEventListener("scroll", size);
      node.close();
    };
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) {
        reload();
        if (routeEventId) {
          setSelection(routeEventId);
          setNotice("");
        }
      }
    });
    return () => {
      active = false;
    };
  }, [routeEventId, reload]);
  function saved(record: EventRecord) {
    if (record.brief.budget !== event?.brief.budget)
      setNotice("Budget saved. Your task progress and preferences have been preserved.");
    replaceSaved(record);
  }
  const context = event ? JSON.stringify([event.brief, event.plan]) : "general";
  return (
    <dialog
      ref={dialog}
      id="utsav-dialog"
      className={`utsav-sheet utsav-${theme}`}
      aria-labelledby="utsav-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <header className="utsav-header">
        <span className="utsav-header-mark" aria-hidden="true">
          <Image
            src={`/images/utsav/${theme === "general" ? "community" : theme}.png`}
            alt=""
            width={46}
            height={46}
          />
        </span>
        <div>
          <h2 id="utsav-title" ref={heading} tabIndex={-1}>
            Utsav
          </h2>
          <p>Your celebration companion</p>
        </div>
        <button type="button" className="utsav-close" onClick={onClose} aria-label="Close Utsav">
          ×
        </button>
      </header>
      <div className="utsav-context">
        <label htmlFor="utsav-event">Planning together</label>
        <select
          id="utsav-event"
          value={selection}
          onChange={(e) => {
            setSelection(e.target.value);
            setNotice("");
          }}
        >
          <option value="general">General planning</option>
          {snapshot?.events.map((item) => (
            <option key={item.id} value={item.id}>
              {item.brief.name}
            </option>
          ))}
          {selection !== "general" && !event ? (
            <option value={selection}>Unavailable event</option>
          ) : null}
        </select>
      </div>
      {notice ? (
        <p role="status" className="utsav-notice">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="utsav-warning" role="alert">
          {error} General chat is still available.
        </p>
      ) : null}
      {selection !== "general" && !event ? (
        <div className="utsav-unavailable">
          <p role="alert">This event is unavailable. Choose another event or General planning.</p>
          <button onClick={reload}>Reload saved events</button>
        </div>
      ) : (
        <ChatSession
          key={selection + context}
          thread={selection}
          event={event}
          onSaved={saved}
          onClose={onClose}
        />
      )}
    </dialog>
  );
}
