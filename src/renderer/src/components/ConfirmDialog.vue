<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue'
import { useConfirm } from '../composables/useConfirm'

const { state, accept, cancel } = useConfirm()

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && state.visible) cancel()
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    v-if="state.visible"
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
    @click.self="cancel"
  >
    <div
      class="w-full max-w-sm rounded-lg border backdrop-blur-xl bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
    >
      <div class="text-base font-semibold mb-2">Confirm</div>
      <div class="text-sm text-zinc-600 dark:text-zinc-300">{{ state.message }}</div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          class="bg-gray-200 rounded-md p-2 text-gray-900 text-sm cursor-pointer transition-all duration-900 hover:bg-gray-400 transform hover:scale-95 ease-in-out border-2 border-slate-200"
          @click="cancel"
        >
          Cancel
        </button>
        <button
          class="bg-indigo-500 rounded-md p-2 text-white text-sm cursor-pointer transition-all duration-900 hover:bg-indigo-600 transform hover:scale-95 ease-in-out hover:border-indigo-600 border-2 border-indigo-500"
          @click="accept"
        >
          Confirm
        </button>
      </div>
    </div>
  </div>
</template>
