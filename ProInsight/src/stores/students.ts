import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Student {
  firstName: string
  lastName: string
  registrationNumber: string
  department: string
  group: string
  espId: string
}

export const useStudentsStore = defineStore('students', () => {
  const students = ref<Student[]>([])

  const defaultStudents: Student[] = [
    { firstName: 'Marcus', lastName: 'Chen', registrationNumber: 'REG-2026-001', department: 'Computer Science', group: 'CS-A', espId: 'ESP32-CS01' },
    { firstName: 'Elena', lastName: 'Vance', registrationNumber: 'REG-2026-002', department: 'Bio-Engineering', group: 'BIO-2B', espId: 'ESP32-BIO02' },
    { firstName: 'Julianna', lastName: 'Moore', registrationNumber: 'REG-2026-003', department: 'Computer Science', group: 'CS-A', espId: 'ESP32-CS03' },
    { firstName: 'Sarah', lastName: 'Park', registrationNumber: 'REG-2026-004', department: 'Bio-Engineering', group: 'BIO-2B', espId: 'ESP32-BIO04' },
    { firstName: 'Omar', lastName: 'Khalil', registrationNumber: 'REG-2026-005', department: 'Computer Science', group: 'CS-B', espId: 'ESP32-CS05' },
    { firstName: 'Li', lastName: 'Wei', registrationNumber: 'REG-2026-006', department: 'Mathematics', group: 'MATH-1A', espId: 'ESP32-MATH06' },
    { firstName: 'Sarah', lastName: 'Miller', registrationNumber: 'REG-2026-007', department: 'Computer Science', group: 'CS-B', espId: 'ESP32-CS07' },
    { firstName: 'Arthur', lastName: 'Dent', registrationNumber: 'REG-2026-008', department: 'Astrophysics', group: 'AST-4C', espId: 'ESP32-AST08' },
    { firstName: 'Tricia', lastName: 'McMillan', registrationNumber: 'REG-2026-009', department: 'Astrophysics', group: 'AST-4C', espId: 'ESP32-AST09' },
    { firstName: 'Ford', lastName: 'Prefect', registrationNumber: 'REG-2026-010', department: 'Sociology', group: 'SOC-3A', espId: 'ESP32-SOC10' }
  ]

  function initStudents() {
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

  function addStudent(student: Student) {
    // Prevent duplicate registration numbers or ESP IDs
    const existsReg = students.value.some(s => s.registrationNumber === student.registrationNumber)
    const existsEsp = students.value.some(s => s.espId === student.espId)
    if (existsReg || existsEsp) {
      return { success: false, message: existsReg ? 'Registration number already exists.' : 'ESP32 ID already assigned.' }
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
