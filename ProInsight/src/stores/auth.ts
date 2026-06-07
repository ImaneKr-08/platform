import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'professor'
  department?: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const notificationsEnabled = ref(true)

  // Pre-configured mock credentials


  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isProfessor = computed(() => user.value?.role === 'professor')

  async function login(
    email: string,
    password: string,
    remember: boolean,
  ): Promise<boolean> {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      const { accessToken, refreshToken, user: backendUser } = response.data

      localStorage.setItem('proinsight_access_token', accessToken)
      localStorage.setItem('proinsight_refresh_token', refreshToken)

      user.value = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name ?? backendUser.email.split('@')[0],
        role: backendUser.role.toLowerCase() as 'admin' | 'professor',
        department: backendUser.department,
      }

      isAuthenticated.value = true

      if (remember) {
        localStorage.setItem('proinsight_auth', JSON.stringify(user.value))
      }

      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }
  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (_) { }

    user.value = null
    isAuthenticated.value = false

    localStorage.removeItem('proinsight_access_token')
    localStorage.removeItem('proinsight_refresh_token')
    localStorage.removeItem('proinsight_auth')
  }

  function updateProfile(name: string, email: string) {
    if (user.value) {
      user.value.name = name
      user.value.email = email
    }
  }

  function initAuth() {
    const saved = localStorage.getItem('proinsight_auth')
    if (saved) {
      user.value = JSON.parse(saved)
      isAuthenticated.value = true
    }

    // Theme setup
    const savedTheme = localStorage.getItem('proinsight_theme') as 'light' | 'dark'
    if (savedTheme) {
      theme.value = savedTheme
      applyTheme()
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
      applyTheme()
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('proinsight_theme', theme.value)
    applyTheme()
  }

  function applyTheme() {
    const root = document.documentElement
    if (theme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  return {
    user,
    isAuthenticated,
    userRole,
    isAdmin,
    isProfessor,
    theme,
    notificationsEnabled,
    login,
    logout,
    updateProfile,
    initAuth,
    toggleTheme
  }
})
