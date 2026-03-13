export type AuthUser = {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  phone?: string
  address?: string
  createdAt?: string
  updatedAt?: string
}

export type Product = {
  _id: string
  name: string
  description?: string
  price: number
  discount?: { type?: "percent" | "fixed"; value?: number }
  shipping?: {
    fee?: number
  }
  shippingFee?: number
  stock: number
  category?: string
  categories?: string[]
  images: string[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CartItem = {
  _id: string
  user: string
  product: Product | null
  quantity: number
  currencyCode?: string
  unitPriceSnapshot?: number
  unitShippingFeeSnapshot?: number
  productSnapshot?: {
    name: string
    category?: string
    image?: string
    isActive?: boolean
    shippingFee?: number
  }
  attributes?: Record<string, string>
  lastValidatedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export type OrderItem = {
  product: string
  name: string
  price: number
  qty: number
}

export type ShippingInfo = {
  recipientName: string
  address: string
  phone: string
  postalCode?: string
}

export type PaymentInfo = {
  method: string
  transactionId: string
  merchantUid?: string
  provider?: string
  paidAt?: string
}

export type OrderStatus = "pending" | "paid" | "shipping" | "done" | "cancelled"

export type Order = {
  _id: string
  user: string | AuthUser
  items: OrderItem[]
  /** 상품 금액 합계 (배송비 제외) */
  subtotalAmount?: number
  /** 배송비 합계 (DB 저장) */
  shippingFee?: number
  totalAmount: number
  status: OrderStatus
  shippingInfo: ShippingInfo
  paymentInfo: PaymentInfo
  createdAt: string
  updatedAt: string
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ApiSuccess<T> = {
  success: true
  data: T
  message?: string
}

export type ApiError = {
  success: false
  message: string
  code?: string
  details?: unknown
}
