import { Check } from "lucide-react";
import { priorityOptions, priorityDescriptions, limits } from "@/lib/config";
import { money } from "@/lib/dates";
import { Field } from "./shared";
import type { WizardModel } from "./use-wizard";

export function BudgetStep({ form }: { form: WizardModel }) {
  const {
    category,
    budget,
    numericBudget,
    priorities,
    dietary,
    accessibility,
    notes,
    errors,
    attrs,
    setBudget,
    setPriorities,
    setDietary,
    setAccessibility,
    setNotes,
  } = form;
  return (
    <div className="form-fields">
      <Field
        id="budget"
        label="Total budget (INR)"
        error={errors.budget}
        hint={
          Number.isFinite(numericBudget)
            ? `Your budget: ${money(numericBudget)} · Range ₹1,000–₹10,00,00,000.`
            : "Whole rupees only. Range ₹1,000–₹10,00,00,000."
        }
      >
        <div className="currency-input">
          <span>₹</span>
          <input
            id="budget"
            inputMode="numeric"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="50000"
            {...attrs("budget", true)}
          />
          <span>INR</span>
        </div>
      </Field>
      <fieldset
        className="priority-picker"
        id="priorities"
        tabIndex={-1}
        aria-invalid={!!errors.priorities}
        aria-describedby={
          errors.priorities ? "priorities-hint priorities-error" : "priorities-hint"
        }
      >
        <legend>
          What matters most? <span>{priorities.length}/3 selected</span>
        </legend>
        <p id="priorities-hint" className="muted">
          Choose one to three priorities.
        </p>
        <div className="priority-grid">
          {priorityOptions[category].map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={priorities.includes(p)}
              disabled={priorities.length >= 3 && !priorities.includes(p)}
              onClick={() =>
                setPriorities((old) => (old.includes(p) ? old.filter((v) => v !== p) : [...old, p]))
              }
              className={priorities.includes(p) ? "selected" : ""}
            >
              <span className="selection-check">
                {priorities.includes(p) ? <Check size={12} /> : null}
              </span>
              <span>
                <strong>{p}</strong>
                <small>{priorityDescriptions[p]}</small>
              </span>
            </button>
          ))}
        </div>
        {errors.priorities ? (
          <p id="priorities-error" className="field-error">
            {errors.priorities}
          </p>
        ) : null}
      </fieldset>
      <div className="field-grid">
        <Field id="dietary" label="Dietary requirements (optional)" error={errors.dietary}>
          <textarea
            id="dietary"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            maxLength={500}
            placeholder="Vegetarian options, allergies…"
            {...attrs("dietary")}
          />
        </Field>
        <Field
          id="accessibility"
          label="Accessibility needs (optional)"
          error={errors.accessibility}
        >
          <textarea
            id="accessibility"
            value={accessibility}
            onChange={(e) => setAccessibility(e.target.value)}
            maxLength={500}
            placeholder="Step-free entry, quiet space…"
            {...attrs("accessibility")}
          />
        </Field>
      </div>
      <Field
        id="notes"
        label="Anything else? (optional)"
        error={errors.notes}
        hint={`${notes.length}/${limits.notesMax} characters`}
      >
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={1000}
          placeholder="Special instructions or details to keep with your event…"
          {...attrs("notes", true)}
        />
      </Field>
    </div>
  );
}
