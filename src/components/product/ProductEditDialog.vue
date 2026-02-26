<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from '@/components/ui/form'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import type { Product } from '@/types/product'
import ImageUpload from '@/components/common/ImageUpload.vue'

interface Props {
  open: boolean
  product: Product | null
  isLoading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'confirm': [product: Product]
}>()

const isNew = computed(() => {
    return !props.product || props.product.id > 1700000000000
})

// Zod 驗證規則定義
const formSchema = toTypedSchema(z.object({
    name: z.string().min(1, '商品名稱為必填'),
    category: z.enum(['electronics', 'clothing', 'books'], { required_error: '請選擇分類' }),
    price: z.coerce.number({ required_error: '定價為必填元件', invalid_type_error: '定價必須為數字' }).gt(0, '定價必須大於 0'),
    stock: z.coerce.number({ required_error: '庫存為必填', invalid_type_error: '庫存必須為數字' }).min(0, '庫存不可小於 0'),
    status: z.enum(['active', 'inactive'])
}))

// 初始化 VeeValidate 表單
const form = useForm({
    validationSchema: formSchema,
    initialValues: {
        name: '',
        category: 'electronics' as Product['category'],
        price: 0,
        stock: 0,
        status: 'active' as Product['status']
    }
})

// 獨立管理圖片狀態（不透過 VeeValidate）
const imagePreview = ref('')

// 當傳入的 product 變更時，重設表單數值
watch(() => props.product, (newVal) => {
    if (newVal) {
        form.setValues({
            name: newVal.name,
            category: newVal.category,
            price: newVal.price,
            stock: newVal.stock,
            status: newVal.status
        })
        imagePreview.value = newVal.image || ''
    } else {
        form.resetForm()
        imagePreview.value = ''
    }
}, { immediate: true })

// 成功通過驗證的送出回呼
const onSubmit = form.handleSubmit((values) => {
    emit('confirm', {
        id: props.product?.id || Date.now(),
        image: imagePreview.value,
        sales: props.product?.sales || 0,
        createdAt: props.product?.createdAt || new Date().toISOString(),
        name: values.name,
        category: values.category as Product['category'],
        price: values.price,
        stock: values.stock,
        status: values.status as Product['status']
    })
})

const handleConfirm = () => {
    onSubmit()
}
</script>

<template>
  <BaseDialog
    :open="open"
    :title="isNew ? '新增商品' : '編輯商品資訊'"
    :is-loading="isLoading"
    @update:open="(val) => { emit('update:open', val); if(!val) form.resetForm() }"
    @confirm="handleConfirm"
  >
    <form
      class="grid gap-4 py-4"
      @submit.prevent
    >
      <!-- 圖片上傳區域 -->
      <div class="grid grid-cols-[80px_1fr] items-start gap-x-4">
        <label class="text-sm font-medium leading-none text-left pt-2.5">
          商品圖片
        </label>
        <ImageUpload v-model="imagePreview" />
      </div>

      <FormField
        v-slot="{ componentField }"
        name="name"
      >
        <FormItem class="grid grid-cols-[80px_1fr] items-start gap-x-4 space-y-0">
          <FormLabel class="text-left pt-2.5">
            商品名稱
          </FormLabel>
          <div class="space-y-1 w-full">
            <FormControl>
              <Input v-bind="componentField" />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      </FormField>

      <FormField
        v-slot="{ componentField }"
        name="category"
      >
        <FormItem class="grid grid-cols-[80px_1fr] items-start gap-x-4 space-y-0">
          <FormLabel class="text-left pt-2.5">
            分類
          </FormLabel>
          <div class="space-y-1 w-full">
            <Select v-bind="componentField">
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="electronics">
                  電子產品
                </SelectItem>
                <SelectItem value="clothing">
                  服飾配件
                </SelectItem>
                <SelectItem value="books">
                  書籍/教育
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </div>
        </FormItem>
      </FormField>

      <FormField
        v-slot="{ componentField }"
        name="price"
      >
        <FormItem class="grid grid-cols-[80px_1fr] items-start gap-x-4 space-y-0">
          <FormLabel class="text-left pt-2.5">
            定價
          </FormLabel>
          <div class="space-y-1 w-full">
            <FormControl>
              <Input
                type="number"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      </FormField>

      <FormField
        v-slot="{ componentField }"
        name="stock"
      >
        <FormItem class="grid grid-cols-[80px_1fr] items-start gap-x-4 space-y-0">
          <FormLabel class="text-left pt-2.5">
            庫存量
          </FormLabel>
          <div class="space-y-1 w-full">
            <FormControl>
              <Input
                type="number"
                v-bind="componentField"
              />
            </FormControl>
            <FormMessage />
          </div>
        </FormItem>
      </FormField>

      <FormField
        v-slot="{ componentField }"
        name="status"
      >
        <FormItem class="grid grid-cols-[80px_1fr] items-start gap-x-4 space-y-0">
          <FormLabel class="text-left pt-2.5">
            商品狀態
          </FormLabel>
          <div class="space-y-1 w-full pt-1.5">
            <FormControl>
              <RadioGroup
                v-bind="componentField"
                class="flex items-center gap-4"
              >
                <FormItem class="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="active" />
                  </FormControl>
                  <FormLabel class="font-normal cursor-pointer">
                    上架
                  </FormLabel>
                </FormItem>
                <FormItem class="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="inactive" />
                  </FormControl>
                  <FormLabel class="font-normal cursor-pointer">
                    下架
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
          </div>
        </FormItem>
      </FormField>
    </form>
  </BaseDialog>
</template>
