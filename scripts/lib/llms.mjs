const RAW_PREFIX = '/docs/raw/'

export function rawPathFor(page) {
  return `${RAW_PREFIX}${page.path}`
}

export function rawUrlFor(manifest, page) {
  return `${manifest.siteUrl.replace(/\/$/, '')}${rawPathFor(page)}`
}

function pageLine(manifest, page) {
  return `- [${page.title}](${rawUrlFor(manifest, page)}): ${page.description}`
}

function groupPages(manifest) {
  const bySection = new Map(manifest.sections.map((section) => [section.id, []]))
  for (const page of manifest.pages) {
    const pages = bySection.get(page.section)
    if (!pages) throw new Error(`Page "${page.path}" uses unknown section "${page.section}".`)
    pages.push(page)
  }
  for (const pages of bySection.values()) pages.sort((a, b) => a.order - b.order)
  return bySection
}

export function renderLlmsIndex(manifest) {
  const availability =
    manifest.availability === 'published'
      ? 'published on the public npm registry'
      : 'preview; not yet on the public npm registry'
  const groups = groupPages(manifest)
  const sections = manifest.sections
    .map((section) => {
      const pages = groups.get(section.id)
      if (!pages || pages.length === 0) return ''
      return `## ${section.title}\n\n${pages.map((page) => pageLine(manifest, page)).join('\n')}`
    })
    .filter(Boolean)
    .join('\n\n')

  return `# ${manifest.title}

> ${manifest.description}

Package: \`${manifest.packageName}\` ${manifest.version}. Availability: ${availability}.

${sections}
`
}

export function renderLlmsFull(manifest, readPage) {
  const groups = groupPages(manifest)
  const pages = manifest.sections.flatMap((section) => groups.get(section.id) ?? [])
  const body = pages
    .map((page) => {
      const content = readPage(page.path).trimEnd()
      return `## ${page.title}\n\nSource: ${rawUrlFor(manifest, page)}\n\n${content}`
    })
    .join('\n\n---\n\n')

  return `# ${manifest.title} full documentation

> ${manifest.description}

Package: \`${manifest.packageName}\` ${manifest.version}. Availability: ${manifest.availability}.

${body}
`
}

export function validateManifest(manifest) {
  const problems = []
  const seen = new Set()

  if (!manifest.packageName) problems.push('manifest.packageName is required')
  if (!manifest.version) problems.push('manifest.version is required')
  if (!manifest.siteUrl) problems.push('manifest.siteUrl is required')
  if (!Array.isArray(manifest.sections) || manifest.sections.length === 0) {
    problems.push('manifest.sections must be a non-empty array')
  }
  if (!Array.isArray(manifest.pages) || manifest.pages.length === 0) {
    problems.push('manifest.pages must be a non-empty array')
  }

  const sectionIds = new Set((manifest.sections ?? []).map((section) => section.id))
  for (const page of manifest.pages ?? []) {
    if (!page.path || !page.title || !page.description || !page.section || !page.order) {
      problems.push(`page ${page.path ?? '(missing path)'} is missing a required field`)
    }
    if (seen.has(page.path)) problems.push(`duplicate page ${page.path}`)
    seen.add(page.path)
    if (page.section && !sectionIds.has(page.section)) {
      problems.push(`page ${page.path} uses unknown section ${page.section}`)
    }
  }

  return problems
}
