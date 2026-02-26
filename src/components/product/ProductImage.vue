<script setup lang="ts">
import { ref } from 'vue'
import { ImageOff, ZoomIn, X } from 'lucide-vue-next'

const props = defineProps<{
    src?: string
    alt?: string
    size?: 'sm' | 'md' | 'lg'
}>()

const error = ref(false)
const lightboxOpen = ref(false)

const sizeClass: Record<string, string> = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
}

function openLightbox() {
    if (props.src && !error.value) {
        lightboxOpen.value = true
    }
}
</script>

<template>
  <!-- Thumbnail with zoom icon -->
  <div
    :class="['relative group shrink-0', sizeClass[props.size ?? 'sm']]"
  >
    <img
      v-if="props.src && !error"
      :src="props.src"
      :alt="props.alt ?? ''"
      :class="[
        sizeClass[props.size ?? 'sm'],
        'rounded object-cover border bg-muted cursor-zoom-in transition-opacity duration-150',
        'group-hover:opacity-70',
      ]"
      @error="error = true"
      @click="openLightbox"
    >
    <!-- Fallback -->
    <div
      v-else
      :class="[
        sizeClass[props.size ?? 'sm'],
        'rounded border bg-muted flex items-center justify-center text-muted-foreground',
      ]"
    >
      <ImageOff class="h-1/2 w-1/2" />
    </div>

    <!-- Zoom icon overlay -->
    <div
      v-if="props.src && !error"
      class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none"
    >
      <ZoomIn class="h-4 w-4 text-white drop-shadow-md" />
    </div>
  </div>

  <!-- Lightbox Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-100 flex items-center justify-center"
        @click.self="lightboxOpen = false"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/70 backdrop-blur-sm"
          @click="lightboxOpen = false"
        />
        <!-- Image container -->
        <div class="relative z-10 max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl">
          <img
            :src="props.src"
            :alt="props.alt ?? ''"
            class="block max-w-[80vw] max-h-[80vh] object-contain bg-background rounded-xl"
          >
          <!-- Close button -->
          <button
            class="
              absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/80
              flex items-center justify-center text-white transition-colors duration-150
            "
            @click="lightboxOpen = false"
          >
            <X class="h-4 w-4" />
          </button>
          <!-- Caption -->
          <div
            v-if="props.alt"
            class="
              absolute bottom-0 left-0 right-0 px-4 py-2
              bg-linear-to-t from-black/60 to-transparent text-white text-sm
            "
          >
            {{ props.alt }}
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
