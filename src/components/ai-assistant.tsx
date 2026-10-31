"use client";
import { useEffect, useRef } from "react";
import { Sparkles, Lightbulb, SlidersHorizontal, MessageCircle, LockKeyhole } from "lucide-react";
import { money } from "@/lib/dates";
import { AI_LIMITS } from "@/lib/ai/limits";
import { Button, Notice } from "./controls";
import { AssistantResult, IdeaCard } from "./ai-results";
import { useAssistant, type AssistantProps } from "./assistant/use-assistant";

const actions = [
  { key: "recommendations", label: "Get Personalized Ideas", icon: Lightbulb },
  { key: "optimize", label: "Optimize My Budget", icon: SlidersHorizontal },
  { key: "ask", label: "Ask Eventura AI", icon: MessageCircle },
] as const;

export function AIAssistant({
  event,
  onSaved,
  initialMode,
  embedded = false,
  focusOnLoad = false,
}: AssistantProps & { focusOnLoad?: boolean; embedded?: boolean }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focusOnLoad) heading.current?.focus({ preventScroll: true });
  }, [focusOnLoad]);
  const {
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
    cancel,
  } = useAssistant({ event, onSaved, initialMode });
  const saved = event.savedIdeas ?? [];
  return (
    <section
      id={embedded ? "utsav-tools" : "assistant"}
      className="panel dashboard-section wide-section ai-panel"
      aria-labelledby="assistant-title"
    >
      <div className="ai-heading">
        <span className="ai-symbol">
          <Sparkles size={24} />
        </span>
        <div>
          <p className="eyebrow">A little guidance, shaped around you</p>
          <h2 id="assistant-title" ref={heading} tabIndex={-1}>
            Your AI planning assistant.
          </h2>
          <p className="muted">Ideas, answers and budget options for {event.brief.name}.</p>
        </div>
      </div>
      <p className="ai-privacy">
        When you request assistance, this event’s brief, preferences, plan and question are sent to
        Google Gemini if configured. Other saved events are never sent. Advice changes your plan
        only when you choose to save it.
      </p>
      <div className="ai-actions" aria-label="Assistant actions">
        {actions
          .filter((action) => !embedded || action.key !== "ask")
          .map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={mode === key}
              disabled={busy}
              onClick={() => select(key)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
      </div>
      <form className="ai-form" onSubmit={request} aria-busy={busy}>
        <fieldset disabled={busy}>
          {mode === "recommendations" ? (
            <p>
              Explore practical ideas, tailored to your guests, style and priorities. You can keep
              individual ideas after reviewing them.
            </p>
          ) : null}
          {mode === "ask" ? (
            <div className="field">
              <label htmlFor="ai-question">What would you like help with?</label>
              <textarea
                id="ai-question"
                maxLength={AI_LIMITS.instruction}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What should I finish this week?"
                aria-describedby="ai-question-hint"
              />
              <small id="ai-question-hint">
                {question.length}/{AI_LIMITS.instruction} characters Â· Your current event provides
                the context.
              </small>
            </div>
          ) : null}
          {mode === "optimize" ? (
            <>
              <div className="ai-budget-inputs">
                <div className="ai-current">
                  <span>Current total budget</span>
                  <strong>{money(event.brief.budget)}</strong>
                  <small>Includes your contingency reserve</small>
                </div>
                <div className="field">
                  <label htmlFor="ai-target">Target budget (INR)</label>
                  <input
                    id="ai-target"
                    inputMode="numeric"
                    value={target}
                    onChange={(e) => {
                      setTarget(e.target.value);
                      setResult(null);
                      setConfirmed(false);
                    }}
                    aria-describedby="ai-target-hint"
                  />
                  <small id="ai-target-hint">
                    Whole rupees, ₹1,000–₹10,00,00,000. At least 10% stays in reserve.
                  </small>
                </div>
              </div>
              <fieldset className="ai-protection">
                <legend>Which allocations must stay unchanged?</legend>
                <p className="muted">
                  Select amounts you need to protect. Unselected categories can change.
                </p>
                <div>
                  {event.plan.budget.map((b) => (
                    <label key={b.id}>
                      <input
                        type="checkbox"
                        checked={protectedKeys.includes(b.category)}
                        onChange={(e) => {
                          setProtectedKeys((keys) =>
                            e.target.checked
                              ? [...keys, b.category]
                              : keys.filter((k) => k !== b.category),
                          );
                          setResult(null);
                          setConfirmed(false);
                        }}
                      />
                      <span>
                        {b.label}
                        <strong>{money(b.amount)}</strong>
                      </span>
                      {protectedKeys.includes(b.category) ? (
                        <LockKeyhole size={14} aria-label="Protected" />
                      ) : null}
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="field">
                <label htmlFor="ai-priorities">Anything to prioritize? (optional)</label>
                <textarea
                  id="ai-priorities"
                  maxLength={AI_LIMITS.instruction}
                  value={instruction}
                  onChange={(e) => {
                    setInstruction(e.target.value);
                    setResult(null);
                    setConfirmed(false);
                  }}
                  placeholder="Keep the food experience, simplify the decor…"
                />
              </div>
            </>
          ) : null}
          <Button
            type="submit"
            loading={busy}
            disabled={
              busy || (mode === "ask" && !question.trim()) || (mode === "optimize" && !validTarget)
            }
          >
            {busy
              ? "Preparing your guidance…"
              : mode === "ask"
                ? "Ask about my event"
                : mode === "optimize"
                  ? "Preview budget proposal"
                  : "Generate personalized ideas"}
          </Button>
        </fieldset>
      </form>
      {busy ? (
        <div className="ai-loading" role="status">
          <span>
            Considering your event, priorities and current plan. This may take up to a minute.
          </span>
          <button className="text-link" onClick={() => cancel()}>
            Cancel request
          </button>
        </div>
      ) : null}
      {error ? (
        <Notice>
          {error}{" "}
          <button className="text-link" disabled={busy} onClick={() => void request()}>
            Try again
          </button>
        </Notice>
      ) : null}
      {notice ? <Notice tone="info">{notice}</Notice> : null}
      {result && !currentResult ? (
        <Notice tone="info">
          Your event changed. Generate new guidance for the latest budget, preferences and task
          progress.
        </Notice>
      ) : null}
      {currentResult ? (
        <AssistantResult
          event={event}
          result={currentResult}
          question={submittedQuestion}
          onRetain={retain}
          confirmed={confirmed}
          onConfirm={setConfirmed}
          onAccept={accept}
          onReject={() => {
            setResult(null);
            setConfirmed(false);
            setNotice("Proposal discarded. Your saved budget is unchanged.");
          }}
          onRetry={() => void request()}
        />
      ) : null}
      {saved.length ? (
        <section className="ai-saved" aria-label="Saved assistant ideas">
          <h3>
            Ideas you kept <span>{saved.length}/30</span>
          </h3>
          <div className="ai-idea-grid">
            {saved.map((s, i) => (
              <IdeaCard key={i} idea={s.idea} source={s.source} saved />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
