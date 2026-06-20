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

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()

  if (!authStore.authReady) {
    await authStore.initAuth()
  }

  const isAuth = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin

  if (to.meta.requiresAuth && !isAuth) {
    // Not logged in → go to login, replace history so back button doesn't loop
    return next({ name: 'Login', replace: true })
  }

  if (to.meta.guestOnly && isAuth) {
    // Already logged in → skip login page
    return next({ name: 'Dashboard', replace: true })
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    // Professor tried admin page → back to dashboard
    return next({ name: 'Dashboard', replace: true })
  }

  next()
})

export default router
