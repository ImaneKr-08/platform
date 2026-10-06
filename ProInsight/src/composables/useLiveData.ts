import { watch, onMounted, onUnmounted, type WatchStopHandle } from 'vue'
import { useRoute, type RouteRecordNameGeneric } from 'vue-router'
import { useStudentsStore } from '../stores/students'
import { useProfessorsStore } from '../stores/professors'
import { useClassroomsStore } from '../stores/classrooms'
import { useExamsStore } from '../stores/exams'
import { useAuthStore } from '../stores/auth'

function refreshForRoute(routeName: RouteRecordNameGeneric | null | undefined) {
  const studentsStore = useStudentsStore()
  const professorsStore = useProfessorsStore()
  const classroomsStore = useClassroomsStore()
  const examsStore = useExamsStore()
   const authStore = useAuthStore()
  switch (routeName) {
    case 'Dashboard':
  studentsStore.initStudents()

  if (authStore.isAdmin) {
    professorsStore.initProfessors()
  }

  classroomsStore.initClassrooms()
  examsStore.initExams()
  break
    case 'Students':
      studentsStore.initStudents()
      break
    case 'Staffs':
      professorsStore.initProfessors()
      professorsStore.initTherapists()
      break
    case 'Classrooms':
    case 'QRCode':
      classroomsStore.initClassrooms()
      break
    case 'Exams':
    case 'LiveMonitoring':
    case 'Analytics':
      examsStore.initExams()
      break
    default:
      break
  }
}

/** Refetch page data on navigation and when the tab regains focus. */
export function useLiveData() {
  const route = useRoute()
  let stopRouteWatch: WatchStopHandle | null = null

  function refreshCurrentRoute() {
    refreshForRoute(route.name)
  }

  onMounted(() => {
    examsStoreBindSocket()
    refreshCurrentRoute()

    stopRouteWatch = watch(
      () => route.name,
      (name) => refreshForRoute(name),
    )

    window.addEventListener('focus', refreshCurrentRoute)
  })

  onUnmounted(() => {
    stopRouteWatch?.()
    window.removeEventListener('focus', refreshCurrentRoute)
  })
}

function examsStoreBindSocket() {
  const examsStore = useExamsStore()
  examsStore.bindSocketEvents()
}
