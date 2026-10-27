# Measured performance comparison

Baseline: df5477351af034a1321098ca35e930107803279b. Candidate: aaae0f136c491df4113280beae4374711e8c0b0b.

Fresh local production-build contexts; navigation plus framework prefetch until networkidle. Byte totals describe these routes and synthetic fixtures, not every possible interaction. JS bytes are independently gzip-compressed at level 9. Lighthouse values are medians of three mobile simulated-throttling runs. Local laboratory results do not establish field Core Web Vitals or a competition score.

| Route / viewport    | Initial CSS before → after (bytes) | CSS reduction | gzip JS before → after (bytes) |
| ------------------- | ---------------------------------: | ------------: | -----------------------------: |
| landing / desktop   |                      99365 → 52088 |        47.58% |                159237 → 145239 |
| wizard / desktop    |                      99365 → 58182 |        41.45% |                219801 → 194943 |
| saved / desktop     |                      99365 → 58182 |        41.45% |                213297 → 183563 |
| dashboard / desktop |                      99365 → 58182 |        41.45% |                223168 → 191100 |
| landing / mobile    |                      99365 → 52088 |        47.58% |                159237 → 145239 |
| wizard / mobile     |                      99365 → 58182 |        41.45% |                219801 → 194943 |
| saved / mobile      |                      99365 → 58182 |        41.45% |                213297 → 183563 |
| dashboard / mobile  |                      99365 → 58182 |        41.45% |                223168 → 191100 |

| Mobile route | Performance before → after | LCP before → after (ms) | CLS before → after |
| ------------ | -------------------------: | ----------------------: | -----------------: |
| landing      |                    95 → 98 |       2901.24 → 2366.26 |              0 → 0 |
| wizard       |                    96 → 99 |       2736.99 → 2110.42 |              0 → 0 |
| saved        |                    96 → 99 |       2651.82 → 1962.14 |           0.06 → 0 |
| dashboard    |                    88 → 98 |       2806.41 → 2348.88 |           0.18 → 0 |

| Saved events | Task event to two animation frames before → after (median ms) |
| -----------: | ------------------------------------------------------------: |
|            1 |                                                   33.3 → 33.3 |
|           25 |                                                   32.5 → 33.3 |
|          100 |                                                   33.1 → 33.3 |

The interaction timer includes frame scheduling and persisted state verification; it is not a field INP measurement. It cannot isolate storage parsing time. The component regression separately verifies that successful mutations do not trigger a second storage read.

Gate result: **passed**.
