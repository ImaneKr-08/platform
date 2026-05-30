<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { X } from 'lucide-vue-next'

interface Props {
  show: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  size: 'md'
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

// Close on escape key
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.show) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Toggle body scroll lock
watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs transition-opacity" @click="handleClose"></div>
        
        <!-- Modal Card -->
        <div 
          class="relative w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden z-10 transform transition-all duration-300 animate-in zoom-in-95"
          :class="sizeClasses[size]"
        >
          <!-- Header -->
          <div class="px-6 py-4 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 class="text-base sm:text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {{ title }}
            </h3>
            <button 
              @click="handleClose" 
              class="p-1 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border border-transparent hover:border-[var(--border-color)] transition-all"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 overflow-y-auto max-h-[75vh]">
            <slot></slot>
          </div>

          <!-- Footer (Optional slot) -->
          <div v-if="$slots.footer" class="px-6 py-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex justify-end gap-3">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
