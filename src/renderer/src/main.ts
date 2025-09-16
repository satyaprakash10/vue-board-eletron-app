import './assets/tailwind.css'
import './assets/main.css'
import 'v-calendar/style.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import VCalendar from 'v-calendar'

createApp(App).use(router).use(VCalendar, {}).mount('#app')
