<script setup lang="ts">
const props = defineProps<{
  url: string
  title?: string
}>()

const { openShareSheet } = useShareSheet()

function onClick(e: MouseEvent) {
  e.preventDefault()
  e.stopPropagation()
  openShareSheet(props.url, props.title)
}
</script>

<template>
  <button type="button" class="card-share-btn" aria-label="Share" @click="onClick">
    <ShareArrowIcon />
  </button>
</template>
