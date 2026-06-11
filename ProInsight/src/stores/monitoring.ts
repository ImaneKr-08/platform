import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStudentsStore, type Student } from './students'
import { useClassroomsStore } from './classrooms'
import { useExamsStore } from './exams'
import { api } from '../services/api'

export interface MonitorStudent {
  firstName: string
  lastName: string
  registrationNumber: string
  espId: string
  heartRate: number
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

  let simulationInterval: number | null = null
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

  // Get seats in the seat pool

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

  async function startMonitoring(
    examId: number,
  ) {
    if (simulationInterval) {
      clearInterval(simulationInterval)
    }

    if (timerInterval) {
      clearInterval(timerInterval)
    }

    activeExamId.value = examId
    isSessionActive.value = true

    timeRemainingSeconds.value =
      5400 + Math.floor(Math.random() * 1800)

    activityLogs.value = []

    await studentsStore.initStudents()
    await classroomsStore.initClassrooms()

    const exam =
      examsStore.exams.find(
        e => e.id === examId,
      )

    if (!exam) return

    const room =
      classroomsStore.classrooms.find(
        c => c.id === exam.classroomId,
      )

    if (!room) {
      addLog(
        `Classroom not found for exam ${exam.name}`,
        'error',
      )

      isSessionActive.value = false
      activeExamId.value = null

      return
    }

    addLog(
      `Exam session "${exam.name}" started in ${room.name}.`,
      'info',
    )

    desks.value = room.tables.map(
      t => ({
        id: String(t.id),
        code:
          t.qrCode ||
          `DESK-${t.id}`,
        student: null,
      }),
    )

    const availableStudents = [
      ...studentsStore.students,
    ]

    const initialCheckInCount =
      Math.min(
        3,
        desks.value.length,
      )

    for (
      let i = 0;
      i < initialCheckInCount;
      i++
    ) {
      if (
        availableStudents.length > 0
      ) {
        const student =
          availableStudents.splice(
            Math.floor(
              Math.random() *
              availableStudents.length,
            ),
            1,
          )[0]

        const emptyDesk =
          desks.value.find(
            d => !d.student,
          )

        if (emptyDesk) {
          emptyDesk.student =
            createMonitorStudent(
              student,
            )

          addLog(
            `${student.firstName} ${student.lastName} scanned ${emptyDesk.code} - Device Connected.`,
            'success',
          )
        }
      }
    }

    runSimulator(
      availableStudents,
    )

    timerInterval =
      window.setInterval(() => {
        if (
          timeRemainingSeconds.value >
          0
        ) {
          timeRemainingSeconds.value--
        } else {
          stopMonitoring()
        }
      }, 1000)
  }

  function createMonitorStudent(s: Student): MonitorStudent {
    return {
      firstName: s.firstName,
      lastName: s.lastName,
      registrationNumber: s.registrationNumber,
      espId: s.espId,
      heartRate: 70 + Math.floor(Math.random() * 15),
      stressPercent: 20 + Math.floor(Math.random() * 15),
      stressLevel: 'BASELINE',
      connected: true,
      isSilenced: false
    }
  }

  function runSimulator(availableStudents: Student[]) {
    if (simulationInterval) clearInterval(simulationInterval)

    simulationInterval = window.setInterval(() => {
      if (!isSessionActive.value) return

      // 1. Telemetry Jitter for existing connected students
      desks.value.forEach(desk => {
        if (desk.student && desk.student.connected) {
          // Adjust heart rate
          const hrDiff = Math.floor(Math.random() * 5) - 2
          desk.student.heartRate = Math.min(Math.max(desk.student.heartRate + hrDiff, 60), 150)

          // Adjust stress based on stressLevel
          let stressDiff = Math.floor(Math.random() * 7) - 3
          desk.student.stressPercent = Math.min(Math.max(desk.student.stressPercent + stressDiff, 10), 99)

          // Auto-adjust level threshold
          if (desk.student.stressPercent >= 75) {
            if (desk.student.stressLevel !== 'HIGH_STRESS') {
              desk.student.stressLevel = 'HIGH_STRESS'
              if (!desk.student.isSilenced && !isSilencedAll.value) {
                addLog(`CRITICAL: High stress alert for ${desk.student.firstName} ${desk.student.lastName} (${desk.student.stressPercent}% stress)`, 'error')
              }
            }
          } else if (desk.student.stressPercent >= 45) {
            if (desk.student.stressLevel !== 'MILD_STRESS') {
              desk.student.stressLevel = 'MILD_STRESS'
              addLog(`Warning: Elevated stress detected for ${desk.student.firstName} ${desk.student.lastName} (${desk.student.stressPercent}% stress)`, 'warning')
            }
          } else {
            desk.student.stressLevel = 'BASELINE'
          }
        }
      })

      // 2. Occasional new check-in (15% chance per tick if empty desks and available students)
      if (Math.random() < 0.15 && availableStudents.length > 0) {
        const emptyDesks = desks.value.filter(d => !d.student)
        if (emptyDesks.length > 0) {
          const targetDesk = emptyDesks[Math.floor(Math.random() * emptyDesks.length)]
          const student = availableStudents.splice(Math.floor(Math.random() * availableStudents.length), 1)[0]

          targetDesk.student = createMonitorStudent(student)
          addLog(`${student.firstName} ${student.lastName} scanned ${targetDesk.code} - Device Connected.`, 'success')
        }
      }

      // 3. Occasional disconnect or stress spike (5% chance)
      if (Math.random() < 0.05) {
        const activeDesks = desks.value.filter(d => d.student && d.student.connected)
        if (activeDesks.length > 0) {
          const chosen = activeDesks[Math.floor(Math.random() * activeDesks.length)]
          if (chosen.student) {
            if (Math.random() < 0.4) {
              // Disconnect
              chosen.student.connected = false
              addLog(`Connection Lost: ${chosen.student.firstName}'s bracelet offline.`, 'warning')
            } else {
              // Stress spike
              chosen.student.stressPercent = 80 + Math.floor(Math.random() * 15)
              chosen.student.stressLevel = 'HIGH_STRESS'
              chosen.student.heartRate = 110 + Math.floor(Math.random() * 20)
              if (!chosen.student.isSilenced && !isSilencedAll.value) {
                addLog(`CRITICAL: Stress spike for ${chosen.student.firstName} ${chosen.student.lastName} (${chosen.student.stressPercent}% stress, ${chosen.student.heartRate} BPM)`, 'error')
              }
            }
          }
        }
      }

      // 4. Occasional reconnect of disconnected students (5% chance)
      if (Math.random() < 0.05) {
        const disconnectedDesks = desks.value.filter(d => d.student && !d.student.connected)
        if (disconnectedDesks.length > 0) {
          const chosen = disconnectedDesks[Math.floor(Math.random() * disconnectedDesks.length)]
          if (chosen.student) {
            chosen.student.connected = true
            chosen.student.stressPercent = 40
            chosen.student.stressLevel = 'MILD_STRESS'
            addLog(`Connection Restored: ${chosen.student.firstName}'s bracelet back online.`, 'success')
          }
        }
      }

    }, 3000)
  }

  async function stopMonitoring() {
    if (simulationInterval) {
      clearInterval(
        simulationInterval,
      )
      simulationInterval = null
    }

    if (timerInterval) {
      clearInterval(
        timerInterval,
      )
      timerInterval = null
    }

    isSessionActive.value = false

    if (activeExamId.value) {
      try {
        await api.post(
          `/exams/${activeExamId.value}/end`
        )
      } catch (error) {
        console.error(
          'Failed to end exam:',
          error
        )
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
    formattedTimeRemaining,
    startMonitoring,
    stopMonitoring,
    toggleSilenceStudent,
    toggleSilenceAll,
    addLog
  }
})
