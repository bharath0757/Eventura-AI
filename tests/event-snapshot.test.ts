// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEvents } from "@/components/use-events";
import { eventStore, STORAGE_KEY } from "@/lib/storage/events";
import { record } from "./fixtures";

beforeEach(() => {
  localStorage.clear();
  eventStore().save(record());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
describe("saved event snapshots", () => {
  it("uses the validated mutation result without a second storage read", async () => {
    const { result } = renderHook(useEvents);
    await waitFor(() => expect(result.current.snapshot?.events).toHaveLength(1));
    const event = record();
    const saved = eventStore().setTaskStatus(
      event.id,
      "timeline",
      event.plan.timeline[0].id,
      "completed",
    );
    const read = vi.spyOn(Storage.prototype, "getItem");
    act(() => result.current.replaceSaved(saved));
    expect(result.current.snapshot?.events[0]).toEqual(saved);
    expect(read).not.toHaveBeenCalled();
    act(() => result.current.removeSaved(saved.id));
    expect(result.current.snapshot?.events).toHaveLength(0);
    expect(read).not.toHaveBeenCalled();
  });
  it("still reloads changes made in another browser tab", async () => {
    const { result } = renderHook(useEvents);
    await waitFor(() => expect(result.current.snapshot?.events).toHaveLength(1));
    const event = record();
    const saved = eventStore().setTaskStatus(
      event.id,
      "vendors",
      event.plan.vendors[0].id,
      "in-progress",
    );
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY })));
    expect(result.current.snapshot?.events[0]).toEqual(saved);
  });
});
