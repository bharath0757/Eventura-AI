"use client";
import { useState, useSyncExternalStore } from "react";
import type { EventRecord } from "@/types";
import { recordStore, STORAGE_KEY, type EventSnapshot } from "@/lib/storage/records";

interface EventsView {
  snapshot: EventSnapshot | null;
  error: string;
}

// Server HTML and its first hydration render share this browser-independent view.
const SERVER_VIEW: EventsView = { snapshot: null, error: "" };
const getServerSnapshot = () => SERVER_VIEW;

function createEventsAdapter() {
  let view = SERVER_VIEW;
  let invalidated = true;
  const listeners = new Set<() => void>();

  function getSnapshot(): EventsView {
    if (invalidated) {
      invalidated = false;
      try {
        view = { snapshot: recordStore().list(), error: "" };
      } catch (error) {
        view = {
          snapshot: view.snapshot,
          error: error instanceof Error ? error.message : "Saved events could not be loaded.",
        };
      }
    }
    return view;
  }

  function notify() {
    for (const listener of listeners) listener();
  }

  function reload() {
    invalidated = true;
    notify();
  }

  function changed(event: StorageEvent) {
    if (event.key === STORAGE_KEY || event.key === null) reload();
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (listeners.size === 1) {
      window.addEventListener("storage", changed);
      // Close the render-to-subscription gap: a cross-tab write could have
      // happened before this listener existed. React checks again after subscribe.
      invalidated = true;
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        window.removeEventListener("storage", changed);
        // A later subscription must observe changes made while disconnected.
        invalidated = true;
        view = SERVER_VIEW;
      }
    };
  }

  // Persistence already validated the returned record. Keep warnings and avoid a
  // second full storage read, validation pass and sort after a local mutation.
  function replaceSaved(record: EventRecord) {
    if (!view.snapshot) return;
    view = {
      ...view,
      snapshot: {
        ...view.snapshot,
        events: view.snapshot.events.map((event) => (event.id === record.id ? record : event)),
      },
    };
    invalidated = false;
    notify();
  }

  function removeSaved(id: string) {
    if (!view.snapshot) return;
    view = {
      ...view,
      snapshot: {
        ...view.snapshot,
        events: view.snapshot.events.filter((event) => event.id !== id),
      },
    };
    invalidated = false;
    notify();
  }

  return { getSnapshot, subscribe, reload, replaceSaved, removeSaved };
}

let browserAdapter: ReturnType<typeof createEventsAdapter> | undefined;
function sharedAdapter() {
  if (typeof window === "undefined") return createEventsAdapter();
  return (browserAdapter ??= createEventsAdapter());
}

/** Subscribe to browser-local records without deferring hydration to a transition. */
export function useEvents() {
  const [adapter] = useState(sharedAdapter);
  const view = useSyncExternalStore(adapter.subscribe, adapter.getSnapshot, getServerSnapshot);
  return {
    ...view,
    reload: adapter.reload,
    replaceSaved: adapter.replaceSaved,
    removeSaved: adapter.removeSaved,
  };
}
