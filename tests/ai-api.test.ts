import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/ai/client", () => ({ generate: vi.fn().mockRejectedValue(new Error("offline")), ProviderFailure: class extends Error { constructor(public reason: string) { super(reason); } } }));
import { POST } from "@/app/api/ai/plan/route";
import { createThrottle, readJson } from "@/lib/ai/http";
import { AI_LIMITS } from "@/lib/ai/limits";
import { record } from "./fixtures";
beforeEach(() => { vi.useRealTimers(); });
const input = () => ({ operation: "recommendations", brief: record().brief, plan: record().plan });
function request(body: string, headers: Record<string,string> = {}) { return new Request("http://localhost/api/ai/plan", { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body }); }
describe("API safeguards", () => {
  it("returns labelled usable fallback with no-store", async () => { const response = await POST(request(JSON.stringify(input()))); expect(response.status).toBe(200); expect(response.headers.get("Cache-Control")).toBe("no-store"); expect((await response.json()).source).toBe("rule-based"); });
  it("rejects malformed JSON", async () => { const response = await POST(request("{")); expect(response.status).toBe(400); expect((await response.json()).error.code).toBe("INVALID_JSON"); });
  it("rejects invalid operations", async () => expect((await POST(request(JSON.stringify({ ...input(), operation: "book" })))).status).toBe(400));
  it("rejects excess body content even without content-length", async () => expect((await POST(request("x".repeat(AI_LIMITS.bodyBytes + 1)))).status).toBe(413));
  it("enforces byte count rather than character count", async () => expect((await POST(request("₹".repeat(24_000)))).status).toBe(413));
  it("rejects declared oversized body", async () => expect((await POST(request("{}", { "content-length": "999999" }))).status).toBe(413));
  it("rejects inappropriate media type", async () => expect((await POST(request("{}", { "content-type": "text/plain" }))).status).toBe(415));
  it("rejects cross-origin requests", async () => expect((await POST(request(JSON.stringify(input()), { origin: "https://foreign.example" }))).status).toBe(403));
  it("accepts the public host when Next uses an internal bind address", async () => {
    const req=new Request("http://0.0.0.0:3043/api/ai/plan",{method:"POST",headers:{"Content-Type":"application/json",host:"localhost:3043",origin:"http://localhost:3043"},body:JSON.stringify(input())});
    expect((await POST(req)).status).toBe(200);
  });
  it("returns a useful infeasibility response", async () => { const response = await POST(request(JSON.stringify({ ...input(), operation: "optimize", targetBudget: 1000, protectedCategories: ["food"] }))); expect(response.status).toBe(422); expect((await response.json()).error.message).toContain("10% contingency"); });
  it("caps shared-instance requests without retaining user data", () => { const allow = createThrottle(2); expect(allow(60000)).toBe(true); expect(allow(60001)).toBe(true); expect(allow(60002)).toBe(false); expect(allow(120001)).toBe(true); });
  it("API rate limit returns retry-after", async () => { let response: Response | undefined; for (let i=0;i<31;i++) response=await POST(request("{}")); expect(response!.status).toBe(429); expect(response!.headers.get("Retry-After")).toBe("60"); });
  it("times out an unfinished request body", async () => {
    vi.useFakeTimers();
    const body = new ReadableStream<Uint8Array>({ start() {} });
    const req = new Request("http://localhost", { method: "POST", headers: { "Content-Type": "application/json" }, body, duplex: "half" } as RequestInit);
    const pending = expect(readJson(req)).rejects.toMatchObject({ status: 408 }); await vi.advanceTimersByTimeAsync(5001); await pending; vi.useRealTimers();
  });
  it("handles a rejected stream cancellation during the body timeout",async()=>{
    vi.useFakeTimers();
    const body=new ReadableStream<Uint8Array>({start(){},cancel(){return Promise.reject(new Error("producer cancellation failed"));}});
    const request=new Request("http://localhost",{method:"POST",headers:{"Content-Type":"application/json"},body,duplex:"half"} as RequestInit);
    const pending=expect(readJson(request)).rejects.toMatchObject({status:408});await vi.advanceTimersByTimeAsync(5001);await pending;vi.useRealTimers();
  });
});
