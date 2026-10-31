import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CHAT_STORAGE_KEY, createChatHistory, type ChatMessage } from "@/lib/utsav/history";
import { STORAGE_KEY, type StoragePort } from "@/lib/storage/records";

class MemoryStorage implements StoragePort {
  data = new Map<string, string>();
  readFailure = false;
  writeFailure = false;
  writes = 0;
  getItem(key: string): string | null {
    if (this.readFailure) throw new Error("denied");
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    if (this.writeFailure) throw new Error("quota exceeded");
    this.writes += 1;
    this.data.set(key, value);
  }
}
const eventId = "a1111111-1111-4111-8111-111111111111";
const otherEventId = "b2222222-2222-4222-8222-222222222222";
function message(index = 1, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `c3333333-3333-4333-8333-${String(index).padStart(12, "0")}`,
    role: "user",
    text: `Question ${index}`,
    ...overrides,
  };
}
function assistant(index = 2, overrides: Partial<ChatMessage> = {}): ChatMessage {
  return message(index, {
    role: "assistant",
    source: "live-ai",
    text: "A useful answer.",
    ...overrides,
  });
}
let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Utsav browser-local history", () => {
  it("starts empty without creating storage and survives a fresh store instance", () => {
    const history = createChatHistory(storage);
    expect(history.load("general")).toEqual([]);
    expect(history.load(eventId)).toEqual([]);
    expect(storage.writes).toBe(0);
    const messages = [
      message(),
      assistant(2, { notice: "Estimated advice", purpose: "invitation" }),
    ];
    expect(history.save("general", messages)).toEqual(messages);
    expect(createChatHistory(storage).load("general")).toEqual(messages);
  });

  it("isolates general and event conversations and leaves saved events untouched", () => {
    storage.setItem(STORAGE_KEY, '{"version":1,"events":["unrelated data"]}');
    const eventBytes = storage.getItem(STORAGE_KEY);
    const history = createChatHistory(storage);
    history.save("general", [message(1)]);
    history.save(eventId, [message(2)]);
    history.save(otherEventId, [assistant(3, { source: "rule-based" })]);
    expect(history.load("general")).toEqual([message(1)]);
    expect(history.load(eventId)).toEqual([message(2)]);
    expect(history.load(otherEventId)).toEqual([assistant(3, { source: "rule-based" })]);
    expect(storage.getItem(STORAGE_KEY)).toBe(eventBytes);
  });

  it("keeps the newest 50 messages in order without mutating caller input", () => {
    const messages = Array.from({ length: 55 }, (_, index) => message(index));
    const original = structuredClone(messages);
    const retained = createChatHistory(storage).save(eventId, messages);
    expect(retained).toEqual(original.slice(5));
    expect(messages).toEqual(original);
    retained[0].text = "Changed outside storage";
    expect(createChatHistory(storage).load(eventId)).toEqual(original.slice(5));
  });

  it("returns detached data so edits to loaded messages need an explicit save", () => {
    const history = createChatHistory(storage);
    history.save("general", [message()]);
    history.load("general")[0].text = "Unsaved edit";
    expect(history.load("general")).toEqual([message()]);
  });

  it("clears only the chosen thread and treats an absent thread as a no-op", () => {
    const history = createChatHistory(storage);
    history.save("general", [message(1)]);
    history.save(eventId, [message(2)]);
    history.save(otherEventId, [message(3)]);
    history.clear(eventId);
    expect(history.load(eventId)).toEqual([]);
    expect(history.load("general")).toEqual([message(1)]);
    expect(history.load(otherEventId)).toEqual([message(3)]);
    const writes = storage.writes;
    history.clear(eventId);
    expect(storage.writes).toBe(writes);
    history.clear("general");
    history.clear(otherEventId);
    expect(JSON.parse(storage.getItem(CHAT_STORAGE_KEY)!)).toEqual({ version: 1, threads: {} });
  });

  it.each([
    ["invalid JSON", "{broken"],
    ["unknown version", JSON.stringify({ version: 2, threads: {} })],
    ["missing threads", JSON.stringify({ version: 1 })],
    ["unexpected envelope fields", JSON.stringify({ version: 1, threads: {}, extra: true })],
    ["invalid thread key", JSON.stringify({ version: 1, threads: { unrelated: [] } })],
    [
      "invalid message in another thread",
      JSON.stringify({
        version: 1,
        threads: { [eventId]: [{ role: "user", text: "missing ID" }] },
      }),
    ],
    [
      "too many persisted messages",
      JSON.stringify({
        version: 1,
        threads: { general: Array.from({ length: 51 }, (_, index) => message(index)) },
      }),
    ],
    ["prototype key", '{"version":1,"threads":{"__proto__":[]}}'],
    ["constructor key", '{"version":1,"threads":{"constructor":[]}}'],
    ["prototype envelope field", '{"version":1,"threads":{},"__proto__":{}}'],
    [
      "prototype message field",
      '{"version":1,"threads":{"general":[{"id":"c3333333-3333-4333-8333-000000000001","role":"user","text":"Hello","__proto__":{}}]}}',
    ],
  ])("preserves %s and refuses to overwrite or clear corrupt history", (_description, raw) => {
    storage.setItem(CHAT_STORAGE_KEY, raw);
    const history = createChatHistory(storage);
    expect(() => history.load("general")).toThrow(/preserved/);
    expect(() => history.save("general", [message()])).toThrow(/preserved/);
    expect(() => history.clear("general")).toThrow(/preserved/);
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBe(raw);
    expect(storage.writes).toBe(1);
  });

  it.each(["__proto__", "constructor", "toString", "", "event/../general", "not-a-uuid"])(
    "rejects thread identifier %s before accessing storage",
    (thread) => {
      const getItem = vi.spyOn(storage, "getItem");
      const history = createChatHistory(storage);
      expect(() => history.load(thread)).toThrow(/conversation is invalid/);
      expect(() => history.save(thread, [message()])).toThrow(/conversation is invalid/);
      expect(() => history.clear(thread)).toThrow(/conversation is invalid/);
      expect(getItem).not.toHaveBeenCalled();
      expect(storage.writes).toBe(0);
    },
  );

  it.each([
    ["non-UUID ID", message(1, { id: "fake" })],
    ["empty text", message(1, { text: "" })],
    ["blank text", message(1, { text: " \n " })],
    ["oversized user text", message(1, { text: "x".repeat(1001) })],
    ["oversized assistant text", assistant(1, { text: "x".repeat(4001) })],
    ["assistant without source", assistant(1, { source: undefined })],
    ["user with source", message(1, { source: "live-ai" })],
    ["oversized notice", assistant(1, { notice: "x".repeat(1001) })],
    ["unknown property", { ...message(1), secret: "not a chat field" }],
    ["unknown purpose", { ...message(1), purpose: "execute" }],
    ["unknown role", { ...message(1), role: "system" }],
    ["unknown source", { ...assistant(1), source: "untrusted" }],
  ])("rejects %s without changing prior messages", (_description, invalid) => {
    const history = createChatHistory(storage);
    history.save("general", [message(2)]);
    const previous = storage.getItem(CHAT_STORAGE_KEY);
    expect(() => history.save("general", [invalid as ChatMessage])).toThrow(/invalid or too long/);
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBe(previous);
  });

  it("validates even messages that would be removed by the 50-message limit", () => {
    const messages = Array.from({ length: 51 }, (_, index) => message(index));
    messages[0].text = "x".repeat(1001);
    expect(() => createChatHistory(storage).save("general", messages)).toThrow(/invalid/);
    expect(storage.writes).toBe(0);
  });

  it("rejects duplicate message IDs before persisting an ambiguous conversation", () => {
    expect(() => createChatHistory(storage).save("general", [message(), message()])).toThrow(
      /invalid/,
    );
    expect(storage.writes).toBe(0);
  });

  it("accepts text and notice at their limits without trimming message content", () => {
    const messages = [
      message(1, { text: ` ${"x".repeat(998)} ` }),
      assistant(2, { text: "x".repeat(4000), notice: "n".repeat(1000), purpose: "chat" }),
    ];
    createChatHistory(storage).save("general", messages);
    expect(createChatHistory(storage).load("general")).toEqual(messages);
  });

  it("reports denied reads without trying to overwrite stored data", () => {
    storage.readFailure = true;
    const history = createChatHistory(storage);
    expect(() => history.load("general")).toThrow(/could not be read/);
    expect(() => history.save("general", [message()])).toThrow(/could not be read/);
    expect(() => history.clear("general")).toThrow(/could not be read/);
    expect(storage.writes).toBe(0);
  });

  it("reports quota or blocked writes and preserves existing conversations on save and clear", () => {
    const history = createChatHistory(storage);
    history.save("general", [message()]);
    const previous = storage.getItem(CHAT_STORAGE_KEY);
    storage.writeFailure = true;
    expect(() => history.save("general", [message(2)])).toThrow(/full or blocked/);
    expect(() => history.clear("general")).toThrow(/full or blocked/);
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBe(previous);
  });

  it("limits the complete store by UTF-8 bytes without dropping another thread", () => {
    const history = createChatHistory(storage);
    const largeThread = Array.from({ length: 50 }, (_, index) =>
      assistant(index, { text: "界".repeat(4000) }),
    );
    history.save("general", largeThread);
    const previous = storage.getItem(CHAT_STORAGE_KEY)!;
    expect(new TextEncoder().encode(previous).byteLength).toBeLessThan(1024 * 1024);
    expect(() => history.save(eventId, largeThread)).toThrow(/too large to save/);
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBe(previous);
    expect(history.load("general")).toEqual(largeThread);
    expect(history.load(eventId)).toEqual([]);
  });

  it("refuses an already oversized store before parsing or rewriting it", () => {
    const raw = "界".repeat(350_000);
    expect(raw.length).toBeLessThan(1024 * 1024);
    storage.setItem(CHAT_STORAGE_KEY, raw);
    const history = createChatHistory(storage);
    expect(() => history.load("general")).toThrow(/exceeds the storage limit/);
    expect(() => history.save("general", [message()])).toThrow(/preserved/);
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBe(raw);
  });

  it("does not access the browser until a method is called and handles unavailable storage", () => {
    expect(() => createChatHistory()).not.toThrow();
    expect(() => createChatHistory().load("general")).toThrow(/could not be read/);
    vi.stubGlobal("window", {
      get localStorage() {
        throw new Error("denied");
      },
    });
    expect(() => createChatHistory().load("general")).toThrow(/could not be read/);
  });

  it("uses browser storage when no storage adapter is supplied", () => {
    vi.stubGlobal("window", { localStorage: storage });
    createChatHistory().save("general", [message()]);
    expect(createChatHistory().load("general")).toEqual([message()]);
  });
});
