// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { UtsavLauncher } from "@/components/utsav/launcher";
vi.mock("next/navigation", () => ({ usePathname: () => "/events/" + record().id }));
import { EventDashboard } from "@/components/event-dashboard";
import { eventStore, STORAGE_KEY } from "@/lib/storage/events";
import { record } from "./fixtures";
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.stubGlobal("IntersectionObserver", undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("dashboard release recovery", () => {
  it("provides navigation when an event is missing", async () => {
    render(createElement(EventDashboard, { eventId: record().id }));
    await screen.findByText("We couldn’t find this occasion.");
    expect(screen.getByRole("link", { name: /Return to my events/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Create an event/ })).toBeTruthy();
  });
  it("preserves corrupted storage and offers a retry", async () => {
    localStorage.setItem(STORAGE_KEY, "{broken");
    render(createElement(EventDashboard, { eventId: record().id }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toContain("unreadable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{broken");
  });
  it("a failed assistant request leaves the full dashboard and task controls usable", async () => {
    const event = record();
    eventStore().save(event);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Service unavailable")));
    render(
      createElement(
        "div",
        null,
        createElement(EventDashboard, { eventId: event.id }),
        createElement(UtsavLauncher),
      ),
    );
    await screen.findByRole("heading", { name: event.brief.name });
    fireEvent.click(screen.getByRole("button", { name: "Open assistant" }));
    fireEvent.click(await screen.findByRole("button", { name: "Personalized ideas" }));
    fireEvent.click(await screen.findByRole("button", { name: "Generate personalized ideas" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Close Utsav" }));
    expect(screen.getByRole("heading", { name: "A budget with breathing room" })).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Status: Align on the celebration"), {
      target: { value: "completed" },
    });
    await waitFor(() =>
      expect(eventStore().get(event.id)?.plan.timeline[0].status).toBe("completed"),
    );
    expect(eventStore().get(event.id)?.brief.budget).toBe(event.brief.budget);
  });
});
