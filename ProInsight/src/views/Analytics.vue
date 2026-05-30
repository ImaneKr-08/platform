<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useExamsStore } from '../stores/exams'
import BaseChart from '../components/BaseChart.vue'
import { TrendingUp, Heart, AlertTriangle, HelpCircle } from 'lucide-vue-next'

const examsStore = useExamsStore()

onMounted(() => {
  examsStore.initExams()
})

// Analytics Mock data
const avgStressData = [34, 48, 22, 60, 41]
const avgStressLabels = ['Philosophy 10', 'Computer Sci', 'Math 1A', 'Astrophysics', 'Genetics II']

const stressDistData = [62, 26, 12]
const stressDistLabels = ['Low Stress (Baseline)', 'Medium Stress (Mild)', 'High Stress (At Risk)']

const heartRateTrendData = [72, 75, 78, 85, 94, 112, 105, 88, 80, 76]
const heartRateTrendLabels = ['10m', '20m', '30m', '40m', '50m', '60m', '70m', '80m', '90m', '100m']

const highStressEventsData = [4, 8, 15, 23, 10, 6]
const highStressEventsLabels = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
</script>

<template>
  <div class="space-y-8 select-none animate-fade-in">
    <!-- Quick stats header -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs">
        <h5 class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <TrendingUp class="h-4 w-4 text-[#026783]" />
          Average Stress Index
        </h5>
        <div class="flex items-baseline gap-2">
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">41.2%</p>
          <span class="text-xs font-semibold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">-2.4% vs last week</span>
        </div>
      </div>

      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs">
        <h5 class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Heart class="h-4 w-4 text-rose-500" />
          Average Heart Rate
        </h5>
        <div class="flex items-baseline gap-2">
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">82 BPM</p>
          <span class="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Normal Range</span>
        </div>
      </div>

      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs">
        <h5 class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AlertTriangle class="h-4 w-4 text-rose-500 animate-pulse" />
          Peak Risk Incident
        </h5>
        <div class="flex items-baseline gap-2">
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">18 events</p>
          <span class="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">During Midterm D</span>
        </div>
      </div>

      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-xs">
        <h5 class="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <HelpCircle class="h-4 w-4 text-indigo-500" />
          Hardware Uptime
        </h5>
        <div class="flex items-baseline gap-2">
          <p class="text-2xl font-bold tracking-tight text-[var(--text-primary)]">99.1%</p>
          <span class="text-xs font-semibold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-full">ESP32 Bluetooth Link</span>
        </div>
      </div>

    </div>

    <!-- Charts grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- Average Stress Per Exam -->
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
        <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-5">Average Stress level per Exam (%)</h4>
        <BaseChart
          type="bar"
          :data="avgStressData"
          :labels="avgStressLabels"
          color="#026783"
          suffix="%"
        />
      </div>

      <!-- Stress Distribution -->
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
        <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-5">Classroom Stress Distribution (%)</h4>
        <BaseChart
          type="bar"
          :data="stressDistData"
          :labels="stressDistLabels"
          color="#10B981"
          suffix="%"
        />
      </div>

      <!-- Heart Rate Trends -->
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
        <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-5">Heart Rate Telemetry Timeline (BPM)</h4>
        <BaseChart
          type="area"
          :data="heartRateTrendData"
          :labels="heartRateTrendLabels"
          color="#dc2626"
          suffix=" BPM"
        />
      </div>

      <!-- High Stress Events -->
      <div class="bg-[var(--bg-secondary)] border border-[var(--border-color)] p-5 rounded-xl shadow-sm">
        <h4 class="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-5">High Stress Alerts Count Timeline</h4>
        <BaseChart
          type="bar"
          :data="highStressEventsData"
          :labels="highStressEventsLabels"
          color="#F59E0B"
          suffix=" alerts"
        />
      </div>

    </div>
  </div>
</template>
