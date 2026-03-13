"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Truck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { formatKRW } from "@/lib/format"
import { getSellingPrice } from "@/lib/productPrice"
import type { CartItem } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const PORTONE_STORE_ID = process.env.NEXT_PUBLIC_PORTONE_STORE_ID || ""
const PORTONE_CHANNEL_KEY = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || ""
const PORTONE_SDK_SRC = "https://cdn.portone.io/v2/browser-sdk.js"

type CheckoutForm = {
  recipientName: string
  address: string
  postalCode: string
  phone: string
  paymentMethod: string
}

const defaultForm: CheckoutForm = {
  recipientName: "",
  address: "",
  postalCode: "",
  phone: "",
  paymentMethod: "card",
}

type PreparedPayment = {
  paymentId: string
  amount: number
  orderName: string
  payMethod: "CARD" | "TRANSFER"
  currency: "CURRENCY_KRW"
  storeId?: string
  channelKey?: string
  customer: {
    fullName: string
    email: string
    phoneNumber?: string
  }
}

type PortOneV2Response = {
  paymentId?: string
  code?: string
  message?: string
}

declare global {
  interface Window {
    PortOne?: {
      requestPayment: (params: Record<string, unknown>) => Promise<PortOneV2Response>
    }
  }
}

const loadPortOneSdk = async () => {
  if (typeof window === "undefined") return
  if (window.PortOne) return

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${PORTONE_SDK_SRC}"]`)
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("결제 SDK 로드에 실패했습니다.")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = PORTONE_SDK_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("결제 SDK 로드에 실패했습니다."))
    document.body.appendChild(script)
  })
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user, token, loading } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [form, setForm] = useState<CheckoutForm>(defaultForm)
  const [fetching, setFetching] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!token) {
      router.replace("/auth/login?next=/checkout")
      return
    }

    setForm((current) => ({
      ...current,
      recipientName: user?.name || current.recipientName,
      address: user?.address || current.address,
      phone: user?.phone || current.phone,
    }))
  }, [loading, router, token, user])

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
        setItems(data.data.items)
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

  useEffect(() => {
    loadPortOneSdk().catch(() => {
      // 버튼 클릭 시 에러 안내
    })
  }, [])

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

  const handlePlaceOrder = async () => {
    if (!token) return

    if (!items.length) {
      setError("장바구니가 비어 있습니다.")
      return
    }

    if (!form.recipientName.trim() || !form.address.trim() || !form.phone.trim()) {
      setError("수령인, 주소, 연락처를 모두 입력해 주세요.")
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const prepareResponse = await fetch(`${API_BASE_URL}/api/payments/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingInfo: {
            recipientName: form.recipientName.trim(),
            address: form.address.trim(),
            postalCode: form.postalCode.trim(),
            phone: form.phone.trim(),
          },
          paymentMethod: form.paymentMethod,
        }),
      })
      const prepareData = await prepareResponse.json()

      if (!prepareResponse.ok || !prepareData?.success) {
        throw new Error(prepareData?.message || "결제 준비에 실패했습니다.")
      }

      if (!window.PortOne) {
        await loadPortOneSdk()
      }

      if (!window.PortOne) {
        throw new Error("결제 SDK가 초기화되지 않았습니다.")
      }

      const preparedPayment = prepareData.data as PreparedPayment
      const resolvedStoreId = preparedPayment.storeId || PORTONE_STORE_ID
      const resolvedChannelKey = preparedPayment.channelKey || PORTONE_CHANNEL_KEY

      if (!resolvedStoreId) {
        throw new Error("NEXT_PUBLIC_PORTONE_STORE_ID 또는 서버 storeId 설정이 필요합니다.")
      }

      if (!resolvedChannelKey) {
        throw new Error("NEXT_PUBLIC_PORTONE_CHANNEL_KEY 또는 서버 channelKey 설정이 필요합니다.")
      }

      const paymentResult = await window.PortOne.requestPayment({
        storeId: resolvedStoreId,
        channelKey: resolvedChannelKey,
        paymentId: preparedPayment.paymentId,
        orderName: preparedPayment.orderName,
        totalAmount: preparedPayment.amount,
        currency: preparedPayment.currency,
        payMethod: preparedPayment.payMethod,
        customer: preparedPayment.customer,
      })

      if (paymentResult?.code) {
        throw new Error(paymentResult.message || "결제가 취소되었거나 실패했습니다.")
      }

      if (!paymentResult?.paymentId) {
        throw new Error("결제 식별자(paymentId)를 받지 못했습니다.")
      }

      const verifyResponse = await fetch(`${API_BASE_URL}/api/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: paymentResult.paymentId,
          paymentMethod: form.paymentMethod,
          shippingInfo: {
            recipientName: form.recipientName.trim(),
            address: form.address.trim(),
            postalCode: form.postalCode.trim(),
            phone: form.phone.trim(),
          },
        }),
      })
      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok || !verifyData?.success) {
        throw new Error(verifyData?.message || "결제 검증 또는 주문 생성에 실패했습니다.")
      }

      router.replace(`/order/success?orderId=${verifyData.data.order._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "결제 처리에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || (token && fetching)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12 max-w-5xl">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Skeleton className="h-8 w-48" />
              {[1, 2, 3, 4, 5].map((item) => (
                <Skeleton key={item} className="h-11 w-full" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-64 w-full" />
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
        <div className="mb-8 flex items-center gap-3 text-xs tracking-[0.28em] uppercase text-muted-foreground">
          <Link href="/cart" className="inline-flex items-center gap-2 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            장바구니로 돌아가기
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12">
          <div className="space-y-10">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Checkout</p>
              <h1 className="font-serif text-4xl">주문 정보 입력</h1>
            </div>

            {error ? (
              <div className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <section className="space-y-5 border border-border bg-card/50 p-6">
              <div className="flex items-center gap-3">
                <Truck className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-xs tracking-widest uppercase">배송 정보</h2>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="recipientName">수령인</Label>
                  <Input
                    id="recipientName"
                    value={form.recipientName}
                    onChange={(e) => setForm((current) => ({ ...current, recipientName: e.target.value }))}
                    placeholder="최성진"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">연락처</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                    placeholder="010-0000-0000"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">주소</Label>
                  <Textarea
                    id="address"
                    rows={4}
                    value={form.address}
                    onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
                    placeholder="서울시 ..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">우편번호</Label>
                  <Input
                    id="postalCode"
                    value={form.postalCode}
                    onChange={(e) => setForm((current) => ({ ...current, postalCode: e.target.value }))}
                    placeholder="00000"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-5 border border-border bg-card/50 p-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-xs tracking-widest uppercase">결제 수단</h2>
              </div>

              <RadioGroup
                value={form.paymentMethod}
                onValueChange={(value) => setForm((current) => ({ ...current, paymentMethod: value }))}
                className="gap-4"
              >
                <label className="flex items-center gap-3 border border-border px-4 py-4 cursor-pointer">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="cursor-pointer">카드 결제</Label>
                </label>
                <label className="flex items-center gap-3 border border-border px-4 py-4 cursor-pointer">
                  <RadioGroupItem value="bank-transfer" id="bank-transfer" />
                  <Label htmlFor="bank-transfer" className="cursor-pointer">계좌 이체</Label>
                </label>
              </RadioGroup>
            </section>

            <Button
              type="button"
              className="w-full h-12 text-xs tracking-[0.24em] uppercase"
              onClick={handlePlaceOrder}
              disabled={submitting || items.length === 0}
            >
              {submitting ? "주문 처리 중..." : "주문 완료하기"}
            </Button>
          </div>

          <div className="space-y-4 border border-border p-6 h-fit bg-card/50">
            <h2 className="text-xs tracking-widest uppercase">주문 요약</h2>

            {items.length === 0 ? (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>장바구니가 비어 있습니다.</p>
                <Button asChild variant="outline">
                  <Link href="/">상품 보러 가기</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item._id} className="flex gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="w-20 h-24 flex-shrink-0 overflow-hidden rounded-sm bg-secondary">
                        {(item.product?.images?.[0] || item.productSnapshot?.image) ? (
                          <img
                            src={item.product?.images?.[0] || item.productSnapshot?.image || ""}
                            alt={item.product?.name || item.productSnapshot?.name || "상품 이미지"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                            NO IMG
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-xs tracking-[0.24em] uppercase text-muted-foreground">
                          {item.product?.category || item.productSnapshot?.category || "Uncategorized"}
                        </p>
                        <p className="text-sm text-foreground">
                          {item.product?.name || item.productSnapshot?.name || "상품명 없음"}
                        </p>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>수량 {item.quantity}</span>
                          <span>{formatKRW(((item.unitPriceSnapshot ?? getSellingPrice(item.product ?? undefined) ?? 0) * item.quantity))}</span>
                        </div>
                        {!item.product?.isActive ? (
                          <p className="text-xs text-destructive">현재 비활성 상품입니다. 주문 시 실패할 수 있습니다.</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>상품 금액</span>
                    <span>{formatKRW(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>배송비</span>
                    <span>{formatKRW(shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base text-foreground border-t border-border pt-3">
                    <span>총 결제 금액</span>
                    <span>{formatKRW(total)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
