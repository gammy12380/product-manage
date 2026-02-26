import { ref, computed, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { toast } from 'vue-sonner'
import { useProductApi } from '@/api/useProductApi'
import type { Product, ProductFilter, ProductSortField, ProductStatus } from '@/types/product'
import type { Category } from '@/types/discount'
import type { Column, TableSortConfig } from '@/types/table'

export const useProductManage = () => {
    // ─── 篩選選項 ────────────────────────────────────────────────────
    const categoryOptions = [
        { label: '電子產品', value: 'electronics' },
        { label: '服飾配件', value: 'clothing' },
        { label: '書籍/教育', value: 'books' }
    ]

    const stockStatusOptions = [
        { label: '有貨', value: 'in_stock' },
        { label: '低庫存 (10筆以下)', value: 'low_stock' },
        { label: '缺貨', value: 'out_of_stock' }
    ]

    const statusOptions = [
        { label: '上架中', value: 'active' },
        { label: '已下架', value: 'inactive' }
    ]

    // ─── 表格欄位定義 ─────────────────────────────────────────────────
    const columns: Column<Product>[] = [
        { key: 'selection', label: '' },
        { key: 'name', label: '商品' },
        { key: 'category', label: '分類' },
        { key: 'price', label: '定價', sortable: true, class: 'text-right' },
        { key: 'stock', label: '庫存', sortable: true },
        { key: 'status', label: '狀態' },
        { key: 'sales', label: '銷售', sortable: true, class: 'text-right' },
        { key: 'actions', label: '操作' }
    ]

    // ─── 分頁 & 選取 ─────────────────────────────────────────────────
    const selectedProducts = ref<(number | string)[]>([])
    const currentPage = ref(1)
    const pageSize = ref(10)

    // ─── 篩選條件 ────────────────────────────────────────────────────
    const productFilters = ref<ProductFilter>({
        search: '',
        category: undefined,
        stockStatus: undefined,
        status: undefined
    })

    // 搜尋 debounce：輸入後 300ms 才觸發查詢
    const searchInput = ref('')
    const debouncedSearch = refDebounced(searchInput, 300)

    // 價格 debounce：輸入後 500ms 觸發
    const minPriceInput = ref<number | undefined>(undefined)
    const maxPriceInput = ref<number | undefined>(undefined)
    const debouncedMinPrice = refDebounced(minPriceInput, 500)
    const debouncedMaxPrice = refDebounced(maxPriceInput, 500)

    // 任何篩選條件改變時，重設頁碼回第 1 頁
    watch(
        [
            debouncedSearch,
            debouncedMinPrice,
            debouncedMaxPrice,
            () => productFilters.value.category,
            () => productFilters.value.stockStatus,
            () => productFilters.value.status,
        ],
        () => { currentPage.value = 1 }
    )

    // ─── 排序 ───────────────────────────────────────────────────────
    const sortState = ref<TableSortConfig<Product, ProductSortField> | undefined>({
        key: 'createdAt',
        order: 'desc'
    })

    // ─── API ─────────────────────────────────────────────────────────
    const {
        products,
        total: totalProducts,
        isFetching: isLoading,
        refetch,
        createProduct,
        updateProduct,
        deleteProduct,
        bulkUpdateStatus,
        bulkDelete,
    } = useProductApi(
        computed(() => ({
            page: currentPage.value,
            pageSize: pageSize.value,
            filter: {
                ...productFilters.value,
                search: debouncedSearch.value,
                minPrice: debouncedMinPrice.value,
                maxPrice: debouncedMaxPrice.value
            },
            sort: sortState.value,
        }))
    )

    // ─── Badge Helpers ────────────────────────────────────────────────
    const getStatusBadge = (status: ProductStatus) => {
        if (status === 'active') return { label: '上架中', variant: 'default' as const }
        return { label: '已下架', variant: 'secondary' as const }
    }

    const getStockBadge = (stock: number) => {
        if (stock === 0) return { label: '缺貨', variant: 'destructive' as const }
        if (stock <= 10) return { label: `庫存低 (${stock})`, variant: 'outline' as const }
        return { label: `有貨 (${stock})`, variant: 'outline' as const }
    }

    const getCategoryLabel = (cat: Category) => {
        const map: Record<Category, string> = {
            electronics: '電子產品',
            clothing: '服飾配件',
            books: '書籍/教育'
        }
        return map[cat] || cat
    }

    // ─── 對話框狀態 ───────────────────────────────────────────────────
    const editDialogOpen = ref(false)
    const deleteDialogOpen = ref(false)
    const bulkDeleteDialogOpen = ref(false)
    const bulkStatusDialogOpen = ref(false)
    const pendingBulkStatus = ref<ProductStatus | null>(null)
    const targetProduct = ref<Product | null>(null)
    const isSaving = ref(false)

    // ─── CRUD Actions ─────────────────────────────────────────────────
    const openCreate = () => {
        targetProduct.value = null
        editDialogOpen.value = true
    }

    const openEdit = (product: Product) => {
        targetProduct.value = { ...product }
        editDialogOpen.value = true
    }

    const openDelete = (product: Product) => {
        targetProduct.value = product
        deleteDialogOpen.value = true
    }

    const confirmDelete = async () => {
        if (!targetProduct.value) return
        isSaving.value = true
        try {
            await deleteProduct(targetProduct.value.id)
            toast.success('商品刪除成功！')
        } catch {
            toast.error('刪除失敗，請檢查網路連線或稍後再試。')
        } finally {
            isSaving.value = false
            deleteDialogOpen.value = false
            await refetch()
        }
    }

    const handleProductSave = async (updatedProduct: Product) => {
        isSaving.value = true
        try {
            if (updatedProduct.id && products.value.some((p: Product) => p.id === updatedProduct.id)) {
                await updateProduct(updatedProduct)
                toast.success('商品更新成功！')
            } else {
                await createProduct(updatedProduct)
                toast.success('商品新增成功！')
            }
            editDialogOpen.value = false
            await refetch()
        } catch {
            toast.error('儲存失敗，請檢查網路連線或稍後再試。')
        } finally {
            isSaving.value = false
        }
    }

    // ─── Bulk Actions ─────────────────────────────────────────────────
    const handleBulkUpdate = (status: ProductStatus) => {
        if (selectedProducts.value.length === 0) return
        pendingBulkStatus.value = status
        bulkStatusDialogOpen.value = true
    }

    const confirmBulkUpdate = async () => {
        if (!pendingBulkStatus.value) return
        isSaving.value = true
        const label = pendingBulkStatus.value === 'active' ? '上架' : '下架'
        try {
            await bulkUpdateStatus(selectedProducts.value.map(Number), pendingBulkStatus.value)
            toast.success(`批量${label}成功！共 ${selectedProducts.value.length} 項商品已被${label}。`)
            selectedProducts.value = []
            await refetch()
        } catch {
            toast.error(`批量${label}失敗，請檢查網路連線或稍後再試。`)
        } finally {
            isSaving.value = false
            bulkStatusDialogOpen.value = false
            pendingBulkStatus.value = null
        }
    }

    const handleBulkDelete = () => {
        if (selectedProducts.value.length === 0) return
        bulkDeleteDialogOpen.value = true
    }

    const confirmBulkDelete = async () => {
        isSaving.value = true
        try {
            await bulkDelete(selectedProducts.value.map(Number))
            toast.success('批量刪除成功！')
            selectedProducts.value = []
        } catch {
            toast.error('批量刪除失敗，請檢查網路連線或稍後再試。')
        } finally {
            isSaving.value = false
            bulkDeleteDialogOpen.value = false
            await refetch()
        }
    }

    // ─── 重設篩選 ─────────────────────────────────────────────────────
    const resetFilters = () => {
        productFilters.value = {
            search: '',
            category: undefined,
            stockStatus: undefined,
            status: undefined
        }
        searchInput.value = ''
        minPriceInput.value = undefined
        maxPriceInput.value = undefined
        currentPage.value = 1
    }

    return {
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
        refetch,
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
    }
}
