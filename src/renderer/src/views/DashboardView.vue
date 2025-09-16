<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { dndState } from '../store/dnd'
import { Bar, Line } from 'vue-chartjs'
import {
  Chart,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import type { ChartOptions } from 'chart.js'
import {
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/solid'

Chart.register(
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler
)

const board = computed(() => dndState.boards[0])
const allTasks = computed(() => board.value.sections.flatMap((s) => s.tasks))
const scheduledTasks = computed(() => allTasks.value.filter((t) => t.scheduledAt))
const completedTasks = computed(() =>
  allTasks.value.filter((t) => t.subtasks.length > 0 && t.subtasks.every((s) => s.done))
)

const byDay = computed(() => {
  const map = new Map<string, number>()
  for (const t of scheduledTasks.value) {
    const day = new Date(t.scheduledAt as string).toISOString().slice(0, 10)
    map.set(day, (map.get(day) || 0) + 1)
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
})

const canvasRef = ref<HTMLCanvasElement | null>(null)
const gradientRef = ref<CanvasGradient | null>(null)

onMounted(() => {
  if (!canvasRef.value) return
  const ctx = canvasRef.value.getContext('2d')
  if (!ctx) return
  const g = ctx.createLinearGradient(0, 0, 0, 260)
  g.addColorStop(0, 'rgba(99,102,241,0.35)')
  g.addColorStop(1, 'rgba(99,102,241,0)')
  gradientRef.value = g
})

const labels = computed(() => byDay.value.map(([d]) => d.slice(5)))
const dataPoints = computed(() => byDay.value.map(([, c]) => c))

const barData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Scheduled (bars)',
      data: dataPoints.value,
      backgroundColor: '#6366F1',
      borderRadius: 6,
      barPercentage: 0.65,
      categoryPercentage: 0.6
    }
  ]
}))

const lineData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Scheduled (line)',
      data: dataPoints.value,
      borderColor: '#22c55e',
      backgroundColor: gradientRef.value || 'rgba(34,197,94,0.15)',
      pointRadius: 3,
      tension: 0.35,
      fill: true
    }
  ]
}))

const barOptions: ChartOptions<'bar'> = {
  responsive: true,
  plugins: { legend: { display: false } },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' } }
  },
  animation: { duration: 450, easing: 'easeOutQuart' }
}

const lineOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: { legend: { display: false } },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.2)' } }
  },
  animation: { duration: 450, easing: 'easeOutQuart' }
}
</script>

<template>
  <div class="p-4">
    <div class="mb-4 flex items-center gap-4">
      <RouterLink to="/dashboard" class="text-primary-600">Dashboard</RouterLink>

      <RouterLink to="/" class="text-gray-500 dark:text-zinc-400 hover:text-primary-600"
        >Boards
      </RouterLink>
      /
    </div>

    <hr class="my-4 border-slate-300 dark:border-zinc-800" />
    <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <div
        class="rounded-lg border border-slate-300 shadow-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-indigo-100 dark:bg-indigo-900">
            <ClipboardDocumentListIcon class="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
          </div>
          <div>
            <div class="text-xs text-zinc-500">Total Tasks</div>
            <div class="text-2xl font-semibold">{{ allTasks.length }}</div>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border border-slate-300 shadow-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-blue-100 dark:bg-blue-900">
            <CalendarDaysIcon class="w-5 h-5 text-blue-600 dark:text-blue-300" />
          </div>
          <div>
            <div class="text-xs text-zinc-500">Scheduled</div>
            <div class="text-2xl font-semibold">{{ scheduledTasks.length }}</div>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border border-slate-300 shadow-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-amber-100 dark:bg-amber-900">
            <ClockIcon class="w-5 h-5 text-amber-600 dark:text-amber-300" />
          </div>
          <div>
            <div class="text-xs text-zinc-500">Unscheduled</div>
            <div class="text-2xl font-semibold">{{ allTasks.length - scheduledTasks.length }}</div>
          </div>
        </div>
      </div>
      <div
        class="rounded-lg border border-slate-300 shadow-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="flex items-center gap-3">
          <div class="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900">
            <CheckCircleIcon class="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          </div>
          <div>
            <div class="text-xs text-zinc-500">Completed</div>
            <div class="text-2xl font-semibold">{{ completedTasks.length }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div
        class="rounded-lg border border-slate-300 shadow-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="mb-3 text-sm font-medium">Scheduled tasks by day (Bars)</div>
        <Bar :data="barData" :options="barOptions" style="height: 260px" />
      </div>
      <div
        class="rounded-lg border border-slate-300 shadow-lg bg-white dark:bg-zinc-900 dark:border-zinc-800 p-4"
      >
        <div class="mb-3 text-sm font-medium">Scheduled tasks trend (Line)</div>
        <canvas ref="canvasRef" class="hidden"></canvas>
        <Line :data="lineData" :options="lineOptions" style="height: 260px" />
      </div>
    </div>
  </div>
</template>
