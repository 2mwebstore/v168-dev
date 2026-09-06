<script setup lang="ts">
const { open, image, name, side, closeFighterModal, onModalImgError } = useFighterModal()

onMounted(() => {
  const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeFighterModal() }
  document.addEventListener('keydown', onKeydown)
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
})
</script>

<template>
  <div class="fighter-modal-overlay" :class="{ open }" :aria-hidden="!open" @click.self="closeFighterModal">
    <div class="fighter-modal" role="dialog" aria-modal="true">
      <button class="fighter-modal-close" aria-label="Close" @click="closeFighterModal">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <img :src="image" :alt="name" @error="onModalImgError">
      <div class="fighter-modal-name text-lg sm:text-2xl" :class="side">{{ name }}</div>
    </div>
  </div>
</template>
