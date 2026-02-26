<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Product, CartItem } from '@/types/discount'
import { useCartDiscount } from '@/composable/useCartDiscount'
import Badge from '@/components/ui/Badge.vue'
import Card from '@/components/ui/Card.vue'
import CardContent from '@/components/ui/CardContent.vue'
import CardHeader from '@/components/ui/CardHeader.vue'
import CardTitle from '@/components/ui/CardTitle.vue'
import CardDescription from '@/components/ui/CardDescription.vue'

const products: Product[] = [
    { id: 1, name: 'iPhone', price: 30000, category: 'electronics' },
    { id: 2, name: 'AirPods', price: 5000, category: 'electronics' },
    { id: 3, name: 'T-shirt', price: 500, category: 'clothing' },
    { id: 4, name: 'Jeans', price: 1500, category: 'clothing' },
    { id: 5, name: 'Book', price: 350, category: 'books' }
]

const examples: { label: string; cart: CartItem[] }[] = [
    {
        label: '範例 1：混合折扣（分類 + 滿額）',
        cart: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 2 },
            { productId: 3, quantity: 3 },
            { productId: 5, quantity: 2 }
        ]
    },
    {
        label: '範例 2：純分類折扣',
        cart: [
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 },
            { productId: 3, quantity: 3 }
        ]
    },
    {
        label: '範例 3：純滿額折扣',
        cart: [{ productId: 1, quantity: 1 }]
    },
    {
        label: '範例 4：混合折扣',
        cart: [
            { productId: 2, quantity: 2 },
            { productId: 5, quantity: 2 }
        ]
    },
    {
        label: '範例 5：多重分類折扣',
        cart: [
            { productId: 2, quantity: 3 },
            { productId: 3, quantity: 4 },
            { productId: 5, quantity: 5 }
        ]
    }
]

const { calculate } = useCartDiscount(products)

const selectedIndex = ref(0)
const result = computed(() => calculate(examples[selectedIndex.value].cart))

const discountTypeLabelMap: Record<string, string> = {
    none: '無折扣',
    full_amount: '滿額折扣',
    category: '分類折扣',
    mixed: '混合折扣'
}

const discountTypeBadgeMap: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
    none: 'secondary',
    full_amount: 'default',
    category: 'default',
    mixed: 'default'
}

const categoryLabelMap: Record<string, string> = {
    electronics: '電子產品',
    clothing: '服飾配件',
    books: '書籍/教育'
}

const formatPrice = (price: number) =>
    `$${price.toLocaleString('zh-TW')}`

const discountRateLabel = (rate: number) =>
    rate === 1 ? '原價' : `${Math.round(rate * 100)} 折`
</script>

<template>
  <div class="flex flex-col gap-6 p-6 bg-background min-h-screen">
    <!-- Header -->
    <div>
      <h2 class="text-3xl font-bold tracking-tight text-foreground">
        購物車折扣計算
      </h2>
      <p class="text-muted-foreground text-sm mt-1">
        滿額折扣 × 分類折扣，自動選擇最優惠方案，折扣不可疊加。
      </p>
    </div>

    <!-- 範例選擇 -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(ex, i) in examples"
        :key="i"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
          selectedIndex === i
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-card text-muted-foreground border-border hover:bg-accent hover:text-accent-foreground'
        ]"
        @click="selectedIndex = i"
      >
        {{ ex.label }}
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側：購物車內容 -->
      <Card class="lg:col-span-2">
        <CardHeader>
          <CardTitle>購物車明細</CardTitle>
          <CardDescription>每項商品的折扣類型與最終價格</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="divide-y divide-border">
            <div
              v-for="d in result.discounts"
              :key="d.productId"
              class="flex items-center gap-4 py-4"
            >
              <!-- 商品名稱 & 分類 -->
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-foreground">
                  {{ d.productName }}
                </div>
                <div class="text-xs text-muted-foreground mt-0.5">
                  {{ categoryLabelMap[products.find(p => p.id === d.productId)?.category ?? ''] ?? '' }}
                  · 單價 {{ formatPrice(d.originalPrice) }}
                  · 數量 {{ d.quantity }}
                </div>
              </div>

              <!-- 折扣 Badge -->
              <Badge
                :variant="d.discountType === 'none' ? 'secondary' : 'default'"
                class="shrink-0"
              >
                {{ discountTypeLabelMap[d.discountType] }}
                <span
                  v-if="d.discountType !== 'none'"
                  class="ml-1 opacity-75"
                >
                  ({{ discountRateLabel(d.discountRate) }})
                </span>
              </Badge>

              <!-- 價格 -->
              <div class="text-right shrink-0">
                <div class="font-semibold text-foreground">
                  {{ formatPrice(d.finalSubtotal) }}
                </div>
                <div
                  v-if="d.saved > 0"
                  class="text-xs text-muted-foreground line-through"
                >
                  {{ formatPrice(d.originalSubtotal) }}
                </div>
                <div
                  v-if="d.saved > 0"
                  class="text-xs text-green-600 dark:text-green-400"
                >
                  省 {{ formatPrice(d.saved) }}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- 右側：金額摘要 -->
      <div class="flex flex-col gap-4">
        <!-- 折扣類型 -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base">
              套用折扣
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              :variant="discountTypeBadgeMap[result.appliedDiscount]"
              class="text-sm px-3 py-1"
            >
              {{ discountTypeLabelMap[result.appliedDiscount] }}
            </Badge>
          </CardContent>
        </Card>

        <!-- 金額卡片 -->
        <Card>
          <CardHeader class="pb-2">
            <CardTitle class="text-base">
              金額摘要
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">原始總金額</span>
              <span class="font-medium">{{ formatPrice(result.originalTotal) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">折扣總省下</span>
              <span class="font-medium text-green-600 dark:text-green-400">
                - {{ formatPrice(result.totalSaved) }}
              </span>
            </div>
            <div class="border-t border-border pt-3 flex justify-between">
              <span class="font-semibold text-foreground">最終金額</span>
              <span class="font-bold text-lg text-foreground">
                {{ formatPrice(result.finalTotal) }}
              </span>
            </div>
          </CardContent>
        </Card>

        <!-- 折扣規則說明 -->
        <Card class="bg-muted/30">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">
              折扣規則
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 text-xs text-muted-foreground">
            <div>🛍️ <span class="font-medium text-foreground">滿額折扣</span>：消費滿 $10,000，整單打 9 折</div>
            <div>📱 <span class="font-medium text-foreground">電子產品</span>：買 2 件以上打 85 折</div>
            <div>👕 <span class="font-medium text-foreground">服飾配件</span>：買 3 件以上打 8 折</div>
            <div>📚 <span class="font-medium text-foreground">書籍/教育</span>：買 5 件以上打 7 折</div>
            <div class="pt-1 border-t border-border/50">
              ⚠️ 折扣不可疊加，每項商品選最優惠的一種
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
