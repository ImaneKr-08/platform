<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProfessorsStore, type Professor, type Therapist } from '../stores/professors'
import Modal from '../components/Modal.vue'
import { Plus, Search, Edit2, Trash2, AlertCircle } from 'lucide-vue-next'

const professorsStore = useProfessorsStore()

// State
const searchQuery = ref('')
const staffType = ref<'professor' | 'therapist'>('professor')
const isFormModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const errorMsg = ref('')
const successMsg = ref('')
const isSubmitting = ref(false)

const formModel = ref<Professor>({
  name: '',
  email: '',
  id: 0,
  password: ''
})

onMounted(async () => {
  await Promise.all([
    professorsStore.initProfessors(),
    professorsStore.initTherapists()
  ])
})

// Filtering
const filteredStaff = computed(() => {
  const list = staffType.value === 'professor' ? professorsStore.professors : professorsStore.therapists
  return list.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    return matchesSearch
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
    id: 0
  }
  generatePassword()
  errorMsg.value = ''
  successMsg.value = ''
  isSubmitting.value = false
  isFormModalOpen.value = true
}

function openEditModal(prof: Professor) {
  modalMode.value = 'edit'
  formModel.value = { ...prof }
  errorMsg.value = ''
  successMsg.value = ''
  isSubmitting.value = false
  isFormModalOpen.value = true
}

async function handleSave() {
  if (
    !formModel.value.name?.trim() ||
    !formModel.value.email?.trim() ||
    (modalMode.value === 'add' && !formModel.value.password?.trim())
  ) {
    errorMsg.value = 'All fields are required. Please fill them all.'
    return
  }

  errorMsg.value = ''
  successMsg.value = ''
  isSubmitting.value = true

  try {
    let result

    if (modalMode.value === 'add') {
      const { id, ...staffData } = formModel.value
      if (staffType.value === 'professor') {
        result = await professorsStore.addProfessor(staffData)
      } else {
        result = await professorsStore.addTherapist(staffData)
      }
    } else {
      // Editing only supported for professors
      result = await professorsStore.updateProfessor(
        formModel.value.id,
        formModel.value
      )
    }

    if (result.success) {
      successMsg.value = modalMode.value === 'add' ? 'Created successfully!' : 'Updated successfully!'
      setTimeout(() => {
        isFormModalOpen.value = false
      }, 1500)
    } else {
      errorMsg.value = result.message || 'Operation failed.'
    }
  } finally {
    isSubmitting.value = false
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
        <p class="text-xs text-[var(--text-secondary)]">
          Create and manage academic proctors and therapists accounts authorized on the platform.
        </p>
      </div>
      <button
        @click="openAddModal"
        class="flex items-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-sm font-semibold rounded-lg shadow-sm transition-all active:scale-98"
      >
        <Plus class="h-4.5 w-4.5" />
        Add {{ staffType === 'professor' ? 'Professor' : 'Therapist' }}
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
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-[var(--text-secondary)]">Staff Category:</span>
          <select
            v-model="staffType"
            class="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#026783] min-w-[150px]"
          >
            <option value="professor">Professors</option>
            <option value="therapist">Therapists</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse text-sm">
          <thead>
            <tr class="bg-[var(--bg-primary)] text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">
                {{ staffType === 'professor' ? 'Professor Name' : 'Therapist Name' }}
              </th>
              <th class="px-6 py-3 font-semibold text-xs uppercase tracking-wider">Email Address</th>
              <th v-if="staffType === 'professor'" class="px-6 py-3 font-semibold text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-color)]">
            <tr v-for="item in filteredStaff" :key="item.id" class="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
              <td class="px-6 py-4 font-semibold text-[var(--text-primary)]">
                {{ item.name }}
              </td>
              <td class="px-6 py-4 text-slate-500 font-mono text-xs">
                {{ item.email }}
              </td>

              <td v-if="staffType === 'professor'" class="px-6 py-4 text-right">
                <div class="flex justify-end gap-2">
                  <button
                    @click="openEditModal(item)"
                    class="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all border border-transparent hover:border-sky-100 dark:hover:border-sky-900/30"
                    title="Edit Professor"
                  >
                    <Edit2 class="h-4 w-4" />
                  </button>
                  <button
                    @click="handleDelete(item.id)"
                    class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                    title="Delete Professor"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredStaff.length === 0">
              <td colspan="4" class="px-6 py-12 text-center text-[var(--text-muted)]">
                No {{ staffType === 'professor' ? 'professors' : 'therapists' }} found matching criteria.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Modal
      :show="isFormModalOpen"
      :title="modalMode === 'add' ? (staffType === 'professor' ? 'Add Professor Account' : 'Add Therapist Account') : 'Edit Professor Details'"
      @close="isFormModalOpen = false"
    >
      <div v-if="errorMsg" class="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 p-3 rounded-lg text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle class="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMsg }}</span>
      </div>

      <div v-if="successMsg" class="mb-4 flex items-start gap-2 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/40 p-3 rounded-lg text-xs text-emerald-600 dark:text-emerald-400">
        <svg class="h-4.5 w-4.5 shrink-0 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>{{ successMsg }}</span>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
          <input
            v-model="formModel.name"
            type="text"
            placeholder="Name"
            class="input-field"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
          <input
            v-model="formModel.email"
            type="email"
            placeholder="email@proinsight.edu"
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
            Give this password to the new staff member.
          </p>
        </div> 
      </div>

      <template #footer>
        <button
          @click="isFormModalOpen = false"
          :disabled="isSubmitting"
          class="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          @click="handleSave"
          :disabled="isSubmitting"
          class="px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
        >
          <svg v-if="isSubmitting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="isSubmitting">Waiting...</span>
          <span v-else>{{ modalMode === 'add' ? 'Save Record' : 'Apply Changes' }}</span>
        </button>
      </template>
    </Modal>
  </div>
</template>
