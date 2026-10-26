import type { ReactNode } from "react";
import { ArrowRight, Heart, Cake, Users } from "lucide-react";
export const categoryIcons = { wedding: Heart, birthday: Cake, community: Users };
export const steps = ["The essentials", "Make it yours", "Budget & priorities", "Review & create"];
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
      {error ? (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) {
  return (
    <section className="review-section">
      <div>
        <h3>{title}</h3>
        <button
          type="button"
          className="text-link"
          onClick={onEdit}
          aria-label={`Edit ${title.toLowerCase()}`}
        >
          Edit <ArrowRight size={13} />
        </button>
      </div>
      {children}
    </section>
  );
}
