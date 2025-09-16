<script setup lang="ts">
import { ref, computed } from 'vue'
import BoardsCanvas from '../components/BoardsCanvas.vue'
import { dndState, addTask } from '../store/dnd'

const showCreate = ref(false)
const targetBoardId = computed(() => dndState.boards[0].id)
const targetSectionId = ref<string>('')
const title = ref('')
const description = ref('')
const scheduledAt = ref<string | null>(null)

function openCreate(sectionId: string): void {
  targetSectionId.value = sectionId
  title.value = ''
  description.value = ''
  scheduledAt.value = null
  showCreate.value = true
}

function createTask(): void {
  if (!targetSectionId.value || !title.value.trim()) {
    showCreate.value = false
    return
  }
  addTask(targetBoardId.value, targetSectionId.value, {
    title: title.value.trim(),
    description: description.value.trim(),
    scheduledAt: scheduledAt.value
  })
  showCreate.value = false
}
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center gap-4">
      <RouterLink to="/" class="text-primary-600 dark:text-primary-300">Task Boards</RouterLink> /
      <RouterLink
        to="/dashboard"
        class="text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-300"
      >
        Dashboard
      </RouterLink>
    </div>
    <div
      class="text-sm bg-white dark:bg-emerald-50 text-zinc-800 w-80 p-2 rounded-md dark:text-emerald-600 dark:shadow-emerald-950 shadow-md mb-2"
    >
      Tap a column title to add a task.
    </div>
    <BoardsCanvas @create="openCreate" />

    <div
      v-if="showCreate"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <div
        class="w-full max-w-md rounded-lg border border-slate-300 bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="text-base font-semibold mb-3">Create Task</div>
        <div class="space-y-3">
          <div>
            <label class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Title</label>
            <input
              v-model="title"
              class="w-full rounded border-slate-300 border px-2 py-1.5 bg-white dark:bg-zinc-800 dark:border-zinc-700"
              placeholder="Task title"
            />
          </div>
          <div>
            <label class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Description</label>
            <textarea
              v-model="description"
              rows="3"
              class="w-full rounded border border-gray-200 px-2 py-1.5 bg-white dark:bg-zinc-800 dark:border-zinc-700"
              placeholder="Details"
            />
          </div>
          <div>
            <label class="block text-xs text-zinc-500 dark:text-zinc-400 mb-1">Schedule</label>
            <VDatePicker v-model="scheduledAt" placeholder="Select date" :mode="'date'" is24hr />
          </div>
        </div>
        <div class="mt-4 flex justify-end gap-2">
          <button
            class="px-3 py-1.5 rounded bg-zinc-300 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            @click="showCreate = false"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1.5 rounded text-gray-900 dark:text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600"
            @click="createTask"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
