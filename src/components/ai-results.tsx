"use client";
import { useEffect, useRef } from "react";
import { Sparkles, LockKeyhole } from "lucide-react";
import { money } from "@/lib/dates";
import type { EventRecord } from "@/types";
import type { AIResult } from "@/lib/ai/result";
import type { Recommendation, Source } from "@/lib/ai/contracts";
import { Button } from "./controls";
export function AssistantResult({
  event,
  result,
  question,
  onRetain,
  confirmed,
  onConfirm,
  onAccept,
  onReject,
  onRetry,
}: {
  event: EventRecord;
  result: AIResult;
  question: string;
  onRetain: (idea: Recommendation, source: Source) => void;
  confirmed: boolean;
  onConfirm: (value: boolean) => void;
  onAccept: () => void;
  onReject: () => void;
  onRetry: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, [result]);
  return (
    <div className="ai-result">
      <SourceLabel source={result.source} />
      <h3 ref={heading} tabIndex={-1}>
        {result.operation === "recommendations"
          ? result.data.headline
          : result.operation === "optimize"
            ? "Review your proposed budget"
            : "A little clarity for your plan"}
      </h3>
      <p className="ai-mode-note">{result.message}</p>
      <p>{result.data.summary}</p>
      {result.operation === "recommendations" ? (
        <>
          <div className="ai-idea-grid">
            {result.data.ideas.map((idea, i) => (
              <IdeaCard
                key={`${idea.title}-${i}`}
                idea={idea}
                source={result.source}
                saved={(event.savedIdeas ?? []).some(
                  (s) =>
                    s.idea.category === idea.category &&
                    s.idea.title.toLowerCase() === idea.title.toLowerCase(),
                )}
                onSave={() => onRetain(idea, result.source)}
              />
            ))}
          </div>
          <h4>Risks to prepare for</h4>
          {result.data.risks.map((r, i) => (
            <div className="ai-risk" key={i}>
              <strong>{r.risk}</strong>
              <p>{r.relevance}</p>
              <p>
                <b>Plan ahead:</b> {r.mitigation}
              </p>
            </div>
          ))}
        </>
      ) : null}
      {result.operation === "ask" ? (
        <>
          <div className="ai-question">
            <strong>Your question</strong>
            <p>{question}</p>
          </div>
          <p className="ai-answer">{result.data.answer}</p>
        </>
      ) : null}
      {result.operation === "optimize" ? <BudgetComparison event={event} result={result} /> : null}
      <h4>Next actions</h4>
      <ul>
        {result.data.nextActions.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
      <details className="ai-assumptions" open>
        <summary>Assumptions & limitations</summary>
        <ul>
          {result.data.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </details>
      {result.operation === "optimize" ? (
        <div className="ai-confirm">
          <label>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => onConfirm(e.target.checked)}
            />
            I have reviewed these proposed allocations and want to replace my saved budget.
          </label>
          <div>
            <Button disabled={!confirmed} onClick={onAccept}>
              Confirm and save budget
            </Button>
            <Button className="secondary" onClick={onReject}>
              Reject proposal
            </Button>
          </div>
        </div>
      ) : null}
      {result.source === "rule-based" ? (
        <button className="text-link" onClick={onRetry}>
          Retry live assistance
        </button>
      ) : null}
    </div>
  );
}
function SourceLabel({ source }: { source: Source }) {
  return (
    <span className={`ai-source ${source}`}>
      <Sparkles size={13} />
      {source === "live-ai" ? "AI-generated · Live Gemini" : "Rule-based fallback"}
    </span>
  );
}
export function IdeaCard({
  idea,
  source,
  saved,
  onSave,
}: {
  idea: Recommendation;
  source: Source;
  saved: boolean;
  onSave?: () => void;
}) {
  return (
    <article className="ai-idea">
      <span className="task-category">{idea.category}</span>
      <h4>{idea.title}</h4>
      <p>{idea.description}</p>
      <p>
        <strong>Why it fits:</strong> {idea.rationale}
      </p>
      <p>
        <strong>Next step:</strong> {idea.nextAction}
      </p>
      <SourceLabel source={source} />
      {onSave ? (
        <Button className="secondary" disabled={saved} onClick={onSave}>
          {saved ? "Saved to your event" : "Keep this idea"}
        </Button>
      ) : null}
    </article>
  );
}
function BudgetComparison({
  event,
  result,
}: {
  event: EventRecord;
  result: Extract<AIResult, { operation: "optimize" }>;
}) {
  return (
    <div className="ai-comparison">
      <div className="ai-total-comparison">
        <div>
          <span>Current total</span>
          <strong>{money(event.brief.budget)}</strong>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <span>Proposed total</span>
          <strong>{money(result.proposal.targetBudget)}</strong>
        </div>
      </div>
      <p className="ai-mode-note">
        Preview only · Nothing is saved until you confirm. Amounts are planning allowances, not
        approved expenditure.
      </p>
      <div className="ai-comparison-rows">
        {event.plan.budget.map((b) => {
          const next = result.proposal.allocations.find((n) => n.category === b.category)!;
          const diff = next.amount - b.amount;
          return (
            <div key={b.id} className={b.contingency ? "reserve-row" : ""}>
              <div>
                <strong>{b.label}</strong>
                {result.proposal.protectedCategories.includes(b.category) ? (
                  <span className="ai-protected">
                    <LockKeyhole size={12} />
                    Protected
                  </span>
                ) : null}
              </div>
              <dl>
                <div>
                  <dt>Current</dt>
                  <dd>{money(b.amount)}</dd>
                </div>
                <div>
                  <dt>Proposed</dt>
                  <dd>{money(next.amount)}</dd>
                </div>
                <div>
                  <dt>Change</dt>
                  <dd>
                    {diff > 0 ? "+" : diff < 0 ? "−" : ""}
                    {money(Math.abs(diff))}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
      <h4>Reasons & alternatives</h4>
      {result.data.guidance.map((g) => (
        <div className="ai-guidance" key={g.category}>
          <strong>
            {event.plan.budget.find((b) => b.category === g.category)?.label ?? g.category} ·{" "}
            {g.action}
          </strong>
          <p>{g.rationale}</p>
          <p>{g.alternative}</p>
        </div>
      ))}
      <h4>Trade-offs</h4>
      <ul>
        {result.data.tradeoffs.map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
