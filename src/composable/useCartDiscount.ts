import type { Product, CartItem, CalculationResult, DiscountDetail, Category, } from '@/types/discount'

// 滿額折扣：消費滿 10,000 元，整筆訂單打 9 折
// 分類折扣：
// electronics 類別：買 2 件以上，該類別商品打 85 折
// clothing 類別：買 3 件以上，該類別商品打 8 折
// books 類別：買 5 件以上，該類別商品打 7 折
// 折扣不可疊加：每個商品只能套用一種折扣（選擇最優惠的）

type CategoryDiscountRule = {
    minQuantity: number
    rate: number
}

// 分類折扣規則
const CATEGORY_DISCOUNT_RULES = {
    electronics: { minQuantity: 2, rate: 0.85 },
    clothing:    { minQuantity: 3, rate: 0.80 },
    books:       { minQuantity: 5, rate: 0.70 },
} as const satisfies Record<Category, CategoryDiscountRule>

// 滿額折扣規則
const FULL_AMOUNT_DISCOUNT_RULE = {
    minAmount: 10000, // 消費門檻
    rate: 0.9,        // 打 9 折
} as const

export const useCartDiscount = (products: Product[]) => {

    const calculate = (cart: CartItem[]): CalculationResult => {
        // 1. 建立初步明細並計算各類別總數
        const categoryCounts: Record<string, number> = {};

        const initialDetails: DiscountDetail[] = cart.map(item => {
            const product = products.find(p => p.id === item.productId)!;
            categoryCounts[product.category] = (categoryCounts[product.category] || 0) + item.quantity;

            return {
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                originalPrice: product.price,
                originalSubtotal: product.price * item.quantity,
                discountType: 'none',
                discountRate: 1,
                finalPrice: product.price,
                finalSubtotal: product.price * item.quantity,
                saved: 0
            };
        });

        const originalTotal = initialDetails.reduce((sum, d) => sum + d.originalSubtotal, 0);
        const isFullAmountEligible = originalTotal >= FULL_AMOUNT_DISCOUNT_RULE.minAmount;

        // 2. 針對每個商品判斷最優折扣
        const finalDiscounts = initialDetails.map(detail => {
            const product = products.find(p => p.id === detail.productId)!;
            const rule = CATEGORY_DISCOUNT_RULES[product.category];

            // A. 計算分類折扣
            let catRate = 1;
            if (categoryCounts[product.category] >= rule.minQuantity) {
                catRate = rule.rate;
            }

            // B. 計算滿額折扣
            const fullRate = isFullAmountEligible ? FULL_AMOUNT_DISCOUNT_RULE.rate : 1;

            // C. 選擇最優惠的 (比較折扣率，越小越便宜)
            if (catRate <= fullRate && catRate < 1) {
                detail.discountType = 'category';
                detail.discountRate = catRate;
            } else if (fullRate < catRate) {
                detail.discountType = 'full_amount';
                detail.discountRate = fullRate;
            }

            detail.finalPrice = detail.originalPrice * detail.discountRate;
            detail.finalSubtotal = detail.finalPrice * detail.quantity;
            detail.saved = detail.originalSubtotal - detail.finalSubtotal;

            return detail;
        });

        const finalTotal = finalDiscounts.reduce((sum, d) => sum + d.finalSubtotal, 0);

        // 判斷整筆訂單的折扣標籤
        const hasFull = finalDiscounts.some(d => d.discountType === 'full_amount');
        const hasCat = finalDiscounts.some(d => d.discountType === 'category');
        let appliedDiscount: CalculationResult['appliedDiscount'] = 'none';
        if (hasFull && hasCat) appliedDiscount = 'mixed';
        else if (hasFull) appliedDiscount = 'full_amount';
        else if (hasCat) appliedDiscount = 'category';

        return {
            originalTotal,
            finalTotal,
            totalSaved: originalTotal - finalTotal,
            appliedDiscount,
            discounts: finalDiscounts
        };
    };

    return { calculate };
};
