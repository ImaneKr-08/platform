<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useClassroomsStore } from '../stores/classrooms'
import { QrCode, Download, Printer, Grid, AlertCircle } from 'lucide-vue-next'
import {api} from '../services/api'

const classroomsStore = useClassroomsStore()
const selectedRoomId = ref<number | string>('')

const API_URL = (import.meta as any).env.VITE_API_URL ||'http://localhost:3000'
onMounted( async () => {
  await classroomsStore.initClassrooms()
  if (classroomsStore.classrooms.length > 0) {
    selectedRoomId.value = classroomsStore.classrooms[0].id
  }
})

const activeRoom = computed(() => {
  return classroomsStore.classrooms.find(r => r.id === selectedRoomId.value) || null
})

const tables = computed(() => {
  if (!activeRoom.value) return []

  return [...activeRoom.value.tables]
    .sort((a, b) => a.id - b.id)
})

// Simulated QR download action
function downloadQR(tableId: number) {
  window.open(
    `${API_URL}/qr/download/${tableId}`,
    '_blank'
  )
}
// Print single ticket
function printQR(table: any) {
  const printWindow = window.open('', '_blank')

  if (!printWindow) return

  printWindow.document.write(`
    <html>
      <head>
        <title>Table ${table.id}</title>
        <style>
          body {
            font-family: sans-serif;
            text-align: center;
            padding: 40px;
          }

          img {
            width: 250px;
            height: 250px;
          }
        </style>
      </head>

      <body>
        <h2>ProctorInsight</h2>

        <img
          src="${API_URL}/qr/${table.id}"
        />

        <h3>Table ${table.id}</h3>

        <p>${activeRoom.value?.name}</p>

        <script>
          window.onload = () => {
            window.print()
            window.close()
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

  if (!printWindow || !activeRoom.value) return

  const ticketsHtml = tables.value
    .map(
      table => `
        <div class="ticket">
          <div class="logo">ProctorInsight</div>

          <img
            class="qr"
            src="${API_URL}/qr/${table.id}"
            alt="QR Table ${table.id}"
          />

          <div class="info">
            Table ${table.id}
          </div>

          <div class="sub">
            ${activeRoom.value?.name}
          </div>
        </div>
      `,
    )
    .join('')

  printWindow.document.write(`
    <html>
      <head>
        <title>
          QR Codes - ${activeRoom.value.name}
        </title>

        <style>
          body {
            font-family: system-ui, sans-serif;
            padding: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: center;
          }

          .ticket {
            width: 260px;
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            page-break-inside: avoid;
          }

          .logo {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }

          .qr {
            width: 180px;
            height: 180px;
            object-fit: contain;
            margin-bottom: 12px;
          }

          .info {
            font-weight: bold;
            margin-bottom: 4px;
          }

          .sub {
            color: gray;
            font-size: 12px;
          }

          @media print {
            body {
              padding: 0;
            }

            .ticket {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        ${ticketsHtml}

        <script>
          window.onload = () => {
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
        <h4 class="text-sm font-bold text-[var(--text-primary)] mb-4">Table Number: {{ table.id }}</h4>

        <!-- Vector QR Code -->
        <div class="bg-white p-4 rounded-lg border border-[var(--border-color)] shadow-inner mb-4 w-40 h-40 flex items-center justify-center">
         <img
  :src="`${API_URL}/qr/${table.id}`"
  class="w-full h-full object-contain"
  :alt="`QR Table ${table.id}`"
/>
        </div>

        <p class="text-[10px] text-[var(--text-muted)] select-all mb-5 truncate w-full text-center">
          proinsight://room/{{ selectedRoomId }}/table/{{ table.id }}
        </p>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-2 w-full pt-3 border-t border-[var(--border-color)]">
          <button
            @click="downloadQR(table.id)"
            class="flex items-center justify-center gap-1 py-1.5 border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] rounded-lg text-[10px] font-bold text-[var(--text-secondary)] transition-colors"
          >
            <Download class="h-3 w-3" />
            Download
          </button>
          
          <button
            @click="printQR(table.id)"
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
