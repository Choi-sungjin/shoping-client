/**
 * 상품 원가(price)와 할인(discount)으로 실제 판매가를 계산합니다.
 * 할인 해제 시 원가로 복귀할 수 있도록 서버에서는 price를 원가로 두고 discount만 저장합니다.
 */
export type ProductWithDiscount = {
  price: number
  discount?: { type?: "percent" | "fixed"; value?: number } | null
}

export function getSellingPrice(product: ProductWithDiscount | null | undefined): number {
  if (!product || typeof product.price !== "number") return 0
  const discount = product.discount
  if (!discount || discount.value == null || Number(discount.value) === 0) {
    return product.price
  }
  const value = Number(discount.value)
  if (discount.type === "percent") {
    return Math.round(product.price * (1 - value / 100))
  }
  return Math.max(0, product.price - value)
}
