UI/UX SPEC — UI Refresh v1
Project: Lumio
Input: EDEN_UI_REFRESH_v1 (binding scope), ARIA_UI_REFRESH_AMENDMENT_v1 (binding data), owner decisions of 25 November 2026, plan "Phase B", IRIS_M1/M2/STUDENT_HOME/LOGIN/AUTH_RECOVERY specs, `docs/inspiration/lumio_ui_ux_design_system.md`, ui-ux-pro-max output (Claymorphism-lite), modern-web-guidance guides listed in §13.
Branch: `feat/lumio-ui-refresh`. Builder: Jules (one frontend dev). Pictures: Lux. Tests: Quinn. Review: Luna.

This spec replaces the **look** (colour, type, shape, layout, art, copy tone) of every older Iris spec. Their flows, redirects, request bodies, states, 44px targets, focus rules, accessibility lists and error meanings stay authoritative. Where this spec is silent, the older spec wins. Cream (`#FFF9EF`), chestnut bars, "morning workbook", Fraunces and Atkinson are retired. No API, middleware, gate, database or auth-logic change. No new feature.

Out (Eden "Not in this release"): streaks, gems, XP, levels, leaderboards, hearts, friends, Upgrade, paywall, rewards, progress rings/bars/meters/percentages, search, bell, language chips, quiz screen, bottom tab bar, dark mode, guide opening. The reference's "Continue" card and hero CTA on the student home are also out: there is no next-guide field and guides do not open.

---

## 1. Colour tokens

Every colour is a custom property on `:root` (in `@layer tokens`). No raw hex outside that block (Eden DoD). Light only; names are semantic so a dark block can be added later without touching components.

| Token | Value | Role |
| --- | --- | --- |
| `--color-page` | `#EFF6FF` | Page background (light sky) |
| `--color-surface` | `#FFFFFF` | Cards, inputs, sidebar |
| `--color-surface-soft` | `#F5F9FF` | Inset panels, quarter chips, skeleton host |
| `--color-surface-sky` | `#DCEBFF` | Active nav pill, selected choice wash |
| `--color-sky-top` | `#CFE2FF` | Hero / auth panel gradient start |
| `--color-sky-bottom` | `#EAF3FF` | Hero / auth panel gradient end |
| `--color-border` | `#DCE6F7` | Decorative card borders, dividers (not a control boundary) |
| `--color-border-strong` | `#64759C` | Input, outline-button and unselected choice-card borders |
| `--color-text` | `#172B4D` | Navy: headings and body |
| `--color-text-muted` | `#4A5878` | Helpers, metadata, divider word |
| `--color-primary` | `#2B4FB8` | Royal blue from Lumi's hat: primary fill, links, hero name, active nav |
| `--color-primary-hover` | `#22409A` | Primary hover |
| `--color-primary-pressed` | `#1B3580` | Primary active |
| `--color-primary-soft` | `#E3EDFF` | Info wash, mathematics tint, role badge |
| `--color-on-primary` | `#FFFFFF` | Text/icons on primary |
| `--color-accent` | `#EFB94E` | Lumi gold. Decoration only: sparkles, "Level Up." underline, step-number disc ring. Never text, never a state, never a meter |
| `--color-accent-soft` | `#FFF4D9` | Lumi tip card wash |
| `--color-success` | `#1D7A4E` | Success text/icon |
| `--color-success-soft` | `#E4F6EC` | Success wash |
| `--color-error` | `#B42318` | Error text/icon/invalid border |
| `--color-error-soft` | `#FDEDEC` | Error wash |
| `--color-info` | `var(--color-primary)` | Info icon/text |
| `--color-info-soft` | `var(--color-primary-soft)` | Info wash |
| `--color-focus` | `#172B4D` | Focus ring (keeps the M1 "2px ink outline" rule) |
| `--color-skeleton` | `#E3EBF8` | Skeleton blocks (decorative) |
| `--color-disabled-bg` | `#E3EBF8` | Disabled button fill |
| `--course-geography-bg` / `-ink` | `#E2F5EA` / `#1E7A4C` | Course tile tint / icon colour |
| `--course-history-bg` / `-ink` | `#FFF1D9` / `#9A5B00` | |
| `--course-language-bg` / `-ink` | `#F1EAFF` / `#6B3FC4` | |
| `--course-mathematics-bg` / `-ink` | `#E3EDFF` / `#2B4FB8` | |
| `--course-default-bg` / `-ink` | `#F5F9FF` / `#4A5878` | Unknown `course` value |

**Final primary:** `#2B4FB8` — white on it 7.21:1, it on page 6.62:1, on white 7.21:1. Chosen over `#2563EB` (5.17:1) because it is closer to Lumi's hat (sampled median ≈ `#2D4A8F`–`#3961A1`) and keeps AA on every tint below. **Secondary/accent:** gold `#EFB94E` — 1.79:1 on white, 1.36:1 on sky, so decoration only (Eden risk "Gold contrast").

Contrast (WCAG 2.x, computed; every text pair ≥ 4.5:1, every non-text boundary ≥ 3:1):

| Foreground | Background | Ratio | Use |
| --- | --- | --- | --- |
| text `#172B4D` | surface `#FFFFFF` | 14.10 | Body, headings |
| text | page `#EFF6FF` | 12.96 | Page-level text |
| text | sky-top `#CFE2FF` | 10.73 | Hero greeting (worst gradient stop) |
| text | surface-sky `#DCEBFF` | 11.66 | Selected choice card |
| text | primary-soft `#E3EDFF` | 11.97 | Info panel, maths tile |
| text | accent-soft `#FFF4D9` | 12.89 | Tip card |
| text | success-soft / error-soft | 12.55 / 12.42 | Washed status panels |
| text | course tints (geo/hist/lang) | 12.41 / 12.65 / 12.06 | Course tile titles |
| text-muted `#4A5878` | surface | 7.10 | Helpers |
| text-muted | page | 6.52 | |
| text-muted | sky-top | 5.40 | Hero subline |
| text-muted | surface-sky / surface-soft / accent-soft | 5.87 / 6.72 / 6.49 | |
| on-primary `#FFFFFF` | primary `#2B4FB8` | 7.21 | Primary button |
| on-primary | primary-hover / pressed | 9.26 / 11.24 | |
| primary `#2B4FB8` | surface / page | 7.21 / 6.62 | Links, quiet buttons |
| primary | sky-top / sky-bottom | 5.48 / 6.44 | Hero name, panel link |
| primary | surface-sky / primary-soft / accent-soft | 5.96 / 6.12 / 6.59 | Active nav label, chips |
| success `#1D7A4E` | surface / success-soft / page | 5.32 / 4.74 / 4.89 | Success line |
| error `#B42318` | surface / error-soft / page | 6.57 / 5.79 / 6.04 | Error text |
| geo ink `#1E7A4C` | white badge / tint | 5.33 / 4.69 | Course icon |
| history ink `#9A5B00` | white badge / tint | 5.43 / 4.87 | |
| language ink `#6B3FC4` | white badge / tint | 6.70 / 5.73 | |
| border-strong `#64759C` | surface / page | 4.60 / 4.23 | Input + control borders (≥3:1) |
| focus `#172B4D` | surface / page / sky-top | 14.10 / 12.96 / 10.73 | Focus ring |
| primary (active-nav bar) | surface | 7.21 | Current-page indicator (≥3:1, not colour alone) |
| accent `#EFB94E` | surface / sky-top | 1.79 / 1.36 | **Fails** — decoration only |
| border `#DCE6F7` | surface | 1.26 | Decorative only; never the only boundary of a control |

## 2. Type scale

Faces (already self-hosted in `src/fonts`; no new files): **Baloo 2 700** for wordmark, h1, h2, hero; **Nunito 400/500/700** for everything else. The plan's extra Baloo 500/600 weights are not added (only 700 is used). Delete Fraunces, Atkinson and `src/lib/fonts.ts` (Eden). `font-display: swap` plus `font-size-adjust: from-font` on `body` and display text so fallbacks do not shift layout. Display text is **no longer hidden** until `document.fonts.ready` (the M1 fade-in is retired; it delayed LCP). All sizes in `rem`, line-height unitless, so OS text scale and 200% zoom work.

| Token | Size | Face / weight | Line-height | Use |
| --- | --- | --- | --- | --- |
| `--text-hero` | `clamp(2rem, 1.5rem + 2vw, 2.75rem)` (32→44px) | Baloo 700 | 1.15 | Home greeting h1, landing h1 |
| `--text-h1` | `clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem)` (28→36px) | Baloo 700 | 1.15 | h1 on auth, focus and static pages |
| `--text-h2` | `clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem)` (20→24px) | Baloo 700 | 1.2 | Card and section titles |
| `--text-h3` | `1.125rem` (18px) | Nunito 700 | 1.3 | Course name, child name, step titles |
| `--text-lg` | `1.125rem` (18px) | Nunito 500 | 1.5 | Lumi's line, ledes, sky-panel welcome |
| `--text-body` | `1rem` (16px) | Nunito 400 | 1.5 | Body, inputs (`font-size: max(1rem, 1em)`) |
| `--text-label` | `1rem` (16px) | Nunito 700 | 1.4 | Field labels, buttons |
| `--text-small` | `0.875rem` (14px, the floor) | Nunito 500 | 1.4 | Helpers, chips, tagline, step label, rail labels |
| `--text-wordmark` | `1.75rem` (28px) | Baloo 700 | 1 | "Lumio" |

Left-aligned text everywhere except EmptyState and static-page cards (centred, max 36ch). Paragraphs max 65ch. Names and emails use `overflow-wrap: anywhere`.

## 3. Spacing, radius, shadow, motion

- Spacing (4px base): `--space-1` 4, `--space-2` 8, `--space-3` 12, `--space-4` 16, `--space-5` 20, `--space-6` 24, `--space-8` 32, `--space-10` 40, `--space-12` 48. Label→input gap 8 < field→field gap 20 (Gestalt rule, `forms`). Controls at least 8px apart.
- Radius: `--radius-sm` 12 (inputs, chips), `--radius-md` 16 (buttons, choice cards, course tiles), `--radius-lg` 20 (cards), `--radius-xl` 24 (hero, auth split card), `--radius-pill` 999px (nav pill, status tag, quarter chip).
- Shadows (Claymorphism-lite, blue-tinted, soft double):
  - `--shadow-card`: `0 1px 2px rgb(23 43 77 / 0.06), 0 8px 24px rgb(43 79 184 / 0.08)`
  - `--shadow-raised`: `0 2px 4px rgb(23 43 77 / 0.08), 0 16px 32px rgb(43 79 184 / 0.12)` (hero, auth card, hovered choice card)
  - `--shadow-button`: `0 2px 0 rgb(27 53 128 / 0.35)` (primary "clay lip")
  - `--shadow-inset`: `inset 0 2px 4px rgb(23 43 77 / 0.12)` (pressed)
- Motion: `--duration-fast` 150ms (colour, background, border), `--duration-base` 200ms (press, lift), `--duration-slow` 250ms (register step fade). `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`.
  - Colour/background/border transitions (150ms) are not motion and always run.
  - Spatial motion is opt-in inside `@media (prefers-reduced-motion: no-preference)` only (`motion`): primary/secondary press `translateY(1px)` + `--shadow-inset`; ChoiceCard hover `translateY(-2px)` + `--shadow-raised`; register step panel fade-in (opacity 0→1, 250ms, once).
  - The first rule inside the first `@media (prefers-reduced-motion: reduce)` block is `.fade-in { opacity: 1; transition: none; animation: none; }` (keeps the existing CSS guard test meaningful).
  - Nothing loops, flashes or plays sound. Skeletons do **not** shimmer. No count-up, bob or float on Lumi. No `animation-duration: 0.01ms` global override.

## 4. Layout grids and breakpoints

| Name | Width | Signed-in `/home` (AppShell) | Auth pages | Focus pages (`/role`, `/wait`, `/connect`) |
| --- | --- | --- | --- | --- |
| Phone | < 768 | TopBar, one column, rail cards after main, gutters 16 | One card ≤ 480, Lumi peeks above | TopBar, card ≤ 560 |
| Tablet | 768–1279 | TopBar + 96px icon Sidebar; main ≤ 880; rail cards in `repeat(auto-fit, minmax(280px, 1fr))` under main; gutters 24 | One card ≤ 480 below 960; split ≥ 960 | same, centred |
| Desktop | ≥ 1280 | No TopBar. Grid `248px minmax(0,1fr) 320px`, gap 32, padding 32, container max 1440 centred; sidebar `position: sticky; top: 0; block-size: 100dvh` | Split card ≤ 1040 | same |

- Auth split breakpoint is **960px**: columns `minmax(0,1fr) minmax(320px, 0.85fr)`, form panel padding 40, sky panel on the right.
- Landing hero splits (copy left, Lumi right) at **768px**; stacked (Lumi under copy) below.
- Every grid child gets `min-inline-size: 0`; no fixed widths over 288px; no horizontal scroll at 320/375/414/768/1024/1280/1440 and at 200% zoom (Eden). TopBar is static, not sticky (sticky bars eat space at 200% zoom).
- Logical properties (`margin-inline`, `padding-block`) throughout.

## 5. Component inventory

All icons are Lux's inline SVG components in `src/components/icons/`, 20px in buttons/fields, 24px in nav, `aria-hidden="true" focusable="false"`, no `<title>` (so a button's `textContent` stays its words). No emoji anywhere. Lumi art is only Lux's crops (§12).

**BrandBlock.** Anatomy: `.wordmark` "Lumio" (Baloo 28, navy) + decorative gold `sparkle` icon + `.tagline` "Learn. Grow. <span class="level-up">Level Up.</span>" (14px muted; 3px gold underline under "Level Up." only). On landing and auth the wordmark is `<a href="/">`; in signed-in chrome it is plain text (M1/M2 rule: not a link on `/wait`). No mascot image in the brand (keeps the first `<img>` on landing/auth the hero; the mascot lives in each page's hero/card).

**AppShell** (`/home` only). DOM order: skip link → TopBar → Sidebar → `<main id="main" tabindex="-1">` (main column, then `<div class="rail">`). States: loading (all chrome real except account name → skeleton line), ready, signing-out (Sign out disabled). Wraps `useSignOut` unchanged. ARIA: one `main`, sidebar is `<aside aria-label="Account and navigation">` containing `<nav aria-label="Main">`.

**Sidebar** (tablet + desktop; `display: none` < 768).
- Desktop 248px: `.sidebar-brand` (BrandBlock) → nav with one item: Home (icon `home` + word "Home", `href="/home"`, `aria-current="page"`). Current item: `--color-surface-sky` pill, primary text, 700 weight, 4px primary bar on the inline-start edge (indicator ≥3:1, not colour alone, `navbar`). Spacer. Account card at the bottom: avatar disc (`parent` or `student` icon on `--color-primary-soft`), first name (700, wraps), role label "Parent" / "Student" (small muted), then the Sign out button (`.sidebar-sign-out`, secondary variant, icon `sign-out` + "Sign out"), then the sign-out StatusLine.
- Tablet 96px rail: `.sidebar-brand` and the account name block are hidden (the TopBar carries brand and name). Nav item and Sign out become a 24px icon with the word under it (14px), each target ≥ 64×64. Visible words stay ("Home", "Sign out"); never icon alone.
- Only real pages: Home is the only item. No Learn/Practice/Progress/Settings/Friends/Upgrade.

**TopBar** (phone + tablet; `display: none` ≥ 1280). Slim white bar, bottom border `--color-border`, min-height 64, padding-inline 16/24. Left: BrandBlock (tagline may wrap to two lines at 320). Right: phone — Sign out button (`.topbar-sign-out`, secondary, icon + word, ≥ 44px) and its StatusLine below the bar; tablet — account chip "{first_name} · Parent|Student" (text, not a control), because Sign out is in the rail. No menu button, no search, no bell, no chips.

**FocusShell** (exported as `Shell` from `src/components/shell.tsx`, same props `signedIn`, `busy`, `children`). Skip link → TopBar variant (BrandBlock left; Sign out right when `signedIn`, with its status line) → `<main id="main" aria-busy>` centring one Card ≤ 560. Used by `/role`, `/wait`, `/connect/[token]` and AccountGate loading/error for those pages. No nav (an unlinked student has no Home).

**AuthLayout** (replaces AuthFrame; keep `AuthBrand` export). Header row: BrandBlock (linked) + quiet link to the other auth page ("Create account" on login, "Sign in" on every other mode). `<main>` holds `.auth-split`: `<section class="auth-panel" aria-labelledby="auth-title">` (h1 `#auth-title` tabindex −1, helper, mode content, `#auth-status`) **then** `<aside class="auth-art">` (sky gradient, clouds, sparkles, Lumi, one-line welcome). The form is always before every `<img>` in DOM. Below 960 the aside is placed visually above the card with `order: -1` and shows only a small Lumi peeking over the card's top edge (decorative crop, no text); the welcome line is hidden there. Reordering a non-interactive decorative image does not change tab order (`forms`: never reorder controls).

**HeroCard.** `<section class="hero" aria-labelledby="hero-title">`. Anatomy: sky gradient `linear-gradient(160deg, var(--color-sky-top), var(--color-sky-bottom))`, radius 24, `--shadow-raised`, padding 24 (phone) / 40 (≥768); 2–3 `cloud` SVGs (white, 80% opacity) and 2–3 gold `sparkle` SVGs, absolutely positioned, `aria-hidden`, `pointer-events: none`, never under text; text column: h1 `.hero-greeting` (`--text-hero`, navy) with the name in `<span class="hero-name">` (primary), subline (`--text-lg`, muted); optional action slot; Lumi on the inline-end side in `.hero-lumi` (220px tall ≥ 1280, 160px at 768–1279, 112px < 768; grid `minmax(0,1fr) auto`, so the art never overlaps words). No raster background (Eden).
- Greeting rule (both homes): server/first render "Hello, {first_name}!"; after mount a client effect swaps to "Good morning, {name}!" (05:00–11:59 local), "Good afternoon, {name}!" (12:00–17:59), "Good evening, {name}!" (18:00–04:59). Put the rule in a pure helper `timeGreeting(date: Date)` so Quinn can test it with fixed dates. If `first_name` trims empty, "Hello!" / "Good morning!".

**Card.** White surface, 1px `--color-border`, radius 20, `--shadow-card`, padding 20 (phone) / 24. Header: h2 (`--text-h2`) + optional muted subline. Variants: `card--tip` (accent-soft wash, gold 4px top edge), `card--info` (primary-soft wash). Cards are never interactive as a whole.

**CourseGroup + GuideCard** (guides; Eden "looks clickable, is not").
- Grouping: walk `official_cards` in API order and start a new group whenever `course` differs from the previous card (consecutive runs). Never re-sort, filter or pad (Aria). Any count works, including 0 and odd counts.
- `<ul class="course-groups">` → `<li class="course-group" data-course="geography_6">`: tile with `--course-*-bg` tint, radius 16, no shadow, no border change on hover; circular 44px white badge with the course icon in `--course-*-ink`; h3 `.course-name` = `course_label` of the run's first card; `<ul class="guide-list">` of that run's cards.
- `<li class="guide-card">` per card: white chip, radius pill, 14–16px navy text `quarter_label`, preceded by `<span class="visually-hidden">{course_label}, </span>` so each card reads "Geography 6, Quarter 1". Optional `book` icon (decorative) before the label.
- Not a link, not a button, no `tabindex`, no `role="button"`, `cursor: default`, no hover/active style, no chevron/arrow, no "Open". Never render `id`, `slug`, `kind` or `header` (`id` is the React key only).
- Unknown `course` value: `--course-default-*` tint and `book` icon.
- Course key → icon: `geography_6` → `course-geography`, `history_6` → `course-history`, `language_6` → `course-language`, `mathematics_6` → `course-mathematics`.
- Real data (migration `20261013140000_households_cards.sql` lines 147–176 and `src/domain/guides.ts`): `geography_6` "Geography 6", `history_6` "History 6", `language_6` "Language 6", `mathematics_6` "Mathematics 6"; quarters `1` "Quarter 1", `2` "Quarter 2"; 8 cards per linked student, in that order. Labels come from `course_label` / `quarter_label`, not hard-coded.
- Grid: `repeat(auto-fit, minmax(min(100%, 220px), 1fr))`, gap 16. Compact variant on the parent home (badge 36px, padding 12).

**ChoiceCard** (real radio; `/role` and register step 1). `<fieldset>` with `<legend>` first; inside, two `<label class="choice-card" for="role-parent|role-student">` each containing the native `<input type="radio" name="role">` (visually present as a 24px radio at the card's top inline-start corner, `accent-color: var(--color-primary)`), a Lumi pose (decorative `alt=""`, 112px), title (h3 style, 700) and description (muted, `id` for `aria-describedby`). Card: white, radius 16, 2px `--color-border-strong` border, min-height 176 (phone side-by-side at ≥ 360, stacked below), padding 16. Checked (`:has(input:checked)`): `--color-surface-sky` wash, 2px primary border, `check` icon badge in the corner, title weight unchanged — state shown by border, icon and native radio, not colour alone. Focus: the ring is drawn on the card when its input has `:focus-visible` (`:has(input:focus-visible)`). Native arrow keys move between radios; Space selects; nothing auto-advances or auto-submits (`forms`). Invalid: `aria-invalid` on both radios, error line under the group with `alert` icon.

**Button** (`<button>` for actions, `<a>` with the same classes for navigation). Min-height 48 (≥ 44 everywhere; 48 per `forms`), padding 12/20, radius 16, `--text-label`, icon 20px + 8px gap, full width inside auth/focus cards on phone.
- `button-primary`: primary fill, on-primary text, `--shadow-button`; hover primary-hover; active primary-pressed.
- `button-secondary` (also "Continue with Google" with the `google` mark at its own colours): white, 1.5px border-strong, navy text; hover surface-soft.
- `button-quiet`: no fill or border, primary text, underline on hover/focus; used for "Back", "Use a different email", "Resend…" when secondary to a primary.
- Disabled: `--color-disabled-bg`, text-muted text, no shadow, `cursor: not-allowed`; only while pending or in cooldown (never to block validation, `forms`).
- Pending: label swaps to the existing "…ing…" text; the form gets `aria-busy="true"`.
- Arrow icons: `arrow-right` after "Continue" (register step 1) and "Create account" (landing); `arrow-left` before "Back".

**Field.** Order: `<label for>` (16px 700) → input → helper `p#{id}-help` (14px muted, always visible before any error) → error `p#{id}-error` (14px error colour, `alert` icon first, empty when valid). Input: white, 1.5px border-strong, radius 12, min-height 52, padding-inline 16, `font: inherit; font-size: max(1rem, 1em)`. `aria-describedby` = help id (+ error id when invalid); `aria-invalid="true"` only when invalid. Validate on submit; clear the field's error on input; focus the first invalid field on submit (existing logic). Focus: 2px focus outline, 2px offset, border turns primary. Invalid: border error + the words. Email: `type="email"`, `inputmode="email"`, `autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"`.

**PasswordField.** Field + trailing toggle inside the input box (input padding-inline-end 104). Toggle `<button type="button" aria-controls="{id}" aria-pressed>`: `eye` / `eye-off` icon + visible "Show"/"Hide" + `<span class="visually-hidden"> password</span>` (or " confirmation password" for `#confirm`), so its name/`textContent` stays exactly "Show password" / "Hide password" / "Show confirmation password" / "Hide confirmation password". 44×44 min. Toggling keeps value and focus. Paste always allowed.

**StatusLine.** `<p class="status [is-error|is-success]">` with leading icon when non-empty (`info`, `check`, `alert`). Polite `role="status"` normally; `role="alert"` + programmatic focus (`tabindex="-1"`) only for blocking failures (existing `#auth-status` behaviour). Reserves `min-block-size: 1.5em`. Words carry the meaning; colour and icon are extra.

**Skeleton.** `.skeleton` (aria-hidden) containing `.skeleton-line`, `.skeleton-line.short`, `.skeleton-block` (card-sized) and `.skeleton-circle` (Lumi slot); `--color-skeleton`, radius matches the real element, same box size as the loaded content (no layout jump). Static, no shimmer. Always paired with a visually hidden "Loading" text (existing pattern) and `aria-busy="true"` on `main`.

**EmptyState.** Inside a Card: LumiImage (md, with alt), h2 or h3 title, one or two sentences, optional single action. Centred, max 36ch.

**LumiImage.** Props: `pose` (one of the 13 names in §12), `alt` (required; `""` when decorative), `size` (`peek` 96, `sm` 112, `md` 160, `lg` 220 px tall), `priority` (boolean). Renders one `<img>` whose `src` contains the pose file name, with intrinsic `width`/`height` attributes and `object-fit: contain` (no CLS), `decoding="async"`, `loading="lazy"` unless `priority` (then `loading="eager"` + `fetchpriority="high"`). `priority` only on the landing hero and the home hero. Prefer `next/image`; if the node test loader cannot resolve it, a plain `<img>` with the same attributes is acceptable (Aria owns asset paths). Files: `src/assets/lumi/{pose}.webp` (extension as Lux ships). The 2 MB `lumi-hero.png` and `lumio_mascot.png` are no longer imported (kept on disk as reference).

## 6. Screens

Every page: skip link "Skip to main content" (first focusable, visible on focus) → one `h1` → one `main`. Titles end "— Lumio". Labels in quotes are exact.

### `/` — landing
Purpose: meet Lumio and Lumi; start or return. Primary action: "Create account".
Layout: header row (BrandBlock linked; right: `<nav aria-label="Account">` link "Sign in" → `/login`, secondary button style). HeroCard: eyebrow "A little support. A bright beginning." → h1 "Grade 6 starts with family." → lede "Lumio is a calm study space for a Grade 6 student and their parent." → actions: "Create account" (primary, `arrow-right`, → `/signup`) and "Sign in" (secondary, → `/login`) → Lumi `lumi-hero`, `lg`, `priority`, alt "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books." Then Card "How Lumio works" (h2) with the HowItWorks `<ol>` (three steps, numbered discs: primary-soft fill, navy numeral, gold ring decoration):
1. "Make your own account" — "A parent and a student each sign up, as Parent or Student."
2. "A parent sends a connect email" — "The parent sends one link to the student's Gmail."
3. "The student accepts, then studies" — "Students start studying after they accept a parent's link."
States: context in flight → render the signed-out actions (as today). Signed in → both actions become one primary "Continue to Lumio" (→ `context.next`), header link too. Context failure → stay signed-out (as today). No form, no fields, no feature tiles, no previews.

### Auth pages — login and register (their own section)
Shared: AuthLayout. Sky panel art and welcome line per mode:

| Mode | Panel art (≥ 960) | Peek art (< 960) | Welcome line (≥ 960 only) |
| --- | --- | --- | --- |
| login | `lumi-hero`, alt = landing alt | `lumi-wave`, `alt=""` | "Good to see you again." |
| signup | `lumi-hero`, alt = landing alt | `lumi-wave`, `alt=""` | "Let's set up your Lumio." |
| forgot-password | `lumi-think`, alt | same image, peek size | "It happens to everyone." |
| check-email | `lumi-calm`, alt | same image | "Look out for an email from Lumio." |
| reset-password | `lumi-idea`, alt | same image | "Almost done." |
| confirm-email | `lumi-thumbs-up`, alt | same image | "One quick step." |

Shared states (unchanged logic in `auth-screen` pieces; only markup moves): checking → `role="status"` "Checking your account…" (reset: "Checking your reset link…") over a form-shaped Skeleton, no fields; check failed → `role="alert"` "We couldn’t check your account. Try again." + primary "Try again"; signed-in visit → redirect, never paint a form. All auth error/status sentences from `src/lib/auth-errors.ts` and the current screen stay **verbatim** (they were designed in IRIS_AUTH_RECOVERY and tests assert them). `#auth-status` stays one element after the mode content.

**Login** (`/login`, title "Sign in — Lumio"). h1 "Welcome back"; helper "Sign in to your Lumio account."
Order: "Continue with Google" (secondary + `google` mark; "Opening Google…" while pending) → divider "or" (muted word between two `--color-border` rules) → `<form method="post" noValidate>`: Email (`#email`, autocomplete `username`, enterkeyhint `next`, placeholder "name@example.com") → Password (`#password`, PasswordField, autocomplete `current-password`, enterkeyhint `go`) → right-aligned quiet link "Forgot password?" → `/forgot-password` directly under the password field → primary "Sign in" (pending "Signing in…") → `#auth-status` → line "New to Lumio? Create account" (link → `/signup`).
States: wrong credentials (clear password, keep email, existing sentence); unconfirmed (existing sentence + quiet "Resend confirmation email"); rate-limited (existing sentence + existing static helper "Please wait before requesting another email or trying again."); Google unavailable (button disabled, `#google-help` "Google sign-in isn’t available right now. Use email to continue." + link "Use email instead" `href="#auth-title"`); Google cancelled (existing sentence in status); `?notice=password_updated` → success status "Your password has been updated." with `check` icon. Errors are inline under fields with `alert` icon and words; never red alone.

**Register** (`/signup`, title "Create account — Lumio"). h1 "Create your Lumio account". Two steps in **component state** (`step: 1 | 2`); URL, history and the navigation whitelist do not change. One `<form>` holds both steps; the inactive step has the `hidden` attribute (out of tab order and a11y tree). Nothing is posted until step 2 submits. Above the active step: `<p id="signup-step-label" class="step-label">` "Step 1 of 2" / "Step 2 of 2" (small, muted, plus two 8px dots; the current dot primary-filled, the other outlined — decorative, `aria-hidden`).
- **Step 1 — role.** `<fieldset aria-describedby="role-help">` → `<legend><h2 id="signup-step-1-title" tabindex="-1">Who is this account for?</h2></legend>` → helper `#role-help` "Choose carefully. Your saved role can’t be changed later." → two ChoiceCards: `#role-parent` "I'm a parent" / `#parent-desc` "I'll connect my child's account." (`lumi-welcome`) and `#role-student` "I'm a student" / `#student-desc` "I'm the Grade 6 student." (`lumi-wand`). No default selection; values `parent`, `student`; never Teacher. → `#role-error` → primary submit "Continue" (`arrow-right`). Submit (button or Enter) with no role: error "Choose Parent or Student.", `aria-invalid` on both radios, focus `#role-parent`, stay. With a role: step 2, focus `#signup-step-2-title`. Footer "Already joined? Sign in".
- **Step 2 — details.** Quiet "Back" (`arrow-left`, `type="button"`) → `<h2 id="signup-step-2-title" tabindex="-1">Your details</h2>` → muted line "Signing up as a Parent." / "…a Student." → "Continue with Google" (secondary) with `#google-role-note` "With Google, you’ll choose Parent or Student again on the next screen." (`aria-describedby` on the button; true because `/api/auth/google` takes no role) → "or" → First name `#first_name` (autocomplete `given-name`, `autocapitalize="words"`, enterkeyhint `next`, helper `#first_name-help` "Up to 40 characters. Letters, spaces, hyphens, or apostrophes.") → Email `#email` (autocomplete `username`, enterkeyhint `next`) → Password `#password` (autocomplete `new-password`, enterkeyhint `next`, helper `#password-help` "Choose a password you can remember.") → Confirm password `#confirm` (autocomplete `new-password`, enterkeyhint `done`) → primary "Create account" (pending "Creating account…") → `#auth-status` → footer "Already joined? Sign in".
- Back keeps every typed value and the chosen role, clears no errors except step 2's, and focuses `#signup-step-1-title`. Passwords stay only in component memory.
- Step 2 submit runs today's validation and request unchanged: `POST /api/auth/sign-up` with `{ email, password, first_name, role }` (role from step 1). A server `VALIDATION` error on `role` returns to step 1, shows it on `#role-error` and focuses `#role-parent`; field errors on step 2 fields focus that field.
- Motion: the incoming step fades in (`.fade-in`, opt-in only); with reduced motion it simply appears.

**Forgot** (`/forgot-password`, title "Forgot password — Lumio"). h1 "Forgot your password?"; helper "No worries. Enter your email and we’ll send you a reset link." → Email (`autocomplete="email"`, enterkeyhint `send`) → primary "Send reset link" (pending "Sending link…") → `#auth-status` → quiet link "Back to sign in".

**Check email** (`/check-email`, title "Check your email — Lumio"). h1 "Check your email".
- With send context: body (verbatim) — confirmation: "If confirmation is needed for this address, you’ll receive an email with a link to continue." / recovery: "If an account uses this email, you’ll receive a link to reset its password." → the address in an info panel with `mail` icon (`.recovery-address`, wraps) → "Check your spam folder too." → form with the resend button "Resend confirmation email" / "Send another reset link" (pending "Sending email…") → **calm countdown**: while the existing 60-second cooldown (or a server `retryAfter`) runs, the button is disabled and `p#resend-timer` (muted, `aria-live="off"`, referenced by the button's `aria-describedby`) reads "You can send another email in {n} seconds." ("1 second" singular), updating once per second as plain text — no ring, bar, or ticking announcement. At 0 the timer line is removed and `#auth-status` announces the existing "You can request another email now." → resend success: existing "If eligible, another email is on its way." → quiet links "Use a different email" and "Back to sign in".
- Without context (refresh/direct): h2 "Need an email link?" + links "Create account", "Request a reset link", "Back to sign in". No form.

**Reset** (`/reset-password`, title "Choose a new password — Lumio"). h1 "Choose a new password"; helper "Pick a new password you’ll remember." → New password `#password` + Confirm new password `#confirm` (both `new-password`) → primary "Save new password" (pending "Saving password…"). Invalid/expired/used: verbatim "This reset link can’t be used. Request a new link." + primary link "Request a new link" → `/forgot-password` + quiet "Back to sign in"; no save control.

**Confirm** (`/confirm-email`, title "Confirm your email — Lumio"). h1 "Confirm your email"; helper "Press the button to finish confirming your email." → primary "Confirm email" (pending "Confirming your email…"); never auto-verifies on mount. Invalid: verbatim "This confirmation link can’t be used. Request another email." + "Request a new link" (→ `/signup`) + resend mini-form (Email + "Resend confirmation email") + "Back to sign in".

### `/role` (title "Choose your role — Lumio")
FocusShell (signed in). Card: h1 "Finish setting up your account." → (when a role is already saved) "Your saved role: {Parent|Student}. It can’t be changed." → `<fieldset>` legend (h2 style) "Who is this account for?" → `#role-help` "You choose once. Lumio can’t change this later." → ChoiceCards `#role-parent` (title "Parent", `#parent-desc` "I'll connect my child's account.", `lumi-welcome`) and `#role-student` (title "Student", `#student-desc` "I'm the Grade 6 student.", `lumi-wand`); disabled when a role is saved → `#role-error` → First name `#first-name` (helper `#name-help` "Up to 40 characters. Letters, spaces, hyphens, or apostrophes.", error `#name-error`) → `#role-status` → primary "Save and continue".
States: loading → FocusShell + Skeleton (title line, two choice-card blocks, a field block); every existing error sentence verbatim; locked (saved, redirect failed) → status + "Check again". Request body unchanged `{ first_name, role }`.

### `/wait` (title "Waiting for a parent — Lumio")
FocusShell (signed in; wordmark not a link; no Home). Card, centred: Lumi `lumi-think` (`md`, alt "Lumi the owl thinking, with a wing on his chin.") → h1 "Waiting for a parent" → body (verbatim) "You can use Lumio after a parent connects you. Until then, this is the only page you can open." → info panel h2 "What happens next" + `<ol>`: "Ask your parent to send a connect email to your Gmail." / "Open that email and press Accept this link." / "Come back here and press Check again." → primary "Check again" → StatusLine: "Still waiting for a parent." (info icon, polite, not an error) or "We could not check your account. Check again." (alert icon).
States: loading/redirecting → FocusShell + Skeleton (circle + two lines); never paints the dashboard. Calls stay `GET /api/home` as today.

### Student `/home` (linked student; title "Home — Lumio")
Data: AccountGate (`GET /api/me`) as today, then `GET /api/home`; render guides from `children[0].official_cards` only when `role === "student"`, `needs_parent === false`, `children.length === 1`; any other student response follows today's gate to `/wait` (Aria). `homeRedirect` unchanged. Show only `first_name` and the cards' `course_label`/`quarter_label`.
AppShell, account card role "Student".
- **Main:** HeroCard — h1 `.hero-greeting` per the greeting rule (name from `first_name`); subline (Lumi's voice, verbatim) "Hi, I'm Lumi. Ready to discover something new?"; Lumi `lumi-wave` in `.hero-lumi`, `priority`, alt (verbatim) "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello."; no CTA.
- **"Your guides"** section (`aria-labelledby="guides-title"`, h2 "Your guides"): note "These are your guides for this school year. You can’t open them yet. Lumi is getting them ready." + muted line "Inside each guide: Flashcards, Concepts, Step-by-Step Solver, Tutor, Cheat Sheet and Practice Sets." → CourseGroup grid. 0 cards → EmptyState (`lumi-calm`, alt "Lumi the owl standing calmly.") h3 "No guides here yet" / "Your guides will show up here when they’re ready."
- **Rail** (after main in DOM): Card "Your family" (h2) — `check` badge on success-soft + "You’re connected to a parent." + muted "Your parent can see your guides too." (no parent name: neither `/api/me` nor `/api/home` returns one). Card `card--tip` "Lumi’s tip" (h2; `lumi-idea` `sm`, `alt=""`) with a `<ul>`: "Study a little at a time, then take a short break." / "Read each question twice before you answer." / "Mistakes help you learn. Take a breath and try again."
States: loading → AppShell skeleton (hero block with circle, 4 tile blocks, 2 rail blocks); error (either read) → Card with alert StatusLine "We could not open your home. Try again." + primary "Try again" (focused; repeats both reads); sign-out failure → "Sign-out did not finish. Try again." in the sign-out StatusLine; signing out → Sign out disabled. No success toast.

### Parent `/home` (title "Home — Lumio")
Data: `GET /api/home` as today; children are `HomeChild { id, first_name, official_cards }` in API order; `id` is the React key only; email never shown. AppShell, account card role "Parent".
- **Hero:** h1 greeting rule with `first_name`; subline — no child: "Let’s connect your child’s account." / with children: "Here’s your family in Lumio."; Lumi `lumi-welcome` (`priority`, alt "Lumi the owl with wings open in welcome."). No child only: action link "Connect your child" (primary, `arrow-right`) `href="#invite-title"` (target h2 has `tabindex="-1"`, so focus lands on it).
- **Children** (main): when `children.length > 0`, section h2 "Your children" → `<ul class="linked-children">` → per child `<li class="child-card">` Card: header row with avatar disc (`student` icon), `h3.child-name` {first_name} (only words in it), status tag "Connected" (`check` icon, success text on success-soft) → muted label "Guides" → compact CourseGroup grid of that child's cards; 0 cards → muted "No guides are listed for {first_name} yet." Same-name children stay separate items. Nothing in a child card is a link or control.
- **Empty** (no children): EmptyState Card (`lumi-hello`, alt "Lumi the owl with wings open, saying hello.") h2 "No child is linked yet." / "Send a connect email below. When your child accepts it, they’ll show up here with their guides."
- **Invite card** (main, after children/empty): `<section class="card" aria-labelledby="invite-title">` h2 `#invite-title` "Connect a child" → intro "We’ll email your child one link. They sign in or create a student account, then accept it." → `<form method="post" noValidate aria-labelledby="invite-title">` Field `#child-gmail` label "Child’s Gmail", `type="email"`, autocomplete `username`, placeholder "name@gmail.com", helper `#child-gmail-help` "We send one link to that Gmail. It lasts 7 days. Your child can start studying after they accept it.", error `#child-gmail-error` → primary "Send connect email" (`mail` icon; pending "Sending…") → `.status` StatusLine inside the form (success: "Connect email sent to {invited_email}." with `check`). All error sentences verbatim (blank, non-Gmail, ROLE_FORBIDDEN, RATE_LIMITED, EMAIL_FAILED, EMAIL_NOT_CONFIGURED, other). No token, URL, id or expiry shown; no account-existence wording. A send never adds a child.
- **Rail:** Card "How Lumio works" (h2; `lumi-star` `sm`, `alt=""`) with `<ol>`: "Send a connect email" — "Enter your child’s Gmail. The link lasts 7 days." / "Your child accepts" — "They sign in or create a student account, then accept the link." / "Learn together" — "Their guides show up on your home and on theirs."
States: loading → AppShell skeleton; error → "We could not open your home. Try again." + "Try again" (no false empty list, no form); invite 401 → skeleton, then `/login` (no private copy left); role mismatch → existing redirects before painting.

### `/connect/[token]` (title "Connect — Lumio" in every state; never the token)
FocusShell (`signedIn` when `/api/me` returned a profile). Card: Lumi by state (table) → h1 "Connect to a parent" → state content. When the preview loaded, the facts sit in an info panel with `mail` icon: "{parent_first_name} sent this link to {invited_email}." and (verbatim from `connectExpiry`) "This link lasts until {local date and time}. Links last 7 days." / "This link has an end time, and the date could not be shown."

| State | Lumi (alt in §12) | Content and controls |
| --- | --- | --- |
| loading / redirecting | Skeleton circle | Skeleton 3 lines, `main aria-busy`, no form |
| GET 404 | `lumi-question` | "This connect link could not be found. Ask your parent to send a new one." No form |
| GET 410 | `lumi-calm` | "This link has expired. It does not connect anyone. Ask your parent to send a new one." No form |
| GET error | `lumi-think` | alert "This page could not be loaded. Try again." + primary "Try again" (focused; repeats GET) |
| signed out, `sent` | `lumi-hello` | "Sign in with the invited email to see this invitation. Nothing connects until you accept it." + primary link "Sign in" + secondary link "Create account" + status (pending "Opening sign-in…") |
| signed out, `accepted` | `lumi-hello` | verbatim "This link was already used. Sign in with that Gmail if it is yours. This page does not connect anyone new." + "Sign in" only |
| signed out, `ignored` | `lumi-hello` | verbatim "This link does not connect anyone. The student stays with the first parent." + "Sign in" only |
| signed-in student, ready | `lumi-hello` | primary "Accept this link" (`check`; pending "Accepting…") + status |
| accepted | `lumi-cheer` | status "You are connected. You can leave the waiting page." then `/wait`; nav failure: "You are connected, but the waiting page did not open. Try again." + "Try again" |
| ignored | `lumi-calm` | "You stay with the first parent. This link does not connect you." + secondary "Go to home" |
| EMAIL_MISMATCH | `lumi-question` | verbatim mismatch sentence + quiet link "Sign out and switch account" |
| parent (known or ROLE_NOT_STUDENT) | `lumi-calm` | "A parent account cannot accept this link. You are not linked." + "Sign out and switch account" + "Go to home"; no accept button |
| ALREADY_USED / LINK_EXPIRED / NOT_FOUND on accept | `lumi-calm` | the verbatim sentence; accept removed |
| other accept error | `lumi-think` | "This link could not be accepted. Try again." accept stays |
| 401 / ROLE_REQUIRED | — | existing intent save + redirect; preview cleared first |

Requests, bodies, intent handling and redirects are unchanged.

### `/resting` (static; title "Taking a short rest — Lumio")
Server component, no client hooks, no auth or data call, must stay ○ in `next build`. Plain header with BrandBlock (wordmark not a link, no Sign out) → `<main id="main">` Card centred: `lumi-sleep` (`md`, alt "Lumi the owl taking a nap.") → h1 "Taking a short rest" → "Lumio is taking a short rest. Please try again in a moment." → primary link "Try again" → `/home`.

### Not found (`src/app/not-found.tsx`; title "Page not found — Lumio")
Static, same frame as `/resting`. `lumi-question` (alt "Lumi the owl looking puzzled, with a question mark.") → h1 "We can’t find that page" → "The link may be old or mistyped." → primary link "Go to home" → `/home` (middleware sends signed-out visitors on to sign-in). No status code, path or stack shown.

### Error (`src/app/error.tsx`, `"use client"`; title set in an effect "Something went wrong — Lumio")
Same frame. `lumi-calm` (alt "Lumi the owl standing calmly.") → h1 (`tabindex="-1"`, focused on mount) "Something went wrong" → "This page didn’t load properly. Please try again." → primary button "Try again" (calls `reset()`) + secondary link "Go to home" → `/home`. Never renders `error.message`, `digest` or a stack.

## 7. Copy changes (old → new)

Kept verbatim (owner list + tested): "Sign in", "Continue with Google", "Show password" / "Hide password", "Accept this link", "Accepting…", "Try again", "Go to home", "Check again", "Send connect email", "Sending…", "Sign out", "Lumio", "Learn. Grow. Level Up.", every auth/invite/connect/role/wait error and status sentence not listed below.

| Where | Old | New | Why |
| --- | --- | --- | --- |
| Student hero h1 | "Hello, {name}." | "Hello, {name}!" then time-of-day after mount | Owner hero rule |
| Parent heading | h1 "Home" + p "Hello, {name}." | hero h1 greeting rule | One h1, hero look |
| Parent list heading | "Linked children" | "Your children" | Warmer, same meaning |
| Student regions | "Continue learning", "Your next guide is not on this page yet.", "A guide is one course and one quarter.", "Today’s study", "No study time yet.", "Study sections" chips, "Guides" | Removed; replaced by "Your guides" (real cards), "Your family", "Lumi’s tip"; the six section names move into "Inside each guide: …" | Owner's student-home layout; Eden real cards |
| Child's Gmail helper | "…Your child still cannot study until they accept." | "…Your child can start studying after they accept it." | Same meaning, positive |
| Role helper (/role) | "You choose once. Lumio cannot change this later." | "You choose once. Lumio can’t change this later." | Contraction only |
| Role descriptions | "I will connect my child’s account." / "I am the Grade 6 student." | "I'll connect my child's account." / "I'm the Grade 6 student." | Warmer |
| Signup helper | "Choose who this account is for." | Step label + step headings | Two-step register |
| Signup role helper | "Your saved role cannot be changed." | "Choose carefully. Your saved role can’t be changed later." | Same meaning, kinder |
| Forgot helper | "Enter your email to request a reset link." | "No worries. Enter your email and we’ll send you a reset link." | Calmer |
| Landing lede | "Lumio is a space for Grade 6 students and their parents." + two paragraphs | One lede + "How Lumio works" steps (same facts) | Hero look |
| Connect intro | "…to review this invitation. Connecting still requires your acceptance." | "…to see this invitation. Nothing connects until you accept it." | Plainer, same meaning |
| Connect GET 404 | "This connect link could not be found." | + " Ask your parent to send a new one." | Says what to do next (Eden) |
| New lines | — | check-email countdown, Google-role note, `/wait` "What happens next", hero sublines, empty states, tips, not-found, error | New states |

## 8. Accessibility checklist (WCAG 2.2 AA; Luna and Quinn verify)

- [ ] One `h1`, one `main#main`, a working skip link, a unique `<title>` on every page.
- [ ] Every text pair in §1 ≥ 4.5:1; control borders, focus ring, current-nav bar and icons ≥ 3:1; gold never text or a state.
- [ ] Focus: 2px solid `--color-focus`, 2px offset, on every control (Google, toggles, choice cards via `:has(:focus-visible)`, nav, Sign out, links); never removed; not hidden by the sticky sidebar.
- [ ] Keyboard alone completes every flow in visual order; no positive tabindex; Enter submits the current form only; radios use native arrows; no focus trap; no autofocus that opens a phone keyboard (only the "Try again" retry focus that exists today).
- [ ] Targets ≥ 44×44 (buttons and inputs 48/52), ≥ 8px apart; tablet rail items ≥ 64×64.
- [ ] Every input has a visible label; helper before error; `aria-describedby` and `aria-invalid` wired; errors in words with an icon; focus to first invalid field on submit; no validation on every keystroke.
- [ ] Status: polite `role="status"` for progress/success; `role="alert"` only for blocking failures; countdown never announced each second.
- [ ] Register: inactive step `hidden`; focus moves to the step `h2` on Continue/Back; "Step x of 2" in text; Back keeps values.
- [ ] Guide cards: not links, buttons or focus stops; each reads "{course}, {quarter}"; no pointer or hover cue.
- [ ] Lumi: one meaningful image per page with alt from §12; peeks, choice-card poses, tip/how-it-works poses `alt=""`; clouds/sparkles/dots `aria-hidden`; no text baked into art.
- [ ] Current page shown by `aria-current="page"` plus bar and weight, not colour alone.
- [ ] Reduced motion: no movement, scale or fade; nothing loops or flashes; no sound.
- [ ] No horizontal scroll at 320–1440 and at 200% zoom; text reflows with OS text size (rem everywhere).
- [ ] Images have width/height (CLS < 0.1); hero is the only `priority` image; no image > 200 KB.
- [ ] Lighthouse a11y 100 on `/`, `/login`, `/signup` (mobile).
- [ ] Rendered text has none of: streak, gem, XP, level, leaderboard, heart, friends, upgrade, premium, unlock, reward, badge, points, rank — except the exact tagline (Eden open decision default). Note: this spec uses "badge" only as a CSS/component word, never as rendered text.

## 9. Test-facing contract (Quinn)

Kept ids: `email`, `password`, `confirm`, `first_name`, `role-parent`, `role-student`, `role-help`, `role-error`, `auth-status`, `auth-title`, `google-help`, `child-gmail`, `child-gmail-help`, `child-gmail-error`, `first-name` (on `/role` only), `parent-desc`, `student-desc`, `name-help`, `name-error`, `role-status`, `{field}-error`.
New ids: `main` (every page), `signup-step-label`, `signup-step-1-title`, `signup-step-2-title`, `google-role-note`, `first_name-help`, `password-help`, `resend-timer`, `invite-title`, `hero-title` (alias of the hero h1), `guides-title`.

| Assertion | Selector / role / text |
| --- | --- |
| Brand | first `.wordmark` textContent "Lumio"; first `.tagline` normalised "Learn. Grow. Level Up."; CSS never sets `display:none` on a `.tagline`/`.wordmark` selector; the `@media (min-width: 1280px)` block styles `.wordmark` |
| Reduced-motion guard | first rule in first `@media (prefers-reduced-motion: reduce)` contains `opacity: 1` and `transition: none` |
| Auth DOM order | `form` precedes every `img` at 320/390/1280 on login and signup; first `img` src contains `lumi-hero`, alt "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books." |
| Password toggle | button textContent "Show password"/"Hide password", `aria-controls="password"`, `aria-pressed` |
| Register | step 1: radios `[parent, student]`, none checked, no `#email`/`#password` visible (step 2 `hidden`); Continue with no role → focus `#role-parent`, `#role-error` "Choose Parent or Student.", 0 POSTs; Continue with role → focus `#signup-step-2-title`; Back → values kept, focus `#signup-step-1-title`; only step 2 POSTs `/api/auth/sign-up` with `{email,password,first_name,role}` |
| Countdown | `#resend-timer` text matches `/You can send another email in \d+ seconds?\./` while cooldown; absent after |
| Landing | `a[href="/login"]`, `a[href="/signup"]`, no `form`, first `img` src contains `lumi-hero`, text "Grade 6 starts with family" |
| AppShell | `.topbar` display `flex` at 320/768 and `none` at 1280; `.sidebar` `none` at 320, visible at 768/1280; `.sidebar-sign-out` visible at 768/1280, `.topbar-sign-out` visible only < 768; nav link text "Home", `href="/home"`, `aria-current="page"`; no element with text-free icon-only control |
| No bottom bar | no `nav` after `main`; no `.bottom-bar`/`.student-bottom` element; exactly one `nav[aria-label="Main"]` on `/home` |
| Hero | `.hero-greeting` is the only `h1`; text matches `/^(Hello|Good (morning|afternoon|evening)), {name}!$/`; `.hero-lumi img` src contains `lumi-wave` (student) / `lumi-welcome` (parent); computed `.hero-lumi` height 220px at 1280, 112px at 320; `.hero-greeting` font-size 44px at 1280, 32px at 320; `timeGreeting` unit cases 04:59→evening, 05:00→morning, 11:59→morning, 12:00→afternoon, 17:59→afternoon, 18:00→evening |
| Guides | student: `.guide-card` count = cards returned (8 in fixtures), texts `"{course_label}, {quarter_label}"` in API order; `.course-group` count = consecutive course runs (4); no `a`, `button`, `[tabindex]` or `[role=link]` inside `.course-groups`; 0 cards → "No guides here yet"; `[role=progressbar]` absent |
| Parent list | `.linked-children .child-name` texts equal returned first names in order (incl. duplicates); no `a`/`button` in `.linked-children`; empty → no `.linked-children`, text "No child is linked yet." |
| Invite | first `form` on parent home is the invite form; `form .status` exact sentences as today |
| Connect | `.skeleton` + `main[aria-busy=true]` while loading; `document.title` "Connect — Lumio" always; text includes existing sentences |
| Pages | not-found: h1 "We can’t find that page", `a[href="/home"]` "Go to home"; error: buttons "Try again", link "Go to home", no `error.message` text; `/resting` static |

Tests that must change because Iris changed markup or words (no assertion may be loosened beyond this): `m1-shell` — remove `assertNoMascot` on `/role` and parent home; `lumi-hero.png`/`lumio_mascot.png` regexes → pose file names; computed sizes per the table above; `.student-top/.student-bottom/.rail-sign-out/.lumi-frame/.student-hello` → `.topbar/.sidebar/.sidebar-sign-out/.hero-lumi/.hero-greeting`; "all anchors are Home" → "all anchors are the skip link or Home"; removed student copy (§7); student home now calls `/api/home`; parent empty `ul, ol, table` null → `.linked-children` null. `m2-frontend` — `.linked-children li` text → `.linked-children .child-name`; `getHome` shape per Aria; "student reads only me" → reads me then home. `auth-recovery-ui` — signup tests go through step 1 first; img regex → `lumi-hero`.

## 10. Build list for Jules

- Tokens + CSS — `globals.css` rebuilt as `@layer reset, tokens, base, components, utilities`, tokens first; one file (test loads it). Done when no raw hex/rgb sits outside `@layer tokens`, no cream remains, every selector is used.
- Fonts — keep Baloo 2 700, Nunito 400/500/700; delete Fraunces, Atkinson, `src/lib/fonts.ts`; remove the hide-until-fonts-ready fade. Done when only loaded files remain.
- Shell pieces — BrandBlock, AppShell (TopBar, Sidebar, rail slot), FocusShell as `Shell`, AuthLayout, HeroCard, Card, CourseGroup/GuideCard, ChoiceCard, Button classes, Field, PasswordField, StatusLine, Skeleton, EmptyState, LumiImage, `timeGreeting`. Done when each matches §5 states and ARIA.
- Auth split — `auth-screen.tsx` split into per-mode pieces with the same props and logic; every auth component file ≤ 150 lines; register two steps per §6. Done when the auth-recovery tests (updated per §9) pass unchanged in logic.
- Screens — landing, 6 auth modes, `/role`, `/wait`, student and parent `/home`, `/connect/[token]`, `/resting`, `not-found.tsx`, `error.tsx` per §6. Done when each state in §6 renders at 320 and 1440 with no horizontal scroll.
- Data — student home reads `children[0].official_cards` per Aria; parent home renders `HomeChild`; nothing renders ids, emails, slugs, headers or kind.
- Not built: bottom tab bar, hero CTA on the student home, Continue card, progress UI, guide links, dark mode.

## 11. Forks, conflicts and notes (none blocking)

1. **Countdown vs Eden "no new timer".** The owner asked for a calm 60-second resend countdown on check-email; Eden's DoD says no screen shows a timer not there today. I followed the owner: it shows the cooldown the code already enforces (60s, or the server's `retryAfter`), as text only, on check-email only. Fallback if the owner prefers Eden's line: drop `#resend-timer` and keep the existing static helper.
2. **Google on register cannot carry the step-1 role.** `/api/auth/google` takes no role and the API is frozen, so a Google sign-up meets `/role` again. Copy `#google-role-note` says so. A future Aria change could pass role intent.
3. **"Your family" cannot name the parent.** No parent name exists in `/api/me` or `/api/home` for a student; the card says "You're connected to a parent." The unlinked branch never renders (gate sends to `/wait`).
4. **Baloo 2 500/600** from the plan are not added (no new font downloads; 700 covers all display text).
5. **M1 display-text fade retired** for LCP; no test asserts it beyond removing the class.
6. **Tagline "Level Up."** stays exact on every page per Eden's default; it is the only exemption from the word check.

## 12. Lumi poses and icons by screen (Lux names only)

| Pose | Used on | Alt when meaningful |
| --- | --- | --- |
| `lumi-hero` | Landing hero (priority); login and signup sky panel | "Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books." |
| `lumi-wave` | Student home hero (priority); login/signup phone peek (`alt=""`) | "Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello." |
| `lumi-wand` | Student choice card (signup step 1, `/role`), `alt=""` | — |
| `lumi-think` | `/wait`; forgot-password; connect GET error and other accept error | "Lumi the owl thinking, with a wing on his chin." |
| `lumi-cheer` | Connect accepted | "Lumi the owl cheering." |
| `lumi-thumbs-up` | Confirm email | "Lumi the owl giving a thumbs up." |
| `lumi-question` | Not-found; connect GET 404; email mismatch | "Lumi the owl looking puzzled, with a question mark." |
| `lumi-welcome` | Parent home hero (priority); Parent choice card (`alt=""`) | "Lumi the owl with wings open in welcome." |
| `lumi-calm` | Check-email; error page; connect 410, ignored, parent, used/expired/not-found on accept; student 0-guides empty state | "Lumi the owl standing calmly." |
| `lumi-star` | Parent "How Lumio works" card, `alt=""` | — |
| `lumi-idea` | Student "Lumi’s tip" card (`alt=""`); reset-password | "Lumi the owl with a bright idea." |
| `lumi-sleep` | `/resting` | "Lumi the owl taking a nap." |
| `lumi-hello` | Connect (ready, signed-out states, student ready); parent no-child empty state | "Lumi the owl with wings open, saying hello." |

Icons: `home` (nav), `sign-out` (Sign out), `parent` (the user/parent icon: parent avatar), `student` (student avatar, child card), `mail` (invite button, check-email address, connect facts), `lock` (password field leading icon, optional), `eye` / `eye-off` (PasswordField), `google` (Google buttons), `arrow-right` (Continue, Create account, Connect your child), `arrow-left` (Back), `check` (success status, selected choice, Connected tag, Accept this link, Your family), `alert` (errors), `info` (info status, connect facts panel, "What happens next"), `book` (guide chips, unknown course), `sparkle` (brand, hero, panel decoration), `cloud` (hero and panel decoration), `course-geography`, `course-history`, `course-language`, `course-mathematics` (course badges).

## 13. Sources

- modern-web-guidance (retrieved 2026-11-26): `navbar` (one nav tree; `aria-current="page"` with a ≥3:1 indicator, not colour alone), `forms` (label→input→helper order, `autocomplete`/`inputmode`/`enterkeyhint`, ≥48px targets, `#767676`-or-darker borders, validate on submit not per keystroke, don't disable submit to block validation, multi-step: `hidden` inactive steps and focus the step heading, never visually reorder controls), `motion` (opt-in motion in `no-preference`, no global 0.01ms override, keep colour transitions), `visually-stable-font-fallbacks` (`font-size-adjust: from-font`).
- ui-ux-pro-max: Claymorphism-lite, 16–24px radii, soft double shadows, 200ms ease-out press, no emoji icons, 150–300ms hover, 375/768/1024/1440 checks.
- Data: `src/domain/types.ts`, `src/domain/guides.ts`, `src/data/cards.ts`, `src/services/home.ts`, `supabase/migrations/20261013140000_households_cards.sql:147-176`, `docs/ARIA_UI_REFRESH_AMENDMENT_v1.md`.
