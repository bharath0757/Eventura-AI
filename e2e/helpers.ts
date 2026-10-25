import { expect, type Page } from "@playwright/test";
import type { Category } from "../src/types";
import { recordSchema } from "../src/lib/validation/schemas";
import { requestSchema, type AIRequest } from "../src/lib/ai/schemas";
import { localRecommendations, localAnswer, localOptimization } from "../src/lib/ai/fallback";
import { optimizeBudget } from "../src/lib/ai/optimizer";

const storageKey = "eventura-ai:v1:events";
export const occasions = {
  wedding: { card: "Weddings", name: "Garden wedding", theme: "Sunflower garden ceremony", guests: 120, budget: 240001, priority: "Food quality" },
  birthday: { card: "Birthdays", name: "Dinosaur birthday", theme: "Dinosaur craft party", guests: 30, budget: 45001, priority: "Entertainment" },
  community: { card: "Community gatherings", name: "Community repair workshop", theme: "Repair and reuse workshop", guests: 80, budget: 60001, priority: "Volunteer coordination" },
} as const;

export async function savedEvent(page: Page) {
  const value = await page.evaluate(key => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw).events[0] : null;
  }, storageKey);
  return recordSchema.parse(value);
}
export async function savedBytes(page: Page) { return page.evaluate(key => localStorage.getItem(key), storageKey); }

export async function createEvent(page: Page, category: Category) {
  const input = occasions[category];
  await page.goto("/");
  await page.getByRole("button", { name: `Start planning: ${input.card}`, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/events/new\\?category=${category}$`));
  const categoryLabel = category === "community" ? "Community event" : category[0].toUpperCase() + category.slice(1);
  await expect(page.getByRole("button", { name: categoryLabel, exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Event name", { exact: true }).fill(input.name);
  const future = new Date(); future.setUTCDate(future.getUTCDate() + 120);
  await page.getByLabel("Event date", { exact: true }).fill(future.toISOString().slice(0, 10));
  await page.getByLabel("Expected guests", { exact: true }).fill(String(input.guests));
  await page.getByLabel("City or location", { exact: true }).fill("Hyderabad");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  if (category === "wedding") {
    await page.getByLabel("Ceremony style", { exact: true }).selectOption("fusion");
    await page.getByLabel("Theme & atmosphere", { exact: true }).fill(input.theme);
  } else if (category === "birthday") {
    await page.getByLabel("Who is the celebration for?", { exact: true }).selectOption("children");
    await page.getByLabel("Celebration style", { exact: true }).fill(input.theme);
    await page.getByLabel("Preferred activities", { exact: true }).fill("Painting and dinosaur games");
  } else {
    await page.getByLabel("Event format", { exact: true }).selectOption("workshop");
    await page.getByLabel("Theme or purpose", { exact: true }).fill(input.theme);
    await page.getByLabel("Volunteer count", { exact: true }).fill("12");
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Total budget (INR)", { exact: true }).fill(String(input.budget));
  await page.getByRole("button", { name: new RegExp(`^${input.priority}`) }).click();
  await page.getByLabel("Dietary requirements (optional)", { exact: true }).fill("Vegetarian, labelled allergens");
  await page.getByLabel("Accessibility needs (optional)", { exact: true }).fill("Step-free entry");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Create my event", exact: true }).click();
  await expect(page).toHaveURL(/\/events\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: input.name, exact: true })).toBeVisible();
  return savedEvent(page);
}

// This is an explicit mock of the HTTP AI boundary, never evidence of real Gemini inference.
export async function mockAssistant(page: Page) {
  const calls: AIRequest[] = [];
  await page.route("**/api/ai/plan", async route => {
    const request = requestSchema.parse(route.request().postDataJSON()); calls.push(request);
    const common = { source: "live-ai", message: "Mocked Gemini response for deterministic browser testing." };
    const data = request.operation === "recommendations" ? localRecommendations(request) : request.operation === "ask" ? localAnswer(request) : localOptimization(request);
    const body = request.operation === "optimize" ? { ...common, operation: request.operation, data, proposal: optimizeBudget(request, localOptimization(request).guidance) } : { ...common, operation: request.operation, data };
    await route.fulfill({ status: 200, contentType: "application/json", json: body });
  });
  return calls;
}
