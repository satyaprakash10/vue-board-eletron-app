import { reactive, watch } from 'vue'
import { nanoid } from 'nanoid'

export type Subtask = { id: string; title: string; done: boolean }

export type Task = {
  id: string
  order: number
  title: string
  description: string
  scheduledAt: string | null // ISO date
  subtasks: Subtask[]
}

export type SectionKey = 'Backlog' | 'Today' | 'NextWeek' | 'Tomorrow'

export type Section = {
  id: string
  title: string
  key: SectionKey
  tasks: Task[]
}

export type Board = {
  id: string
  title: string
  sections: Section[]
}

function generateTasks(count: number): Task[] {
  const tasks: Task[] = []
  for (let i = 0; i < count; i += 1) {
    const hasSchedule = i % 2 === 0
    tasks.push({
      id: nanoid(),
      order: i + 1,
      title: `Task ${i + 1}`,
      description: 'This is a mock task used for demonstration.',
      scheduledAt: hasSchedule ? new Date(Date.now() + i * 3600_000).toISOString() : null,
      subtasks: []
    })
  }
  return tasks
}

function renumber(section: Section): void {
  section.tasks.forEach((t, idx) => {
    t.order = idx + 1
  })
}

function generateBoard(title: string): Board {
  const backlog: Section = {
    id: nanoid(),
    title: 'Backlog',
    key: 'Backlog',
    tasks: generateTasks(5)
  }
  const today: Section = { id: nanoid(), title: 'Today', key: 'Today', tasks: [] }
  const nextWeek: Section = { id: nanoid(), title: 'Next week', key: 'NextWeek', tasks: [] }
  const tomorrow: Section = { id: nanoid(), title: 'Tomorrow', key: 'Tomorrow', tasks: [] }
  return { id: nanoid(), title, sections: [backlog, today, nextWeek, tomorrow] }
}

const STORAGE_KEY = 'blitzit_dnd_state_v1'

type PersistedState = {
  darkMode: boolean
  boards: Board[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return null
    const maybeBoards = parsed.boards
    const maybeDark = parsed.darkMode
    if (!Array.isArray(maybeBoards)) return null
    return {
      darkMode: typeof maybeDark === 'boolean' ? maybeDark : false,
      boards: maybeBoards as Board[]
    }
  } catch {
    return null
  }
}

const persisted = loadPersistedState()

export const dndState = reactive({
  darkMode: persisted?.darkMode ?? false,
  boards: persisted?.boards ?? [generateBoard('Alpha')]
})

export const getters = {
  boardIndexById: (id: string): number => dndState.boards.findIndex((b) => b.id === id),
  boardById: (id: string): Board | undefined => dndState.boards.find((b) => b.id === id),
  sectionById: (boardId: string, sectionId: string): Section | undefined =>
    dndState.boards.find((b) => b.id === boardId)?.sections.find((s) => s.id === sectionId),
  sectionByKeyInBoard: (boardId: string, key: SectionKey): Section | undefined =>
    dndState.boards.find((b) => b.id === boardId)?.sections.find((s) => s.key === key)
}

export const dragContext = reactive<{
  draggingTaskId: string | null
  sourceBoardId: string | null
  sourceSectionId: string | null
}>({
  draggingTaskId: null,
  sourceBoardId: null,
  sourceSectionId: null
})

export function sortTasksByOrder(section: Section): void {
  section.tasks.sort((a, b) => a.order - b.order)
}

export function moveTask(
  from: { boardId: string; sectionId: string; taskId: string },
  to: { boardId: string; sectionId: string; atIndex: number }
): void {
  const sourceBoard = getters.boardById(from.boardId)
  const targetBoard = getters.boardById(to.boardId)
  if (!sourceBoard || !targetBoard) return
  const sourceSection = sourceBoard.sections.find((s) => s.id === from.sectionId)
  const targetSection = targetBoard.sections.find((s) => s.id === to.sectionId)
  if (!sourceSection || !targetSection) return

  const idx = sourceSection.tasks.findIndex((t) => t.id === from.taskId)
  if (idx === -1) return
  const [task] = sourceSection.tasks.splice(idx, 1)

  const insertAt = Math.max(0, Math.min(to.atIndex, targetSection.tasks.length))
  targetSection.tasks.splice(insertAt, 0, task)

  renumber(sourceSection)
  renumber(targetSection)
}

export function requiresConfirmForDetach(
  taskId: string,
  boardId: string,
  sectionId: string
): boolean {
  const section = getters.sectionById(boardId, sectionId)
  const task = section?.tasks.find((t) => t.id === taskId)
  return Boolean(task?.scheduledAt)
}

export function moveTaskToAdjacentBoard(
  taskId: string,
  fromBoardId: string,
  sectionId: string,
  direction: 'left' | 'right'
): void {
  const boardIdx = getters.boardIndexById(fromBoardId)
  if (boardIdx === -1) return
  const targetIdx = direction === 'left' ? boardIdx - 1 : boardIdx + 1
  const sourceBoard = dndState.boards[boardIdx]
  const sourceSection = sourceBoard.sections.find((s) => s.id === sectionId)
  const task = sourceSection?.tasks.find((t) => t.id === taskId)
  if (!sourceSection || !task) return
  const targetBoard = dndState.boards[targetIdx]
  if (!targetBoard) return
  const targetSection = targetBoard.sections.find((s) => s.key === sourceSection.key)
  if (!targetSection) return
  sourceSection.tasks = sourceSection.tasks.filter((t) => t.id !== taskId)
  targetSection.tasks.push({ ...task, order: targetSection.tasks.length + 1 })
  renumber(sourceSection)
  renumber(targetSection)
}

export function moveTaskToAdjacentSection(
  taskId: string,
  boardId: string,
  fromSectionId: string,
  direction: 'left' | 'right'
): void {
  const board = getters.boardById(boardId)
  if (!board) return
  const fromIdx = board.sections.findIndex((s) => s.id === fromSectionId)
  if (fromIdx === -1) return
  const toIdx = direction === 'left' ? fromIdx - 1 : fromIdx + 1
  if (toIdx < 0 || toIdx >= board.sections.length) return
  const source = board.sections[fromIdx]
  const target = board.sections[toIdx]
  const tIdx = source.tasks.findIndex((t) => t.id === taskId)
  if (tIdx === -1) return
  const [task] = source.tasks.splice(tIdx, 1)
  target.tasks.push({ ...task, order: target.tasks.length + 1 })
  renumber(source)
  renumber(target)
}

export function addTask(
  boardId: string,
  sectionId: string,
  payload: { title: string; description: string; scheduledAt: string | null; subtasks?: Subtask[] }
): void {
  const section = getters.sectionById(boardId, sectionId)
  if (!section) return
  section.tasks.push({
    id: nanoid(),
    order: section.tasks.length + 1,
    subtasks: payload.subtasks ?? [],
    title: payload.title,
    description: payload.description,
    scheduledAt: payload.scheduledAt
  })
}

export function updateTask(
  boardId: string,
  sectionId: string,
  taskId: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'scheduledAt' | 'subtasks'>>
): void {
  const section = getters.sectionById(boardId, sectionId)
  const task = section?.tasks.find((t) => t.id === taskId)
  if (!task) return
  if (typeof updates.title === 'string') task.title = updates.title
  if (typeof updates.description === 'string') task.description = updates.description
  if (typeof updates.scheduledAt !== 'undefined') task.scheduledAt = updates.scheduledAt
  if (Array.isArray(updates.subtasks)) task.subtasks = updates.subtasks
}

export function deleteTask(boardId: string, sectionId: string, taskId: string): void {
  const section = getters.sectionById(boardId, sectionId)
  if (!section) return
  section.tasks = section.tasks.filter((t) => t.id !== taskId)
  renumber(section)
}

export function toggleSubtask(
  boardId: string,
  sectionId: string,
  taskId: string,
  subtaskId: string
): void {
  const section = getters.sectionById(boardId, sectionId)
  const task = section?.tasks.find((t) => t.id === taskId)
  const sub = task?.subtasks.find((s) => s.id === subtaskId)
  if (sub) sub.done = !sub.done
}

watch(
  dndState,
  (val) => {
    try {
      const toSave: PersistedState = { darkMode: val.darkMode, boards: val.boards }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // ignore persistence errors
    }
  },
  { deep: true }
)
