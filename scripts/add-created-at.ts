import fs from 'fs'
import path from 'path'
import type { Product } from '../src/types/product'

const filePath = path.join(process.cwd(), 'src/api/mock/products.json')
const rawData = fs.readFileSync(filePath, 'utf-8')
const products = JSON.parse(rawData) as Product[]

const now = Date.now()
const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

// 隨機生成過去 30 天內的時間，並由舊到新排序 (可選，這裡我們讓 id 越小時間越舊)
const times: number[] = Array.from({ length: products.length }, () => {
    return now - Math.floor(Math.random() * thirtyDaysMs)
}).sort((a, b) => a - b)

const updatedProducts = products.map((p: Product, index: number) => {
    return {
        ...p,
        createdAt: new Date(times[index]).toISOString()
    }
})

// 為了讓最近新建的能在「最前面」，API 回傳時我們會做 sort(b - a)
fs.writeFileSync(filePath, JSON.stringify(updatedProducts, null, 2), 'utf-8')
console.log('Successfully added createdAt to all mock products.')
