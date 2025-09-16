<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, reactive } from 'vue'
import interact from 'interactjs'
import type { Section } from '../store/dnd'
import { dragContext, moveTask, requiresConfirmForDetach, addTask } from '../store/dnd'
import { useConfirm } from '../composables/useConfirm'
import DraggableTask from './DraggableTask.vue'
import { PlusIcon } from '@heroicons/vue/24/solid'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { pushToast } from './Toast.vue'
import { nanoid } from 'nanoid'
import { dndState } from '../store/dnd'

const props = defineProps<{ section: Section; boardId?: string }>()

const { open } = useConfirm()

const container = ref<HTMLDivElement | null>(null)
let dropzone: any = null
let scrollTimer: number | undefined
const { darkMode } = dndState

const defaultDate = new Date('2025-01-01T00:00:00Z')

const local = reactive({
  placeholderIndex: -1 as number,
  isOver: false as boolean,
  adding: false as boolean,
  title: '' as string,
  description: '' as string,
  datetime: null as Date | null,
  showErrors: false as boolean,
  subtasks: [] as { id: string; title: string; done: boolean }[],
  subInput: '' as string,
  showSubtasksEditor: false as boolean
})

const formRef = ref<HTMLDivElement | null>(null)

function onClickOutside(e: MouseEvent): void {
  if (local.adding && formRef.value && !formRef.value.contains(e.target as Node)) {
    local.adding = false
    local.showErrors = false
    local.showSubtasksEditor = false
    local.subInput = ''
  }
}

function onScrollShowThumb(): void {
  if (!container.value) return
  container.value.classList.add('scrolling')
  if (scrollTimer) window.clearTimeout(scrollTimer)
  scrollTimer = window.setTimeout(
    () => container.value && container.value.classList.remove('scrolling'),
    800
  )
}

const scheduled = computed(() => props.section.tasks.filter((t) => t.scheduledAt))
const unscheduled = computed(() => props.section.tasks.filter((t) => !t.scheduledAt))

const count = computed(() => props.section.tasks.length)

function resetPlaceholder(): void {
  local.placeholderIndex = -1
  local.isOver = false
}

function indexFromY(y: number): number {
  if (!container.value) return props.section.tasks.length
  const rect = container.value.getBoundingClientRect()
  const relY = y - rect.top + container.value.scrollTop
  const itemSize = 96
  const approx = Math.max(0, Math.min(props.section.tasks.length, Math.floor(relY / itemSize)))
  return approx
}

function onGlobalDragMove(e: Event): void {
  if (!local.isOver) return
  const clientY = (e as CustomEvent).detail?.clientY as number | undefined
  if (typeof clientY !== 'number') return
  local.placeholderIndex = indexFromY(clientY)
}

const placeholderInScheduled = computed(
  () => local.placeholderIndex >= 0 && local.placeholderIndex <= scheduled.value.length
)
const placeholderInUnscheduled = computed(() => local.placeholderIndex > scheduled.value.length)
const placeholderIndexScheduled = computed(() =>
  Math.min(local.placeholderIndex, scheduled.value.length)
)
const placeholderIndexUnscheduled = computed(() =>
  Math.max(0, local.placeholderIndex - scheduled.value.length)
)

function toggleAdd(): void {
  local.adding = !local.adding
  local.showErrors = false
  local.showSubtasksEditor = false
}
function saveAdd(): void {
  local.showErrors = true
  if (!local.title.trim() || !local.description.trim()) return
  const iso = local.datetime ? local.datetime.toISOString() : null
  addTask(props.boardId || '', props.section.id, {
    title: local.title.trim(),
    description: local.description.trim(),
    scheduledAt: iso,
    subtasks: local.subtasks
  })
  pushToast('Task created')
  local.title = ''
  local.description = ''
  local.datetime = null
  local.adding = false
  local.showErrors = false
  local.subtasks = []
  local.subInput = ''
  local.showSubtasksEditor = false
}

function addSubtask(): void {
  const t = local.subInput.trim()
  if (!t) return
  local.subtasks.push({ id: nanoid(), title: t, done: false })
  local.subInput = ''
}

onMounted(() => {
  window.addEventListener('global-drag-move', onGlobalDragMove as any)
  window.addEventListener('mousedown', onClickOutside)
  if (container.value)
    container.value.addEventListener('scroll', onScrollShowThumb, { passive: true })
  if (!container.value) return
  dropzone = interact(container.value as unknown as HTMLElement).dropzone({
    accept: '.task-card',
    overlap: 0.2,
    ondropactivate: () => {},
    ondragenter: () => {
      local.isOver = true
      if (!dragContext.sourceBoardId || !dragContext.sourceSectionId) {
        dragContext.sourceBoardId = props.boardId || null
        dragContext.sourceSectionId = props.section.id
      }
    },
    ondragleave: () => {
      local.isOver = false
      local.placeholderIndex = -1
    },
    ondrop: async () => {
      const targetBoardId = props.boardId as string
      const targetSectionId = props.section.id
      const draggingId = dragContext.draggingTaskId
      const sourceBoardId = dragContext.sourceBoardId as string
      const sourceSectionId = dragContext.sourceSectionId as string
      if (!draggingId || !sourceBoardId || !sourceSectionId) return resetPlaceholder()

      if (
        (sourceBoardId !== targetBoardId || sourceSectionId !== targetSectionId) &&
        requiresConfirmForDetach(draggingId, sourceBoardId, sourceSectionId)
      ) {
        const ok = await open('This task has a schedule. Move anyway?')
        if (!ok) {
          resetPlaceholder()
          dragContext.sourceBoardId = null
          dragContext.sourceSectionId = null
          return
        }
      }

      const atIndex =
        local.placeholderIndex < 0
          ? props.section.tasks.length
          : Math.min(local.placeholderIndex, props.section.tasks.length)

      moveTask(
        { boardId: sourceBoardId, sectionId: sourceSectionId, taskId: draggingId },
        { boardId: targetBoardId, sectionId: targetSectionId, atIndex }
      )
      pushToast('Task Updated Successfully!')

      resetPlaceholder()
      dragContext.sourceBoardId = null
      dragContext.sourceSectionId = null
    },
    ondropdeactivate: () => {}
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('global-drag-move', onGlobalDragMove as any)
  window.removeEventListener('mousedown', onClickOutside)
  if (container.value) container.value.removeEventListener('scroll', onScrollShowThumb)
  dropzone?.unset()
})
</script>

<template>
  <div
    class="w-80 md:w-80 shrink-0 dark:shadow-cyan-950/10 shadow-xl border rounded-lg border-gray-200 bg-gray-100 dark:bg-zinc-900 dark:border-zinc-800 overflow-hidden flex flex-col"
  >
    <div
      class="px-3 py-2 border-b border-t border-slate-300 rounded-lg dark:border-zinc-800 font-medium bg-slate-200/50 shadow-sm dark:bg-zinc-800/60 flex items-center justify-between"
    >
      <div class="flex items-center justify-between gap-2">
        <div>{{ section.title }}</div>
        <span class="text-xs text-zinc-500">{{ count }}</span>
      </div>

      <button class="cursor-pointer hover:bg-slate-300 rounded-full p-1" @click="toggleAdd">
        <PlusIcon class="w-4 h-4 text-zinc-500 dark:text-slate-500" />
      </button>
    </div>
    <div
      class="p-2 flex-1 min-h-[200px] max-h-[70vh] overflow-y-auto custom-scrollbar"
      ref="container"
    >
      <Transition name="scale-fade">
        <div
          v-if="local.adding"
          ref="formRef"
          class="mb-2 rounded-md border border-slate-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 p-2"
        >
          <input
            v-model="local.title"
            :class="[
              'w-full mb-1 rounded px-2 py-1.5 bg-white dark:bg-zinc-800 focus:outline-none',
              local.showErrors && !local.title.trim()
                ? 'border border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border border-slate-300 dark:border-zinc-700'
            ]"
            placeholder="Title"
            @keyup.enter="saveAdd"
          />
          <div v-if="local.showErrors && !local.title.trim()" class="text-xs text-red-500 mb-1">
            Title is required
          </div>
          <textarea
            v-model="local.description"
            rows="2"
            :class="[
              'w-full mb-1 rounded px-2 py-1.5 bg-white dark:bg-zinc-800 focus:outline-none',
              local.showErrors && !local.description.trim()
                ? 'border border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border border-slate-300 dark:border-zinc-700'
            ]"
            placeholder="Description"
          />
          <div
            v-if="local.showErrors && !local.description.trim()"
            class="text-xs text-red-500 mb-1"
          >
            Description is required
          </div>
          <VueDatePicker
            v-model="local.datetime"
            placeholder="Select date"
            :enable-time-picker="true"
            :is-24="true"
            :dark="darkMode"
            :auto-apply="true"
            :default-date="defaultDate"
          />
          <div class="my-3 border-t border-slate-200 dark:border-zinc-700"></div>
          <div class="mt-1 flex justify-center" v-if="!local.showSubtasksEditor">
            <button
              class="px-3 py-1.5 rounded-full text-xs bg-zinc-100 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:text-gray-300 transition-colors dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              @click="local.showSubtasksEditor = true"
            >
              Add Sub Item
            </button>
          </div>
          <Transition name="scale-fade">
            <div v-if="local.showSubtasksEditor" class="mt-2">
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Subtasks</div>
              <div class="mb-2 flex items-center gap-2">
                <input
                  v-model="local.subInput"
                  class="flex-1 rounded border border-slate-300 px-2 py-1.5 bg-white dark:bg-zinc-800 dark:border-zinc-700"
                  placeholder="Add subtask"
                  @keyup.enter="addSubtask"
                />
                <button
                  class="p-1 rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                  @click="addSubtask"
                >
                  <PlusIcon class="w-4 h-4 text-zinc-500 dark:text-slate-500" />
                </button>
              </div>
              <div v-if="local.subtasks.length" class="mb-2 space-y-1">
                <div
                  v-for="s in local.subtasks"
                  :key="s.id"
                  class="text-xs text-zinc-500 dark:text-zinc-300"
                >
                  • {{ s.title }}
                </div>
              </div>
            </div>
          </Transition>
          <div class="mt-2 flex justify-end gap-2">
            <button class="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700" @click="toggleAdd">
              Cancel
            </button>
            <button
              class="px-1.5 py-1 text-sm rounded bg-indigo-500 hover:bg-indigo-600 text-white"
              @click="saveAdd"
            >
              Add
            </button>
          </div>
        </div>
      </Transition>

      <div
        class="text-[11px] border-t-1 mt-3 border-gray-300 py-3 dark:border-gray-800 uppercase tracking-wide text-zinc-400 dark:text-zinc-500 px-1"
      >
        Scheduled
      </div>

      <TransitionGroup name="list" tag="div" class="space-y-2 mb-4">
        <template v-for="(item, idx) in scheduled" :key="item.id">
          <div
            v-if="placeholderInScheduled && idx === placeholderIndexScheduled"
            class="h-20 rounded-md border-2 dark:border-zinc-700 border-dashed border-slate-300 bg-gray-100 dark:bg-gray-900/40 transition-colors"
          ></div>
          <DraggableTask :task="item" :board-id="boardId || ''" :section-id="section.id" />
        </template>
        <div
          v-if="local.placeholderIndex === scheduled.length"
          class="h-20 rounded-md border-2 border-dashed border-slate-300 bg-gray-100 dark:bg-gray-900/40 transition-colors"
        ></div>
      </TransitionGroup>

      <div
        class="text-[11px] border-t-1 mt-3 border-gray-300 py-3 dark:border-gray-800 uppercase tracking-wide text-zinc-400 dark:text-zinc-500 px-1"
      >
        Other
      </div>
      <TransitionGroup name="list" tag="div" class="space-y-2">
        <template v-for="(item, idx) in unscheduled" :key="item.id">
          <div
            v-if="placeholderInUnscheduled && idx === placeholderIndexUnscheduled"
            class="h-20 rounded-md border-2 dark:border-zinc-700 border-dashed border-slate-300 bg-gray-100 dark:bg-gray-900/40 transition-colors"
          ></div>
          <DraggableTask :task="item" :board-id="boardId || ''" :section-id="section.id" />
        </template>
      </TransitionGroup>
      <div class="flex items-center justify-center px-4">
        <button
          class="cursor-pointer w-full mt-4 dark:text-white text-center text-sm bg-transparent shadow text-zinc-500 border-dashed border-1 px-5 border-slate-300 hover:bg-slate-50/10 transition-all duration-500 ease-in-out rounded-full p-1"
          @click="toggleAdd"
        >
          <span class="flex items-center justify-center">
            <PlusIcon class="w-4 h-4 mr-2 text-zinc-500 dark:text-slate-200"></PlusIcon> Add Task
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.2s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.18s ease;
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: transparent;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}
.custom-scrollbar:hover::-webkit-scrollbar-thumb,
.custom-scrollbar.scrolling::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.45);
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: transparent;
}
/* Firefox show thumb only on hover/scroll via class */
.custom-scrollbar:hover {
  scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
}
.custom-scrollbar.scrolling {
  scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
}
</style>
