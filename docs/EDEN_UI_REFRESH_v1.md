EDEN RELEASE — UI Refresh v1
Project: Lumio
Input: Rex v1.3, Alex v1.0, Aria v1.0, Iris M1, Login, Student Home and M2 specs, owner decisions of 25 November 2026
Branch: `feat/lumio-ui-refresh` (cut from `06f1c54`, auth HOLD cleared, Quinn 267/267 PASS)
Slot: after M2, before M3. Not a milestone on Alex's list. It adds no feature.

## Outcome

One Grade 6 student and their parent open any Lumio screen on a phone or a desktop and see one calm, sky-blue, Lumi-led look. Every action works exactly as it does today, and M3 builds on this look without redoing it.

## In this release

Fixed scope. The owner decided these. Do not reopen them.

- **Look only, from the Lingora references.** Desktop and tablet: sidebar, main column, optional right rail. Phone: one column, hero card with Lumi, rounded white cards. The pattern is copied. The Lingora name, logo, mascot, art and copy are not. Done when: the in-scope screens follow that layout at both sizes.
- **Palette and tokens.** Light sky page, white cards, royal-blue primary taken from Lumi's hat, navy `#172B4D` text, gold `#EFB94E` as accent only. Cream is retired. Light mode only. Every colour is a named token, so dark mode can be added later without editing components. Done when: no raw colour value exists outside the token block, and no cream surface remains.
- **Lumi stays exactly as drawn.** Lux crops the existing 12 poses from the sheet into transparent, compressed files and compresses `lumi-hero`. No redraw, no new pose, no second character. The original files are kept as reference and not deleted. Done when: each crop matches the sheet pixel for pixel apart from its background and size.
- **Hero background.** A CSS sky gradient with cloud and sparkle SVGs. No generated scene. Done when: the hero shows no raster background image.
- **Every existing screen restyled:** landing; the 6 auth modes (`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/confirm-email`, `/check-email`); `/role`; `/wait`; student `/home`; parent `/home`; `/connect/[token]`; `/resting`. Done when: each one uses the new tokens and layout, with all its current states (loading, error, cooldown, expired or invalid link, mismatch, unsupported).
- **New not-found and error pages.** Done when: an unknown URL shows a friendly not-found page with a way Home, and a render error shows an error page with Try again and Home. Neither shows a stack, an error code or raw error text.
- **Login and register fully redesigned.** Register becomes two short steps. Step 1: picture cards for Student and Parent, never Teacher. Step 2: Google, or first name, email and password. Done when: the role from step 1 reaches the same API as today, Back keeps what was typed, and `/connect/[token]` keeps its current account rules.
- **Real guide cards.** The 8 official cards (course and quarter) from `/api/home`, on the student home and per child on the parent home, in the API's order. The client keeps the `official_cards` it already receives. Done when: 8 labelled cards show, and none is a link, button or focus stop until M3.
- **Navigation shows only real pages.** Desktop: sidebar with brand, Home and an account card (first name, role, the existing sign-out). Phone: a slim top bar. Done when: every nav item opens a real page, and no bottom tab bar renders, because Home is the only real signed-in page.
- **Softer copy.** Iris may reword for warmth while keeping each message's meaning, including what went wrong and what to do next.
- **Cleanup the redesign touches.** Remove dead CSS, `src/lib/fonts.ts` and the Fraunces and Atkinson font and licence files. Split `auth-screen.tsx`. Done when: every selector in the stylesheet is used, every font file left is loaded, and no auth component file is over 150 lines.

## Not in this release

- Streaks, gems, XP, levels, leaderboards, hearts, Friends, Upgrade, a paywall, or any mastery reward (AGENTS.md: rewards stay unspecified).
- Progress rings, bars, meters or percentages, until M3 and M4 bring real data.
- Search bar, notification bell, language chips, the quiz or translate screen, a "Level" chip, the unlock-reward card. No real feature sits behind them.
- Opening a guide, the tracker, the report card, advice and upload (M3 to M6).
- A bottom tab bar, until there are 2 or more real signed-in pages.
- Dark mode. The tokens are ready, nothing ships.
- Any change to the API, the database, the auth rules, middleware routing or the gate. The only client change is keeping data it already receives.
- New mascot art, new poses, or a generated hero scene.
- Edits to `booklet-app`, `grade6-reviewers` or the public HTML guides.
- A push or deploy. Dep waits for **ship it**.

## Definition of done / how we know it worked

Behaviour
- [ ] `git diff 06f1c54 --stat` shows no change under `src/app/api`, `src/services`, `src/data`, `src/domain`, `src/middleware.ts`, `src/app/auth` or `supabase/`. Under `src/lib`, only the client that keeps `official_cards` and the deleted `fonts.ts` change.
- [ ] Sign-up, sign-in, Google, forgot and reset password, confirm email, resend cooldowns, role choice, the wait gate, connect accept, mismatch and sign-out send the same requests and reach the same pages as on `06f1c54`.
- [ ] `/resting` stays static: no auth or data call, and `next build` lists it as static (○).

Tests and build
- [ ] `npm test` passes with at least 267 tests and 0 failures. No test is deleted, skipped or weakened. A test may change a selector or copy only where Iris changed the markup or the words.
- [ ] New tests cover: the two register steps and the role reaching the request; the 8 cards on both homes with no link role; not-found and error pages; no bottom tab bar.
- [ ] Line and branch coverage drop by no more than 0.2 points against `06f1c54`.
- [ ] `npx tsc --noEmit` (app and test config), `npx next build` and `npm audit --omit=dev` are all clean.

Layout
- [ ] At widths 320, 375, 414, 768, 1024, 1280 and 1440, every in-scope screen has no horizontal scroll (`scrollWidth` is not greater than `clientWidth`). Nothing is cut off or overlaps.
- [ ] The desktop sidebar and the phone top bar switch at the breakpoint Iris sets. The layout holds at 200% browser zoom.

Accessibility (WCAG 2.2 AA)
- [ ] Text contrast is at least 4.5:1, and 3:1 for large text, icons and control borders. Gold is never body text and never the only sign of a state.
- [ ] Every control works by keyboard alone, in a logical order, with a visible focus ring. Each page has one `h1`, a `main` landmark and a skip link.
- [ ] Every field has a visible label. Errors are announced, tied to their field and written in words, not colour alone.
- [ ] Touch targets are at least 44 by 44 px. Role cards are real radio choices.
- [ ] Lumi images have useful alt text, or empty alt when they only decorate. Clouds and sparkles are hidden from screen readers.
- [ ] With reduced motion on, nothing animates. No animation loops forever, flashes or plays sound.
- [ ] Lighthouse accessibility score is 100 on landing, `/login` and `/signup` (mobile).

Assets and performance
- [ ] No shipped image is over 200 KB. The 2 MB `lumi-hero.png` and `lumio_mascot.png` are no longer imported by the app.
- [ ] The 12 poses are transparent with no halo or fringe. Images have set width and height, so the layout does not jump.
- [ ] Lighthouse mobile performance is 90 or more on landing and `/login`. CLS is under 0.1.
- [ ] Only the fonts in use are loaded. Fraunces, Atkinson and `src/lib/fonts.ts` are gone.

Content and calm
- [ ] The rendered text of every screen has none of these words, matched as whole words, any case: streak, gem, XP, level, leaderboard, heart, friends, upgrade, premium, unlock, reward, badge, points, rank. The one exception is the tagline (see Open decisions).
- [ ] No screen shows a timer, counter, score or comparison that is not there today.
- [ ] Every error says what happened and what to do next, in plain, calm words.
- [ ] The tagline "Learn. Grow. Level Up." appears where Iris M1 and M2 require it.
- [ ] Luna PASS and Quinn PASS, with a BrowserOS neo check of every screen at 375 and 1440.

## Risks

- **Auth just came off HOLD.** Restyling 6 modes and splitting `auth-screen.tsx` can break cooldowns, recovery or the expired-link states. Keep the auth client and state logic as they are, move only markup, and run the auth-recovery tests on every change.
- **Two-step register.** The role can be lost between steps, after Back, or on the Google round trip, and the connect flow has its own rules. Quinn tests each path.
- **Test churn.** Markup changes break selector tests, and someone may loosen an assertion to get green. Quinn compares test counts and assertions with `06f1c54`.
- **Gold contrast.** `#EFB94E` on white is far below 4.5:1. It is safe only as fill or decoration.
- **Looks clickable, is not.** Guide cards that look tappable but do nothing can upset a child. Iris gives them no hover or pointer cue and adds a calm note.
- **Reference drift.** Lingora's search, bell, levels and progress ring are easy to copy by accident. Luna checks against "Not in this release".
- **Too close to Lingora.** Copy the layout pattern only, never its name, owl, art or words.
- **Crop quality.** Cropping and compressing can blur Lumi or leave edges. Lux crops and does not repaint. Luna compares each crop with the sheet.
- **`/resting` breaks.** Wrapping it in the new shell would add a `/api/me` call on the page used when the provider is down. It stays static.
- **Dead CSS removal** can drop styles for rare states. Check each state before deleting.
- **Old specs conflict.** Iris M1 and M2 say cream and "morning workbook". The refresh spec replaces their look sections only. Their behaviour clauses stay.

## Open decisions

- **Tagline vs. "no Level".** "Learn. Grow. Level Up." is Rex v1.3 and must appear exact on every page (Iris M1, M2). The owner banned "Level" as a feature chip, not the tagline. Default: keep the tagline exact and exempt only that string from the word check. Blocking: no. Owner can override.

## Handoff

Alex orders the work. Aria owns the auth split, the client keeping `official_cards` and the asset paths. Iris writes the refresh screen spec. Lux crops before Jules builds. Then Luna, then Quinn. Dep does not push.
