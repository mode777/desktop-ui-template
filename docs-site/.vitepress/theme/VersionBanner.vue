<script setup lang="ts">
import manifest from '../../../packages/workbench/docs/manifest.json'

const published = manifest.availability === 'published'
</script>

<template>
  <div class="version-banner" role="note">
    <strong class="version-banner__version"
      >{{ manifest.packageName }} {{ manifest.version }}</strong
    >
    <span v-if="published">Published on the public npm registry.</span>
    <span v-else>
      Preview: not yet on the public npm registry. Use the local-tarball path in the quickstart.
    </span>
  </div>
</template>
