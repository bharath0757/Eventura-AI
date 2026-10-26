import { describe, expect, it, vi } from "vitest";

// Basic record access must remain usable before optional assistant code is loaded.
vi.mock("@/lib/ai/optimizer", () => {
  throw new Error("The record store loaded optional optimization code.");
});

import { recordStore, STORAGE_KEY, type StoragePort } from "@/lib/storage/records";
import { record } from "./fixtures";

describe("basic storage dependency boundary", () => {
  it("validates and persists task progress without loading the optimizer", () => {
    const data = new Map<string, string>();
    const port: StoragePort = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
    };
    const store = recordStore(port, () => "2026-10-26T12:00:00.000Z");
    const event = record();
    store.save(event);
    const saved = store.setTaskStatus(event.id, "timeline", event.plan.timeline[0].id, "completed");
    expect(store.get(event.id)).toEqual(saved);
    expect(saved.plan.timeline[0].status).toBe("completed");
    expect(saved.brief.budget).toBe(event.brief.budget);
    expect(JSON.parse(data.get(STORAGE_KEY)!).version).toBe(1);
    expect(() =>
      store.update(event.id, (current) => ({
        ...current,
        brief: { ...current.brief, budget: 999 },
      })),
    ).toThrow();
    expect(store.get(event.id)).toEqual(saved);
  });
});
