import { api } from "@/lib/api"
import type { Order, ShippingInfo, PaymentInfo } from "@/lib/types"

export const ordersApi = {
  createOrder: async (shippingInfo: ShippingInfo, paymentInfo: PaymentInfo) => {
    const res = await api.post<{ success: true; data: { order: Order } }>("/api/orders", {
      shippingInfo,
      paymentInfo,
    })
    return res.data.data.order
  },

  getMyOrders: async () => {
    const res = await api.get<{ success: true; data: { orders: Order[] } }>("/api/orders/my")
    return res.data.data.orders
  },

  getOrderById: async (id: string) => {
    const res = await api.get<{ success: true; data: { order: Order } }>(`/api/orders/${id}`)
    return res.data.data.order
  },
}
