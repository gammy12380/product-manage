import { Category } from './discount';

export type ProductStatus = 'active' | 'inactive';

export interface Product {
  id: number;
  image: string;
  name: string;
  category: Category;
  price: number;
  stock: number;
  status: ProductStatus;
  sales: number;
  createdAt: string;
}

export interface ProductFilter {
  search: string;
  category?: Category;
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'low_stock';
  status?: ProductStatus;
}

export type ProductSortField = 'name' | 'category' | 'price' | 'stock' | 'sales' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ProductSortConfig {
  key: ProductSortField;
  order?: SortOrder;
}
