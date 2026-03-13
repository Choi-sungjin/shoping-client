import { api } from "@/lib/api"
import type { CartItem } from "@/lib/types"

export const cartApi = {
  getCart: async () => {
    const res = await api.get<{ success: true; data: { items: CartItem[] } }>("/api/cart")
    return res.data.data.items
  },

  addToCart: async (productId: string, quantity: number) => {
    const res = await api.post<{ success: true; data: { item: CartItem } }>("/api/cart", {
      productId,
      quantity,
    })
    return res.data.data.item
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const res = await api.patch<{ success: true; data: { item: CartItem } }>(`/api/cart/${itemId}`, {
      quantity,
    })
    return res.data.data.item
  },

  removeCartItem: async (itemId: string) => {
    const res = await api.delete<{ success: true; message: string }>(`/api/cart/${itemId}`)
    return res.data
  },

  clearCart: async () => {
    const res = await api.delete<{ success: true; message: string }>("/api/cart")
    return res.data
  },
}
