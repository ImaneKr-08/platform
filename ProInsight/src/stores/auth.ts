import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

export interface User {
  id: number
  email: string
  name: string
  role: 'ADMIN' | 'PROFESSOR' | 'admin' | 'professor'
}

function parseSavedUser(raw: string | null): User | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

function mapBackendUser(backendUser: {
  id: number
  email: string
  name?: string
  role: string
}): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.name ?? backendUser.email.split('@')[0],
    role: backendUser.role.toLowerCase() as any,
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const authReady = ref(false)
  const theme = ref<'light' | 'dark'>('light')
  const notificationsEnabled = ref(true)

  let initPromise: Promise<void> | null = null

  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => user.value?.role?.toUpperCase() === 'ADMIN')
  const isProfessor = computed(() => user.value?.role?.toUpperCase() === 'PROFESSOR')

  function applyTheme() {
    const root = document.documentElement
    if (theme.value === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('proinsight_theme') as 'light' | 'dark'
    if (savedTheme) {
      theme.value = savedTheme
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      theme.value = prefersDark ? 'dark' : 'light'
    }
    applyTheme()
  }

  function persistUser(nextUser: User) {
    user.value = nextUser
    isAuthenticated.value = true
    localStorage.setItem('proinsight_auth', JSON.stringify(nextUser))
  }

  function clearSession() {
    user.value = null
    isAuthenticated.value = false
    localStorage.removeItem('proinsight_access_token')
    localStorage.removeItem('proinsight_refresh_token')
    localStorage.removeItem('proinsight_auth')
    disconnectSocket()
  }

  async function tryRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem('proinsight_refresh_token')
    if (!refreshToken) return false

    try {
      const { data } = await api.post('/auth/refresh', { refreshToken })
      localStorage.setItem('proinsight_access_token', data.accessToken)
      localStorage.setItem('proinsight_refresh_token', data.refreshToken)

      if (data.user) {
        persistUser(mapBackendUser(data.user))
      }

      return true
    } catch {
      return false
    }
  }

  async function restoreSessionFromBackend(fallbackUser: User | null) {
    const { data } = await api.get('/auth/profile')
    const restored = mapBackendUser({
      id: data.id,
      email: data.email,
      role: data.role,
      name: fallbackUser?.email === data.email ? fallbackUser?.name : undefined,
    })
    persistUser(restored)
    connectSocket()
  }

  async function doInitAuth() {
    initTheme()

    const accessToken = localStorage.getItem('proinsight_access_token')
    const refreshToken = localStorage.getItem('proinsight_refresh_token')
    const fallbackUser = parseSavedUser(localStorage.getItem('proinsight_auth'))

    if (!accessToken && !refreshToken && !fallbackUser) {
      clearSession()
      return
    }

    if (fallbackUser && !user.value) {
      user.value = fallbackUser
    }

    try {
      if (accessToken) {
        await restoreSessionFromBackend(fallbackUser)
        return
      }
    } catch {
      // Access token expired or invalid — fall through to refresh
    }

    if (refreshToken) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        try {
          await restoreSessionFromBackend(fallbackUser)
          return
        } catch {
          // Profile failed even after refresh
        }
      }
    }

    clearSession()
  }

  async function initAuth(): Promise<void> {
    if (authReady.value) return
    if (!initPromise) {
      initPromise = doInitAuth().finally(() => {
        authReady.value = true
      })
    }
    return initPromise
  }

  async function login(
    email: string,
    password: string,
    _remember: boolean,
  ): Promise<boolean> {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      })

      const { accessToken, refreshToken, user: backendUser } = response.data

      localStorage.setItem('proinsight_access_token', accessToken)
      localStorage.setItem('proinsight_refresh_token', refreshToken)
      persistUser(mapBackendUser(backendUser))
      connectSocket()

      return true
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  async function logout() {
    clearSession()

    try {
      await api.post('/auth/logout')
    } catch (_) { }
  }

  function updateProfile(name: string, email: string) {
    if (user.value) {
      user.value.name = name
      user.value.email = email
      localStorage.setItem('proinsight_auth', JSON.stringify(user.value))
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('proinsight_theme', theme.value)
    applyTheme()
  }

  return {
    user,
    isAuthenticated,
    authReady,
    userRole,
    isAdmin,
    isProfessor,
    theme,
    notificationsEnabled,
    login,
    logout,
    clearSession,
    tryRefreshToken,
    updateProfile,
    initAuth,
    toggleTheme,
  }
})
