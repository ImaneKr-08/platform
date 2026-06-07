<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProfessorsStore, type Professor } from '../stores/professors'
import Modal from '../components/Modal.vue'
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-vue-next'

const professorsStore = useProfessorsStore()

// State
const searchQuery = ref('')
const selectedDepartment = ref('')
const isFormModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const errorMsg = ref('')

const formModel = ref<Professor>({
  name: '',
  email: '',
  department: 'Computer Science',
  id: 0,
  password: ''
})

onMounted(() => {
  professorsStore.initProfessors()
})

const departments = ['Computer Science', 'Bio-Engineering', 'Philosophy', 'Genetics', 'Archaeology']

// Filtering
const filteredProfessors = computed(() => {
  return professorsStore.professors.filter(prof => {
    const matchesSearch = 
      prof.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      prof.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    const matchesDept = !selectedDepartment.value || prof.department === selectedDepartment.value

    return matchesSearch && matchesDept
  })
})

function generatePassword(length = 10) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

  let password = ''

  for (let i = 0; i < length; i++) {
    password += chars.charAt(
      Math.floor(Math.random() * chars.length)
    )
  }

  formModel.value.password = password
}

function openAddModal() {
  modalMode.value = 'add'
  formModel.value = {
    name: '',
    email: '',
    department: 'Computer Science',
    id: 0
  }
  generatePassword()
  errorMsg.value = ''
  isFormModalOpen.value = true
}

function openEditModal(prof: Professor) {
  modalMode.value = 'edit'
  formModel.value = { ...prof }
  errorMsg.value = ''
  isFormModalOpen.value = true
}

async function handleSave() {
  if (!formModel.value.name.trim()) {
    errorMsg.value = 'Name is required.'
    return
  }

  if (!formModel.value.email.trim()) {
    errorMsg.value = 'Email is required.'
    return
  }

  errorMsg.value = ''

  let result

  if (modalMode.value === 'add') {
    const { id, ...professorData } = formModel.value
    result = await professorsStore.addProfessor(professorData)
  } else {
    result = await professorsStore.updateProfessor(
      formModel.value.id,
      formModel.value
    )
  }

  if (result.success) {
    isFormModalOpen.value = false
  } else {
    errorMsg.value = result.message || 'Operation failed.'
  }
}
async function handleDelete(id: number) {
  if (!confirm('Are you sure you want to delete this professor?')) {
    return
  }

  const result = await professorsStore.deleteProfessor(id)

  if (!result.success) {
    errorMsg.value = result.message
  }
}
</script>

<template>
  <div class="space-y-6 select-none animate-fade-in">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <p class="text-xs text-[var(--text-secondary)]">Create and manage academic proctors accounts authorized to monitor live stress indexes.</p>
      </div>
      <button
        @click="openAddModal"
        class="flex items-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-98"
      >
        <Plus class="h-4.5 w-4.5" />
        Add Professor
      </button>
    </div>

    <!-- Filters panel -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
      <div class="relative w-full md:max-w-md">
        <Search class="absolute left-3 top-3 h-4 w-4 text-[var(--text-muted)]" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by name or email..."
          class="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-slate-400 focus:outline-none focus:border-[#026783]"
        />
      </div>

      <div class="flex items-center gap-3 w-full md:w-auto shrink-0 justify-end">
        <select
          v-model="selectedDepartment"
          class="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#026783]"
        >
          <option value="">All Departments</option>
          <option v-for="dept in departments" :key="dept" :value="dept">{{ dept }}</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-[var(--bg-primary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Professor Name</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Email Address</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Department</th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-color)]">
            <tr v-for="prof in filteredProfessors" :key="prof.id" class="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
              <td class="px-6 py-4 font-semibold text-[var(--text-primary)]">
                {{ prof.name }}
              </td>
              <td class="px-6 py-4 text-slate-500 font-mono text-xs">
                {{ prof.email }}
              </td>
              <td class="px-6 py-4 text-[var(--text-secondary)]">
                {{ prof.department }}
              </td>
              <td class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="openEditModal(prof)"
                    class="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all border border-transparent hover:border-sky-100 dark:hover:border-sky-900/30"
                    title="Edit Professor"
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(prof.id)"
                    class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                    title="Delete Professor"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredProfessors.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-[var(--text-muted)]">
                No professors found matching criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Modal
      :show="isFormModalOpen"
      :title="modalMode === 'add' ? 'Add Professor Account' : 'Edit Professor Details'"
      @close="isFormModalOpen = false"
    >
      <div v-if="errorMsg" class="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 p-3 rounded-lg text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle class="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMsg }}</span>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
          <input
            v-model="formModel.name"
            type="text"
            placeholder="Dr. John Watson"
            class="input-field"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
          <input
            v-model="formModel.email"
            type="email"
            placeholder="j.watson@proinsight.edu"
            class="input-field bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
            :disabled="modalMode === 'edit'"
            title="Emails cannot be modified once set"
          />
        </div>
       <div v-if="modalMode === 'add'">
  <label class="block text-xs font-semibold mb-1">
    Temporary Password
  </label>

  <div class="flex gap-2">
    <input
      v-model="formModel.password"
      type="text"
      class="input-field flex-1"
    />

    <button
      type="button"
      @click="generatePassword()"
      class="px-3 py-2 bg-[#026783] text-white rounded-lg"
    >
      Generate
    </button>
  </div>

  <p class="text-xs text-slate-500 mt-1">
    Give this password to the professor.
  </p>
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
