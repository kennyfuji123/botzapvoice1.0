import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import ContactsView from '../views/ContactsView.vue'
import AutoMessagesView from '../views/AutoMessagesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/contacts',
      name: 'contacts',
      component: ContactsView
    },
    {
      path: '/auto-messages',
      name: 'auto-messages',
      component: AutoMessagesView
    }
  ]
})

export default router 