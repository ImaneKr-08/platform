<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { Activity, ShieldAlert, KeyRound, Mail, ArrowRight } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errorMsg = ref('')
const isLoading = ref(false)

const showForgotMsg = ref(false)

function hideForgotMsg() {
  setTimeout(() => {
    showForgotMsg.value = false
  }, 5000)
}

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMsg.value = 'Please enter both email and password.'
    return
  }
  
  errorMsg.value = ''
  isLoading.value = true
  
  // Simulate minor network delay for premium feel
  setTimeout(async () => {
    const success = await authStore.login(email.value, password.value, rememberMe.value)
    isLoading.value = false
    if (success) {
      router.push('/')
    } else {
      errorMsg.value = 'Invalid email or password. Check credentials below.'
    }
  }, 800)
}

function quickFill(role: 'admin' | 'professor') {
  if (role === 'admin') {
    email.value = 'admin@proinsight.edu'
    password.value = 'admin123'
  } else {
    email.value = 'prof.miller@proinsight.edu'
    password.value = 'prof123'
  }
  errorMsg.value = ''
}
</script>

<template>
  <div class="min-h-screen relative flex items-center justify-center bg-[#041627] text-slate-100 overflow-hidden font-sans px-4">
    <!-- Decorative background glow -->
    <div class="absolute -top-40 -left-40 w-96 h-96 bg-[#026783] opacity-20 rounded-full blur-3xl"></div>
    <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500 opacity-15 rounded-full blur-3xl"></div>

    <div class="w-full max-w-md z-10 flex flex-col items-center">
      <!-- Logo Branding -->
      <div class="flex items-center gap-3 mb-6 select-none animate-fade-in">
        <Activity class="h-8 w-8 text-emerald-400" />
        <span class="text-2xl font-extrabold tracking-tight text-white">ProctorInsight</span>
      </div>

      <!-- Login Glass Card -->
      <div class="w-full bg-[#0d1e30]/80 border border-slate-800 rounded-xl p-8 shadow-2xl backdrop-blur-md">
        <h2 class="text-xl font-bold text-center text-white mb-2">Welcome Back</h2>
        <p class="text-xs text-slate-400 text-center mb-8">Exam stress telemetry platform login</p>

        <!-- Error panel -->
        <div v-if="errorMsg" class="mb-5 flex items-start gap-2.5 bg-rose-950/40 border border-rose-900/60 p-3 rounded-lg text-xs text-rose-300">
          <ShieldAlert class="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
          <span>{{ errorMsg }}</span>
        </div>

        <!-- Forgot Password Toast -->
        <div v-if="showForgotMsg" class="mb-5 flex items-start gap-2.5 bg-emerald-950/40 border border-emerald-900/60 p-3 rounded-lg text-xs text-emerald-300">
          <span>Password reset links are managed by your university admin team. Please contact IT support.</span>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Email -->
          <div>
            <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <div class="relative">
              <Mail class="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                v-model="email"
                type="email"
                placeholder="professor@university.edu"
                class="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#026783] focus:ring-2 focus:ring-[#026783]/30 transition-all"
                required
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Password</label>
              <button type="button" @click="showForgotMsg = true; hideForgotMsg()" class="text-[11px] font-semibold text-[#026783] hover:text-[#0588ad] hover:underline">
                Forgot password?
              </button>
            </div>
            <div class="relative">
              <KeyRound class="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#026783] focus:ring-2 focus:ring-[#026783]/30 transition-all"
                required
              />
            </div>
          </div>

          <!-- Options -->
          <div class="flex items-center justify-between py-1">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" v-model="rememberMe" class="rounded border-slate-800 bg-slate-950/50 text-[#026783] focus:ring-0" />
              <span class="text-xs text-slate-400">Remember session</span>
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex items-center justify-center gap-2 bg-[#026783] hover:bg-[#0588ad] disabled:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg active:scale-98"
          >
            <span v-if="isLoading" class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span v-else class="flex items-center gap-1.5">
              Access Platform
              <ArrowRight class="h-4 w-4" />
            </span>
          </button>
        </form>
      </div>

      <!-- Quick Test Panel -->
      <div class="w-full mt-6 bg-[#081320] border border-slate-900 rounded-xl p-5 shadow-lg select-none">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-3">Quick Credentials Switcher</h4>
        <div class="grid grid-cols-2 gap-3">
          <button
            @click="quickFill('admin')"
            class="flex flex-col items-center p-2.5 rounded-lg border border-slate-800 bg-[#0d1e30]/30 hover:bg-[#0d1e30]/80 transition-colors text-left"
          >
            <span class="text-xs font-bold text-white leading-tight">Admin Role</span>
            <span class="text-[9px] text-indigo-400 mt-0.5">Click to auto-fill</span>
          </button>
          
          <button
            @click="quickFill('professor')"
            class="flex flex-col items-center p-2.5 rounded-lg border border-slate-800 bg-[#0d1e30]/30 hover:bg-[#0d1e30]/80 transition-colors text-left"
          >
            <span class="text-xs font-bold text-white leading-tight">Professor Role</span>
            <span class="text-[9px] text-amber-400 mt-0.5">Click to auto-fill</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
