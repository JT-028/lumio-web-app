UI/UX SPEC — v1
Project: Lumio
Input: IRIS_M1_SPEC_v1 (Rex v1.3, Aria v1.0), Lumio UI/UX design system, mascot sheet `src/assets/lumio_mascot.png`

Signed-out `/` only. This replaces the look of the landing in IRIS_M1_SPEC_v1. It does not replace `/role`, `/wait`, `/home`, or `/connect`. It does not start milestone 2. Account actions, validation sentences, and redirects stay the ones already specified. No new API fields.

## Look

A cozy magical library, and a learning platform first. One white card on a cream page. Lumi stands beside it as a companion. He is not a background pattern, and he is not a generic clip-art owl.

Lumi is the chestnut owl in a blue wizard hat and cape with gold trim. The product name stays Lumio. His name is Lumi.

Color, as intent:

- Page: Storybook Cream `#FFF9EF`.
- Headings and the one primary button: Midnight Library `#172B4D`. Button label `#FFFFFF`.
- Card: elevated surface `#FFFFFF`, 1px border `#E9E1D5`, radius 20px, soft warm shadow. No heavy black stroke.
- Body text `#2C3442`. Secondary text `#6D6A65`.
- Starlight Gold `#EFB94E` is one small highlight only: a 3px underline under the words “Level Up.” It is decoration, never text, never a button, never a focus ring, never an error.
- Owl Chestnut `#A95F38` is a warm accent on Lumi’s dialogue only (a 3px left bar). Not a button. Not body text.
- Error text `#B94A45` on the white card. Status is never color alone.
- Hover on the primary button darkens the fill to `#223D66`. Pressed darkens further. Do not lighten the white label.

Type: Baloo 2 for the wordmark and the hero. Nunito for UI, body, labels, buttons, and Lumi’s line. Hero 36px at 320px and 44px at 1280px, bold. Body 16–18px. Labels at least 14px, medium. Do not use Fraunces, Atkinson Hyperlegible, Inter, Roboto, Arial, or a system font as the face of this page. Other routes keep the type in IRIS_M1_SPEC_v1 until they are redesigned.

Shape: buttons radius 14px. Inputs radius 12px, large, labeled, at least 44px tall. Spacing from 4, 8, 12, 16, 24, 32, 48. Few stars, and only the star that is already in Lumi’s greeting pose. No stars on the card or over the fields.

`prefers-reduced-motion`: no wordmark fade. No bob, float, or twinkle. Lumi is a still frame.

## Flow

Signed out on `/` → Continue with Google, or Sign in with email and password, or Create account with email, password, and confirm password → `GET /auth/callback` is not a screen.

Google is the one primary action. Email sign-in and create account stay on this same page. They are not a second site and not a second navy button.

After a session exists, leave `/` from `GET /api/me`, same rules as IRIS_M1_SPEC_v1:

- No profile → `/role`.
- Student with no household → `/wait`.
- Parent → `/home`.
- Otherwise (a student who already has a household) → `/home`.

`/` with a session does not paint the sign-in form. It follows those redirects. Do not flash a signed-in page.

Google sign-in does not send a role and must not default the role to parent. Teacher is never offered and the word does not appear.

Confirm password is not an API field. Submit `signInWithPassword` or `signUp` only. Lumio has no password table. There is no “Forgot password” control. Aria does not define a reset route. Do not invent one.

## Screens

### `/` — signed-out login

Purpose: A visitor meets Lumio and Lumi, then starts an account or comes back.
Primary action: Continue with Google. The email form’s own button is the secondary action of the visible mode. Only one mode is visible.
Layout:

The page is cream. The card does not stretch across the viewport. The form column stays at most 28rem. No horizontal scroll. No app sidebar, no library nav, no Sign out.

Wide (1280px): one centered cluster, about 880px, not the full window. Lumi sits to the left of the card, about 220px tall, aligned to the top of the card. Gap 32px. His dialogue sits under him. The card is on the right, max 28rem, padding 24px.

Narrow (320px): stack. Page padding 16px, so cream shows at the edges. Lumi sits above the card and is smaller, about 112px tall, centered. Dialogue under him. Then the card, full width of that column, padding 16px. The card does not run edge to edge.

Lumi, both widths:

- Asset, do not crop or replace the file: `lumio-web-app/src/assets/lumio_mascot.png` (`D:\PORTFOLIO\booklet-web-app\lumio-web-app\src\assets\lumio_mascot.png`).
- The file is one 1536×1024 sheet, 3 rows by 4 columns, on cream.
- Show only the greeting pose: top row, first cell (row 1, column 1). He is waving, with one star.
- Frame that cell. Do not export a new image. An equal slice of 384×341 clips his feet (the pose runs to about y=345) and can catch the next owl. The top-left cell, through the cream gutters, is about x 0–413 and y 0–358. That window holds the whole wave and the one star, and stops before the wand pose (that body starts near x=446).
- He is an image with a name, not a CSS background that has no accessible name.
- Alt text, exact: Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.
- Dialogue, one line, under him, not inside the picture: Hi, I'm Lumi. Ready to discover something new?
- Chestnut left bar on that line. Text `#2C3442`, Nunito 16–18px. He does not overlap the card or the fields.

Card, top to bottom:

- Wordmark: Lumio. Baloo 2, about 32px, `#172B4D`.
- Smaller line under the wordmark: Learn. Grow. Level Up. Nunito 16px, `#6D6A65`. Gold underline under “Level Up.” only.
- Hero: Your little guide to big ideas. Baloo 2 bold, 36px at 320px, 44px at 1280px, `#172B4D`. It may wrap. It stays left-aligned.
- Lede: Grade 6 study for a student and a parent.
- Button, primary, full width of the card: Continue with Google.
- The word: or. Thin `#E9E1D5` rules on either side. The word is secondary text.
- Two mode controls, one selected: Sign in, Create account. Default is Sign in. Only one form is visible. Selected mode uses a soft blue wash `#DDEAF9` and navy text. The other is quiet. Neither is navy-filled.
- Sign-in form: Email, Password, Show password, button Sign in, then the line New here? Create an account.
- Create-account form: Email, Password, Confirm password, button Create account, then the line Already have an account? Sign in.
- Sign in and Create account, the form buttons, are secondary: white surface, navy text, 1px `#E9E1D5` border, radius 14px, full width, at least 44px tall. Not gold. Not a second primary.
- One reserved status line under the form button so the card does not jump.
- No guide, score, child list, upload, teacher, paywall, sprite frame around the whole sheet, or link to GitHub Pages.

States:

- Loading, session check: paint cream, the wordmark, both lines, and Lumi. Do not paint the card’s buttons or fields until the check says signed out. Do not flash a signed-in page. If a session exists, redirect and never show the form.
- Loading, Google in flight: the primary button reads Waiting for Google… and is disabled. The rest of the page stays as it is.
- Loading, email submit in flight: the secondary button reads Signing in… or Creating account…, matching the mode, and is disabled. Do not send a second submit.
- Empty: fields start blank. This is the normal state, not an error. Sign in is the selected mode.
- Error, sign in, wrong password: That email and password do not match. Try again. Keep the email. Clear the password.
- Error, sign in, email not confirmed: Confirm your email first, then sign in.
- Error, create, passwords differ (client only; do not call Supabase): Those passwords do not match.
- Error, create, email already registered: That email is already registered. Sign in instead. “Sign in instead” switches to Sign in and keeps the email.
- Error, Supabase rejects the password: That password was not accepted. Try a different one. Do not show the provider body and do not invent a length rule.
- Error, Google returns with no session: Google sign-in did not finish. Try again. The page stays usable.
- Error, network or anything else: Sign-in did not finish. Try again.
- Success, create, no session yet (email confirmation stays on): Check your email to confirm this address. Then come back and sign in. Stay on `/`. Do not open `/role`.
- Success, session exists: leave `/` by the flow above. No success toast on this page.

Copy:

- Wordmark: Lumio
- Line under the wordmark: Learn. Grow. Level Up.
- Hero: Your little guide to big ideas.
- Lede: Grade 6 study for a student and a parent.
- Lumi’s line: Hi, I'm Lumi. Ready to discover something new?
- Alt: Lumi, a chestnut owl in a blue wizard hat and cape with gold trim, waving hello.
- Button: Continue with Google
- Google waiting: Waiting for Google…
- Divider: or
- Modes: Sign in / Create account
- Label: Email
- Placeholder, not a label: name@example.com
- Label: Password
- Create-only label: Confirm password
- Create-only helper: Choose a password you can remember.
- Show control: Show password / Hide password
- Secondary buttons: Sign in / Create account
- In-flight labels: Signing in… / Creating account…
- Switch from sign in: New here? Create an account.
- Switch from create: Already have an account? Sign in.
- Missing email: Enter your email.
- Bad email shape: Enter a valid email address.
- Missing password: Enter your password.
- Missing confirm: Confirm your password.
- Document title: Sign in — Lumio, or Create account — Lumio, matching the mode.

### Google sign-in

Purpose: The same page starts or resumes a Google account without asking for a role.
Primary action: Continue with Google
Layout: the button on `/`. No second Google screen. `GET /auth/callback` exchanges the code and redirects. It has no page of its own.

States:

- Loading: button text becomes Waiting for Google… and is disabled.
- Error: Google sign-in did not finish. Try again. The landing stays usable.
- Success: session, still no role written, then the redirect rules.

Copy: Continue with Google / Waiting for Google… / Google sign-in did not finish. Try again.

## Accessibility notes

- Every control is reachable by keyboard in visual order. Lumi and his line are not controls. No positive tabindex. Enter submits the focused form. Escape does nothing on `/`.
- Tab order inside the card: Continue with Google, Sign in mode, Create account mode, Email, Password, Show password, Confirm password when that mode is visible, the form button, then the switch line.
- Every input has a visible label. Placeholders are examples only. Email uses `type="email"` and `autocomplete="username"`. Sign-in password uses `autocomplete="current-password"`. Create-account passwords use `autocomplete="new-password"`.
- Show password is a button, `aria-pressed`, labeled Show password or Hide password. It is not an icon alone.
- Mode controls are buttons with `aria-pressed`. They do not navigate to another URL. The switch lines do the same mode change.
- On submit, focus moves to the first invalid field. `aria-invalid="true"` and `aria-describedby` point at that field’s error. The status line is `aria-live="polite"` and keeps its height. Loading sets `aria-busy` on the form and does not trap focus.
- Contrast pairs that pass WCAG 2.2 AA for normal text: `#172B4D` on `#FFFFFF` (14.1:1) and on `#FFF9EF` (13.5:1); `#FFFFFF` on `#172B4D` (14.1:1); `#2C3442` on `#FFFFFF` (12.5:1); `#6D6A65` on `#FFFFFF` (5.4:1) and on `#FFF9EF` (5.1:1); `#B94A45` on `#FFFFFF` (5.1:1). Do not put the error red on a tinted wash unless that pair still clears 4.5:1. Gold on cream is about 1.7:1, so gold cannot carry meaning. Chestnut on cream is about 4.6:1, so chestnut stays an accent bar, not the dialogue text.
- Focus is a 2px `#172B4D` outline, 2px offset, on every control, including Google, the mode controls, Show password, and the secondary button. Never remove the outline. On the navy button the offset ring sits on the white card, so it stays visible. Hover increases contrast. It does not lighten the white label.
- Lumi’s image uses the alt sentence above. The dialogue is real text, not text baked into the picture.
- Touch targets are at least 44×44px, with at least 8px between them.
- Document titles are the ones named on `/`.
- `prefers-reduced-motion` turns any wordmark fade off. Prefer no fade at all: paint the wordmark with the page. Lumi does not animate.

## Build list for frontend

Jules builds this later. He is not called by this spec.

- `/` only — replace the morning-workbook landing with this cream page, white card, and Lumi. Do not restyle `/role`, `/wait`, `/home`, or `/connect`. Do not build milestone 2.
- Lumi — use `lumio-web-app/src/assets/lumio_mascot.png` (`D:\PORTFOLIO\booklet-web-app\lumio-web-app\src\assets\lumio_mascot.png`). Show row 1, column 1 only: waving, one star. Frame about x 0–413, y 0–358 of the 1536×1024 sheet. Do not crop or replace the file. Do not draw a new owl. Alt text names Lumi, and the dialogue line is on the page. About 220px tall beside the card at 1280px. About 112px tall above the card at 320px.
- Primary — Continue with Google is the only navy button. `signInWithOAuth` provider `google`, then the existing callback. A new Google user has no role. Waiting label and the Google error sentence stay as written.
- Email — Sign in and Create account stay on `/`, secondary buttons, one form at a time. Passwords go only through Supabase `signInWithPassword` and `signUp`. Confirm password is client-only. Wrong password is refused. Confirmation-on stays on `/` with the check-email line. Same validation and error sentences as IRIS_M1_SPEC_v1.
- Success — no toast. Leave from `GET /api/me`: no profile → `/role`, student with no household → `/wait`, parent → `/home`, otherwise → `/home`.
- Fit — at 320px and at 1280px the form is readable, the card is at most 28rem, and there is no horizontal scroll. Reduced motion does not fade the wordmark.
- Done when a signed-out person sees Lumi’s greeting pose, both lines (“Your little guide to big ideas.” and “Learn. Grow. Level Up.”), and can use Google or email on this page. Do not add password reset, `/connect/[token]`, the child library, a guide route, a card score, advice, or upload.

Not designed, because Aria has no route for it: password reset. Do not invent the screen.
