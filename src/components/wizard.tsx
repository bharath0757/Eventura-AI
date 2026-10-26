"use client";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, Sparkles } from "lucide-react";
import type { Category } from "@/types";
import { categoryLabels } from "@/lib/config";
import { money } from "@/lib/dates";
import { Button, Notice } from "./controls";
import { useWizard } from "./wizard/use-wizard";
import { categoryIcons, steps } from "./wizard/shared";
import { EssentialsStep } from "./wizard/essentials-step";
import { DetailsStep } from "./wizard/details-step";
import { BudgetStep } from "./wizard/budget-step";
import { ReviewStep } from "./wizard/review-step";

export function Wizard({ initialCategory }: { initialCategory?: Category }) {
  const form = useWizard(initialCategory);
  const { step, busy, go, submit, heading, failure, category, name, guests, numericBudget } = form;
  const Icon = categoryIcons[category];
  return (
    <div className="container page">
      <div className="wizard-intro">
        <p className="eyebrow">A great event starts here</p>
        <h1>
          Let’s make it <em>yours.</em>
        </h1>
        <p className="muted">A few thoughtful details. One clear plan.</p>
      </div>
      <ol className="stepper" aria-label="Event creation progress">
        {steps.map((label, i) => (
          <li className={i === step ? "active" : i < step ? "done" : ""} key={label}>
            <button
              type="button"
              disabled={i > step || busy}
              onClick={() => go(i)}
              aria-current={i === step ? "step" : undefined}
            >
              <span>{i < step ? <Check size={15} /> : i + 1}</span>
              <span>{label}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="wizard-layout">
        <form className="panel wizard-panel" onSubmit={submit} noValidate aria-busy={busy}>
          <div className="form-title">
            <p className="eyebrow">Step 0{step + 1} / 04</p>
            <h2 ref={heading} tabIndex={-1}>
              {steps[step]}
            </h2>
            <p className="muted">
              {
                [
                  "Tell us when, where and who’s coming.",
                  "The details that give your occasion its character.",
                  "Give your plan a spending ceiling and a sense of direction.",
                  "Take a moment to check the details. You can edit any section.",
                ][step]
              }
            </p>
          </div>
          {failure ? <Notice>{failure}</Notice> : null}
          {step === 0 ? <EssentialsStep form={form} /> : null}
          {step === 1 ? <DetailsStep form={form} /> : null}
          {step === 2 ? <BudgetStep form={form} /> : null}
          {step === 3 ? <ReviewStep form={form} /> : null}
          <div className="form-actions">
            <Button
              className="secondary"
              type="button"
              disabled={step === 0 || busy}
              onClick={() => go(step - 1)}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <Button type="submit" disabled={busy} loading={busy}>
              {step === 3 ? (busy ? "Creating your plan…" : "Create my event") : "Continue"}
              {!busy ? <ArrowRight size={16} /> : null}
            </Button>
          </div>
        </form>
        <aside className="wizard-aside">
          <div className="aside-icon">
            <Icon size={30} strokeWidth={1.4} />
          </div>
          <p className="eyebrow">YOUR OCCASION, YOUR WAY</p>
          <h3>{name || "Something worth celebrating."}</h3>
          <p className="muted">A thoughtful plan leaves more room for the moments that matter.</p>
          <dl className="aside-summary">
            <dt>Occasion</dt>
            <dd>{categoryLabels[category]}</dd>
            <dt>Guests</dt>
            <dd>{guests || "To be decided"}</dd>
            <dt>Budget</dt>
            <dd>{Number.isFinite(numericBudget) ? money(numericBudget) : "Your call"}</dd>
          </dl>
          <div className="aside-note">
            <ShieldCheck size={20} />
            <p>
              No sign-up. No API keys.
              <br />
              Plans are saved in this browser.
            </p>
          </div>
          <div className="aside-note">
            <Sparkles size={20} />
            <p>
              A rule-based starting point.
              <br />
              Make it your own as you go.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
