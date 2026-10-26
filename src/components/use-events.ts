"use client";
import { useCallback, useEffect, useState, startTransition } from "react";
import type { EventRecord } from "@/types";
import { eventStore, STORAGE_KEY, type EventSnapshot } from "@/lib/storage/events";
/** Hydrate after mount: server and initial client renders both show the loading state. */
export function useEvents() {
  const [snapshot, setSnapshot] = useState<EventSnapshot | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    try {
      setSnapshot(eventStore().list());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Saved events could not be loaded.");
    }
  }, []);
  useEffect(() => {
    startTransition(reload);
    const changed = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) reload();
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, [reload]);
  // Call only after persistence succeeds. The store has already validated the
  // returned record, so updating this snapshot does not need a second full read.
  const replaceSaved = useCallback((record: EventRecord) => {
    setSnapshot((current) =>
      current
        ? {
            ...current,
            events: current.events.map((event) => (event.id === record.id ? record : event)),
          }
        : current,
    );
  }, []);
  const removeSaved = useCallback((id: string) => {
    setSnapshot((current) =>
      current
        ? {
            ...current,
            events: current.events.filter((event) => event.id !== id),
          }
        : current,
    );
  }, []);
  return { snapshot, error, reload, replaceSaved, removeSaved };
}
