<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'

interface Props {
  type?: 'area' | 'bar'
  data: number[]
  labels: string[]
  color?: string
  height?: number
  prefix?: string
  suffix?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'area',
  color: '#026783',
  height: 200,
  prefix: '',
  suffix: ''
})

const containerRef = ref<HTMLDivElement | null>(null)
const width = ref(400)
const activeIndex = ref<number | null>(null)

// Track resize
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  if (containerRef.value) {
    width.value = containerRef.value.clientWidth
    
    resizeObserver = new ResizeObserver((entries) => {
      if (entries && entries[0]) {
        width.value = entries[0].contentRect.width || containerRef.value?.clientWidth || 400
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const padding = { top: 20, right: 10, bottom: 30, left: 40 }

const maxValue = computed(() => {
  const max = Math.max(...props.data, 10)
  // Round up to nearest nice interval
  return Math.ceil(max / 10) * 10
})

const chartWidth = computed(() => Math.max(width.value - padding.left - padding.right, 50))
const chartHeight = computed(() => Math.max(props.height - padding.top - padding.bottom, 50))

// Area points path
const points = computed(() => {
  if (props.data.length === 0) return []
  return props.data.map((val, idx) => {
    const x = padding.left + (idx / (props.data.length - 1)) * chartWidth.value
    const y = padding.top + chartHeight.value - (val / maxValue.value) * chartHeight.value
    return { x, y, value: val, label: props.labels[idx] }
  })
})

const pathD = computed(() => {
  if (points.value.length === 0) return ''
  return points.value.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`
  }, '')
})

const areaPathD = computed(() => {
  if (points.value.length === 0) return ''
  const startX = points.value[0].x
  const endX = points.value[points.value.length - 1].x
  const bottomY = padding.top + chartHeight.value
  return `${pathD.value} L ${endX} ${bottomY} L ${startX} ${bottomY} Z`
})

// Bar geometries
const bars = computed(() => {
  if (props.data.length === 0) return []
  const barSpacing = chartWidth.value / props.data.length
  const barWidth = Math.max(barSpacing * 0.6, 6)
  
  return props.data.map((val, idx) => {
    const w = barWidth
    const h = (val / maxValue.value) * chartHeight.value
    const x = padding.left + idx * barSpacing + (barSpacing - barWidth) / 2
    const y = padding.top + chartHeight.value - h
    return { x, y, w, h, value: val, label: props.labels[idx] }
  })
})

// Grid lines
const yGridLines = computed(() => {
  const lines = 4
  const grid: { y: number; val: number }[] = []
  for (let i = 0; i <= lines; i++) {
    const val = (maxValue.value / lines) * i
    const y = padding.top + chartHeight.value - (val / maxValue.value) * chartHeight.value
    grid.push({ y, val })
  }
  return grid
})

const activePoint = computed(() => {
  if (activeIndex.value === null) return null
  if (props.type === 'area') {
    return points.value[activeIndex.value] || null
  } else {
    return bars.value[activeIndex.value] || null
  }
})

function handleMouseMove(e: MouseEvent) {
  if (!containerRef.value || props.data.length === 0) return
  const rect = containerRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left - padding.left
  
  if (props.type === 'area') {
    const segmentWidth = chartWidth.value / (props.data.length - 1)
    let idx = Math.round(mouseX / segmentWidth)
    idx = Math.max(0, Math.min(idx, props.data.length - 1))
    activeIndex.value = idx
  } else {
    const segmentWidth = chartWidth.value / props.data.length
    let idx = Math.floor(mouseX / segmentWidth)
    idx = Math.max(0, Math.min(idx, props.data.length - 1))
    activeIndex.value = idx
  }
}

function handleMouseLeave() {
  activeIndex.value = null
}
</script>

<template>
  <div ref="containerRef" class="w-full relative select-none" :style="{ height: `${height}px` }">
    <!-- Overlay Tooltip -->
    <div
      v-if="activePoint"
      class="absolute z-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs px-2.5 py-1.5 rounded shadow-lg pointer-events-none transition-all duration-75 flex flex-col font-medium border border-slate-800 dark:border-slate-100"
      :style="{
        left: `${Math.min(Math.max(activePoint.x - 60, 5), width - 130)}px`,
        top: `${Math.max(activePoint.y - 50, 0)}px`
      }"
    >
      <span class="text-[10px] opacity-70 leading-none">{{ activePoint.label }}</span>
      <span class="font-bold leading-tight mt-0.5">{{ prefix }}{{ activePoint.value }}{{ suffix }}</span>
    </div>

    <!-- Chart Canvas -->
    <svg
      :width="width"
      :height="height"
      class="overflow-visible"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    >
      <defs>
        <!-- Fade Area Gradient -->
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3" />
          <stop offset="100%" :stop-color="color" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Y Grid Lines -->
      <g>
        <line
          v-for="line in yGridLines"
          :key="line.val"
          :x1="padding.left"
          :y1="line.y"
          :x2="padding.left + chartWidth"
          :y2="line.y"
          stroke="var(--border-color)"
          stroke-width="1"
          stroke-dasharray="3 3"
        />
        <!-- Y Grid Labels -->
        <text
          v-for="line in yGridLines"
          :key="'lbl-' + line.val"
          :x="padding.left - 10"
          :y="line.y + 4"
          text-anchor="end"
          class="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
        >
          {{ line.val }}
        </text>
      </g>

      <!-- Area Chart Render -->
      <g v-if="type === 'area'">
        <!-- Path Area -->
        <path :d="areaPathD" fill="url(#areaGrad)" />
        
        <!-- Path Line -->
        <path
          :d="pathD"
          fill="none"
          :stroke="color"
          stroke-width="2.5"
          stroke-linecap="round"
          class="transition-all duration-300"
        />

        <!-- Active vertical rule -->
        <line
          v-if="activePoint"
          :x1="activePoint.x"
          :y1="padding.top"
          :x2="activePoint.x"
          :y2="padding.top + chartHeight"
          stroke="var(--text-muted)"
          stroke-width="1"
          stroke-dasharray="2 2"
        />

        <!-- Draw circles on points -->
        <circle
          v-for="(pt, idx) in points"
          :key="'circle-' + idx"
          :cx="pt.x"
          :cy="pt.y"
          :r="activeIndex === idx ? 5 : 2.5"
          :fill="activeIndex === idx ? color : 'var(--bg-secondary)'"
          :stroke="color"
          stroke-width="2"
          class="cursor-pointer transition-all duration-100"
        />
      </g>

      <!-- Bar Chart Render -->
      <g v-else-if="type === 'bar'">
        <!-- Bars -->
        <rect
          v-for="(b, idx) in bars"
          :key="'bar-' + idx"
          :x="b.x"
          :y="b.y"
          :width="b.w"
          :height="b.h"
          :fill="activeIndex === idx ? `${color}e0` : color"
          rx="3"
          class="transition-all duration-150 cursor-pointer"
        />
      </g>

      <!-- X Axis Labels (sample selection to avoid overcrowding) -->
      <g>
        <line
          :x1="padding.left"
          :y1="padding.top + chartHeight"
          :x2="padding.left + chartWidth"
          :y2="padding.top + chartHeight"
          stroke="var(--border-color)"
          stroke-width="1.5"
        />
        <text
          v-for="(lbl, idx) in labels"
          :key="'x-lbl-' + idx"
          v-show="labels.length < 10 || idx % Math.ceil(labels.length / 6) === 0 || idx === labels.length - 1"
          :x="type === 'area' 
            ? padding.left + (idx / (labels.length - 1)) * chartWidth 
            : padding.left + (idx / labels.length) * chartWidth + (chartWidth / labels.length) / 2"
          :y="height - 8"
          text-anchor="middle"
          class="text-[10px] fill-slate-400 dark:fill-slate-500 font-sans font-medium"
        >
          {{ lbl }}
        </text>
      </g>
    </svg>
  </div>
</template>
