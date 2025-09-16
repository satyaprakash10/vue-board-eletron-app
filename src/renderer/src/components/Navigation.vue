<template>
  <header
    class="border-b mx-4 dark:border-zinc-800 bg-gray-200 border-slate-100 shadow-xl rounded-2xl dark:bg-slate-900 backdrop-blur sticky top-0 z-10"
  >
    <div class="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div class="font-semibold text-indigo-700 dark:text-white">Vue Electron DnD</div>
      <nav class="flex items-center gap-4 text-sm">
        <RouterLink
          to="/"
          class="hover:text-indigo-700 dark:hover:text-white"
          :class="{ 'text-indigo-700 dark:text-white': route.path === '/' }"
          >Boards</RouterLink
        >
        <RouterLink
          to="/dashboard"
          class="hover:text-indigo-700 dark:text-white dark:hover:text-white"
          :class="{ 'text-indigo-700 dark:text-white': route.path === '/dashboard' }"
          >Dashboard</RouterLink
        >
        <button
          class="p-2 cursor-pointer rounded bg-zinc-300 dark:bg-zinc-800 hover:bg-gray-300 dark:hover:bg-zinc-700"
          @click="toggleDark"
        >
          <SunIcon v-if="dndState.darkMode" class="w-5 h-5" />
          <MoonIcon v-else class="w-5 h-5" />
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { dndState } from '../store/dnd'

const route = useRoute()

function applyDark(): void {
  document.documentElement.classList.toggle('dark', dndState.darkMode)
}

function toggleDark(): void {
  dndState.darkMode = !dndState.darkMode
  applyDark()
  try {
    localStorage.setItem('dark', dndState.darkMode ? '1' : '0')
  } catch {
    console.log('Error setting dark mode')
  }
}
</script>
