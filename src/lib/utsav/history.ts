import { z } from "zod";
import type { StoragePort } from "@/lib/storage/records";

export const CHAT_STORAGE_KEY = "eventura-ai:utsav:v1:threads";
const MAX_MESSAGES = 50;
const MAX_STORE_BYTES = 1024 * 1024;
const encoder = new TextEncoder();

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: "live-ai" | "rule-based";
  notice?: string;
  purpose?: "chat" | "invitation";
}

const threadSchema = z.union([z.literal("general"), z.uuid()]);
const commonFields = {
  id: z.uuid(),
  notice: z.string().max(1000).optional(),
  purpose: z.enum(["chat", "invitation"]).optional(),
};
const messageText = (limit: number) =>
  z
    .string()
    .min(1)
    .max(limit)
    .refine((text) => text.trim().length > 0);
const messageSchema = z.discriminatedUnion("role", [
  z.strictObject({
    ...commonFields,
    role: z.literal("user"),
    text: messageText(1000),
    source: z.never().optional(),
  }),
  z.strictObject({
    ...commonFields,
    role: z.literal("assistant"),
    text: messageText(4000),
    source: z.enum(["live-ai", "rule-based"]),
  }),
]);
const messagesSchema = z
  .array(messageSchema)
  .refine((messages) => new Set(messages.map((message) => message.id)).size === messages.length);
// Check keys before z.record parses them: it intentionally skips __proto__ keys.
// Silently removing one would overwrite an invalid saved envelope on the next save.
const threadsSchema = z
  .unknown()
  .superRefine((value, context) => {
    if (typeof value !== "object" || value === null) return;
    for (const key of Object.keys(value)) {
      if (!threadSchema.safeParse(key).success)
        context.addIssue({
          code: "custom",
          message: "Invalid conversation identifier",
          path: [key],
        });
    }
  })
  .pipe(
    z.record(
      threadSchema,
      messagesSchema.refine((messages) => messages.length <= MAX_MESSAGES),
    ),
  );
const envelopeSchema = z.strictObject({
  version: z.literal(1),
  threads: threadsSchema,
});
type Envelope = z.infer<typeof envelopeSchema>;

const invalidStoredHistory =
  "Your saved chat history is unreadable or unsupported. It has been preserved.";

function checkedThread(thread: string): string {
  const result = threadSchema.safeParse(thread);
  if (!result.success)
    throw new Error("This conversation is invalid. Choose an event or start a general chat.");
  return result.data;
}

function browserStorage(): StoragePort {
  try {
    if (typeof window === "undefined") throw new Error();
    return window.localStorage;
  } catch {
    throw new Error("Chat history is unavailable. Enable browser storage and try again.");
  }
}

/** Browser-local conversation storage, separate from saved event records. */
export function createChatHistory(storage?: StoragePort) {
  const port = () => storage ?? browserStorage();

  function read(): Envelope {
    let content: string | null;
    try {
      content = port().getItem(CHAT_STORAGE_KEY);
    } catch {
      throw new Error("Your chat history could not be read. Enable browser storage and try again.");
    }
    if (content === null) return { version: 1, threads: {} };
    if (encoder.encode(content).byteLength > MAX_STORE_BYTES)
      throw new Error("Your saved chat history exceeds the storage limit. It has been preserved.");
    let value: unknown;
    try {
      value = JSON.parse(content);
    } catch {
      throw new Error(invalidStoredHistory);
    }
    const result = envelopeSchema.safeParse(value);
    if (!result.success) throw new Error(invalidStoredHistory);
    return result.data;
  }

  function write(envelope: Envelope): void {
    const content = JSON.stringify(envelope);
    if (encoder.encode(content).byteLength > MAX_STORE_BYTES)
      throw new Error(
        "Your chat history is too large to save. Clear an older conversation and try again. Existing conversations have been preserved.",
      );
    try {
      port().setItem(CHAT_STORAGE_KEY, content);
    } catch {
      throw new Error(
        "Your chat history could not be saved. Storage may be full or blocked. Your existing history has been preserved.",
      );
    }
  }

  return {
    load(thread: string): ChatMessage[] {
      const id = checkedThread(thread);
      return read().threads[id] ?? [];
    },
    save(thread: string, messages: ChatMessage[]): ChatMessage[] {
      const id = checkedThread(thread);
      const result = messagesSchema.safeParse(messages);
      if (!result.success)
        throw new Error(
          "This conversation could not be saved because a message is invalid or too long. Your saved history has been preserved.",
        );
      const envelope = read();
      const retained = result.data.slice(-MAX_MESSAGES);
      write({ ...envelope, threads: { ...envelope.threads, [id]: retained } });
      return retained;
    },
    clear(thread: string): void {
      const id = checkedThread(thread);
      const envelope = read();
      if (!Object.hasOwn(envelope.threads, id)) return;
      const threads = { ...envelope.threads };
      delete threads[id];
      write({ ...envelope, threads });
    },
  };
}
