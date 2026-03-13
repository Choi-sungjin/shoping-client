"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

const ADMIN_NAV = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Products", href: "/admin/products" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Content", href: "/admin/content" },
]

export function AdminHeader() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-serif text-xl tracking-widest text-foreground">
            NOIR
          </Link>
          <span className="text-xs tracking-[0.28em] uppercase text-muted-foreground border border-border px-2 py-0.5">
            Admin
          </span>
          <nav className="hidden md:flex items-center gap-4">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-xs tracking-widest uppercase transition-colors ${
                  pathname?.startsWith(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user?.name ? (
            <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[100px]">
              {user.name}
            </span>
          ) : null}
          <Link
            href="/"
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Storefront
          </Link>
          <button
            onClick={logout}
            className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
