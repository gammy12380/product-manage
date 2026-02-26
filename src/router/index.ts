import { createRouter, createWebHistory } from 'vue-router'
import ProductManage from '../views/ProductManage.vue'
import CartDiscount from '../views/CartDiscount.vue'

const routes = [
    {
        path: '/',
        redirect: '/product-manage'
    },
    {
        path: '/product-manage',
        name: 'ProductManage',
        component: ProductManage,
        meta: {
            title: '商品管理'
        }
    },
    {
        path: '/cart-discount',
        name: 'CartDiscount',
        component: CartDiscount,
        meta: {
            title: '購物車折扣'
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router
