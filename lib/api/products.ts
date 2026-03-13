import { api } from "@/lib/api"
import type { Product, Pagination } from "@/lib/types"

type ProductsParams = {
  page?: number
  limit?: number
  search?: string
  category?: string
  isActive?: boolean
}

export const productsApi = {
  getProducts: async (params?: ProductsParams) => {
    const res = await api.get<{ success: true; data: { items: Product[]; pagination: Pagination } }>(
      "/api/products",
      { params }
    )
    return res.data.data
  },

  getProductById: async (id: string) => {
    const res = await api.get<{ success: true; data: { product: Product } }>(`/api/products/${id}`)
    return res.data.data.product
  },

  createProduct: async (data: Partial<Product>) => {
    const res = await api.post<{ success: true; data: { product: Product } }>("/api/products", data)
    return res.data.data.product
  },

  updateProduct: async (id: string, data: Partial<Product>) => {
    const res = await api.put<{ success: true; data: { product: Product } }>(`/api/products/${id}`, data)
    return res.data.data.product
  },

  deleteProduct: async (id: string) => {
    const res = await api.delete<{ success: true; message: string; data: { product: Product } }>(`/api/products/${id}`)
    return res.data
  },
}
