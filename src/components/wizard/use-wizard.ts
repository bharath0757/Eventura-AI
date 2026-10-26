"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { ZodError } from "zod";
import type { Category, CategoryDetails } from "@/types";
import {
  detailsSchema,
  categoryDetailsSchema,
  budgetSchema,
  creationSchema,
  parseIntegerInput,
} from "@/lib/validation/schemas";
import { todayLocal } from "@/lib/dates";
import { createRecord } from "@/lib/planner";
import { eventStore } from "@/lib/storage/events";

function defaults(category: Category): CategoryDetails {
  if (category === "wedding") return { category, ceremonyStyle: "traditional", theme: "" };
  if (category === "birthday")
    return { category, ageGroup: "adults", celebrationStyle: "", activities: "" };
  return { category, format: "meetup", theme: "", volunteers: 0 };
}
export function useWizard(initialCategory?: Category) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<Category>(initialCategory ?? "wedding");
  const [details, setDetails] = useState<CategoryDetails>(() =>
    defaults(initialCategory ?? "wedding"),
  );
  const [name, setName] = useState(""),
    [date, setDate] = useState(""),
    [location, setLocation] = useState(""),
    [guests, setGuests] = useState("");
  const [budget, setBudget] = useState(""),
    [priorities, setPriorities] = useState<string[]>([]);
  const [dietary, setDietary] = useState(""),
    [accessibility, setAccessibility] = useState(""),
    [notes, setNotes] = useState("");
  const [volunteers, setVolunteers] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({}),
    [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false),
    heading = useRef<HTMLHeadingElement>(null);
  const brief = () => ({
    category,
    name,
    date,
    location,
    guests: parseIntegerInput(guests),
    details:
      details.category === "community"
        ? { ...details, volunteers: parseIntegerInput(volunteers) }
        : details,
    budget: parseIntegerInput(budget),
    priorities,
    dietary,
    accessibility,
    notes,
  });
  function changeCategory(next: Category) {
    if (next === category) return;
    setCategory(next);
    setDetails(defaults(next));
    setPriorities([]);
    setVolunteers("0");
    setErrors({});
  }
  function showErrors(error: ZodError) {
    const map: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = String(issue.path.at(-1) ?? "form");
      map[key] ??= issue.message;
    }
    setErrors(map);
    requestAnimationFrame(() => document.getElementById(Object.keys(map)[0])?.focus());
  }
  function go(next: number) {
    setStep(next);
    setErrors({});
    setFailure("");
    requestAnimationFrame(() => heading.current?.focus());
  }
  function next() {
    const b = brief();
    const result =
      step === 0
        ? detailsSchema
            .refine((v) => v.date >= todayLocal(), {
              path: ["date"],
              message: "Choose today or a future date.",
            })
            .safeParse(b)
        : step === 1
          ? categoryDetailsSchema.safeParse(b.details)
          : budgetSchema.safeParse(b);
    if (!result.success) {
      showErrors(result.error);
      return;
    }
    go(step + 1);
  }
  function create() {
    if (locked.current) return;
    const result = creationSchema().safeParse(brief());
    if (!result.success) {
      const field = String(result.error.issues[0]?.path[0]);
      const index = ["name", "date", "location", "guests", "category"].includes(field)
        ? 0
        : field === "details"
          ? 1
          : 2;
      setStep(index);
      showErrors(result.error);
      return;
    }
    locked.current = true;
    setBusy(true);
    setFailure("");
    try {
      const record = createRecord(result.data);
      eventStore().save(record);
      router.push(`/events/${record.id}`);
    } catch (e) {
      setFailure(
        e instanceof Error
          ? e.message
          : "The event could not be created. Your details are still here.",
      );
      locked.current = false;
      setBusy(false);
    }
  }
  function submit(e: FormEvent) {
    e.preventDefault();
    if (step < 3) next();
    else create();
  }
  const attrs = (id: string, hasHint = false) => ({
    "aria-invalid": !!errors[id],
    "aria-describedby":
      [hasHint ? `${id}-hint` : null, errors[id] ? `${id}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined,
  });
  const numericBudget = parseIntegerInput(budget);
  return {
    step,
    category,
    details,
    name,
    date,
    location,
    guests,
    budget,
    priorities,
    dietary,
    accessibility,
    notes,
    volunteers,
    errors,
    failure,
    busy,
    heading,
    numericBudget,
    attrs,
    go,
    changeCategory,
    submit,
    setDetails,
    setName,
    setDate,
    setLocation,
    setGuests,
    setBudget,
    setPriorities,
    setDietary,
    setAccessibility,
    setNotes,
    setVolunteers,
  };
}
export type WizardModel = ReturnType<typeof useWizard>;
