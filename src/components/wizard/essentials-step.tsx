import { categories, categoryLabels } from "@/lib/config";
import { Field, categoryIcons as categoryIcon } from "./shared";
import type { WizardModel } from "./use-wizard";

export function EssentialsStep({ form }: { form: WizardModel }) {
  const {
    name,
    date,
    guests,
    location,
    category,
    errors,
    attrs,
    changeCategory,
    setName,
    setDate,
    setGuests,
    setLocation,
  } = form;
  return (
    <div className="form-fields">
      <fieldset className="category-picker">
        <legend>What are you planning?</legend>
        <div>
          {categories.map((c) => {
            const C = categoryIcon[c];
            return (
              <button
                type="button"
                key={c}
                aria-pressed={category === c}
                className={category === c ? "selected" : ""}
                onClick={() => changeCategory(c)}
              >
                <C size={20} />
                {categoryLabels[c]}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field id="name" label="Event name" error={errors.name}>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Give your moment a name"
          maxLength={80}
          autoComplete="off"
          {...attrs("name")}
        />
      </Field>
      <div className="field-grid">
        <Field id="date" label="Event date" error={errors.date}>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            {...attrs("date")}
          />
        </Field>
        <Field
          id="guests"
          label="Expected guests"
          error={errors.guests}
          hint="A whole number, from 1 to 1,00,000."
        >
          <input
            id="guests"
            inputMode="numeric"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="e.g. 80"
            {...attrs("guests", true)}
          />
        </Field>
      </div>
      <Field id="location" label="City or location" error={errors.location}>
        <input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={120}
          placeholder="e.g. Hyderabad, Telangana"
          {...attrs("location")}
        />
      </Field>
    </div>
  );
}
