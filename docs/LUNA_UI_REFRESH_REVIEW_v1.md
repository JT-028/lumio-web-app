# LUNA REVIEW v1.0: UI Refresh

Project: Lumio. Branch `feat/lumio-ui-refresh`, cut from `06f1c54`.
Input: Eden UI Refresh v1, Iris UI Refresh spec v1, Aria UI refresh amendment v1, Lux `design/assets/MANIFEST.md`, and the Jules and Quinn reports.
Date: 26 November 2026.

## Summary

0 CRITICAL, 0 HIGH, 1 MED and 3 LOW findings are open. Luna fixed 2 more LOW findings.
**Overall status: PASS.** The code gate is clear. The open MED item is a check that Quinn still has to run, not a defect.

Who this is for: a Grade 6 student and their parent. Every screen now has the sky-blue, Lumi-led look. The requests, redirects and auth rules are the same as on `06f1c54`. The next engineer inherits small components and a split auth module. No auth file is over 150 lines.

## Behaviour freeze

- `git diff 06f1c54 --stat` shows no change under `src/app/api`, `src/services`, `src/data`, `src/domain`, `src/middleware.ts`, `src/app/auth` or `supabase/`. No untracked file sits in those paths either.
- Under `src/lib`, only `m2-client.ts` changed, and `fonts.ts` was deleted. `getHome` copies the seven card fields and drops `kind`, the child `email` and `study_sets`. The child `id` is used only as a React key.
- The auth split was compared line by line with the old `auth-screen.tsx`. Request bodies, the `lock` and `generation` guards, the `uncertain` recheck, the Google URL checks, the cooldowns and every error sentence are unchanged. Register step 1 sends nothing. Step 2 posts `{ email, password, first_name, role }` to `/api/auth/sign-up`. A server `VALIDATION` error on `role` returns to step 1.
- The invite card, `/role`, `/wait` and `/connect/[token]` send the same requests and branch on the same results. Only markup and Iris's approved copy changed.
- `/resting` is still static (○) in `next build`, with no auth or data call.

## Findings

### MED. Signed-in `/home` was not checked in a browser
File: `src/components/app-shell.tsx`, `src/components/home-screen.tsx`, `src/components/student-home.tsx`.
Issue: The orchestrator's browser pass covered only the public and auth pages. The student and parent homes, the topbar-to-sidebar switch at 768 and 1280, the sticky sidebar and the rail are covered only by happy-dom tests.
Risk: A layout fault that happy-dom does not model, such as overflow at 320 or the sidebar covering focus, would ship unseen. Eden's definition of done asks for a BrowserOS neo check of every screen at 375 and 1440.
Fix: Quinn checks `/home` for both roles at 320, 375, 768, 1280 and 1440 and at 200% zoom, using a test account or a mocked `/api/me` and `/api/home`. Owner: Quinn.

### LOW. No `metadataBase`
File: `src/app/layout.tsx`.
Issue: `next build` warns that `og:image` resolves to `http://localhost:3000` outside Vercel. On Vercel, Next falls back to the deployment URL.
Risk: Social previews break only on a host other than Vercel.
Fix: Set `metadataBase` from the app URL. This is not a safe fix today, because the owner's local `NEXT_PUBLIC_APP_URL` has no scheme and `new URL()` would throw at build time. Owner: Jules, with Aria for the env contract. Deferred.

### LOW. `role-screen.tsx` coverage fell to 60.37% lines
File: `src/components/role-screen.tsx`.
Issue: It read 69.09% on `06f1c54`. The submit and redirect logic did not change. The covered JSX collapsed into `ChoiceCard` and `Field`, so the same untested submit path now weighs more.
Risk: A future change to the role submit could break without a failing test.
Fix: Add one test that submits `/role` and asserts the `{ first_name, role }` body and the redirect. Owner: Quinn.

### LOW. Lighthouse and 200% zoom were not measured
Issue: Eden asks for Lighthouse accessibility 100 on `/`, `/login` and `/signup`, performance 90 or more on `/` and `/login`, CLS under 0.1, and layout that holds at 200% zoom. Luna did not run these.
Risk: The definition of done stays unproven on those lines.
Fix: Quinn runs them in the browser gate. Owner: Quinn.

### LOW (fixed). Dead icon label branch
File: `src/components/icons/index.tsx`.
Issue: `Svg` had a `title` prop that switched to `role="img"` with a `<title>`. No caller passed it, and Iris says icons never carry a `<title>`.
Fix applied: Removed the prop and the branch. Every icon is now always `aria-hidden="true"` and `focusable="false"`.

### LOW (fixed). Card options that never render
File: `src/components/ui.tsx`, `src/app/globals.css`.
Issue: The Card `sub` prop was never passed, so `.card-sub` never rendered. The `tone="info"` option had no `.card--info` rule.
Fix applied: Removed `sub`, the `.card-sub` rule and the `info` tone. `HomeSkeleton` now reuses `Loading` and `Skeleton` instead of copying their markup. The rendered DOM is identical.

## Checks against the review focus

| Area | Result |
| --- | --- |
| Product rules | No streak, gem, XP, level, leaderboard, heart, friends, upgrade, premium, unlock, reward, badge, points or rank in rendered text. The one exception is the exact tagline. No progress bar, meter or percentage. No emoji anywhere in `src`. No bottom tab bar. Home is the only nav item. |
| Lumi art | Only Lux's 13 WebP crops in `src/assets/lumi`. The 2 MB `lumi-hero.png` and `lumio_mascot.png` are imported nowhere and are not emitted in `.next`. |
| Labels and errors | Every input has a visible `<label for>`. Helper text comes before the error. `aria-describedby` lists the error id only while invalid, and `aria-invalid` is set only then. Errors carry words plus an icon. |
| Focus and live regions | Focus ring 2px `--color-focus` with 2px offset on every control. Choice cards use `:has(input:focus-visible)`. Status lines are always mounted with `role="status"`. `role="alert"` is used only for blocking failures. The countdown has `aria-live="off"`. |
| Targets | Buttons 48px, inputs 52px, password toggle 44px, bare stack links 44px, tablet rail items 64px. |
| Type and motion | All type in `rem` tokens. Spatial motion only inside `prefers-reduced-motion: no-preference`. The first reduce rule is the `.fade-in` guard. Nothing loops. |
| Images | Each `LumiImage` sets `width` and `height`. Only the landing and home heroes use `priority`, with eager loading, `fetchpriority="high"` and a preload. `[hidden]` is `display: none !important` in the reset layer, so the inactive register step stays out of view and out of the tab order. |
| Colour | No raw colour outside `@layer tokens` in CSS. The Google mark keeps its brand colours by rule. Gold is used only on sparkles, the tagline underline, the tip edge, step rings and list markers, never as text or state. Recomputed ratios match Iris §1. |
| Security | No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or secret value in `src`, `test`, `docs` or `design`. `.env` is git-ignored. |
| Simplicity | Every CSS selector is used. The auth files are 48 to 137 lines. No `shortcut:` or `ponytail:` debt markers. |
| Asset weight | No file over 200 KB is emitted to `.next/static`. The largest is `lumi-hero.webp` at 130 KB. |

## Checks after Luna's fixes

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0 |
| `npx tsc --noEmit -p test/tsconfig.json` | exit 0 |
| `npm test` | 306 tests, 306 pass, 0 fail, skipped or todo. Lines 93.37%, branches 90.07% (the `06f1c54` real tree read 92.17% and 88.55%) |
| `npx next build` | exit 0. `/resting` static (○). The only warning is `metadataBase` |
| `npm audit --omit=dev` | 0 vulnerabilities |

Test and assertion counts rose in all three rewritten files (m1-shell 12 to 19 tests, m2-frontend 35 to 44, auth-recovery-ui 27 to 34). No test is skipped.

## Plugin gate

- ponytail-review verdict: Ship.
- thermos: no open criticals. Both passes ran inline, because the `thermo-nuclear-*-subagent` types are not available in this harness.
- pstack skills applied: poteto-mode (refactoring playbook for the auth split, feature playbook for the screens), principle-laziness-protocol, principle-subtract-before-you-add, principle-minimize-reader-load, principle-fix-root-causes, principle-prove-it-works, principle-sequence-verifiable-units, typescript-best-practices, principle-test-behavior-not-implementation, no-comments (inline, without the Comment Sicko agent), unslop and technical-writing on this doc and the commit message.
- ponytail-debt: no shortcut debt. Clean ledger.
- Optimizations applied: `src/components/icons/index.tsx`, `src/components/ui.tsx`, `src/components/app-shell.tsx`, `src/app/globals.css`, and one history comment in `src/components/auth/use-auth.ts`.
- Local commit: one commit on `feat/lumio-ui-refresh` that carries this review. Its hash goes to the orchestrator.
- Push and prod: blocked until Quinn PASS and **ship it**.

## Handoff

- Ready for Quinn: yes.
- Ready for Dep: no. Dep waits for Quinn PASS and the owner's **ship it**.

## Notes for Quinn

- Browser-check `/home` for both roles at 320, 375, 768, 1280 and 1440 and at 200% zoom.
- On register step 2, press Enter in Confirm password. Expect one `POST /api/auth/sign-up`. The form's default button is the hidden step-1 "Continue", and `submit` routes on the step, so this should work. Prove it in a real browser.
- Run Lighthouse on `/`, `/login` and `/signup` (mobile).
- Add one `/role` submit test (see the coverage finding).
- The auth-requests lines that the coverage report marks as uncovered are source-map drift. The tests do reach `LINK_EXPIRED` on reset and the resend path.
