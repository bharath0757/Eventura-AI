import { z } from "zod";
import { chat } from "@/lib/ai/chat-service";
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
        "Too many companion requests. Wait one minute and try again.",
      );
    const origin = request.headers.get("origin");
    if (origin) {
      let originUrl: URL;
      try {
        originUrl = new URL(origin);
      } catch {
        throw new RequestFailure(403, "ORIGIN", "Use the companion from this website.");
      }
      const expectedHost = request.headers.get("host") ?? new URL(request.url).host;
      if (!["http:", "https:"].includes(originUrl.protocol) || originUrl.host !== expectedHost)
        throw new RequestFailure(403, "ORIGIN", "Use the companion from this website.");
    }
    return Response.json(await chat(await readJson(request), request.signal), { headers });
  } catch (e) {
    const error =
      e instanceof RequestFailure
        ? e
        : e instanceof z.ZodError
          ? new RequestFailure(
              400,
              "INVALID_REQUEST",
              "Check the message, recent history and attached event plan.",
            )
          : new RequestFailure(
              503,
              "COMPANION_UNAVAILABLE",
              "Utsav is unavailable. Your event is unchanged. Try again shortly.",
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
