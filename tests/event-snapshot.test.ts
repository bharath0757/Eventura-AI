// @vitest-environment jsdom
import { createElement, useLayoutEffect, type PropsWithChildren } from "react";
import { renderToString } from "react-dom/server";
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
  it("renders the same loading view on the server without reading browser records", () => {
    const read = vi.spyOn(Storage.prototype, "getItem");
    function ServerProbe() {
      const { snapshot, error } = useEvents();
      return createElement("p", null, snapshot ? "loaded" : error || "loading");
    }
    expect(renderToString(createElement(ServerProbe))).toContain("loading");
    expect(read).not.toHaveBeenCalled();
  });
  it("preserves storage warnings when applying a validated local mutation result", () => {
    const event = record();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, events: [event, { invalid: true }] }),
    );
    const { result } = renderHook(useEvents);
    const warnings = result.current.snapshot?.warnings;
    expect(warnings).toHaveLength(1);
    const saved = eventStore().setTaskStatus(
      event.id,
      "timeline",
      event.plan.timeline[0].id,
      "completed",
    );
    const read = vi.spyOn(Storage.prototype, "getItem");
    act(() => result.current.replaceSaved(saved));
    expect(result.current.snapshot?.warnings).toBe(warnings);
    expect(result.current.snapshot?.events[0]).toEqual(saved);
    expect(read).not.toHaveBeenCalled();
  });
  it("observes a cross-tab write between the render read and subscription", () => {
    const changed = record();
    changed.plan.timeline[0].status = "completed";
    const add = vi.spyOn(window, "addEventListener");
    let wroteBeforeSubscription = false;
    function BetweenRenderAndSubscription({ children }: PropsWithChildren) {
      useLayoutEffect(() => {
        wroteBeforeSubscription = !add.mock.calls.some(([type]) => type === "storage");
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, events: [changed] }));
        window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
      }, []);
      return children;
    }
    const { result } = renderHook(useEvents, { wrapper: BetweenRenderAndSubscription });
    expect(wroteBeforeSubscription).toBe(true);
    expect(result.current.snapshot?.events[0].plan.timeline[0].status).toBe("completed");
  });
  it("reuses its cached snapshot across rerenders after mount consistency checks", () => {
    const read = vi.spyOn(Storage.prototype, "getItem");
    const { result, rerender } = renderHook(useEvents);
    const snapshot = result.current.snapshot;
    expect(snapshot?.events).toHaveLength(1);
    const mountReads = read.mock.calls.length;
    expect(mountReads).toBeGreaterThan(0);
    rerender();
    expect(result.current.snapshot).toBe(snapshot);
    expect(read).toHaveBeenCalledTimes(mountReads);
  });
  it("keeps a stable subscription and removes it when unmounted", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const { rerender, unmount } = renderHook(useEvents);
    const storageSubscriptions = () => add.mock.calls.filter(([type]) => type === "storage");
    expect(storageSubscriptions()).toHaveLength(1);
    const listener = storageSubscriptions()[0][1];
    rerender();
    expect(storageSubscriptions()).toHaveLength(1);
    unmount();
    expect(remove).toHaveBeenCalledWith("storage", listener);
    const read = vi.spyOn(Storage.prototype, "getItem");
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
    expect(read).not.toHaveBeenCalled();
  });
  it("ignores unrelated storage events and reloads when site storage is cleared", () => {
    const { result } = renderHook(useEvents);
    const snapshot = result.current.snapshot;
    const read = vi.spyOn(Storage.prototype, "getItem");
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: "another-feature" })));
    expect(result.current.snapshot).toBe(snapshot);
    expect(read).not.toHaveBeenCalled();
    localStorage.clear();
    act(() => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect(result.current.snapshot?.events).toHaveLength(0);
    expect(read).toHaveBeenCalledTimes(1);
  });
  it("caches read failures and deliberately retries without discarding the previous plan", () => {
    const { result, rerender } = renderHook(useEvents);
    const snapshot = result.current.snapshot;
    const read = vi.spyOn(Storage.prototype, "getItem");
    read.mockImplementationOnce(() => {
      throw new Error("storage blocked");
    });
    act(() => result.current.reload());
    expect(result.current.snapshot).toBe(snapshot);
    expect(result.current.error).toContain("could not be read");
    expect(read).toHaveBeenCalledTimes(1);
    rerender();
    expect(read).toHaveBeenCalledTimes(1);
    act(() => result.current.reload());
    expect(read).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBe("");
    expect(result.current.snapshot?.events).toEqual(snapshot?.events);
  });
  it("keeps corrupt bytes intact and recovers after the user repairs storage and retries", () => {
    localStorage.setItem(STORAGE_KEY, "{broken");
    const { result } = renderHook(useEvents);
    expect(result.current.snapshot).toBeNull();
    expect(result.current.error).toContain("unreadable");
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{broken");
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, events: [record()] }));
    act(() => result.current.reload());
    expect(result.current.error).toBe("");
    expect(result.current.snapshot?.events).toHaveLength(1);
  });
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
