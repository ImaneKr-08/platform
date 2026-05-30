<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useMonitoringStore } from '../stores/monitoring'
import { User, Sun, Moon, Bell, Shield, Info, Check } from 'lucide-vue-next'

const authStore = useAuthStore()
const monitoringStore = useMonitoringStore()

// Profile states
const profileName = ref(authStore.user?.name || '')
const profileEmail = ref(authStore.user?.email || '')
const isProfileSaved = ref(false)

// Notifications settings
const enableSound = ref(true)
const enableMails = ref(false)

function saveProfile() {
  authStore.updateProfile(profileName.value, profileEmail.value)
  isProfileSaved.value = true
  setTimeout(() => {
    isProfileSaved.value = false
  }, 2000)
}

function handleThemeChange(targetTheme: 'light' | 'dark') {
  if (authStore.theme !== targetTheme) {
    authStore.toggleTheme()
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-8 select-none animate-fade-in pb-12">
    
    <!-- Profile Card settings -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden">
      <div class="p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 flex items-center gap-3">
        <User class="h-5 w-5 text-[#026783]" />
        <h4 class="text-sm font-bold text-[var(--text-primary)]">User Profile Settings</h4>
      </div>

      <div class="p-6 space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
            <input
              v-model="profileName"
              type="text"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
            <input
              v-model="profileEmail"
              type="email"
              class="input-field"
            />
          </div>
        </div>

        <div class="flex items-center justify-between pt-3">
          <span class="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
            <Info class="h-3.5 w-3.5" />
            Changing credentials resets session token values.
          </span>
          <button
            @click="saveProfile"
            class="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Check v-if="isProfileSaved" class="h-4 w-4" />
            {{ isProfileSaved ? 'Profile Updated' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Theme selections -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden">
      <div class="p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 flex items-center gap-3">
        <Sun class="h-5 w-5 text-amber-500" />
        <h4 class="text-sm font-bold text-[var(--text-primary)]">Theme & Visual Appearance</h4>
      </div>

      <div class="p-6">
        <div class="grid grid-cols-2 gap-6">
          <!-- Light Theme Card -->
          <div
            @click="handleThemeChange('light')"
            class="border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30"
            :class="authStore.theme === 'light' ? 'border-[#026783] bg-sky-50/10' : 'border-[var(--border-color)]'"
          >
            <Sun class="h-8 w-8 text-amber-500" />
            <span class="text-xs font-bold text-[var(--text-primary)]">Light Interface</span>
          </div>

          <!-- Dark Theme Card -->
          <div
            @click="handleThemeChange('dark')"
            class="border-2 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-900/30"
            :class="authStore.theme === 'dark' ? 'border-[#026783] bg-sky-50/10' : 'border-[var(--border-color)]'"
          >
            <Moon class="h-8 w-8 text-indigo-400" />
            <span class="text-xs font-bold text-[var(--text-primary)]">Dark Interface</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alarm siren / mail preferences -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden">
      <div class="p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 flex items-center gap-3">
        <Bell class="h-5 w-5 text-indigo-500" />
        <h4 class="text-sm font-bold text-[var(--text-primary)]">Notification & Warnings Preferences</h4>
      </div>

      <div class="p-6 space-y-4">
        <label class="flex items-start gap-3 cursor-pointer">
          <input
            v-model="enableSound"
            type="checkbox"
            class="rounded border-[var(--border-color)] bg-[var(--bg-primary)] text-[#026783] mt-0.5"
          />
          <div class="text-xs">
            <span class="font-bold text-[var(--text-primary)] block">Play audio siren during high stress alerts</span>
            <span class="text-[var(--text-muted)] mt-0.5 block leading-relaxed">Triggers a soft buzzer ping when student stress indexes spike above 75% telemetry threshold.</span>
          </div>
        </label>

        <label class="flex items-start gap-3 cursor-pointer pt-3 border-t border-[var(--border-color)]">
          <input
            v-model="enableMails"
            type="checkbox"
            class="rounded border-[var(--border-color)] bg-[var(--bg-primary)] text-[#026783] mt-0.5"
          />
          <div class="text-xs">
            <span class="font-bold text-[var(--text-primary)] block">Receive exam stress reports summaries</span>
            <span class="text-[var(--text-muted)] mt-0.5 block leading-relaxed">Emails full stress index analytics and anomalies incident logs once examination monitoring ends.</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Simulation specifications debug -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xs overflow-hidden">
      <div class="p-5 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/40 flex items-center gap-3">
        <Shield class="h-5 w-5 text-emerald-500" />
        <h4 class="text-sm font-bold text-[var(--text-primary)]">Mock Telemetry Diagnostic Engine</h4>
      </div>

      <div class="p-6 text-xs text-[var(--text-secondary)] space-y-3.5">
        <p class="leading-relaxed">
          The ProctorInsight platform operates on a simulated WebSocket event bus mapping. 
          Desks can host telemetry jitter loops simulating active ESP32 device transmissions.
        </p>

        <div class="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
          <Info class="h-4.5 w-4.5 text-[#026783] shrink-0" />
          <p class="leading-relaxed">
            WebSocket simulation ticker loop is set to update metrics every <span class="font-bold text-[#026783]">3.0 seconds</span>. 
            Check-ins scan events check every ticker instance.
          </p>
        </div>
      </div>
    </div>

  </div>
</template>
