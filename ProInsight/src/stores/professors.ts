import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export interface Professor {
  name: string
  email: string
  department: string
}

export const useProfessorsStore = defineStore('professors', () => {
  const professors = ref<Professor[]>([])

  const defaultProfessors: Professor[] = [
    { name: 'Prof. Sarah Miller', email: 'prof.miller@proinsight.edu', department: 'Computer Science' },
    { name: 'Prof. Elena Vance', email: 'prof.vance@proinsight.edu', department: 'Bio-Engineering' },
    { name: 'Prof. Marcus Aurelius', email: 'prof.aurelius@proinsight.edu', department: 'Philosophy' },
    { name: 'Prof. Charles Xavier', email: 'prof.xavier@proinsight.edu', department: 'Genetics' },
    { name: 'Prof. Indiana Jones', email: 'prof.jones@proinsight.edu', department: 'Archaeology' }
  ]

  async function initProfessors() {
    try {
      const response = await api.get('/professors')
      if (response.data && Array.isArray(response.data)) {
        professors.value = response.data.map((p: any) => ({
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          department: p.department
        }))
        saveToStorage()
        return
      }
    } catch (err) {
      console.warn('Failed to load professors from backend, falling back to local storage:', err)
    }

    const saved = localStorage.getItem('proinsight_professors')
    if (saved) {
      professors.value = JSON.parse(saved)
    } else {
      professors.value = [...defaultProfessors]
      saveToStorage()
    }
  }

  function saveToStorage() {
    localStorage.setItem('proinsight_professors', JSON.stringify(professors.value))
  }

  async function addProfessor(prof: Professor) {
    const exists = professors.value.some(p => p.email.toLowerCase() === prof.email.toLowerCase())
    if (exists) {
      return { success: false, message: 'Professor email already exists.' }
    }

    try {
      const nameParts = prof.name.split(' ')
      const firstName = nameParts[0] || 'Prof.'
      const lastName = nameParts.slice(1).join(' ') || 'Professor'

      await api.post('/professors', {
        firstName,
        lastName,
        email: prof.email,
        department: prof.department,
        password: 'prof123password'
      })
    } catch (err: any) {
      console.warn('Failed to save professor to backend:', err)
      return { success: false, message: err.response?.data?.message || 'Failed to save professor on backend.' }
    }

    professors.value.unshift(prof)
    saveToStorage()
    return { success: true }
  }

  function updateProfessor(email: string, updatedData: Partial<Professor>) {
    const idx = professors.value.findIndex(p => p.email.toLowerCase() === email.toLowerCase())
    if (idx !== -1) {
      // If email is changing, make sure it's not taken by another
      if (updatedData.email && updatedData.email.toLowerCase() !== email.toLowerCase()) {
        const taken = professors.value.some((p, pIdx) => pIdx !== idx && p.email.toLowerCase() === updatedData.email?.toLowerCase())
        if (taken) {
          return { success: false, message: 'Email address already assigned to another professor.' }
        }
      }
      professors.value[idx] = { ...professors.value[idx], ...updatedData }
      saveToStorage()
      return { success: true }
    }
    return { success: false, message: 'Professor not found.' }
  }

  function deleteProfessor(email: string) {
    const idx = professors.value.findIndex(p => p.email.toLowerCase() === email.toLowerCase())
    if (idx !== -1) {
      professors.value.splice(idx, 1)
      saveToStorage()
      return true
    }
    return false
  }

  return {
    professors,
    initProfessors,
    addProfessor,
    updateProfessor,
    deleteProfessor
  }
})
