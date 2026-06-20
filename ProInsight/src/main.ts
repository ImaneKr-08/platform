import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useAuthStore } from './stores/auth'
import { setSessionExpiredHandler } from './services/api'

async function bootstrap() {
  const app = createApp(App)
  const pinia = createPinia()

  app.use(pinia)
  app.use(router)

  const authStore = useAuthStore()

  setSessionExpiredHandler(() => {
    authStore.clearSession()
    if (router.currentRoute.value.name !== 'Login') {
      router.replace({ name: 'Login' })
    }
  })

  await authStore.initAuth()
  await router.isReady()
  app.mount('#app')
}

bootstrap()
