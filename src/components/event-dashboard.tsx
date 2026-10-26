"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Users,
  Wallet,
  ShieldCheck,
  ListChecks,
  ArrowUpRight,
  CircleCheck,
  Clock3,
} from "lucide-react";
import { categoryLabels } from "@/lib/config";
import { money, formatDate, formatUpdatedAt } from "@/lib/dates";
import { eventStore } from "@/lib/storage/events";
import { statusSchema } from "@/lib/validation/schemas";
import { useEvents } from "./use-events";
import { Button, EmptyState, Notice } from "./controls";
import { DeferredAssistant } from "./assistant/deferred-assistant";
import { DashboardLoading } from "./dashboard/loading";
import {
  BudgetSection,
  TimelineSection,
  VendorSection,
  IdeasSection,
  RisksSection,
  EventBriefCard,
} from "./dashboard/plan-sections";
export function EventDashboard({ eventId }: { eventId: string }) {
  const { snapshot, error, reload, replaceSaved } = useEvents();
  const [saveError, setSaveError] = useState(""),
    [announcement, setAnnouncement] = useState("");
  const event = snapshot?.events.find((e) => e.id === eventId);
  function status(section: "timeline" | "vendors", taskId: string, value: string) {
    const result = statusSchema.safeParse(value);
    if (!result.success) return;
    try {
      const savedEvent = eventStore().setTaskStatus(eventId, section, taskId, result.data);
      replaceSaved(savedEvent);
      setSaveError("");
      setAnnouncement("Task status saved.");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "This task could not be saved.");
      setAnnouncement("");
    }
  }
  if (error)
    return (
      <div className="container page">
        <Notice>{error}</Notice>
        <Button onClick={reload}>Try again</Button>
        <Link href="/events">Return to my events</Link>
      </div>
    );
  if (!snapshot) return <DashboardLoading />;
  if (!event)
    return (
      <div className="container page">
        <EmptyState
          title="We couldn’t find this occasion."
          description="This event may have been deleted or saved in a different browser. Open My events to see plans stored here."
        />
        <Link className="text-link" href="/events">
          Return to my events <ArrowUpRight size={14} />
        </Link>
      </div>
    );
  const { brief, plan } = event;
  const reserve = plan.budget.filter((i) => i.contingency).reduce((s, i) => s + i.amount, 0);
  const tasks = [...plan.timeline, ...plan.vendors],
    done = tasks.filter((t) => t.status === "completed").length;
  const urgent = plan.timeline.filter((t) => t.urgent && t.status !== "completed").length;
  return (
    <div className="container page dashboard">
      <Link href="/events" className="back-link">
        <ArrowLeft size={15} /> My events
      </Link>
      <div className="dashboard-heading">
        <div>
          <div className="heading-pills">
            <span className="pill">{categoryLabels[brief.category]}</span>
            <span className="pill baseline">
              <span>✦</span> Rule-based starter plan
            </span>
          </div>
          <h1>{brief.name}</h1>
          <div className="event-meta">
            <span>
              <CalendarDays size={16} />
              {formatDate(brief.date)}
            </span>
            <span>
              <MapPin size={16} />
              {brief.location}
            </span>
            <span>
              <Users size={16} />
              {brief.guests} guests
            </span>
          </div>
        </div>
        <div className="dashboard-completion">
          <CircleCheck size={22} />
          <strong>
            {done}
            <small>/{tasks.length}</small>
          </strong>
          <span>tasks completed</span>
        </div>
      </div>
      <p className="sr-only" role="status">
        {announcement}
      </p>
      {saveError ? <Notice>{saveError} Your change has not been applied.</Notice> : null}
      {snapshot.warnings.map((w, i) => (
        <Notice key={i} tone="info">
          {w}
        </Notice>
      ))}
      <div className="metric-grid">
        <Metric
          icon={<Wallet size={19} />}
          label="Total budget"
          value={money(brief.budget)}
          detail="100% assigned across the plan"
        />
        <Metric
          icon={<ListChecks size={19} />}
          label="Planned spending"
          value={money(brief.budget - reserve)}
          detail="Estimates, excluding the reserve"
        />
        <Metric
          icon={<ShieldCheck size={19} />}
          label="Contingency reserve"
          value={money(reserve)}
          detail="Included in your total budget"
        />
        <Metric
          icon={<Clock3 size={19} />}
          label="Urgent milestones"
          value={String(urgent)}
          detail="Recommended deadline has passed"
        />
      </div>
      <nav className="dashboard-nav" aria-label="Plan sections">
        <a href="#budget">Budget</a>
        <a href="#timeline">Timeline</a>
        <a href="#vendors">Checklist</a>
        <a href="#ideas">Ideas</a>
        <a href="#risks">Contingencies</a>
        <a href="#assistant">AI assistant</a>
        <a href="#brief">Your brief</a>
      </nav>
      <div className="dashboard-grid">
        <BudgetSection event={event} />
        <TimelineSection event={event} onStatus={status} />
      </div>
      <VendorSection event={event} onStatus={status} />
      <IdeasSection event={event} />
      <RisksSection event={event} />
      <DeferredAssistant key={event.id} event={event} onSaved={replaceSaved} />
      <EventBriefCard event={event} />
      <div className="dashboard-footnote">
        <ShieldCheck size={17} />
        <p>
          Saved only in this browser. Updated {formatUpdatedAt(event.updatedAt)}.<br />
          Rule-based estimates are a starting point. Confirm costs and arrangements with your chosen
          providers.
        </p>
      </div>
    </div>
  );
}
function Metric({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric panel">
      <div>
        {icon}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
