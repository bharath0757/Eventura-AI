"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { EventRecord } from "@/types";
import { limits } from "@/lib/config";
import { parseIntegerInput } from "@/lib/validation/schemas";
import { eventStore } from "@/lib/storage/events";
import { AI_LIMITS } from "@/lib/ai/limits";
import { requestSchema, parseOutput, type AIRequest } from "@/lib/ai/schemas";
import { resultSchema, type AIResult } from "@/lib/ai/result";
import { applyProposal } from "@/lib/ai/optimizer";
import type { Recommendation, Source } from "@/lib/ai/contracts";

type Operation = AIRequest["operation"];
export interface AssistantProps {
  initialMode?: Operation;
  event: EventRecord;
  onSaved: (record: EventRecord) => void;
}

// Advice depends on task progress as well as budget and preferences. Saved ideas
// and timestamps are excluded because they are not part of the provider context.
function assistantContext(event: EventRecord): string {
  return JSON.stringify([event.id, event.brief, event.plan]);
}

export function useAssistant({ event, onSaved, initialMode = "recommendations" }: AssistantProps) {
  const [mode, setMode] = useState<Operation>(initialMode);
  const [question, setQuestion] = useState(""),
    [instruction, setInstruction] = useState("");
  const [target, setTarget] = useState(String(event.brief.budget)),
    [protectedKeys, setProtectedKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [result, setResult] = useState<AIResult | null>(null),
    [resultContext, setResultContext] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const locked = useRef(false),
    controller = useRef<AbortController | null>(null),
    latestContext = useRef(assistantContext(event));
  const context = assistantContext(event);
  useEffect(() => {
    latestContext.current = context;
  }, [context]);
  useEffect(() => () => controller.current?.abort(), []);
  const currentResult = resultContext === context ? result : null;
  const targetNumber = parseIntegerInput(target);
  const validTarget =
    Number.isInteger(targetNumber) &&
    targetNumber >= limits.budgetMin &&
    targetNumber <= limits.budgetMax;
  function select(next: Operation) {
    setMode(next);
    setResult(null);
    setError("");
    setNotice("");
    setConfirmed(false);
  }
  async function request(e?: FormEvent) {
    e?.preventDefault();
    if (locked.current) return;
    const common = { brief: event.brief, plan: event.plan };
    const input =
      mode === "recommendations"
        ? { ...common, operation: mode }
        : mode === "ask"
          ? { ...common, operation: mode, instruction: question }
          : {
              ...common,
              operation: mode,
              instruction,
              targetBudget: targetNumber,
              protectedCategories: protectedKeys,
            };
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) {
      setError("Check your event details, question, target budget and protected categories.");
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setResult(null);
    setConfirmed(false);
    if (mode === "ask") setSubmittedQuestion(question.trim());
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), AI_LIMITS.requestTimeoutMs);
    try {
      const response = await fetch("/api/ai/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
        signal: abort.signal,
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "object" &&
          payload.error !== null &&
          "message" in payload.error &&
          typeof payload.error.message === "string"
            ? payload.error.message.slice(0, 500)
            : "The assistant could not respond. Try again shortly.";
        throw new Error(message);
      }
      const checked = resultSchema.parse(payload);
      if (checked.operation !== parsed.data.operation)
        throw new Error("The response did not match your request. Please try again.");
      parseOutput(JSON.stringify(checked.data), parsed.data);
      if (
        checked.operation === "optimize" &&
        parsed.data.operation === "optimize" &&
        (checked.proposal.targetBudget !== parsed.data.targetBudget ||
          JSON.stringify(checked.proposal.protectedCategories) !==
            JSON.stringify(parsed.data.protectedCategories))
      )
        throw new Error(
          "The proposal does not match your target or protected categories. Please try again.",
        );
      if (checked.operation === "optimize") applyProposal(event, checked.proposal);
      if (abort.signal.aborted) return;
      if (latestContext.current !== context) {
        setError("Your event changed during this request. Request fresh advice.");
        return;
      }
      setResult(checked);
      setResultContext(context);
    } catch (e) {
      setError(
        abort.signal.aborted
          ? "Request cancelled or timed out. Your saved event is unchanged. You can try again."
          : e instanceof Error && e.name !== "ZodError"
            ? e.message
            : "The response could not be verified. Your saved event is unchanged.",
      );
    } finally {
      clearTimeout(timeout);
      locked.current = false;
      setBusy(false);
      controller.current = null;
    }
  }
  function retain(idea: Recommendation, source: Source) {
    try {
      const savedEvent = eventStore().retainIdea(event.id, idea, source);
      onSaved(savedEvent);
      setError("");
      setNotice("Idea saved to this event.");
    } catch (e) {
      setNotice("");
      setError(e instanceof Error ? e.message : "The idea could not be saved.");
    }
  }
  function accept() {
    if (!confirmed || locked.current || currentResult?.operation !== "optimize") return;
    locked.current = true;
    try {
      const savedEvent = eventStore().acceptProposal(event.id, currentResult.proposal);
      onSaved(savedEvent);
      setResult(null);
      setConfirmed(false);
      setError("");
      setNotice("Budget saved. Your task progress and preferences have been preserved.");
    } catch (e) {
      setNotice("");
      setError(
        e instanceof Error
          ? e.message
          : "The budget could not be saved. Your saved plan is unchanged.",
      );
    } finally {
      locked.current = false;
    }
  }
  return {
    mode,
    question,
    setQuestion,
    instruction,
    setInstruction,
    target,
    setTarget,
    protectedKeys,
    setProtectedKeys,
    busy,
    error,
    notice,
    setNotice,
    result,
    setResult,
    currentResult,
    confirmed,
    setConfirmed,
    submittedQuestion,
    validTarget,
    select,
    request,
    retain,
    accept,
    cancel: () => controller.current?.abort(),
  };
}
