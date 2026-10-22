# Luna M2 — narrow QA quality review

Date: 23 October 2026. Base: current HEAD `ff2d0f7`.

**Verdict: PASS WITH NOTE.** No blocking maintainability findings. One P3 assertion-strengthening note below.

Applied the retained installed Thermos rubric only to the uncommitted additions in `test/m2-connect.test.ts`, `test/m2-frontend.test.tsx`, and new `test/m2-invites.test.ts`. Existing harnesses and relevant application functions were read only to assess the new assertions. No application audit or fixture/framework rewrite is requested.

## Finding

### [P3] Give the Strict Mode requests distinguishable outcomes

Location: `test/m2-frontend.test.tsx:540–544`, test `Strict Mode waiting effect restart releases its request lock and ignores the obsolete completion`.

Confidence: **high**. Both effect requests use the same deferred `holdHome` promise and capture the same default `homeReply`. Releasing them together yields two identical successful waiting responses. The assertions detect a stuck request lock, but would also pass if both completions updated the screen; they do not establish the title's obsolete-completion claim.

For that additional claim, return distinct deferred replies, resolve the current waiting response first, then release an obsolete response that would navigate or show an error. Assert that the waiting screen and navigation history remain unchanged. Keep the existing lock-recovery assertions. This is a small test-oracle improvement, not evidence of an application defect. Existing departure tests already provide separate lifecycle coverage, so this note does not block the QA additions.

## Assessment

- New connect-route assertions exercise real route/service code through the existing mocks: bodyless acceptance, canonical session Gmail, rejection of body/profile identity spoofing, replay rejection before RPC, and unchanged state on denial. Mock household/card assertions remain supporting evidence rather than proof of live SQL transactions.
- New invite tests exercise the real validation, token/hash creation, rate-limit filtering, mail construction, and rollback paths through intercepted transport and an in-memory database boundary. Independent literal expectations, preserved prior rows, fresh hashes, error envelopes, and zero-write checks are meaningful assertions.
- New frontend tests verify request counts while held, disabled/busy controls, field focus and descriptions, explicit acceptance after reopening, private-parent UI suppression, and retry after malformed responses. Repeated setup is modest and locally readable.
- No file crosses 1,000 lines: connect tests 833, frontend tests 548, invite tests 161. No new structural sprawl or abstraction requirement identified.

The reported **116/116** suite pass is Quinn's evidence; no suite was rerun for this inspection. No real services, git writes, application/test edits, or nested agents were used. This reviewer wrote only this report via `apply_patch`. Luna retains test-fix and commit ownership.
