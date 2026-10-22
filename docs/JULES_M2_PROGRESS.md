# FRONTEND PROGRESS — Lumio M2

Date: 22 October 2026. Jules-only implementation. Ready for Luna review, with the browser limitations below. No commit, push, deployment, delegation, or other seat invocation.

## Files

| File | Change |
| --- | --- |
| `src/app/connect/[token]/page.tsx` | New connect route, fixed `Connect — Lumio` metadata for every state, and no-referrer policy. Does not pass the route parameter through server-rendered component props. |
| `src/components/connect-screen.tsx` | Public preview, session check, explicit student acceptance, safe errors, result navigation, and retry states. |
| `src/components/connect-auth.tsx` | Connect account paths using the existing Supabase browser helper, auth error maps, field validators, callback URLs, and login control classes. |
| `src/lib/m2-client.ts` | Typed preview/accept/household adapters, response allowlists, fixed error codes, local expiry formatting, and household guard destinations. |
| `src/components/home-screen.tsx` | Parent household read and first-name-only child list; preserves invite sending, adds duplicate-submit lock, field-level invalid-email handling, and private-content removal on 401. |
| `src/components/wait-screen.tsx` | Initial check and Check again read `/api/home`; follows `needs_parent` and role/session guards. Existing waiting copy and asset remain. |
| `src/components/account-gate.tsx` | Home read failure uses the specified home error and focuses Try again. |
| `src/app/globals.css` | Scoped connect text wrapping/input corners and linked-child list styling; reuses existing theme and responsive control styles. |
| `test/m2-frontend.test.tsx` | 49 focused mocked frontend tests, included in the final full run. |
| `test/m1-shell.test.tsx` | Adds household mock and updates waiting expectations for the intentional endpoint change. |
| `test/support/dom.ts` | Corrects the React test input helper so clearing a prefilled field triggers a change. |
| `docs/JULES_M2_PROGRESS.md` | This handoff. |

Existing user-owned untracked instructions, specs, handoff, and inspiration were preserved. No API route, server auth, middleware, schema, asset, dependency, other document, or student-dashboard component was edited.

## Screens and states

### Connect

- Loading has existing Shell chrome and skeleton lines; no form or accept control flashes.
- Sent preview shows parent first name, invited email, and viewer-local expiry. An unreadable date uses the fixed fallback without printing its raw value.
- Unknown and expired previews have their own copy, no account form, no accept button, and the same generic document title.
- Network/other preview failures focus Try again and repeat the preview/session reads.
- Signed-out sent links offer Google, Sign in, and Create account. Accepted/ignored previews retain Google and Sign in only, with their specified explanation.
- Email form validation covers missing/bad email, password, confirmation, and mismatched passwords. Invalid fields receive focus and accessible error references.
- Auth errors map to fixed sentences for credentials, unconfirmed email, duplicate account (including empty identities), rejected password, missing OAuth URL, and unexpected failures. Provider errors are never printed.
- Signup without a session stays on the connect route with confirmation instructions and cleared passwords. Signup/sign-in with a readable session shows the signed-in connect state; a missing role/name goes to `/role` without any connect parameter. No profile is saved by this form.
- Google uses the existing `/auth/callback` destination without token forwarding or a return field. Its existing redirect behavior is unchanged; the student reopens the emailed link.
- Unlinked students can use connect. Every preview state permits a known student to explicitly accept. No preview or auth action accepts automatically.
- Accept is a bodyless POST with a disabled Accepting… state and a duplicate-request lock. Client email comparisons do not decide acceptance.
- Accepted results navigate to `/wait`; navigation exceptions show the specified fallback and offer Try again without another POST.
- Ignored results remain on connect, explain that the first parent stays, and offer Go to home.
- Email mismatch, forbidden parent role, already used, expired, and unknown-link accept errors have their own fixed copy. Terminal outcomes remove acceptance. Other failures leave it retryable.
- Known parents never receive an accept button and can go home. Accept 401 clears the preview before leaving to `/`; role-required goes to `/role`.

### Parent home

- Role selection and the linked-student branch remain driven by `/api/me`. Only the parent branch requests `/api/home`.
- Parent loading reserves skeleton content; household failures do not fabricate an empty list or show an invite form. Try again repeats the household read.
- Greeting comes from `/api/home`. Empty children retain “No child is linked yet.” Nonempty children render a heading and one list item per returned first name, preserving order and duplicate names.
- Household adapters retain only the first name from each child. Emails, internal IDs, cards, study sets, and any additional response fields do not reach the list.
- Existing `/api/invites` form and error mapping remain. A send does not insert a child. Successful send clears the address; invalid-email responses attach to and focus the field; 401 removes the form, greeting, and list before navigating away.
- Household 401 goes to `/`; `403 ROLE_REQUIRED` goes to `/role`. A student response cannot paint the parent form.

### Waiting and student dashboard

- Waiting reads `/api/home` on entry and Check again. A student with `needs_parent: true` stays; a subsequent check announces “Still waiting for a parent.”
- `needs_parent: false` or a parent role leaves for `/home`; 401 leaves for `/`; role-required leaves for `/role`. Failed reads stay on the existing waiting copy with the fixed error, without assuming a link exists.
- The linked student dashboard still reads `/api/me` only. Continue learning and Today’s study retain their empty sentences. The course/quarter names and six study sections remain text, with no M3 study actions or new product features.

## Endpoints

| Endpoint | Consumer and payload |
| --- | --- |
| `GET /api/connect/:token` | Connect preview. No body or email parameter. |
| `POST /api/connect/:token/accept` | Explicit student accept only. No body. UI retains only the result state. |
| `GET /api/home` | Parent greeting/child names; waiting entry and Check again. No body. |
| `GET /api/me` | Existing home role/dashboard gate; connect session check and post-auth session read. |
| `POST /api/invites` | Existing parent form, exactly `{ invited_email }`. |
| `POST /api/sign-out` | Existing Shell sign-out helper. |
| Supabase email/Google auth | Existing browser client and callback paths; no connect token in auth arguments, metadata, role requests, or redirect fields. |

Connect adapters discard provider messages/details and unexpected private fields, including result IDs/reasons. The route value is used only as an encoded request path; it is not rendered as copy, a status, an accessible name, a title, or a logged value. Connect metadata and M2 requests suppress referrer forwarding. Tests use synthetic fixtures only.

## Verification

Final checks on this working tree:

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS, exit 0. |
| `node node_modules/typescript/bin/tsc --project test/tsconfig.json --noEmit` | PASS, exit 0. |
| `npm test` | PASS: 85 tests, 85 passing, 0 failing/cancelled/skipped/todo; 12,187.6999 ms. Includes 49 new M2 frontend tests and 36 existing tests. |
| `npm run build` | PASS, exit 0; production compilation, type validation, seven static pages, and dynamic `/connect/[token]` route completed. |
| `git diff --check` | PASS, exit 0. Git reports normal LF-to-CRLF normalization notices for edited files. |

The final coverage report records 100% line coverage for connect auth and M2 client adapters, and 97.04% for the connect screen. Coverage is supporting evidence; the behavior tests cover preview notfound/expired/network retry, signup/session/role routing, bodyless explicit acceptance and result/error states, duplicate acceptance, parent list privacy/order/duplicates/empty state, invitation response handling, waiting guards/retry, dashboard isolation, and token-safe DOM/title/auth/navigation/error output.

### BrowserOS neo

Read the browseros-neo skill first. Opened an owned review tab against an isolated mock harness outside the repository at `D:\PORTFOLIO\lumio-m2-mock-ui`, on loopback port 3012. The harness bundles the actual components/CSS, substitutes the Supabase and navigation imports, mocks every application fetch, and serves a CSP with `connect-src 'none'`. It never loads environment files or calls production APIs. An existing listener that appeared on 3010 was left untouched.

Completed in a real BrowserOS page at 320 × 800:

- Signed-out preview, real Lumio/tagline, prefilled invited email, sign-in/create/Google controls, and no automatic accept.
- Document scroll width 305px within the 320px viewport: no horizontal overflow.
- All measured input/button heights at least 44px.
- Create-account mode and deliberate password mismatch: fixed error, focus on `connect-confirm`, zero POST calls, and no synthetic route value in the DOM.

Limitations: full-page screenshot failed with `CDP request timed out: Page.captureScreenshot`. A subsequent BrowserOS batch and a tabs-list retry failed with an MCP transport error to the local BrowserOS endpoint. Therefore no screenshot artifact, completed 1280px real-browser pass, or real-browser parent/wait/accept pass is claimed. DOM tests exercise parent lists and the retained student layout at 320px and 1280px; those are not a replacement for real-browser visual review. BrowserOS needs its connection restored for the remaining visual checks. The isolated harness is retained for that review.

## Real-service limits and next gate

No real account, mail send, OAuth exchange, live Supabase read/write, or migration application was performed. Build/test success does not verify credentials, sender delivery, live migrations, or a deployed end-to-end acceptance. No API contract gap was found for this frontend slice. Historical setup claims in Theo’s documents were not treated as current live-service evidence.

- [x] Ready for Luna to review this uncommitted diff.
- [ ] Luna review and Quinn gate on this final diff (not claimed by Jules).
- [ ] Remaining real-browser checks after BrowserOS reconnects.
- [ ] Separately authorized live-service validation and deployment.

Luna should review the new files deliberately alongside the existing user-owned untracked inputs. No commit, push, or deploy was made.
