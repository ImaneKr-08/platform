<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMonitoringStore } from '../stores/monitoring'
import { useExamsStore } from '../stores/exams'
import { useAuthStore } from '../stores/auth'
import {
  Activity,
  Heart,
  AlertTriangle,
  VolumeX,
  Volume2,
  Clock,
  MapPin,
  WifiOff,
  UserCheck,
  Power,
  Play,
  Grid,
  ClipboardList
} from 'lucide-vue-next'
import { useClassroomsStore } from '../stores/classrooms'

const route = useRoute()
const router = useRouter()
const monitoringStore = useMonitoringStore()
const examsStore = useExamsStore()
const authStore = useAuthStore()

// State
const selectedExamId = ref('')

const classroomsStore = useClassroomsStore()
onMounted(() => {
  examsStore.initExams()
  
  // Resolve exam from URL path
  const examIdParam = route.params.examId as string
  if (examIdParam) {
    selectedExamId.value = examIdParam
    if (!monitoringStore.isSessionActive || monitoringStore.activeExamId !== examIdParam) {
      // Auto start session if exam matches and is not yet running
      const exam = examsStore.exams.find(e => e.id === examIdParam)
      if (exam && exam.status !== 'completed') {
        monitoringStore.startMonitoring(examIdParam)
      }
    }
  } else if (monitoringStore.isSessionActive && monitoringStore.activeExamId) {
    selectedExamId.value = monitoringStore.activeExamId
  } else {
    // Pick first available active or scheduled exam
    const availableExams = filteredExamsList.value
    if (availableExams.length > 0) {
      selectedExamId.value = availableExams[0].id
    }
  }
})

// Filter exams based on role
const filteredExamsList = computed(() => {
  if (authStore.isAdmin) {
    return examsStore.exams
  } else {
    return examsStore.exams.filter(e => e.professorEmail.toLowerCase() === authStore.user?.email.toLowerCase())
  }
})

const isCurrentSessionSelected = computed(() => {
  return monitoringStore.isSessionActive && monitoringStore.activeExamId === selectedExamId.value
})

const currentExam = computed(() => {
  return examsStore.exams.find(e => e.id === selectedExamId.value) || null
})

// Drag and drop variables
const draggedDeskId = ref<string | null>(null)

function onDragStart(e: DragEvent, deskId: string) {
  if (!authStore.isAdmin) return // Only admins can reposition desking layout
  draggedDeskId.value = deskId
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', deskId)
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  draggedDeskId.value = null
}

function onDrop(e: DragEvent, targetSlotIndex: number) {
  e.preventDefault()
  if (!authStore.isAdmin) return
  
  const deskId = e.dataTransfer?.getData('text/plain') || draggedDeskId.value
  if (!deskId) return

  monitoringStore.updateSeatingPosition(deskId, targetSlotIndex)
  draggedDeskId.value = null
}

function onDropToPool(e: DragEvent) {
  e.preventDefault()
  if (!authStore.isAdmin) return

  const deskId = e.dataTransfer?.getData('text/plain') || draggedDeskId.value
  if (!deskId) return

  monitoringStore.updateSeatingPosition(deskId, null)
  draggedDeskId.value = null
}

function startSession() {
  if (!selectedExamId.value) return
  monitoringStore.startMonitoring(selectedExamId.value)
  router.push(`/monitoring/${selectedExamId.value}`)
}

function stopSession() {
  if (confirm('Are you sure you want to end this monitoring session? This will finalize the exam.')) {
    monitoringStore.stopMonitoring()
    router.push('/')
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-8rem)] select-none animate-fade-in overflow-hidden">
    
    <!-- IF NO EXAM ACTIVE OR SELECTED -->
    <div v-if="!monitoringStore.isSessionActive || !isCurrentSessionSelected" class="flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm text-center">
      <Activity class="h-16 w-16 text-[#026783] mb-4 animate-pulse" />
      <h3 class="text-lg font-bold text-[var(--text-primary)]">Start Seating Monitoring Session</h3>
      <p class="text-sm text-[var(--text-secondary)] mt-1.5 max-w-md">Please select an upcoming scheduled examination to initialize live ESP32 bracelet streams.</p>

      <div class="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <select
          v-model="selectedExamId"
          class="input-field w-full"
        >
          <option value="" disabled>Choose an exam...</option>
          <option v-for="exam in filteredExamsList" :key="exam.id" :value="exam.id">
            {{ exam.name }} ({{ exam.status }})
          </option>
        </select>

        <button
          @click="startSession"
          :disabled="!selectedExamId"
          class="w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2.5 bg-[#026783] hover:bg-[#0588ad] disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-all shrink-0 shadow-sm"
        >
          <Play class="h-4 w-4 fill-current" />
          Initialize Exam
        </button>
      </div>

      <div v-if="filteredExamsList.length === 0" class="mt-4 flex items-center gap-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900/30 border border-rose-200 px-3 py-1.5 rounded-lg">
        <AlertTriangle class="h-4.5 w-4.5 shrink-0" />
        No exams scheduled. Administrators must schedule exams first.
      </div>
    </div>

    <!-- LIVE MONITORING DASHBOARD -->
    <div v-else class="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
      
      <!-- Right Side: The Seating Grid Layout -->
      <div class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-sm flex flex-col overflow-hidden">
        
        <!-- Header Info Bar -->
        <div class="px-6 py-4 border-b border-[var(--border-color)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0 bg-[var(--bg-primary)]/35">
          <div class="flex items-center gap-3">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <div>
              <h3 class="text-sm font-bold text-[var(--text-primary)] leading-tight">{{ monitoringStore.activeExam?.name }}</h3>
              <p class="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-2.5">
                <span>{{ monitoringStore.activeExam?.classroomName }}</span>
                <span class="flex items-center gap-1"><Clock class="h-3.5 w-3.5" /> {{ monitoringStore.formattedTimeRemaining }} left</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
            <!-- Silence all trigger -->
            <button
              @click="monitoringStore.toggleSilenceAll"
              class="flex items-center gap-1.5 px-3.5 py-2 border rounded-lg text-xs font-bold transition-all"
              :class="monitoringStore.isSilencedAll
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-400 font-extrabold'
                : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'"
            >
              <component :is="monitoringStore.isSilencedAll ? VolumeX : Volume2" class="h-4 w-4" />
              {{ monitoringStore.isSilencedAll ? 'Unmute Alerts' : 'Silence Warnings' }}
            </button>

            <button
              @click="stopSession"
              class="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors shadow-sm shrink-0"
            >
              <Power class="h-3.5 w-3.5" />
              End Session
            </button>
          </div>
        </div>

        <!-- Seating Blueprint Grid -->
        <div class="flex-1 classroom-grid-bg p-8 overflow-auto flex justify-center items-center">
          <div
            v-if="monitoringStore.activeExam"
            class="grid gap-6 w-fit"
            :style="{
              gridTemplateColumns: `repeat(${classroomsStore.classrooms.find(c => c.id === monitoringStore.activeExam?.classroomId)?.cols || 4}, minmax(0, 1fr))`
            }"
          >
            <div
              v-for="(desk, index) in monitoringStore.gridSlots"
              :key="index"
              class="w-48 h-36 relative"
            >
              <!-- Placed Desk Card -->
              <div
                v-if="desk"
                class="absolute inset-0 bg-[var(--bg-secondary)] border rounded-xl shadow-md p-3 flex flex-col justify-between select-none relative group"
                :class="{
                  'border-rose-500 glow-red border-l-4 border-l-rose-500': desk.student && desk.student.connected && desk.student.stressLevel === 'HIGH_STRESS',
                  'border-amber-500 glow-yellow border-l-4 border-l-amber-500': desk.student && desk.student.connected && desk.student.stressLevel === 'MILD_STRESS',
                  'border-emerald-500 border-l-4 border-l-emerald-500': desk.student && desk.student.connected && desk.student.stressLevel === 'BASELINE',
                  'border-[var(--border-color)]': !desk.student || !desk.student.connected,
                  'cursor-grab active:cursor-grabbing hover:scale-103 transition-transform duration-100': authStore.isAdmin
                }"
                :draggable="authStore.isAdmin"
                @dragstart="onDragStart($event, desk.id)"
                @dragend="onDragEnd"
              >
                <!-- Desk Header -->
                <div class="flex items-center justify-between text-[10px] shrink-0 font-bold">
                  <span class="font-mono text-slate-500">{{ desk.code }}</span>
                  
                  <span v-if="desk.student && desk.student.connected"
                        :class="{
                          'text-rose-600 dark:text-rose-400': desk.student.stressLevel === 'HIGH_STRESS',
                          'text-amber-600 dark:text-amber-400': desk.student.stressLevel === 'MILD_STRESS',
                          'text-emerald-600 dark:text-emerald-400': desk.student.stressLevel === 'BASELINE'
                        }">
                    {{ desk.student.stressLevel }}
                  </span>
                  <span v-else-if="desk.student && !desk.student.connected" class="text-slate-400 flex items-center gap-0.5">
                    <WifiOff class="h-3 w-3" /> OFFLINE
                  </span>
                  <span v-else class="text-slate-400 font-normal">EMPTY</span>
                </div>

                <!-- Student Details -->
                <div class="flex-1 flex flex-col justify-center min-w-0 py-1 select-text">
                  <p class="text-xs font-bold text-[var(--text-primary)] truncate">
                    {{ desk.student ? `${desk.student.firstName} ${desk.student.lastName}` : 'Unassigned Seat' }}
                  </p>
                  <p class="text-[9px] text-[var(--text-muted)] font-mono leading-none mt-0.5 truncate">
                    {{ desk.student ? desk.student.registrationNumber : 'Desks QR Scannable' }}
                  </p>
                </div>

                <!-- Live Metrics Bar -->
                <div v-if="desk.student && desk.student.connected" class="space-y-1.5 shrink-0">
                  <div class="flex items-center justify-between text-[10px] font-semibold">
                    <span class="flex items-center gap-0.5 text-slate-500">
                      <Heart class="h-3 w-3 text-rose-500 fill-rose-500 shrink-0" />
                      {{ desk.student.heartRate }} BPM
                    </span>
                    <span class="text-[var(--text-primary)]">{{ desk.student.stressPercent }}% stress</span>
                  </div>
                  <div class="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-300"
                         :class="{
                           'bg-rose-500': desk.student.stressLevel === 'HIGH_STRESS',
                           'bg-amber-500': desk.student.stressLevel === 'MILD_STRESS',
                           'bg-emerald-500': desk.student.stressLevel === 'BASELINE'
                         }"
                         :style="{ width: `${desk.student.stressPercent}%` }">
                    </div>
                  </div>
                </div>

                <div v-else-if="desk.student && !desk.student.connected" class="text-[10px] text-rose-500 font-semibold flex items-center gap-1.5 border border-dashed border-rose-200 bg-rose-50/20 px-2 py-1 rounded">
                  <AlertTriangle class="h-3.5 w-3.5" /> Wearable Lost Link
                </div>

                <div v-else class="text-[10px] text-[var(--text-muted)] flex items-center justify-center gap-1">
                  Ready to scan
                </div>

                <!-- Individual Silence triggers -->
                <button
                  v-if="desk.student && desk.student.connected && (desk.student.stressLevel === 'HIGH_STRESS' || desk.student.stressLevel === 'MILD_STRESS')"
                  @click.stop="monitoringStore.toggleSilenceStudent(desk.id)"
                  class="absolute top-8 right-3 p-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm hover:scale-105 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                  :title="desk.student.isSilenced ? 'Unsilence Alerts' : 'Silence Alerts'"
                >
                  <component :is="desk.student.isSilenced ? Volume2 : VolumeX" class="h-3.5 w-3.5" />
                </button>

                <!-- Wooden desk pegs -->
                <div class="absolute -bottom-1 left-3 w-1.5 h-1.5 bg-slate-400 rounded-sm"></div>
                <div class="absolute -bottom-1 right-3 w-1.5 h-1.5 bg-slate-400 rounded-sm"></div>
              </div>

              <!-- Grid Spot Dropzone Target (Only Admins can drag coordinates) -->
              <div
                v-else
                class="absolute inset-0 border-2 border-dashed border-[var(--border-color)] hover:border-slate-400 dark:hover:border-slate-500 rounded-xl flex items-center justify-center transition-colors text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold"
                @dragover.prevent
                @drop="onDrop($event, index)"
              >
                Empty Spot
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- Left Side Panels: telemetry metrics summary & live logs -->
      <div class="w-full lg:w-72 flex flex-col gap-6 shrink-0 h-full overflow-hidden">
        
        <!-- Live Stress Index card -->
        <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-2xl shadow-sm space-y-4 shrink-0">
          <div>
            <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Classroom Stress Index</h4>
            <div class="flex items-baseline gap-2 mt-2">
              <span class="text-3xl font-black tracking-tight text-[#026783]">{{ monitoringStore.classStressIndex }}%</span>
              <span class="text-xs text-[var(--text-secondary)] font-semibold">Average Index</span>
            </div>
            <div class="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mt-3">
              <div class="h-full bg-[#026783] transition-all duration-500" :style="{ width: `${monitoringStore.classStressIndex}%` }"></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-color)] text-center">
            <div class="bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
              <span class="text-xs text-[var(--text-secondary)] block font-semibold leading-tight">At Risk</span>
              <span class="text-lg font-black tracking-tight mt-1 block"
                    :class="monitoringStore.studentsAtRiskCount > 0 ? 'text-rose-600 animate-pulse' : 'text-[var(--text-primary)]'">
                {{ monitoringStore.studentsAtRiskCount }}
              </span>
            </div>

            <div class="bg-[var(--bg-primary)] p-2.5 rounded-xl border border-[var(--border-color)]">
              <span class="text-xs text-[var(--text-secondary)] block font-semibold leading-tight">Live Seats</span>
              <span class="text-lg font-black text-[var(--text-primary)] tracking-tight mt-1 block">{{ monitoringStore.connectedStudentsCount }}</span>
            </div>
          </div>
        </div>

        <!-- Seating Pool Drawer (Admins drag tables out of here) -->
        <div v-if="authStore.isAdmin" class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-2xl shadow-sm flex flex-col shrink-0">
          <h4 class="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>Seat Pool</span>
            <span class="px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-full text-[9px]">{{ monitoringStore.seatPool.length }}</span>
          </h4>
          
          <div
            class="flex gap-2 p-2.5 min-h-[50px] overflow-x-auto border border-dashed border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)] scrollbar-thin"
            @dragover.prevent
            @drop="onDropToPool"
          >
            <div
              v-for="desk in monitoringStore.seatPool"
              :key="desk.id"
              class="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-primary)] shadow-xs select-none cursor-grab active:cursor-grabbing shrink-0"
              draggable="true"
              @dragstart="onDragStart($event, desk.id)"
              @dragend="onDragEnd"
            >
              <span class="font-mono">{{ desk.code }}</span>
            </div>
            
            <span v-if="monitoringStore.seatPool.length === 0" class="text-[10px] text-[var(--text-muted)] mx-auto py-1">
              All seats placed on map
            </span>
          </div>
        </div>

        <!-- Live Notifications Logs Feed -->
        <div class="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-2xl shadow-sm flex flex-col overflow-hidden">
          <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3.5 flex items-center gap-2">
            <ClipboardList class="h-4.5 w-4.5 text-[#026783]" />
            Live Session Incident Log
          </h4>

          <div class="flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
            <div
              v-for="log in monitoringStore.activityLogs"
              :key="log.id"
              class="flex items-start justify-between gap-3 border-b border-[var(--border-color)] pb-2 last:border-0"
            >
              <div class="flex items-start gap-2">
                <span class="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      :class="{
                        'bg-rose-500': log.type === 'error',
                        'bg-amber-500': log.type === 'warning',
                        'bg-emerald-500': log.type === 'success',
                        'bg-slate-400': log.type === 'info',
                      }">
                </span>
                <p class="text-[var(--text-secondary)] leading-relaxed">{{ log.message }}</p>
              </div>
              <span class="text-[9px] text-[var(--text-muted)] font-mono shrink-0">{{ log.timestamp }}</span>
            </div>

            <p v-if="monitoringStore.activityLogs.length === 0" class="text-center text-[11px] text-[var(--text-muted)] py-12">
              Waiting for student check-ins and device telemetry warnings...
            </p>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
