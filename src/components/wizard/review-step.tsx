import { categoryLabels } from "@/lib/config";
import { formatDate, money } from "@/lib/dates";
import { Notice } from "../controls";
import { ReviewSection } from "./shared";
import type { WizardModel } from "./use-wizard";

export function ReviewStep({ form }: { form: WizardModel }) {
  const {
    name,
    category,
    date,
    location,
    guests,
    details,
    volunteers,
    numericBudget,
    priorities,
    dietary,
    accessibility,
    notes,
    go,
  } = form;
  return (
    <div className="review">
      <ReviewSection title="The essentials" onEdit={() => go(0)}>
        <dl>
          <dt>Event</dt>
          <dd>
            {name} · {categoryLabels[category]}
          </dd>
          <dt>When & where</dt>
          <dd>
            {formatDate(date)} · {location}
          </dd>
          <dt>Guests</dt>
          <dd>{guests}</dd>
        </dl>
      </ReviewSection>
      <ReviewSection title="Your style" onEdit={() => go(1)}>
        <dl>
          {Object.entries(details)
            .filter(([key]) => key !== "category")
            .map(([key, value]) => (
              <div className="dl-row" key={key}>
                <dt>
                  {{
                    ceremonyStyle: "Ceremony",
                    ageGroup: "Age group",
                    celebrationStyle: "Style",
                    theme: "Theme",
                    activities: "Activities",
                    format: "Format",
                    volunteers: "Volunteers",
                  }[key] ?? key}
                </dt>
                <dd>{key === "volunteers" ? volunteers : String(value)}</dd>
              </div>
            ))}
        </dl>
      </ReviewSection>
      <ReviewSection title="Budget & requirements" onEdit={() => go(2)}>
        <dl>
          <dt>Total budget</dt>
          <dd className="review-budget">{money(numericBudget)}</dd>
          <dt>Priorities</dt>
          <dd>{priorities.join(" · ")}</dd>
          {dietary ? (
            <>
              <dt>Dietary</dt>
              <dd>{dietary}</dd>
            </>
          ) : null}
          {accessibility ? (
            <>
              <dt>Accessibility</dt>
              <dd>{accessibility}</dd>
            </>
          ) : null}
          {notes ? (
            <>
              <dt>Notes</dt>
              <dd>{notes}</dd>
            </>
          ) : null}
        </dl>
      </ReviewSection>
      <Notice tone="info">
        Your plan uses transparent rules and estimates, including a 10% contingency reserve. It is
        saved only in this browser. After creation, open AI assistant for personalized Gemini ideas,
        questions and protected budget options. Live assistance falls back to labelled rule-based
        guidance when unavailable.
      </Notice>
    </div>
  );
}
