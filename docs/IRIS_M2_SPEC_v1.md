UI/UX SPEC — v1
Project: Lumio
Input: Rex v1.3, Aria v1.0, Alex M2

Milestone 2 only. The parent link. Do not restyle Milestone 1. Same chrome, same morning-workbook look, same voice. Tagline, exact, on every page in this spec, phone and desktop: Learn. Grow. Level Up.

Look, type, color, column, and chrome stay as in `IRIS_M1_SPEC_v1.md`. Do not open a second visual system. No owl, no dog, no sprite, no generated image, no guide, no report card, no advice, no upload, no second-parent screen, no teacher.

The connect form on `/home` already exists. Milestone 1 could not send. This milestone wires that submit. It does not redraw the form.

The parent list and this form stay the parent’s `/home`. A linked student’s `/home` is IRIS_STUDENT_HOME_SPEC_v1, not this form and not `/wait`.

## Flow

Parent on `/home` → one Gmail → `POST /api/invites` with `{ invited_email }` → one success line. The child is not linked yet and still cannot study.

That child opens `/connect/[token]` signed out → `GET /api/connect/:token` → Create account or Sign in with that Gmail.

Signed in as that student → one button → `POST /api/connect/:token/accept` with no body.

Accepted → `/wait` → `GET /api/home`. `needs_parent` false → `/home`. For that student, `/home` is the dashboard in IRIS_STUDENT_HOME_SPEC_v1. For a parent, `/home` stays the child list on this page. `needs_parent` true → stay on the Milestone 1 waiting copy. Do not put the student dashboard on `/wait`.

Ignored, because a main parent already exists → stay on `/connect/[token]`. They stay with the first parent. This link does not connect them. No second-parent screen.

Wrong address, a parent account, an expired link, or an unknown link → that person is not linked. A student who was never accepted stays on `/wait`.

A parent with linked children stays on `/home`. The list is first names from `GET /api/home`. An empty list stays “No child is linked yet.”

## Screens

### `/home` — parent

Purpose: A parent sends one connect email, and sees the first names of children already linked to them.
Primary action: Send connect email
Layout, top to bottom. Same chrome as Milestone 1: Lumio, the tagline, Sign out. No library nav.

- Heading: Home
- Greeting from `GET /api/home`: Hello, {first_name}.
- Child region, then the form. The form is the same form as Milestone 1.
- Empty list: No child is linked yet.
- Non-empty list: a heading Linked children, then one line per `children[]` item. The only words on a line are `first_name`. Not a table. Not a link. Not a card.
- Form legend: Connect a child
- Label: Child’s Gmail
- Placeholder, not a label: name@gmail.com
- Helper, unchanged: We send one link to that Gmail. It lasts 7 days. Your child still cannot study until they accept. The 7 days are Alex’s default, already frozen by Aria.
- Button: Send connect email
- One reserved status line.

The list uses `children` from `GET /api/home` only. Every child in that array already has this parent as `main_parent_id`. Unlinked children are absent. Do not add a second list and do not invent a child who is not in the array. Show the array in the order returned. Do not sort by email. Two children with the same first name are two lines of that name. Do not add the email to tell them apart.

Do not render `id`, `email`, `official_cards`, `study_sets`, scores, guide links, or `study_sets_next_cursor`. Those are later milestones. A send does not add a row. The child is not linked until an accept. Do not put a placeholder child on the list after a 201.

Submit is `{ invited_email }` to `POST /api/invites` and no other key. Retire the Milestone 1 line “Connect email is not available in this milestone. Nothing was sent.” Do not show `id`, `expires_at`, the token, or a URL. The raw token is not in the response. On `503 EMAIL_NOT_CONFIGURED`, no link is shown. None of the copy says whether that Gmail already has an account. Do not say registered, new, or existing.

A non-Gmail is invalid. The client uses the same sentence as `400 INVALID_EMAIL` and does not POST. Blank does not POST. Map codes to the sentences below. Do not print `error.message`, a provider body, or a code.

States:

- Loading: skeleton of the greeting, one list line, and the form. Not a spinner in a card. Chrome does not move.
- Empty: No child is linked yet. The form is blank. This remains the empty state.
- List: first names only. The form stays so another Gmail can be sent.
- Error, blank: Enter your child’s Gmail address.
- Error, not Gmail, client or `400 INVALID_EMAIL`: Enter a Gmail address ending in @gmail.com or @googlemail.com. If `details.field` is `invited_email`, put that sentence on the field.
- Error, `403 ROLE_FORBIDDEN`: Only a parent can send a connect email.
- Error, `429 RATE_LIMITED`: You have sent too many connect emails this hour. Wait and try again.
- Error, `502 EMAIL_FAILED`: The connect email could not be sent. Nothing was saved. Try again.
- Error, `503 EMAIL_NOT_CONFIGURED`: Connect email is not set up yet. Nothing was sent, and no link is shown.
- Error, `401`: leave to `/`. No private copy stays on screen.
- Error, other: The connect email could not be sent. Try again.
- Success: one line only, using `invited_email` from the 201 body: Connect email sent to {invited_email}. Clear the field. Leave the form so another address can be sent. Do not add a success screen.

While the request is in flight the button reads Sending… and is disabled.

Guards, not extra screens:

- Signed out: do not render this page. Go to `/`.
- No profile, or `403 ROLE_REQUIRED`: go to `/role`.
- Student with `needs_parent: true`: go to `/wait`. Do not show this form.
- Student with `needs_parent: false`: do not show this form or this list. `/home` for that student is IRIS_STUDENT_HOME_SPEC_v1. `/home` for a parent stays the child list.
- Parent on `/wait`: go to `/home`.

Document title: Home — Lumio

### `/connect/[token]` — signed out

Purpose: A person with the link sees who sent it, which Gmail it is for, and when it ends, then creates an account or signs in with that Gmail.
Primary action: Create account, or Sign in, for the invited Gmail. They are equal paths, as on `/`. Continue with Google is the same third path as Milestone 1, not a new product.
Layout, top to bottom:

- Chrome: Lumio and the tagline. No Sign out. The wordmark is not a link.
- Heading: Connect to a parent
- One line, from `GET /api/connect/:token`: {parent_first_name} sent this link to {invited_email}.
- One line: This link lasts until {local date and time from expires_at}. Links last 7 days. That length is Alex’s default.
- Then the account paths, only when the response is 200 and `state` is `sent`.

Account paths reuse the Milestone 1 controls. Do not restyle them.

- Button: Continue with Google
- The word: or
- Two mode controls, one selected: Sign in, Create account. Only one form is visible.
- Email label: Email. The field starts as `invited_email`. Placeholder is not the label.
- The prefill is not proof. The person may edit it. Accept later reads the session, never this field. Helper: Use this Gmail. A different address is not linked.
- Sign-in form: Email, Password, button Sign in.
- Create-account form: Email, Password, Confirm password, button Create account. Confirm password is not an API field.
- One reserved status line.

Do not write the raw token into the page, the title, the status line, or an error. It stays in the address bar only, because the route needs it. Do not show a reconstructed URL. Do not show `invited_email_key`. There is no such field on this response. Show `invited_email` as returned.

Format `expires_at` in the viewer’s local date and time. If it cannot be read, do not invent a date and do not print the raw value. Use: This link has an end time, and the date could not be shown.

`GET /api/connect/:token` has no session. Do not send the email anywhere on this request.

States:

- Loading: skeleton of the heading and two lines. No form. Chrome is already real. Do not flash the token.
- `200`, `state` `sent`: the layout above. This is the normal state.
- `200`, `state` `accepted`: This link was already used. Sign in with that Gmail if it is yours. This page does not connect anyone new. No Create account control. Sign in and Continue with Google stay, so the student who already used it can come back. Do not say whether an account exists.
- `200`, `state` `ignored`: This link does not connect anyone. The student stays with the first parent. No Create account control. Sign in and Continue with Google stay. No second-parent screen.
- `404 NOT_FOUND`: This connect link could not be found. No form. No token.
- `410 LINK_EXPIRED`: This link has expired. It does not connect anyone. Ask your parent to send a new one. No form. No token.
- Error, network or other: This page could not be loaded. Try again. Try again repeats the GET.
- Create, passwords differ, client only: Those passwords do not match. Do not call Supabase.
- Create or sign in, missing or bad email shape: reuse the Milestone 1 field sentences. Enter your email. Enter a valid email address. Enter your password. Confirm your password.
- Sign in, wrong password: That email and password do not match. Try again. Keep the email. Clear the password.
- Sign in, email not confirmed: Confirm your email first, then sign in.
- Create, email already registered: That email is already registered. Sign in instead. “Sign in instead” switches to Sign in and keeps the email. This sentence is only on this account form. It is not used on the parent’s `/home`.
- Create, Supabase rejects the password: That password was not accepted. Try a different one. Do not show the provider body and do not invent a length rule.
- Google returns with no session: Google sign-in did not finish. Try again.
- Create, no session yet, because confirmation stays on: Check your email to confirm this address. Then come back to this page and sign in. Stay on this route. Do not call accept. Do not print the token.
- Session exists, role null: go to `/role`. Do not call accept. Do not pass the token to `/role`. After the role is saved, Milestone 1 still sends a student to `/wait`. They open this link again to accept.
- Session exists, role student: stay on this route and use the signed-in screen below. Do not auto-accept.
- Session exists, role parent: use the parent line on the signed-in screen. Do not call accept from the account form.

Google uses the Milestone 1 button. Waiting for Google… while it is in flight. The callback is still not a screen and still assigns no role. Do not add a return field. After Google, the Milestone 1 redirect stands. The student comes back by opening this link again. `/connect` stays reachable for a student with no main parent.

Document title: Connect — Lumio. For 404: Link not found — Lumio. For 410: Link expired — Lumio. Titles do not include the token.

### `/connect/[token]` — signed in as that student

Purpose: The student who is signed in accepts this one link, or is told why it does not connect them.
Primary action: Accept this link
Layout, top to bottom:

- Chrome: Lumio, the tagline, and Sign out. Same bar as Milestone 1. The wordmark is not a link.
- Heading: Connect to a parent
- {parent_first_name} sent this link to {invited_email}.
- This link lasts until {local date and time from expires_at}. Links last 7 days. That length is Alex’s default.
- Button: Accept this link, only when GET returned 200 and the signed-in role is student.
- One reserved status line.

The button calls `POST /api/connect/:token/accept` with no body. Do not send `invited_email`, a role, or the token in the body. The token is the path only. Do not compare Gmail on the client. Dots and plus-tags are the server’s check. Do not show the raw token, `student_id`, `main_parent_id`, or `reason`.

While the request is in flight the button reads Accepting… and is disabled.

States:

- Loading: same skeleton as the signed-out page. No button until GET returns.
- Ready, role student, GET 200: the button. Do not promise the outcome before the response. This includes `state` `sent`, `accepted`, and `ignored`, because the same student and a different student are told apart by the POST.
- Accepted, `200` and `state` `accepted`, including the same student accepting again: You are connected. You can leave the waiting page. Do not show ids. Then go to `/wait`. If that page does not open: You are connected, but the waiting page did not open. Try again.
- Ignored, `200` and `state` `ignored`: You stay with the first parent. This link does not connect you. Stay here. Do not open a second-parent screen. Way out, only after this result: Go to home.
- `403 EMAIL_MISMATCH`: You are signed in as the wrong address. You are not linked. Sign out, then sign in with the Gmail on this page.
- `403 ROLE_NOT_STUDENT`: A parent account cannot accept this link. You are not linked. Do not show the accept button once the role is known to be parent. If the POST still returns this code, use the same sentence. Way out: Go to home.
- `409 ALREADY_USED`: Someone else already used this link. You are not linked.
- `410 LINK_EXPIRED`: This link has expired. It does not connect anyone. Ask your parent to send a new one.
- `404 NOT_FOUND`: This connect link could not be found. You are not linked.
- `401`: leave to `/`. No private copy stays on screen.
- Error, other: This link could not be accepted. Try again. The button stays.

GET 404 and GET 410 use the signed-out copy and do not show the button. A parent who is signed in does not get the accept button.

Document title: Connect — Lumio, or the 404 and 410 titles above. No token.

### `/wait` — after accept

Purpose: After an accept, this page either lets the student leave or keeps the Milestone 1 wait. The waiting copy does not change.
Primary action: Check again
Layout and copy, unchanged from Milestone 1:

- Chrome: Lumio, the tagline, and Sign out. The wordmark is not a link to `/home`.
- Heading: Waiting for a parent
- Body: You can use Lumio after a parent connects you. Until then, this is the only page you can open.
- Button: Check again
- Status, when still waiting: Still waiting for a parent.
- Error: We could not check your account. Check again.

Check again calls `GET /api/home`. It does not call `POST /api/invites`.

- `needs_parent` false: leave for `/home`. For this student, `/home` is IRIS_STUDENT_HOME_SPEC_v1. Do not paint that dashboard on `/wait`. A parent’s `/home` stays the child list. Do not announce a library, a card, or a guide.
- `needs_parent` true: stay. Use the waiting copy above. Still waiting for a parent. is not a failure.
- `role` parent: go to `/home`.
- `403 ROLE_REQUIRED`: go to `/role`.
- `401`: go to `/`.
- The check failed: stay on the waiting copy and show the error line. Do not treat a failure as linked.

A student who was never accepted stays here, including on a direct guide URL. No guide bytes.

Document title: Waiting for a parent — Lumio

## Accessibility notes

- Milestone 1 keyboard, label, contrast, and focus rules still apply. Do not remove the 2px ink outline.
- New and reused controls are in visual order. No positive tabindex. Enter submits the focused form. Touch targets stay at least 44×44px, with at least 8px between them.
- Child’s Gmail keeps a visible label, `type="email"`, and `autocomplete="username"`. The connect account fields use the same autocomplete as `/`: `username`, `current-password`, `new-password`.
- Linked children is a list with a heading. Each item’s accessible name is the first name only.
- The expiry is words, not color alone. Status lines are `aria-live="polite"` and keep a reserved line so the chrome and the button do not jump.
- On a field error, focus moves to that field. `aria-invalid="true"` and `aria-describedby` point at the sentence. Loading sets `aria-busy` and does not trap focus.
- Accept this link, Go to home, Try again, and Sign out are buttons with those names, not icons alone.
- The token is not an accessible name and is not repeated by the status line.
- `prefers-reduced-motion` stays as in Milestone 1. Display text still waits for `document.fonts.ready`, with the same 2.5s timeout.

## Build list for frontend

- Parent send — `POST /api/invites` only. Done when `/home` submits `{ invited_email }`, the success is one line with that address, and the mapped sentences cover blank, non-Gmail, `INVALID_EMAIL`, `ROLE_FORBIDDEN`, `RATE_LIMITED`, `EMAIL_FAILED`, and `EMAIL_NOT_CONFIGURED`. The page does not show `id`, `expires_at`, the token, or a URL, and it does not say whether that Gmail already has an account. Theo’s next task is this route only.
- Parent list — not this Theo pass. Needs `GET /api/home`, which Theo does not build in the invites pass. Done when a parent’s non-empty `children` renders `first_name` only, an empty array still says “No child is linked yet.”, and an unlinked child is not listed. No official cards, study sets, scores, or guide links.
- Signed-out connect — not this Theo pass. Needs `GET /api/connect/:token`. Done when the page shows `parent_first_name`, `invited_email`, and the expiry, and the primary paths create an account or sign in with that Gmail. 404 and 410 use their own copy. The token is not written on the page.
- Signed-in accept — not this Theo pass. Needs `POST /api/connect/:token/accept` and the GET above. Done when one button posts no body, accepted sends the student toward `/wait`, ignored says they stay with the first parent and this link does not connect them, and `EMAIL_MISMATCH`, `ROLE_NOT_STUDENT`, `ALREADY_USED`, and `LINK_EXPIRED` use their own lines. Ids and the token are not shown.
- Leave `/wait` — not this Theo pass. Needs `GET /api/home`. Done when `needs_parent` false leaves for `/home`, and that student `/home` is IRIS_STUDENT_HOME_SPEC_v1, not the parent child list. `needs_parent` true stays on the Milestone 1 waiting copy. Do not put the student dashboard on `/wait`. Do not ask Theo to build this route.
- Chrome — unchanged. Lumio and “Learn. Grow. Level Up.” stay on these pages at 320px and at 1280px. No sprite.

Theo’s next task is `POST /api/invites` only. Do not build `GET /api/connect/:token`, `POST /api/connect/:token/accept`, or `GET /api/home` in that pass.

Not in this milestone: guides, report cards, advice, upload, a second-parent invite screen, teacher, an owl, a sprite.
