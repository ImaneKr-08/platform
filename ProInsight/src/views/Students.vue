<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStudentsStore, type Student } from '../stores/students'
import Modal from '../components/Modal.vue'
import { Plus, Search, Edit2, Trash2, Filter, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-vue-next'

const studentsStore = useStudentsStore()

// State
const searchQuery = ref('')
const selectedDepartment = ref('')
const currentPage = ref(1)
const itemsPerPage = 5

// Modal state
const isFormModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const errorMsg = ref('')

const formModel = ref<Student>({
  firstName: '',
  lastName: '',
  registrationNumber: '',
  department: 'Computer Science',
  group: '',
  espId: ''
})

onMounted(() => {
  studentsStore.initStudents()
})

// Departments list
const departments = ['Computer Science', 'Bio-Engineering', 'Mathematics', 'Astrophysics', 'Sociology']

// Filtering logic
const filteredStudents = computed(() => {
  return studentsStore.students.filter(student => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      student.espId.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesDept = !selectedDepartment.value || student.department === selectedDepartment.value

    return matchesSearch && matchesDept
  })
})

// Pagination logic
const totalPages = computed(() => Math.ceil(filteredStudents.value.length / itemsPerPage))

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredStudents.value.slice(start, start + itemsPerPage)
})

function handlePageChange(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Actions
function openAddModal() {
  modalMode.value = 'add'
  formModel.value = {
    firstName: '',
    lastName: '',
    registrationNumber: `REG-2026-0${studentsStore.students.length + 11}`,
    department: 'Computer Science',
    group: '',
    espId: `ESP32-DEV${studentsStore.students.length + 11}`
  }
  errorMsg.value = ''
  isFormModalOpen.value = true
}

function openEditModal(student: Student) {
  modalMode.value = 'edit'
  formModel.value = { ...student }
  errorMsg.value = ''
  isFormModalOpen.value = true
}

function handleSave() {
  if (!formModel.value.firstName || !formModel.value.lastName || !formModel.value.group) {
    errorMsg.value = 'First name, last name, and group are required.'
    return
  }

  errorMsg.value = ''
  
  if (modalMode.value === 'add') {
    const res = studentsStore.addStudent(formModel.value)
    if (res.success) {
      isFormModalOpen.value = false
    } else {
      errorMsg.value = res.message || 'Error creating student profile.'
    }
  } else {
    const res = studentsStore.updateStudent(formModel.value.registrationNumber, formModel.value)
    if (res.success) {
      isFormModalOpen.value = false
    } else {
      errorMsg.value = res.message || 'Error updating student profile.'
    }
  }
}

function handleDelete(regNumber: string) {
  if (confirm('Are you sure you want to delete this student profile?')) {
    studentsStore.deleteStudent(regNumber)
    // Adjust pagination index if page becomes empty
    if (paginatedStudents.value.length === 0 && currentPage.value > 1) {
      currentPage.value--
    }
  }
}
</script>

<template>
  <div class="space-y-6 select-none animate-fade-in">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <p class="text-xs text-[var(--text-secondary)]">Manage system students profiles and ESP32 nodes bindings.</p>
      </div>
      <button
        @click="openAddModal"
        class="flex items-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-98"
      >
        <Plus class="h-4.5 w-4.5" />
        Register Student
      </button>
    </div>

    <!-- Filters layout -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
      <!-- Search input -->
      <div class="relative w-full md:max-w-md">
        <Search class="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name, reg, or device ID..."
          class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:border-[#026783] transition-colors"
        />
      </div>

      <!-- Filters -->
      <div class="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
        <Filter class="h-4.5 w-4.5 text-[var(--text-secondary)]" />
        <select
          v-model="selectedDepartment"
          class="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#026783]"
        >
          <option value="">All Departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
        </select>
      </div>
    </div>

    <!-- Table content -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-[var(--bg-primary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Student Name</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Reg. Number</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Department</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Group</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">ESP32 ID</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-color)]">
            <tr v-for="student in paginatedStudents" :key="student.registrationNumber" class="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
              <td class="px-6 py-4 font-semibold text-[var(--text-primary)]">
                {{ student.firstName }} {{ student.lastName }}
              </td>
              <td class="px-6 py-4 text-slate-500 font-mono text-xs">
                {{ student.registrationNumber }}
              </td>
              <td class="px-6 py-4 text-[var(--text-secondary)]">
                {{ student.department }}
              </td>
              <td class="px-6 py-4 text-[var(--text-secondary)]">
                {{ student.group }}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 font-mono text-[10px]">
                  {{ student.espId }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="openEditModal(student)"
                    class="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all border border-transparent hover:border-sky-100 dark:hover:border-sky-900/30"
                    title="Edit Student"
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(student.registrationNumber)"
                    class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                    title="Delete Student"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredStudents.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-[var(--text-muted)]">
                No students found matching current filter query.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="px-6 py-4 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-medium text-[var(--text-secondary)]">
        <span>Showing page {{ currentPage }} of {{ totalPages }}</span>
        
        <div class="flex gap-2">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage === 1"
            class="p-1.5 border border-[var(--border-color)] rounded-lg disabled:opacity-50 hover:bg-[var(--bg-tertiary)]"
          >
            <ArrowLeft class="h-4 w-4" />
          </button>
          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="p-1.5 border border-[var(--border-color)] rounded-lg disabled:opacity-50 hover:bg-[var(--bg-tertiary)]"
          >
            <ArrowRight class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Edit/Add Modal Form -->
    <Modal
      :show="isFormModalOpen"
      :title="modalMode === 'add' ? 'Register Student' : 'Edit Student Profile'"
      @close="isFormModalOpen = false"
    >
      <div v-if="errorMsg" class="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 p-3 rounded-lg text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle class="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMsg }}</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">First Name</label>
          <input
            v-model="formModel.firstName"
            type="text"
            placeholder="John"
            class="input-field"
          />
        </div>
        
        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Last Name</label>
          <input
            v-model="formModel.lastName"
            type="text"
            placeholder="Doe"
            class="input-field"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Registration Number</label>
          <input
            v-model="formModel.registrationNumber"
            type="text"
            class="input-field bg-[var(--bg-tertiary)] cursor-not-allowed"
            :disabled="modalMode === 'edit'"
            title="Registration numbers cannot be modified once set"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Group</label>
          <input
            v-model="formModel.group"
            type="text"
            placeholder="CS-1A"
            class="input-field"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Department</label>
          <select
            v-model="formModel.department"
            class="input-field"
          >
            <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">ESP32 Device ID</label>
          <input
            v-model="formModel.espId"
            type="text"
            placeholder="ESP32-CS99"
            class="input-field"
          />
        </div>
      </div>

      <template #footer>
        <button
          @click="isFormModalOpen = false"
          class="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          class="px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
        >
          {{ modalMode === 'add' ? 'Save Record' : 'Apply Changes' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
