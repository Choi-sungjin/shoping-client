"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Package, ShoppingBag, TrendingUp, Truck } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { formatKRW } from "@/lib/format"
import type { Order, OrderStatus } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "미결제",
  paid: "결제완료",
  shipping: "배송중",
  done: "배송완료",
  cancelled: "취소",
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "border-yellow-500/40 text-yellow-500",
  paid: "border-blue-400/40 text-blue-400",
  shipping: "border-purple-400/40 text-purple-400",
  done: "border-accent/40 text-accent",
  cancelled: "border-destructive/40 text-destructive",
}

type LowStockProduct = {
  _id: string
  name: string
  stock: number
  images?: string[]
}

type DashboardSummary = {
  todayOrderCount: number
  totalOrderCount: number
  pendingCount: number
  shippingCount: number
  todayRevenue: number
  totalRevenue: number
  lowStockCount: number
  totalActiveProducts: number
}

type DashboardData = {
  summary: DashboardSummary
  lowStockProducts: LowStockProduct[]
  recentOrders: Order[]
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-md border ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card/60"} px-5 py-4`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-widest uppercase text-muted-foreground mb-1">{label}</p>
          <p className={`text-2xl font-semibold ${accent ? "text-primary" : ""}`}>{value}</p>
          {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${accent ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

function getUserName(order: Order): string {
  if (!order.user) return "-"
  if (typeof order.user === "string") return order.user.slice(-6)
  return order.user.name || order.user.email || "-"
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, token, loading } = useAuth()

  const [data, setData] = useState<DashboardData | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    if (!token) {
      router.replace("/auth/login?next=/admin/dashboard")
      return
    }
    if (user?.role !== "admin") router.replace("/")
  }, [loading, router, token, user])

  useEffect(() => {
    if (!token || user?.role !== "admin") return
    const fetch_ = async () => {
      try {
        setFetching(true)
        setError(null)
        const res = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        })
        const json = await res.json()
        if (!res.ok || !json?.success) throw new Error(json?.message || "대시보드 데이터를 불러오지 못했습니다.")
        setData(json.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      } finally {
        setFetching(false)
      }
    }
    fetch_()
  }, [token, user])

  if (loading || (token && user?.role === "admin" && fetching)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12 animate-pulse space-y-6">
          <div className="h-10 w-48 bg-secondary" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 bg-secondary" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-80 bg-secondary" />
            <div className="h-80 bg-secondary" />
          </div>
        </div>
      </div>
    )
  }

  if (!loading && user?.role !== "admin") return null

  const s = data?.summary

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">관리자</p>
            <h1 className="font-serif text-3xl md:text-4xl">대시보드</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">주문 관리 →</Link>
            <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground transition-colors">상품 관리 →</Link>
          </div>
        </div>

        {error ? (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {/* 요약 카드 */}
        <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={ShoppingBag}
            label="오늘 주문"
            value={s?.todayOrderCount ?? 0}
            sub={`총 ${s?.totalOrderCount ?? 0}건`}
            accent
          />
          <StatCard
            icon={TrendingUp}
            label="오늘 매출"
            value={formatKRW(s?.todayRevenue ?? 0)}
            sub={`누적 ${formatKRW(s?.totalRevenue ?? 0)}`}
          />
          <StatCard
            icon={Truck}
            label="배송중"
            value={s?.shippingCount ?? 0}
            sub={`미결제 ${s?.pendingCount ?? 0}건`}
          />
          <StatCard
            icon={AlertTriangle}
            label="재고 부족"
            value={s?.lowStockCount ?? 0}
            sub={`활성 상품 ${s?.totalActiveProducts ?? 0}개`}
            accent={(s?.lowStockCount ?? 0) > 0}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 재고 부족 상품 */}
          <div className="rounded-md border border-border bg-card/60">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                재고 부족 상품 (5개 이하)
              </h2>
              <Link href="/admin/products" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                전체 보기 →
              </Link>
            </div>
            {!data?.lowStockProducts?.length ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">재고 부족 상품 없음</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.lowStockProducts.map((p) => (
                  <li key={p._id} className="flex items-center gap-4 px-5 py-3">
                    <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-secondary">
                      {p.images?.[0] ? (
                        <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[9px] text-muted-foreground">없음</div>
                      )}
                    </div>
                    <span className="flex-1 truncate text-sm">{p.name}</span>
                    <span className={`text-sm font-medium ${p.stock === 0 ? "text-destructive" : "text-yellow-500"}`}>
                      {p.stock === 0 ? "품절" : `${p.stock}개`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 최근 주문 */}
          <div className="rounded-md border border-border bg-card/60">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h2 className="text-sm font-medium tracking-widest uppercase text-muted-foreground flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                최근 주문
              </h2>
              <Link href="/admin/orders" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                전체 보기 →
              </Link>
            </div>
            {!data?.recentOrders?.length ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">주문 없음</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recentOrders.map((order) => (
                  <li key={order._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{getUserName(order)}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">{formatKRW(order.totalAmount)}</span>
                    <span className={`inline-flex shrink-0 px-2 py-0.5 text-[10px] tracking-[0.15em] uppercase border ${STATUS_STYLE[order.status as OrderStatus] ?? "border-border text-muted-foreground"}`}>
                      {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
