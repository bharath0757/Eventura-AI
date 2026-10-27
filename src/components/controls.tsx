import type { ReactNode, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, CircleAlert } from "lucide-react";
export function Button({
  children,
  className = "",
  loading = false,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button className={`button ${className}`} {...props}>
      {loading ? <LoaderCircle size={17} className="spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
export function ActionLink({
  href,
  children,
  secondary = false,
}: {
  href: string;
  children: ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link className={`button ${secondary ? "secondary" : ""}`} href={href}>
      {children}
      <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );
}
export function Notice({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: "error" | "info";
}) {
  return (
    <div className={`notice ${tone}`} role={tone === "error" ? "alert" : "status"}>
      <CircleAlert size={18} aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty panel">
      <span className="empty-symbol">✦</span>
      <h2>{title}</h2>
      <p className="muted">{description}</p>
      <ActionLink href="/events/new">Create an event</ActionLink>
    </div>
  );
}
