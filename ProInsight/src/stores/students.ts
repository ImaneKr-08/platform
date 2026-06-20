import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export interface Student {
  firstName: string
  lastName: string
  registrationNumber: string
  group: string
  espId?: string | null
  email?: string
  password?: string
}

export const useStudentsStore = defineStore('students', () => {
  const students = ref<Student[]>([])

  const defaultStudents: Student[] = [
    { firstName: 'Marcus', lastName: 'Chen', registrationNumber: 'REG-2026-001', group: 'CS-A', espId: 'ESP32-CS01' },
    { firstName: 'Elena', lastName: 'Vance', registrationNumber: 'REG-2026-002', group: 'BIO-2B', espId: 'ESP32-BIO02' },
    { firstName: 'Julianna', lastName: 'Moore', registrationNumber: 'REG-2026-003', group: 'CS-A', espId: 'ESP32-CS03' },
    { firstName: 'Sarah', lastName: 'Park', registrationNumber: 'REG-2026-004', group: 'BIO-2B', espId: 'ESP32-BIO04' },
    { firstName: 'Omar', lastName: 'Khalil', registrationNumber: 'REG-2026-005', group: 'CS-B', espId: 'ESP32-CS05' },
    { firstName: 'Li', lastName: 'Wei', registrationNumber: 'REG-2026-006', group: 'MATH-1A', espId: 'ESP32-MATH06' },
    { firstName: 'Sarah', lastName: 'Miller', registrationNumber: 'REG-2026-007', group: 'CS-B', espId: 'ESP32-CS07' },
    { firstName: 'Arthur', lastName: 'Dent', registrationNumber: 'REG-2026-008', group: 'AST-4C', espId: 'ESP32-AST08' },
    { firstName: 'Tricia', lastName: 'McMillan', registrationNumber: 'REG-2026-009', group: 'AST-4C', espId: 'ESP32-AST09' },
    { firstName: 'Ford', lastName: 'Prefect', registrationNumber: 'REG-2026-010', group: 'SOC-3A', espId: 'ESP32-SOC10' }
  ]

  async function initStudents() {
    try {
      const response = await api.get('/students', { params: { limit: 100 } })
      if (response.data && Array.isArray(response.data.items)) {
        students.value = response.data.items.map((s: any) => ({
          firstName: s.user?.firstName || '',
          lastName: s.user?.lastName || '',
          registrationNumber: s.studentCode,
          group: s.group || 'A',
          espId: s.braceletId || ''
        }))
        saveToStorage()
        return
      }
    } catch (err) {
      console.warn('Failed to load students from backend, falling back to local storage:', err)
    }

    const saved = localStorage.getItem('proinsight_students')
    if (saved) {
      students.value = JSON.parse(saved)
    } else {
      students.value = [...defaultStudents]
      saveToStorage()
    }
  }

  function saveToStorage() {
    localStorage.setItem('proinsight_students', JSON.stringify(students.value))
  }

  async function addStudent(student: Student) {
    const existsReg = students.value.some(s => s.registrationNumber === student.registrationNumber)
    const existsEsp = student.espId ? students.value.some(s => s.espId === student.espId) : false
    if (existsReg || existsEsp) {
      return { success: false, message: existsReg ? 'Registration number already exists.' : 'ESP32 ID already assigned.' }
    }

    try {
      await api.post('/students', {
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email || `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@proinsight.edu`,
        group: student.group,
        studentCode: student.registrationNumber,
        braceletId: student.espId || null,
        password: student.password
      })
    } catch (err: any) {
      console.warn('Failed to save student on backend:', err)
      return { success: false, message: err.response?.data?.message || 'Failed to save student on backend.' }
    }

    students.value.unshift(student)
    saveToStorage()
    return { success: true }
  }

  function updateStudent(regNum: string, updatedData: Partial<Student>) {
    const idx = students.value.findIndex(s => s.registrationNumber === regNum)
    if (idx !== -1) {
      // If updating ESP ID, make sure it's not taken by another student
      if (updatedData.espId && updatedData.espId !== students.value[idx].espId) {
        const taken = students.value.some((s, sIdx) => sIdx !== idx && s.espId === updatedData.espId)
        if (taken) {
          return { success: false, message: 'ESP32 ID is already assigned to another student.' }
        }
      }
      students.value[idx] = { ...students.value[idx], ...updatedData }
      saveToStorage()
      return { success: true }
    }
    return { success: false, message: 'Student not found.' }
  }

  function deleteStudent(regNum: string) {
    const idx = students.value.findIndex(s => s.registrationNumber === regNum)
    if (idx !== -1) {
      students.value.splice(idx, 1)
      saveToStorage()
      return true
    }
    return false
  }

  return {
    students,
    initStudents,
    addStudent,
    updateStudent,
    deleteStudent
  }
})
