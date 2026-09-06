<script setup lang="ts">
const { lang, flag, cycle } = useLang()

const cycling = ref(false)
function onLangClick() {
  cycling.value = false
  // restart the flip animation even on rapid clicks
  requestAnimationFrame(() => {
    cycling.value = true
    cycle()
  })
}
function onAnimEnd() {
  cycling.value = false
}
</script>

<template>
  <header
    class="sticky top-0 z-40 backdrop-blur bg-[#161d3191] border-b"
    style="border-color:var(--line); box-shadow:0 4px 20px rgba(0,0,0,.25);"
  >
    <div class="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center">
      <div class="flex items-center gap-2 shrink-0">
        <NuxtLink to="/">
          <img src="/v168.png" alt="V168" class="h-7 sm:h-8 md:h-10 w-auto rounded">
        </NuxtLink>
      </div>

      <div class="header-actions">
        <div class="lang-switch">
          <button
            class="lang-btn"
            :class="{ cycling }"
            type="button"
            aria-label="Change language"
            :data-active-lang="lang"
            @click="onLangClick"
            @animationend="onAnimEnd"
          >
            <span class="lang-flag">{{ flag }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
