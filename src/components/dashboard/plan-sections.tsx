import { CircleCheck, Lightbulb, ShieldCheck } from "lucide-react";
import type { EventRecord, TaskStatus, TimelineTask, VendorTask } from "@/types";
import { money, formatDate } from "@/lib/dates";

type PlanSectionProps = { event: EventRecord };
type TaskSectionProps = PlanSectionProps & {
  onStatus: (section: "timeline" | "vendors", taskId: string, value: string) => void;
};
const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  "in-progress": "In progress",
  completed: "Completed",
};

export function BudgetSection({ event }: PlanSectionProps) {
  const { brief, plan } = event;
  return (
    <section id="budget" className="panel dashboard-section">
      <SectionTitle
        number="01"
        title="A budget with breathing room"
        description="Every rupee is assigned, including your reserve. All amounts are estimates, not vendor quotes."
      />
      <div className="budget-total">
        <span>Your estimated allocations</span>
        <strong>{money(brief.budget)}</strong>
      </div>
      <div className="allocation-bar" aria-hidden="true">
        {plan.budget.map((i, index) => (
          <span
            key={i.id}
            className={`allocation-color color-${index}`}
            style={{ width: `${i.percentage}%` }}
          />
        ))}
      </div>
      <div className="allocation-list">
        {plan.budget.map((item, i) => (
          <div key={item.id}>
            <span className={`color-dot color-${i}`} />
            <span>
              {item.label}
              {item.contingency ? <small>Set aside for unexpected costs</small> : null}
            </span>
            <span className="allocation-percent">{item.percentage}%</span>
            <strong>{money(item.amount)}</strong>
          </div>
        ))}
      </div>
      <div className="allocation-footer">
        <span>Allocated total</span>
        <strong>{money(brief.budget)}</strong>
        <span className="positive">
          <CheckMark /> Adds up exactly
        </span>
      </div>
    </section>
  );
}

export function TimelineSection({ event, onStatus }: TaskSectionProps) {
  const { plan } = event;
  return (
    <section id="timeline" className="panel dashboard-section">
      <SectionTitle
        number="02"
        title="One step closer, every day"
        description={`Milestones planned from ${formatDate(plan.referenceDate)} to your event date.`}
      />
      <div className="timeline-list">
        {plan.timeline.map((task, i) => (
          <div
            key={task.id}
            className={`timeline-item ${task.status === "completed" ? "complete" : ""}`}
          >
            <div className="timeline-marker">
              {task.status === "completed" ? <CheckMark /> : String(i + 1).padStart(2, "0")}
            </div>
            <div className="timeline-content">
              <div className="timeline-due">
                <span>{formatDate(task.dueDate)}</span>
                {task.urgent ? <span className="urgent-badge">Urgent at creation</span> : null}
              </div>
              <h3>{task.title}</h3>
              <p>{task.description}</p>
              {task.urgent ? (
                <small>
                  Recommended by {formatDate(task.originalDueDate)}; moved to the planning date.
                </small>
              ) : null}
              <TaskSelect task={task} onChange={(value) => onStatus("timeline", task.id, value)} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function VendorSection({ event, onStatus }: TaskSectionProps) {
  const { plan } = event;
  return (
    <section id="vendors" className="panel dashboard-section wide-section">
      <SectionTitle
        number="03"
        title="The right people. The right details."
        description="Use this checklist to coordinate your suppliers and helpers. No businesses, quotes or availability are implied."
      />
      <div className="vendor-grid">
        {plan.vendors.map((task) => (
          <article
            className={`vendor-card ${task.status === "completed" ? "complete" : ""}`}
            key={task.id}
          >
            <span className="task-category">{task.category}</span>
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            {task.estimatedCost !== undefined ? (
              <small>Planning allowance: {money(task.estimatedCost)} · estimate</small>
            ) : null}
            <TaskSelect task={task} onChange={(value) => onStatus("vendors", task.id, value)} />
          </article>
        ))}
      </div>
    </section>
  );
}

export function IdeasSection({ event }: PlanSectionProps) {
  const { plan } = event;
  return (
    <section id="ideas" className="wide-section">
      <SectionTitle
        number="04"
        title="A little inspiration, made for you"
        description="Deterministic starter ideas shaped by your event details and priorities."
      />
      <div className="ideas-grid">
        {plan.ideas.map((idea, i) => (
          <article
            className={`idea-card ${i % 3 === 0 ? "lavender" : i % 3 === 1 ? "sage" : "peach"}`}
            key={idea.id}
          >
            <Lightbulb size={21} strokeWidth={1.5} />
            <span className="task-category">{idea.category}</span>
            <h3>{idea.title}</h3>
            <p>{idea.description}</p>
            <small>{idea.relevance}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RisksSection({ event }: PlanSectionProps) {
  const { plan } = event;
  return (
    <section id="risks" className="panel dashboard-section wide-section">
      <SectionTitle
        number="05"
        title="A thoughtful backup goes a long way"
        description="Practical contingencies, so a small surprise stays small."
      />
      <div className="risk-grid">
        {plan.risks.map((risk) => (
          <article key={risk.id}>
            <ShieldCheck size={21} />
            <h3>{risk.risk}</h3>
            <p>{risk.reason}</p>
            <dl>
              <dt>Plan ahead</dt>
              <dd>{risk.mitigation}</dd>
              <dt>Keep a backup</dt>
              <dd>{risk.backup}</dd>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function CheckMark() {
  return <CircleCheck size={14} aria-hidden="true" />;
}
function SectionTitle({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-title">
      <p className="eyebrow">
        <span>{number}</span> YOUR EVENT PLAN
      </p>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
    </div>
  );
}
function TaskSelect({
  task,
  onChange,
}: {
  task: TimelineTask | VendorTask;
  onChange: (value: string) => void;
}) {
  return (
    <div className="task-control">
      <label className="sr-only" htmlFor={task.id}>
        Status: {task.title}
      </label>
      <select
        id={task.id}
        value={task.status}
        onChange={(e) => onChange(e.target.value)}
        className={`status-select ${task.status}`}
      >
        {Object.entries(statusLabels).map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </select>
      <span className="task-priority">{task.priority} priority</span>
    </div>
  );
}
export function EventBriefCard({ event }: { event: EventRecord }) {
  const b = event.brief;
  return (
    <section id="brief" className="panel dashboard-section wide-section">
      <SectionTitle
        number="06"
        title="The details behind the day"
        description="Your original brief, kept alongside your plan."
      />
      <div className="brief-grid">
        <div>
          <h3>Style & preferences</h3>
          <dl>
            {Object.entries(b.details)
              .filter(([k]) => k !== "category")
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
          </dl>
        </div>
        <div>
          <h3>Your priorities</h3>
          <div className="tags">
            {b.priorities.map((p) => (
              <span className="pill" key={p}>
                {p}
              </span>
            ))}
          </div>
          <dl>
            <dt>Dietary requirements</dt>
            <dd>{b.dietary || "None specified"}</dd>
            <dt>Accessibility requirements</dt>
            <dd>{b.accessibility || "None specified"}</dd>
            <dt>Special instructions</dt>
            <dd>{b.notes || "None specified"}</dd>
          </dl>
        </div>
      </div>
    </section>
  );
}
