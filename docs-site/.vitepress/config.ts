import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vitepress'

const here = import.meta.dirname
const repoRoot = resolve(here, '../..')
const docsRoot = resolve(repoRoot, 'packages/workbench/docs')
const manifest = JSON.parse(readFileSync(resolve(docsRoot, 'manifest.json'), 'utf8'))

const sections = manifest.sections
  .map((section: { id: string; title: string }) => {
    const items = manifest.pages
      .filter((page: { section: string }) => page.section === section.id)
      .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
      .map((page: { route: string; title: string }) => ({ text: page.title, link: page.route }))
    return items.length > 0 ? { text: section.title, items } : null
  })
  .filter(Boolean)

export default defineConfig({
  lang: 'en-US',
  title: manifest.title,
  description: manifest.description,
  base: '/desktop-ui-template/docs/',
  srcDir: resolve(here, '../content'),
  srcExclude: ['public/**'],
  outDir: resolve(here, '../dist'),
  cleanUrls: true,
  lastUpdated: false,
  head: [
    ['meta', { name: 'theme-color', content: '#181818' }],
    ['link', { rel: 'icon', href: '/desktop-ui-template/favicon.svg' }],
  ],
  themeConfig: {
    nav: [
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Concepts', link: '/concepts' },
      { text: 'Recipes', link: '/recipes/add-view' },
      { text: 'Reference', link: '/reference/api' },
      { text: 'For AI agents', link: '/guides/for-ai-agents' },
    ],
    sidebar: sections,
    search: { provider: 'local' },
    outline: { level: [2, 3] },
    socialLinks: [{ icon: 'github', link: 'https://github.com/mode777/desktop-ui-template' }],
    footer: {
      message: 'Workbench Kit is MIT licensed. The package is browser-only and 0.x.',
      copyright: 'Copyright the Workbench Kit contributors',
    },
    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },
    returnToTopLabel: 'Return to top',
    sidebarMenuLabel: 'Menu',
    darkModeSwitchLabel: 'Appearance',
  },
})
