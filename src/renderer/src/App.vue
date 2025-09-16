<script setup lang="ts">
import { RouterView } from 'vue-router'
import { dndState } from './store/dnd'
import ConfirmDialog from './components/ConfirmDialog.vue'
import Toast from './components/Toast.vue'
import Navigation from './components/Navigation.vue'

function applyDark(): void {
  document.documentElement.classList.toggle('dark', dndState.darkMode)
}

if (typeof window !== 'undefined') {
  const dark = typeof localStorage !== 'undefined' && localStorage.getItem('dark') === '1'
  if (dark) {
    dndState.darkMode = true
    applyDark()
  }
}
</script>

<template>
  <div
    class="min-h-screen duration-500 ease-in transition-colors bg-zinc-200 p-3 text-gray-900 dark:bg-zinc-950 dark:text-zinc-100"
  >
    <Navigation />

    <!-- Main content -->
    <main class="mx-auto max-w-7xl px-4 py-6">
      <RouterView v-slot="{ Component, route }">
        <Transition name="route-slide" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>
    <ConfirmDialog />
    <Toast />
  </div>
</template>

<style>
.route-slide-enter-active,
.route-slide-leave-active {
  transition:
    transform 250ms ease-out,
    opacity 250ms ease-out;
}
.route-slide-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.route-slide-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
