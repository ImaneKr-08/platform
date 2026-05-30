<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClassroomsStore } from '../stores/classrooms'
import { QrCode, Download, Printer, Grid, AlertCircle } from 'lucide-vue-next'

const classroomsStore = useClassroomsStore()
const selectedRoomId = ref('')

onMounted(() => {
  classroomsStore.initClassrooms()
  if (classroomsStore.classrooms.length > 0) {
    selectedRoomId.value = classroomsStore.classrooms[0].id
  }
})

const activeRoom = computed(() => {
  return classroomsStore.classrooms.find(r => r.id === selectedRoomId.value) || null
})

const tables = computed(() => {
  if (!activeRoom.value) return []
  // Sort tables by code
  return [...activeRoom.value.tables].sort((a, b) => a.code.localeCompare(b.code))
})

// Simulated QR download action
function downloadQR(tableCode: string) {
  // Generate mock text content (which mobile app scans)
  const qrData = `proctorinsight://classroom/${selectedRoomId.value}/table/${tableCode}`
  
  // Create an SVG element programmatically to download
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="300" height="300">
      <rect width="100" height="100" fill="white"/>
      <!-- Position Detection Patterns (Finder Squares) -->
      <path d="M 5 5 h 20 v 20 h -20 z M 9 9 h 12 v 12 h -12 z" fill="#041627"/>
      <rect x="12" y="12" width="6" height="6" fill="#041627"/>
      
      <path d="M 75 5 h 20 v 20 h -20 z M 79 9 h 12 v 12 h -12 z" fill="#041627"/>
      <rect x="82" y="12" width="6" height="6" fill="#041627"/>
      
      <path d="M 5 75 h 20 v 20 h -20 z M 9 79 h 12 v 12 h -12 z" fill="#041627"/>
      <rect x="12" y="82" width="6" height="6" fill="#041627"/>
      
      <!-- Center Text Badge -->
      <rect x="35" y="42" width="30" height="16" rx="2" fill="#026783"/>
      <text x="50" y="52" font-family="monospace" font-size="8" fill="white" font-weight="bold" text-anchor="middle">${tableCode}</text>
      
      <!-- Random QR Noise Path -->
      <path d="M 30 10 h 5 v 5 h -5 z M 40 5 h 10 v 5 h -10 z M 55 15 h 5 v 10 h -5 z M 10 35 h 15 v 5 h -15 z M 35 30 h 5 v 5 h -5 z M 70 30 h 5 v 15 h -5 z M 80 40 h 10 v 5 h -10 z M 85 50 h 10 v 5 h -10 z M 15 65 h 5 v 5 h -5 z M 30 70 h 10 v 5 h -10 z M 45 80 h 15 v 5 h -15 z M 65 75 h 5 v 10 h -5 z M 75 75 h 10 v 5 h -10 z" fill="#041627"/>
    </svg>
  `
  
  const blob = new Blob([svgContent], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `QR_${activeRoom.value?.name.replace(/\s+/g, '_')}_${tableCode}.svg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Print single ticket
function printQR(tableCode: string) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Print QR - ${tableCode}</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            text-align: center;
            padding: 40px;
            color: #0f172a;
          }
          .ticket {
            border: 2px dashed #94a3b8;
            border-radius: 12px;
            padding: 30px;
            max-width: 320px;
            margin: 0 auto;
            background: white;
          }
          .logo {
            font-weight: 800;
            color: #026783;
            font-size: 18px;
            margin-bottom: 20px;
          }
          .qr {
            width: 200px;
            height: 200px;
            margin: 0 auto 20px;
          }
          .info {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .sub {
            font-size: 11px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="logo">ProctorInsight</div>
          <svg class="qr" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="white"/>
            <path d="M 5 5 h 20 v 20 h -20 z M 9 9 h 12 v 12 h -12 z" fill="#041627"/>
            <rect x="12" y="12" width="6" height="6" fill="#041627"/>
            <path d="M 75 5 h 20 v 20 h -20 z M 79 9 h 12 v 12 h -12 z" fill="#041627"/>
            <rect x="82" y="12" width="6" height="6" fill="#041627"/>
            <path d="M 5 75 h 20 v 20 h -20 z M 9 79 h 12 v 12 h -12 z" fill="#041627"/>
            <rect x="12" y="82" width="6" height="6" fill="#041627"/>
            <rect x="35" y="42" width="30" height="16" rx="2" fill="#026783"/>
            <text x="50" y="52" font-family="monospace" font-size="8" fill="white" font-weight="bold" text-anchor="middle">${tableCode}</text>
            <path d="M 30 10 h 5 v 5 h -5 z M 40 5 h 10 v 5 h -10 z M 55 15 h 5 v 10 h -5 z M 10 35 h 15 v 5 h -15 z M 35 30 h 5 v 5 h -5 z M 70 30 h 5 v 15 h -5 z M 80 40 h 10 v 5 h -10 z M 85 50 h 10 v 5 h -10 z M 15 65 h 5 v 5 h -5 z M 30 70 h 10 v 5 h -10 z M 45 80 h 15 v 5 h -15 z M 65 75 h 5 v 10 h -5 z M 75 75 h 10 v 5 h -10 z" fill="#041627"/>
          </svg>
          <div class="info">Table Number: ${tableCode}</div>
          <div class="sub">${activeRoom.value?.name}</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}

// Print all tickets in batch
function printAllQRs() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  let ticketsHtml = ''
  tables.value.forEach(table => {
    ticketsHtml += `
      <div class="ticket">
        <div class="logo">ProctorInsight</div>
        <svg class="qr" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="white"/>
          <path d="M 5 5 h 20 v 20 h -20 z M 9 9 h 12 v 12 h -12 z" fill="#041627"/>
          <rect x="12" y="12" width="6" height="6" fill="#041627"/>
          <path d="M 75 5 h 20 v 20 h -20 z M 79 9 h 12 v 12 h -12 z" fill="#041627"/>
          <rect x="82" y="12" width="6" height="6" fill="#041627"/>
          <path d="M 5 75 h 20 v 20 h -20 z M 9 79 h 12 v 12 h -12 z" fill="#041627"/>
          <rect x="12" y="82" width="6" height="6" fill="#041627"/>
          <rect x="35" y="42" width="30" height="16" rx="2" fill="#026783"/>
          <text x="50" y="52" font-family="monospace" font-size="8" fill="white" font-weight="bold" text-anchor="middle">${table.code}</text>
          <path d="M 30 10 h 5 v 5 h -5 z M 40 5 h 10 v 5 h -10 z M 55 15 h 5 v 10 h -5 z M 10 35 h 15 v 5 h -15 z M 35 30 h 5 v 5 h -5 z M 70 30 h 5 v 15 h -5 z M 80 40 h 10 v 5 h -10 z M 85 50 h 10 v 5 h -10 z M 15 65 h 5 v 5 h -5 z M 30 70 h 10 v 5 h -10 z M 45 80 h 15 v 5 h -15 z M 65 75 h 5 v 10 h -5 z M 75 75 h 10 v 5 h -10 z" fill="#041627"/>
        </svg>
        <div class="info">Table Number: ${table.code}</div>
        <div class="sub">${activeRoom.value?.name}</div>
      </div>
    `
  })

  printWindow.document.write(`
    <html>
      <head>
        <title>Batch Print QR Codes - ${activeRoom.value?.name}</title>
        <style>
          body {
            font-family: system-ui, sans-serif;
            padding: 20px;
            background: #f1f5f9;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }
          .ticket {
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            padding: 25px;
            width: 260px;
            background: white;
            text-align: center;
            page-break-inside: avoid;
          }
          .logo {
            font-weight: 800;
            color: #026783;
            font-size: 16px;
            margin-bottom: 15px;
          }
          .qr {
            width: 160px;
            height: 160px;
            margin: 0 auto 15px;
          }
          .info {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
          }
          .sub {
            font-size: 10px;
            color: #64748b;
          }
          @media print {
            body {
              background: transparent;
              padding: 0;
            }
            .ticket {
              border-color: #e2e8f0;
              margin-bottom: 20px;
            }
          }
        </style>
      </head>
      <body>
        ${ticketsHtml}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          }
        <\/script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
</script>

<template>
  <div class="space-y-6 select-none animate-fade-in">
    <!-- Filters Header -->
    <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-3 w-full md:w-auto">
        <Grid class="h-5 w-5 text-[#026783] shrink-0" />
        <select
          v-model="selectedRoomId"
          class="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#026783] font-medium w-full md:w-[260px]"
        >
          <option v-for="room in classroomsStore.classrooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
      </div>

      <button
        v-if="tables.length > 0"
        @click="printAllQRs"
        class="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#026783] hover:bg-[#0588ad] text-white text-xs font-bold rounded-lg transition-colors shadow-xs w-full md:w-auto"
      >
        <Printer class="h-4 w-4" />
        Print All Tickets ({{ tables.length }})
      </button>
    </div>

    <!-- QR Grid -->
    <div v-if="tables.length > 0" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div
        v-for="table in tables"
        :key="table.id"
        class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs flex flex-col items-center"
      >
        <!-- Table indicator -->
        <h4 class="text-sm font-bold text-[var(--text-primary)] mb-4">Table Number: {{ table.code }}</h4>

        <!-- Vector QR Code -->
        <div class="bg-white p-4 rounded-lg border border-[var(--border-color)] shadow-inner mb-4 w-40 h-40 flex items-center justify-center">
          <svg class="w-full h-full select-none" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="white"/>
            
            <!-- Finder Squares -->
            <path d="M 5 5 h 20 v 20 h -20 z M 9 9 h 12 v 12 h -12 z" fill="#041627"/>
            <rect x="12" y="12" width="6" height="6" fill="#041627"/>
            
            <path d="M 75 5 h 20 v 20 h -20 z M 79 9 h 12 v 12 h -12 z" fill="#041627"/>
            <rect x="82" y="12" width="6" height="6" fill="#041627"/>
            
            <path d="M 5 75 h 20 v 20 h -20 z M 9 79 h 12 v 12 h -12 z" fill="#041627"/>
            <rect x="12" y="82" width="6" height="6" fill="#041627"/>
            
            <!-- Center Code Badge -->
            <rect x="35" y="42" width="30" height="16" rx="2" fill="#026783"/>
            <text x="50" y="52" font-family="monospace" font-size="8" fill="white" font-weight="bold" text-anchor="middle">{{ table.code }}</text>
            
            <!-- Random bits -->
            <path d="M 30 10 h 5 v 5 h -5 z M 40 5 h 10 v 5 h -10 z M 55 15 h 5 v 10 h -5 z M 10 35 h 15 v 5 h -15 z M 35 30 h 5 v 5 h -5 z M 70 30 h 5 v 15 h -5 z M 80 40 h 10 v 5 h -10 z M 85 50 h 10 v 5 h -10 z M 15 65 h 5 v 5 h -5 z M 30 70 h 10 v 5 h -10 z M 45 80 h 15 v 5 h -15 z M 65 75 h 5 v 10 h -5 z M 75 75 h 10 v 5 h -10 z" fill="#041627"/>
          </svg>
        </div>

        <p class="text-[10px] text-[var(--text-muted)] select-all mb-5 truncate w-full text-center">
          proinsight://room/{{ selectedRoomId }}/table/{{ table.code }}
        </p>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-2 w-full pt-3 border-t border-[var(--border-color)]">
          <button
            @click="downloadQR(table.code)"
            class="flex items-center justify-center gap-1 py-1.5 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded-lg text-[10px] font-bold text-[var(--text-secondary)] transition-colors"
          >
            <Download class="h-3 w-3" />
            Download
          </button>
          
          <button
            @click="printQR(table.code)"
            class="flex items-center justify-center gap-1 py-1.5 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded-lg text-[10px] font-bold text-[var(--text-secondary)] transition-colors"
          >
            <Printer class="h-3 w-3" />
            Print
          </button>
        </div>
      </div>
    </div>

    <!-- Empty room state -->
    <div v-else class="bg-[var(--bg-secondary)] border border-[var(--border-color)] border-dashed p-12 rounded-xl flex flex-col items-center justify-center text-center">
      <AlertCircle class="h-8 w-8 text-[var(--text-muted)] mb-2" />
      <h4 class="text-sm font-semibold text-[var(--text-secondary)]">No tables configured in this classroom.</h4>
      <p class="text-xs text-[var(--text-muted)] mt-1.5">You can add tables to this classroom under the Classrooms page designer.</p>
    </div>

  </div>
</template>
