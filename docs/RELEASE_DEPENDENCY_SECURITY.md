# Release dependency security review

23 October 2026. Independent Thermos review of only the uncommitted `package.json` and `package-lock.json` diff against `b42912fb93b8b7f27083051d9d645e4246ce081b`. Retained the exact installed plugin rubric from the prior reviews; `DEP_M2_DEPLOYMENT.md` supplied remediation context.

**Static review result: no concrete changed-scope findings. Confidence: high for the manifest, lock metadata, and published patch boundaries. Installed compatibility and release gates remain unverified by this reviewer.**

## Advisory bounds

Verified the published boundaries rather than treating an audit's suggested Next.js update as sufficient for its transitive dependencies.

| Advisory | Published affected range relevant here | Fixed boundary / locked result |
| --- | --- | --- |
| [Next SVG image optimization RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) | `>=10.0.0 <=15.5.27` on this release line | Next `15.5.28`; existing lock also retains `sharp@0.35.5`, meeting the maintainer's `>=0.35.5` workaround requirement. |
| [Next Server Actions denial of service](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r) | `>=13.0.0 <=15.5.27` on this release line | Next `15.5.28`. |
| [PostCSS stringify XSS](https://github.com/postcss/postcss/security/advisories/GHSA-qx2v-qp2m-jg93) | `<8.5.10` | Fixed `8.5.10`; locked `8.5.23`. |
| [PostCSS source-map file disclosure](https://github.com/postcss/postcss/security/advisories/GHSA-6g55-p6wh-862q) | `<=8.5.11` | Fixed `8.5.12`; locked `8.5.23`. |
| [PostCSS source-map traversal](https://github.com/postcss/postcss/security/advisories/GHSA-r28c-9q8g-f849) | `<=8.5.17` | Fixed `8.5.18`; locked `8.5.23`. |
| [PostCSS incomplete source-map fix](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp) | `<=8.5.22` | Fixed and locked `8.5.23`. |
| [esbuild Windows development-server file read](https://github.com/evanw/esbuild/security/advisories/GHSA-g7r4-m6w7-qqqr) | [Reviewed advisory range](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr): `>=0.27.3 <0.28.1`; maintainer page lists affected `0.27.3` and patched `>=0.28.1` | Locked `0.28.2`. |

No application exploitability claim or exploit testing was made.

## Manifest, lockfile, and compatibility evidence

- Root dependency/devDependency declarations match lockfile v3 metadata exactly. Happy-dom's root lock declaration now matches the already-exact manifest pin; its package remains `20.10.6`.
- Read-only HTTPS queries to the official npm registry verified **all 39 changed package records**: tarball URLs, integrity values, dependency/optional/peer metadata, engines, and OS/CPU/libc selectors match published metadata. No alternate registry, URL credentials, file/git dependency source, or removed integrity value was introduced. This compares metadata; it does not hash downloaded package contents or attest installed files.
- [Next `15.5.28` registry metadata](https://registry.npmjs.org/next/15.5.28) still declares PostCSS `8.4.31`. The root `overrides.next.postcss = "8.5.23"` is therefore necessary. The lock contains one PostCSS package, `8.5.23`; retaining the original `8.4.31` dependency declaration inside Next's lock metadata is expected, not a second installed resolution. The nesting follows [npm's documented parent-scoped overrides](https://docs.npmjs.com/cli/v12/configuring-npm/package-json/#overrides).
- [tsx `4.23.15` registry metadata](https://registry.npmjs.org/tsx/4.23.15) requests esbuild `~0.28.0`, which accepts the locked `0.28.2`. Removing `get-tsconfig` and its `resolve-pkg-maps` dependency follows the new published tsx dependency list.
- All **26 esbuild platform packages** remain present at `0.28.2`; all **eight Next SWC platform packages** remain present at `15.5.28`, matching the parent packages' exact optional requirements. Optional flags and platform selectors are preserved. Sharp's optional package entries are also present. No Windows-only lock pruning or missing Linux deployment binary was found.
- Declared engines permit the reported Node `26.12.1` runtime and the existing CI/Docker Node `24.18.0`: Next accepts Node `>=20` on these lines, tsx/esbuild require Node `>=18`, and PostCSS accepts Node `>=14`. Existing React/React DOM `19.2.4` satisfy Next's published peer ranges. These are metadata compatibility checks, not execution proof.
- Package scripts are unchanged. No audit threshold reduction, suppression, forced upgrade, lifecycle-script addition, or secret was introduced. `git diff --check -- package.json package-lock.json` passed with normal LF/CRLF notices.

## Validation boundary and handoff

Dep owns the ongoing install; Luna owns any fixes and commit. This reviewer did not run npm, install, audit, tests, typechecks, build, or executable package validation, and did not read the changing installed tree. Dep's reported zero-vulnerability lock audit was not independently rerun. Fresh installed-tree audit, native-package consistency, regression checks, and production build remain required before a finished gate or deployment claim. Engine/peer compatibility alone does not prove PostCSS override or tsx loader compatibility with this project.

Snapshot SHA-256: manifest `6bf313fc35de8cbd2ae7e98e699b27ea68dbdc37239281353b5d23a960803b9f`; lockfile `853b8cc2478bacc55be415b76ecb945c6bb72f74bb926216e7cb981c1fcbc0d1`. Reassess if the install changes either file.

Only this local report was written using `apply_patch`. No manifest/lock/application edits, credential access, git writes, nested delegates, push, deployment, or live application services. No PR discussion step was triggered because no medium-or-higher finding remains.
