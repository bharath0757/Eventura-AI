import { Field } from "./shared";
import type { WizardModel } from "./use-wizard";

export function DetailsStep({ form }: { form: WizardModel }) {
  const { details, volunteers, errors, attrs, setDetails, setVolunteers } = form;
  return (
    <div className="form-fields">
      {details.category === "wedding" ? (
        <>
          <Field id="ceremonyStyle" label="Ceremony style" error={errors.ceremonyStyle}>
            <select
              id="ceremonyStyle"
              value={details.ceremonyStyle}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "traditional" || v === "modern" || v === "fusion" || v === "minimalist")
                  setDetails({ ...details, ceremonyStyle: v });
              }}
              {...attrs("ceremonyStyle")}
            >
              <option value="traditional">Traditional</option>
              <option value="modern">Modern</option>
              <option value="fusion">Fusion</option>
              <option value="minimalist">Minimalist</option>
            </select>
          </Field>
          <Field
            id="theme"
            label="Theme & atmosphere"
            error={errors.theme}
            hint="Describe the feeling, colors or setting you have in mind."
          >
            <textarea
              id="theme"
              value={details.theme}
              onChange={(e) => setDetails({ ...details, theme: e.target.value })}
              maxLength={160}
              placeholder="Warm florals, a garden ceremony, an intimate feel…"
              {...attrs("theme", true)}
            />
          </Field>
        </>
      ) : null}
      {details.category === "birthday" ? (
        <>
          <Field id="ageGroup" label="Who is the celebration for?" error={errors.ageGroup}>
            <select
              id="ageGroup"
              value={details.ageGroup}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "children" || v === "teenagers" || v === "adults" || v === "mixed")
                  setDetails({ ...details, ageGroup: v });
              }}
              {...attrs("ageGroup")}
            >
              <option value="children">Children</option>
              <option value="teenagers">Teenagers</option>
              <option value="adults">Adults</option>
              <option value="mixed">Mixed ages</option>
            </select>
          </Field>
          <Field id="celebrationStyle" label="Celebration style" error={errors.celebrationStyle}>
            <input
              id="celebrationStyle"
              value={details.celebrationStyle}
              onChange={(e) => setDetails({ ...details, celebrationStyle: e.target.value })}
              maxLength={160}
              placeholder="A relaxed garden lunch, a colorful game night…"
              {...attrs("celebrationStyle")}
            />
          </Field>
          <Field id="activities" label="Preferred activities" error={errors.activities}>
            <textarea
              id="activities"
              value={details.activities}
              onChange={(e) => setDetails({ ...details, activities: e.target.value })}
              maxLength={300}
              placeholder="Music, crafts, group games, storytelling…"
              {...attrs("activities")}
            />
          </Field>
        </>
      ) : null}
      {details.category === "community" ? (
        <>
          <Field id="format" label="Event format" error={errors.format}>
            <select
              id="format"
              value={details.format}
              onChange={(e) => {
                const v = e.target.value;
                if (
                  v === "workshop" ||
                  v === "festival" ||
                  v === "meetup" ||
                  v === "fundraiser" ||
                  v === "neighborhood" ||
                  v === "other"
                )
                  setDetails({ ...details, format: v });
              }}
              {...attrs("format")}
            >
              <option value="workshop">Workshop</option>
              <option value="festival">Festival</option>
              <option value="meetup">Meetup</option>
              <option value="fundraiser">Fundraiser</option>
              <option value="neighborhood">Neighborhood gathering</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field id="theme" label="Theme or purpose" error={errors.theme}>
            <textarea
              id="theme"
              value={details.theme}
              onChange={(e) => setDetails({ ...details, theme: e.target.value })}
              maxLength={160}
              placeholder="What will bring your community together?"
              {...attrs("theme")}
            />
          </Field>
          <Field
            id="volunteers"
            label="Volunteer count"
            error={errors.volunteers}
            hint="Enter 0 if not applicable."
          >
            <input
              id="volunteers"
              inputMode="numeric"
              value={volunteers}
              onChange={(e) => setVolunteers(e.target.value)}
              {...attrs("volunteers", true)}
            />
          </Field>
        </>
      ) : null}
    </div>
  );
}
