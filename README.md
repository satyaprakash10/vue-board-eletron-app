# Electron + Vue DnD (BlitzIt)

Desktop app built with Electron + Vite + Vue 3 + TypeScript. Provides Kanban-style drag-and-drop boards with scheduling, subtasks, and a dashboard with charts. State persists in localStorage.

## Quick Start

```bash
cd electron-vue-dnd
npm install
npm run dev
```

## Scripts

- `npm run dev` — start Electron with HMR
- `npm run build` — typecheck and build the app
- `npm run build:mac|win|linux` — platform builds
- `npm run lint` — lint code

## Tools and Libraries

- **Electron + Vite**: desktop runtime and bundling
- **Vue 3 + TypeScript**: UI framework
- **Vue Router**: navigation between Boards and Dashboard
- **Tailwind CSS v4**: styling
- **InteractJS**: drag-and-drop interactions
- **Vue Virtual Scroller / TanStack Virtual**: performant lists
- **@vuepic/vue-datepicker**: date picker for scheduling
- **Chart.js v4 + vue-chartjs v5**: charts on the dashboard

## Feature Walkthrough

- **Boards**
  - Columns: Backlog, Today, Next week, Tomorrow
  - Create task: title, description, optional scheduled date/time, subtasks
  - Drag-and-drop tasks between positions/sections/boards
  - Detach confirmation when moving scheduled tasks (prevents accidental loss of schedule)
- **Dashboard**
  - KPIs: total tasks, scheduled/unscheduled counts
  - Charts: bar and line charts for scheduled tasks by day (Chart.js v4)
  - Smooth animations and responsive layout
- **Persistence**
  - All boards/tasks state saved to `localStorage` under `blitzit_dnd_state_v1`
  - State rehydrated at startup

## Data Model (High level)

- `Board` → `Section[]` → `Task[]`
- `Task` has: `title`, `description`, `scheduledAt` (ISO or null), `subtasks[]`, `order`

## What’s Been Done (Changelog)

- Upgraded graph plugins to **Chart.js v4** and **vue-chartjs v5**; migrated dashboard to `Bar`/`Line` components and v4 registration API
- Added placeholders to date pickers for better UX
- Implemented **localStorage** persistence (load on init, save on deep changes)
- Created dashboard KPIs and charts based on scheduled tasks aggregation

## Why These Choices

- **Chart.js v4 + vue-chartjs v5**: modern API, Vue 3 compatibility, better performance and maintenance
- **localStorage**: lightweight persistence without backend; perfect for desktop demo and offline use
- **InteractJS**: robust DnD with fine-grained control over drop zones and events
- **Tailwind CSS**: rapid styling and consistent dark/light theming

## Packaging

- `npm run build` then `electron-builder` via scripts (`build:mac|win|linux`) to create distributables.

## Troubleshooting

- If chart components fail, ensure `chart.js` and `vue-chartjs` versions match (v4/v5)
- Clear localStorage if mock data shape changes: DevTools → Application → Local Storage → remove `blitzit_dnd_state_v1`
