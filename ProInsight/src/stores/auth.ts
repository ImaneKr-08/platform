import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
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
  const mockUsers: Record<string, { password: string; name: string; role: 'admin' | 'professor'; department?: string }> = {
    'admin@proinsight.edu': { password: 'admin123', name: 'Dr. Sarah Connor', role: 'admin' },
    'prof.miller@proinsight.edu': { password: 'prof123', name: 'Prof. Sarah Miller', role: 'professor', department: 'Computer Science' },
    'prof.vance@proinsight.edu': { password: 'prof123', name: 'Prof. Elena Vance', role: 'professor', department: 'Bio-Engineering' }
  }

  const userRole = computed(() => user.value?.role || null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isProfessor = computed(() => user.value?.role === 'professor')

  function login(email: string, password: string, remember: boolean): boolean {
    const matched = mockUsers[email.toLowerCase().trim()]
    if (matched && matched.password === password) {
      user.value = {
        email: email.toLowerCase().trim(),
        name: matched.name,
        role: matched.role,
        department: matched.department
      }
      isAuthenticated.value = true
      
      if (remember) {
        localStorage.setItem('proinsight_auth', JSON.stringify(user.value))
      }
      return true
    }
    return false
  }

  function logout() {
    user.value = null
    isAuthenticated.value = false
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
