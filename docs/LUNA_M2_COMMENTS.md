# Luna M2 comment review

Reviewer: Comment Sicko. Scope: Jules M2 frontend/test working-tree changes against HEAD `fcc8b7f0e65fd9f2893639f21899cb671dffeb2a`; no whole-branch review.

Result: two P3 comment-only findings, high confidence. Three comment lines recommended for deletion by Luna. Actual deletions: **0**. Application/test files edited: **0**. Suppressions found: **0**. `MUST KILL` refactor flags: **none**; neither finding establishes an own-code surprise or a correctness/safety suppression.

## Findings for Luna

1. **P3 — Remove implementation narration above `ConnectAuth`.** `src/components/connect-auth.tsx:13–14`, immediately before exported `ConnectAuth` (line 15 at inspection). High confidence.

   ```text
   // The same auth SDK, validators, error maps, callback, and control classes as login.
   // This form never saves a profile or forwards the connect address to another route.
   ```

   Evidence: imports at lines 5–8 name the shared auth helpers. `google` supplies only the existing callback at lines 46–48; `submit` supplies email/password and the callback at lines 69–72 and 87, then reads `getMe` and calls `onSession` at lines 97–99. These comments narrate the component's own implementation and negative guarantees; they are not API contract doc comments or a non-obvious external SDK constraint. Recommend deleting the two comment lines only. No application refactor requested.

2. **P3 — Remove narration above the error-code allowlist.** `src/lib/m2-client.ts:12`, immediately before `codes` (line 13), consumed by `request`. High confidence.

   ```text
   // Only allow codes used by the UI. Provider messages/details never cross this boundary.
   ```

   Evidence: `codes` explicitly enumerates the UI error codes at lines 13–16; `request` checks `codes.has(error.code)` and constructs a failure containing only `ok`, `status`, and `code` at lines 27–29. The comment repeats locally visible filtering and result construction. It records no external platform/protocol gotcha, public API doc contract, license, or issue/RFC constraint. Recommend deleting the comment line only; preserve the allowlist and response filtering.

## Inspected files and skips

Read the live tracked diff against the specified HEAD and the new file contents. Scanned every scoped file for line/block/JSX comments and lint, TypeScript, formatter, and coverage suppression markers.

| Scoped file | Comment/suppression outcome |
| --- | --- |
| `src/app/globals.css` | Added rules contain none. |
| `src/components/account-gate.tsx` | Changed lines contain none. |
| `src/components/home-screen.tsx` | Changed lines contain none. |
| `src/components/wait-screen.tsx` | Changed lines contain none. |
| `test/m1-shell.test.tsx` | Changed lines contain none. |
| `test/support/dom.ts` | Changed lines contain none. |
| `src/app/connect/[token]/page.tsx` | New file contains none. |
| `src/components/connect-auth.tsx` | Two comment lines: finding 1. |
| `src/components/connect-screen.tsx` | New file contains none. |
| `src/lib/m2-client.ts` | One comment line: finding 2. |
| `test/m2-frontend.test.tsx` | New file contains none. |

URL literals and URL-matching regular expressions are not comments and were skipped. Untouched code, existing API implementations, other untracked material, general application bugs, visual design, and later milestones are outside this review. No exception-protected comments needed retention. No suppressions required rule lookup. Neither finding contains an ambiguous `IMPORTANT`/`do not remove` constraint or unexplained behavior requiring `/how` or `/why`.

References consulted: `docs/JULES_M2_PROGRESS.md` and relevant sections of `IRIS_M2_SPEC_v1.md`, `ARIA_BLUEPRINT_v1.md`, `IRIS_STUDENT_HOME_SPEC_v1.md`, and `SESSION_HANDOFF_2026-10-22.md`. Later themed-shell decisions supersede historical no-owl/chrome restrictions. Bodyless explicit acceptance, session identity, first-parent behavior, first-name-only child lists, and token-free OAuth/role navigation were treated as existing requirements, not new findings.

Instructions read: exact `C:\Users\jdtig\.cursor\plugins\local\pstack\agents\comment-sicko.md` and `C:\Users\jdtig\.cursor\plugins\local\pstack\skills\no-comments\SKILL.md`. Caller limits this independent reviewer to reporting; Luna owns acceptance, comment deletion, and any subsequent fixes. This report does not claim completion of Luna's full plugin gate.

Verification: read-only Git inspection and source scans; no tests rerun for comment-only recommendations. No nested agents, real accounts/services, network writes, Git writes, commits, or application/test edits. Only this assigned report was written. Line numbers reflect the inspected snapshot; use the named symbols if concurrent Luna edits move them.
