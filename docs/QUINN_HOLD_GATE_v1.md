# Quinn HOLD fix gate v1

**Verdict: PASS.** 25 November 2026.
All checks pass. Coverage was judged like for like, as the coordinator directed: the gate passes if lines and branches each move by no less than -0.2 points against `314997b` under identical conditions. Measured delta: **lines +0.11, branches +0.08**.

- Tested commit: `06f1c54` on `feat/lumio-m1-shell` (Luna PASS, local commit). The working tree was clean at the start.
- Runtime: Windows, Node `v26.12.1`, npm `12.2.0`, Next.js `15.5.29`.
- Nothing in `src/` was edited and nothing was committed or pushed. This doc is uncommitted.

## Gate results on `06f1c54`, in the real tree

| Check | Exit | Result | Gate |
| --- | --- | --- | --- |
| `npm test` (full suite, coverage) | 0 | 267 tests: 267 pass, 0 fail, cancelled, skipped or todo | PASS |
| Coverage, like for like (see below) | n/a | lines +0.11, branches +0.08 against `314997b` | PASS |
| `npx tsc --noEmit` | 0 | clean | PASS |
| `npx tsc --noEmit -p test/tsconfig.json` | 0 | clean | PASS |
| `npx next build` | 0 | Next.js 15.5.29 compiled and type-checked. `/resting` is static (○) | PASS |
| `npm audit --omit=dev` | 0 | 0 vulnerabilities (info, low, moderate, high, critical all 0) | PASS |

Real-tree coverage, for information: 92.17% lines, 88.55% branches, 96.14% functions. Modules below 80% lines, both already known: `role-screen.tsx` 69.09% and `lumio-client.ts` 65.64%.

## Coverage method: like for like

The old 92.46% lines and 88.25% branches baseline came from a different machine (a Linux container on Node 24, at another path). Node's coverage under tsx shifts with location and line endings, so that baseline can't be compared across machines. The same `06f1c54` tree read 92.17% lines in the real tree and 92.61% to 92.76% in scratch copies. Unchanged files such as `errors.ts` lost closing-brace lines in some locations.

Method:

1. Two `git worktree add --detach` checkouts in Quinn's scratch area, outside the repo, at equal path depth: `…/scratchpad/wt/base` (`314997b`) and `…/scratchpad/wt/head` (`06f1c54`). Both have CRLF working-tree endings.
2. `node_modules` in each is a junction to the repo's installed `node_modules`, so both use the same Node and the same dependencies.
3. The same command in each: `npm test`, which includes coverage.
4. The junctions were unlinked, then both checkouts removed with `git worktree remove` and pruned. `git worktree list` now shows only the main tree.

| Checkout | Tests | Lines | Branches | Functions |
| --- | --- | --- | --- | --- |
| `314997b` (base) | 236: 232 pass, 4 fail | 92.72% | 88.95% | 96.03% |
| `06f1c54` (HOLD fix) | 267: 266 pass, 1 fail | 92.83% | 89.03% | 96.24% |
| **Delta** | | **+0.11** | **+0.08** | +0.21 |

Failures inside the worktrees:
- Both: "lumio-web-app is its own git repo…" fails only because a worktree is not the main checkout. It passes in the real tree.
- Base only: the 3 known audit failures (A1 null-role, `m2-connect` home, `m2-invites` send). `06f1c54` fixes all three.

Raw logs are in Quinn's session scratchpad and are not committed.
