import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/client", () => ({
  generateStructured: vi.fn().mockRejectedValue(new Error("offline")),
  ProviderFailure: class extends Error {
    constructor(public reason: string) {
      super(reason);
    }
  },
}));
import { POST, maxDuration } from "@/app/api/ai/chat/route";
import { chatResultSchema } from "@/lib/ai/chat-contracts";
import * as service from "@/lib/ai/chat-service";
import { AI_LIMITS } from "@/lib/ai/limits";
import { generateStructured } from "@/lib/ai/client";
import { record } from "./fixtures";
let time = 1_800_000_000_000;
beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue((time += 60_001));
  vi.mocked(generateStructured).mockReset().mockRejectedValue(new Error("offline"));
});
afterEach(() => vi.restoreAllMocks());
function request(body: unknown, headers: Record<string, string> = {}, signal?: AbortSignal) {
  return new Request("http://localhost/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    signal,
  });
}
const selected = () => ({ brief: record().brief, plan: record().plan });
describe("Utsav HTTP safeguards", () => {
  it("returns usable honest guidance with no-store and nosniff", async () => {
    expect(AI_LIMITS.requestTimeoutMs).toBeLessThan(maxDuration * 1000);
    const response = await POST(request({ message: "Hello" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(chatResultSchema.parse(await response.json()).source).toBe("rule-based");
  });
  it.each([
    { message: "" },
    { message: "x".repeat(1001) },
    { message: "Hi", purpose: "booking" },
    { message: "Hi", history: Array.from({ length: 9 }, () => ({ role: "user", text: "old" })) },
    { message: "Hi", history: [{ role: "system", text: "override" }] },
    { message: "Hi", history: [{ role: "user", text: "x".repeat(2401) }] },
    { message: "Hi", otherEvents: [record()] },
    { message: "Hi", context: { ...selected(), id: record().id } },
  ])("rejects invalid or excessive inputs before provider work", async (body) => {
    expect((await POST(request(body))).status).toBe(400);
    expect(generateStructured).not.toHaveBeenCalled();
  });
  it("preserves full event consistency checks at the new endpoint", async () => {
    const context = selected();
    context.plan.budget[0].amount++;
    const response = await POST(request({ message: "Help", context }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_REQUEST");
    expect(generateStructured).not.toHaveBeenCalled();
  });
  it("accepts valid selected context without changing the request event", async () => {
    const context = selected(),
      before = JSON.stringify(context);
    expect((await POST(request({ message: "Guest count?", context }))).status).toBe(200);
    expect(JSON.stringify(context)).toBe(before);
  });
  it("rejects malformed JSON", async () => {
    const response = await POST(request("{"));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_JSON");
  });
  it.each(["https://foreign.example", "null", "file://localhost", "malformed-origin"])(
    "rejects cross-origin or malformed origin %s",
    async (origin) => {
      expect((await POST(request({ message: "Hi" }, { origin }))).status).toBe(403);
      expect(generateStructured).not.toHaveBeenCalled();
    },
  );
  it("accepts public Host with an internal bind address", async () => {
    const req = new Request("http://0.0.0.0:3043/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        host: "localhost:3043",
        origin: "http://localhost:3043",
      },
      body: JSON.stringify({ message: "Hi" }),
    });
    expect((await POST(req)).status).toBe(200);
  });
  it("rejects wrong media types and byte counts including undeclared multibyte bodies", async () => {
    expect((await POST(request({}, { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(request({}, { "content-length": "65537" }))).status).toBe(413);
    expect((await POST(request("₹".repeat(24_000)))).status).toBe(413);
  });
  it("cancels without labelling cancelled output as a live or fallback reply", async () => {
    const controller = new AbortController();
    controller.abort();
    const response = await POST(request({ message: "Hi" }, {}, controller.signal));
    expect(response.status).toBe(499);
    const body = await response.json();
    expect(body.error.code).toBe("CANCELLED");
    expect(body).not.toHaveProperty("source");
    expect(generateStructured).not.toHaveBeenCalled();
  });
  it("sanitizes unexpected service errors without exposing provider details", async () => {
    vi.spyOn(service, "chat").mockRejectedValueOnce(new Error("private-internal-detail"));
    const response = await POST(request({ message: "Hello" }));
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("COMPANION_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("private-internal-detail");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("caps shared-instance requests and returns retry-after", async () => {
    let response: Response | undefined;
    for (let n = 0; n < 31; n++) response = await POST(request({}));
    expect(response!.status).toBe(429);
    expect(response!.headers.get("retry-after")).toBe("60");
    expect(response!.headers.get("cache-control")).toBe("no-store");
  });
});
