<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClassroomsStore, type Classroom, type TableLayout } from '../stores/classrooms'
import { Grid, Plus, Edit2, Trash2, ArrowLeft, Armchair, Move, Info } from 'lucide-vue-next'

const classroomsStore = useClassroomsStore()

// View states: 'list' | 'design'
const viewMode = ref<'list' | 'design'>('list')
const selectedRoomId = ref<string | null>(null)

// Create Classroom Form state
const isCreateOpen = ref(false)
const newRoomName = ref('')
const newRoomRows = ref(3)
const newRoomCols = ref(4)
const newRoomTablesCount = ref(8)

// Design state
const activeRoom = computed(() => {
  return classroomsStore.classrooms.find(r => r.id === selectedRoomId.value) || null
})

// Tables in pool
const seatPool = computed(() => {
  if (!activeRoom.value) return []
  return activeRoom.value.tables.filter(t => t.slotIndex === null)
})

// Grid occupied items
const gridSlots = computed(() => {
  if (!activeRoom.value) return []
  const slotsCount = activeRoom.value.rows * activeRoom.value.cols
  const slots = Array<TableLayout | null>(slotsCount).fill(null)
  
  activeRoom.value.tables.forEach(table => {
    if (table.slotIndex !== null && table.slotIndex < slotsCount) {
      slots[table.slotIndex] = table
    }
  })
  return slots
})

onMounted(() => {
  classroomsStore.initClassrooms()
})

// Drag and drop states
const draggedTableId = ref<string | null>(null)
const newTableCode = ref('')
const designerError = ref('')

function openDesigner(roomId: string) {
  selectedRoomId.value = roomId
  viewMode.value = 'design'
  newTableCode.value = ''
  designerError.value = ''
}

function closeDesigner() {
  viewMode.value = 'list'
  selectedRoomId.value = null
}

function handleCreateRoom() {
  if (!newRoomName.value.trim()) return
  classroomsStore.addClassroom(
    newRoomName.value,
    newRoomRows.value,
    newRoomCols.value,
    newRoomTablesCount.value
  )
  newRoomName.value = ''
  isCreateOpen.value = false
}

function handleDeleteRoom(id: string) {
  if (confirm('Are you sure you want to delete this classroom? All saved layouts will be lost.')) {
    classroomsStore.deleteClassroom(id)
  }
}

// Drag & drop logic
function onDragStart(e: DragEvent, tableId: string) {
  draggedTableId.value = tableId
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', tableId)
    e.dataTransfer.effectAllowed = 'move'
  }
}

function onDragEnd() {
  draggedTableId.value = null
}

function onDropToGrid(e: DragEvent, targetSlotIndex: number) {
  e.preventDefault()
  if (!activeRoom.value) return
  
  const tableId = e.dataTransfer?.getData('text/plain') || draggedTableId.value
  if (!tableId) return

  const currentTables = [...activeRoom.value.tables]
  const draggedTable = currentTables.find(t => t.id === tableId)
  if (!draggedTable) return

  // Check if a desk already occupies this spot
  const occupyingTable = currentTables.find(t => t.slotIndex === targetSlotIndex)
  if (occupyingTable) {
    // Swap: Move occupying table to the dragged table's original spot (could be null / seat pool)
    occupyingTable.slotIndex = draggedTable.slotIndex
  }
  
  draggedTable.slotIndex = targetSlotIndex
  
  // Save updated coordinates
  classroomsStore.updateRoomLayout(activeRoom.value.id, currentTables, activeRoom.value.rows, activeRoom.value.cols)
  draggedTableId.value = null
}

function onDropToPool(e: DragEvent) {
  e.preventDefault()
  if (!activeRoom.value) return

  const tableId = e.dataTransfer?.getData('text/plain') || draggedTableId.value
  if (!tableId) return

  const currentTables = [...activeRoom.value.tables]
  const draggedTable = currentTables.find(t => t.id === tableId)
  if (!draggedTable) return

  // Remove slot index so it falls back to the pool
  draggedTable.slotIndex = null
  classroomsStore.updateRoomLayout(activeRoom.value.id, currentTables, activeRoom.value.rows, activeRoom.value.cols)
  draggedTableId.value = null
}

function addNewTable() {
  if (!activeRoom.value || !newTableCode.value.trim()) return
  designerError.value = ''
  
  const res = classroomsStore.addTableToRoom(activeRoom.value.id, newTableCode.value.trim().toUpperCase())
  if (res.success) {
    newTableCode.value = ''
  } else {
    designerError.value = res.message || 'Error adding desk.'
  }
}

function updateGridSize(dimension: 'rows' | 'cols', delta: number) {
  if (!activeRoom.value) return
  let newRows = activeRoom.value.rows
  let newCols = activeRoom.value.cols
  
  if (dimension === 'rows') {
    newRows = Math.max(1, newRows + delta)
  } else {
    newCols = Math.max(1, newCols + delta)
  }

  // Any tables exceeding the new grid limit should be returned to the pool
  const maxSlots = newRows * newCols
  const updatedTables = activeRoom.value.tables.map(t => {
    if (t.slotIndex !== null && t.slotIndex >= maxSlots) {
      return { ...t, slotIndex: null }
    }
    return t
  })

  classroomsStore.updateRoomLayout(activeRoom.value.id, updatedTables, newRows, newCols)
}
</script>

<template>
  <div class="space-y-6 select-none animate-fade-in">
    
    <!-- LIST VIEW -->
    <div v-if="viewMode === 'list'" class="space-y-6">
      
      <div class="flex justify-between items-center">
        <p class="text-xs text-[var(--text-secondary)]">Create exam classrooms and customize seating layouts via interactive blueprints.</p>
        <button
          @click="isCreateOpen = !isCreateOpen"
          class="flex items-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <Plus class="h-4.5 w-4.5" />
          Create Classroom
        </button>
      </div>

      <!-- Create Room Drawer -->
      <div v-if="isCreateOpen" class="p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-md space-y-4 animate-in slide-in-from-top duration-200">
        <h3 class="text-sm font-bold text-[var(--text-primary)]">New Classroom Settings</h3>
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Room Name</label>
            <input
              v-model="newRoomName"
              type="text"
              placeholder="e.g. Hall B"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Grid Rows</label>
            <input
              v-model="newRoomRows"
              type="number"
              min="2"
              max="8"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Grid Columns</label>
            <input
              v-model="newRoomCols"
              type="number"
              min="2"
              max="8"
              class="input-field"
            />
          </div>
        </div>
        <div class="flex items-center justify-between pt-2">
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Initial Tables Count</label>
            <input
              v-model="newRoomTablesCount"
              type="number"
              min="1"
              max="20"
              class="input-field max-w-[150px]"
            />
          </div>
          <div class="flex gap-3">
            <button
              @click="isCreateOpen = false"
              class="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleCreateRoom"
              class="px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Save Classroom
            </button>
          </div>
        </div>
      </div>

      <!-- Classrooms Card Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="room in classroomsStore.classrooms"
          :key="room.id"
          class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs flex flex-col justify-between"
        >
          <div>
            <div class="flex items-center justify-between mb-3">
              <span class="p-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-lg">
                <Grid class="h-5 w-5" />
              </span>
              <button
                @click="handleDeleteRoom(room.id)"
                class="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                title="Delete Classroom"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
            <h4 class="text-sm font-bold text-[var(--text-primary)]">{{ room.name }}</h4>
            <p class="text-xs text-[var(--text-secondary)] mt-1.5">Blueprint size: {{ room.rows }} × {{ room.cols }} Grid</p>
            <p class="text-xs text-[var(--text-secondary)] mt-1">Total Desks: {{ room.tables.length }} tables</p>
          </div>

          <button
            @click="openDesigner(room.id)"
            class="mt-6 w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-[#026783] hover:bg-[#026783] hover:text-white text-[#026783] text-xs font-bold rounded-lg transition-all"
          >
            <Edit2 class="h-3 w-3" />
            Design Room Seating Map
          </button>
        </div>
      </div>
    </div>

    <!-- BLUEPRINT DESIGNER VIEW -->
    <div v-else-if="viewMode === 'design' && activeRoom" class="space-y-6">
      
      <!-- Designer Sub-Header -->
      <div class="flex items-center justify-between border-b border-[var(--border-color)] pb-4">
        <div class="flex items-center gap-3">
          <button
            @click="closeDesigner"
            class="p-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          >
            <ArrowLeft class="h-4.5 w-4.5" />
          </button>
          <div>
            <h3 class="text-sm font-bold text-[var(--text-primary)]">{{ activeRoom.name }}</h3>
            <p class="text-xs text-[var(--text-secondary)]">Drag desks onto grid spaces. Redraw room size via sizing buttons.</p>
          </div>
        </div>
        
        <!-- Grid Controller -->
        <div class="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-2 rounded-lg text-xs font-semibold shadow-xs">
          <span>Rows: {{ activeRoom.rows }}</span>
          <div class="flex gap-1">
            <button @click="updateGridSize('rows', -1)" class="w-6 h-6 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded font-bold">-</button>
            <button @click="updateGridSize('rows', 1)" class="w-6 h-6 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded font-bold">+</button>
          </div>
          <div class="w-px h-4 bg-[var(--border-color)] mx-1"></div>
          <span>Cols: {{ activeRoom.cols }}</span>
          <div class="flex gap-1">
            <button @click="updateGridSize('cols', -1)" class="w-6 h-6 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded font-bold">-</button>
            <button @click="updateGridSize('cols', 1)" class="w-6 h-6 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded font-bold">+</button>
          </div>
        </div>
      </div>

      <!-- Workspace Area -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        <!-- Left Side: Table builder & Pool -->
        <div class="space-y-6 lg:col-span-1">
          <!-- Add Desk tool -->
          <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs space-y-4">
            <h4 class="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Add Tables to Room</h4>
            <div class="flex gap-2">
              <input
                v-model="newTableCode"
                type="text"
                placeholder="e.g. T-10"
                class="input-field"
                @keyup.enter="addNewTable"
              />
              <button
                @click="addNewTable"
                class="px-3.5 bg-[#026783] hover:bg-[#0588ad] text-white rounded-lg transition-colors flex items-center justify-center shadow-xs"
              >
                <Plus class="h-4.5 w-4.5" />
              </button>
            </div>
            <p v-if="designerError" class="text-[10px] text-rose-500 font-semibold leading-tight">{{ designerError }}</p>
          </div>

          <!-- Seat Pool (tables with slotIndex === null) -->
          <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs flex flex-col">
            <h4 class="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider mb-2 flex justify-between items-center">
              <span>Seat Pool</span>
              <span class="px-2 py-0.5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-full text-[10px]">{{ seatPool.length }}</span>
            </h4>
            <p class="text-[10px] text-[var(--text-muted)] mb-4">Unassigned tables. Drag these onto the grid map.</p>

            <div
              class="grid grid-cols-2 gap-2.5 p-3 min-h-[180px] max-h-[300px] overflow-y-auto border border-dashed border-[var(--border-color)] rounded-lg bg-[var(--bg-primary)]"
              @dragover.prevent
              @drop="onDropToPool"
            >
              <div
                v-for="table in seatPool"
                :key="table.id"
                class="flex items-center justify-between p-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-primary)] shadow-xs select-none cursor-grab active:cursor-grabbing hover:border-[#026783] transition-all shrink-0"
                draggable="true"
                @dragstart="onDragStart($event, table.id)"
                @dragend="onDragEnd"
              >
                <div class="flex items-center gap-1.5 truncate">
                  <Armchair class="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  <span class="font-mono">{{ table.code }}</span>
                </div>
                <Move class="h-3 w-3 text-[var(--text-muted)] shrink-0" />
              </div>

              <div v-if="seatPool.length === 0" class="col-span-2 flex flex-col items-center justify-center text-center py-12 text-[var(--text-muted)]">
                <Info class="h-4.5 w-4.5 mb-1" />
                <span class="text-[10px]">Pool Empty</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Center: Interactive Seating Blueprint Grid -->
        <div class="lg:col-span-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-6 sm:p-8 rounded-xl shadow-xs flex flex-col items-center">
          
          <!-- Board indicator -->
          <div class="w-full max-w-md border-b-4 border-slate-700 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 py-2.5 mb-12 text-center text-xs font-bold tracking-widest text-slate-500 rounded">
            FRONT / WHITEBOARD / TEACHER DESK
          </div>

          <!-- Seating Grid -->
          <div class="classroom-grid-bg border border-[var(--border-color)] p-6 sm:p-12 rounded-xl overflow-auto w-full flex justify-center">
            <div
              class="grid gap-6 w-fit"
              :style="{
                gridTemplateColumns: `repeat(${activeRoom.cols}, minmax(0, 1fr))`
              }"
            >
              <div
                v-for="(slot, idx) in gridSlots"
                :key="idx"
                class="w-32 h-24 relative"
              >
                <!-- Placed desk card -->
                <div
                  v-if="slot"
                  class="absolute inset-0 bg-[var(--bg-secondary)] border border-[var(--border-color)] border-b-4 border-b-[#026783] rounded-lg shadow-sm p-2 flex flex-col justify-between hover:scale-105 transition-all select-none cursor-grab active:cursor-grabbing hover:border-[#026783]"
                  draggable="true"
                  @dragstart="onDragStart($event, slot.id)"
                  @dragend="onDragEnd"
                >
                  <div class="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span class="font-mono font-bold">{{ slot.code }}</span>
                    <Move class="h-3 w-3" />
                  </div>
                  
                  <div class="flex items-center gap-1 text-xs text-[var(--text-secondary)] font-semibold justify-center">
                    <Armchair class="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    <span>Desk Seat</span>
                  </div>
                  
                  <!-- Desk Legs UI -->
                  <div class="absolute -bottom-1 left-2 w-1 h-1.5 bg-slate-400 rounded-sm"></div>
                  <div class="absolute -bottom-1 right-2 w-1 h-1.5 bg-slate-400 rounded-sm"></div>
                </div>

                <!-- Empty Blueprint Dropzone Slot -->
                <div
                  v-else
                  class="absolute inset-0 border-2 border-dashed border-[var(--border-color)] hover:border-slate-400 dark:hover:border-slate-500 rounded-lg flex items-center justify-center transition-colors text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold cursor-default"
                  @dragover.prevent
                  @drop="onDropToGrid($event, idx)"
                >
                  Empty Spot
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>

  </div>
</template>
