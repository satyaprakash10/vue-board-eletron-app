<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  modelValue: boolean
  align?: 'left' | 'right'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

const root = ref<HTMLElement | null>(null)

function close(): void {
  emit('update:modelValue', false)
}

function toggle(): void {
  emit('update:modelValue', !props.modelValue)
}

function onClickOutside(e: MouseEvent): void {
  if (!props.modelValue) return
  if (!root.value) return
  if (!root.value.contains(e.target as Node)) close()
}

onMounted(() => {
  document.addEventListener('click', onClickOutside, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true)
})
</script>

<template>
  <div ref="root" class="relative inline-block text-left">
    <div @click.stop="toggle">
      <slot name="trigger" />
    </div>
    <Transition name="dropdown-scale">
      <div
        v-if="modelValue"
        class="absolute mt-2 w-28 z-10 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800/70 backdrop-blur-md shadow-xl shadow-gray-150 dark:shadow-black/40 ring-1 ring-black/5"
        :class="align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dropdown-scale-enter-active,
.dropdown-scale-leave-active {
  transition:
    transform 120ms ease,
    opacity 120ms ease;
}
.dropdown-scale-enter-from,
.dropdown-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
