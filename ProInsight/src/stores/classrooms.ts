import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../services/api'

export interface TableLayout {
  id: number
  qrCode?: string
  positionX: number
  positionY: number
}

export interface Classroom {
  id: number
  name: string
  rows: number
  cols: number
  tables: TableLayout[]
}

export const useClassroomsStore = defineStore('classrooms', () => {
  const classrooms = ref<Classroom[]>([])


  async function initClassrooms() {
    try {
      const response = await api.get('/classrooms')
      if (response.data && Array.isArray(response.data)) {
        classrooms.value = response.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          rows: c.rows,
          cols: c.columns || c.cols,
          tables: (c.tables || []).map((t: any) => ({
            id: t.id,
            qrCode: t.qrCode,
            positionX: t.positionX,
            positionY: t.positionY
          }))
        }))
        return
      }
    } catch (err) {
      console.warn('Failed to load classrooms from backend, falling back to local storage:', err)
    }


  }


  async function addClassroom(
    name: string,
    rows: number,
    cols: number,
  ) {
    const { data } = await api.post('/classrooms', {
      name,
      building: 'Main Building',
      capacity: rows * cols,
      rows,
      columns: cols,
    })

    const room: Classroom = {
      id: data.id,
      name: data.name,
      rows: data.rows,
      cols: data.columns,
      tables: [],
    }

    classrooms.value.push(room)

    return room
  }


  async function addTableToRoom(
    classroomId: number,
    positionX: number,
    positionY: number,
  ) {
    const { data } = await api.post('/tables', {
      classroomId,
      positionX,
      positionY,
    })

    const room = classrooms.value.find(
      r => r.id === classroomId,
    )

    room?.tables.push(data)

    return data
  }
  async function deleteClassroom(id: number) {
    await api.delete(`/classrooms/${id}`)

    classrooms.value =
      classrooms.value.filter(
        room => room.id !== id,
      )
  }
  async function updateClassroom(
    id: number,
    rows: number,
    cols: number,
  ) {
    const { data } = await api.patch(
      `/classrooms/${id}`,
      {
        rows,
        columns: cols,
      },
    )

    const room = classrooms.value.find(
      r => r.id === id,
    )

    if (room) {
      room.rows = data.rows
      room.cols = data.columns
    }

    return data
  }
  async function saveLayout(
    classroomId: number,
  ) {
    const room = classrooms.value.find(
      r => r.id === classroomId,
    )

    if (!room) return

    await api.patch(
      `/classrooms/${classroomId}/layout`,
      {
        tables: room.tables.map(table => ({
          id: table.id,
          positionX: table.positionX,
          positionY: table.positionY,
        })),
      },
    )
  }
  async function moveTable(
    tableId: number,
    positionX: number,
    positionY: number,
  ) {
    const { data } = await api.patch(
      `/tables/${tableId}`,
      {
        positionX,
        positionY,
      },
    )

    for (const room of classrooms.value) {
      const table = room.tables.find(
        t => t.id === tableId,
      )

      if (table) {
        table.positionX = data.positionX
        table.positionY = data.positionY
        break
      }
    }

    return data
  }
  return {
    classrooms,
    initClassrooms,
    addClassroom,
    addTableToRoom,
    deleteClassroom,
    saveLayout,
    moveTable,
    updateClassroom,
  }
})
