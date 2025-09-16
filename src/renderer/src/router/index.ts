import { createRouter, createWebHashHistory } from 'vue-router'
import BoardsView from '../views/BoardsView.vue'
import DashboardView from '../views/DashboardView.vue'

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'boards', component: BoardsView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView }
  ]
})
