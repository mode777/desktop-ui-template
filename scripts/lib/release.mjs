import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

const REQUIRED_FACADE_FILES = ['LICENSE', 'THIRD_PARTY_NOTICES.md']

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function problem(rule, file, message) {
  return { rule, file, message }
}

/**
 * Checks the publishable package metadata, shared version, changelog heading
 * and license material. It reads the repository declarations; it does not pack.
 */
export function checkRelease(repoRoot) {
  const problems = []
  const configPath = resolve(repoRoot, 'distribution.json')

  if (!existsSync(configPath)) {
    return {
      version: null,
      facadeName: null,
      internalCount: 0,
      problems: [problem('missing-distribution', configPath, 'Missing distribution.json.')],
    }
  }

  const config = readJson(configPath)
  const facadeDir = resolve(repoRoot, config.publicPackage.path)
  const facadeManifestPath = resolve(facadeDir, 'package.json')

  if (!existsSync(facadeManifestPath)) {
    return {
      version: null,
      facadeName: null,
      internalCount: config.internalModules.length,
      problems: [
        problem('missing-manifest', facadeManifestPath, 'Missing public facade manifest.'),
      ],
    }
  }

  const facade = readJson(facadeManifestPath)
  const version = facade.version
  const internalModules = config.internalModules.map((entry) => ({
    ...entry,
    manifestPath: resolve(repoRoot, entry.path, 'package.json'),
  }))

  for (const entry of internalModules) {
    if (!existsSync(entry.manifestPath)) {
      problems.push(
        problem('missing-manifest', entry.manifestPath, 'Missing internal module manifest.'),
      )
      continue
    }

    const manifest = readJson(entry.manifestPath)

    if (manifest.version !== version) {
      problems.push(
        problem(
          'version-mismatch',
          entry.manifestPath,
          `${entry.name} is ${manifest.version}; expected ${version} from the public facade.`,
        ),
      )
    }

    if (manifest.private !== true) {
      problems.push(
        problem('internal-module-public', entry.manifestPath, `${entry.name} must stay private.`),
      )
    }
  }

  if (facade.private === true) {
    problems.push(
      problem(
        'facade-private',
        facadeManifestPath,
        'The public facade must not be marked private.',
      ),
    )
  }

  if (facade.name !== config.publicPackage.name) {
    problems.push(
      problem(
        'facade-name',
        facadeManifestPath,
        `Facade name is ${facade.name}; distribution.json expects ${config.publicPackage.name}.`,
      ),
    )
  }

  const metadata = [
    ['license', facade.license],
    ['repository.url', facade.repository?.url],
    ['homepage', facade.homepage],
    ['bugs.url', facade.bugs?.url],
  ]

  for (const [field, value] of metadata) {
    if (typeof value !== 'string' || value.length === 0) {
      problems.push(
        problem('missing-metadata', facadeManifestPath, `The public facade is missing ${field}.`),
      )
    }
  }

  if (facade.publishConfig?.access !== 'public') {
    problems.push(
      problem(
        'missing-publish-access',
        facadeManifestPath,
        'The public facade must declare publishConfig.access "public".',
      ),
    )
  }

  for (const file of REQUIRED_FACADE_FILES) {
    if (!(facade.files ?? []).includes(file)) {
      problems.push(
        problem(
          'missing-shipped-file',
          facadeManifestPath,
          `The public facade files list must include ${file}.`,
        ),
      )
    }
  }

  for (const file of REQUIRED_FACADE_FILES) {
    const path = resolve(repoRoot, file)
    if (!existsSync(path)) {
      problems.push(problem('missing-license-material', path, `Missing root ${file}.`))
    }
  }

  const changelogPath = resolve(repoRoot, 'CHANGELOG.md')
  if (!existsSync(changelogPath)) {
    problems.push(problem('missing-changelog', changelogPath, 'Missing CHANGELOG.md.'))
  } else {
    const changelog = readFileSync(changelogPath, 'utf8')
    const heading = new RegExp(`^##\\s+\\[?${escapeRegExp(version)}\\]?(?:\\s|$)`, 'm')
    if (!heading.test(changelog)) {
      problems.push(
        problem(
          'missing-changelog-heading',
          changelogPath,
          `CHANGELOG.md has no heading for version ${version}.`,
        ),
      )
    }
  }

  return {
    version,
    facadeName: facade.name,
    internalCount: internalModules.length,
    problems,
  }
}

export function formatReleaseProblem(problemEntry, repoRoot) {
  return `${relative(repoRoot, problemEntry.file)}: ${problemEntry.message} (${problemEntry.rule})`
}
