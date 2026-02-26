<script setup lang="ts" generic="T extends { id: number | string }">
import { computed } from 'vue'
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal } from 'lucide-vue-next'
import Table from '@/components/ui/Table.vue'
import TableBody from '@/components/ui/TableBody.vue'
import TableCell from '@/components/ui/TableCell.vue'
import TableHead from '@/components/ui/TableHead.vue'
import TableHeader from '@/components/ui/TableHeader.vue'
import TableRow from '@/components/ui/TableRow.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Column, TableSortConfig } from '@/types/table'

interface Props {
  columns: Column<T>[]
  data: T[]
  isLoading?: boolean
  selected?: (number | string)[]
  sortConfig?: TableSortConfig<T>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:selected': [value: (number | string)[]]
  'update:sortConfig': [value: TableSortConfig<T> | undefined]
  'action': [item: T]
}>()

const isAllSelected = computed(() => {
    if (props.data.length === 0) return false
    return props.data.every(item => props.selected?.map(String).includes(String(item.id)))
})

const isSomeSelected = computed(() => {
    if (isAllSelected.value) return false
    const selectedIds = props.selected?.map(String) || []
    return props.data.some(item => selectedIds.includes(String(item.id)))
})

const allSelectedModel = computed({
    get: () => isAllSelected.value ? true : (isSomeSelected.value ? 'indeterminate' : false),
    set: (val) => toggleSelectAll(val)
})

const toggleSelectAll = (checked: boolean | 'indeterminate') => {
    const currentSelected = [...(props.selected || [])]
    const currentPageIds = props.data.map(item => item.id)

    if (checked === true) {
        // 將當前頁面未選取的 ID 加入
        currentPageIds.forEach(id => {
            if (!currentSelected.map(String).includes(String(id))) {
                currentSelected.push(id)
            }
        })
    } else {
        // 將當前頁面的 ID 從選取清單中移除
        const stringPageIds = currentPageIds.map(String)
        const newSelected = currentSelected.filter(id => !stringPageIds.includes(String(id)))
        emit('update:selected', newSelected)
        return
    }
    emit('update:selected', currentSelected)
}

const toggleSelectOne = (id: number | string, checked: boolean | 'indeterminate') => {
    const currentSelected = [...(props.selected || [])]
    if (checked === true) {
        if (!currentSelected.includes(id)) {
            currentSelected.push(id)
        }
    } else if (checked === false) {
        const index = currentSelected.indexOf(id)
        if (index !== -1) {
            currentSelected.splice(index, 1)
        }
    }
    emit('update:selected', currentSelected)
}

const handleSort = (column: Column<T>) => {
    if (!column.sortable || column.key === 'selection' || column.key === 'actions') return

    const key = column.key as keyof T
    const isSameKey = props.sortConfig?.key === key

    // 三態切換：未排序 → asc → desc → 未排序
    if (!isSameKey || props.sortConfig?.order === undefined) {
        emit('update:sortConfig', { key, order: 'asc' })
    } else if (props.sortConfig?.order === 'asc') {
        emit('update:sortConfig', { key, order: 'desc' })
    } else {
        // desc 就清除排序狀態
        emit('update:sortConfig', undefined)
    }
}
</script>

<template>
  <div class="rounded-lg border bg-card shadow-sm overflow-hidden relative">
    <Table>
      <TableHeader>
        <TableRow class="hover:bg-transparent">
          <template
            v-for="col in columns"
            :key="col.key"
          >
            <TableHead
              v-if="col.key === 'selection'"
              class="w-12 text-center"
            >
              <Checkbox v-model:model-value="allSelectedModel" />
            </TableHead>
            <TableHead
              v-else-if="col.key === 'actions'"
              class="text-right"
            >
              {{ col.label }}
            </TableHead>
            <TableHead
              v-else
              :class="col.class"
            >
              <div
                v-if="col.sortable"
                :class="[
                  'inline-flex items-center gap-1 cursor-pointer select-none hover:bg-accent hover:text-accent-foreground px-2 py-1 -ml-2 rounded-md transition-colors w-full',
                  col.class?.includes('text-right') ? 'justify-end' : ''
                ]"
                @click="handleSort(col)"
              >
                {{ col.label }}
                <!-- 排序圖示：動態切換三態 -->
                <template v-if="sortConfig?.key === col.key && sortConfig?.order === 'asc'">
                  <ArrowUp class="h-3 w-3 text-foreground" />
                </template>
                <template v-else-if="sortConfig?.key === col.key && sortConfig?.order === 'desc'">
                  <ArrowDown class="h-3 w-3 text-foreground" />
                </template>
                <template v-else>
                  <ArrowUpDown class="h-3 w-3 opacity-40" />
                </template>
              </div>
              <template v-else>
                {{ col.label }}
              </template>
            </TableHead>
          </template>
        </TableRow>
      </TableHeader>
      <TableBody>
        <template v-if="isLoading && data.length === 0">
          <TableRow
            v-for="i in 5"
            :key="i"
          >
            <TableCell
              v-for="col in columns"
              :key="col.key"
              :class="col.key === 'selection' ? 'w-12 text-center' : ''"
            >
              <Skeleton :class="col.key === 'selection' ? 'h-4 w-4 mx-auto' : 'h-6 w-full'" />
            </TableCell>
          </TableRow>
        </template>
        <template v-else-if="data.length === 0">
          <TableRow>
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center text-muted-foreground"
            >
              目前沒有資料。
            </TableCell>
          </TableRow>
        </template>
        <template v-else>
          <TableRow
            v-for="item in data"
            :key="item.id"
            :class="{ 'bg-muted/30': selected?.includes(item.id) }"
          >
            <template
              v-for="col in columns"
              :key="col.key"
            >
              <TableCell
                v-if="col.key === 'selection'"
                class="w-12 text-center"
              >
                <Checkbox
                  :model-value="selected?.includes(item.id)"
                  @update:model-value="(val: boolean | 'indeterminate') => toggleSelectOne(item.id, val)"
                />
              </TableCell>
              <TableCell
                v-else-if="col.key === 'actions'"
                class="text-right"
              >
                <slot
                  name="cell-actions"
                  :item="item"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                  >
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </slot>
              </TableCell>
              <TableCell
                v-else
                :class="col.class"
              >
                <slot
                  :name="`cell-${String(col.key)}`"
                  :item="item"
                  :value="item[col.key as keyof T]"
                >
                  {{ item[col.key as keyof T] }}
                </slot>
              </TableCell>
            </template>
          </TableRow>
        </template>
      </TableBody>
    </Table>

    <!-- Loading 遮罩 (當有資料但正在背景更新時) -->
    <div
      v-if="isLoading && data.length > 0"
      class="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-[1px]"
    >
      <div class="flex items-center gap-2 rounded-md bg-background px-4 py-2 shadow-sm border text-sm font-medium">
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
          class="h-4 w-4 animate-spin text-muted-foreground"
        ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        載入中...
      </div>
    </div>
  </div>
</template>
