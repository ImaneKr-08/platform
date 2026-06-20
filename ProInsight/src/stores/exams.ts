import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'
import { getSocket, connectSocket } from '../services/socket'

export interface Exam {
  id: number
  name: string
  classroomId: number
  classroomName: string
  professorEmail: string
  professorId: number
  professorName: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'active' | 'completed'
}

export const useExamsStore = defineStore('exams', () => {
  const exams = ref<Exam[]>([])
  let socketBound = false

  /** Listen for exam status changes pushed by the backend so the UI updates without a refresh */
  function bindSocketEvents() {
    if (socketBound) return
    socketBound = true
    connectSocket()
    const socket = getSocket()
    socket.on('sessionStarted', (data: { examId: number }) => {
      const exam = exams.value.find(e => e.id === data.examId)
      if (exam) {
        exam.status = 'active'
      } else {
        initExams()
      }
    })
    socket.on('sessionEnded', (data: { examId: number }) => {
      const exam = exams.value.find(e => e.id === data.examId)
      if (exam) {
        exam.status = 'completed'
      }
      initExams()
    })
  }



  async function initExams() {
    try {
      const response = await api.get('/exams')
      if (response.data && Array.isArray(response.data)) {
        exams.value = response.data.map((e: any) => {
          const statusMap: Record<string, Exam['status']> = {
            PENDING: 'scheduled',
            ONGOING: 'active',
            COMPLETED: 'completed'
          }
          const frontendStatus = statusMap[e.status] ?? 'scheduled'

          return {
            id: e.id,
            name: e.module,

            classroomId: e.classroomId,
            classroomName:
              e.classroom?.name ?? '',

            professorId:
              e.professorId,

            professorName:
              e.professor
                ? `${e.professor.firstName} ${e.professor.lastName}`
                : '',

            professorEmail:
              e.professor?.email ?? e.professorEmail ?? '',

            date:
              e.examDate ? e.examDate.split('T')[0] : '',

            startTime:
              e.startTime ? new Date(e.startTime)
                .toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) : '',

            endTime:
              e.endTime ? new Date(e.endTime)
                .toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                }) : '',

            status:
              frontendStatus,
          }
        })
        
        return
      }
    } catch (err) {
      console.warn('Failed to load exams from backend, falling back to local storage:', err)
    }

  }

  

  async function addExam(
    exam: Omit<Exam, 'id'>
  ) {
    const startIso =
      new Date(
        `${exam.date}T${exam.startTime}`
      ).toISOString()

    const endIso =
      new Date(
        `${exam.date}T${exam.endTime}`
      ).toISOString()

    const { data } =
      await api.post('/exams', {
        module: exam.name,
        examDate: new Date(
          exam.date
        ).toISOString(),
        startTime: startIso,
        endTime: endIso,
        classroomId:
          exam.classroomId,
        professorId:
          exam.professorId,
      })

    await initExams()

    return data
  }

  async function updateExam(
    id: number,
    updatedData: Partial<Exam>,
  ) {
    const payload: any = {}

    if (updatedData.name)
      payload.module =
        updatedData.name

    if (updatedData.classroomId)
      payload.classroomId =
        updatedData.classroomId

    if (updatedData.professorId)
      payload.professorId =
        updatedData.professorId

    if (updatedData.date && updatedData.startTime && updatedData.endTime) {
      payload.examDate = new Date(updatedData.date).toISOString()
      payload.startTime = new Date(`${updatedData.date}T${updatedData.startTime}`).toISOString()
      payload.endTime = new Date(`${updatedData.date}T${updatedData.endTime}`).toISOString()
    }

    await api.patch(
      `/exams/${id}`,
      payload,
    )

    await initExams()
  }

  async function deleteExam(
    id: number,
  ) {
    await api.delete(
      `/exams/${id}`,
    )

    exams.value =
      exams.value.filter(
        e => e.id !== id,
      )
  }

  return {
    exams,
    initExams,
    addExam,
    updateExam,
    deleteExam,
    bindSocketEvents
  }
})
