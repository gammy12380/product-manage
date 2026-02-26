<script setup lang="ts">
import { computed } from 'vue'
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationFirst,
    PaginationItem,
    PaginationLast,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface Props {
  total: number
  page: number
  pageSize: number
  pageSizeOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
    pageSizeOptions: () => [10, 20, 50]
})

const emit = defineEmits<{
  'update:page': [value: number]
  'update:pageSize': [value: number]
}>()

const pageSizeString = computed({
    get: () => props.pageSize.toString(),
    set: (val: string) => {
        emit('update:pageSize', parseInt(val))
        emit('update:page', 1)
    }
})

const startRange = computed(() => props.total === 0 ? 0 : ((props.page - 1) * props.pageSize) + 1)
const endRange = computed(() => Math.min(props.page * props.pageSize, props.total))

const handlePageChange = (p: number) => {
    if (p !== props.page) {
        emit('update:page', p)
    }
}
</script>

<template>
  <div class="flex items-center justify-between px-2 py-4">
    <!-- 左側顯示幾筆與選擇每頁筆數 -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground md:flex">
      <span>顯示 {{ startRange }}-{{ endRange }} / 共 {{ total }} 筆</span>
      <Select v-model="pageSizeString">
        <SelectTrigger class="h-8 w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="opt in pageSizeOptions"
            :key="opt"
            :value="opt.toString()"
          >
            {{ opt }}
          </SelectItem>
        </SelectContent>
      </Select>
      <span>筆/頁</span>
    </div>

    <!-- 右側 Shadcn Pagination -->
    <Pagination
      v-slot="{ page: activePage }"
      :total="total"
      :items-per-page="pageSize"
      :sibling-count="1"
      show-edges
      :page="props.page"
      class="mx-0 w-auto"
      @update:page="handlePageChange"
    >
      <PaginationContent v-slot="{ items }">
        <PaginationFirst />
        <PaginationPrevious />

        <template v-for="(item, index) in items">
          <PaginationItem
            v-if="item.type === 'page'"
            :key="index"
            :value="item.value"
            as-child
          >
            <Button
              class="w-9 h-9 p-0"
              :class="item.value === activePage ? 'hover:bg-accent hover:text-accent-foreground cursor-default' : ''"
              :variant="item.value === activePage ? 'default' : 'outline'"
            >
              {{ item.value }}
            </Button>
          </PaginationItem>

          <PaginationEllipsis
            v-else
            :key="item.type"
            :index="index"
          />
        </template>

        <PaginationNext />
        <PaginationLast />
      </PaginationContent>
    </Pagination>
  </div>
</template>
