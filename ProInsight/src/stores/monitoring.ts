import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStudentsStore } from './students'
import { useClassroomsStore } from './classrooms'
import { useExamsStore } from './exams'
import { api } from '../services/api'
import { connectSocket, disconnectSocket, getSocket } from '../services/socket'

export interface MonitorStudent {
  id: number
  firstName: string
  lastName: string
  registrationNumber: string
  espId: string
  heartRate: number
  hrv: number
  gsr: number
  stressScore: number
  stressPercent: number
  stressLevel: 'BASELINE' | 'MILD_STRESS' | 'HIGH_STRESS'
  connected: boolean
  isSilenced: boolean
}

export interface MonitorDesk {
  id: string
  code: string
  student: MonitorStudent | null
}

export interface ActivityLog {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
}

export const useMonitoringStore = defineStore('monitoring', () => {
  const studentsStore = useStudentsStore()
  const classroomsStore = useClassroomsStore()
  const examsStore = useExamsStore()

  const activeExamId = ref<number | null>(null)
  const isSessionActive = ref(false)
  const desks = ref<MonitorDesk[]>([])
  const timeRemainingSeconds = ref(7200) // 2 hours default
  const activityLogs = ref<ActivityLog[]>([])
  const isSilencedAll = ref(false)

  let timerInterval: number | null = null

  const activeExam = computed(() => {
    return examsStore.exams.find(e => (e.id) === activeExamId.value) || null
  })

  // Connected count
  const connectedStudentsCount = computed(() => {
    return desks.value.filter(d => d.student && d.student.connected).length
  })

  // Risk count (connected and HIGH_STRESS)
  const studentsAtRiskCount = computed(() => {
    return desks.value.filter(d => d.student && d.student.connected && d.student.stressLevel === 'HIGH_STRESS').length
  })

  // Average stress percent of connected students
  const classStressIndex = computed(() => {
    const active = desks.value.filter(d => d.student && d.student.connected)
    if (active.length === 0) return 0
    const sum = active.reduce((acc, d) => acc + (d.student?.stressPercent || 0), 0)
    return Math.round(sum / active.length)
  })

  // Get grid slots
  const gridSlots = computed(() => {
    const exam = activeExam.value
    if (!exam) return []

    const room = classroomsStore.classrooms.find(
      c => c.id === exam.classroomId,
    )

    if (!room) return []

    const totalSlots = room.rows * room.cols

    const slots: (MonitorDesk | null)[] =
      Array(totalSlots).fill(null)

    desks.value.forEach((desk, index) => {
      if (index < totalSlots) {
        slots[index] = desk
      }
    })

    return slots
  })

  function addLog(message: string, type: ActivityLog['type'] = 'info') {
    const now = new Date()
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    activityLogs.value.unshift({
      id: String(Date.now() + Math.random()),
      timestamp,
      message,
      type
    })
    if (activityLogs.value.length > 50) {
      activityLogs.value.pop()
    }
  }

  // ─── Socket event handlers ──────────────────────────────────────────────────

  function bindSocketEvents() {
    const socket = getSocket()

    // Real-time telemetry from a bracelet
    socket.on('telemetryUpdated', (data: {
      braceletId: string
      studentId: number
      heartRate: number
      hrv: number
      gsr: number
      stressScore: number
      stressLevel: string
    }) => {
      console.log('🟢 TELEMETRY RECEIVED VIA WEBSOCKET:', data)
      addLog(`[Live Telemetry] Bracelet: ${data.braceletId} | Student ID: ${data.studentId} | Heart Rate: ${data.heartRate} bpm | Stress: ${data.stressLevel}`, 'info')
      
      // Map backend display level to enum
      const lvlMap: Record<string, 'BASELINE' | 'MILD_STRESS' | 'HIGH_STRESS'> = {
        'Baseline': 'BASELINE',
        'Mild Stress': 'MILD_STRESS',
        'High Stress': 'HIGH_STRESS',
      }
      const stressLevel = lvlMap[data.stressLevel] ?? 'BASELINE'
      const stressPercent = Math.round(data.stressScore * 100)

      // Find desk by studentId and update its data
      const desk = desks.value.find(d => d.student && d.student.id === data.studentId)
      if (desk && desk.student) {
        desk.student.heartRate = data.heartRate
        desk.student.hrv = data.hrv
        desk.student.gsr = data.gsr
        desk.student.stressScore = data.stressScore
        desk.student.stressPercent = stressPercent
        const prevLevel = desk.student.stressLevel
        desk.student.stressLevel = stressLevel
        desk.student.connected = true

        if (stressLevel === 'HIGH_STRESS' && prevLevel !== 'HIGH_STRESS' && !desk.student.isSilenced && !isSilencedAll.value) {
          addLog(`CRITICAL: High stress alert for ${desk.student.firstName} ${desk.student.lastName} (${stressPercent}%)`, 'error')
        } else if (stressLevel === 'MILD_STRESS' && prevLevel === 'BASELINE') {
          addLog(`Warning: Elevated stress for ${desk.student.firstName} ${desk.student.lastName} (${stressPercent}%)`, 'warning')
        }

      }
    })

    socket.on('studentConnected', (data: { studentId: number; braceletId: string }) => {
      const desk = desks.value.find(d => d.student && d.student.id === data.studentId)
      if (desk && desk.student) {
        desk.student.connected = true
        desk.student.espId = data.braceletId
        addLog(`${desk.student.firstName} ${desk.student.lastName} bracelet connected.`, 'success')
      }
    })

    socket.on('studentDisconnected', (data: { studentId: number }) => {
      const desk = desks.value.find(d => d.student && d.student.id === data.studentId)
      if (desk && desk.student) {
        desk.student.connected = false
        addLog(`Connection Lost: ${desk.student.firstName} ${desk.student.lastName}'s bracelet offline.`, 'warning')
      }
    })

    socket.on('sessionStarted', (data: { sessionId: number; examId: number; module: string }) => {
      addLog(`Session started for exam: ${data.module}`, 'info')
    })

    socket.on('sessionEnded', (data: { sessionId: number; examId: number }) => {
      addLog(`Session ended.`, 'info')
      if (activeExamId.value === data.examId) {
        stopMonitoring()
      }
    })
  }

  function unbindSocketEvents() {
    const socket = getSocket()
    socket.off('telemetryUpdated')
    socket.off('studentConnected')
    socket.off('studentDisconnected')
    socket.off('sessionStarted')
    socket.off('sessionEnded')
  }

  // ─── Periodic poll for fresh student data ─────────────────────────────────

  let pollInterval: number | null = null

  function startPolling() {
    stopPolling()
    pollInterval = window.setInterval(async () => {
      if (!isSessionActive.value || !activeExamId.value) return
      try {
        // Fetch the live exam detail to get fresh student states
        const { data: examDetail } = await api.get(`/exams/${activeExamId.value}`)
        if (!examDetail?.examStudents) return
        examDetail.examStudents.forEach((es: any) => {
          const { student, table } = es
          if (!student) return
          const deskId = String(table?.id ?? '')
          const desk = desks.value.find(d => d.id === deskId)
          if (desk) {
            if (!desk.student) {
              const storeStudent = studentsStore.students.find(s => s.registrationNumber === student.studentCode)
              desk.student = {
                id: student.id,
                firstName: student.user?.firstName || student.firstName || storeStudent?.firstName || 'Unknown',
                lastName: student.user?.lastName || student.lastName || storeStudent?.lastName || '',
                registrationNumber: student.studentCode,
                espId: student.braceletId ?? String(student.id),
                heartRate: student.heartRate ?? 0,
                hrv: 0,
                gsr: 0,
                stressScore: student.stressScore ?? 0,
                stressPercent: student.stressScore ? Math.round(student.stressScore * 100) : 0,
                stressLevel: (student.stressLevel as any) ?? 'BASELINE',
                connected: student.connected ?? false,
                isSilenced: false,
              }
            } else {
              // Only update vitals from backend (socket may have newer data, but poll fills gaps)
              if (!desk.student.connected) {
                desk.student.connected = student.connected ?? false
              }
              desk.student.heartRate = student.heartRate ?? desk.student.heartRate
              desk.student.stressPercent = student.stressScore ? Math.round(student.stressScore * 100) : desk.student.stressPercent
              desk.student.stressLevel = (student.stressLevel as any) ?? desk.student.stressLevel
            }
          }
        })
      } catch (_) {
        // silent — socket events are primary source
      }
    }, 5000) // poll every 5 s
  }

  function stopPolling() {
    if (pollInterval !== null) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // ─── Start / Stop monitoring ──────────────────────────────────────────────

  async function startMonitoring(examId: number) {
    if (timerInterval) clearInterval(timerInterval)
    stopPolling()
    unbindSocketEvents()

    activeExamId.value = examId
    isSessionActive.value = true
    timeRemainingSeconds.value = 5400 + Math.floor(Math.random() * 1800)
    activityLogs.value = []

    await studentsStore.initStudents()
    await classroomsStore.initClassrooms()

    const exam = examsStore.exams.find(e => e.id === examId)
    if (!exam) return

    const room = classroomsStore.classrooms.find(c => c.id === exam.classroomId)
    if (!room) {
      addLog(`Classroom not found for exam ${exam.name}`, 'error')
      isSessionActive.value = false
      activeExamId.value = null
      return
    }

    addLog(`Exam session "${exam.name}" started in ${room.name}.`, 'info')

    // Build desks from classroom tables
    desks.value = room.tables.map(t => ({
      id: String(t.id),
      code: `DESK-${t.id}`,
      student: null,
    }))

    // Pre-populate desk students from assigned exam students
    try {
      const { data: examDetail } = await api.get(`/exams/${examId}`)
      if (examDetail?.examStudents) {
        examDetail.examStudents.forEach((es: any) => {
          const { student, table } = es
          if (!student || !table) return
          const desk = desks.value.find(d => d.id === String(table.id))
          if (desk) {
            const storeStudent = studentsStore.students.find(s => s.registrationNumber === student.studentCode)
            desk.student = {
              id: student.id,
              firstName: student.user?.firstName || student.firstName || storeStudent?.firstName || 'Unknown',
              lastName: student.user?.lastName || student.lastName || storeStudent?.lastName || '',
              registrationNumber: student.studentCode,
              espId: student.braceletId ?? String(student.id),
              heartRate: student.heartRate ?? 0,
              hrv: 0,
              gsr: 0,
              stressScore: student.stressScore ?? 0,
              stressPercent: student.stressScore ? Math.round(student.stressScore * 100) : 0,
              stressLevel: (student.stressLevel as any) ?? 'BASELINE',
              connected: student.connected ?? false,
              isSilenced: false,
            }
          }
        })
      }
    } catch (_) {
      addLog('Could not pre-load student seating from backend.', 'warning')
    }

    // Connect socket and start listening
    connectSocket()
    bindSocketEvents()

    // Poll every 5 s to sync any state the socket may miss
    startPolling()

    // Countdown timer
    timerInterval = window.setInterval(() => {
      if (timeRemainingSeconds.value > 0) {
        timeRemainingSeconds.value--
      } else {
        stopMonitoring()
      }
    }, 1000)
  }

  async function stopMonitoring() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }

    stopPolling()
    unbindSocketEvents()
    disconnectSocket()

    isSessionActive.value = false

    if (activeExamId.value) {
      try {
        await api.post(`/exams/${activeExamId.value}/end`)
      } catch (error) {
        console.error('Failed to end exam:', error)
      }
    }

    activeExamId.value = null
    desks.value = []
  }

  function toggleSilenceStudent(deskId: string) {
    const d = desks.value.find(desk => desk.id === deskId)
    if (d && d.student) {
      d.student.isSilenced = !d.student.isSilenced
      addLog(`${d.student.firstName}'s stress alerts ${d.student.isSilenced ? 'silenced' : 'unsilenced'}.`, 'info')
    }
  }

  function toggleSilenceAll() {
    isSilencedAll.value = !isSilencedAll.value
    addLog(`All student alert noises ${isSilencedAll.value ? 'silenced' : 'unsilenced'}.`, 'info')
  }

  const formattedTimeRemaining = computed(() => {
    const hours = Math.floor(timeRemainingSeconds.value / 3600)
    const minutes = Math.floor((timeRemainingSeconds.value % 3600) / 60)
    const seconds = timeRemainingSeconds.value % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  })

  return {
    activeExamId,
    isSessionActive,
    desks,
    timeRemainingSeconds,
    activityLogs,
    isSilencedAll,
    activeExam,
    connectedStudentsCount,
    studentsAtRiskCount,
    classStressIndex,
    gridSlots,
    formattedTimeRemaining,
    startMonitoring,
    stopMonitoring,
    toggleSilenceStudent,
    toggleSilenceAll,
    addLog
  }
})
