# ARIA BLUEPRINT AMENDMENT — UI refresh client data v1.0

Date: 2026-11-25. Branch `feat/lumio-ui-refresh`, based on `06f1c54`.
Input: `EDEN_UI_REFRESH_v1.md` ("Real guide cards", owner-approved); `src/services/home.ts`; `src/data/cards.ts`; `src/lib/m2-client.ts`.
Status: approved with two adjustments: keep the child `id`, and drop `email` and `study_sets`. The API, server, SQL and `src/domain` are unchanged. This amends the client half of `GET /api/home` only. It does not change `ARIA_AUTH_DECISIONS_v1.md`.

## Decision

- **Approve:** `getHome` keeps each child's `official_cards`. It copies only the seven fields below and drops `kind`, because the API always sends `"official"`.
- **Keep the child `id`.** It is not rendered. Use it only as the React key, so two children with the same first name stay two items (`IRIS_M2_SPEC_v1` rule).
- **Drop the child `email`.** No screen shows it, so it should not live in client state.
- **Drop `study_sets`.** It is always `[]` until M6. Ignore it and `study_sets_next_cursor`. M6 adds a real type when sets exist.
- **Linked student home:** it now calls `GET /api/home`. This supersedes the line "`GET /api/me` is the only read" in `IRIS_STUDENT_HOME_SPEC_v1`. It uses `children[0].official_cards` only when `role === "student"`, `needs_parent === false` and `children.length === 1`. Any other student response keeps today's gate: the unlinked student goes to `/wait`. The existing `homeRedirect` codes are unchanged.
- **Order and count:** render the array in the API's order, which the server sorts by `officialRank`. Do not re-sort, filter or pad. A count other than 8 is not malformed. The server inserts all 8 with the household.

## Exact client type (`src/lib/m2-client.ts`)

```ts
import type { ConnectPreview, OfficialCard } from "@/domain/types";

export type HomeCard = Omit<OfficialCard, "kind">;
// { id: string; slug: string; course: string; course_label: string;
//   quarter: 1 | 2; quarter_label: string; header: string }

export type HomeChild = {
  id: string;            // React key only; never rendered
  first_name: string;
  official_cards: HomeCard[];
};

export type HouseholdHome = {
  role: "parent" | "student";
  first_name: string;
  needs_parent: boolean;
  children: HomeChild[];
};
```

Validation is the same strictness as today: one bad item makes the whole result `malformed`.
- A child's `id` and `first_name` must be strings, and `official_cards` must be an array.
- Each card's `id`, `slug`, `course`, `course_label`, `quarter_label` and `header` must be strings, and `quarter` must be `1` or `2`.
- Copy only the listed fields.

## Notes for Luna

- `git diff 06f1c54` shows no change under `src/app/api`, `src/services`, `src/data`, `src/domain` or `supabase/`.
- `email`, `kind` and `study_sets` are absent from the client objects. The child `id` is never rendered.
- Cards are not links, buttons or focus stops (Eden, until M3).
