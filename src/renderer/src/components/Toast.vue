<script lang="ts">
import { reactive, defineComponent } from 'vue'
import { CheckCircleIcon } from '@heroicons/vue/24/solid'

export type ToastMessage = { id: number; text: string }
const state = reactive({ items: [] as ToastMessage[] })
let id = 1

export function pushToast(text: string): void {
  const item = { id: id++, text }
  state.items.push(item)
  setTimeout(() => {
    state.items = state.items.filter((t) => t.id !== item.id)
  }, 2200)
}

export default defineComponent({
  name: 'Toast',
  components: { CheckCircleIcon },
  setup() {
    return { state }
  }
})
</script>

<template>
  <div class="fixed top-14 right-4 z-50 space-y-2">
    <div
      v-for="t in state.items"
      :key="t.id"
      class="flex w-60 items-center gap-2 rounded-xl shadow-cyan-950 shadow-soft shadow-2xl bg-zinc-900/90 text-white px-4 py-2 backdrop-blur animate-slide-in"
    >
      <CheckCircleIcon class="w-4 h-4 text-emerald-400" />
      <div class="text-sm text-white">{{ t.text }}</div>
    </div>
  </div>
</template>

<style scoped>
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-6px) translateX(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(0);
  }
}
.animate-slide-in {
  animation: slide-in 0.25s ease-out;
}
</style>
