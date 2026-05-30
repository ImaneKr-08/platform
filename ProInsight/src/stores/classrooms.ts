import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface TableLayout {
  id: string
  code: string
  slotIndex: number | null // null means in the seat pool
}

export interface Classroom {
  id: string
  name: string
  rows: number
  cols: number
  tables: TableLayout[]
}

export const useClassroomsStore = defineStore('classrooms', () => {
  const classrooms = ref<Classroom[]>([])

  const defaultClassrooms: Classroom[] = [
    {
      id: 'room-302',
      name: 'Room 302 (Midterm Exam Room)',
      rows: 3,
      cols: 4,
      tables: [
        { id: 't1', code: 'T-01', slotIndex: 0 },
        { id: 't2', code: 'T-02', slotIndex: 1 },
        { id: 't3', code: 'T-03', slotIndex: 3 },
        { id: 't4', code: 'T-04', slotIndex: 4 },
        { id: 't5', code: 'T-05', slotIndex: 5 },
        { id: 't6', code: 'T-06', slotIndex: 6 },
        { id: 't7', code: 'T-07', slotIndex: 7 },
        { id: 't8', code: 'T-08', slotIndex: null }, // Seat pool
        { id: 't9', code: 'T-09', slotIndex: null }  // Seat pool
      ]
    },
    {
      id: 'lab-10',
      name: 'Computer Lab 10',
      rows: 4,
      cols: 5,
      tables: [
        { id: 'l1', code: 'L-01', slotIndex: 0 },
        { id: 'l2', code: 'L-02', slotIndex: 2 },
        { id: 'l3', code: 'L-03', slotIndex: 4 },
        { id: 'l4', code: 'L-04', slotIndex: 5 },
        { id: 'l5', code: 'L-05', slotIndex: 7 },
        { id: 'l6', code: 'L-06', slotIndex: 9 },
        { id: 'l7', code: 'L-07', slotIndex: 10 },
        { id: 'l8', code: 'L-08', slotIndex: 12 },
        { id: 'l9', code: 'L-09', slotIndex: 14 },
        { id: 'l10', code: 'L-10', slotIndex: null },
        { id: 'l11', code: 'L-11', slotIndex: null }
      ]
    },
    {
      id: 'hall-a',
      name: 'Grand Lecture Hall A',
      rows: 5,
      cols: 6,
      tables: [
        { id: 'h1', code: 'H-01', slotIndex: 0 },
        { id: 'h2', code: 'H-02', slotIndex: 2 },
        { id: 'h3', code: 'H-03', slotIndex: 4 },
        { id: 'h4', code: 'H-04', slotIndex: 6 },
        { id: 'h5', code: 'H-05', slotIndex: 8 },
        { id: 'h6', code: 'H-06', slotIndex: 10 },
        { id: 'h7', code: 'H-07', slotIndex: 12 },
        { id: 'h8', code: 'H-08', slotIndex: 14 },
        { id: 'h9', code: 'H-09', slotIndex: 16 },
        { id: 'h10', code: 'H-10', slotIndex: 18 }
      ]
    }
  ]

  function initClassrooms() {
    const saved = localStorage.getItem('proinsight_classrooms')
    if (saved) {
      classrooms.value = JSON.parse(saved)
    } else {
      classrooms.value = [...defaultClassrooms]
      saveToStorage()
    }
  }

  function saveToStorage() {
    localStorage.setItem('proinsight_classrooms', JSON.stringify(classrooms.value))
  }

  function addClassroom(name: string, rows: number, cols: number, tableCount: number) {
    const id = `room-${Date.now()}`
    const tables: TableLayout[] = []
    
    // Generate initial table pool
    for (let i = 1; i <= tableCount; i++) {
      const code = `D-${i < 10 ? '0' + i : i}`
      // Automatically place the first few desks, leave the rest in pool
      const slotIndex = (i - 1) < (rows * cols) ? (i - 1) : null
      tables.push({
        id: `desk-${id}-${i}`,
        code,
        slotIndex
      })
    }

    const newRoom: Classroom = { id, name, rows, cols, tables }
    classrooms.value.push(newRoom)
    saveToStorage()
    return newRoom
  }

  function updateRoomLayout(id: string, tables: TableLayout[], rows: number, cols: number) {
    const idx = classrooms.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      classrooms.value[idx].tables = tables
      classrooms.value[idx].rows = rows
      classrooms.value[idx].cols = cols
      saveToStorage()
      return true
    }
    return false
  }

  function addTableToRoom(id: string, tableCode: string) {
    const idx = classrooms.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      const room = classrooms.value[idx]
      // Verify code uniqueness in the room
      const taken = room.tables.some(t => t.code.toLowerCase() === tableCode.toLowerCase())
      if (taken) {
        return { success: false, message: `Desk code ${tableCode} already exists in this classroom.` }
      }
      const newTable: TableLayout = {
        id: `desk-${room.id}-${Date.now()}`,
        code: tableCode,
        slotIndex: null // Starts in seat pool
      }
      room.tables.push(newTable)
      saveToStorage()
      return { success: true, table: newTable }
    }
    return { success: false, message: 'Classroom not found.' }
  }

  function deleteClassroom(id: string) {
    const idx = classrooms.value.findIndex(r => r.id === id)
    if (idx !== -1) {
      classrooms.value.splice(idx, 1)
      saveToStorage()
      return true
    }
    return false
  }

  return {
    classrooms,
    initClassrooms,
    addClassroom,
    updateRoomLayout,
    addTableToRoom,
    deleteClassroom
  }
})
