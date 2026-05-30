<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useMonitoringStore } from '../stores/monitoring'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Grid,
  QrCode,
  Calendar,
  Activity,
  TrendingUp,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  User
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const monitoringStore = useMonitoringStore()

const isMobileOpen = ref(false)

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const isProfessor = computed(() => authStore.isProfessor)
const currentTheme = computed(() => authStore.theme)

const currentExamId = computed(() => {
  if (monitoringStore.isSessionActive && monitoringStore.activeExamId) {
    return monitoringStore.activeExamId
  }
  return 'active-session' // fallback placeholder for link
})

// Build menu items based on role
const menuItems = computed(() => {
  const common = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Monitor', path: `/monitoring`, icon: Activity },
    { name: 'Analytics', path: '/analytics', icon: TrendingUp },
    { name: 'Settings', path: '/settings', icon: Settings }
  ]

  if (isAdmin.value) {
    return [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Students', path: '/students', icon: Users },
      { name: 'Professors', path: '/professors', icon: GraduationCap },
      { name: 'Classrooms', path: '/classrooms', icon: Grid },
      { name: 'QR Codes', path: '/qr-code', icon: QrCode },
      { name: 'Exams', path: '/exams', icon: Calendar },
      { name: 'Live Monitor', path: `/monitoring`, icon: Activity },
      { name: 'Analytics', path: '/analytics', icon: TrendingUp },
      { name: 'Settings', path: '/settings', icon: Settings }
    ]
  }

  return common
})

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function toggleMobileSidebar() {
  isMobileOpen.value = !isMobileOpen.value
}

function handleLinkClick(path: string) {
  isMobileOpen.value = false
  router.push(path)
}

const pageTitle = computed(() => {
  const name = route.name as string
  if (!name) return 'Platform'
  if (name === 'Dashboard') return 'Overview Dashboard'
  if (name === 'QRCode') return 'QR Code Generator'
  if (name === 'LiveMonitoring') return 'Exam Live Monitoring'
  return name
})
</script>

<template>
  <div class="min-h-screen flex text-[var(--text-primary)] bg-[var(--bg-primary)] transition-colors duration-200">
    
    <!-- Desktop Sidebar -->
    <aside class="hidden lg:flex flex-col w-64 shrink-0 bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
      <div class="h-16 flex items-center px-6 border-b border-[var(--border-color)] select-none">
        <span class="text-xl font-bold tracking-tight text-[#026783] dark:text-[#0588ad] flex items-center gap-2">
          <Activity class="h-6 w-6 text-emerald-500 animate-pulse" />
          ProctorInsight
        </span>
      </div>
      
      <!-- Role Badge -->
      <div class="px-6 pt-4 pb-2">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold select-none"
             :class="isAdmin ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
          <span class="w-1.5 h-1.5 rounded-full" :class="isAdmin ? 'bg-indigo-500' : 'bg-amber-500'"></span>
          {{ isAdmin ? 'Administrator' : 'Professor' }}
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <button
          v-for="item in menuItems"
          :key="item.name"
          @click="handleLinkClick(item.path)"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
          :class="route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path))
            ? 'bg-[#041627] text-white' 
            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.name }}
        </button>
      </nav>

      <!-- User footer -->
      <div class="p-4 border-t border-[var(--border-color)]">
        <div class="flex items-center gap-3 mb-3">
          <div class="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center">
            <User class="h-5 w-5 text-[var(--text-secondary)]" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold truncate leading-tight">{{ user?.name }}</p>
            <p class="text-[10px] text-[var(--text-muted)] truncate leading-tight">{{ user?.email }}</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30"
        >
          <LogOut class="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>

    <!-- Mobile Sidebar Drawer -->
    <div v-if="isMobileOpen" class="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-sm" @click.self="toggleMobileSidebar">
      <div class="w-64 bg-[var(--bg-secondary)] h-full flex flex-col animate-in slide-in-from-left duration-200">
        <div class="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)]">
          <span class="text-lg font-bold tracking-tight text-[#026783] dark:text-[#0588ad] flex items-center gap-2">
            <Activity class="h-5 w-5 text-emerald-500 animate-pulse" />
            ProctorInsight
          </span>
          <button @click="toggleMobileSidebar" class="p-1 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]">
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="px-6 pt-4 pb-2">
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
               :class="isAdmin ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
            <span class="w-1.5 h-1.5 rounded-full" :class="isAdmin ? 'bg-indigo-500' : 'bg-amber-500'"></span>
            {{ isAdmin ? 'Administrator' : 'Professor' }}
          </div>
        </div>

        <nav class="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <button
            v-for="item in menuItems"
            :key="item.name"
            @click="handleLinkClick(item.path)"
            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
            :class="route.path === item.path || (item.path !== '/' && route.path.startsWith(item.path))
              ? 'bg-[#041627] text-white' 
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'"
          >
            <component :is="item.icon" class="h-4 w-4 shrink-0" />
            {{ item.name }}
          </button>
        </nav>

        <div class="p-4 border-t border-[var(--border-color)]">
          <div class="flex items-center gap-3 mb-3">
            <div class="h-9 w-9 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center">
              <User class="h-5 w-5 text-[var(--text-secondary)]" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold truncate leading-tight">{{ user?.name }}</p>
              <p class="text-[10px] text-[var(--text-muted)] truncate leading-tight">{{ user?.email }}</p>
            </div>
          </div>
          <button
            @click="handleLogout"
            class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
          >
            <LogOut class="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
      <!-- Navbar / Top Header -->
      <header class="h-16 shrink-0 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-4">
          <!-- Mobile Sidebar Toggle -->
          <button
            @click="toggleMobileSidebar"
            class="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] lg:hidden border border-[var(--border-color)]"
          >
            <Menu class="h-5 w-5" />
          </button>
          
          <h1 class="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
            {{ pageTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-4">
          <!-- Theme Toggle -->
          <button
            @click="authStore.toggleTheme"
            class="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] transition-colors"
            title="Toggle Theme"
          >
            <Sun v-if="currentTheme === 'dark'" class="h-4.5 w-4.5" />
            <Moon v-else class="h-4.5 w-4.5" />
          </button>
          
          <!-- Profile Badge -->
          <div class="flex items-center gap-2 pl-2 border-l border-[var(--border-color)]">
            <div class="h-8 w-8 rounded-full bg-[#026783] text-white flex items-center justify-center font-bold text-xs select-none">
              {{ user?.name.split(' ').map(n => n[0]).join('').substring(0,2) }}
            </div>
            <span class="hidden md:inline text-xs font-semibold text-[var(--text-secondary)]">{{ user?.name }}</span>
          </div>
        </div>
      </header>

      <!-- View Area -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(4px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
