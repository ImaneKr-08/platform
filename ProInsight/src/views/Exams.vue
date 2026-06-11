<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useExamsStore, type Exam } from '../stores/exams'
import { useClassroomsStore } from '../stores/classrooms'
import { useProfessorsStore } from '../stores/professors'
import { useMonitoringStore } from '../stores/monitoring'
import Modal from '../components/Modal.vue'
import { Plus, Edit2, Trash2, Play, AlertCircle, Clock, MapPin, UserCheck, CheckCircle, Activity } from 'lucide-vue-next'
import {api} from '../services/api'

const router = useRouter()
const examsStore = useExamsStore()
const classroomsStore = useClassroomsStore()
const professorsStore = useProfessorsStore()
const monitoringStore = useMonitoringStore()

// Modal states
const isFormModalOpen = ref(false)
const modalMode = ref<'add' | 'edit'>('add')
const errorMsg = ref('')

const formModel = ref<Omit<Exam, 'id' | 'status'>>({
  name: '',
  subject: '',
  classroomId: 0,
  classroomName: '',
  professorEmail: '',
  professorId: 0,
  professorName: '',
  date: '',
  startTime: '',
  endTime: ''
})

const editingExamId = ref<number | null>(null)

onMounted(() => {
  examsStore.initExams()
  classroomsStore.initClassrooms()
  professorsStore.initProfessors()
})

function openAddModal() {
  modalMode.value = 'add'
  errorMsg.value = ''
  
  // Set defaults
  formModel.value = {
    name: '',
    subject: '',
    classroomId: classroomsStore.classrooms[0]?.id || 0,
    classroomName: classroomsStore.classrooms[0]?.name || '',
    professorEmail: professorsStore.professors[0]?.email || '',
    professorId: professorsStore.professors[0]?.id || 0,
    professorName: professorsStore.professors[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '12:00'
  }
  
  isFormModalOpen.value = true
}

function openEditModal(exam: Exam) {
  modalMode.value = 'edit'
  editingExamId.value = exam.id
  errorMsg.value = ''
  
  formModel.value = {
    name: exam.name,
    subject: exam.subject,
    classroomId: exam.classroomId,
    classroomName: exam.classroomName,
    professorEmail: exam.professorEmail,
    professorId: exam.professorId,
    professorName: exam.professorName,
    date: exam.date,
    startTime: exam.startTime,
    endTime: exam.endTime
  }
  
  isFormModalOpen.value = true
}

async function handleSave() {
  if (!formModel.value.name || !formModel.value.subject || !formModel.value.date) {
    errorMsg.value = 'Name, subject, and date are required.'
    return
  }

  // Resolve classroom name
  const classroomObj = classroomsStore.classrooms.find(c => (c.id) === (formModel.value.classroomId))
  if (classroomObj) {
    formModel.value.classroomName = classroomObj.name
  }

  // Resolve professor name
  const profObj = professorsStore.professors.find(p => (p.id) === (formModel.value.professorId))
  if (profObj) {
    formModel.value.professorName = profObj.name
  }

  if (modalMode.value === 'add') {
  await examsStore.addExam({
    ...formModel.value,
    status: 'scheduled',
  })
} else if (editingExamId.value !== null) {
  await examsStore.updateExam(
    editingExamId.value,
    formModel.value,
  )
}

  isFormModalOpen.value = false
}

async function handleDelete(id: number) {
  if (confirm('Are you sure you want to delete this exam?')) {
    await examsStore.deleteExam(id)
  }
}

async function startExamSession(examId: number) {
  try {
    const response = await api.post(
      `/exams/${examId}/start`,
    )

    console.log(response.data)

    await examsStore.initExams()

    await monitoringStore.startMonitoring(
      examId,
    )

    router.push(`/monitoring/${examId}`)
  } catch (error: any) {
  console.log('STATUS:', error.response?.status)
  console.log('DATA:', error.response?.data)
}
}

async function stopExamSession() {
  const examId =
    monitoringStore.activeExamId

  if (examId == null) return

  await api.post(
    `/exams/${examId}/end`,
  )

  monitoringStore.stopMonitoring()

  await examsStore.initExams()
}
</script>

<template>
  <div class="space-y-6 select-none animate-fade-in">
    <!-- Header panel -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <p class="text-xs text-[var(--text-secondary)]">Schedule academic examination calendars, assign classrooms blueprints and proctoring professors.</p>
      </div>
      <button
        @click="openAddModal"
        class="flex items-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
      >
        <Plus class="h-4.5 w-4.5" />
        Schedule Exam
      </button>
    </div>

    <!-- Exam list grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="exam in examsStore.exams"
        :key="exam.id"
        class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs flex flex-col justify-between"
      >
        <div>
          <!-- Title & status banner -->
          <div class="flex justify-between items-start mb-3">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                  :class="{
                    'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400': exam.status === 'scheduled',
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 glow-red': exam.status === 'active',
                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400': exam.status === 'completed',
                  }">
              {{ exam.status.toUpperCase() }}
            </span>
            
            <div class="flex gap-1.5">
              <button
                @click="openEditModal(exam)"
                class="p-1 rounded text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/20 transition-all border border-transparent hover:border-sky-100 dark:hover:border-sky-900/30"
                title="Edit Exam"
              >
                <Edit2 class="h-3.5 w-3.5" />
              </button>
              <button
                @click="handleDelete(exam.id)"
                class="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
                title="Delete Exam"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <h4 class="text-sm font-bold text-[var(--text-primary)] truncate">{{ exam.name }}</h4>
          <p class="text-xs text-[var(--text-secondary)] mt-1.5 truncate">{{ exam.subject }}</p>

          <!-- Specifications list -->
          <div class="mt-4 pt-4 border-t border-[var(--border-color)] space-y-2.5">
            <p class="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
              <Clock class="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <span>{{ exam.date }} @ {{ exam.startTime }} - {{ exam.endTime }}</span>
            </p>
            
            <p class="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
              <MapPin class="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <span class="truncate">{{ exam.classroomName }}</span>
            </p>

            <p class="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
              <UserCheck class="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
              <span class="truncate">{{ exam.professorName }}</span>
            </p>
          </div>
        </div>

        <!-- Start or View Seating Map Actions -->
        <div class="mt-6">
          <button
            v-if="exam.status === 'scheduled'"
            @click="startExamSession(exam.id)"
            class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
          >
            <Play class="h-3 w-3 fill-current" />
            Initialize Exam Session
          </button>
          
          <button
            v-else-if="exam.status === 'active'"
            @click="router.push(`/monitoring/${exam.id}`)"
            class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs animate-pulse"
          >
            <Activity class="h-3.5 w-3.5 shrink-0" />
            Active: Open Monitor
          </button>

          <div
            v-else-if="exam.status === 'completed'"
            class="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] text-xs font-semibold rounded-lg border border-[var(--border-color)]"
          >
            <CheckCircle class="h-3.5 w-3.5 text-emerald-500" />
            Session Completed
          </div>
        </div>
      </div>

      <div v-if="examsStore.exams.length === 0" class="col-span-full bg-[var(--bg-secondary)] border border-[var(--border-color)] border-dashed p-12 rounded-xl flex flex-col items-center justify-center text-center">
        <AlertCircle class="h-8 w-8 text-[var(--text-muted)] mb-2" />
        <h4 class="text-sm font-semibold text-[var(--text-secondary)]">No examinations scheduled yet.</h4>
        <p class="text-xs text-[var(--text-muted)] mt-1.5">Configure classrooms and professors first, then schedule your first exam above.</p>
      </div>
    </div>

    <!-- Forms Modal drawer -->
    <Modal
      :show="isFormModalOpen"
      :title="modalMode === 'add' ? 'Schedule New Examination' : 'Modify Exam Settings'"
      @close="isFormModalOpen = false"
    >
      <div v-if="errorMsg" class="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/40 p-3 rounded-lg text-xs text-rose-600 dark:text-rose-400">
        <AlertCircle class="h-4.5 w-4.5 shrink-0 text-rose-500 mt-0.5" />
        <span>{{ errorMsg }}</span>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Exam Header Code</label>
            <input
              v-model="formModel.name"
              type="text"
              placeholder="e.g. Midterm Exam - CS101"
              class="input-field"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject Matter</label>
            <input
              v-model="formModel.subject"
              type="text"
              placeholder="e.g. Intro to Programming"
              class="input-field"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Assign Classroom Blueprint</label>
            <select
              v-model="formModel.classroomId"
              class="input-field"
            >
              <option v-for="room in classroomsStore.classrooms" :key="room.id" :value="room.id">{{ room.name }}</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Assign Proctor Professor</label>
            <select
              v-model="formModel.professorId"
              class="input-field"
            >
              <option v-for="prof in professorsStore.professors" :key="prof.id" :value="prof.id">{{ prof.name }} ({{ prof.department }})</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Session Date</label>
            <input
              v-model="formModel.date"
              type="date"
              class="input-field"
            />
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Start Time</label>
            <input
              v-model="formModel.startTime"
              type="time"
              class="input-field"
            />
          </div>
          
          <div>
            <label class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">End Time</label>
            <input
              v-model="formModel.endTime"
              type="time"
              class="input-field"
            />
          </div>
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
          {{ modalMode === 'add' ? 'Save Schedule' : 'Apply Changes' }}
        </button>
      </template>
    </Modal>
  </div>
</template>
