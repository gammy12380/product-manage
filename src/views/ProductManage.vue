<script setup lang="ts">
import {
    Search,
    Plus,
    MoreVertical
} from 'lucide-vue-next'

// UI Components
import Badge from '@/components/ui/Badge.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import SingleSelect from '@/components/common/SingleSelect.vue'
import DataTable from '@/components/common/DataTable.vue'
import Pagination from '@/components/common/Pagination.vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ProductEditDialog from '@/components/product/ProductEditDialog.vue'
import ProductImage from '@/components/product/ProductImage.vue'

import { useProductManage } from '@/composable/useProductManage'

const {
    // 選項
    categoryOptions,
    stockStatusOptions,
    statusOptions,
    columns,
    // 分頁 & 選取
    selectedProducts,
    currentPage,
    pageSize,
    // 篩選
    productFilters,
    searchInput,
    minPriceInput,
    maxPriceInput,
    // 排序
    sortState,
    // API 資料
    products,
    totalProducts,
    isLoading,
    // Badge Helpers
    getStatusBadge,
    getStockBadge,
    getCategoryLabel,
    // 對話框狀態
    editDialogOpen,
    deleteDialogOpen,
    bulkDeleteDialogOpen,
    bulkStatusDialogOpen,
    pendingBulkStatus,
    targetProduct,
    isSaving,
    // Actions
    openCreate,
    openEdit,
    openDelete,
    confirmDelete,
    handleProductSave,
    handleBulkUpdate,
    confirmBulkUpdate,
    handleBulkDelete,
    confirmBulkDelete,
    resetFilters,
} = useProductManage()
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-background min-h-screen">
    <!-- Dialogs -->
    <ProductEditDialog
      v-model:open="editDialogOpen"
      :product="targetProduct"
      :is-loading="isSaving"
      @confirm="handleProductSave"
    />

    <BaseDialog
      v-model:open="deleteDialogOpen"
      :title="`確定要刪除「${targetProduct?.name}」嗎？`"
      description="此操作無法復原，商品將永久從庫存中移除。"
      confirm-variant="destructive"
      confirm-text="確認刪除"
      :is-loading="isSaving"
      @confirm="confirmDelete"
    />

    <!-- 批量上/下架確認視窗 -->
    <BaseDialog
      v-model:open="bulkStatusDialogOpen"
      :title="`確定要批量${pendingBulkStatus === 'active' ? '上架' : '下架'}選定的 ${selectedProducts.length} 項商品嗎？`"
      :description="pendingBulkStatus === 'active' ? '這些商品將被設為上架中狀態，將對客戶可見。' : '這些商品將被設為已下架狀態，將對客戶隱藏。'"
      :confirm-text="pendingBulkStatus === 'active' ? '確認上架' : '確認下架'"
      :is-loading="isSaving"
      @confirm="confirmBulkUpdate"
    />

    <BaseDialog
      v-model:open="bulkDeleteDialogOpen"
      :title="`確定要刪除選定的 ${selectedProducts.length} 項商品嗎？`"
      description="此操作無法復原，選取的商品將永久從庫存中移除。"
      confirm-variant="destructive"
      confirm-text="確認批量刪除"
      :is-loading="isSaving"
      @confirm="confirmBulkDelete"
    />

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-3xl font-bold tracking-tight text-foreground">
          商品管理
        </h2>
        <p class="text-muted-foreground text-sm">
          商品庫存、調整價格與追蹤銷量數據。
        </p>
      </div>
      <div class="flex gap-2">
        <Button @click="openCreate()">
          <Plus class="mr-2 h-4 w-4" /> 新增商品
        </Button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative w-full md:w-64">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchInput"
          placeholder="搜尋商品名稱..."
          class="pl-8 h-9"
        />
      </div>

      <SingleSelect
        v-model="productFilters.category"
        :options="categoryOptions"
        placeholder="所有分類"
        class-name="w-full md:w-fit h-9"
        @update:model-value="currentPage = 1"
      />

      <SingleSelect
        v-model="productFilters.stockStatus"
        :options="stockStatusOptions"
        placeholder="庫存狀態"
        class-name="w-full md:w-fit h-9"
        @update:model-value="currentPage = 1"
      />

      <SingleSelect
        v-model="productFilters.status"
        :options="statusOptions"
        placeholder="上架狀態"
        class-name="w-full md:w-fit h-9"
        @update:model-value="currentPage = 1"
      />

      <!-- 價格區間篩選 -->
      <div class="flex items-center gap-2">
        <Input
          v-model.number="minPriceInput"
          type="number"
          min="0"
          placeholder="最低價格"
          class="w-24 h-9"
        />
        <span class="text-muted-foreground">-</span>
        <Input
          v-model.number="maxPriceInput"
          type="number"
          min="0"
          placeholder="最高價格"
          class="w-24 h-9"
        />
      </div>

      <Button
        variant="ghost"
        size="sm"
        class="h-9 px-3"
        @click="resetFilters"
      >
        重設篩選
      </Button>
    </div>

    <!-- Bulk Actions -->
    <div
      class="flex items-center gap-4 rounded-lg bg-accent/50 p-2 border transition-colors h-12"
    >
      <span class="text-xs font-semibold ml-2 text-muted-foreground">
        <template v-if="selectedProducts.length > 0">
          已選 <span class="text-foreground">{{ selectedProducts.length }}</span> 項商品
        </template>
        <template v-else>
          勾選商品以執行批量操作
        </template>
      </span>
      <div class="ml-auto flex gap-2">
        <Button
          size="sm"
          :disabled="selectedProducts.length === 0 || isSaving"
          @click="handleBulkUpdate('active')"
        >
          批量上架
        </Button>
        <Button
          variant="outline"
          size="sm"
          :disabled="selectedProducts.length === 0 || isSaving"
          @click="handleBulkUpdate('inactive')"
        >
          批量下架
        </Button>
        <Button
          variant="destructive"
          size="sm"
          :disabled="selectedProducts.length === 0 || isSaving"
          @click="handleBulkDelete"
        >
          批量刪除
        </Button>
      </div>
    </div>

    <!-- Data Table -->
    <DataTable
      v-model:selected="selectedProducts"
      v-model:sort-config="sortState"
      :columns="columns"
      :data="products"
      :is-loading="isLoading"
    >
      <!-- Custom cells -->
      <template #cell-name="{ item }">
        <div class="flex items-center gap-3">
          <ProductImage
            :src="item.image"
            :alt="item.name"
            size="sm"
          />
          <span class="font-medium truncate max-w-[180px] text-foreground">{{ item.name }}</span>
        </div>
      </template>

      <template #cell-category="{ item }">
        {{ getCategoryLabel(item.category) }}
      </template>

      <template #cell-price="{ value }">
        ${{ Number(value).toLocaleString() }}
      </template>

      <template #cell-stock="{ item }">
        <Badge v-bind="getStockBadge(item.stock)">
          {{ getStockBadge(item.stock).label }}
        </Badge>
      </template>

      <template #cell-status="{ item }">
        <Badge v-bind="getStatusBadge(item.status)">
          {{ getStatusBadge(item.status).label }}
        </Badge>
      </template>

      <template #cell-actions="{ item }">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
            >
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="openEdit(item)">
              編輯
            </DropdownMenuItem>
            <DropdownMenuItem
              class="text-destructive"
              @click="openDelete(item)"
            >
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </template>
    </DataTable>

    <!-- Pagination -->
    <Pagination
      v-model:page="currentPage"
      v-model:page-size="pageSize"
      :total="totalProducts"
    />
  </div>
</template>
