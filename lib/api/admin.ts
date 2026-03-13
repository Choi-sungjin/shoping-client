import { api } from "@/lib/api"
import type { Order, OrderStatus } from "@/lib/types"

export const adminApi = {
  getAllOrders: async (status?: OrderStatus) => {
    const res = await api.get<{ success: true; data: { orders: Order[] } }>("/api/admin/orders", {
      params: status ? { status } : undefined,
    })
    return res.data.data.orders
  },

  updateOrderStatus: async (orderId: string, status: OrderStatus) => {
    const res = await api.patch<{ success: true; data: { order: Order } }>(
      `/api/admin/orders/${orderId}/status`,
      { status }
    )
    return res.data.data.order
  },
}
