<script setup lang="ts">
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-vue-next'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  isLoading?: boolean
  maxWidth?: string
}

withDefaults(defineProps<Props>(), {
    confirmText: '確認',
    cancelText: '取消',
    confirmVariant: 'default',
    maxWidth: 'sm:max-w-lg',
    description: ''
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': []
  'cancel': []
}>()

const handleConfirm = () => {
    emit('confirm')
}

const handleCancel = () => {
    emit('update:open', false)
    emit('cancel')
}
</script>

<template>
  <Dialog
    :open="open"
    @update:open="(val) => emit('update:open', val)"
  >
    <DialogContent :class="maxWidth">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
        <p
          v-if="description"
          class="text-sm text-muted-foreground"
        >
          {{ description }}
        </p>
      </DialogHeader>

      <div class="py-4">
        <slot />
      </div>

      <DialogFooter>
        <Button
          variant="ghost"
          :disabled="isLoading"
          @click="handleCancel"
        >
          {{ cancelText }}
        </Button>
        <Button
          :variant="confirmVariant"
          :disabled="isLoading"
          @click="handleConfirm"
        >
          <Loader2
            v-if="isLoading"
            class="mr-2 h-4 w-4 animate-spin"
          />
          {{ confirmText }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
