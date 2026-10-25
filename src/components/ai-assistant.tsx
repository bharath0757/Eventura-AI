"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Sparkles, Lightbulb, SlidersHorizontal, MessageCircle, LockKeyhole } from "lucide-react";
import type { EventRecord } from "@/types";
import { money } from "@/lib/dates";
import { limits } from "@/lib/config";
import { parseIntegerInput } from "@/lib/validation/schemas";
import { eventStore } from "@/lib/storage/events";
import { AI_LIMITS } from "@/lib/ai/limits";
import { requestSchema, parseOutput, type AIRequest } from "@/lib/ai/schemas";
import { resultSchema, type AIResult } from "@/lib/ai/result";
import { budgetContext, applyProposal } from "@/lib/ai/optimizer";
import type { Recommendation, Source } from "@/lib/ai/contracts";
import { Button, Notice } from "./controls";
import { AssistantResult, IdeaCard } from "./ai-results";

type Operation = AIRequest["operation"];
const actions = [{ key: "recommendations", label: "Get Personalized Ideas", icon: Lightbulb }, { key: "optimize", label: "Optimize My Budget", icon: SlidersHorizontal }, { key: "ask", label: "Ask Eventura AI", icon: MessageCircle }] as const;
export function AIAssistant({ event, onSaved }: { event: EventRecord; onSaved: () => void }) {
  const [mode, setMode] = useState<Operation>("recommendations");
  const [question, setQuestion] = useState(""), [instruction, setInstruction] = useState("");
  const [target, setTarget] = useState(String(event.brief.budget)), [protectedKeys, setProtectedKeys] = useState<string[]>([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  const [result, setResult] = useState<AIResult | null>(null), [resultContext, setResultContext] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState(""), [confirmed, setConfirmed] = useState(false);
  const locked = useRef(false), controller = useRef<AbortController | null>(null), latestContext = useRef(budgetContext(event));
  const context = budgetContext(event);
  useEffect(() => { latestContext.current = context; }, [context]);
  useEffect(() => () => controller.current?.abort(), []);
  const currentResult = resultContext === context ? result : null;
  const targetNumber = parseIntegerInput(target);
  const validTarget = Number.isInteger(targetNumber) && targetNumber >= limits.budgetMin && targetNumber <= limits.budgetMax;
  function select(next: Operation) { setMode(next); setResult(null); setError(""); setNotice(""); setConfirmed(false); }
  async function request(e?: FormEvent) {
    e?.preventDefault();
    if (locked.current) return;
    const common = { brief: event.brief, plan: event.plan };
    const input = mode === "recommendations" ? { ...common, operation: mode } : mode === "ask" ? { ...common, operation: mode, instruction: question } : { ...common, operation: mode, instruction, targetBudget: targetNumber, protectedCategories: protectedKeys };
    const parsed = requestSchema.safeParse(input);
    if (!parsed.success) { setError("Check your event details, question, target budget and protected categories."); return; }
    locked.current = true; setBusy(true); setError(""); setNotice(""); setResult(null); setConfirmed(false);
    if (mode === "ask") setSubmittedQuestion(question.trim());
    const abort = new AbortController(); controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), AI_LIMITS.requestTimeoutMs);
    try {
      const response = await fetch("/api/ai/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data), signal: abort.signal });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "object" && payload.error !== null && "message" in payload.error && typeof payload.error.message === "string" ? payload.error.message.slice(0, 500) : "The assistant could not respond. Try again shortly.";
        throw new Error(message);
      }
      const checked = resultSchema.parse(payload);
      if (checked.operation !== parsed.data.operation) throw new Error("The response did not match your request. Please try again.");
      parseOutput(JSON.stringify(checked.data), parsed.data);
      if (checked.operation === "optimize" && parsed.data.operation === "optimize" && (checked.proposal.targetBudget !== parsed.data.targetBudget || JSON.stringify(checked.proposal.protectedCategories) !== JSON.stringify(parsed.data.protectedCategories))) throw new Error("The proposal does not match your target or protected categories. Please try again.");
      if (checked.operation === "optimize") applyProposal(event, checked.proposal);
      if (abort.signal.aborted) return;
      if (latestContext.current !== context) { setError("Your event changed during this request. Request fresh advice."); return; }
      setResult(checked); setResultContext(context);
    } catch (e) {
      setError(abort.signal.aborted ? "Request cancelled or timed out. Your saved event is unchanged. You can try again." : e instanceof Error && e.name !== "ZodError" ? e.message : "The response could not be verified. Your saved event is unchanged.");
    } finally { clearTimeout(timeout); locked.current = false; setBusy(false); controller.current = null; }
  }
  function retain(idea: Recommendation, source: Source) {
    try { eventStore().retainIdea(event.id, idea, source); onSaved(); setError(""); setNotice("Idea saved to this event."); }
    catch (e) { setNotice(""); setError(e instanceof Error ? e.message : "The idea could not be saved."); }
  }
  function accept() {
    if (!confirmed || locked.current || currentResult?.operation !== "optimize") return;
    locked.current = true;
    try { eventStore().acceptProposal(event.id, currentResult.proposal); onSaved(); setResult(null); setConfirmed(false); setError(""); setNotice("Budget saved. Your task progress and preferences have been preserved."); }
    catch (e) { setNotice(""); setError(e instanceof Error ? e.message : "The budget could not be saved. Your saved plan is unchanged."); }
    finally { locked.current = false; }
  }
  const saved = event.savedIdeas ?? [];
  return <section id="assistant" className="panel dashboard-section wide-section ai-panel" aria-labelledby="assistant-title">
    <div className="ai-heading"><span className="ai-symbol"><Sparkles size={24} /></span><div><p className="eyebrow">A little guidance, shaped around you</p><h2 id="assistant-title">Your planning companion.</h2><p className="muted">Ideas, answers and budget options for {event.brief.name}.</p></div></div>
    <p className="ai-privacy">When you request assistance, this event’s brief, preferences, plan and question are sent to Google Gemini if configured. Other saved events are never sent. Advice changes your plan only when you choose to save it.</p>
    <div className="ai-actions" aria-label="Assistant actions">{actions.map(({ key, label, icon: Icon }) => <button key={key} type="button" aria-pressed={mode === key} disabled={busy} onClick={() => select(key)}><Icon size={18} />{label}</button>)}</div>
    <form className="ai-form" onSubmit={request} aria-busy={busy}><fieldset disabled={busy}>
      {mode === "recommendations" ? <p>Explore practical ideas, tailored to your guests, style and priorities. You can keep individual ideas after reviewing them.</p> : null}
      {mode === "ask" ? <div className="field"><label htmlFor="ai-question">What would you like help with?</label><textarea id="ai-question" maxLength={AI_LIMITS.instruction} value={question} onChange={e => setQuestion(e.target.value)} placeholder="What should I finish this week?" aria-describedby="ai-question-hint" /><small id="ai-question-hint">{question.length}/{AI_LIMITS.instruction} characters · Your current event provides the context.</small></div> : null}
      {mode === "optimize" ? <>
        <div className="ai-budget-inputs"><div className="ai-current"><span>Current total budget</span><strong>{money(event.brief.budget)}</strong><small>Includes your contingency reserve</small></div><div className="field"><label htmlFor="ai-target">Target budget (INR)</label><input id="ai-target" inputMode="numeric" value={target} onChange={e => { setTarget(e.target.value); setResult(null); setConfirmed(false); }} aria-describedby="ai-target-hint" /><small id="ai-target-hint">Whole rupees, ₹1,000–₹10,00,00,000. At least 10% stays in reserve.</small></div></div>
        <fieldset className="ai-protection"><legend>Which allocations must stay unchanged?</legend><p className="muted">Select amounts you need to protect. Unselected categories can change.</p><div>{event.plan.budget.map(b => <label key={b.id}><input type="checkbox" checked={protectedKeys.includes(b.category)} onChange={e => { setProtectedKeys(keys => e.target.checked ? [...keys, b.category] : keys.filter(k => k !== b.category)); setResult(null); setConfirmed(false); }} /><span>{b.label}<strong>{money(b.amount)}</strong></span>{protectedKeys.includes(b.category) ? <LockKeyhole size={14} aria-label="Protected" /> : null}</label>)}</div></fieldset>
        <div className="field"><label htmlFor="ai-priorities">Anything to prioritize? (optional)</label><textarea id="ai-priorities" maxLength={AI_LIMITS.instruction} value={instruction} onChange={e => { setInstruction(e.target.value); setResult(null); setConfirmed(false); }} placeholder="Keep the food experience, simplify the decor…" /></div>
      </> : null}
      <Button type="submit" loading={busy} disabled={busy || (mode === "ask" && !question.trim()) || (mode === "optimize" && !validTarget)}>{busy ? "Preparing your guidance…" : mode === "ask" ? "Ask about my event" : mode === "optimize" ? "Preview budget proposal" : "Generate personalized ideas"}</Button>
    </fieldset></form>
    {busy ? <div className="ai-loading" role="status"><span>Considering your event, priorities and current plan. This may take up to a minute.</span><button className="text-link" onClick={() => controller.current?.abort()}>Cancel request</button></div> : null}
    {error ? <Notice>{error} <button className="text-link" disabled={busy} onClick={() => void request()}>Try again</button></Notice> : null}
    {notice ? <Notice tone="info">{notice}</Notice> : null}
    {result && !currentResult ? <Notice tone="info">Your event changed. Generate new guidance for the latest budget and preferences.</Notice> : null}
    {currentResult ? <AssistantResult event={event} result={currentResult} question={submittedQuestion} onRetain={retain} confirmed={confirmed} onConfirm={setConfirmed} onAccept={accept} onReject={() => { setResult(null); setConfirmed(false); setNotice("Proposal discarded. Your saved budget is unchanged."); }} onRetry={() => void request()} /> : null}
    {saved.length ? <section className="ai-saved" aria-label="Saved assistant ideas"><h3>Ideas you kept <span>{saved.length}/30</span></h3><div className="ai-idea-grid">{saved.map((s, i) => <IdeaCard key={i} idea={s.idea} source={s.source} saved />)}</div></section> : null}
  </section>;
}
