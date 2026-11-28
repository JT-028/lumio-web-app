import type { ReactNode, Ref } from "react";
import { AlertIcon, CheckIcon, InfoIcon, SparkleIcon } from "@/components/icons";
import { LumiImage, type Pose } from "@/components/lumi-image";

export function SkipLink() {
  return <a className="skip-link" href="#main">Skip to main content</a>;
}

/** Wordmark, gold sparkle and tagline. Linked only on public and auth pages. */
export function BrandBlock({ linked = false }: { linked?: boolean }) {
  return (
    <div className="brand">
      <p className="brand-name">
        {linked ? <a className="wordmark" href="/">Lumio</a> : <span className="wordmark">Lumio</span>}
        <SparkleIcon className="brand-sparkle" />
      </p>
      <p className="tagline">Learn. Grow. <span className="level-up">Level Up.</span></p>
    </div>
  );
}

export function Card({ id, title, tone, className, children }: {
  id?: string;
  title?: ReactNode;
  tone?: "tip";
  className?: string;
  children?: ReactNode;
}) {
  const classes = ["card", tone ? `card--${tone}` : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <section className={classes} aria-labelledby={title ? id : undefined}>
      {title ? <h2 id={id} className="card-title">{title}</h2> : null}
      {children}
    </section>
  );
}

export type Tone = "info" | "success" | "error";
const TONE_ICON = { info: InfoIcon, success: CheckIcon, error: AlertIcon };

/** Words carry the meaning; the icon and colour are extra. Polite unless `role="alert"`. */
export function StatusLine({ id, tone = "info", role = "status", focusable = false, ref, className, children }: {
  id?: string;
  tone?: Tone;
  role?: "status" | "alert";
  focusable?: boolean;
  ref?: Ref<HTMLParagraphElement>;
  className?: string;
  children?: ReactNode;
}) {
  const Icon = TONE_ICON[tone];
  const empty = children === "" || children == null || children === false;
  return (
    <p id={id} ref={ref} role={role} tabIndex={focusable ? -1 : undefined}
      className={[`status is-${tone}`, className ?? ""].filter(Boolean).join(" ")}>
      {empty ? null : <><Icon className="status-icon" />{children}</>}
    </p>
  );
}

/** Static placeholder blocks; paired with visually hidden "Loading" text. */
export function Skeleton({ circle = false, lines = 0, blocks = 0, className }: {
  circle?: boolean;
  lines?: number;
  blocks?: number;
  className?: string;
}) {
  return (
    <div className={className ? `skeleton ${className}` : "skeleton"} aria-hidden="true">
      {circle ? <span className="skeleton-circle" /> : null}
      {Array.from({ length: lines }, (_, index) => (
        <span key={`line-${index}`} className={index === lines - 1 ? "skeleton-line short" : "skeleton-line"} />
      ))}
      {Array.from({ length: blocks }, (_, index) => <span key={`block-${index}`} className="skeleton-block" />)}
    </div>
  );
}

export function Loading() {
  return <p className="visually-hidden">Loading</p>;
}

export function EmptyState({ pose, alt, title, level = 3, children }: {
  pose: Pose;
  alt: string;
  title: string;
  level?: 2 | 3;
  children: ReactNode;
}) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <div className="empty-state">
      <LumiImage pose={pose} alt={alt} size="md" />
      <Heading className="empty-title">{title}</Heading>
      {children}
    </div>
  );
}

/** Numbered steps: the list carries the numbers; the discs are decoration. */
export function Steps({ items }: { items: readonly (readonly [string, string])[] }) {
  return (
    <ol className="steps">
      {items.map(([title, text], index) => (
        <li key={title} className="step">
          <span className="step-num" aria-hidden="true">{index + 1}</span>
          <div><h3 className="step-name">{title}</h3><p className="step-text">{text}</p></div>
        </li>
      ))}
    </ol>
  );
}
