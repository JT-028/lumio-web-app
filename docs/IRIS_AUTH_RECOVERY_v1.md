# IRIS AUTH RECOVERY — UI/UX SPEC v1

Project: Lumio. Iris, 2026-10-25. Builder handoff for recovery before M3; design only.
Inputs: `ALEX_AUTH_RECOVERY_PLAN_v1.md`, existing landing/styles/role routing, visually inspected `src/assets/lumi-hero.png`.
API authority: `ARIA_AUTH_RECOVERY_v1.md` (parallel deliverable); its transition table governs operations, payloads, errors, session, capability flags, continuation lifetime and reset completion destination. This spec defines presentation, never new API fields. Jules reconciles that table before wiring; UI layout/copy need not wait.
Supersedes older Iris instructions for auth on `/`, same-page mode switches, no recovery, browser SDK session handling, hero-first phone layout and visual-only remember control. Unaffected M1/M2 screens remain authoritative.

## Shared frame and exact asset

- Keep the cozy library theme: cream `#FFF9EF`, white cards, navy `#172B4D` headings/actions, body `#2C3442`, muted `#6D6A65`, border `#E9E1D5`, error `#B94A45`. Gold stays decorative.
- Keep existing Baloo 2 headings/wordmark and Nunito body/forms; body/input text 16px minimum, labels 14px minimum. Card radius 20px, inputs 12px, buttons 14px; spacing 8/12/16/24/32px.
- Use only the exact current `src/assets/lumi-hero.png`, unchanged, whole image, intrinsic aspect ratio, contain sizing. No new crop, pose, icon, redraw, generated file or sprite extraction. Lux is skipped under the supplied-exact-asset exception. Preserve other owner files.
- Image alt: “Lumi, a friendly owl wizard, studying a glowing storybook beside a stack of books.” No added floating stars, art animation or new Google logo asset; provider action uses text.
- Auth pages at 320/390px: 16px outer padding; compact brand/home link, page heading, helper, form/actions, then optional existing art. DOM, visual and keyboard order agree. Art never displaces fields above the form; omit the decorative pane on phones if space is tight.
- At 320px the content column is 288px; at 390px it is 358px. Card padding 16px; no fixed minimum width, clipped labels or horizontal overflow. Signup may scroll vertically. Do not force the entire form above the fold.
- At 1280px: centered cluster max 960px; form max 448px with 24px padding, compact companion pane 240–280px, 32px gap. Keep form first in DOM and on the left; whole Lumi image at most 240px tall on the right. Intermediate widths use the single-column form layout.
- Header: linked Lumio wordmark and “Learn. Grow. Level Up.”; quiet link to the complementary auth page. Remove mode tabs and the visual-only “Remember me” control entirely.

## Routes, copy and primary actions

Each page has its own title ending “— Lumio”, one h1 and one main landmark. Links are real navigation links; form actions are buttons.

| Route | Heading / purpose | Primary action and content order |
| --- | --- | --- |
| `/` | “Grade 6 starts with family.” Public introduction | “Create account” → `/signup`; secondary “Sign in” → `/login`; short introduction, family explanation, existing Lumi image. |
| `/login` | “Welcome back” / “Sign in to your Lumio account.” | Email, Password, reveal, “Forgot password?” → `/forgot-password`, “Sign in”, Google option, “New to Lumio? Create account”. |
| `/signup` | “Create your Lumio account” / “Choose who this account is for.” | First name, account-role choice, Email, Password, Confirm password, “Create account”, Google option, “Already joined? Sign in”. |
| `/check-email` | “Check your email” | Confirmation or recovery explanation from trusted flow context; appropriate resend action, “Use a different email”, “Back to sign in”. |
| `/forgot-password` | “Forgot your password?” / “Enter your email to request a reset link.” | Email, “Send reset link”, “Back to sign in”. |
| `/reset-password` | “Choose a new password” | Validate recovery context before fields; New password, Confirm new password, reveal, “Save new password”. |

Landing copy: “Lumio is a space for Grade 6 students and their parents.” Then “Create your own account as a parent or student. A parent sends an invitation, and the student reviews it before connecting.” Explain “Students need a parent connection before entering the study area.” No usable-guide, cards, advice, uploads, rewards, scores or M3–M6 claims; no feature tiles or fake previews. Landing stays public when signed in; offer “Continue to Lumio” using trusted account routing instead of an auth CTA once session status is known.

Auth forms use a navy primary submit; Google is a full-width outlined alternative beneath “or”. Role uses a fieldset/legend “This account is for”, radio choices “Parent” / “Student”, helper “Your saved role cannot be changed.” No default selection and no teacher role. First name/role are onboarding intent, including when starting Google; they are validated and carried only through Aria’s flow, never trusted as saved profile authority. Do not require email/password fields to start Google.

## Fields and keyboard behavior

- Email: visible label “Email”, type email, inputmode email, autocomplete username on login/signup and email on recovery, autocapitalize none and spellcheck off. Placeholder may be “name@example.com”; it never substitutes for a label.
- First name: label “First name”, autocomplete given-name; apply existing normalization/validation through Aria’s contract. Preserve validated name/role intent through supported flows.
- Login password: autocomplete current-password. Signup and both reset password fields: autocomplete new-password. Confirmation is a local comparison, not an invented API field. Permit paste and password managers.
- Use text buttons “Show password” / “Hide password” with aria-pressed and aria-controls, type button; reset/sign-up confirmation has its own accurately named reveal control. Toggle without moving focus or clearing input. Return to masked fields when leaving the page.
- Enter submits only the current form. Native radio arrow keys work. Tab order follows content; no positive tabindex, auto-advancing fields, focus trap or initial autofocus that opens a phone keyboard unexpectedly.
- Validate after submission and revalidate an affected field after correction. Errors: “Enter your first name.”, “Choose Parent or Student.”, “Enter your email.”, “Enter a valid email address.”, “Enter your password.”, “Confirm your password.”, “Those passwords do not match.” Reset uses “Enter a new password.” / “Confirm your new password.”
- Password requirements must match Aria/provider policy; do not invent a minimum or strength score. Show approved requirements before submission. Safe rejection fallback: “That password was not accepted. Try a different one.”
- Pair every error with its field via aria-describedby and aria-invalid; focus the first invalid field on submit. Server field errors follow Aria’s mapping; unknown/provider bodies never appear verbatim.

## Pending, failure and recovery states

- Initial auth/session check: show brand, heading and visible “Checking your account…” status, without active fields until routing is resolved. A failed check shows “We couldn’t check your account. Try again.” with “Try again”; never spin indefinitely or infer signed-out from network failure.
- Empty: blank fields, no errors. Signed-in auth-route visits resolve server-side to the continuation/account destination without flashing auth forms; a valid recovery context follows the recovery rules instead.
- Submit pending labels: “Signing in…”, “Creating account…”, “Sending link…”, “Sending email…”, “Saving password…”, “Opening Google…”. Announce once in a polite live region; set aria-busy on the relevant form and suppress competing submissions/provider actions. Keep navigation usable.
- Every rejection, exception and failed redirect restores enabled controls through guaranteed cleanup. Reconcile account state before repeating a possibly completed signup/profile save. Never claim success on a timeout.
- Network copy: “We couldn’t connect. Check your connection and try again.” Keep email/name/role; retain password only in current form memory for a retry, never navigation/storage. Wrong credentials clear password and show “That email and password do not match. Try again.”
- General failure: “We couldn’t finish. Try again.” Put it beside a usable retry action. Rate limit: “Too many attempts. Please wait before trying again.” Only display retry timing supplied by the contract; announce readiness without a ticking live region.
- For non-field blocking errors, focus a tabindex -1 status summary once; use an alert announcement without duplicate live announcements. Normal pending/success updates use role status. Reserve a modest status area without excessive empty height.
- Unconfirmed sign-in: “Confirm your email to continue.” Offer the confirmation/check-email journey and resend using Aria’s eligibility rules. Never create a bypass.
- Signup requiring confirmation clears passwords and navigates to `/check-email`; immediate-session success follows the same trusted onboarding/continuation routing. Neutral handling of existing addresses follows Aria; do not disclose account existence through new copy.

## Check-email and link entry

- Confirmation copy: “If confirmation is needed for this address, you’ll receive an email with a link to continue.” Action “Resend confirmation email”. Recovery copy: “If an account uses this email, you’ll receive a link to reset its password.” Action “Send another reset link”. Include “Check your spam folder too.”
- Successful resend: “If eligible, another email is on its way.” Throttled/failed resends remain retryable under server limits; no invented countdown. “Use a different email” returns to signup or forgot-password according to trusted context, clearing previous secrets.
- Do not put email addresses in URLs. Show a submitted address only when safely available from Aria’s context. Refresh or a direct `/check-email` visit with missing context shows “Need an email link?” with links to `/signup`, `/forgot-password` and `/login`; never guess a purpose or announce mail sent.
- Confirmation/callback entry: visible “Confirming your email…” or “Finishing sign-in…” only if a loading screen is needed. Success immediately follows Aria’s transition table. Invalid/expired/replayed confirmation: “This confirmation link can’t be used. Request another email.” Offer confirmation resend through the contract and “Back to sign in”.
- Strip sensitive callback material using Aria’s cleanup/redirect rules before displaying a clean failure route. Never echo codes, raw invite links, tokens or provider error text.

## Password reset

- On valid recovery entry, allow only the password update flow authorized by Aria. Never treat recovery context as ordinary access to `/home` or profile mutation.
- Invalid/expired/used link or direct visit without valid context: replace the form with “This reset link can’t be used. Request a new link.” Primary “Request a new link” → `/forgot-password`; secondary “Back to sign in”. No active save button.
- During context validation: “Checking your reset link…”; validation network failure offers “Try again” without labelling the link invalid. Update network failure keeps the page usable and checks recovery/session state before retry when the outcome is uncertain.
- Accepted update: clear both passwords; announce “Your password has been updated.” Then use Aria’s defined completion destination/session disposition. If sign-in is required, `/login` shows that success message and its working form; never assume automatic sign-in or reuse the reset link.

## Google readiness and fallback

- Implement both Google start and callback paths through the shared server session contract. The currently false capability flag controls availability; the owner reports enabling Google, but UI readiness follows the authoritative capability, not that report alone.
- When unavailable, show the Google button disabled with visible associated explanation “Google sign-in isn’t available right now. Use email to continue.” A working “Use email instead” link focuses the email form heading. Apply on login and signup; no inert clickable stub or success simulation.
- When available, “Continue with Google” starts the real flow. On signup collect name/role intent as above; `/role` completes any missing values after authentication. Google must never silently assign Parent.
- Cancellation/callback failure: “Google sign-in didn’t finish. Try again or use email.” Restore “Continue with Google” and the email path; retain only trusted continuation. A stale flag/provider-configuration rejection uses the unavailable explanation and email fallback. No raw provider diagnostics.

## Role, name, invite and navigation integration

- The transition table in `ARIA_AUTH_RECOVERY_v1.md` is the sole routing authority. UI expectation: after valid authentication, resolve missing onboarding, then a valid pending invite preview, otherwise existing account routing. Server validates eligibility at each step.
- Persist validated first name/role intent once per Aria’s contract through signup, confirmation and OAuth; consume it only for initial profile creation. Never overwrite an existing name/immutable role or repeatedly save on refresh/callback replay. If save outcome is unclear, re-read authoritative account state before retry.
- Missing/cross-device intent leads to existing `/role` fields with “Finish setting up your account.” Ask only for missing information; never invent a role/name. Saved role is read-only if name completion is needed. If secure invite restoration is unavailable: “Open your original invitation link to continue.”
- Login/signup/forgot links preserve only Aria’s trusted continuation mechanism. No raw return URLs or tokens in browser storage. A normal link transition adds history; successful auth/callback/reset cleanup replaces transient entries. Back/forward and refresh render the correct route/state without reposting a form or replaying acceptance.
- Reuse the shared server auth flow on `/connect/[token]`; preserve preview and an explicit accept button. Completing login, confirmation, OAuth or `/role` never accepts an invitation automatically.
- Keep M2 wrong-email, parent-account, expired seven-day invitation, already-connected and first-parent-wins states/copy. Offer existing safe sign-out/switch-account or invitation recovery actions as appropriate; no automatic account switching. Unlinked students can reach connect but stay gated from study; ordinary routing remains `/wait`. Parents and linked students go `/home`; incomplete profiles go `/role`.

## Builder acceptance brief

- Jules: build public `/`, separate addressable auth pages and check-email states; wire only Aria/Theo contracts, shared session checks and existing role/connect integration. All direct URLs, reloads and history transitions must work; no browser SDK auth/session duplicate.
- Quinn: verify 320/390/1280px, keyboard/reveal/error focus/status, 200% text zoom/reflow, form-first order and unchanged whole Lumi art. Controls have visible 2px navy focus with 2px offset, at least 44×44px targets and 8px separation; normal text contrast at least 4.5:1. Reduced motion disables decorative movement; font loading must not hide essential text.
- Verify empty/pending/error/success/network/timeout paths, Google available/unavailable/cancelled, confirmation/resend, valid/invalid reset, trusted intent once, missing context, refresh/history, and invite preview without auto-accept using local fixtures/mocks.
- Luna reviews against this spec and Aria’s contract. This document is ready for layout/copy implementation; API binding requires reconciliation with Aria’s final transition table. No runtime/browser/live-provider verification is claimed by this design handoff. No account creation, real emails, live auth, remote configuration, production push or deploy is authorized here.
