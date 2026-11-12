/**
 * Vite plugin that records the Rollup modules contributing to each emitted
 * chunk. Vite's manifest does not list them, and the composition check needs
 * that inventory to prove which source modules reached an example bundle.
 */
export function moduleInventoryPlugin() {
  return {
    name: 'workbench-module-inventory',
    apply: 'build',
    generateBundle(_options, bundle) {
      const modules = new Set()
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue
        for (const id of Object.keys(output.modules)) modules.add(id)
      }
      this.emitFile({
        type: 'asset',
        fileName: '.vite/modules.json',
        source: `${JSON.stringify({ modules: [...modules].sort() }, null, 2)}\n`,
      })
    },
  }
}
