// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeferredAssistant } from "@/components/assistant/deferred-assistant";
import { record } from "./fixtures";

const diagnostics = vi.hoisted(() => ({ moduleLoaded: vi.fn(), rendered: vi.fn() }));
vi.mock("@/components/ai-assistant", () => {
  diagnostics.moduleLoaded();
  return {
    AIAssistant: (props: { focusOnLoad?: boolean }) => {
      diagnostics.rendered(props);
      return createElement("section", { id: "assistant" }, "Loaded planning assistant");
    },
  };
});

let intersect: IntersectionObserverCallback;
const observe = vi.fn();
const disconnect = vi.fn();
let options: IntersectionObserverInit | undefined;
const fetchMock = vi.fn();
const scrollIntoView = vi.fn();
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
beforeEach(() => {
  vi.clearAllMocks();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: scrollIntoView,
  });
  history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: IntersectionObserverCallback, settings?: IntersectionObserverInit) {
        intersect = callback;
        options = settings;
      }
      observe = observe;
      disconnect = disconnect;
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  if (originalScroll)
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScroll);
  else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  history.replaceState(null, "", "/");
});

const show = () => render(createElement(DeferredAssistant, { event: record(), onSaved: vi.fn() }));

describe("deferred planning assistant", () => {
  it("does not import, render or request advice before the section approaches the viewport", async () => {
    show();
    expect(screen.getByRole("heading", { name: "Your AI planning assistant." })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Open assistant" })).toBeTruthy();
    expect(options?.rootMargin).toBe("300px");
    expect(observe).toHaveBeenCalledTimes(1);
    expect(diagnostics.moduleLoaded).not.toHaveBeenCalled();
    expect(diagnostics.rendered).not.toHaveBeenCalled();
    act(() =>
      intersect(
        [{ isIntersecting: false } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    expect(diagnostics.rendered).not.toHaveBeenCalled();
    act(() =>
      intersect(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      ),
    );
    await screen.findByText("Loaded planning assistant");
    expect(diagnostics.moduleLoaded).toHaveBeenCalledTimes(1);
    expect(diagnostics.rendered.mock.calls.at(-1)?.[0].focusOnLoad).toBe(false);
    expect(disconnect).toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("offers an explicit accessible fallback when IntersectionObserver is unavailable", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    show();
    expect(diagnostics.rendered).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open assistant" }));
    await screen.findByText("Loaded planning assistant");
    expect(diagnostics.rendered.mock.calls.at(-1)?.[0].focusOnLoad).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("opens for a direct assistant hash without needing an observer", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    history.replaceState(null, "", "/events/example#assistant");
    show();
    await screen.findByText("Loaded planning assistant");
    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
    expect(diagnostics.rendered.mock.calls.at(-1)?.[0].focusOnLoad).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("opens when the plan navigation changes the hash to assistant", async () => {
    show();
    expect(diagnostics.rendered).not.toHaveBeenCalled();
    act(() => {
      history.replaceState(null, "", "/events/example#assistant");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await screen.findByText("Loaded planning assistant");
    expect(diagnostics.rendered.mock.calls.at(-1)?.[0].focusOnLoad).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
