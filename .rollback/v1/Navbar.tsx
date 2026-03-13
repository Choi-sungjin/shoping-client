"use client"

import { useState } from "react"
import Link from "next/link"
import { ShoppingBag, Search, User, Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { isAuthenticated, user, logout, loading } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/60 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
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
          <nav className="hidden lg:flex items-center gap-8">
            {["New Arrivals", "Collections", "Designers", "Sale"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                {item}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <button className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Search">
            <Search className="w-4 h-4" />
          </button>

          {loading ? null : isAuthenticated ? (
            <div className="flex items-center gap-3">
              {user?.role === "admin" && (
                <Link
                  href="/admin/products"
                  className="text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors hidden md:inline"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/my/orders"
                className="hidden md:inline text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {user?.name}
              </Link>
              <button
                onClick={logout}
                className="text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Account"
            >
              <User className="w-4 h-4" />
            </Link>
          )}

          <Link
            href="/cart"
            className="relative text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Shopping bag"
          >
            <ShoppingBag className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <nav className="lg:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="container mx-auto px-6 py-6 flex flex-col gap-4">
            {["New Arrivals", "Collections", "Designers", "Sale"].map((item) => (
              <Link
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              {isAuthenticated ? (
                <>
                  <Link href="/my/orders" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                    My Orders
                  </Link>
                  {user?.role === "admin" && (
                    <Link href="/admin/products" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      logout()
                      setMenuOpen(false)
                    }}
                    className="text-sm text-left text-muted-foreground hover:text-foreground transition-colors duration-300"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/auth/signup" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
              <Link href="/cart" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(false)}>
                Cart
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
