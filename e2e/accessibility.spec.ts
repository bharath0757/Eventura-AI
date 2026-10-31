import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";
import { createEvent, mockAssistant } from "./helpers";

async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  if (result.violations.length)
    await test.info().attach("accessibility-violations", {
      body: JSON.stringify(result.violations, null, 2),
      contentType: "application/json",
    });
  expect(
    result.violations.map((violation) => ({
      rule: violation.id,
      targets: violation.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
}

test("sample dialog: keyboard tabs, focus restoration and accessible content", async ({ page }) => {
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Explore a sample plan", exact: true });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Picture the possibilities." })).toBeFocused();
  await accessible(page);
  const budget = dialog.getByRole("tab", { name: "Budget", exact: true });
  await budget.focus();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: "Timeline", exact: true })).toBeFocused();
  await expect(dialog.getByRole("tab", { name: "Timeline", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await dialog.getByRole("checkbox").first().check();
  await accessible(page);
  await dialog.getByRole("tab", { name: "Vendors", exact: true }).click();
  await dialog.getByRole("combobox").first().selectOption("Contacted");
  await accessible(page);
  const downloaded = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download sample", exact: true }).click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toBe("eventura-sample-plan.txt");
  const text = await readFile((await download.path())!, "utf8");
  expect(text).toContain("[x]");
  expect(text).toContain(": Contacted");
  expect(text).toContain("5,00,000");
  expect(await page.evaluate(() => localStorage.getItem("eventura-ai:v1:events"))).toBeNull();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole("button", { name: "Close event planner", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("wizard: accessible steps, error focus and persistent hint associations", async ({ page }) => {
  await page.goto("/events/new");
  await accessible(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Event name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Expected guests", { exact: true })).toHaveAttribute(
    "aria-describedby",
    "guests-hint guests-error",
  );
  await accessible(page);
  await page.getByLabel("Event name", { exact: true }).fill("Accessible garden wedding");
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 120);
  await page.getByLabel("Event date", { exact: true }).fill(date.toISOString().slice(0, 10));
  await page.getByLabel("Expected guests", { exact: true }).fill("120");
  await page.getByLabel("City or location", { exact: true }).fill("Hyderabad");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Theme & atmosphere", { exact: true })).toHaveAttribute(
    "aria-describedby",
    "theme-hint",
  );
  await page.getByLabel("Theme & atmosphere", { exact: true }).fill("Sunflower garden ceremony");
  await accessible(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Total budget (INR)", { exact: true })).toHaveAttribute(
    "aria-describedby",
    "budget-hint",
  );
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByLabel("Total budget (INR)", { exact: true })).toHaveAttribute(
    "aria-describedby",
    "budget-hint budget-error",
  );
  await accessible(page);
  await page.getByLabel("Total budget (INR)", { exact: true }).fill("240001");
  await page.getByRole("button", { name: /^Food quality/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await accessible(page);
});

test("saved dashboard and assistant results meet automated accessibility checks", async ({
  page,
}) => {
  await mockAssistant(page);
  await createEvent(page, "wedding");
  await accessible(page);
  for (const id of ["vendors", "ideas", "risks", "brief"]) {
    const section = page.locator(`#${id}`);
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole("heading", { level: 2 })).toBeVisible();
    await accessible(page);
  }
  await page.getByRole("link", { name: "AI assistant", exact: true }).click();
  await page.getByRole("button", { name: "Personalized ideas", exact: true }).click();
  await page.getByRole("button", { name: "Generate personalized ideas", exact: true }).click();
  await expect(page.locator(".ai-result")).toBeVisible();
  await accessible(page);
  await page.getByRole("button", { name: "Conversation", exact: true }).click();
  await page.getByLabel("Message Utsav", { exact: true }).fill("What should I finish first?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("log")).toBeVisible();
  await accessible(page);
  await page.getByRole("button", { name: "Review my budget", exact: true }).click();
  await page.getByLabel("Target budget (INR)", { exact: true }).fill("180001");
  await page.getByRole("button", { name: "Preview budget proposal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Review your proposed budget" })).toBeVisible();
  await accessible(page);
  await page.goto("/events");
  await expect(page.getByRole("link", { name: "Garden wedding", exact: true })).toBeVisible();
  await accessible(page);
});
