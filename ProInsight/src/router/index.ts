import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/',
    component: () => import('../layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue')
      },
      {
        path: 'students',
        name: 'Students',
        component: () => import('../views/Students.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'professors',
        name: 'Professors',
        component: () => import('../views/Professors.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'classrooms',
        name: 'Classrooms',
        component: () => import('../views/Classrooms.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'qr-code',
        name: 'QRCode',
        component: () => import('../views/QRCodeGenerator.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'exams',
        name: 'Exams',
        component: () => import('../views/Exams.vue'),
        meta: { requiresAdmin: true }
      },
      {
        path: 'monitoring/:examId?',
        name: 'LiveMonitoring',
        component: () => import('../views/LiveMonitoring.vue')
      },
      {
        path: 'analytics',
        name: 'Analytics',
        component: () => import('../views/Analytics.vue')
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue')
      }
    ]
  },
  // Catch all redirect to dashboard
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Make sure auth is initialized (load from localStorage)
  if (!authStore.isAuthenticated) {
    authStore.initAuth()
  }

  const isAuth = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  if (to.meta.requiresAuth && !isAuth) {
    next({ name: 'Login' })
  } else if (to.meta.guestOnly && isAuth) {
    next({ name: 'Dashboard' })
  } else if (to.meta.requiresAdmin && !isAdmin) {
    // If professor tries to access admin-only page, redirect to dashboard
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
