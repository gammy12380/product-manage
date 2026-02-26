import { computed, toValue, onBeforeUnmount, type MaybeRefOrGetter } from 'vue'
import { useFetch } from '@vueuse/core'
import type { Product, ProductFilter, ProductSortConfig } from '@/types/product'
import type { PaginatedResponse } from '@/types/table'

const BASE = '/api'

const toQueryString = (params: Record<string, unknown>): string => {
    const q = new URLSearchParams()
    for (const [key, val] of Object.entries(params)) {
        if (val === null || val === undefined || val === '') continue
        if (typeof val === 'object') {
            q.set(key, JSON.stringify(val))
        } else {
            q.set(key, String(val))
        }
    }
    return q.toString()
}

export const useProductApi = (params: MaybeRefOrGetter<{
    page: number
    pageSize: number
    filter: ProductFilter
    sort?: ProductSortConfig
}>) => {
    // --- 列表查詢（reactive URL，params 變動自動 refetch）---
    const listUrl = computed(() => {
        const { page, pageSize, filter, sort } = toValue(params)
        return `${BASE}/products?${toQueryString({
            page,
            pageSize,
            // sort 為 undefined 時不傳 sortKey/sortOrder，server 會使用預設
            sortKey: sort?.key != null ? String(sort.key) : undefined,
            sortOrder: sort?.order,
            search: filter.search || null,
            category: filter.category,
            stockStatus: filter.stockStatus,
            status: filter.status,
            minPrice: filter.minPrice,
            maxPrice: filter.maxPrice,
        })}`
    })

    const {
        data,
        isFetching,
        error,
        execute: refetch,
        abort,
    } = useFetch<PaginatedResponse<Product>>(listUrl, { refetch: true }).get().json()

    // 組件卸載前取消尚未完成的請求，避免更新已銀毀的組件狀態
    onBeforeUnmount(() => abort())

    const products = computed(() => data.value?.data ?? [])
    const total = computed(() => data.value?.total ?? 0)

    // --- CRUD ---
    const createProduct = async (product: Omit<Product, 'id'>) => {
        const { data: res, error: err } = await useFetch<Product>(`${BASE}/products`)
            .post(product).json()
        if (err.value) throw err.value
        return res.value
    }

    const updateProduct = async (product: Product) => {
        const { data: res, error: err } = await useFetch<Product>(`${BASE}/products/${product.id}`)
            .put(product).json()
        if (err.value) throw err.value
        return res.value
    }

    const deleteProduct = async (id: number) => {
        const { error: err } = await useFetch(`${BASE}/products/${id}`).delete()
        if (err.value) throw err.value
    }

    const bulkUpdateStatus = async (ids: number[], status: Product['status']) => {
        const { error: err } = await useFetch(`${BASE}/products/bulk-status`)
            .post({ ids, status }).json()
        if (err.value) throw err.value
    }

    const bulkDelete = async (ids: number[]) => {
        const { error: err } = await useFetch(`${BASE}/products`, {
            beforeFetch({ options }) {
                options.headers = {
                    ...options.headers,
                    'Content-Type': 'application/json'
                }
                options.body = JSON.stringify({ ids })
                return { options }
            },
        }).delete()
        if (err.value) throw err.value
    }

    return {
        products,
        total,
        isFetching,
        error,
        refetch,
        createProduct,
        updateProduct,
        deleteProduct,
        bulkUpdateStatus,
        bulkDelete,
    }
}
