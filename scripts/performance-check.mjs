import fs from "node:fs/promises";
import path from "node:path";

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index < 0 ? fallback : process.argv[index + 1];
};
const baselinePath = path.resolve(arg("baseline", "docs/performance-baseline.json"));
const candidatePath = path.resolve(arg("candidate", "test-results/performance/candidate.json"));
const reportPath = path.resolve(arg("out", "test-results/performance/comparison.json"));
const markdownPath = arg("markdown", undefined);
const [baseline, candidate] = await Promise.all(
  [baselinePath, candidatePath].map(async (file) => JSON.parse(await fs.readFile(file, "utf8"))),
);
const failures = [];
const requireGate = (condition, message) => {
  if (!condition) failures.push(message);
};
const positive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
const nonnegative = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const routes = ["landing", "wizard", "saved", "dashboard"];
const resources = [];
for (const viewport of ["desktop", "mobile"]) {
  for (const name of routes) {
    const beforeRows =
      baseline.measurements?.filter((row) => row.name === name && row.viewport === viewport) ?? [];
    const afterRows =
      candidate.measurements?.filter((row) => row.name === name && row.viewport === viewport) ?? [];
    requireGate(
      beforeRows.length === 1 && afterRows.length === 1,
      `${name}/${viewport}: exactly one baseline and candidate resource measurement required`,
    );
    if (beforeRows.length !== 1 || afterRows.length !== 1) continue;
    const [before] = beforeRows,
      [after] = afterRows;
    requireGate(
      [before.cssDecoded, after.cssDecoded, before.jsGzip, after.jsGzip].every(positive),
      `${name}/${viewport}: valid nonzero CSS and gzip JS byte counts required`,
    );
    requireGate(
      Array.isArray(after.errors) && after.errors.length === 0,
      `${name}/${viewport}: browser errors must be empty`,
    );
    requireGate(
      nonnegative(after.inlineCssDecoded) &&
        nonnegative(after.linkedCssDecoded) &&
        after.cssDecoded === after.inlineCssDecoded + after.linkedCssDecoded,
      `${name}/${viewport}: CSS must count linked and inline style bodies`,
    );
    const cssReduction = 1 - after.cssDecoded / before.cssDecoded;
    const item = {
      name,
      viewport,
      cssBefore: before.cssDecoded,
      cssAfter: after.cssDecoded,
      cssReductionPercent: cssReduction * 100,
      jsGzipBefore: before.jsGzip,
      jsGzipAfter: after.jsGzip,
      fontTransferBefore: before.fontsTransferred,
      fontTransferAfter: after.fontsTransferred,
    };
    resources.push(item);
    requireGate(
      cssReduction >= 0.3,
      `${name}/${viewport}: initial decoded CSS must decrease by at least 30%`,
    );
    requireGate(after.jsGzip <= before.jsGzip, `${name}/${viewport}: gzip JS must not increase`);
  }
}
requireGate(
  candidate.measurements?.length === 8,
  "Exactly eight route/viewport resource measurements required",
);
const lighthouse = [];
for (const name of routes) {
  const rows = candidate.lighthouse?.filter((row) => row.name === name) ?? [];
  requireGate(
    rows.length === 3 && new Set(rows.map((row) => row.run)).size === 3,
    `${name}: three distinct Lighthouse runs required`,
  );
  if (rows.length !== 3) continue;
  requireGate(
    rows.every(
      (row) =>
        positive(row.score) && row.score <= 100 && positive(row.lcpMs) && nonnegative(row.cls),
    ),
    `${name}: valid score/LCP/CLS measurements required`,
  );
  requireGate(
    rows.every(
      (row) =>
        row.settings?.formFactor === "mobile" && row.settings?.throttlingMethod === "simulate",
    ),
    `${name}: mobile simulated-throttling Lighthouse runs required`,
  );
  const before = baseline.lighthouse?.filter((row) => row.name === name) ?? [];
  if (before.length)
    requireGate(
      rows.every((row) => JSON.stringify(row.settings) === JSON.stringify(before[0].settings)),
      `${name}: Lighthouse mobile/throttling settings must match the recorded baseline`,
    );
  const item = {
    name,
    scoreBefore: before.length ? median(before.map((row) => row.score)) : null,
    score: median(rows.map((row) => row.score)),
    lcpBefore: before.length ? median(before.map((row) => row.lcpMs)) : null,
    lcpMs: median(rows.map((row) => row.lcpMs)),
    clsBefore: before.length ? median(before.map((row) => row.cls)) : null,
    cls: median(rows.map((row) => row.cls)),
  };
  lighthouse.push(item);
  requireGate(
    item.score >= 95,
    `${name}: median mobile Lighthouse performance must be at least 95`,
  );
  requireGate(item.lcpMs <= 2500, `${name}: median LCP must be at most 2500ms`);
  requireGate(item.cls <= 0.1, `${name}: median CLS must be at most 0.1`);
}
requireGate(candidate.lighthouse?.length === 12, "Exactly twelve Lighthouse audits required");
const interactions = [];
for (const count of [1, 25, 100]) {
  const rows = candidate.interactions?.filter((row) => row.count === count) ?? [];
  requireGate(rows.length === 1, `${count} saved events: one task-mutation measurement required`);
  if (rows.length !== 1) continue;
  const [after] = rows;
  requireGate(
    after.eventToTwoAnimationFramesMs?.length === 5 &&
      after.eventToTwoAnimationFramesMs.every(positive),
    `${count} saved events: five valid task-mutation samples required`,
  );
  requireGate(
    after.persistedStatus === "completed",
    `${count} saved events: last mutation must be persisted`,
  );
  const before = baseline.interactions?.find((row) => row.count === count);
  interactions.push({
    count,
    beforeMs: before ? median(before.eventToTwoAnimationFramesMs) : null,
    afterMs: median(after.eventToTwoAnimationFramesMs ?? []),
  });
}
requireGate(
  candidate.interactions?.length === 3,
  "Exactly three collection-size mutation benchmarks required",
);
const report = {
  passed: failures.length === 0,
  baseline: baseline.label,
  candidate: candidate.label,
  recordedAt: new Date().toISOString(),
  resources,
  lighthouse,
  interactions,
  failures,
};
await fs.mkdir(path.dirname(reportPath), { recursive: true });
await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
if (markdownPath) {
  const f = (value) => (value == null ? "—" : Math.round(value * 100) / 100);
  const markdown = [
    "# Measured performance comparison",
    "",
    `Baseline: ${baseline.referenceCommit || baseline.label}. Candidate: ${candidate.referenceCommit || candidate.label}.`,
    "",
    "Fresh local production-build contexts; navigation plus framework prefetch until networkidle. Byte totals describe these routes and synthetic fixtures, not every possible interaction. JS bytes are independently gzip-compressed at level 9. Lighthouse values are medians of three mobile simulated-throttling runs. Local laboratory results do not establish field Core Web Vitals or a competition score.",
    "",
    "| Route / viewport | Initial CSS before → after (bytes) | CSS reduction | gzip JS before → after (bytes) |",
    "| --- | ---: | ---: | ---: |",
    ...resources.map(
      (row) =>
        `| ${row.name} / ${row.viewport} | ${row.cssBefore} → ${row.cssAfter} | ${f(row.cssReductionPercent)}% | ${row.jsGzipBefore} → ${row.jsGzipAfter} |`,
    ),
    "",
    "| Mobile route | Performance before → after | LCP before → after (ms) | CLS before → after |",
    "| --- | ---: | ---: | ---: |",
    ...lighthouse.map(
      (row) =>
        `| ${row.name} | ${f(row.scoreBefore)} → ${f(row.score)} | ${f(row.lcpBefore)} → ${f(row.lcpMs)} | ${f(row.clsBefore)} → ${f(row.cls)} |`,
    ),
    "",
    "| Saved events | Task event to two animation frames before → after (median ms) |",
    "| ---: | ---: |",
    ...interactions.map((row) => `| ${row.count} | ${f(row.beforeMs)} → ${f(row.afterMs)} |`),
    "",
    "The interaction timer includes frame scheduling and persisted state verification; it is not a field INP measurement. It cannot isolate storage parsing time. The component regression separately verifies that successful mutations do not trigger a second storage read.",
    "",
    `Gate result: **${report.passed ? "passed" : "failed"}**.`,
    ...failures.map((failure) => `- ${failure}`),
    "",
  ].join("\n");
  await fs.mkdir(path.dirname(path.resolve(markdownPath)), { recursive: true });
  await fs.writeFile(path.resolve(markdownPath), markdown);
}
console.table(
  resources.map(({ name, viewport, cssReductionPercent, jsGzipBefore, jsGzipAfter }) => ({
    route: `${name}/${viewport}`,
    cssReductionPercent: Math.round(cssReductionPercent * 100) / 100,
    jsGzipBefore,
    jsGzipAfter,
  })),
);
console.table(lighthouse);
for (const failure of failures) console.error(failure);
console.log(`Performance gates ${report.passed ? "passed" : "failed"}: ${reportPath}`);
if (!report.passed) process.exitCode = 1;
