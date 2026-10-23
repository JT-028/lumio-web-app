# Release dependency quality review

Date: 23 October 2026. Base: `b42912f`.

**Result: no concrete changed-scope code-quality findings.** Static manifest/lockfile consistency review is complete; installed validation and release gates remain pending. This is not an install, audit, test, build, or deployment PASS.

Scope: only the working-tree diffs of `package.json` and `package-lock.json`, using the retained installed Thermos rubric. Read `DEP_M2_DEPLOYMENT.md` for remediation intent. No application review or additional upgrades proposed.

## Evidence

- `package.json:15`: Next `15.5.27` → `15.5.28` stays on the existing patch line. Lockfile Next, `@next/env`, and all eight recorded SWC platform packages align at `15.5.28`. Existing React `19.2.4` satisfies the published Next peer ranges.
- `package.json:25`: tsx `4.21.0` → `4.23.15` stays within 4.x. Its published dependency is esbuild `~0.28.0`, which admits locked `0.28.2`; the lockfile's esbuild platform entries uniformly use `0.28.2`. No forced esbuild override is introduced.
- `package.json:28–32`: `overrides.next.postcss = "8.5.23"` targets Next's dependency subtree rather than globally replacing PostCSS. Published Next `15.5.28` still declares PostCSS exactly `8.4.31`; preserving that declaration in the lockfile while resolving `node_modules/postcss` to `8.5.23` is expected override behavior, not manifest/lock drift. This crosses Next's requested exact pin, so compatibility still needs Dep's installed build/regression checks.
- Parsed every direct production/development dependency: manifest specifications match the lockfile root specifications and locked versions. The happy-dom root metadata correction (`^20.10.6` → `20.10.6`) reconciles an existing mismatch; its package version remains unchanged.
- Semantic lockfile comparison found only the stated upgrade families, PostCSS metadata, and removal of tsx's former `get-tsconfig`/`resolve-pkg-maps` dependencies. No retained references to those removed packages remain. Existing locked PostCSS helper versions satisfy its new ranges. There are no additional nested Next/tsx/PostCSS/esbuild copies in this lockfile.
- Compared the four core updated packages' resolved tarball URLs and integrity values directly with the official registry: all match. Registry reads were GET requests only; no package-manager operation ran.

Sources checked: [Next 15.5.28 registry metadata](https://registry.npmjs.org/next/15.5.28), [tsx 4.23.15 metadata](https://registry.npmjs.org/tsx/4.23.15), [PostCSS 8.5.23 metadata](https://registry.npmjs.org/postcss/8.5.23), [esbuild 0.28.2 metadata](https://registry.npmjs.org/esbuild/0.28.2). The web reader could not open these JSON endpoints; direct read-only registry requests succeeded. Advisory history and the lockfile audit result remain Dep's reported evidence, not an independently completed security gate here.

## Limits and ownership

No installed-tree inspection, npm commands, install, tests, build, credentials, git writes, push, or deployment. Dep's ongoing installation was left untouched. No manifest, lockfile, or application edits. Only this report was written via `apply_patch`; Luna owns eventual fixes and commit. Recheck installed resolution, audit, and regression gates after installation before treating the dependency remediation as release-ready.
