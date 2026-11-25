# FRONTEND PROGRESS — Auth recovery v1

Project: Lumio. Jules implementation seat, 2026-10-25.
Status: UI implemented; UI-root TypeScript check passed. Quinn verification and Luna review pending; no QA/release PASS claimed.

## Files

- `src/app/page.tsx`, `src/components/landing.tsx`: truthful public Grade 6 family introduction and session-aware continuation CTA. No future study-feature claims.
- `src/app/{login,signup,check-email,confirm-email,forgot-password,reset-password}/page.tsx`: addressable pages, titles, no-referrer and no-index metadata.
- `src/components/auth-{screen,frame,flow}.tsx`: dedicated forms, original whole Lumi art, accessible validation, pending/error/success and invalid-link states; mounted-memory mail context only.
- `src/lib/auth-client.ts`: same-origin no-store fetches, 15-second client timeout, context/header acquisition before every mutation, safe errors, validated account destinations, removal of legacy storage entries by key without reading credential values. Authorized helper ownership clarified by main.
- `src/components/{account-gate,role-screen,connect-auth,connect-screen,shell,home-screen}.tsx`: trusted context routing, explicit role completion, saved-role display, server auth continuation, account switching, explicit acceptance, shared CSRF for profile/invite/accept/sign-out. No active browser Supabase auth import.
- `src/app/globals.css`, `src/app/layout.tsx`: form-first responsive frame, compact unchanged companion art, 44px+ controls, visible headings during font loading, memory-only mail provider.

## Screens done

- `/`: public in both session states; signup/login links or trusted Continue to Lumio destination.
- `/login`, `/signup`: initial account-check/retry, email/password validation, independent reveal controls, pending lock, safe rejection/network states. Confirmation-required signup enters `/check-email`; unconfirmed login offers resend. No Remember me control.
- Google: start exact empty-body server operation; provider unavailability disables the control with email fallback. No hardcoded availability flag and no pre-auth role/name persistence. Callback diagnostics use safe approved query states only.
- `/check-email`: purpose/address comes only from mounted memory after an actual send; direct/reload visits offer neutral navigation. Resend uses the matching endpoint. Sixty-second UX cooldown, server Retry-After respected; no ticking announcement.
- `/confirm-email`: staged candidate plus explicit Confirm email action. No verification on mount. Invalid/missing candidate offers email re-entry/resend and sign-in.
- `/forgot-password`, `/reset-password`: neutral reset request, staged-candidate form, invalid/missing link without save control, explicit one-use update and fresh-login destination. Uncertain proof outcomes re-read context before retry; no automatic mutation retry.
- `/role`: server context takes continuation precedence; explicit role/name, saved role read-only, one-attempt lock, reconciliation before retrying uncertain profile save.
- `/connect/[token]`: existing preview and M2 failure copy preserved. Clean login/signup navigation saves sealed continuation server-side. Account switching saves intent, signs out, reacquires context/CSRF, restores intent, then opens login. Authentication never accepts an invitation. Parent cannot see accept; wrong-email/first-parent checks remain server-owned.

Every changed mutation has try/catch/finally cleanup and synchronous duplicate locks; asynchronous UI completions use unmount/generation guards. Passwords remain in the current form only and clear on successful navigation or credential mismatch. No tokens, credentials or auth intent are persisted or logged.

## API dependencies

Exact frozen `ARIA_AUTH_RECOVERY_v1.md` table: context; intent; sign-in/up; Google; resend; forgot-password; confirm; reset-password; existing profile, invites, connect accept and sign-out. Shared public types imported from Theo's `src/domain/auth-contract.ts`. No invented API properties or new backend routes.

## Integration gaps for main / Theo

- At the time of this handoff, middleware refreshes credentials and sets cache/referrer headers but does not server-redirect authenticated `/login` and `/signup` visits. UI does hide all fields until trusted context resolves and redirects, but the strict pre-render server routing requirement still needs Theo's middleware integration. No server module was changed by Jules.
- Theo's inspected `resolveAuthNext` checks missing role but not missing first name. Existing UI can render saved-role/read-only name completion when context resolves `/role`; Theo must ensure incomplete names resolve there if this legacy state is supported. Jules does not invent a profile-update API.
- `/confirm-email` was absent from the initial seat route list; main subsequently instructed implementation of the complete frozen table and explicitly confirmed this route's explicit button. Implemented under that clarification.

## Validation / limits

- Narrow TypeScript program rooted in all UI components, the authorized auth-client helper, layout and the seven public/auth pages: **0 diagnostics** (installed local TypeScript; no build output).
- No tests authored or modified by Jules. Quinn owns tests, including migration of obsolete browser-SDK/landing-mode expectations; no compatibility stubs added for removed UI.
- No full build, package installation, browser/layout proof, provider/live-auth attempt, account creation, email, deployment, commit or push performed.
- Original `src/assets/lumi-hero.png` reused unchanged. Lux skipped under the exact-file exception; no new art or icons.

## Ready for

- [ ] Theo/main resolve the two server routing points above.
- [ ] Quinn tests the implemented public contract and UI behavior.
- [ ] Luna reviews after builders freeze.
