"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, Search, User, Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { LOGOUT_HOVER_EVENT, LOGOUT_CLICK_EVENT } from "@/components/observer-robot"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

/** 장바구니 개수 갱신용 이벤트 (상품 담기/장바구니 페이지에서 dispatch) */
export const CART_UPDATED_EVENT = "cart-updated"

type CategoryItem = {
  _id: string
  name: string
  isVisible: boolean
  sortOrder: number
}

const STATIC_FIRST: { label: string; href: string }[] = [
  { label: "New Arrivals", href: "/?category=New%20Arrivals#collections" },
]

function dispatchLogoutHover(active: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOGOUT_HOVER_EVENT, { detail: { active } }))
  }
}

function dispatchLogoutClick() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOGOUT_CLICK_EVENT))
  }
}

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [navItems, setNavItems] = useState(STATIC_FIRST)
  const [cartCount, setCartCount] = useState(0)
  const { isAuthenticated, user, logout, loading, token } = useAuth()

  const fetchCartCount = useCallback(async () => {
    if (!token) {
      setCartCount(0)
      return
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok || !data?.success) return
      const items = data.data?.items ?? []
      const total = items.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity ?? 0), 0)
      setCartCount(total)
    } catch {
      setCartCount(0)
    }
  }, [token])

  useEffect(() => {
    fetchCartCount()
  }, [fetchCartCount])

  useEffect(() => {
    const onCartUpdated = () => fetchCartCount()
    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated)
    return () => window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated)
  }, [fetchCartCount])

  useEffect(() => {
    let mounted = true

    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/categories`, { cache: "no-store" })
        const data = await res.json()
        if (!res.ok || !data?.success || !mounted) return

        const items: CategoryItem[] = data.data?.items ?? []
        const categoryLinks = items
          .filter((c) => c.isVisible)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((c) => ({
            label: c.name,
            href: `/?category=${encodeURIComponent(c.name)}#collections`,
          }))

        setNavItems([...STATIC_FIRST, ...categoryLinks])
      } catch {
        // 정적 목록 유지
      }
    }

    fetchCategories()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/60 backdrop-blur-xl border-b border-border">

      {/* ── 데스크탑 바: 3열 grid ────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 h-16 grid grid-cols-[auto_1fr_auto] items-center gap-4">

        {/* 좌: 햄버거 + 로고 */}
        <div className="flex items-center gap-4">
          <button
            className="lg:hidden text-foreground"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="font-serif text-2xl tracking-widest text-foreground">
            NOIR
          </Link>
        </div>

        {/* 중앙: 카테고리 nav (스크롤 가능, 넘쳐도 우측 밀리지 않음) */}
        <nav className="hidden lg:flex items-center gap-6 overflow-x-auto
                        [scrollbar-width:none] [-ms-overflow-style:none]
                        [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="shrink-0 text-xs tracking-widest uppercase text-muted-foreground
                         hover:text-foreground transition-colors duration-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 우: 검색 / Login / 장바구니 — 절대 밀리지 않음 */}
        <div className="flex items-center gap-4">
          <button
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    href="/admin/products"
                    className="hidden md:inline text-xs tracking-wider uppercase
                               text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/my/orders"
                  className="hidden md:inline text-xs text-muted-foreground
                             hover:text-foreground transition-colors max-w-[80px] truncate"
                >
                  {user?.name}
                </Link>
                <button
                  onClick={() => {
                    dispatchLogoutHover(false)
                    dispatchLogoutClick()
                    logout()
                  }}
                  onMouseEnter={() => dispatchLogoutHover(true)}
                  onMouseLeave={() => dispatchLogoutHover(false)}
                  className="text-xs tracking-wider uppercase text-muted-foreground
                             hover:text-foreground transition-colors duration-200"
                >
                  Logout
                </button>
              </>
            ) : loading ? (
              <div className="w-12 h-4" />
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-muted-foreground
                           hover:text-foreground transition-colors"
                aria-label="Login"
              >
                <User className="w-4 h-4" />
                <span className="text-xs tracking-widest uppercase">Login</span>
              </Link>
            )}
          </div>

          <Link
            href="/cart"
            className="relative inline-flex text-muted-foreground hover:text-foreground transition-colors"
            aria-label={cartCount > 0 ? `장바구니 ${cartCount}개` : "장바구니"}
          >
            <ShoppingBag className="w-4 h-4" />
            {cartCount > 0 ? (
              <span className="absolute -top-2.5 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </div>

      {/* ── 모바일 드로어 ─────────────────────────────────────────────────────── */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm tracking-widest uppercase text-muted-foreground
                           hover:text-foreground transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="border-t border-border pt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/my/orders"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                  {user?.role === "admin" && (
                    <Link
                      href="/admin/products"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      dispatchLogoutHover(false)
                      dispatchLogoutClick()
                      logout()
                      setMenuOpen(false)
                    }}
                    onMouseEnter={() => dispatchLogoutHover(true)}
                    onMouseLeave={() => dispatchLogoutHover(false)}
                    className="text-sm text-left text-muted-foreground
                               hover:text-foreground transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
              <Link
                href="/cart"
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                onClick={() => setMenuOpen(false)}
              >
                Cart
                {cartCount > 0 ? (
                  <span className="rounded-full bg-foreground px-2 py-0.5 text-xs font-bold text-background">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
