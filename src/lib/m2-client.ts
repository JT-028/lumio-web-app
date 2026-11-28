import type { ConnectPreview, OfficialCard } from "@/domain/types";

type Failure = { ok: false; status: number; code: string };
type Result<T> = { ok: true; data: T } | Failure;
export type HomeCard = Omit<OfficialCard, "kind">;
export type HomeChild = {
  id: string; // React key only; never rendered
  first_name: string;
  official_cards: HomeCard[];
};
export type HouseholdHome = {
  role: "parent" | "student";
  first_name: string;
  needs_parent: boolean;
  children: HomeChild[];
};

const codes = new Set(["NOT_FOUND", "LINK_EXPIRED", "ROLE_REQUIRED"]);

async function request(path: string): Promise<Result<unknown>> {
  try {
    const response = await fetch(path, {
      method: "GET", credentials: "same-origin", cache: "no-store",
      headers: { accept: "application/json" },
      referrerPolicy: "no-referrer",
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = record(record(body)?.error);
      const code = typeof error?.code === "string" && codes.has(error.code) ? error.code : "";
      return { ok: false, status: response.status, code };
    }
    return { ok: true, data: body };
  } catch {
    return { ok: false, status: 0, code: "" };
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}
const malformed: Failure = { ok: false, status: 0, code: "" };

// Copies only the seven listed fields; `kind` is always "official" (Aria amendment).
function homeCard(value: unknown): HomeCard | null {
  const card = record(value);
  if (!card || (card.quarter !== 1 && card.quarter !== 2)) return null;
  const { id, slug, course, course_label, quarter_label, header } = card;
  if (typeof id !== "string" || typeof slug !== "string" || typeof course !== "string" ||
      typeof course_label !== "string" || typeof quarter_label !== "string" ||
      typeof header !== "string") return null;
  return { id, slug, course, course_label, quarter: card.quarter, quarter_label, header };
}

export async function getHome(): Promise<Result<HouseholdHome>> {
  const result = await request("/api/home");
  if (!result.ok) return result;
  const row = record(result.data);
  if (!row || (row.role !== "parent" && row.role !== "student") ||
      typeof row.first_name !== "string" || typeof row.needs_parent !== "boolean" ||
      !Array.isArray(row.children)) return malformed;
  const children: HomeChild[] = [];
  for (const child of row.children) {
    const item = record(child);
    if (typeof item?.id !== "string" || typeof item.first_name !== "string" ||
        !Array.isArray(item.official_cards)) return malformed;
    const cards: HomeCard[] = [];
    for (const value of item.official_cards) {
      const card = homeCard(value);
      if (!card) return malformed;
      cards.push(card);
    }
    children.push({ id: item.id, first_name: item.first_name, official_cards: cards });
  }
  return { ok: true, data: {
    role: row.role, first_name: row.first_name, needs_parent: row.needs_parent, children,
  } };
}

export async function getConnectPreview(token: string): Promise<Result<ConnectPreview>> {
  const result = await request(`/api/connect/${encodeURIComponent(token)}`);
  if (!result.ok) return result;
  const row = record(result.data);
  if (!row || typeof row.invited_email !== "string" || typeof row.parent_first_name !== "string" ||
      typeof row.expires_at !== "string" ||
      (row.state !== "sent" && row.state !== "accepted" && row.state !== "ignored")) return malformed;
  return { ok: true, data: {
    invited_email: row.invited_email, parent_first_name: row.parent_first_name,
    expires_at: row.expires_at, state: row.state,
  } };
}

export function homeRedirect(result: Result<HouseholdHome>): "/" | "/role" | null {
  if (!result.ok && result.status === 401) return "/";
  if (!result.ok && result.status === 403 && result.code === "ROLE_REQUIRED") return "/role";
  return null;
}

export function connectExpiry(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    return "This link has an end time, and the date could not be shown.";
  }
  return `This link lasts until ${date.toLocaleString()}. Links last 7 days.`;
}
