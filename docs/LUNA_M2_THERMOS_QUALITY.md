# Luna M2 — Thermos code-quality review

Date: 23 October 2026. Reviewer: thermo-nuclear-code-quality-review-subagent.

## Scope and basis

Reviewed only the requested Jules M2 frontend/test working-tree changes against HEAD `fcc8b7f0e65fd9f2893639f21899cb671dffeb2a`: six modified files and the five new application/test files listed in `JULES_M2_PROGRESS.md`. Inspected their live diff and contents; traced existing helpers and API/domain contracts solely as boundary context. Read the exact Thermos agent instructions and `C:/Users/jdtig/.cursor/plugins/local/thermos/skills/thermo-nuclear-code-quality-review/SKILL.md` rubric, plus the relevant Iris, Aria, and session-handoff requirements. Latest themed-shell requirements take precedence over historical M2 appearance text.

**Disposition: one P2 maintainability finding remains; request the narrow boundary fix below.** No request for a general auth framework, state-machine rewrite, or M3 work.

## Findings, in rubric priority order

### 1. [P2] Preserve error identity instead of using display copy as the discriminator

- Location: `src/components/home-screen.tsx:104`, `HomeForm.onSubmit` (new `result.message === ...` branch; initially line 100 before concurrent Luna edits).
- Confidence: **high**. Category: boundary/type-contract problem and duplicated policy.
- Evidence: the new branch compares the complete sentence `Enter a Gmail address ending in @gmail.com or @googlemail.com.` to decide whether to set `fieldError`, focus `child-gmail`, and return instead of displaying the general status. The existing `postInvite` boundary in `src/lib/lumio-client.ts:184` reduces the API code to a message through `inviteFailure`; its `INVALID_EMAIL` mapping at lines 202–205 owns a second copy of that sentence. The component therefore recovers semantic error identity by interpreting presentation text.
- Maintenance consequence: a wording-only edit in the canonical client mapping silently changes field behavior: the same `INVALID_EMAIL` response falls through to `setStatus`, losing the field error, `aria-invalid`, and focus. Maintaining one error now requires coordinated edits to both modules. The current focused test passes because both sentences currently match; it does not remove this coupling.
- Remedy: retain a typed discriminator such as `code: "INVALID_EMAIL"` or `field: "invited_email" | null` in the safe `postInvite` failure result, and branch on that. Keep fixed user-facing messages in their current mapping. This is a small contract correction; do not propagate provider messages or build a generic request framework. The new comparison introduces the dependency even though the existing helper is unchanged.

## Verification and concurrent changes

Ran only existing mocked tests, with `login:false` and `TSX_TSCONFIG_PATH=test/tsconfig.json`:

```text
node --experimental-test-module-mocks --test-isolation=process --import tsx --test --test-concurrency=1 --test-name-pattern="departed|invite invalid email" test/m2-frontend.test.tsx
```

Final result: **5 passed, 0 failed**. No live accounts, credentials, services, or network writes were used. This is targeted evidence, not a full Quinn/build/browser gate.

During review, the four departure tests initially failed: departed wait, connect-accept, auth, and parent-submit handlers navigated after their owners unmounted. Concurrent Luna changes added generation guards; the final rerun above passed all four. Those failures are **resolved at the final inspection**, not outstanding findings. The parent-submit case also existed before this diff and is not charged to Jules. Test additions and code fixes were made by the concurrent owner, not this reviewer. HEAD remained `fcc8b7f`.

## Rubric checks without findings

- No scoped file crosses from under 1,000 lines to over it. `globals.css` was already 1,175 lines at HEAD and is 1,189 lines after the 14 scoped additions; preexisting size is not a new decomposition violation.
- M2 adapters validate unknown JSON explicitly and project only allowed fields. The reduced household model and accept-result model serve concrete first-name-only/privacy requirements; they are not unjustified wrapper layers.
- Preview and session reads already run in parallel. The parent household read follows the account gate because the linked-student dashboard is explicitly limited to `/api/me`; collapsing those flows would conflict with the screen contract.
- Acceptance branching corresponds to distinct specified server outcomes, with a bodyless explicit POST and no client Gmail authorization decision. No high-confidence benefit justifies replacing this small flow with a general state framework.
- Connect auth reuses the existing SDK helper, validators, and error maps. Its signup/profile/navigation rules differ materially from landing; no speculative requirement to unify both forms is raised.
- No additional high-confidence scoped duplication, abstraction, or branching findings in the CSS, route metadata, account-gate copy, M1 mock update, or test input-helper change.

Only this report was written by this reviewer. No application/test edits, git writes, commits, nested agents, or external messages were performed. Luna owns synthesis and modifications.
