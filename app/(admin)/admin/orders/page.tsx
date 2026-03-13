"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatKRW } from "@/lib/format"
import type { Order, OrderStatus, Pagination } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const ORDER_STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "pending", label: "미결제" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "배송완료" },
  { value: "cancelled", label: "취소" },
]

const BULK_STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "미결제" },
  { value: "paid", label: "결제완료" },
  { value: "shipping", label: "배송중" },
  { value: "done", label: "배송완료" },
  { value: "cancelled", label: "취소" },
]

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "border-yellow-500/40 text-yellow-500",
  paid: "border-blue-400/40 text-blue-400",
  shipping: "border-purple-400/40 text-purple-400",
  done: "border-accent/40 text-accent",
  cancelled: "border-destructive/40 text-destructive",
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "미결제",
  paid: "결제완료",
  shipping: "배송중",
  done: "배송완료",
  cancelled: "취소",
}

type StatusSummary = {
  all: number
  pending: number
  paid: number
  shipping: number
  done: number
  cancelled: number
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function getUserName(order: Order): string {
  if (!order.user) return "-"
  if (typeof order.user === "string") return order.user
  return order.user.name || order.user.email || "-"
}

export default function AdminOrdersPage() {
  const router = useRouter()
  const { user, token, loading } = useAuth()

  const [orders, setOrders] = useState<Order[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [statusSummary, setStatusSummary] = useState<StatusSummary>({
    all: 0,
    pending: 0,
    paid: 0,
    shipping: 0,
    done: 0,
    cancelled: 0,
  })
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("paid")
  const [bulkApplying, setBulkApplying] = useState(false)

  const [filterStatus, setFilterStatus] = useState("")
  const [filterPaymentMethod, setFilterPaymentMethod] = useState("")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  useEffect(() => {
    if (loading) return
    if (!token) {
      router.replace("/auth/login?next=/admin/orders")
      return
    }
    if (user?.role !== "admin") router.replace("/")
  }, [loading, router, token, user])

  const fetchOrders = async (next?: Partial<{
    status: string
    paymentMethod: string
    dateFrom: string
    dateTo: string
  }>) => {
    if (!token) return
    try {
      setFetching(true)
      setError(null)

      const currentStatus = next?.status ?? filterStatus
      const currentPaymentMethod = next?.paymentMethod ?? filterPaymentMethod
      const currentDateFrom = next?.dateFrom ?? filterDateFrom
      const currentDateTo = next?.dateTo ?? filterDateTo

      const params = new URLSearchParams()
      params.set("limit", "100")
      if (currentStatus) params.set("status", currentStatus)
      if (currentPaymentMethod) params.set("paymentMethod", currentPaymentMethod)
      if (currentDateFrom) params.set("dateFrom", currentDateFrom)
      if (currentDateTo) params.set("dateTo", currentDateTo)

      const response = await fetch(`${API_BASE_URL}/api/admin/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok || !data?.success) throw new Error(data?.message || "주문 목록을 불러오지 못했습니다.")
      setOrders(data.data.orders)
      setPagination(data.data.pagination ?? null)
      if (data.data.statusSummary) {
        setStatusSummary({
          all: Number(data.data.statusSummary.all ?? 0),
          pending: Number(data.data.statusSummary.pending ?? 0),
          paid: Number(data.data.statusSummary.paid ?? 0),
          shipping: Number(data.data.statusSummary.shipping ?? 0),
          done: Number(data.data.statusSummary.done ?? 0),
          cancelled: Number(data.data.statusSummary.cancelled ?? 0),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (token && user?.role === "admin") fetchOrders()
  }, [token, user])

  const applyFilters = () => fetchOrders()

  const resetFilters = () => {
    setFilterStatus("")
    setFilterPaymentMethod("")
    setFilterDateFrom("")
    setFilterDateTo("")
    fetchOrders({ status: "", paymentMethod: "", dateFrom: "", dateTo: "" })
  }

  const toggleSelect = (id: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedOrderIds.size >= orders.length) {
      setSelectedOrderIds(new Set())
    } else {
      setSelectedOrderIds(new Set(orders.map((o) => o._id)))
    }
  }

  const handleBulkStatus = async () => {
    if (!token || selectedOrderIds.size === 0) return
    try {
      setBulkApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/admin/orders/bulk-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderIds: Array.from(selectedOrderIds),
          status: bulkStatus,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) throw new Error(data?.message || "상태 변경에 실패했습니다.")
      const n = selectedOrderIds.size
      const label = BULK_STATUS_OPTIONS.find((o) => o.value === bulkStatus)?.label ?? bulkStatus
      setSelectedOrderIds(new Set())
      await fetchOrders()
      toast.success(`${n}개 주문 상태 → "${label}" 변경 완료`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update order status"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkApplying(false)
    }
  }

  const paymentMethods = useMemo(
    () => Array.from(new Set(orders.map((o) => o.paymentInfo?.method).filter(Boolean))),
    [orders]
  )

  if (loading || (token && user?.role === "admin" && fetching && orders.length === 0)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12 space-y-4 animate-pulse">
          <div className="h-10 w-48 bg-secondary" />
          <div className="h-80 w-full bg-secondary" />
        </div>
      </div>
    )
  }

  if (!loading && user?.role !== "admin") return null

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">관리자</p>
          <h1 className="font-serif text-3xl md:text-4xl">주문 관리</h1>
        </div>

        {error ? (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* 필터 영역 */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/40 px-4 py-3">
          <span className="text-xs tracking-widest uppercase text-muted-foreground">필터</span>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            {ORDER_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">전체 결제수단</option>
            <option value="card">카드</option>
            <option value="trans">계좌이체</option>
            {paymentMethods
              .filter((m) => m !== "card" && m !== "trans")
              .map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
          </select>

          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">기간</label>
            <Input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="h-9 w-36"
            />
            <span className="text-xs text-muted-foreground">~</span>
            <Input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="h-9 w-36"
            />
          </div>

          <Button variant="secondary" size="sm" onClick={applyFilters} className="h-9">
            적용
          </Button>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-muted-foreground">
            초기화
          </Button>

          <span className="ml-auto text-xs text-muted-foreground">
            총 {pagination?.total ?? orders.length}건
          </span>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { key: "", label: "전체", count: statusSummary.all },
            { key: "pending", label: "미결제", count: statusSummary.pending },
            { key: "paid", label: "결제완료", count: statusSummary.paid },
            { key: "shipping", label: "배송중", count: statusSummary.shipping },
            { key: "done", label: "배송완료", count: statusSummary.done },
            { key: "cancelled", label: "취소", count: statusSummary.cancelled },
          ] as { key: string; label: string; count: number }[]).map((tab) => {
            const active = filterStatus === tab.key
            return (
              <Button
                key={tab.label}
                type="button"
                variant={active ? "default" : "outline"}
                className="h-9 gap-2"
                onClick={() => {
                  setFilterStatus(tab.key)
                  fetchOrders({ status: tab.key })
                }}
              >
                <span>{tab.label}</span>
                <span className="text-xs opacity-80">{tab.count}</span>
              </Button>
            )
          })}
        </div>

        {/* 일괄 상태 변경 */}
        {orders.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center justify-end gap-4 rounded-md border-2 border-muted-foreground/25 bg-muted px-4 py-3 shadow-sm">
            <p className="flex min-h-[40px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 text-[16px] shadow-sm tracking-widest uppercase text-muted-foreground">
              주문 상태 일괄 변경
            </p>
            <div className="flex min-h-[40px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 shadow-sm">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                className="h-full bg-transparent text-sm text-foreground focus:ring-0 border-0 py-2"
              >
                {BULK_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <Button
              variant="default"
              onClick={handleBulkStatus}
              disabled={selectedOrderIds.size === 0 || bulkApplying}
              className="min-h-[40px] border-2 border-primary/80 text-[14px] shadow-md"
            >
              {bulkApplying ? "적용 중…" : `선택 주문(${selectedOrderIds.size})에 적용`}
            </Button>
            {selectedOrderIds.size > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrderIds(new Set())}
                className="min-h-[40px]"
              >
                선택 해제
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* 선택 개수 강조 배너 */}
        {selectedOrderIds.size > 0 ? (
          <div className="mb-3 flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="inline-flex items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {selectedOrderIds.size}
            </span>
            <span className="text-sm font-medium">
              {selectedOrderIds.size}개 주문 선택됨 — 위 패널에서 상태를 일괄 변경하세요.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOrderIds(new Set())}
              className="ml-auto h-7 text-xs text-muted-foreground"
            >
              선택 해제
            </Button>
          </div>
        ) : null}

        {/* 주문 목록 */}
        <div className="overflow-hidden border border-border bg-card/60 backdrop-blur-sm">
          <div className="grid grid-cols-[auto_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-border px-6 py-3 text-xs tracking-widest uppercase text-muted-foreground items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                onChange={toggleSelectAll}
                className="rounded border-border"
              />
              <span className="sr-only">전체 선택</span>
            </label>
            <span>주문 번호</span>
            <span>고객명</span>
            <span>결제수단</span>
            <span>결제 금액</span>
            <span>상태</span>
            <span>주문일</span>
          </div>

          {fetching ? (
            <div className="px-6 py-12 text-center text-sm text-muted-foreground animate-pulse">
              불러오는 중…
            </div>
          ) : orders.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              해당 조건의 주문이 없습니다.
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className={`grid grid-cols-[auto_1.2fr_1fr_0.8fr_0.8fr_0.8fr_0.7fr] gap-4 border-b border-border px-6 py-4 last:border-0 items-center transition-colors ${
                  selectedOrderIds.has(order._id) ? "bg-primary/5" : ""
                }`}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedOrderIds.has(order._id)}
                    onChange={() => toggleSelect(order._id)}
                    className="rounded border-border"
                  />
                </label>

                <span className="text-xs font-mono text-muted-foreground truncate" title={order._id}>
                  {order._id.slice(-8).toUpperCase()}
                </span>

                <div>
                  <p className="text-sm">{getUserName(order)}</p>
                  {typeof order.user !== "string" && order.user?.email ? (
                    <p className="text-xs text-muted-foreground truncate">{order.user.email}</p>
                  ) : null}
                </div>

                <span className="text-sm text-muted-foreground">
                  {order.paymentInfo?.method === "trans" ? "계좌이체" : order.paymentInfo?.method === "card" ? "카드" : order.paymentInfo?.method ?? "-"}
                </span>

                <span className="text-sm">{formatKRW(order.totalAmount)}</span>

                <span className={`inline-flex w-fit px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase border ${STATUS_STYLE[order.status as OrderStatus] ?? "border-border text-muted-foreground"}`}>
                  {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                </span>

                <span className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
