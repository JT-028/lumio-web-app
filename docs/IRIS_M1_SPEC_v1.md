UI/UX SPEC — v1
Project: Lumio
Input: Rex v1.3, Aria v1.0, Alex M1

Milestone 1 only. Screens below are the signed-in shell. Do not build the report card, advice page, guides, tracker, upload flow, connect-accept page, or child library.

Look: “morning workbook.” Bright paper, one green action color, a schoolbook wordmark. Not a purple dashboard, not StudyFetch’s rail or upgrade pill, not a mascot page. No owl, no dog, no sprite frame, no generated image. The memorable mark is a notebook rule under the wordmark; only the words “Level Up.” get a short gold underline. That underline is decoration, never text.

Color, as intent (darken until the pairs below pass WCAG 2.2 AA):

- Paper `#F6F1E7`, ink `#1B2430` (text on paper, at least 4.5:1).
- Accent `#145C38` with white label `#FFFFFF` (button text at least 4.5:1). Hover and pressed darken the fill. Do not lighten the label.
- Notebook rule `#E3D5C4`. Gold underline `#C48A04`, at least 3px, under “Level Up.” only.
- Danger ink `#7F1D1D` on paper, and on a danger wash `#F8E8E4`. Success ink uses the accent green. Status is never color alone; the words below are the status.

Type: Fraunces for the wordmark and headings, Atkinson Hyperlegible for body, labels, and buttons. Self-host WOFF2. Do not use Inter, Roboto, Arial, or a system font as the brand face. Display text stays hidden until `document.fonts.ready`, then fades in. A 2.5s timeout reveals it anyway. Body fallback must not reflow. `prefers-reduced-motion`: no fade.

Layout: one form column, max 28rem. Phone (320px): stack wordmark, tagline, then the action. Desktop (1280px): wordmark and tagline on the left, the action on the right, same band, not a centered card. No horizontal scroll. Chrome height stays fixed. Touch targets at least 44×44px, with at least 8px between them.

Tagline, exact, on every M1 page, phone and desktop: Learn. Grow. Level Up.

## Flow

Signed out on `/` → Create account or Sign in (email and password, Supabase Auth) or Continue with Google → `GET /auth/callback` is not a screen.

After a session exists:

- No profile → `/role` → `POST /api/profile` once.
- Parent → `/home`.
- Student with no household → `/wait`.
- Otherwise → `/home`.

A student with no main parent who opens any other signed-in page is sent to `/wait`. A signed-out person who opens `/role`, `/wait`, or `/home` is sent to `/`. A session with no profile that opens `/wait` or `/home` is sent to `/role`. A parent who opens `/wait` is sent to `/home`. Refresh keeps a valid session on the same allowed page.

`/` with a session does not paint the sign-in form. It follows the same three-way redirect.

Google sign-in does not send a role and must not default the role to parent. Teacher is never offered and the word does not appear.

## Screens

### `/` — signed-out landing

Purpose: A visitor sees the name and tagline and starts an account, or comes back.
Primary action: Continue with Google, and the one button of the visible email form (Sign in or Create account). They are equal account paths, not a feature list.
Layout, top to bottom:

- Wordmark: Lumio
- Tagline on the notebook rule: Learn. Grow. Level Up.
- One line: Grade 6 study for a student and a parent.
- Button: Continue with Google
- The word: or
- Two mode controls, one selected: Sign in, Create account. Only one form is visible.
- Sign-in form: Email, Password, button Sign in, then the line New here? Create an account.
- Create-account form: Email, Password, Confirm password, button Create account, then the line Already have an account? Sign in.
- No guide, score, child list, upload, teacher, paywall, sprite, or link to GitHub Pages.

States:

- Loading: the first screen paints the wordmark and tagline. Do not flash a signed-in page. If a session check is in flight, show the paper only, with no form, until the redirect is known.
- Empty: the form starts blank. This is the normal state, not an error.
- Error, sign in, wrong password: That email and password do not match. Try again. Keep the email. Clear the password.
- Error, sign in, email not confirmed: Confirm your email first, then sign in.
- Error, create, passwords differ (client only; do not call Supabase): Those passwords do not match.
- Error, create, email already registered: That email is already registered. Sign in instead. “Sign in instead” switches to Sign in and keeps the email.
- Error, Supabase rejects the password: That password was not accepted. Try a different one. Do not show the provider body and do not invent a length rule.
- Error, Google returns with no session: Google sign-in did not finish. Try again.
- Error, network or anything else: Sign-in did not finish. Try again.
- Success, create, no session yet (email confirmation stays on): Check your email to confirm this address. Then come back and sign in. Stay on `/`. Do not open `/role`.
- Success, session exists: leave `/` by the redirect rules. No success toast on this page.

Copy:

- Wordmark: Lumio
- Tagline: Learn. Grow. Level Up.
- Lede: Grade 6 study for a student and a parent.
- Button: Continue with Google
- Divider: or
- Modes: Sign in / Create account
- Label: Email
- Placeholder, not a label: name@example.com
- Label: Password
- Create-only label: Confirm password
- Create-only helper: Choose a password you can remember.
- Show control: Show password / Hide password
- Buttons: Sign in / Create account
- Switch from sign in: New here? Create an account.
- Switch from create: Already have an account? Sign in.
- Missing email: Enter your email.
- Bad email shape: Enter a valid email address.
- Missing password: Enter your password.
- Missing confirm: Confirm your password.
- Document title: Sign in — Lumio, or Create account — Lumio, matching the mode.

Confirm password is not an API field. Submit `signInWithPassword` or `signUp` only. Lumio has no password table.

There is no “Forgot password” control. Aria does not define a reset route.

### Google sign-in

Purpose: The same landing starts or resumes a Google account without asking for a role.
Primary action: Continue with Google
Layout: the button described on `/`. No second Google screen. `GET /auth/callback` exchanges the code and redirects. It has no page of its own.

States:

- Loading: button text becomes “Waiting for Google…” and is disabled.
- Error: Google sign-in did not finish. Try again. The landing stays usable.
- Success: session, still no role written, then the redirect rules.

Copy: Continue with Google / Waiting for Google… / Google sign-in did not finish. Try again.

### `/role` — once

Purpose: A signed-in person with no profile chooses parent or student and gives a first name. The choice is permanent.
Primary action: Save and continue
Layout, top to bottom:

- Chrome: Lumio, the tagline, and Sign out. No first name yet.
- Heading, also the fieldset legend: Who is this account for?
- Helper: You choose once. Lumio cannot change this later.
- Radio Parent. Description: I will connect my child’s account.
- Radio Student. Description: I am the Grade 6 student.
- Label: First name
- Helper: Up to 40 characters. Letters, spaces, hyphens, or apostrophes.
- Button: Save and continue

No third role. No teacher. No way to edit the role after it is saved. No settings link.

The request is only `{ first_name, role }` with `role` equal to `parent` or `student`.

States:

- Loading: do not show the radios until `GET /api/me` returns. Skeleton of the heading and two lines. If `role` is already `parent` or `student`, redirect and never show the form.
- Empty: both radios unselected, first name blank. The button stays available; client checks run on submit.
- Error, no radio: Choose Parent or Student.
- Error, blank first name: Enter your first name.
- Error, longer than 40 characters: Use 40 characters or fewer.
- Error, any other character, or any `@`: Use letters, spaces, hyphens, or apostrophes only.
- Error, `400 VALIDATION`: show `error.message` from the envelope. If `details.field` is `first_name` or `role`, put that message on that control. If `details` is null, put it above the button. If `error.message` is empty: Check your first name and your role, then try again.
- Error, `409 ROLE_ALREADY_SET`: Your role is already saved. It cannot be changed. Then redirect from `GET /api/me`. Do not leave an editor on screen.
- Error, other: Your role could not be saved. Try again.
- Success: no toast. Parent goes to `/home`. Student goes to `/wait`. If the save succeeded and the next page did not open: Your role was saved, but the next page did not open. Try again.

Copy is the strings in the layout and states above. Document title: Choose your role — Lumio

### `/wait` — unlinked student only

Purpose: A student with no main parent waits here. This is the only page they can use.
Primary action: Check again
Layout, top to bottom:

- Chrome: Lumio, the tagline, and Sign out. The wordmark is not a link to `/home`. No guide, card, upload, or library link.
- Heading: Waiting for a parent
- Body: You can use Lumio after a parent connects you. Until then, this is the only page you can open.
- Button: Check again
- One reserved status line under the button.

Check again calls `GET /api/me`. It does not call `POST /api/invites`. If `has_main_parent` is true, go to `/home`. If `role` is `parent`, go to `/home`. If `role` is null, go to `/role`. If the student is still unlinked, stay.

States:

- Loading: skeleton of the heading and one body line. Chrome is already real.
- Empty: the heading and body above. This is the normal state. It is not an error.
- Error, check failed: We could not check your account. Check again.
- Success, still waiting: status line Still waiting for a parent. Do not treat this as a failure.
- Success, household exists: leave for `/home`. Do not announce a library.

Copy: Waiting for a parent / You can use Lumio after a parent connects you. Until then, this is the only page you can open. / Check again / Still waiting for a parent. / We could not check your account. Check again.

Document title: Waiting for a parent — Lumio

An unlinked student who hits a guide URL, or any other signed-in route, is redirected here. No guide bytes and no private list are shown on the way.

### `/home` — parent, no linked child

Purpose: A parent with no linked child sees that the list is empty and can send one connect email.
Primary action: Send connect email
Layout, top to bottom:

- Chrome: Lumio, the tagline, Sign out. No library nav.
- Heading: Home
- Greeting from `GET /api/home`: Hello, {first_name}.
- Empty line: No child is linked yet.
- Form legend: Connect a child
- Label: Child’s Gmail
- Placeholder, not a label: name@gmail.com
- Helper: We send one link to that Gmail. It lasts 7 days. Your child still cannot study until they accept. The 7 days are Alex’s default, already frozen by Aria.
- Button: Send connect email
- One reserved status line.

The list is not a table. Do not render `official_cards`, `study_sets`, scores, or guide links. Do not render `children[].email` in the empty state.

The form posts `{ invited_email }` to `POST /api/invites`. Aria already defines that route, so the button is wired to it. Do not stub it. Do not show `id`, `expires_at`, a token, or a URL. The raw token is not in the response. On `503 EMAIL_NOT_CONFIGURED`, no link is shown.

States:

- Loading: skeleton of the greeting and the form. Not a spinner in a card. Chrome does not move.
- Empty: No child is linked yet, and the form is blank. This is the M1 home.
- Error, blank: Enter your child’s Gmail address.
- Error, `400 INVALID_EMAIL`: Enter a Gmail address ending in @gmail.com or @googlemail.com.
- Error, `403 ROLE_FORBIDDEN`: Only a parent can send a connect email.
- Error, `429 RATE_LIMITED`: You have sent too many connect emails this hour. Wait and try again.
- Error, `502 EMAIL_FAILED`: The connect email could not be sent. Nothing was saved. Try again.
- Error, `503 EMAIL_NOT_CONFIGURED`: Connect email is not set up yet. Nothing was sent, and no link is shown.
- Error, `401`: leave to `/`. No private copy stays on screen.
- Error, other: The connect email could not be sent. Try again.
- Success: one line only, using `invited_email` from the 201 body: Connect email sent to {invited_email}. Clear the field. Leave the form so another address can be sent. Do not design an inbox, an accept page, or a second success screen.

None of this copy says whether that Gmail already has an account.

While the request is in flight the button reads Sending… and is disabled.

Guards, not extra screens:

- Student with `needs_parent: true`, or `403 ROLE_REQUIRED`, or `role: null`: do not render this page. Redirect as in the flow.
- Parent with a non-empty `children` array, or a student with `needs_parent: false`: do not draw children, cards, or sets, and do not show this form. Show Home, the greeting, and one line: Your linked children are not listed on this page yet.

Document title: Home — Lumio

### Chrome and sign-out

Purpose: Every M1 page shows the name and the tagline. Signed-in pages can end the session.
Primary action: Sign out, only in signed-in chrome.
Layout: one fixed bar. Wordmark, tagline on the rule, then Sign out when a session exists. Signed-out `/` has no Sign out.

States:

- Loading: the bar is the real bar, not a skeleton that changes height.
- Error: Sign-out did not finish. Try again. Stay on the page.
- Success, `POST /api/sign-out` returns 204: go to `/`. Cookies are cleared. No private heading remains.

Copy: Lumio / Learn. Grow. Level Up. / Sign out / Sign-out did not finish. Try again.

## Accessibility notes

- Every control is reachable by keyboard in visual order. No positive tabindex. Enter submits the focused form. Escape does not clear `/role`.
- The role choice is a `fieldset` with a legend. Arrow keys move between Parent and Student. Each radio’s description is tied with `aria-describedby`.
- Every input has a visible label. Placeholders are examples only. Email inputs use `type="email"` and `autocomplete="username"`. Sign-in password uses `autocomplete="current-password"`. Create-account passwords use `autocomplete="new-password"`. First name uses `autocomplete="given-name"`.
- Show password is a button, `aria-pressed`, labeled Show password or Hide password. It is not an icon alone.
- On submit, focus moves to the first invalid field. `aria-invalid="true"` and `aria-describedby` point at that field’s error. A status line is `aria-live="polite"`. Loading sets `aria-busy` on the form and does not trap focus.
- Contrast follows the pairs in Look. Focus is a 2px ink outline, 2px offset, on every control, including Google and Sign out. Never remove the outline. Hover increases contrast.
- Status text sits in a reserved line so the bar and the button do not jump. Errors are words, not color alone, and not raw codes, SQL, or provider bodies.
- Document titles are the ones named on each screen.
- `prefers-reduced-motion` turns the wordmark fade off. The tagline still renders.

## Build list for frontend

- Shell — Lumio and “Learn. Grow. Level Up.” are visible on `/`, `/role`, `/wait`, and `/home` at 320px and at 1280px. No sprite frame and no image.
- `/` — signed-out landing with Google, sign-in, and create-account modes. Passwords go only through Supabase `signInWithPassword` and `signUp`. Wrong password is refused. Confirmation-on stays on `/` with the check-email line.
- Google — `signInWithOAuth` provider `google`, then the existing callback redirect. A new Google user has no role.
- `/role` — one submit of `{ first_name, role }` to `POST /api/profile`. Parent or student only. A second submit cannot change the role.
- `/wait` — unlinked student only. Check again uses `GET /api/me`. Any other signed-in route sends that student here.
- `/home` — parent and empty `children`: the empty line and the connect form. Submit `{ invited_email }` to `POST /api/invites`. Success is the one line. No token and no link on the page.
- Sign out — `POST /api/sign-out`, then `/`.
- Done when a person can register, choose a role once, and land on `/wait` or the empty parent home, and the tagline is on both viewport widths. Do not build `/connect/[token]`, the child library, a guide route, a card, advice, or upload in this milestone.

Not designed, because Aria has no route for it: password reset. Do not invent the screen.
