<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/24/solid'
import interact from 'interactjs'
import type { Task } from '../store/dnd'
import type { Subtask } from '../store/dnd'
import {
  dragContext,
  moveTaskToAdjacentSection,
  requiresConfirmForDetach,
  toggleSubtask,
  getters,
  updateTask,
  deleteTask
} from '../store/dnd'
import { pushToast } from './Toast.vue'
import BaseDropdown from './BaseDropdown.vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import { nanoid } from 'nanoid'

const props = defineProps<{
  task: Task
  boardId: string
  sectionId: string
}>()

const scheduledLabel = computed(() =>
  props.task.scheduledAt ? new Date(props.task.scheduledAt).toLocaleString() : ''
)

const root = ref<HTMLDivElement | null>(null)
type DraggableHandle = { unset: () => void }
let draggable: DraggableHandle | null = null

const isFirstColumn = computed(() => {
  const board = getters.boardById(props.boardId)
  const idx = board?.sections.findIndex((s) => s.id === props.sectionId) ?? 0
  return idx === 0
})
const isLastColumn = computed(() => {
  const board = getters.boardById(props.boardId)
  const idx = board?.sections.findIndex((s) => s.id === props.sectionId) ?? 0
  return board ? idx === board.sections.length - 1 : true
})

const showMenu = ref(false)
const editing = ref(false)
const formTitle = ref('')
const formDescription = ref('')
const formDate = ref<string | null>(null)
const formSubtasks = ref<Subtask[]>([])
const formSubInput = ref('')
const editShowErrors = ref(false)
const showSubtasksEditor = ref(false)
const editFormRef = ref<HTMLDivElement | null>(null)

function openEdit(): void {
  formTitle.value = props.task.title
  formDescription.value = props.task.description
  formDate.value = props.task.scheduledAt
  formSubtasks.value = props.task.subtasks.map((s) => ({ ...s }))
  showSubtasksEditor.value = false
  editing.value = true
  showMenu.value = false
}

function cancelEdit(): void {
  editing.value = false
  showSubtasksEditor.value = false
  formSubInput.value = ''
}

function saveEdit(): void {
  editShowErrors.value = true
  if (!formTitle.value.trim() || !formDescription.value.trim()) return
  updateTask(props.boardId, props.sectionId, props.task.id, {
    title: formTitle.value.trim(),
    description: formDescription.value.trim(),
    scheduledAt: formDate.value,
    subtasks: formSubtasks.value
  })
  editing.value = false
  showSubtasksEditor.value = false
  formSubInput.value = ''
  pushToast('Task updated')
}

function addEditSubtask(): void {
  const t = formSubInput.value.trim()
  if (!t) return
  formSubtasks.value.push({ id: nanoid(), title: t, done: false })
  formSubInput.value = ''
}

function toggleEditSubtask(id: string): void {
  const s = formSubtasks.value.find((x) => x.id === id)
  if (s) s.done = !s.done
}

function removeEditSubtask(id: string): void {
  formSubtasks.value = formSubtasks.value.filter((x) => x.id !== id)
}

async function confirmDelete(): Promise<void> {
  showMenu.value = false
  const ok = await import('../composables/useConfirm').then((m) =>
    m.useConfirm().open('Delete this task? This action cannot be undone.')
  )
  if (!ok) return
  deleteTask(props.boardId, props.sectionId, props.task.id)
  pushToast('Task deleted')
}

function onEditClickOutside(e: MouseEvent): void {
  if (editing.value && editFormRef.value && !editFormRef.value.contains(e.target as Node)) {
    editing.value = false
    editShowErrors.value = false
    showSubtasksEditor.value = false
    formSubInput.value = ''
  }
}

onMounted(() => {
  if (!root.value) return
  draggable = interact(root.value).draggable({
    inertia: false,
    autoScroll: true,
    listeners: {
      start() {
        dragContext.draggingTaskId = props.task.id
      },
      move(event) {
        const target = event.target as HTMLElement
        const x = (parseFloat(target.getAttribute('data-x') || '0') || 0) + event.dx
        const y = (parseFloat(target.getAttribute('data-y') || '0') || 0) + event.dy
        target.style.transform = `translate(${x}px, ${y}px)`
        target.setAttribute('data-x', String(x))
        target.setAttribute('data-y', String(y))
        type InteractMoveEvent = { clientY?: number; client?: { y?: number } }
        const ev = event as InteractMoveEvent
        const clientY = typeof ev.clientY === 'number' ? ev.clientY : ev.client?.y
        if (typeof clientY === 'number')
          window.dispatchEvent(new CustomEvent('global-drag-move', { detail: { clientY } }))
      },
      end(event) {
        const target = event.target as HTMLElement
        target.style.transform = ''
        target.removeAttribute('data-x')
        target.removeAttribute('data-y')
        dragContext.draggingTaskId = null
      }
    }
  })
  window.addEventListener('mousedown', onEditClickOutside)
})

onBeforeUnmount(() => {
  draggable?.unset()
  window.removeEventListener('mousedown', onEditClickOutside)
})

async function moveLeft(): Promise<void> {
  if (isFirstColumn.value) return
  if (
    requiresConfirmForDetach(props.task.id, props.boardId, props.sectionId) &&
    !(await import('../composables/useConfirm').then((m) =>
      m.useConfirm().open('This task has a schedule. Move anyway?')
    ))
  )
    return
  moveTaskToAdjacentSection(props.task.id, props.boardId, props.sectionId, 'left')
  pushToast('Moved left')
}

async function moveRight(): Promise<void> {
  if (isLastColumn.value) return
  if (
    requiresConfirmForDetach(props.task.id, props.boardId, props.sectionId) &&
    !(await import('../composables/useConfirm').then((m) =>
      m.useConfirm().open('This task has a schedule. Move anyway?')
    ))
  )
    return
  moveTaskToAdjacentSection(props.task.id, props.boardId, props.sectionId, 'right')
  pushToast('Moved right')
}

function toggleSub(id: string): void {
  toggleSubtask(props.boardId, props.sectionId, props.task.id, id)
}
</script>

<template>
  <div
    ref="root"
    class="group task-card rounded-md hover:shadow-lg px-2 border border-slate-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 p-3 shadow-sm select-none cursor-grab transition-all ease-in-out active:cursor-grabbing transform duration-700 hover:bg-slate-100 hover:border-indigo-500/50 dark:hover:bg-zinc-700/60"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <div class="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
          #{{ task.order }} · {{ task.title }}
        </div>
        <div class="text-xs text-zinc-500 dark:text-zinc-400 truncate">{{ task.description }}</div>
        <div
          v-if="task.scheduledAt"
          class="mt-1 inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-900/40 p-1.5 text-[11px] text-emerald-700 dark:text-emerald-300"
        >
          {{ scheduledLabel }}
        </div>
        <div v-if="task.subtasks.length" class="mt-2 space-y-1">
          <label
            v-for="s in task.subtasks"
            :key="s.id"
            class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300"
          >
            <input
              type="checkbox"
              class="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-primary-600 accent-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-0 transition-colors"
              :checked="s.done"
              @change="toggleSub(s.id)"
            />
            <span :class="s.done ? 'line-through opacity-60' : ''">{{ s.title }}</span>
          </label>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button
          class="rounded bg-gray-100 p-1.5 dark:bg-zinc-700 hover:border-indigo-500 transition-all duration-300 transform ase-linear hover:border group-hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-40"
          :disabled="isFirstColumn"
          @click.stop="moveLeft"
          aria-label="Move left"
        >
          <ArrowLeftIcon class="w-3 text-gray-900 dark:text-white" />
        </button>
        <button
          class="rounded bg-gray-100 p-1.5 dark:bg-zinc-700 hover:border-indigo-500 transition-all duration-300 transform ase-linear hover:border group-hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-40"
          :disabled="isLastColumn"
          @click.stop="moveRight"
          aria-label="Move right"
        >
          <ArrowRightIcon class="w-3 text-gray-900 dark:text-white" />
        </button>

        <!-- Task Dropdown -->
        <BaseDropdown v-model="showMenu" align="right">
          <template #trigger>
            <button
              class="opacity-0 transform duration-500 group-hover:opacity-100 hidden group-hover:block transition-opacity rounded bg-gray-100 p-1.5 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
              aria-label="Actions"
            >
              <EllipsisVerticalIcon class="w-4 text-gray-900 dark:text-white" />
            </button>
          </template>
          <div class="py-1 px-1">
            <button
              class="w-full text-left px-2 py-1.5 text-xs hover:bg-zinc-100 rounded-xl dark:hover:bg-zinc-700 flex items-center gap-1.5"
              @click.stop="openEdit"
            >
              <PencilIcon class="w-4 h-4" /> Edit
            </button>
            <hr class="my-1 border-zinc-200 dark:border-zinc-700 mx-2" />
            <button
              class="w-full text-left px-2 py-1.5 text-xs hover:bg-zinc-100 rounded-xl dark:hover:bg-zinc-700 text-red-600 flex items-center gap-2"
              @click.stop="confirmDelete"
            >
              <TrashIcon class="w-4 h-4" /> Delete
            </button>
          </div>
        </BaseDropdown>
      </div>
    </div>

    <Transition name="scale-fade">
      <div
        v-if="editing"
        ref="editFormRef"
        class="mt-3 rounded-md border border-slate-300 bg-white dark:bg-zinc-800 dark:border-zinc-700 p-3"
      >
        <input
          v-model="formTitle"
          :class="[
            'w-full mb-1 rounded px-2 py-1.5 bg-white dark:bg-zinc-800 focus:outline-none',
            editShowErrors && !formTitle.trim()
              ? 'border border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border border-slate-300 dark:border-zinc-700'
          ]"
          placeholder="Title"
        />
        <div v-if="editShowErrors && !formTitle.trim()" class="text-xs text-red-500 mb-2">
          Title is required
        </div>
        <textarea
          v-model="formDescription"
          rows="2"
          :class="[
            'w-full mb-1 rounded px-2 py-1.5 bg-white dark:bg-zinc-800 focus:outline-none',
            editShowErrors && !formDescription.trim()
              ? 'border border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border border-slate-300 dark:border-zinc-700'
          ]"
          placeholder="Description"
        />
        <div v-if="editShowErrors && !formDescription.trim()" class="text-xs text-red-500 mb-2">
          Description is required
        </div>
        <VueDatePicker v-model="formDate" :enable-time-picker="true" :is-24="true" />
        <div class="my-3 border-t border-slate-200 dark:border-zinc-700"></div>
        <div class="mt-2 flex justify-center" v-if="!showSubtasksEditor">
          <button
            class="px-3 py-1.5 rounded-full text-xs bg-zinc-100 text-zinc-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            @click="showSubtasksEditor = true"
          >
            Add Sub Item
          </button>
        </div>
        <Transition name="scale-fade">
          <div class="mt-2" v-if="showSubtasksEditor">
            <div class="mb-2 flex items-center gap-2">
              <input
                v-model="formSubInput"
                class="flex-1 rounded border border-slate-300 px-2 py-1.5 bg-white dark:bg-zinc-800 dark:border-zinc-700"
                placeholder="Add subtask"
                @keyup.enter="addEditSubtask"
              />
              <button
                class="p-1 rounded bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                @click="addEditSubtask"
              >
                +
              </button>
            </div>
          </div>
        </Transition>
        <div v-if="formSubtasks.length" class="mt-2">
          <div class="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Subtasks</div>
          <div class="space-y-1">
            <div
              v-for="s in formSubtasks"
              :key="s.id"
              class="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-300"
            >
              <label class="flex items-center gap-2 min-w-0">
                <input
                  type="checkbox"
                  :checked="s.done"
                  @change="toggleEditSubtask(s.id)"
                  class="h-4 w-4 rounded-full border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-primary-600 accent-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:ring-offset-0 transition-colors"
                />
                <span :class="s.done ? 'line-through opacity-60' : ''" class="truncate">{{
                  s.title
                }}</span>
              </label>
              <button
                class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700"
                @click="removeEditSubtask(s.id)"
                aria-label="Remove subtask"
              >
                <XMarkIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        <div class="mt-2 flex justify-end gap-2">
          <button class="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700" @click="cancelEdit">
            Cancel
          </button>
          <button class="px-2 py-1 rounded bg-indigo-500 text-white" @click="saveEdit">Save</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition:
    transform 120ms ease,
    opacity 120ms ease;
}
.scale-fade-enter-from,
.scale-fade-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
</style>
