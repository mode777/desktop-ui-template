# Design

## Context

See `proposal.md` for motivation. The current state that shapes the design:

- `packages/workbench` is the only publishable package; its manifest already
  declares `publishConfig.access: "public"`, the repository metadata and the
  shipped files. The five internal modules stay `private: true`.
- The facade’s original scoped name is unavailable, so the final public name is
  the available unscoped package `vscode-workbench`. The old name was never
  published, so the rename has no consumer migration.
- The rename touches the facade manifest, `distribution.json`,
  `boundaries.json`, the root workspace selector, the lockfile, consumer docs,
  fixtures, mocks, generated `llms.txt` and the checks that embed the public
  specifier. The internal `@workbench-kit/*` modules are not renamed.
- `npm run check` builds the facade, runs the packed-tarball check and is
  already the release gate in `docs/release.md`.
- CI runs on GitHub Actions with `actions/checkout@v7` and
  `actions/setup-node@v7`; the Pages workflow already uses OIDC.
- `.nvmrc` selects Node 24. npm trusted publishing requires npm 11.5.1 or later
  and a GitHub-hosted runner; Node 24 ships a compatible npm.
- `docs/release.md`, `AGENTS.md`, `docs/architecture.md` and `ROADMAP.md`
  currently say publishing is manual and CI must not publish. That policy is
  deliberately reversed here; the owner has now chosen the final name.

## Goals / Non-Goals

**Goals:**

- Rename the public facade to `vscode-workbench` consistently before the first
  publish, without renaming the private internal modules.
- Make a pushed `v<version>` tag the release action for every release after a
  one-time bootstrap.
- Publish only the facade, with public access and provenance, using short-lived
  OIDC credentials.
- Fail closed on tag/version drift, failed verification, missing OIDC permission
  or publish-workflow drift.
- Give the owner a copy-paste bootstrap that creates the npm package before the
  trusted publisher is configured.

**Non-Goals:**

- Renaming the five internal `@workbench-kit/*` modules; they stay private and
  are never published.
- Publishing internal modules, adding a second package or changing the public
  API shape.
- Automating version bumps, changelog authoring or GitHub release notes.
- Prerelease dist-tag automation. Stable releases publish to `latest`; the
  bootstrap placeholder uses `bootstrap`. A prerelease policy can be added when
  there is a real prerelease to ship.
- npm staged publishing and a required-reviewer GitHub environment. Both add a
  review step that conflicts with “a tag publishes automatically”; they remain
  compatible follow-ups if the owner later wants an approval gate.

## Decisions

### 1. Rename the public facade to `vscode-workbench` before bootstrapping

The public specifier moves from the unavailable scoped form to
`vscode-workbench` (and its subpaths become `vscode-workbench/react`,
`vscode-workbench/core`, `vscode-workbench/elements/*`,
`vscode-workbench/styles/*`). The replacement is limited to the public facade;
`@workbench-kit/core`, `@workbench-kit/react`, `@workbench-kit/elements`,
`@workbench-kit/styles-vscode` and `@workbench-kit/preset-vscode` keep their
names and `private: true`.

The source of truth for the public name becomes the facade manifest; the
distribution declaration, boundary map, root workspace selector and lockfile are
updated to match. The consumer docs, package docs, fixtures, mocks and the
scripts that embed the public specifier are updated in the same commit so the
packed-consumer, quickstart, adoption and documentation checks exercise the new
name rather than silently skipping stale references.

Alternatives considered:

- **Create the `@workbench-kit` organization**: the scope is unavailable, so
  this is not an option.
- **Publish under the owner’s user scope** (`@mode777/workbench`): available, but
  the owner chose an unscoped package.
- **Use another unscoped name**: `workbench-kit` is already taken; the owner
  chose the available `vscode-workbench`.
- **Keep the provisional name in the repository and only change it in the
  bootstrap**: the docs, fixtures and packed-consumer checks would exercise a
  name that is not published.

The name uses the VS Code trademark. The owner accepted it as the package name;
the product can still present itself as “Workbench Kit” in human-facing prose,
and the repository’s non-goal about not becoming a VS Code clone in branding
remains. If npm or Microsoft objects, the rename path is another pre-release
identity change, not a code migration.

### 2. Use npm trusted publishing instead of an npm token

The publish job authenticates with the GitHub OIDC token (`id-token: write`) and
npm is configured with this repository and workflow as the package’s trusted
publisher. npm issues a short-lived credential per run and generates a provenance
attestation. No `NPM_TOKEN` secret, `.npmrc` token or long-lived credential is
stored.

Alternatives considered:

- **`NPM_TOKEN` repository secret**: simple, but a stealable long-lived
  credential and a direct conflict with the repository’s credential policy.
- **npm staged publishing**: adds a maintainer approval step and requires a newer
  npm CLI; it is a good future hardening option, not the requested automatic
  flow.
- **Publish from a local machine after tagging**: keeps the old manual step and
  does not satisfy the tag-driven requirement.

### 3. Bootstrap a placeholder package before configuring trust

npm only offers trusted-publisher settings for a package that already exists, so
the first publish is a one-time placeholder under the final name. It uses a
pre-release version and a non-`latest` dist-tag so consumers cannot install it by
accident. Because the name is unscoped, no npm organization is needed:

```bash
tmp="$(mktemp -d)"
cd "$tmp"

cat > package.json <<'JSON'
{
  "name": "vscode-workbench",
  "version": "0.0.0-bootstrap.0",
  "description": "Bootstrap placeholder for vscode-workbench; superseded by 0.1.x.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mode777/vscode-workbench.git",
    "directory": "packages/workbench"
  }
}
JSON

npm login
npm whoami
npm publish --access public --tag bootstrap
```

Before running it, confirm the account and the name:

- `npm whoami` prints the account that will own the trusted-publisher
  configuration.
- `npm view vscode-workbench version` returns 404 before the bootstrap and the
  published version after it. The name was confirmed free when the plan was
  written; if it becomes unavailable before the bootstrap, stop and choose
  another approved name rather than publishing under a name the owner does not
  control.
- The command runs outside the repository on purpose: it must not pick up the
  workspace, a lifecycle script or the facade build.

A `404 Not Found` on the `PUT` is not a login failure; a 401 is the login failure.
For an unscoped name, a 404 after authentication means the name is no longer
available or the account cannot publish it. Do not create a token to work around
it. The local npm version only needs to publish the placeholder; the npm 11.5.1+
requirement applies to the later trusted-publishing runner.

After the placeholder exists, the owner configures the trusted publisher in the
npm package settings:

| Setting           | Value                                              |
| ----------------- | -------------------------------------------------- |
| Package           | `vscode-workbench`                                 |
| Provider          | GitHub Actions                                     |
| Organization/user | `mode777`                                          |
| Repository        | `vscode-workbench`                                 |
| Workflow filename | `publish.yml`                                      |
| Environment       | leave empty (the workflow declares no environment) |

The trust is pinned to the exact repository and workflow filename. Renaming
`publish.yml` or transferring the repository requires updating the npm setting
in the same release cycle. No npm token is created.

Alternatives considered:

- **Publish the real `0.1.0` first**: makes the first release depend on a local
  machine and gives no safe way to test the trust setup before shipping the
  actual version.
- **Bootstrap under a different name**: trust is per package; a different name
  would not establish the package the tag workflow publishes.

### 4. Trigger on `v*` tags with a hard tag/version guard

The workflow triggers on `push` tags matching `v*`, and a dedicated guard fails
the run unless `GITHUB_REF_NAME` is exactly `v<facade version>`. The guard reads
the facade path from `distribution.json`, so a future path move does not leave a
stale hard-coded check.

The `v*` trigger is deliberately broad enough to catch malformed tags and report
a useful error; the guard, not the glob, is the release gate. `workflow_dispatch`
is not used because trusted-publisher validation is tied to the workflow that
contains the publish command, and a tag push is the requested release action.

Alternatives considered:

- **Publish on GitHub release publication**: also automatic, but adds a second
  manual action (drafting a release) before the tag’s effect.
- **Publish on `main` pushes**: releases every merge instead of only intentional
  version tags.
- **Trust only the glob without a guard**: a mistyped tag could publish the
  wrong version or fail with an opaque registry error.

### 5. Run the full verification command in the publish job

The job runs `npm ci`, `npm run check` and both bundle-size reports before
publishing. `check` already covers lint, formatting, typecheck, boundaries,
distribution, documentation, release metadata, tests, all three builds, both
example composition checks and `pack:check`; the size steps reuse the template
and minimal builds. Publishing then reuses the facade `dist/` produced by that
command. The release job does not use npm caching (`package-manager-cache:
false`) so a release build cannot be influenced by a stale cache.

Alternatives considered:

- **Trust the `main` CI run**: a tag can point outside `main` or at a commit
  whose CI run is stale; the release job must verify the exact tagged tree.
- **Run only `check:release` and `pack:check`**: faster, but skips the example
  builds and tests that the release policy requires.

### 6. Publish the facade only, from its package directory

The publish step runs `npm publish --access public --provenance` with
`working-directory: packages/workbench`. The facade’s `publishConfig.access` is
already `public`; the flag makes the intent explicit. No workspace-wide publish
flag is used, so npm cannot publish the five private modules. `check:distribution`
and `pack:check` continue to enforce the one-package surface before this step.

Alternatives considered:

- **`npm publish --workspaces`**: would attempt to publish every workspace and
  is exactly the failure mode the distribution rules forbid.
- **Publish from the repository root with `-w`**: works, but makes the publish
  target less obvious in the workflow and in logs.

### 7. Separate the static workflow guard from the tag guard

- `scripts/check-release-tag.mjs` (npm script `check:release-tag`) is release
  context only: it compares the pushed tag with the facade version and exits
  non-zero with both values on mismatch.
- `checkRelease` in `scripts/lib/release.mjs` gains static checks for
  `.github/workflows/publish.yml`: it must trigger on `v*` tags, grant
  `id-token: write` and `contents: read`, contain no `NPM_TOKEN`,
  `NODE_AUTH_TOKEN` or `_authToken` reference, and publish from
  `packages/workbench`. These checks run inside `npm run check`, so a workflow
  edit that breaks publishing fails normal verification before a tag exists.

The static check uses targeted regular expressions over the small workflow file
rather than adding a YAML parser dependency. The workflow shape is owned by this
repository, and each rule gets a fixture test so a failure names the exact rule.

Alternatives considered:

- **Parse YAML with a new dependency**: more general, but adds a dependency for
  one small file and does not make the semantic checks easier.
- **No static check**: the workflow could lose `id-token: write` or gain a token
  reference and only fail at tag time.

### 8. Keep the release job on GitHub-hosted runners and Node 24

Trusted publishing supports GitHub-hosted runners; self-hosted runners are out of
scope. `actions/setup-node@v7` uses `.nvmrc` (Node 24), which provides npm 11.x
and satisfies the npm 11.5.1 minimum. The workflow does not install a global npm
or pin a second Node version; the repository already pins Node through `.nvmrc`.

### 9. No environment approval gate by default

The workflow has no `environment:` key, so a matching tag publishes without a
second approval. This matches the requested behavior and keeps the trusted
publisher configuration simple (empty environment). The owner can add a
protected `npm-publish` environment later; that requires adding the same
environment name to both the workflow and the npm trusted-publisher settings,
and turns the tag into an approval request rather than a fully automatic
release.

## Risks / Trade-offs

- **Unscoped name becomes unavailable before the bootstrap** → `vscode-workbench`
  is free today, but another publisher could take it. Publish the placeholder
  promptly after merge and verify `npm view vscode-workbench version` returns 404
  immediately before the bootstrap. If it is taken, stop and choose a new name.
- **The name uses the VS Code trademark** → the owner accepted it. Keep the
  product presentation distinct and be ready to rename if challenged; the code
  impact is another public-specifier replacement, not a behavior change.
- **Stale provisional references remain** → replace the public string across
  manifests, scripts, tests, docs, mocks and fixtures, then verify with a
  repository search that excludes historical OpenSpec artifacts. The quickstart,
  adoption, documentation and packed-consumer checks exercise the new name.
- **Trusted-publisher misconfiguration** (wrong owner, repository, workflow
  filename or environment) → npm returns an authentication/404 error. The release
  docs list the exact values and a troubleshooting checklist; the static check
  keeps the workflow filename and OIDC permission intact.
- **Tag/version drift** → the tag guard fails before publish and prints both
  versions; tag protection should restrict who can create release tags.
- **A compromised maintainer account or tag can publish** → enable 2FA, protect
  `main` and `v*` tags, require reviews, and keep the publish workflow limited to
  `contents: read` plus `id-token: write`. A protected environment with required
  reviewers is the escalation path.
- **Full verification makes the release job slow** → release tags are infrequent;
  correctness is worth the runtime, and caching is intentionally disabled.
- **Node/npm below the trusted-publishing minimum** → Node 24 from `.nvmrc`
  supplies npm 11.x. If a future Node image regresses, the publish step fails
  with an authentication error and the docs record the minimum.
- **Bootstrap placeholder remains on the registry** → publish it under the
  `bootstrap` tag, then deprecate it and remove the dist-tag after the first real
  release. Do not unpublish it.
- **Static workflow check is formatting-sensitive** → keep the workflow small and
  conventional; fixture tests cover each required line and the failure messages
  name the rule.
- **Publishing from a workspace directory could accidentally include workspace
  state** → `pack:check` already validates the tarball, and the publish step uses
  the facade directory explicitly with no workspace publish flag.

## Migration Plan

No runtime migration. The rollout is:

1. Rename the public facade and every active public reference to
   `vscode-workbench`; regenerate the lockfile and `llms.txt`; run the full
   verification.
2. Merge the workflow, tag guard, release-check extension and documentation.
3. Run the placeholder bootstrap for `vscode-workbench` and configure the npm
   trusted publisher.
4. Bump the six manifests and the changelog, commit, then push the `v<version>`
   tag. The workflow verifies and publishes.
5. Verify the published tarball, provenance and consumer install; deprecate the
   placeholder and remove the `bootstrap` dist-tag; flip the docs availability to
   `published`.

Rollback:

- If verification fails, no version is published; fix, move the tag (if tag
  protection allows) or publish the next patch.
- If the publish step fails after a version is created, do not unpublish by
  default: fix the cause, publish a patch and deprecate the bad version. If the
  trusted-publisher configuration is wrong, correct it in npm settings; the next
  tag run does not need a code change.
- If the workflow itself is compromised, disable the workflow and remove the
  trusted publisher in npm before restoring it.
- If the name must change after the placeholder exists, the placeholder remains
  on the old name; bootstrap the new name and deprecate the old one. Do not
  unpublish the placeholder.

## Open Questions

None blocking. The optional protected environment (decision 9) and prerelease
dist-tags are deferred until the owner needs them; both can be added without
changing the bootstrap or the tag/version contract.
