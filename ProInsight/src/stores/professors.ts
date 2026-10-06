import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export interface Professor {
  id: number
  name: string
  email: string
  password?: string
  department?: string
}

export interface Therapist {
  id: number
  name: string
  email: string
  password?: string
}

export const useProfessorsStore = defineStore('professors', () => {
  const professors = ref<Professor[]>([])
  const therapists = ref<Therapist[]>([])


  async function initProfessors() {
    try {
      const response = await api.get('/professors')
      if (response.data && Array.isArray(response.data)) {
        professors.value = response.data.map((p: any) => ({
          id: p.id,
          name: `${p.user?.firstName} ${p.user?.lastName}`,
          email: p.user?.email,
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

  async function initTherapists() {
    try {
      const response = await api.get('/therapists')
      if (response.data && Array.isArray(response.data)) {
        therapists.value = response.data.map((t: any) => ({
          id: t.id,
          name: `${t.user?.firstName} ${t.user?.lastName}`,
          email: t.user?.email,
        }))
        return
      }
    } catch (err) {
      console.warn('Failed to load therapists from backend:', err)
    }
  }

  async function addTherapist(therapist: Omit<Therapist, 'id'>) {
    const exists = therapists.value.some(t => t.email.toLowerCase() === therapist.email.toLowerCase())
    if (exists) {
      return { success: false, message: 'Therapist email already exists.' }
    }

    try {
      const nameParts = therapist.name.split(' ')
      const firstName = nameParts[0] || 'Therapist'
      const lastName = nameParts.slice(1).join(' ') || 'User'

      await api.post('/users', {
        firstName,
        lastName,
        email: therapist.email,
        password: therapist.password,
        role: 'THERAPIST'
      })

    } catch (err: any) {
      console.warn('Failed to save therapist to backend:', err)
      return { success: false, message: err.response?.data?.message || 'Failed to save therapist on backend.' }
    }

    await initTherapists()
    return { success: true }
  }

  return {
    professors,
    therapists,
    initProfessors,
    addProfessor,
    updateProfessor,
    deleteProfessor,
    initTherapists,
    addTherapist
  }
})

  