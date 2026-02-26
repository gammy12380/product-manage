<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'

interface Option {
    label: string
    value: string
}

const props = defineProps<{
    modelValue?: string | undefined
    options: Option[]
    placeholder?: string
    className?: string
}>()

const emit = defineEmits<{
    'update:modelValue': [value: string | undefined]
}>()

const internalValue = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
})

const clear = () => {
    internalValue.value = undefined
}
</script>

<template>
  <div
    class="relative w-full"
    :class="className"
  >
    <Select v-model="internalValue">
      <SelectTrigger class="w-full">
        <SelectValue :placeholder="placeholder" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </SelectItem>
      </SelectContent>
    </Select>

    <button
      v-if="internalValue"
      class="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-background flex items-center justify-center text-muted-foreground hover:text-foreground h-4 w-4 rounded-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
      title="清除選擇"
      @click.stop="clear"
    >
      <X class="h-3.5 w-3.5" />
    </button>
  </div>
</template>
