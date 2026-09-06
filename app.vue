<script setup lang="ts">
const { lang } = useLang()

useHead({
  htmlAttrs: {
    lang: computed(() => lang.value),
  },
})
</script>

<template>
  <div class="min-h-screen">
    <NuxtPage />
    <ShareSheet />
  </div>
</template>
