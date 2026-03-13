"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronRight, PackageCheck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatKRW } from "@/lib/format"
import type { Order } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const statusLabel: Record<string, string> = {
  pending: "주문 접수",
  paid: "결제 완료",
  shipping: "배송 중",
  done: "배송 완료",
  cancelled: "주문 취소",
}

function OrderSuccessPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { token, loading } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const orderId = searchParams.get("orderId")

  useEffect(() => {
    if (loading) return

    if (!token) {
      router.replace("/auth/login")
      return
    }

    if (!orderId) {
      setError("주문 번호가 없습니다.")
      setFetching(false)
      return
    }

    let mounted = true

    const fetchOrder = async () => {
      try {
        setFetching(true)
        setError(null)

        const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "주문 정보를 불러오지 못했습니다.")
        }

        if (!mounted) return
        setOrder(data.data.order)
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "주문 정보를 불러오지 못했습니다.")
      } finally {
        if (mounted) setFetching(false)
      }
    }

    fetchOrder()

    return () => {
      mounted = false
    }
  }, [loading, orderId, router, token])

  const itemCount = useMemo(
    () => order?.items.reduce((sum, item) => sum + item.qty, 0) ?? 0,
    [order]
  )

  if (loading || fetching) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <div className="space-y-8">
            <Skeleton className="h-14 w-14 rounded-full" />
            <Skeleton className="h-10 w-72" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24 flex items-center justify-center">
        <div className="text-center space-y-8 max-w-lg px-6">
          <div className="w-16 h-16 rounded-full border border-border flex items-center justify-center mx-auto">
            <PackageCheck className="w-7 h-7 text-muted-foreground" />
          </div>
          <div>
            <h1 className="font-serif text-3xl mb-3">주문 완료 정보를 확인할 수 없습니다</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {error || "주문은 생성되었을 수 있으니 주문 내역에서 다시 확인해 주세요."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/my/orders">내 주문 보기</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">홈으로 이동</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="space-y-10">
          <div className="text-center space-y-6">
            <div className="w-[4.5rem] h-[4.5rem] rounded-full border border-border flex items-center justify-center mx-auto bg-card/50">
              <Check className="w-8 h-8 text-foreground" />
            </div>

            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Order Complete</p>
              <h1 className="font-serif text-4xl md:text-5xl mb-4">주문이 정상적으로 접수되었습니다</h1>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                주문 번호 <span className="text-foreground font-medium">{order._id}</span> 로 접수되었으며,
                준비가 시작되면 상태가 업데이트됩니다.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="border border-border bg-card/50 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs tracking-widest uppercase">주문 요약</h2>
                <span className="text-xs tracking-[0.24em] uppercase text-accent">
                  {statusLabel[order.status] || order.status}
                </span>
              </div>

              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">수량 {item.qty}</p>
                    </div>
                    <p className="text-sm text-foreground">{formatKRW(item.price * item.qty)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>총 상품 수</span>
                  <span>{itemCount}개</span>
                </div>
                {typeof order.subtotalAmount === "number" && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>상품 금액</span>
                    <span>{formatKRW(order.subtotalAmount)}</span>
                  </div>
                )}
                {typeof order.shippingFee === "number" && order.shippingFee > 0 && (
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>배송비</span>
                    <span>{formatKRW(order.shippingFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-foreground">
                  <span>총 결제 금액</span>
                  <span>{formatKRW(order.totalAmount)}</span>
                </div>
              </div>
            </section>

            <section className="border border-border bg-card/50 p-6 space-y-5">
              <h2 className="text-xs tracking-widest uppercase">배송 및 결제 정보</h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-6">
                  <span className="text-muted-foreground">수령인</span>
                  <span className="text-right">{order.shippingInfo.recipientName}</span>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-muted-foreground">연락처</span>
                  <span className="text-right">{order.shippingInfo.phone}</span>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-muted-foreground">주소</span>
                  <span className="text-right max-w-[240px]">{order.shippingInfo.address}</span>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-muted-foreground">우편번호</span>
                  <span className="text-right">{order.shippingInfo.postalCode || "-"}</span>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-muted-foreground">결제 수단</span>
                  <span className="text-right">{order.paymentInfo.method}</span>
                </div>
                <div className="flex items-start justify-between gap-6">
                  <span className="text-muted-foreground">거래 번호</span>
                  <span className="text-right break-all max-w-[240px]">{order.paymentInfo.transactionId}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/my/orders">
                내 주문 보기
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">쇼핑 계속하기</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground pt-24" />}>
      <OrderSuccessPageContent />
    </Suspense>
  )
}
