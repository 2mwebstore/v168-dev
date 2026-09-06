<script setup lang="ts">
const props = defineProps<{
  url: string
  title?: string
}>()

const { t } = useLang()
const { openShareSheet } = useShareSheet()

function onClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  openShareSheet(props.url, props.title)
}
</script>

<template>
  <div class="share-trigger-row">
    <button type="button" class="share-trigger-btn" aria-label="Share" @click="onClick">
      <ShareArrowIcon />
      <span>{{ t('share') }}</span>
    </button>
  </div>
</template>