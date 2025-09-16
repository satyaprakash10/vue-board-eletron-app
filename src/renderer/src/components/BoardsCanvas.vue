<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { dndState } from '../store/dnd'
import BoardColumn from './BoardColumn.vue'

const emit = defineEmits<{ (e: 'create', sectionId: string): void }>()

const outer = ref<HTMLDivElement | null>(null)
let scrollTimer: number | undefined

function onScrollShowThumb(): void {
  if (!outer.value) return
  outer.value.classList.add('scrolling')
  if (scrollTimer) window.clearTimeout(scrollTimer)
  scrollTimer = window.setTimeout(
    () => outer.value && outer.value.classList.remove('scrolling'),
    800
  )
}

onMounted(() => {
  if (outer.value) outer.value.addEventListener('scroll', onScrollShowThumb, { passive: true })
})

onBeforeUnmount(() => {
  if (outer.value) outer.value.removeEventListener('scroll', onScrollShowThumb)
})
</script>

<template>
  <div ref="outer" class="flex gap-4 overflow-x-auto pb-4 sm:gap-6 custom-scrollbar">
    <template v-for="board in dndState.boards" :key="board.id">
      <div class="min-w-max">
        <div class="mb-2 font-semibold text-zinc-700 dark:text-zinc-100">{{ board.title }}</div>
        <div class="flex gap-3 sm:gap-4">
          <BoardColumn
            v-for="s in board.sections"
            :key="s.id"
            :section="s"
            :board-id="board.id"
            @create="emit('create', $event)"
          />
        </div>
      </div>
    </template>
  </div>
</template>
