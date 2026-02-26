export type SortOrder = 'asc' | 'desc'

export interface Column<T> {
  key: keyof T | 'actions' | 'selection'
  label: string
  sortable?: boolean
  class?: string
}

export interface TableSortConfig<T, K = keyof T> {
  key: K
  order?: SortOrder
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
