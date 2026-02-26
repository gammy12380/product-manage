import express, { type RequestHandler } from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import type { Product, ProductStatus } from '../src/types/product'
import type { Category } from '../src/types/discount'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 讀取初始資料
const rawData = readFileSync(join(__dirname, '../src/api/mock/products.json'), 'utf-8')

interface IdParams {
    id: string
}

interface BulkStatusBody {
    ids: number[]
    status: ProductStatus
}

interface BulkDeleteBody {
    ids: number[]
}

// 在記憶體中維護資料（重啟後重置）
let products: Product[] = JSON.parse(rawData) as Product[]

const app = express()
app.use(cors())
app.use(express.json())

// ─── GET /api/products ─────────────────────────────────────────────────────
const getProducts: RequestHandler = (req, res) => {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const search = ((req.query.search as string) || '').toLowerCase()
    const category = (req.query.category as string) || ''
    const stockStatus = (req.query.stockStatus as string) || ''
    const status = (req.query.status as string) || ''
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : null
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null
    const sortKey = ((req.query.sortKey as string) || 'createdAt') as keyof Product
    const sortOrder = (req.query.sortOrder as string) || 'desc'

    setTimeout(() => {
        let result = [...products]

        if (search) {
            result = result.filter(p => p.name.toLowerCase().includes(search))
        }

        if (category) {
            result = result.filter(p => p.category === (category as Category))
        }

        if (stockStatus === 'low_stock') {
            result = result.filter(p => p.stock > 0 && p.stock <= 10)
        } else if (stockStatus === 'out_of_stock') {
            result = result.filter(p => p.stock === 0)
        } else if (stockStatus === 'in_stock') {
            result = result.filter(p => p.stock > 0)
        }

        if (status) {
            result = result.filter(p => p.status === (status as ProductStatus))
        }

        if (minPrice !== null) {
            result = result.filter(p => p.price >= minPrice)
        }

        if (maxPrice !== null) {
            result = result.filter(p => p.price <= maxPrice)
        }

        result.sort((a, b) => {
            const valA = a[sortKey]
            const valB = b[sortKey]
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc'
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA)
            }
            const nA = valA as number
            const nB = valB as number
            return sortOrder === 'asc' ? nA - nB : nB - nA
        })

        const total = result.length
        const start = (page - 1) * pageSize
        const data = result.slice(start, start + pageSize)

        res.json({ data, total, page, pageSize })
    }, 300)
}

// ─── GET /api/products/:id ─────────────────────────────────────────────────
const getProductById: RequestHandler<IdParams> = (req, res) => {
    const id = parseInt(req.params.id)
    const product = products.find(p => p.id === id)
    if (!product) {
        res.status(404).json({ error: 'Product not found' })
        return
    }
    res.json(product)
}

// ─── POST /api/products ────────────────────────────────────────────────────
const createProduct: RequestHandler<Record<string, never>, unknown, Omit<Product, 'id'>> = (req, res) => {

    const body = req.body
    if (!body.name || !body.category || typeof body.price !== 'number' || typeof body.stock !== 'number') {
        res.status(400).json({ error: 'Bad Request: 缺少必填欄位或格式錯誤' })
        return
    }

    if (body.price <= 0 || body.stock < 0) {
        res.status(400).json({ error: 'Bad Request: 定價必須大於0，庫存不可小於0' })
        return
    }

    const maxId = products.reduce((max, p) => Math.max(max, p.id), 0)
    // 預設帶上目前的當下時間做為建立時間
    const newProduct: Product = { ...body, id: maxId + 1, createdAt: body.createdAt || new Date().toISOString() }
    products.push(newProduct)
    res.status(201).json(newProduct)
}

// ─── PUT /api/products/:id ─────────────────────────────────────────────────
const updateProduct: RequestHandler<IdParams, unknown, Partial<Product>> = (req, res) => {

    const id = parseInt(req.params.id)
    const idx = products.findIndex(p => p.id === id)
    if (idx === -1) {
        res.status(404).json({ error: 'Product not found' })
        return
    }

    const body = req.body
    if (body.price !== undefined && body.price <= 0) {
        res.status(400).json({ error: 'Bad Request: 定價必須大於0' })
        return
    }
    if (body.stock !== undefined && body.stock < 0) {
        res.status(400).json({ error: 'Bad Request: 庫存不可小於0' })
        return
    }

    const existing = products[idx] as Product
    const updated: Product = { ...existing, ...body, id }
    products[idx] = updated
    res.json(updated)
}

// ─── DELETE /api/products/:id ──────────────────────────────────────────────
const deleteProduct: RequestHandler<IdParams> = (req, res) => {

    const id = parseInt(req.params.id)
    const idx = products.findIndex(p => p.id === id)
    if (idx === -1) {
        res.status(404).json({ error: 'Product not found' })
        return
    }
    products.splice(idx, 1)
    res.status(204).send()
}

// ─── DELETE /api/products (批量刪除) ──────────────────────────────────────
const bulkDeleteProducts: RequestHandler<Record<string, never>, unknown, BulkDeleteBody> = (req, res) => {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ error: 'ids array is required' })
        return
    }
    const idSet = new Set(ids)
    products = products.filter(p => !idSet.has(p.id))
    res.status(204).send()
}

// ─── POST /api/products/bulk-status (批量狀態更新) ────────────────────────
const bulkUpdateStatus: RequestHandler<Record<string, never>, unknown, BulkStatusBody> = (req, res) => {

    const { ids, status } = req.body
    if (!Array.isArray(ids) || !status) {
        res.status(400).json({ error: 'ids and status are required' })
        return
    }
    const idSet = new Set(ids)
    products = products.map(p => idSet.has(p.id) ? { ...p, status } : p)
    res.json({ updated: ids.length })
}

// ─── Routes ────────────────────────────────────────────────────────────────
app.get('/api/products', getProducts)
app.get('/api/products/:id', getProductById)
app.post('/api/products', createProduct)
app.put('/api/products/:id', updateProduct)
app.delete('/api/products/:id', deleteProduct)
app.delete('/api/products', bulkDeleteProducts)
app.post('/api/products/bulk-status', bulkUpdateStatus)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`🚀 Mock API server running at http://localhost:${PORT}`)
})
