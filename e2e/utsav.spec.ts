import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createEvent, savedBytes } from "./helpers";
import { chatRequestSchema, type ChatRequest } from "../src/lib/ai/chat-contracts";
const key = "eventura-ai:utsav:v1:threads";
const open = async (page: Page) => {
  await page.getByRole("button", { name: "Open Utsav, your celebration companion" }).click();
  await expect(page.getByRole("dialog", { name: "Utsav", exact: true })).toBeVisible();
};
const send = async (page: Page, text: string) => {
  await page.getByLabel("Message Utsav", { exact: true }).fill(text);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
};
async function mock(page: Page) {
  const calls: ChatRequest[] = [];
  await page.route("**/api/ai/chat", async (route) => {
    const request = chatRequestSchema.parse(route.request().postDataJSON());
    calls.push(request);
    await route.fulfill({
      json: {
        reply:
          request.purpose === "invitation"
            ? "Join [host] at [venue], [start time]."
            : `Reply ${calls.length}: ${request.message}`,
        source: "live-ai",
        message: "Synthetic mocked response, not live inference.",
      },
    });
  });
  return calls;
}

test("lazy launcher, continuity, bounded context, refresh and clearing", async ({ page }) => {
  const calls = await mock(page);
  const resources: string[] = [];
  page.on("request", (r) => resources.push(r.url()));
  await page.goto("/");
  expect(
    resources.some((url) => url.includes("images%2Futsav") || url.includes("/images/utsav/")),
  ).toBe(false);
  await open(page);
  expect(calls).toHaveLength(0);
  await send(page, "Help me plan a wedding");
  await expect(page.getByRole("log")).toContainText("Reply 1:");
  await send(page, "What comes next?");
  await expect(page.getByRole("log")).toContainText("Reply 2:");
  expect(calls[1].history).toHaveLength(2);
  expect(calls[1].history?.[0].text).toBe("Help me plan a wedding");
  expect(calls[1].context).toBeUndefined();
  await page.reload();
  await open(page);
  await expect(page.getByRole("log")).toContainText("What comes next?");
  for (let i = 0; i < 4; i++) {
    await send(page, `Question ${i}`);
    await expect(page.getByRole("log")).toContainText(`Reply ${i + 3}:`);
  }
  expect(calls.at(-1)?.history).toHaveLength(8);
  await page.getByRole("button", { name: "Clear chat", exact: true }).click();
  await page.getByRole("button", { name: "Confirm clear chat", exact: true }).click();
  await expect(page.getByRole("log")).toBeEmpty();
  await page.reload();
  await open(page);
  await expect(page.getByRole("log")).toBeEmpty();
});

test("selected events stay isolated and priorities use the actual unfinished timeline without AI", async ({
  page,
}) => {
  const calls = await mock(page);
  const first = await createEvent(page, "wedding");
  await page
    .getByLabel(`Status: ${first.plan.timeline[0].title}`, { exact: true })
    .selectOption("completed");
  const second = await createEvent(page, "birthday");
  await open(page);
  await expect(page.getByLabel("Planning together")).toHaveValue(second.id);
  await send(page, "Birthday question");
  await expect(page.getByRole("log")).toContainText("Reply 1:");
  expect(calls[0].context?.brief.category).toBe("birthday");
  await page.getByLabel("Planning together").selectOption(first.id);
  await expect(page.getByRole("log")).toBeEmpty();
  await page.getByRole("button", { name: "What is next?", exact: true }).click();
  expect(calls).toHaveLength(1);
  await expect(page.getByRole("log")).toContainText("From your saved plan");
  await expect(page.getByRole("log")).not.toContainText(first.plan.timeline[0].title);
  const expected = first.plan.timeline
    .filter((_, i) => i !== 0)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 3);
  for (const task of expected) await expect(page.getByRole("log")).toContainText(task.title);
  await send(page, "Wedding question");
  await expect(page.getByRole("log")).toContainText("Reply 2:");
  expect(calls[1].context?.brief.category).toBe("wedding");
  expect(JSON.stringify(calls[1])).not.toContain("Birthday question");
  await page.getByLabel("Planning together").selectOption("general");
  await expect(page.getByRole("log")).toBeEmpty();
  await page.getByLabel("Planning together").selectOption(second.id);
  await expect(page.getByRole("log")).toContainText("Birthday question");
  await expect(page.getByRole("log")).not.toContainText("Wedding question");
  await page.getByRole("button", { name: "Clear chat", exact: true }).click();
  await page.getByRole("button", { name: "Confirm clear chat", exact: true }).click();
  await page.getByLabel("Planning together").selectOption(first.id);
  await expect(page.getByRole("log")).toContainText("Wedding question");
});

test("invitation is editable and copies the edited text without changing an event", async ({
  page,
}) => {
  const calls = await mock(page);
  await createEvent(page, "community");
  const before = await savedBytes(page);
  await open(page);
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          sessionStorage.setItem("copied-invitation", text);
        },
      },
    });
  });
  await page.getByRole("button", { name: "Draft an invitation", exact: true }).click();
  expect(calls).toHaveLength(0);
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  const draft = page.getByLabel("Invitation draft", { exact: true });
  await expect(draft).toHaveValue("Join [host] at [venue], [start time].");
  expect(calls[0].purpose).toBe("invitation");
  await draft.fill("Join us at 4pm. Venue: [venue]");
  await page.getByRole("button", { name: "Copy invitation", exact: true }).click();
  await expect(page.getByText("Invitation copied.")).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("copied-invitation"))).toBe(
    "Join us at 4pm. Venue: [venue]",
  );
  expect(await savedBytes(page)).toBe(before);
});

test("storage denial leaves conversation usable and visibly unsaved", async ({ page }) => {
  await page.addInitScript(() => {
    const read = Storage.prototype.getItem;
    const write = Storage.prototype.setItem;
    Storage.prototype.getItem = function (k) {
      if (k.startsWith("eventura-ai:utsav")) throw new Error("Storage denied");
      return read.call(this, k);
    };
    Storage.prototype.setItem = function (k, v) {
      if (k.startsWith("eventura-ai:utsav")) throw new Error("Storage denied");
      return write.call(this, k, v);
    };
  });
  await mock(page);
  await page.goto("/");
  await open(page);
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await send(page, "Can you still help?");
  await expect(page.getByRole("log")).toContainText("Reply 1:");
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("session");
});

test("conversation changes cancel requests and discard late replies", async ({ page }) => {
  await createEvent(page, "wedding");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  let received = false;
  await page.route("**/api/ai/chat", async (route) => {
    received = true;
    await pending;
    try {
      await route.fulfill({
        json: {
          reply: "Late private wedding response",
          source: "live-ai",
          message: "Synthetic response",
        },
      });
    } catch {
      /* The browser may have already cancelled this intercepted request. */
    }
  });
  await open(page);
  await send(page, "Pending wedding question");
  await expect.poll(() => received).toBe(true);
  await page.getByLabel("Planning together").selectOption("general");
  release();
  await expect(page.getByRole("log")).toBeEmpty();
  await expect(page.getByLabel("Message Utsav")).toBeEnabled();
  await page.getByRole("button", { name: "Close Utsav" }).click();
  await open(page);
  await expect(page.getByRole("log")).not.toContainText("Late private wedding response");
});

test("provider fallback is honestly labelled and network errors preserve the plan", async ({
  page,
}) => {
  await createEvent(page, "wedding");
  const before = await savedBytes(page);
  await open(page);
  await send(page, "Explain my budget");
  await expect(page.getByRole("log")).toContainText("Rule-based fallback");
  await expect(page.getByRole("log")).toContainText("not configured");
  await expect(page.getByRole("log")).not.toContainText("Live Gemini");
  await page.route("**/api/ai/chat", (route) => route.abort("failed"));
  await send(page, "Try another question");
  await expect(page.getByRole("dialog").getByRole("alert")).toBeVisible();
  await expect(page.getByLabel("Message Utsav")).toHaveValue("Try another question");
  expect(await savedBytes(page)).toBe(before);
});

test("keyboard, reduced motion, announcements and compact viewport remain accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mock(page);
  await page.goto("/");
  const launcher = page.getByRole("button", { name: "Open Utsav, your celebration companion" });
  await launcher.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Utsav", exact: true })).toBeFocused();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
      .violations,
  ).toEqual([]);
  await send(page, "A simple celebration please");
  await expect(page.getByRole("log")).toContainText("Reply 1:");
  await expect(page.getByRole("log")).toHaveAttribute("aria-live", "polite");
  const animation = await page
    .locator(".utsav-bubble")
    .first()
    .evaluate((node) => getComputedStyle(node).animationName);
  expect(animation).toBe("none");
  await page.setViewportSize({ width: 390, height: 420 });
  const box = await page.getByRole("dialog").boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(421);
  await expect(page.getByLabel("Message Utsav")).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("history retains only fifty messages and renders untrusted content as text", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate((key) => {
    const messages = Array.from({ length: 50 }, (_, i) => ({
      id: crypto.randomUUID(),
      role: "user",
      text: `Old message ${i}`,
    }));
    localStorage.setItem(key, JSON.stringify({ version: 1, threads: { general: messages } }));
  }, key);
  await mock(page);
  await open(page);
  await send(page, "<script>window.pwned=true</script>");
  await expect(page.getByRole("log")).toContainText("<script>window.pwned=true</script>");
  const stored = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).threads.general,
    key,
  );
  expect(stored).toHaveLength(50);
  expect(stored[0].text).toBe("Old message 2");
  expect(await page.evaluate(() => "pwned" in window)).toBe(false);
});
