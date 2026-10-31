import fs from "node:fs/promises";
const candidatePath = process.argv[2] || "test-results/performance/candidate.json";
const [baseline, candidate] = await Promise.all(
  ["docs/performance-candidate.json", candidatePath].map(async (file) =>
    JSON.parse(await fs.readFile(file, "utf8")),
  ),
);
const failures = [];
const rows = [];
for (const viewport of ["desktop", "mobile"])
  for (const name of ["landing", "wizard", "saved", "dashboard"]) {
    const before =
      baseline.measurements?.filter((row) => row.name === name && row.viewport === viewport) ?? [];
    const after =
      candidate.measurements?.filter((row) => row.name === name && row.viewport === viewport) ?? [];
    if (before.length !== 1 || after.length !== 1) {
      failures.push(`${name}/${viewport}: exactly one baseline and candidate row required`);
      continue;
    }
    const initial = before[0].jsGzip,
      current = after[0].jsGzip;
    if (![initial, current].every((n) => Number.isFinite(n) && n > 0)) {
      failures.push(`${name}/${viewport}: invalid gzip JavaScript measurement`);
      continue;
    }
    const delta = current - initial;
    rows.push({ route: `${name}/${viewport}`, baseline: initial, current, delta, limit: 5120 });
    if (delta > 5120)
      failures.push(
        `${name}/${viewport}: added initial JavaScript ${delta} exceeds 5120 gzip bytes`,
      );
  }
if (candidate.measurements?.length !== 8)
  failures.push("Exactly eight candidate measurements required");
console.table(rows);
for (const failure of failures) console.error(failure);
if (failures.length) process.exitCode = 1;
else console.log("Utsav initial JavaScript budget passed against released main 37b2eec.");
