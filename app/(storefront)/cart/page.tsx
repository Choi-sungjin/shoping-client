"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { CART_UPDATED_EVENT } from "@/components/layout/Navbar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatKRW } from "@/lib/format"
import { getSellingPrice } from "@/lib/productPrice"
import type { CartItem } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

export default function CartPage() {
  const router = useRouter()
  const { token, loading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [fetching, setFetching] = useState(true)
  const [busyItemId, setBusyItemId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!token) {
      router.replace("/auth/login?next=/cart")
      return
    }
  }, [loading, router, token])

  useEffect(() => {
    if (!token) return

    let mounted = true
    const fetchCart = async () => {
      try {
        setFetching(true)
        setError(null)

        const response = await fetch(`${API_BASE_URL}/api/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "장바구니를 불러오지 못했습니다.")
        }

        if (!mounted) return
        setItems(data.data.items ?? [])
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "장바구니를 불러오지 못했습니다.")
      } finally {
        if (mounted) setFetching(false)
      }
    }

    fetchCart()
    return () => {
      mounted = false
    }
  }, [token])

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + ((item.unitPriceSnapshot ?? getSellingPrice(item.product ?? undefined) ?? 0) * item.quantity),
        0
      ),
    [items]
  )
  const shippingFee = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + ((item.product?.shipping?.fee ?? item.product?.shippingFee ?? item.unitShippingFeeSnapshot ?? item.productSnapshot?.shippingFee ?? 0) * item.quantity),
        0
      ),
    [items]
  )
  const total = subtotal + shippingFee

  const updateQuantity = async (item: CartItem, nextQty: number) => {
    if (!token) return
    if (nextQty < 1) return

    try {
      setBusyItemId(item._id)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/cart/${item._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: nextQty }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "수량 변경에 실패했습니다.")
      }

      setItems((current) =>
        current.map((currentItem) => (currentItem._id === item._id ? data.data.item : currentItem))
      )
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT))
    } catch (err) {
      setError(err instanceof Error ? err.message : "수량 변경에 실패했습니다.")
    } finally {
      setBusyItemId(null)
    }
  }

  const removeItem = async (itemId: string) => {
    if (!token) return

    try {
      setBusyItemId(itemId)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/cart/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "상품 삭제에 실패했습니다.")
      }

      setItems((current) => current.filter((item) => item._id !== itemId))
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT))
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품 삭제에 실패했습니다.")
    } finally {
      setBusyItemId(null)
    }
  }

  const clearCart = async () => {
    if (!token || items.length === 0) return

    try {
      setClearing(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "장바구니 비우기에 실패했습니다.")
      }

      setItems([])
      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT))
    } catch (err) {
      setError(err instanceof Error ? err.message : "장바구니 비우기에 실패했습니다.")
    } finally {
      setClearing(false)
    }
  }

  if (loading || (token && fetching)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <h1 className="font-serif text-3xl mb-8">Shopping Bag</h1>
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4 border border-border p-4">
                  <Skeleton className="w-20 h-24 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4 border border-border p-6 h-fit">
              <h2 className="text-sm tracking-widest uppercase">Order Summary</h2>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="border-t border-border pt-4">
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!loading && !token) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="font-serif text-3xl">Shopping Bag</h1>
          <Button
            variant="outline"
            onClick={clearCart}
            disabled={items.length === 0 || clearing}
            className="text-xs tracking-widest uppercase"
          >
            {clearing ? "비우는 중..." : "장바구니 비우기"}
          </Button>
        </div>

        {error ? (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            {items.length === 0 ? (
              <div className="border border-border p-10 text-center space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full border border-border flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">장바구니가 비어 있습니다.</p>
                <Button asChild variant="outline">
                  <Link href="/">상품 보러 가기</Link>
                </Button>
              </div>
            ) : (
              items.map((item) => {
                const unitPrice = item.unitPriceSnapshot ?? getSellingPrice(item.product ?? undefined) ?? 0
                const name = item.product?.name || item.productSnapshot?.name || "상품명 없음"
                const category = item.product?.category || item.productSnapshot?.category || "Uncategorized"
                const image = item.product?.images?.[0] || item.productSnapshot?.image || ""
                const isActive = item.product?.isActive ?? item.productSnapshot?.isActive ?? true
                const stock = item.product?.stock ?? 999
                const isBusy = busyItemId === item._id

                return (
                  <div key={item._id} className="flex gap-4 border border-border p-4">
                    <div className="w-20 h-24 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
                      {image ? (
                        <img src={image} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          NO IMG
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <p className="text-xs tracking-[0.24em] uppercase text-muted-foreground">{category}</p>
                      <p className="text-sm text-foreground">{name}</p>
                      {!isActive ? (
                        <p className="text-xs text-destructive">현재 비활성 상품입니다.</p>
                      ) : null}

                      <div className="flex items-center justify-between gap-4">
                        <div className="inline-flex items-center border border-border">
                          <button
                            type="button"
                            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                            onClick={() => updateQuantity(item, item.quantity - 1)}
                            disabled={isBusy || item.quantity <= 1}
                            aria-label="수량 감소"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <div className="w-10 h-9 flex items-center justify-center border-x border-border text-sm">
                            {item.quantity}
                          </div>
                          <button
                            type="button"
                            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-40"
                            onClick={() => updateQuantity(item, item.quantity + 1)}
                            disabled={isBusy || item.quantity >= stock}
                            aria-label="수량 증가"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-foreground">{formatKRW(unitPrice * item.quantity)}</p>
                          <button
                            type="button"
                            onClick={() => removeItem(item._id)}
                            disabled={isBusy}
                            className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="space-y-4 border border-border p-6 h-fit bg-card/50">
            <h2 className="text-sm tracking-widest uppercase">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>상품 금액</span>
                <span>{formatKRW(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>배송비</span>
                <span>{formatKRW(shippingFee)}</span>
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex justify-between text-base">
                <span>총 결제 금액</span>
                <span>{formatKRW(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className={`block w-full text-center py-3 text-xs tracking-widest uppercase transition-colors ${
                items.length === 0
                  ? "bg-secondary text-muted-foreground pointer-events-none"
                  : "bg-foreground text-background hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
