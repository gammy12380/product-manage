// 商品類別
export type Category = 'electronics' | 'clothing' | 'books';

// 折扣類型
export type DiscountType = 'full_amount' | 'category' | 'none' | 'mixed';

// 商品定義
export interface Product {
  id: number;
  name: string;
  price: number;
  category: Category;
}

// 購物車項目
export interface CartItem {
  productId: number;
  quantity: number;
}

// 折扣明細
export interface DiscountDetail {
  productId: number;
  productName: string;
  quantity: number;
  originalPrice: number;    // 單價
  originalSubtotal: number; // 小計(單價 × 數量)
  discountType: DiscountType;
  discountRate: number;      // 折扣率(0.9 表示 9 折)
  finalPrice: number;       // 折扣後單價
  finalSubtotal: number;    // 折扣後小計
  saved: number;            // 省下的金額
}

// 計算結果
export interface CalculationResult {
  originalTotal: number;
  finalTotal: number;
  totalSaved: number;
  appliedDiscount: DiscountType;
  discounts: DiscountDetail[];
}
