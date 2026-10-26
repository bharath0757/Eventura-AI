"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { CalendarDays, Check, ClipboardList, MapPin, Sparkles, Users, Wallet } from "lucide-react";
import type { SamplePlan, SampleProgress } from "@/lib/sample-types";

const TABS = [
  { key: "budget", label: "Budget", icon: Wallet },
  { key: "timeline", label: "Timeline", icon: CalendarDays },
  { key: "vendors", label: "Vendors", icon: ClipboardList },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function PlanPreview({
  plan,
  compact = false,
  onProgressChange,
}: {
  plan: SamplePlan;
  compact?: boolean;
  onProgressChange?: (progress: SampleProgress) => void;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("budget");
  const [completed, setCompleted] = useState<string[]>([]);
  const [vendors, setVendors] = useState<Record<string, string>>({});
  const id = useId();
  const tabsRef = useRef<HTMLDivElement>(null);
  const breakdown = plan.budget;

  function toggleTask(title: string) {
    const next = completed.includes(title)
      ? completed.filter((task) => task !== title)
      : [...completed, title];
    setCompleted(next);
    onProgressChange?.({ completed: next, vendors });
  }

  function changeVendor(vendor: string, status: string) {
    const next = { ...vendors, [vendor]: status };
    setVendors(next);
    onProgressChange?.({ completed, vendors: next });
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index + TABS.length - 1) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    setActiveTab(TABS[next].key);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <div className={`plan-preview ${compact ? "plan-preview-compact" : ""}`}>
      <div className="preview-toolbar">
        <span>
          <span className="small-brand-mark">
            <Sparkles size={13} />
          </span>{" "}
          YOUR PLANNING SPACE
        </span>
        <span className="sample-badge">{compact ? "INTERACTIVE SAMPLE" : "STARTER PLAN"}</span>
      </div>
      <div className="preview-header">
        <div>
          <span className="preview-category">{plan.categoryLabel}</span>
          <h3>{plan.name}</h3>
        </div>
        <span className="preview-event-icon" aria-hidden="true">
          ✳
        </span>
      </div>
      <div className="preview-meta">
        <span>
          <CalendarDays size={13} />
          {plan.dateLabel}
        </span>
        <span>
          <MapPin size={13} />
          {plan.location}
        </span>
        <span>
          <Users size={13} />
          {plan.guests} guests
        </span>
      </div>
      <div className="preview-tabs" role="tablist" aria-label="Explore your plan" ref={tabsRef}>
        {TABS.map(({ key, label, icon: Icon }, index) => (
          <button
            key={key}
            id={`${id}-${key}`}
            type="button"
            role="tab"
            aria-selected={activeTab === key}
            aria-controls={`${id}-panel`}
            tabIndex={activeTab === key ? 0 : -1}
            onKeyDown={(e) => onTabKeyDown(e, index)}
            onClick={() => setActiveTab(key)}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      <div
        className="preview-panel"
        role="tabpanel"
        id={`${id}-panel`}
        aria-labelledby={`${id}-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === "budget" ? (
          <>
            <div className="budget-heading">
              <div>
                <span>Your total budget</span>
                <strong>{plan.totalLabel}</strong>
              </div>
              <span className="reserve-badge">
                <Check size={12} /> 10% kept in reserve
              </span>
            </div>
            <div className="budget-stacked" aria-label="Estimated budget allocation">
              {breakdown.map((item) => (
                <span
                  key={item.label}
                  title={`${item.label}: ${item.amountLabel}`}
                  style={{ width: `${item.percent}%`, backgroundColor: item.color }}
                />
              ))}
            </div>
            <div className="budget-rows">
              {breakdown.map((item) => (
                <div className="budget-row" key={item.label}>
                  <span>
                    <i style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span>{item.percent}%</span>
                  <strong>{item.amountLabel}</strong>
                </div>
              ))}
            </div>
            <p className="estimate-note">
              A suggested starting point. All costs are estimates, not vendor quotes.
            </p>
          </>
        ) : activeTab === "timeline" ? (
          <>
            <div className="list-heading">
              <strong>A little closer to your day</strong>
              <span>
                {completed.length} / {plan.timeline.length} done
              </span>
            </div>
            <div className="task-list">
              {plan.timeline.map((task) => (
                <label
                  className={`plan-task ${completed.includes(task.id) ? "is-done" : ""}`}
                  key={task.id}
                >
                  <input
                    type="checkbox"
                    checked={completed.includes(task.id)}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span>
                    <strong>{task.title}</strong>
                    <small>{task.detail}</small>
                  </span>
                  <em>{task.when}</em>
                </label>
              ))}
            </div>
            <p className="estimate-note">
              A suggested sequence. Adjust your timing with your venue and vendors.
            </p>
          </>
        ) : (
          <>
            <div className="list-heading">
              <strong>Your people behind the scenes</strong>
              <span>Checklist</span>
            </div>
            {plan.vendors.map((vendor) => (
              <div className="vendor-row" key={vendor.id}>
                <span>{vendor.title}</span>
                <select
                  aria-label={`${vendor.title} status`}
                  value={vendors[vendor.id] || "To research"}
                  onChange={(event) => changeVendor(vendor.id, event.target.value)}
                >
                  <option>To research</option>
                  <option>Shortlisted</option>
                  <option>Contacted</option>
                  <option>Booked</option>
                  <option>Confirmed</option>
                </select>
              </div>
            ))}
            <p className="estimate-note">
              Track your own shortlist. No vendors are contacted or booked here.
            </p>
          </>
        )}
      </div>
      <div className="preview-insight">
        <Sparkles size={17} />
        <p>
          <strong>A little breathing room, built in.</strong> Your just-in-case fund keeps{" "}
          {plan.reserveLabel} aside for the unexpected.
        </p>
      </div>
    </div>
  );
}
