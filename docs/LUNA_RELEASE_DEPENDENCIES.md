# Luna dependency release review

Date: 23 October 2026. Base: `b42912fb93b8b7f27083051d9d645e4246ce081b` on `feat/lumio-m1-shell`. Scope: authorized changes to `package.json` and `package-lock.json` only, plus release-review notes.

## Current status

Dependency gate PASS. Zero open CRITICAL, HIGH, MED, or LOW findings in this scoped patch. Dep completed the clean installation and handed over exclusive gate/commit ownership. Both independent Thermos reviews found no concrete issue, and Comment Sicko is CLEAN. Luna independently verified the installed graph, full audit, application typecheck, and native esbuild transform. Dep's saved full/supplemental tests, test typecheck, and Next.js production build also pass. Ready for the local dependency commit and renewed Quinn verification, not a claim of remote CI or deployment success.

- [x] Read `DEP_M2_DEPLOYMENT.md`, manifest diff, and lockfile structure.
- [x] Inspect scoped override, version alignment, dependency removal, registry origins, and engine/peer declarations.
- [x] Read all three independent dependency review reports and record dispositions.
- [x] Receive Dep's clean-install handoff, installed-tree/audit evidence, and completed checks.
- [x] Complete required post-install gate checks without overlapping Dep's install.
- [ ] Verify exact staged boundary, commit locally, and record the revision for Quinn.

## Authorized patch and initial lock assessment

| Dependency | Base | Candidate | Initial assessment |
| --- | --- | --- | --- |
| Next.js | 15.5.27 | 15.5.28 | Patch on the existing release line. All eight SWC optional packages and `@next/env` align to 15.5.28 in the lockfile. |
| PostCSS under Next.js | 8.4.31 | 8.5.23 | Root `overrides.next.postcss` targets the Next.js dependency subtree. The candidate lock contains one hoisted PostCSS entry, with Next.js its sole recorded consumer. |
| tsx | 4.21.0 | 4.23.15 | Remains a development dependency on major 4. Its declared esbuild range becomes `~0.28.0`. |
| esbuild | 0.27.7 | 0.28.2 | Satisfies tsx's new range. All 26 optional native package entries align to 0.28.2. Installed native transform passes after clean installation. |

The initial lock snapshot uses format 3. It changes the root plus 39 package entries belonging to the authorized dependency families. The two removed entries, `get-tsconfig` and `resolve-pkg-maps`, were tsx's old dependency chain. happy-dom stays at 20.10.6; only its root lock declaration is reconciled with the existing exact manifest pin. No new application dependency, script, CI edit, test edit, or source change appears.

Every resolved tarball uses `https://registry.npmjs.org/` with an integrity field. The four target packages have SHA-512 integrity declarations. This inspection establishes lock structure and provenance declarations, not independent verification of every downloaded archive. The in-progress installed tree is not used as evidence.

Read-only public registry metadata checks for [Next.js 15.5.28](https://registry.npmjs.org/next/15.5.28), [PostCSS 8.5.23](https://registry.npmjs.org/postcss/8.5.23), [tsx 4.23.15](https://registry.npmjs.org/tsx/4.23.15), and [esbuild 0.28.2](https://registry.npmjs.org/esbuild/0.28.2) all match the candidate lock's tarball URL and integrity string. These checks use HTTPS reads only, not npm or the in-progress installed tree. No archive was installed or executed by Luna.

Next.js still declares exactly PostCSS 8.4.31 in its package metadata. The explicit parent-scoped override is therefore necessary; updating Next.js alone would leave the vulnerable PostCSS selection. A hoisted PostCSS lock entry does not make the override global. npm's documented nested override semantics constrain it to descendants of Next.js. [npm overrides documentation](https://docs.npmjs.com/cli/v12/configuring-npm/package-json/#overrides).

Declared Node ranges accept the reported local Node 26 and configured CI Node 24. Next.js's React and React DOM peer ranges include the existing 19.2.4 pins. Engine and peer declarations alone do not prove execution compatibility. The PostCSS minor change affects CSS processing, and the tsx/esbuild change affects the test loader/transpilation path, so renewed typechecks, full/supplemental tests, and production build are required. No new test or broad application review is justified by this patch alone.

## Upstream evidence

- Next.js 15.5.28 explicitly lists the critical image-optimization RCE and high Server Actions denial-of-service fixes. [Official release](https://github.com/vercel/next.js/releases/tag/v15.5.28).
- PostCSS 8.5.23 documents a source-map loading security fix. [Official release](https://github.com/postcss/postcss/releases/tag/8.5.23).
- tsx 4.23.15 is an upstream published release with loader fixes. Its locked esbuild dependency range is compatible with the candidate 0.28.2 version. [Official release](https://github.com/privatenumber/tsx/releases/tag/v4.23.15).
- esbuild 0.28.2 is an upstream published release. Presence of that version alone is not an audit PASS. [Official release](https://github.com/evanw/esbuild/releases/tag/v0.28.2).

Dep's initial lock-only zero-vulnerability result was preliminary. The final completed installation now also passes Luna's independent full audit with every severity count zero. No advisory is represented as a demonstrated exploit against Lumio.

## Actual runtime verification

Dep's final evidence directory is `C:/Users/jdtig/AppData/Local/Temp/lumio-dep-m2-remediation-20261023/clean-install`. Luna read `exit-results.json` and the relevant raw logs. All eight recorded exits are zero. The full-suite summary is 116 tests, 116 passing, zero failing/cancelled/skipped/todo. The supplemental summary is two passing, zero failing/skipped. The production build identifies Next.js 15.5.28, compiles successfully, and generates 7/7 static pages including the existing home/wait shells and dynamic connect route.

| Check | Executor and actual evidence |
| --- | --- |
| Clean `npm ci` | Dep, exit 0, `npm-ci.log`. Completed before Luna's runtime commands. |
| Full `npm audit --json` | Luna, exit 0. Info, low, moderate, high, critical, and total counts all zero. Saved at `C:/Users/jdtig/AppData/Local/Temp/lumio-luna-release-audit-20261023.json`. Dep's independent clean-install audit also passes. |
| `npm ls next postcss tsx esbuild --all` | Luna, exit 0. Next 15.5.28 resolves PostCSS 8.5.23 marked overridden. tsx 4.23.15 resolves esbuild 0.28.2. No invalid target dependency is reported. |
| `npm run typecheck` | Luna, exit 0 after the handoff. Dep's clean-install run also passes. |
| Native esbuild smoke check | Luna, exit 0. `require('esbuild').transformSync` compiles a typed declaration with loader `ts`; version equals 0.28.2 and emitted JavaScript matches the expected declaration. |
| Test TypeScript check | Dep, exit 0, `test-typecheck.log`. Luna inspected evidence, did not rerun it. |
| Full `npm test` | Dep, exit 0, 116/116, `npm-test.log`. Luna inspected the actual raw summary, did not execute this run. |
| Supplemental invite contracts | Dep, exit 0, 2/2, `supplemental-contract.log`. Separate from the 116 total. Luna inspected the raw output. |
| Production `npm run build` | Dep, exit 0, `build.log`. Luna inspected the version, compilation and static-page evidence, did not execute this build. |
| Source/test/CI boundary and manifest diff check | Luna, unchanged source/tests/CI/config against b42912f and clean `git diff --check`, with normal LF-to-CRLF notices. |

The clean install warns that npm 12's existing allowScripts policy blocked esbuild's postinstall script. No script policy or package permission was changed. The installed optional native binary works through the real esbuild API smoke check and through Dep's actual transpiled test suite. That warning is retained as evidence, not hidden or misreported as a failed check. No lifecycle approval workaround or new test file was needed.

No npm, build, or test command overlapped Dep's installation. Dep reports restoring the authorized development server to Next.js 15.5.28 on port 3010. Luna did not stop, restart, or call that server.

Final manifest SHA-256 is `6bf313fc35de8cbd2ae7e98e699b27ea68dbdc37239281353b5d23a960803b9f`. Final lockfile SHA-256 is `853b8cc2478bacc55be415b76ecb945c6bb72f74bb926216e7cb981c1fcbc0d1`. Both exactly match the independent security-review snapshot and are unchanged after Dep's final install. The reviewers' static scope therefore still matches the candidate.

## Plugin and ownership notes

Reused the exact installed ponytail, Thermos, pstack, and commit sources read earlier in this session. Main mediated the authorized parallel two read-only Thermos passes and Comment Sicko on the dependency files. No manifest edit was made by Luna during or after Dep's install. Missing deslop/control-ui remains documented as unavailable, never claimed as run. Scope remains the smallest authorized dependency patch, with no new framework, application behavior, test churn, CI change, design exploration, PR, or external message.

All independent review dispositions are complete:

- `RELEASE_DEPENDENCY_SECURITY.md` has no concrete findings. Its official-registry checks cover all 39 changed package records, advisory bounds, engines/peers, and platform metadata. The final manifest/lock hashes match its snapshot. Accepted.
- `RELEASE_DEPENDENCY_QUALITY.md` has no concrete findings. The nested override, exact pins, root lock consistency, removed tsx dependencies, and unchanged helper versions are appropriate. Accepted.
- `RELEASE_DEPENDENCY_COMMENTS.md` is CLEAN, high confidence, with zero comments/suppressions, deletion targets, or MUST KILL flags. Accepted. No deletion or code edit is needed. The targeted override chooses a patched version and is not an audit suppression.

Ponytail-review verdict is Ship for this dependency patch. Ponytail-debt finds no new shortcut markers. No behavior-preserving lean cut or new abstraction is warranted beyond the package-manager's removal of unused transitive packages. The pstack bug-fix sequence uses the observed advisory baseline, minimum version/dependency change, verified installed graph, security audit, and existing project checks. Laziness, subtraction, reader-load, root-cause, verification, and verifiable-unit principles keep this gate scoped and evidence-based. Writing follows unslop and technical-writing. No unexplained semantic change, workaround, or broad refactor remains.

## Commit and Quinn handoff

The commit will contain exactly `package.json`, `package-lock.json`, this report, the three dependency-review reports, and Dep's finalized `DEP_M2_DEPLOYMENT.md`. The latter is included as the completed patch/install evidence and deployment handoff. No other untracked input, environment file, app/test/CI code, schema, asset, or generated output belongs in this commit. A documentation-only child will record the dependency commit SHA.

Quinn must independently verify the committed dependency revision next. Particular compatibility evidence concerns the Next/PostCSS CSS build path and tsx/esbuild module-mock/transpilation path under the existing project commands. Linux native selectors remain in the lock; local Windows checks do not prove remote Linux CI. No broad application re-audit, screenshot session, new tests, or production-service exercise was performed by Luna.

Existing user-owned untracked instructions, specs, assets/inspiration, and the updated session handoff remain untouched. No environment file was manually read, printed, staged, or uploaded. Dep's normal local build loads the existing ignored environment configuration without exposing values. This worker has not pushed, deployed, or invoked another seat. Production environment readiness and provider delivery belong to main/Dep separately and do not change this dependency-gate verdict. No requirement for Vercel CLI authentication is introduced here.
