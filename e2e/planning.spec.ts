import { expect, test } from "@playwright/test";
import { createEvent, mockAssistant, occasions, savedBytes, savedEvent } from "./helpers";
import type { Category } from "../src/types";

for (const category of Object.keys(occasions) as Category[]) {
  test(`${category}: create, inspect every deliverable, retain an idea and reopen`, async ({ page }) => {
    const calls = await mockAssistant(page);
    const event = await createEvent(page, category);
    expect(calls).toHaveLength(0);
    const amounts = await page.locator("#budget .allocation-list strong").allTextContents();
    expect(amounts.map(text => Number(text.replace(/[^0-9]/g, ""))).reduce((a, b) => a + b, 0)).toBe(occasions[category].budget);
    expect(event.plan.budget.every(item => Number.isInteger(item.amount) && item.amount >= 0)).toBe(true);
    for (const section of ["budget", "timeline", "vendors", "ideas", "risks"]) await expect(page.locator(`#${section}`).getByRole("heading", { level: 2 })).toBeVisible();
    await expect(page.locator("#brief")).toContainText(occasions[category].theme);
    if (category === "birthday") await expect(page.locator("#ideas")).toContainText("Painting and dinosaur games");
    if (category === "community") { await expect(page.locator("#brief")).toContainText("12"); await expect(page.locator("#timeline")).toContainText(/volunteer/i); }
    await page.getByRole("link", { name: "AI assistant", exact: true }).click();
    await page.getByRole("button", { name: "Generate personalized ideas", exact: true }).click();
    await expect(page.getByText("Mocked Gemini response for deterministic browser testing.")).toBeVisible();
    expect(calls[0].brief.category).toBe(category); expect(calls[0].brief.guests).toBe(occasions[category].guests);
    await expect(page.locator(".ai-result")).toContainText(occasions[category].theme);
    await page.getByRole("button", { name: "Keep this idea", exact: true }).first().click();
    await expect(page.getByRole("button", { name: "Saved to your event", exact: true })).toBeDisabled();
    expect((await savedEvent(page)).savedIdeas).toHaveLength(1);
    await page.getByRole("button", { name: "Generate personalized ideas", exact: true }).click();
    await expect(page.getByRole("button", { name: "Saved to your event", exact: true })).toBeDisabled();
    expect((await savedEvent(page)).savedIdeas).toHaveLength(1);
    await page.goto("/events");
    await page.getByRole("link", { name: occasions[category].name, exact: true }).click();
    await expect(page.getByRole("heading", { name: occasions[category].name, exact: true })).toBeVisible();
    expect((await savedEvent(page)).id).toBe(event.id);
    expect((await savedEvent(page)).savedIdeas).toHaveLength(1);
  });
}

test("adaptive wedding: ask, protect catering, reject, accept and retain progress", async ({ page }) => {
  await mockAssistant(page);
  const original = await createEvent(page, "wedding");
  const timeline = page.getByLabel(`Status: ${original.plan.timeline[0].title}`, { exact: true });
  const vendor = page.getByLabel(`Status: ${original.plan.vendors[0].title}`, { exact: true });
  await timeline.selectOption("completed"); await vendor.selectOption("in-progress");
  await page.reload();
  await expect(timeline).toHaveValue("completed"); await expect(vendor).toHaveValue("in-progress");
  await page.getByRole("link", { name: "AI assistant", exact: true }).click();
  await page.getByRole("button", { name: "Ask Eventura AI", exact: true }).click();
  await page.getByLabel("What would you like help with?", { exact: true }).fill("How do I serve vegetarian food for my guests?");
  await page.getByRole("button", { name: "Ask about my event", exact: true }).click();
  await expect(page.locator(".ai-answer")).toContainText("120 guests");
  await expect(page.locator(".ai-answer")).toContainText("Vegetarian");
  await page.getByRole("button", { name: "Optimize My Budget", exact: true }).click();
  await page.getByLabel("Target budget (INR)", { exact: true }).fill("180001");
  await page.getByRole("checkbox", { name: /Catering/ }).check();
  const before = await savedBytes(page);
  await page.getByRole("button", { name: "Preview budget proposal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review your proposed budget", exact: true })).toBeVisible();
  await expect(page.locator(".ai-comparison-rows").filter({ hasText: "Catering" })).toContainText("Protected");
  const protectedRow = page.locator(".ai-comparison-rows > div").filter({ has: page.getByText("Catering", { exact: true }) });
  const shown = await protectedRow.locator("dd").allTextContents(); expect(shown[0]).toBe(shown[1]);
  await expect(page.getByRole("button", { name: "Confirm and save budget", exact: true })).toBeDisabled();
  expect(await savedBytes(page)).toBe(before);
  await page.getByRole("button", { name: "Reject proposal", exact: true }).click();
  expect(await savedBytes(page)).toBe(before);
  await page.getByRole("button", { name: "Preview budget proposal", exact: true }).click();
  await page.getByRole("checkbox", { name: "I have reviewed these proposed allocations and want to replace my saved budget.", exact: true }).check();
  await page.getByRole("button", { name: "Confirm and save budget", exact: true }).click();
  await expect(page.getByText("Budget saved. Your task progress and preferences have been preserved.")).toBeVisible();
  await page.reload();
  const accepted = await savedEvent(page);
  expect(accepted.brief.budget).toBe(180001);
  expect(accepted.plan.budget.reduce((sum, item) => sum + item.amount, 0)).toBe(180001);
  expect(accepted.plan.budget.every(item => Number.isInteger(item.amount) && item.amount >= 0)).toBe(true);
  expect(accepted.plan.budget.find(item => item.category === "food")?.amount).toBe(original.plan.budget.find(item => item.category === "food")?.amount);
  expect(accepted.plan.budget.find(item => item.contingency)?.amount).toBeGreaterThanOrEqual(18001);
  await expect(timeline).toHaveValue("completed"); await expect(vendor).toHaveValue("in-progress");
  await page.goto("/events"); await page.getByRole("link", { name: occasions.wedding.name, exact: true }).click();
  await expect(page.locator("#budget .budget-total")).toContainText("1,80,001");
});

test("missing-key fallback and a failed assistant preserve usable planning", async ({ page }) => {
  const original = await createEvent(page, "birthday");
  await page.getByRole("link", { name: "AI assistant", exact: true }).click();
  await page.getByRole("button", { name: "Generate personalized ideas", exact: true }).click();
  await expect(page.locator(".ai-result").getByText("Rule-based fallback", { exact: true }).first()).toBeVisible();
  await expect(page.locator(".ai-result")).toContainText("not configured");
  const before = await savedBytes(page);
  await page.route("**/api/ai/plan", route => route.abort("failed"));
  await page.getByRole("button", { name: "Generate personalized ideas", exact: true }).click();
  await expect(page.getByRole("region", { name: "Your AI planning assistant.", exact: true }).getByRole("alert")).toBeVisible();
  expect(await savedBytes(page)).toBe(before);
  await page.getByLabel(`Status: ${original.plan.timeline[0].title}`, { exact: true }).selectOption("completed");
  await page.reload();
  await expect(page.getByLabel(`Status: ${original.plan.timeline[0].title}`, { exact: true })).toHaveValue("completed");
  await expect(page.locator("#budget")).toBeVisible();
});

test("first-screen purpose, direct start and invalid-input recovery", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".hero-description")).toContainText("budgets, timelines, vendor checklists and personalized ideas");
  await expect(page.locator(".hero-description")).toContainText("Gemini");
  const description = await page.locator(".hero-description").boundingBox();
  expect(description).not.toBeNull();
  expect(description!.y).toBeGreaterThanOrEqual(0);
  expect(description!.y + description!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.getByRole("button", { name: "Start planning your event", exact: true }).click();
  await expect(page).toHaveURL(/\/events\/new\?category=wedding$/);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Event name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Event name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await page.goto("/events/00000000-0000-4000-8000-000000000000");
  await expect(page.getByRole("link", { name: /Return to my events/ })).toBeVisible();
});
