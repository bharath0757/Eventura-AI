import fs from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
};
const base = new URL(arg("url", "http://127.0.0.1:3044"));
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) {
  throw new Error("Performance fixtures are local-only. Use an isolated local production server.");
}
const out = path.resolve(arg("out", "test-results/performance"));
const label = arg("label", "candidate");
const runs = Number(arg("runs", "3"));
if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error("Use 1–5 runs.");
const storageKey = "eventura-ai:v1:events";
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const gzipAssets = new Map();
async function compressedResourceSize(request, resource) {
  if (!gzipAssets.has(resource.path)) {
    const response = await request.get(new URL(resource.path, base).href);
    if (!response.ok()) throw new Error(`Asset ${response.status()}: ${resource.path}`);
    const body = await response.body();
    if (body.length !== resource.decoded)
      throw new Error(`Decoded resource size changed: ${resource.path}`);
    gzipAssets.set(resource.path, gzipSync(body, { level: 9 }).length);
  }
  return gzipAssets.get(resource.path);
}
let fixture;
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  // Build the synthetic fixture through the real wizard so the benchmark also
  // works against an older build without importing a newer planning engine.
  await page.goto(new URL("/events/new?category=wedding", base).href);
  await page.getByLabel("Event name", { exact: true }).fill("Performance garden wedding");
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 120);
  await page.getByLabel("Event date", { exact: true }).fill(date.toISOString().slice(0, 10));
  await page.getByLabel("Expected guests", { exact: true }).fill("120");
  await page.getByLabel("City or location", { exact: true }).fill("Hyderabad");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Theme & atmosphere", { exact: true }).fill("Sunflower garden ceremony");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Total budget (INR)", { exact: true }).fill("240001");
  await page.getByRole("button", { name: /^Food quality/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Create my event", exact: true }).click();
  await page.getByRole("heading", { name: "Performance garden wedding", exact: true }).waitFor();
  fixture = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)).events[0],
    storageKey,
  );
  await context.close();
  const routes = [
    ["landing", "/"],
    ["wizard", "/events/new?category=wedding"],
    ["saved", "/events"],
    ["dashboard", `/events/${fixture.id}`],
  ];
  const measurements = [];
  for (const viewport of [
    { name: "desktop", width: 1365, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    for (const [name, route] of routes) {
      const context = await browser.newContext({
        viewport,
        deviceScaleFactor: 1,
        isMobile: viewport.name === "mobile",
      });
      await context.addInitScript(
        ({ key, event }) =>
          localStorage.setItem(key, JSON.stringify({ version: 1, events: [event] })),
        { key: storageKey, event: fixture },
      );
      const page = await context.newPage();
      page.setDefaultTimeout(30_000);
      await page.route("**/api/ai/plan", (route) => route.abort());
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.coverage.startCSSCoverage();
      await page.goto(new URL(route, base).href, { waitUntil: "networkidle" });
      const coverage = await page.coverage.stopCSSCoverage();
      const resources = await page.evaluate(() =>
        performance.getEntriesByType("resource").map((r) => ({
          path: new URL(r.name).pathname,
          request: new URL(r.name).pathname + new URL(r.name).search,
          transfer: r.transferSize,
          decoded: r.decodedBodySize,
          initiator: r.initiatorType,
        })),
      );
      for (const resource of resources.filter((r) => /\.(js|css)$/.test(r.path))) {
        resource.gzip = await compressedResourceSize(context.request, resource);
      }
      const sum = (re, key) =>
        resources.filter((r) => re.test(r.path)).reduce((n, r) => n + r[key], 0);
      const documentBytes = await page.evaluate(() => {
        const navigation = performance.getEntriesByType("navigation")[0];
        const inlineCssDecoded = [...document.querySelectorAll("style")].reduce(
          (sum, style) => sum + new TextEncoder().encode(style.textContent || "").length,
          0,
        );
        return {
          inlineCssDecoded,
          htmlDecoded: navigation.decodedBodySize,
          htmlTransferred: navigation.transferSize,
        };
      });
      measurements.push({
        name,
        viewport: viewport.name,
        cssDecoded: sum(/\.css$/, "decoded") + documentBytes.inlineCssDecoded,
        linkedCssDecoded: sum(/\.css$/, "decoded"),
        ...documentBytes,
        cssTransferred: sum(/\.css$/, "transfer"),
        jsDecoded: sum(/\.js$/, "decoded"),
        jsTransferred: sum(/\.js$/, "transfer"),
        jsGzip: sum(/\.js$/, "gzip"),
        cssGzip: sum(/\.css$/, "gzip"),
        fontsTransferred: sum(/\.woff2?$/, "transfer"),
        imagesTransferred: sum(/^\/_next\/image$|\.(png|jpe?g|webp|avif|svg|ico)$/i, "transfer"),
        cssUsed: coverage.reduce(
          (n, c) => n + c.ranges.reduce((s, r) => s + r.end - r.start, 0),
          0,
        ),
        errors,
        resources,
      });
      await context.close();
    }
  }
  const interactions = [];
  for (const count of [1, 25, 100]) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.goto(base.href);
    const events = Array.from({ length: count }, (_, i) => ({
      ...structuredClone(fixture),
      id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
      brief: { ...fixture.brief, name: `Synthetic event ${i + 1}` },
    }));
    await page.evaluate(
      ({ key, events }) => localStorage.setItem(key, JSON.stringify({ version: 1, events })),
      { key: storageKey, events },
    );
    await page.goto(new URL(`/events/${events[0].id}`, base).href, { waitUntil: "networkidle" });
    const selector = page.getByLabel(`Status: ${fixture.plan.timeline[0].title}`, { exact: true });
    await selector.waitFor();
    const timing = await selector.evaluate(async (element) => {
      const durations = [];
      for (let i = 0; i < 5; i++) {
        const started = performance.now();
        element.value = i % 2 === 0 ? "completed" : "pending";
        element.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        durations.push(performance.now() - started);
      }
      return durations;
    });
    const persisted = await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)).events[0].plan.timeline[0].status,
      storageKey,
    );
    interactions.push({ count, eventToTwoAnimationFramesMs: timing, persistedStatus: persisted });
    await context.close();
  }
  const summary = {
    label,
    referenceCommit: process.env.GITHUB_SHA || arg("revision", undefined),
    browserVersion: browser.version(),
    nodeVersion: process.version,
    platform: process.platform,
    compressionMethod:
      "Each recorded JS/CSS resource body independently gzip level9; duplicate resource entries count as separate requests.",
    recordedAt: new Date().toISOString(),
    baseURL: base.origin,
    collectionMethod:
      "Fresh browser context per route, cold browser cache, navigation plus framework prefetch until networkidle; transfer includes HTTP overhead. Interaction is event dispatch to two animation frames, not field INP.",
    measurements,
    interactions,
    lighthouse: [],
  };
  const reportPath = path.join(out, `${label}.json`);
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
  console.log(`Resource baseline written: ${reportPath}`);
  // Lighthouse uses a separate temporary Chrome profile. Only synthetic storage
  // and numeric audit summaries are retained; no image/trace files are saved.
  const chrome = await launch({
    chromePath: arg("chrome-path", process.env.CHROME_PATH || chromium.executablePath()),
    chromeFlags: [
      "--headless",
      "--disable-gpu",
      "--no-first-run",
      ...(process.env.CI === "true" ? ["--no-sandbox", "--disable-dev-shm-usage"] : []),
    ],
    logLevel: "silent",
  });
  try {
    const connected = await chromium.connectOverCDP(`http://localhost:${chrome.port}`);
    const page = await connected.contexts()[0].newPage();
    await page.goto(base.href);
    await page.evaluate(
      ({ key, event }) =>
        localStorage.setItem(key, JSON.stringify({ version: 1, events: [event] })),
      { key: storageKey, event: fixture },
    );
    const cdp = await page.context().newCDPSession(page);
    for (const [name, route] of routes) {
      for (let run = 1; run <= runs; run++) {
        await cdp.send("Network.clearBrowserCache");
        const result = await lighthouse(new URL(route, base).href, {
          port: chrome.port,
          onlyCategories: ["performance"],
          formFactor: "mobile",
          disableStorageReset: true,
          disableFullPageScreenshot: true,
          logLevel: "error",
          output: "json",
        });
        if (!result || result.lhr.runtimeError)
          throw new Error(`Lighthouse ${name}: ${result?.lhr.runtimeError?.code || "no result"}`);
        const { lhr } = result;
        const metric = (id) => lhr.audits[id]?.numericValue ?? null;
        const item = {
          name,
          run,
          lighthouseVersion: lhr.lighthouseVersion,
          benchmarkIndex: lhr.environment?.benchmarkIndex,
          score: lhr.categories.performance.score * 100,
          lcpMs: metric("largest-contentful-paint"),
          cls: metric("cumulative-layout-shift"),
          tbtMs: metric("total-blocking-time"),
          fcpMs: metric("first-contentful-paint"),
          speedIndexMs: metric("speed-index"),
          insights: Object.fromEntries(
            ["lcp-breakdown-insight", "lcp-discovery-insight", "render-blocking-insight"]
              .filter((id) => lhr.audits[id])
              .map((id) => [id, { score: lhr.audits[id].score, details: lhr.audits[id].details }]),
          ),
          imageRequests: (lhr.audits["network-requests"]?.details?.items ?? [])
            .filter((row) => row.resourceType === "Image" && row.url.startsWith(base.origin))
            .map((row) => ({
              request: new URL(row.url).pathname + new URL(row.url).search,
              bytes: row.resourceSize,
              transferred: row.transferSize,
              priority: row.priority,
            })),
          settings: {
            formFactor: lhr.configSettings.formFactor,
            throttlingMethod: lhr.configSettings.throttlingMethod,
            throttling: lhr.configSettings.throttling,
            screenEmulation: lhr.configSettings.screenEmulation,
          },
        };
        summary.lighthouse.push(item);
        await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
        console.log(
          JSON.stringify({
            name,
            run,
            score: item.score,
            lcpMs: item.lcpMs,
            cls: item.cls,
            tbtMs: item.tbtMs,
          }),
        );
      }
    }
    await connected.close();
  } finally {
    await chrome.kill();
  }
  console.log(`Completed: ${reportPath}`);
} finally {
  await browser.close();
}
