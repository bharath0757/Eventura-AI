// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeferredAssistant } from "@/components/assistant/deferred-assistant";
import { UtsavLauncher } from "@/components/utsav/launcher";
import { record } from "./fixtures";
vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("@/components/utsav/panel", () => ({
  default: ({ onClose }: { onClose: () => void }) =>
    createElement("button", { onClick: onClose }, "Close loaded companion"),
}));
const fetchMock = vi.fn();
beforeEach(() => {
  history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockClear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  history.replaceState(null, "", "/");
});
const show = () =>
  render(
    createElement(
      "div",
      null,
      createElement(DeferredAssistant, { event: record(), onSaved: vi.fn() }),
      createElement(UtsavLauncher),
    ),
  );
describe("one deferred companion", () => {
  it("keeps the panel unloaded and sends nothing until opened", async () => {
    show();
    expect(screen.queryByText("Close loaded companion")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Open assistant" }));
    await screen.findByText("Close loaded companion");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("opens from the floating launcher", async () => {
    show();
    fireEvent.click(screen.getByRole("button", { name: "Open Utsav, your celebration companion" }));
    await screen.findByText("Close loaded companion");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("opens for a direct assistant hash", async () => {
    history.replaceState(null, "", "/#assistant");
    show();
    await screen.findByText("Close loaded companion");
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("opens when the assistant hash changes", async () => {
    show();
    act(() => {
      history.replaceState(null, "", "/#assistant");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    await screen.findByText("Close loaded companion");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
