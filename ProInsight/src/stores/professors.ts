import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export interface Professor {
  id: number
  name: string
  email: string
  department: string
  password?: string
}

export const useProfessorsStore = defineStore('professors', () => {
  const professors = ref<Professor[]>([])


  async function initProfessors() {
    try {
      const response = await api.get('/professors')
      if (response.data && Array.isArray(response.data)) {
        professors.value = response.data.map((p: any) => ({
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          email: p.email,
          department: p.department
        }))

        return
      }
    } catch (err) {
      console.warn('Failed to load professors from backend:', err)
    }

  }

  async function addProfessor(prof: Omit<Professor, 'id'>) {
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
        password: prof.password
      })

    } catch (err: any) {
      console.warn('Failed to save professor to backend:', err)
      return { success: false, message: err.response?.data?.message || 'Failed to save professor on backend.' }
    }

    await initProfessors()
    return { success: true }
  }

  async function updateProfessor(
    id: number,
    updatedData: Partial<Professor>
  ) {
    try {
      const nameParts = updatedData.name?.split(' ') || []

      await api.patch(`/professors/${id}`, {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' '),
        email: updatedData.email,
        department: updatedData.department
      })

      await initProfessors()

      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          'Failed to update professor'
      }
    }
  }

  async function deleteProfessor(id: number) {
    try {
      await api.delete(`/professors/${id}`)
      await initProfessors()
      return { success: true }
    } catch (err: any) {
      return {
        success: false,
        message:
          err.response?.data?.message ||
          'Failed to delete professor'
      }
    }
  }

  return {
    professors,
    initProfessors,
    addProfessor,
    updateProfessor,
    deleteProfessor
  }
})

  