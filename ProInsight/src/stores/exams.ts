import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Exam {
  id: string
  name: string
  subject: string
  classroomId: string
  classroomName: string
  professorEmail: string
  professorName: string
  date: string
  startTime: string
  endTime: string
  status: 'scheduled' | 'active' | 'completed'
}

export const useExamsStore = defineStore('exams', () => {
  const exams = ref<Exam[]>([])

  const defaultExams: Exam[] = [
    {
      id: 'exam-1',
      name: 'Midterm Exam - CS101',
      subject: 'Introduction to Computer Science',
      classroomId: 'room-302',
      classroomName: 'Room 302 (Midterm Exam Room)',
      professorEmail: 'prof.miller@proinsight.edu',
      professorName: 'Prof. Sarah Miller',
      date: '2026-05-30',
      startTime: '19:00',
      endTime: '22:00',
      status: 'active'
    },
    {
      id: 'exam-2',
      name: 'Bio-informatics Final',
      subject: 'Advanced Bio-informatics II',
      classroomId: 'lab-10',
      classroomName: 'Computer Lab 10',
      professorEmail: 'prof.vance@proinsight.edu',
      professorName: 'Prof. Elena Vance',
      date: '2026-05-31',
      startTime: '14:00',
      endTime: '17:00',
      status: 'scheduled'
    },
    {
      id: 'exam-3',
      name: 'Stoicism & Ethics Midterm',
      subject: 'Ancient Philosophy',
      classroomId: 'hall-a',
      classroomName: 'Grand Lecture Hall A',
      professorEmail: 'prof.aurelius@proinsight.edu',
      professorName: 'Prof. Marcus Aurelius',
      date: '2026-06-01',
      startTime: '10:00',
      endTime: '12:00',
      status: 'scheduled'
    }
  ]

  function initExams() {
    const saved = localStorage.getItem('proinsight_exams')
    if (saved) {
      exams.value = JSON.parse(saved)
    } else {
      exams.value = [...defaultExams]
      saveToStorage()
    }
  }

  function saveToStorage() {
    localStorage.setItem('proinsight_exams', JSON.stringify(exams.value))
  }

  function addExam(exam: Omit<Exam, 'id'>) {
    const newExam: Exam = {
      ...exam,
      id: `exam-${Date.now()}`
    }
    exams.value.push(newExam)
    saveToStorage()
    return newExam
  }

  function updateExam(id: string, updatedData: Partial<Exam>) {
    const idx = exams.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      exams.value[idx] = { ...exams.value[idx], ...updatedData }
      saveToStorage()
      return true
    }
    return false
  }

  function deleteExam(id: string) {
    const idx = exams.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      exams.value.splice(idx, 1)
      saveToStorage()
      return true
    }
    return false
  }

  return {
    exams,
    initExams,
    addExam,
    updateExam,
    deleteExam
  }
})
