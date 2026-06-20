import axios, { type InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let onSessionExpired: (() => void) | null = null
let isRefreshing = false
let refreshQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

function flushRefreshQueue(error: unknown, token: string | null = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  refreshQueue = []
}

function clearStoredAuth() {
  localStorage.removeItem('proinsight_access_token')
  localStorage.removeItem('proinsight_refresh_token')
  localStorage.removeItem('proinsight_auth')
}

function handleSessionExpired() {
  clearStoredAuth()
  onSessionExpired?.()
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = localStorage.getItem('proinsight_refresh_token')
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken })
  localStorage.setItem('proinsight_access_token', data.accessToken)
  localStorage.setItem('proinsight_refresh_token', data.refreshToken)

  if (data.user) {
    localStorage.setItem('proinsight_auth', JSON.stringify({
      id: data.user.id,
      email: data.user.email,
      name: data.user.name ?? data.user.email.split('@')[0],
      role: data.user.role.toLowerCase(),
    }))
  }

  return data.accessToken
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('proinsight_access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const status = error.response?.status
    const requestUrl = originalRequest?.url ?? ''

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`
        return api(originalRequest)
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const newToken = await refreshAccessToken()
      flushRefreshQueue(null, newToken)
      originalRequest.headers.Authorization = `Bearer ${newToken}`
      return api(originalRequest)
    } catch (refreshError) {
      flushRefreshQueue(refreshError, null)
      handleSessionExpired()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
