<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useStudentsStore } from '../stores/students'
import { useProfessorsStore } from '../stores/professors'
import { useClassroomsStore } from '../stores/classrooms'
import { useExamsStore } from '../stores/exams'
import { useMonitoringStore } from '../stores/monitoring'
import BaseChart from '../components/BaseChart.vue'
import {
  Users,
  GraduationCap,
  Calendar,
  Activity,
  AlertTriangle,
  Play,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const studentsStore = useStudentsStore()
const professorsStore = useProfessorsStore()
const classroomsStore = useClassroomsStore()
const examsStore = useExamsStore()
const monitoringStore = useMonitoringStore()

onMounted(() => {
  studentsStore.initStudents()
  professorsStore.initProfessors()
  classroomsStore.initClassrooms()
  examsStore.initExams()
})

const isAdmin = computed(() => authStore.isAdmin)
const user = computed(() => authStore.user)

// Counts
const totalStudents = computed(() => studentsStore.students.length)
const totalProfessors = computed(() => professorsStore.professors.length)
const activeExamsCount = computed(() => examsStore.exams.filter(e => e.status === 'active').length)
const totalClassrooms = computed(() => classroomsStore.classrooms.length)

// Realtime metrics from monitoring store
const connectedStudents = computed(() => {
  if (monitoringStore.isSessionActive) {
    return monitoringStore.connectedStudentsCount
  }
  return 0
})

const studentsAtRisk = computed(() => {
  if (monitoringStore.isSessionActive) {
    return monitoringStore.studentsAtRiskCount
  }
  return 0
})

// Logs
const recentActivity = computed(() => {
  if (monitoringStore.isSessionActive && monitoringStore.activityLogs.length > 0) {
    return monitoringStore.activityLogs.slice(0, 5)
  }
  return [
    { id: '1', timestamp: '10:14:02 AM', message: 'System diagnostics complete. All systems nominal.', type: 'success' },
    { id: '2', timestamp: '09:00:00 AM', message: 'Exam scheduler initialized database tables.', type: 'info' }
  ]
})

// Professor specific data
const profExams = computed(() => {
  return examsStore.exams.filter(e => e.professorEmail.toLowerCase() === user.value?.email.toLowerCase())
})

const hasActiveProfExam = computed(() => {
  return profExams.value.some(e => e.status === 'active')
})

const activeProfExam = computed(() => {
  return profExams.value.find(e => e.status === 'active') || null
})

// Navigation
function goToMonitor(examId: number) {
  router.push(`/monitoring/${examId}`)
}

function startExamSession(examId: number) {
  const numericExamId = typeof examId === 'string' ? parseInt(examId, 10) : examId
  if (!Number.isFinite(numericExamId)) return

  monitoringStore.startMonitoring(numericExamId)
  goToMonitor(examId)
}

// Chart Mock Data
const stressOverviewData = [22, 28, 35, 41, 55, 62, 45, 34, 25]
const stressOverviewLabels = ['09:00', '09:20', '09:40', '10:00', '10:20', '10:40', '11:00', '11:20', '11:40']

const activeSessionsData = [4, 7, 10, 15, 12, 8, 5]
const activeSessionsLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const highStressAlertsData = [12, 18, 5, 22, 30, 15, 8]
const highStressAlertsLabels = ['Exam A', 'Exam B', 'Exam C', 'Exam D', 'Exam E', 'Exam F', 'Exam G']
</script>

<template>
  <div class="space-y-8 select-none">
    
    <!-- PROFESSOR VIEWS -->
    <div v-if="!isAdmin" class="space-y-8 animate-fade-in">
      <!-- Welcome card -->
      <div class="p-6 bg-gradient-to-r from-[#041627] to-[#0d2a45] rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <h2 class="text-xl sm:text-2xl font-bold tracking-tight mb-2">Hello, {{ user?.name }}</h2>
          <p class="text-sm text-slate-300">Welcome to ProctorInsight. Below are your assigned exams and stress levels monitoring overview.</p>
        </div>
        <div class="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1.5 rounded-full text-xs text-emerald-400 font-semibold w-fit">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Telemetry Connected
        </div>
      </div>

      <!-- Active Session Alert Banner -->
      <div v-if="hasActiveProfExam && activeProfExam" class="p-6 bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/30 rounded-2xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex gap-4">
          <div class="h-12 w-12 bg-rose-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg glow-red">
            <Activity class="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 class="text-base font-bold text-rose-900 dark:text-rose-300">Assigned Exam is currently LIVE!</h3>
            <p class="text-xs text-rose-700 dark:text-rose-400 mt-1 flex items-center gap-3">
              <span class="font-semibold">{{ activeProfExam.name }}</span>
              <span class="flex items-center gap-1"><MapPin class="h-3 w-3" /> {{ activeProfExam.classroomName }}</span>
            </p>
          </div>
        </div>
        <button
          @click="goToMonitor(activeProfExam.id)"
          class="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-sm font-semibold transition-all shadow-md active:scale-98"
        >
          <Play class="h-4 w-4 fill-current" />
          Open Monitoring Board
        </button>
      </div>

      <!-- Assigned Exams Grid -->
      <div>
        <h3 class="text-base font-bold text-[var(--text-primary)] tracking-tight mb-4 flex items-center gap-2">
          <Calendar class="h-4.5 w-4.5 text-[#026783]" />
          Assigned Examination Schedule
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="exam in profExams"
            :key="exam.id"
            class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
          >
            <div class="flex justify-between items-start mb-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                    :class="exam.status === 'active' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : (exam.status === 'completed' ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300')">
                {{ exam.status.toUpperCase() }}
              </span>
            </div>
            
            <h4 class="text-sm font-bold text-[var(--text-primary)] truncate">{{ exam.name }}</h4>
            <p class="text-xs text-[var(--text-secondary)] mt-1 truncate">{{ exam.subject }}</p>

            <div class="mt-4 pt-4 border-t border-[var(--border-color)] space-y-2">
              <p class="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                <Clock class="h-3.5 w-3.5 text-[var(--text-muted)]" />
                {{ exam.date }} @ {{ exam.startTime }} - {{ exam.endTime }}
              </p>
              <p class="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                <MapPin class="h-3.5 w-3.5 text-[var(--text-muted)]" />
                {{ exam.classroomName }}
              </p>
            </div>

            <!-- Card Actions -->
            <div class="mt-5 flex justify-end gap-2">
              <button
                v-if="exam.status === 'scheduled'"
                @click="startExamSession(exam.id)"
                class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#026783] hover:bg-[#0588ad] text-white font-semibold text-xs rounded-lg transition-colors"
              >
                <Play class="h-3 w-3 fill-current" />
                Initialize Session
              </button>
              <button
                v-else
                @click="goToMonitor(exam.id)"
                class="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#026783] text-[#026783] hover:bg-[#026783]/5 font-semibold text-xs rounded-lg transition-colors"
              >
                View Map
                <ArrowRight class="h-3 w-3" />
              </button>
            </div>
          </div>

          <div v-if="profExams.length === 0" class="col-span-full bg-[var(--bg-secondary)] border border-[var(--border-color)] border-dashed p-8 rounded-xl flex flex-col items-center justify-center text-center">
            <Calendar class="h-8 w-8 text-[var(--text-muted)] mb-2" />
            <p class="text-sm font-semibold text-[var(--text-secondary)]">No assigned exams found.</p>
            <p class="text-xs text-[var(--text-muted)] mt-1">Please ask the administrator to assign you to upcoming exam schedules.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ADMIN VIEWS -->
    <div v-else class="space-y-8 animate-fade-in">
      <!-- Admin stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <!-- Total Students -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 sm:p-5 rounded-xl shadow-xs">
          <div class="flex items-center justify-between mb-3 text-[var(--text-secondary)]">
            <span class="text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <Users class="h-5 w-5 text-indigo-500" />
          </div>
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{{ totalStudents }}</p>
          <span class="text-[10px] text-indigo-500 font-semibold bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-full mt-1.5 inline-block">Registered</span>
        </div>

        <!-- Total Professors -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 sm:p-5 rounded-xl shadow-xs">
          <div class="flex items-center justify-between mb-3 text-[var(--text-secondary)]">
            <span class="text-xs font-semibold uppercase tracking-wider">Professors</span>
            <GraduationCap class="h-5 w-5 text-teal-500" />
          </div>
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{{ totalProfessors }}</p>
          <span class="text-[10px] text-teal-500 font-semibold bg-teal-50 dark:bg-teal-950/30 px-2 py-0.5 rounded-full mt-1.5 inline-block">Proctors</span>
        </div>

        <!-- Active Exams -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 sm:p-5 rounded-xl shadow-xs">
          <div class="flex items-center justify-between mb-3 text-[var(--text-secondary)]">
            <span class="text-xs font-semibold uppercase tracking-wider">Active Exams</span>
            <Calendar class="h-5 w-5 text-sky-500" />
          </div>
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{{ activeExamsCount }}</p>
          <span class="text-[10px] text-sky-500 font-semibold bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded-full mt-1.5 inline-block">Simultaneous</span>
        </div>

        <!-- Connected Students -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 sm:p-5 rounded-xl shadow-xs">
          <div class="flex items-center justify-between mb-3 text-[var(--text-secondary)]">
            <span class="text-xs font-semibold uppercase tracking-wider">Live Devices</span>
            <Activity class="h-5 w-5 text-emerald-500" />
          </div>
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{{ connectedStudents }}</p>
          <span class="text-[10px] text-emerald-500 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full mt-1.5 inline-block"
                :class="monitoringStore.isSessionActive ? 'animate-pulse' : ''">
            {{ monitoringStore.isSessionActive ? 'Online Telemetry' : 'Offline' }}
          </span>
        </div>

        <!-- Students at Risk -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 sm:p-5 rounded-xl shadow-xs">
          <div class="flex items-center justify-between mb-3 text-[var(--text-secondary)]">
            <span class="text-xs font-semibold uppercase tracking-wider">Stress Risk</span>
            <AlertTriangle class="h-5 w-5 text-rose-500" />
          </div>
          <p class="text-2xl font-bold tracking-tight" :class="studentsAtRisk > 0 ? 'text-rose-600 font-extrabold' : 'text-[var(--text-primary)]'">
            {{ studentsAtRisk }}
          </p>
          <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1.5 inline-block"
                :class="studentsAtRisk > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 glow-red' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'">
            {{ studentsAtRisk > 0 ? 'High Stress' : 'Clear' }}
          </span>
        </div>

      </div>

      <!-- Quick Session launcher when monitoring is inactive -->
      <div v-if="!monitoringStore.isSessionActive" class="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 class="text-sm font-bold text-[var(--text-primary)]">Ready to test the Live Seating Map & WebSocket Simulator?</h4>
          <p class="text-xs text-[var(--text-secondary)] mt-1">Starting the midterm session will simulate students entering Room 302 and checking in.</p>
        </div>
        <button
          @click="startExamSession(1)"
          class="flex items-center gap-2 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-98 shrink-0"
        >
          <Play class="h-3.5 w-3.5 fill-current" />
          Start Mock CS101 Exam
        </button>
      </div>

      <div v-else class="p-6 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/30 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
          <div>
            <h4 class="text-sm font-bold text-emerald-950 dark:text-emerald-300">CS101 Midterm Exam is currently running in Room 302</h4>
            <p class="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">Active WebSocket updates are flowing to the live monitor page.</p>
          </div>
        </div>
        <button
          @click="goToMonitor(1)"
          class="flex items-center gap-1.5 px-4 py-2 bg-[#041627] hover:bg-[#0d2a45] text-white rounded-lg text-xs font-bold transition-all shrink-0"
        >
          Open Seating Map
          <ArrowRight class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Charts Board -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Stress Overview Chart -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
          <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <TrendingUp class="h-4 w-4 text-[#026783]" />
            Stress Overview (Avg %)
          </h4>
          <BaseChart
            type="area"
            :data="stressOverviewData"
            :labels="stressOverviewLabels"
            color="#026783"
            suffix="%"
          />
        </div>

        <!-- Active Sessions Chart -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
          <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <Calendar class="h-4 w-4 text-emerald-500" />
            Weekly Exam Conducted
          </h4>
          <BaseChart
            type="bar"
            :data="activeSessionsData"
            :labels="activeSessionsLabels"
            color="#10B981"
          />
        </div>

        <!-- High Stress Alerts -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
          <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle class="h-4 w-4 text-rose-500" />
            High Stress Alerts per Exam
          </h4>
          <BaseChart
            type="bar"
            :data="highStressAlertsData"
            :labels="highStressAlertsLabels"
            color="#DC2626"
            suffix=" alerts"
          />
        </div>

      </div>

      <!-- Bottom Panel (Recent Activity + Room layouts shortcut) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Recent Activity Feed -->
        <div class="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm flex flex-col">
          <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-4">
            Recent Telemetry Activity Feed
          </h4>
          <div class="space-y-3.5 flex-1">
            <div
              v-for="log in recentActivity"
              :key="log.id"
              class="flex items-start justify-between gap-4 text-xs py-2 border-b border-[var(--border-color)] last:border-0"
            >
              <div class="flex items-start gap-2.5">
                <span class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      :class="log.type === 'error' ? 'bg-rose-500' : (log.type === 'warning' ? 'bg-amber-500' : (log.type === 'success' ? 'bg-emerald-500' : 'bg-slate-400'))">
                </span>
                <p class="text-[var(--text-secondary)] leading-relaxed">{{ log.message }}</p>
              </div>
              <span class="text-[10px] text-[var(--text-muted)] font-mono shrink-0">{{ log.timestamp }}</span>
            </div>
            
            <p v-if="recentActivity.length === 0" class="text-center text-xs text-[var(--text-muted)] py-6">
              No recent alerts or logs available.
            </p>
          </div>
        </div>

        <!-- System Architecture Shortcut -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Bracelet & ESP32 Node Links
            </h4>
            <p class="text-xs text-[var(--text-secondary)] leading-relaxed">
              Every student checks into their exams by scanning the table-specific QR Code using the mobile companion app. 
              The server assigns their MAC device, initiating real-time HTTP polling/WebSocket broadcast logs to the professor monitor layout.
            </p>
          </div>
          <div class="mt-6 pt-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-semibold text-[#026783] hover:text-[#0588ad] cursor-pointer"
               @click="router.push('/qr-code')">
            <span>Manage Table QR Codes</span>
            <ArrowRight class="h-4 w-4" />
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
