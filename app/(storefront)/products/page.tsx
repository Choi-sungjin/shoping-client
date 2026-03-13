"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, RotateCcw, Search } from "lucide-react"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Skeleton } from "@/components/ui/skeleton"
import { getSellingPrice } from "@/lib/productPrice"
import type { Pagination, Product } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const DEFAULT_LIMIT = 12

const SORT_OPTIONS = [
  { value: "createdAtDesc", label: "최신순" },
  { value: "priceAsc", label: "가격 낮은순" },
  { value: "priceDesc", label: "가격 높은순" },
  { value: "nameAsc", label: "이름 오름차순" },
  { value: "nameDesc", label: "이름 내림차순" },
]

type CategoryItem = {
  _id: string
  name: string
  isVisible: boolean
  sortOrder: number
}

function getInitialPage(rawPage: string | null) {
  const parsed = Number(rawPage || "")
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function ProductsPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "")
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "")
  const [sort, setSort] = useState(searchParams.get("sort") || "createdAtDesc")
  const [page, setPage] = useState(getInitialPage(searchParams.get("page")))

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "")
    setSearchQuery(searchParams.get("search") || "")
    setSelectedCategory(searchParams.get("category") || "")
    setSort(searchParams.get("sort") || "createdAtDesc")
    setPage(getInitialPage(searchParams.get("page")))
  }, [searchParams])

  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("search", searchQuery)
    if (selectedCategory) params.set("category", selectedCategory)
    if (sort && sort !== "createdAtDesc") params.set("sort", sort)
    if (page > 1) params.set("page", String(page))

    const query = params.toString()
    const nextUrl = query ? `${pathname}?${query}` : pathname
    router.replace(nextUrl, { scroll: false })
  }, [page, pathname, router, searchQuery, selectedCategory, sort])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        cache: "no-store",
      })
      const data = await response.json()
      if (!response.ok || !data?.success) return
      setCategories(Array.isArray(data.data?.items) ? data.data.items : [])
    } catch {
      // 카테고리 fetch 실패 시 상품 데이터 기준으로 fallback
    }
  }

  const fetchProducts = async () => {
    try {
      setFetching(true)
      setError(null)

      const params = new URLSearchParams()
      params.set("limit", String(DEFAULT_LIMIT))
      params.set("page", String(page))
      if (searchQuery) params.set("search", searchQuery)
      if (selectedCategory) params.set("category", selectedCategory)
      if (sort) params.set("sort", sort)

      const response = await fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
        cache: "no-store",
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "상품 목록을 불러오지 못했습니다.")
      }

      setProducts(Array.isArray(data.data?.items) ? data.data.items : [])
      setPagination(data.data?.pagination ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "상품 목록을 불러오지 못했습니다.")
      setProducts([])
      setPagination(null)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, searchQuery, selectedCategory, sort])

  const categoryOptions = useMemo(() => {
    const fromApi = categories
      .filter((item) => item.isVisible)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((item) => item.name)

    const fromProducts = products
      .flatMap((item) => (item.categories?.length ? item.categories : item.category ? [item.category] : []))
      .filter(Boolean) as string[]

    return Array.from(new Set([...fromApi, ...fromProducts]))
  }, [categories, products])

  const totalPages = pagination?.totalPages ?? 1
  const currentSortLabel = SORT_OPTIONS.find((option) => option.value === sort)?.label ?? "최신순"

  const pageNumbers = useMemo(() => {
    const size = 5
    const start = Math.max(1, page - Math.floor(size / 2))
    const end = Math.min(totalPages, start + size - 1)
    const adjustedStart = Math.max(1, end - size + 1)
    const result: number[] = []
    for (let value = adjustedStart; value <= end; value += 1) result.push(value)
    return result
  }, [page, totalPages])

  const applySearch = () => {
    setPage(1)
    setSearchQuery(searchInput.trim())
  }

  const clearFilters = () => {
    setSearchInput("")
    setSearchQuery("")
    setSelectedCategory("")
    setSort("createdAtDesc")
    setPage(1)
  }

  const showFilterSummary = Boolean(searchQuery || selectedCategory || sort !== "createdAtDesc")

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Storefront</p>
          <h1 className="font-serif text-4xl">All Products</h1>
        </div>

        <section className="mb-6 border border-border bg-card/50 p-4 md:p-5">
          <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch()
                }}
                placeholder="상품명 검색"
                className="h-11 w-full border border-border bg-background pl-10 pr-3 text-sm"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => {
                setSelectedCategory(event.target.value)
                setPage(1)
              }}
              className="h-11 border border-border bg-background px-3 text-sm"
            >
              <option value="">전체 카테고리</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value)
                setPage(1)
              }}
              className="h-11 border border-border bg-background px-3 text-sm"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={applySearch}
                className="h-11 border border-foreground bg-foreground px-4 text-xs tracking-widest uppercase text-background"
              >
                검색
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 border border-border px-4 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground"
              >
                초기화
              </button>
            </div>
          </div>

          {showFilterSummary ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="tracking-[0.2em] uppercase">적용 필터</span>
              {searchQuery ? (
                <span className="border border-border px-2 py-1">검색어: {searchQuery}</span>
              ) : null}
              {selectedCategory ? (
                <span className="border border-border px-2 py-1">카테고리: {selectedCategory}</span>
              ) : null}
              {sort !== "createdAtDesc" ? (
                <span className="border border-border px-2 py-1">정렬: {currentSortLabel}</span>
              ) : null}
            </div>
          ) : null}
        </section>

        {error ? (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchProducts}
              className="mt-2 inline-flex items-center gap-1 text-xs tracking-widest uppercase underline underline-offset-4"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              다시 시도
            </button>
          </div>
        ) : null}

        {fetching ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="border border-border p-10 text-center space-y-4">
            <p className="text-sm text-muted-foreground">조건에 맞는 상품이 없습니다.</p>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="border border-border px-4 py-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground"
              >
                필터 초기화
              </button>
              <Link
                href="/"
                className="border border-border px-4 py-2 text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground"
              >
                홈으로
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              총 {pagination?.total ?? products.length}개 상품
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product) => {
                const categories = product.categories?.length
                  ? product.categories
                  : product.category
                    ? [product.category]
                    : []

                return (
                  <ProductCard
                    key={product._id}
                    product={{
                      id: product._id,
                      name: product.name,
                      category: categories[0] || "Uncategorized",
                      categories,
                      price: getSellingPrice(product),
                      image: product.images?.[0] || "/images/product-1.jpg",
                    }}
                  />
                )
              })}
            </div>

            {totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="h-9 border border-border px-3 text-xs tracking-widest uppercase text-muted-foreground disabled:opacity-40"
                >
                  이전
                </button>
                {pageNumbers.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPage(value)}
                    className={`h-9 min-w-9 border px-3 text-xs ${
                      value === page
                        ? "border-foreground bg-foreground text-background"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {value}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  className="h-9 border border-border px-3 text-xs tracking-widest uppercase text-muted-foreground disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background text-foreground pt-24" />}>
      <ProductsPageContent />
    </Suspense>
  )
}
