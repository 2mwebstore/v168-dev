<script setup lang="ts">
const modelValue = defineModel<boolean>({ default: true })
const { t } = useLang()
</script>

<template>
  <button
    type="button"
    class="today-btn"
    :class="{ active: modelValue }"
    :aria-pressed="modelValue ? 'true' : 'false'"
    @click="modelValue = !modelValue"
  >
    <span class="today-btn-dot" aria-hidden="true"></span>
    <span>{{ t('today') }}</span>
  </button>
</template>
