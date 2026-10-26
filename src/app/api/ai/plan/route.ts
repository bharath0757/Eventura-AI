import { assist } from "@/lib/ai/service";
import { requestSchema } from "@/lib/ai/schemas";
import { OptimizationError } from "@/lib/ai/optimizer";
import { createThrottle, readJson, RequestFailure } from "@/lib/ai/http";
export const runtime = "nodejs";
export const maxDuration = 75;
const allow = createThrottle();
const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
export async function POST(request: Request) {
  try {
    if (!allow())
      throw new RequestFailure(
        429,
        "RATE_LIMIT",
        "Too many assistant requests. Wait one minute and try again.",
      );
    const origin = request.headers.get("origin");
    if (origin) {
      let originUrl: URL;
      try {
        originUrl = new URL(origin);
      } catch {
        throw new RequestFailure(403, "ORIGIN", "Use the assistant from this website.");
      }
      // Next's internal URL can use its bind address; the browser uses the public Host.
      const expectedHost = request.headers.get("host") ?? new URL(request.url).host;
      if (!["http:", "https:"].includes(originUrl.protocol) || originUrl.host !== expectedHost)
        throw new RequestFailure(403, "ORIGIN", "Use the assistant from this website.");
    }
    const parsed = requestSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new RequestFailure(
        400,
        "INVALID_REQUEST",
        "Check the event plan, target budget, protected categories and question length.",
      );
    return Response.json(await assist(parsed.data, request.signal), { headers });
  } catch (e) {
    const error =
      e instanceof RequestFailure
        ? e
        : e instanceof OptimizationError
          ? new RequestFailure(422, "INFEASIBLE_BUDGET", e.message)
          : new RequestFailure(
              503,
              "ASSISTANT_UNAVAILABLE",
              "The assistant is unavailable. Your saved event is unchanged. Try again shortly.",
            );
    return Response.json(
      { error: { code: error.code, message: error.message } },
      {
        status: error.status,
        headers: { ...headers, ...(error.status === 429 ? { "Retry-After": "60" } : {}) },
      },
    );
  }
}
