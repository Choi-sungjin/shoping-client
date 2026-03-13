"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, PackageCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { formatKRW } from "@/lib/format"
import type { Order, OrderStatus } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "주문 접수",
  paid: "결제 완료",
  shipping: "배송 중",
  done: "배송 완료",
  cancelled: "주문 취소",
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "border-yellow-500/40 text-yellow-500",
  paid: "border-blue-400/40 text-blue-400",
  shipping: "border-purple-400/40 text-purple-400",
  done: "border-accent/40 text-accent",
  cancelled: "border-destructive/40 text-destructive",
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function MyOrdersPage() {
  const router = useRouter()
  const { token, loading } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async (accessToken: string) => {
    try {
      setFetching(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "주문 내역을 불러오지 못했습니다.")
      }

      setOrders(Array.isArray(data.data?.orders) ? data.data.orders : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 내역을 불러오지 못했습니다.")
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!token) {
      router.replace("/auth/login?next=/my/orders")
      return
    }

    fetchOrders(token)
  }, [loading, router, token])

  const totalCount = useMemo(() => orders.length, [orders])

  if (loading || (token && fetching)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <h1 className="font-serif text-3xl mb-8">My Orders</h1>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border border-border p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <div className="flex justify-between items-center border-t border-border pt-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
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
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Account</p>
            <h1 className="font-serif text-3xl">My Orders</h1>
          </div>
          <p className="text-sm text-muted-foreground">총 {totalCount}건</p>
        </div>

        {error ? (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => {
                if (token) fetchOrders(token)
              }}
              className="mt-2 inline-flex text-xs tracking-widest uppercase underline underline-offset-4"
            >
              다시 시도
            </button>
          </div>
        ) : null}

        {orders.length === 0 && !error ? (
          <div className="border border-border p-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full border border-border flex items-center justify-center">
              <PackageCheck className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">아직 주문 내역이 없습니다.</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
            >
              상품 보러 가기
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemPreview = order.items.slice(0, 2)
              const extraCount = Math.max(0, order.items.length - itemPreview.length)

              return (
                <Link
                  key={order._id}
                  href={`/order/success?orderId=${order._id}`}
                  className="block border border-border bg-card/50 p-6 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs tracking-[0.24em] uppercase text-muted-foreground">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <span
                      className={`inline-flex px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase border ${
                        STATUS_STYLE[order.status as OrderStatus] ?? "border-border text-muted-foreground"
                      }`}
                    >
                      {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                    {itemPreview.map((item, index) => (
                      <p key={`${order._id}-${index}`}>
                        {item.name} · {item.qty}개
                      </p>
                    ))}
                    {extraCount > 0 ? <p>외 {extraCount}개 상품</p> : null}
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                    <span className="text-sm text-muted-foreground">총 결제 금액</span>
                    <span className="text-base text-foreground">{formatKRW(order.totalAmount)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
