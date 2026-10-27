import "server-only";
import { AI_LIMITS } from "./limits";
export class RequestFailure extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export async function readJson(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json"
  )
    throw new RequestFailure(415, "CONTENT_TYPE", "Send a JSON request.");
  if (Number(request.headers.get("content-length")) > AI_LIMITS.bodyBytes)
    throw new RequestFailure(413, "PAYLOAD_TOO_LARGE", "The request exceeds 64 KiB.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestFailure(400, "INVALID_JSON", "A JSON request body is required.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const read = async () => {
      let length = 0;
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > AI_LIMITS.bodyBytes)
          throw new RequestFailure(413, "PAYLOAD_TOO_LARGE", "The request exceeds 64 KiB.");
        chunks.push(value);
      }
      try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
      } catch {
        throw new RequestFailure(400, "INVALID_JSON", "The request contains invalid JSON.");
      }
    };
    // A producer's failed cleanup must not escape as an unhandled process rejection.
    return await Promise.race([
      read(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          void reader.cancel().catch(() => {});
          reject(
            new RequestFailure(408, "REQUEST_TIMEOUT", "The request took too long to arrive."),
          );
        }, 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
    void reader.cancel().catch(() => {});
  }
}
/** Shared-instance cap cannot be bypassed by spoofing a forwarded IP. No request content retained. */
export function createThrottle(limit = 30, windowMs = 60_000) {
  let start = 0,
    count = 0;
  return (now = Date.now()) => {
    if (now - start >= windowMs) {
      start = now;
      count = 0;
    }
    return ++count <= limit;
  };
}
