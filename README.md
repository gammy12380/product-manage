# Vue Dashboard with Shadcn UI

一個以 Vue 3 為核心、搭配 Shadcn UI 組件庫的後台管理系統，包含商品管理模組與購物車折扣計算系統。

---

## 技術選型

### 前端核心
| 技術 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | ^3.5 | 核心框架，使用 Composition API + `<script setup>` |
| **TypeScript** | ^5.9 | 靜態型別系統，提升開發時期的正確性 |
| **Vite** | ^7.3 | 建構工具，提供 HMR 與快速冷啟動 |
| **Vue Router** | ^4.6 | 單頁應用路由管理 |

### UI / 樣式
| 技術 | 用途 |
|------|------|
| **Shadcn Vue** | 以 Radix UI / Reka UI 為基礎的無樣式組件庫，組件可直接複製進專案客製化 |
| **Tailwind CSS v4** | Utility-first CSS，搭配 `@tailwindcss/postcss` |
| **lucide-vue-next** | 一致風格的 SVG 圖示庫 |

### 表單 / 驗證
| 技術 | 用途 |
|------|------|
| **VeeValidate** | Vue 3 表單狀態管理 |
| **Zod** | Schema 定義與 runtime 資料驗證 |
| **@vee-validate/zod** | VeeValidate 與 Zod 橋接器 |

### 工具庫
| 技術 | 用途 |
|------|------|
| **@vueuse/core** | `useFetch`（響應式 API 請求）、`refDebounced`（防抖） |
| **vue-sonner** | Toast 通知（需搭配 `optimizeDeps` 確保單一模組實例） |

### 後端（Mock API）
| 技術 | 用途 |
|------|------|
| **Express 5** | 輕量 Mock API Server，儲存於記憶體，重啟後重置 |
| **tsx** | 直接執行 TypeScript 的 Node.js 工具 |
| **concurrently** | 同時啟動前端 Vite 與後端 Express |

---

## 設計架構

```
src/
├── api/                  # API 層
│   └── useProductApi.ts  # 商品 CRUD + 列表查詢（useFetch wrapper）
│
├── composable/           # 業務邏輯層（Vue Composables）
│   ├── useProductManage.ts  # 商品管理頁的所有狀態與操作
│   └── useCartDiscount.ts   # 購物車折扣計算系統
│
├── views/                # 頁面層（只負責 template，邏輯交給 composable）
│   ├── ProductManage.vue
│   └── CartDiscount.vue
│
├── components/           # 組件層
│   ├── ui/               # Shadcn 原始組件（Button, Input, Dialog...）
│   ├── common/           # 通用組件（DataTable, Pagination, BaseDialog...）
│   └── product/          # 商品特定組件（ProductEditDialog, ProductImage...）
│
├── types/                # 型別定義（Single Source of Truth）
│   ├── product.ts        # Product, ProductFilter, ProductSortConfig...
│   ├── discount.ts       # Category, CartItem, DiscountDetail...
│   └── table.ts          # Column, TableSortConfig, PaginatedResponse...
│
└── router/               # 路由設定
```

### 關鍵設計決策

#### 1. 關注點分離（Separation of Concerns）
- **View 層**：只負責引入 UI 組件與呼叫 composable，不含任何業務邏輯
- **Composable 層**：封裝所有 state、副作用、API 呼叫及操作函數
- **API 層**：純粹的資料存取邏輯，與業務邏輯完全解耦

#### 2. 型別統一管理
`src/types/` 是整個專案的型別唯一來源。後端 `server/index.ts` 透過相對路徑引入同一份型別，避免重複定義與不同步的風險。

#### 3. 響應式 API 請求
`useProductApi` 使用 `useFetch` 搭配 computed URL，當任何篩選條件（搜尋、分類、價格、排序、分頁）改變時自動重新請求，並透過 `onBeforeUnmount(() => abort())` 在元件卸載時取消尚未完成的請求。

#### 4. 防抖（Debounce）
搜尋輸入使用 `refDebounced(searchInput, 300)`，價格輸入使用 500ms，防止使用者輸入過程中頻繁觸發 API。

#### 5. 三態排序
欄位排序支援三態切換：未排序 → 升冪（↑）→ 降冪（↓）→ 未排序，對應 API 的 `sortKey/sortOrder` 為空時使用後端預設排序。

---

## 購物車折扣計算系統

> 相關檔案：`src/composable/useCartDiscount.ts`、`src/types/discount.ts`

### 折扣規則

**優先順序（由高到低）：選最優惠的，不可疊加**

| 折扣類型 | 條件 | 折扣率 |
|----------|------|--------|
| **滿額折扣** | 整筆訂單原始總金額 ≥ $10,000 | 整單打 **9 折** |
| **分類折扣 - electronics** | 該類別購買數量 ≥ 2 件 | 該類別商品打 **85 折** |
| **分類折扣 - clothing** | 該類別購買數量 ≥ 3 件 | 該類別商品打 **8 折** |
| **分類折扣 - books** | 該類別購買數量 ≥ 5 件 | 該類別商品打 **7 折** |

### 計算流程

```
購物車商品
    │
    ▼
① 計算各類別總數量（categoryCounts）
    │
    ▼
② 計算訂單原始總金額（originalTotal）
    │
    ▼
③ 對每項商品比較可用折扣率
   ├─ 分類折扣：該類別數量是否達門檻？
   ├─ 滿額折扣：總金額是否 >= 10,000？
   └─ 選擇折扣率較低（更優惠）的那個
    │
    ▼
④ 彙整結果回傳 CalculationResult
   ├─ originalTotal  原始總金額
   ├─ finalTotal     折扣後總金額
   ├─ totalSaved     節省金額
   ├─ appliedDiscount 折扣類型（none/full_amount/category/mixed）
   └─ discounts[]    每項商品的折扣明細
```

### 規則設定結構

折扣規則集中定義為常數，使用 `as const satisfies` 確保型別安全：

```typescript
// 分類折扣規則（satisfies 確保所有 Category 都有設定，不會遺漏）
const CATEGORY_DISCOUNT_RULES = {
    electronics: { minQuantity: 2, rate: 0.85 },
    clothing:    { minQuantity: 3, rate: 0.80 },
    books:       { minQuantity: 5, rate: 0.70 },
} as const satisfies Record<Category, CategoryDiscountRule>

// 滿額折扣規則
const FULL_AMOUNT_DISCOUNT_RULE = {
    minAmount: 10000,
    rate: 0.9,
} as const
```

---

## 擴展思考

### Q4. 如果要新增「同項第二件半價」規則，你會如何設計？

新增一組 `QUANTITY_DISCOUNT_RULES` 常數，定義第幾件起打幾折：

```typescript
const QUANTITY_DISCOUNT_RULES = [
    { fromQuantity: 2, rate: 0.5 }, // 第 2 件起半價
] as const
```

計算時，對每個 CartItem 計算加權平均後的有效折扣率：

```
Item: AirPods x 3，原價 $5,000
├─ 第 1 件：$5,000 × 1.0 = $5,000
├─ 第 2 件：$5,000 × 0.5 = $2,500
└─ 第 3 件：$5,000 × 0.5 = $2,500
加權平均折扣率 = ($5,000 + $2,500 + $2,500) / ($5,000 × 3) ≈ 0.667
```

接著將此 `quantityRate` 與 `catRate`、`fullRate` 一起比較，取最小值套用，維持「只選最優惠」的原則。同時在 `DiscountType` 新增 `'quantity'` 型別，讓明細可以標記此折扣來源。

---

### Q5. 你的程式碼如何方便未來新增其他折扣規則？

本系統的擴展性設計建立在以下三個原則上：

**1. 規則與邏輯分離**

所有折扣「規格」以常數物件形式定義於函數外部（`CATEGORY_DISCOUNT_RULES`、`FULL_AMOUNT_DISCOUNT_RULE`），修改規格不需要動核心計算邏輯。

**2. `satisfies` 確保規則完整性**

使用 `satisfies Record<Category, ...>` 讓 TypeScript 在編譯時驗證所有類別都有設定。未來若在 `Category` 型別新增類別，立即報錯提醒補設定，不會靜默遺漏。

**3. 新增規則的標準流程**

新增任何折扣類型只需要三步：
1. 在 `DiscountType` 加入新型別字串（如 `'quantity'`）
2. 新增對應的規則常數物件
3. 在 `calculate()` 的比較區段加入新的 rate 計算，與其他 rate 一起比較取最優

核心的「選最優惠折扣」邏輯（比較所有 rate 取最小值）完全不需要修改，新規則只是多一個參與比較的候選值。

---

## 快速開始

```bash
# 安裝相依套件
bun install

# 啟動開發環境（同時啟動前端 Vite + 後端 Mock API）
bun run dev

# 型別檢查
npx vue-tsc --noEmit
```

開發伺服器：http://localhost:5173  
Mock API：http://localhost:3001
