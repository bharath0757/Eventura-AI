import { expect, test } from "@playwright/test";

const occasions = ["wedding", "birthday", "community"] as const;

test("landing photos wait until nearby and decode when reached", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.goto("/", { waitUntil: "networkidle" });
  expect(
    requested.some((url) => /(?:birthday|community)\.jpg/i.test(decodeURIComponent(url))),
  ).toBe(false);
  for (const occasion of occasions) {
    const frame = page.locator(`.occasion-image-${occasion}`);
    await frame.scrollIntoViewIfNeeded();
    const photo = frame.locator("span img");
    await expect(photo).toBeVisible();
    await expect
      .poll(() =>
        photo.evaluate((image) => {
          const element = image as HTMLImageElement;
          return element.complete && element.naturalWidth > 0;
        }),
      )
      .toBe(true);
  }
});

test("landing occasion photos remain available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    for (const occasion of occasions) {
      const frame = page.locator(`.occasion-image-${occasion}`);
      await frame.scrollIntoViewIfNeeded();
      const photo = frame.locator("noscript img");
      await expect(photo).toBeVisible();
      await expect
        .poll(() =>
          photo.evaluate((image) => {
            const element = image as HTMLImageElement;
            return element.complete && element.naturalWidth > 0;
          }),
        )
        .toBe(true);
    }
  } finally {
    await context.close();
  }
});
