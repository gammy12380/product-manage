<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'

defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)

const triggerFileInput = () => {
    fileInputRef.value?.click()
}

const handleImageUpload = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
        alert('圖片大小不能超過 2MB')
        return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        emit('update:modelValue', e.target?.result as string)
    }
    reader.readAsDataURL(file)
}

const handleRemove = () => {
    emit('update:modelValue', '')
    if (fileInputRef.value) {
        fileInputRef.value.value = ''
    }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-if="modelValue"
      class="relative w-32 h-32 rounded-md overflow-hidden border group"
    >
      <img
        :src="modelValue"
        class="w-full h-full object-cover"
        alt="Preview"
      >
      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <Button
          type="button"
          variant="destructive"
          size="sm"
          @click="handleRemove"
        >
          移除
        </Button>
      </div>
    </div>
    <div v-else>
      <div
        class="w-32 h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors text-muted-foreground"
        @click="triggerFileInput"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-image-plus mb-2"
        ><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><line
          x1="16"
          x2="22"
          y1="5"
          y2="5"
        /><line
          x1="19"
          x2="19"
          y1="2"
          y2="8"
        /><circle
          cx="9"
          cy="9"
          r="2"
        /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
        <span class="text-xs">點擊上傳</span>
      </div>
    </div>
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleImageUpload"
    >
  </div>
</template>
