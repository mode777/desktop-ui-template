# Tasks

## 1. Rename the public package to vscode-workbench

- [x] 1.1 Change the facade name in `packages/workbench/package.json` to `vscode-workbench`, update `distribution.json` and the `boundaries.json` mapping, and change the root `build:facade` workspace selector. Run `npm install` to refresh `package-lock.json`. Verify `npm ls vscode-workbench --depth=0`, `npm run check:distribution` and `npm run check:boundaries` pass.
- [x] 1.2 Replace the public specifier in the check scripts and their tests: `scripts/lib/docs.mjs`, `scripts/check-docs.mjs`, `scripts/check-quickstart.mjs`, `scripts/check-workbench-pack.mjs`, `scripts/lib/adoption.mjs`, `scripts/lib/pack-check.mjs` and the fixtures in `scripts/lib/*.test.mjs` and `scripts/check-workbench-pack.test.mjs`. Verify the targeted tests pass and `rg` finds no active reference to the old public specifier.
- [x] 1.3 Update the consumer and contributor docs, the package README and `AGENTS.md`, `THIRD_PARTY_NOTICES.md`, `apps/minimal/README.md`, the demo mock workspace and its test, `packages/workbench/docs/manifest.json`, and regenerate `packages/workbench/llms.txt`. Verify `npm run check:docs`, `npm run generate:llms` and `npm run build:docs` pass.
- [x] 1.4 Update `CHANGELOG.md` and `packages/workbench/docs/changelog.md`: the prepared `0.1.0` release describes `vscode-workbench`, and the `Unreleased` section records the pre-release rename from the provisional name. Verify `npm run check:release` passes.

## 2. Tag guard and publish workflow

- [x] 2.1 Add `checkReleaseTag` to `scripts/lib/release.mjs` and a `scripts/check-release-tag.mjs` CLI that compares `--tag` with the facade version from `distribution.json`; add `check:release-tag` to the root scripts. Verify with unit tests for matching and mismatched tags and by running `npm run check:release-tag -- --tag v0.1.0` and a mismatched tag locally.
- [x] 2.2 Extend `checkRelease` in `scripts/lib/release.mjs` to require `.github/workflows/publish.yml` and fail on a missing `v*` tag trigger, missing `id-token: write`/`contents: read`, any `NPM_TOKEN`, `NODE_AUTH_TOKEN` or `_authToken` reference, or a publish target outside `packages/workbench`. Add fixture workflow content to `scripts/lib/release.test.mjs` and one test per drift rule. Verify with `npm test -- scripts/lib/release.test.mjs`.
- [x] 2.3 Add `.github/workflows/publish.yml` with a `v*` tag trigger, `contents: read` plus job-level `id-token: write`, `actions/setup-node@v7` on `.nvmrc` with `registry-url` and caching disabled, `npm ci`, `npm run check`, `npm run check:release-tag -- --tag "$GITHUB_REF_NAME"`, and `npm publish --access public --provenance` from `packages/workbench`. Verify `npm run check:release` passes the new static guard and `git diff --check` reports no whitespace errors; GitHub validates the workflow on the first push.

## 3. Release documentation and repository guidance

- [x] 3.1 Rewrite the publish sections of `docs/release.md`: add the table of contents entries, the one-time `vscode-workbench@0.0.0-bootstrap.0` placeholder under the `bootstrap` tag, the trusted-publisher settings (`mode777`, `vscode-workbench`, `publish.yml`, empty environment), the automatic tag-release flow, the updated pre-release checklist ending in a tag push, and post-publish provenance/placeholder cleanup checks. Verify `npm run check:docs:contributor` passes and every `npm run` command named in the document exists.
- [x] 3.2 Update `AGENTS.md`, `docs/architecture.md`, `docs/migration.md` and `ROADMAP.md` to replace the provisional package name, the manual-publish policy and the CI-no-credentials statements with `vscode-workbench`, the one-time bootstrap and the OIDC tag workflow. Verify `npm run check:docs:contributor` and `npm run check:release` pass.
- [x] 3.3 Add a short troubleshooting note to `docs/release.md` covering an unavailable unscoped name, the trusted-publisher repository/workflow mismatch, missing `id-token: write`, npm below 11.5.1, and tag/version mismatch. Verify the note names each error and the exact fix.

## 4. Integration verification

- [x] 4.1 Run `npm run check` and confirm lint, formatting, typecheck, boundaries, distribution, both documentation checks, release checks, tests, all builds, example checks and `pack:check` pass.
- [x] 4.2 Run `npm run check:release-tag -- --tag v0.1.0` and a mismatched tag; confirm the first passes and the second exits non-zero with both versions.
- [x] 4.3 Run `npm pack --dry-run --json` from `packages/workbench` and confirm the tarball is named `vscode-workbench-0.1.0.tgz`, contains the facade output, license material, consumer docs and `llms.txt`, and has no private workspace dependency.
- [x] 4.4 Run `openspec validate add-npm-trusted-publishing --strict` and confirm the change validates without warnings.

## Owner activation (after merge, not part of code apply)

- Confirm `npm view vscode-workbench version` still returns 404 immediately before the bootstrap.
- Run the placeholder bootstrap from `docs/release.md` and confirm `npm view vscode-workbench dist-tags --json` shows `bootstrap`.
- Register the trusted publisher in the npm package settings; do not create an `NPM_TOKEN` secret.
- Push the `v0.1.0` tag and confirm the workflow publishes `0.1.0` to `latest` with provenance.
- Verify a clean consumer install, deprecate `0.0.0-bootstrap.0`, remove the `bootstrap` dist-tag, and flip `availability` to `published`.

## Workflow follow-up

- Archive the change after the implementation and documentation are reviewed and merged.
- Verify the archived release-readiness, adoption-documentation and style-entries specs keep the `vscode-workbench`, bootstrap and OIDC requirements.
