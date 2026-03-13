"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, Copy, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { demoProducts } from "@/lib/demo-products"
import { formatKRW } from "@/lib/format"
import { getSellingPrice } from "@/lib/productPrice"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const demoProductNameSet = new Set(demoProducts.map((product) => product.name.trim().toLowerCase()))

type CategoryItem = {
  _id: string
  name: string
  isVisible: boolean
}

type AdminProduct = {
  _id: string
  name: string
  description?: string
  price: number
  discount?: { type?: "percent" | "fixed"; value?: number }
  shipping?: {
    fee?: number
  }
  shippingFee?: number
  stock: number
  category?: string
  categories?: string[]
  images?: string[]
  isActive: boolean
  createdAt?: string
}

type ProductFormState = {
  name: string
  description: string
  categories: string[]
  price: string
  shippingFee: string
  stock: string
  imageUrls: string
  isActive: boolean
}

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  categories: [],
  price: "",
  shippingFee: "0",
  stock: "",
  imageUrls: "",
  isActive: true,
}

function parseImageUrls(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function AdminProductsPage() {
  const router = useRouter()
  const { user, token, loading } = useAuth()
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set())
  const [bulkShippingFee, setBulkShippingFee] = useState("0")
  const [bulkApplying, setBulkApplying] = useState(false)
  const [bulkStock, setBulkStock] = useState("0")
  const [bulkStockApplying, setBulkStockApplying] = useState(false)
  const [bulkDiscountType, setBulkDiscountType] = useState<"percent" | "fixed">("percent")
  const [bulkDiscountValue, setBulkDiscountValue] = useState("0")
  const [bulkDiscountApplying, setBulkDiscountApplying] = useState(false)
  const [bulkCategory, setBulkCategory] = useState("")
  const [bulkCategoryApplying, setBulkCategoryApplying] = useState(false)
  const [bulkActiveApplying, setBulkActiveApplying] = useState(false)
  const [bulkDiscountRemoveApplying, setBulkDiscountRemoveApplying] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("")
  const [sortBy, setSortBy] = useState("createdAtDesc")
  const [lowStockFilter, setLowStockFilter] = useState("")
  const [duplicateTarget, setDuplicateTarget] = useState<AdminProduct | null>(null)
  const [duplicateApplying, setDuplicateApplying] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null)
  const [deleteApplying, setDeleteApplying] = useState(false)

  const applySearch = () => {
    setSearchQuery(searchInput.trim())
  }

  const clearSearch = () => {
    setSearchInput("")
    setSearchQuery("")
  }

  const categoryOptions = useMemo(() => {
    const existingCategories = products
      .flatMap((product) => product.categories?.length ? product.categories : product.category ? [product.category] : [])
      .map((category) => category?.trim())
      .filter((category): category is string => Boolean(category))

    const visibleCategories = categories
      .filter((category) => category.isVisible)
      .map((category) => category.name)

    return Array.from(new Set([...visibleCategories, ...existingCategories]))
  }, [categories, products])

  const hiddenCategoryNames = useMemo(
    () => new Set(categories.filter((category) => !category.isVisible).map((category) => category.name)),
    [categories]
  )

  useEffect(() => {
    if (loading) return

    if (!token) {
      router.replace("/auth/login?next=/admin/products")
      return
    }

    if (user?.role !== "admin") {
      router.replace("/")
    }
  }, [loading, router, token, user])

  useEffect(() => {
    if (!token || user?.role !== "admin") return

    const fetchProducts = async () => {
      try {
        setFetching(true)
        setError(null)

        const params = new URLSearchParams()
        params.set("limit", "100")
        params.set("isActive", "all")
        if (searchQuery.trim()) params.set("search", searchQuery.trim())
        if (filterCategory) params.set("category", filterCategory)
        if (sortBy) params.set("sort", sortBy)
        if (lowStockFilter !== "" && !Number.isNaN(Number(lowStockFilter))) params.set("lowStock", lowStockFilter)

        const [productResponse, categoryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),
          fetch(`${API_BASE_URL}/api/categories?includeHidden=all`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),
        ])

        const [productData, categoryData] = await Promise.all([
          productResponse.json(),
          categoryResponse.json(),
        ])

        if (!productResponse.ok || !productData?.success) {
          throw new Error(productData?.message || "Failed to load products")
        }

        if (!categoryResponse.ok || !categoryData?.success) {
          throw new Error(categoryData?.message || "Failed to load categories")
        }

        setProducts(productData.data.items)
        setCategories(categoryData.data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load products")
      } finally {
        setFetching(false)
      }
    }

    fetchProducts()
  }, [token, user, searchQuery, filterCategory, sortBy, lowStockFilter])

  const openCreateDialog = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (product: AdminProduct) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      description: product.description || "",
      categories: product.categories?.length ? product.categories : product.category ? [product.category] : [],
      price: String(product.price),
      shippingFee: String(product.shipping?.fee ?? product.shippingFee ?? 0),
      stock: String(product.stock),
      imageUrls: (product.images || []).join("\n"),
      isActive: product.isActive,
    })
    setError(null)
    setDialogOpen(true)
  }

  const refreshProducts = async () => {
    if (!token) return

    const params = new URLSearchParams()
    params.set("limit", "100")
    params.set("isActive", "all")
    if (searchQuery.trim()) params.set("search", searchQuery.trim())
    if (filterCategory) params.set("category", filterCategory)
    if (sortBy) params.set("sort", sortBy)
    if (lowStockFilter !== "" && !Number.isNaN(Number(lowStockFilter))) params.set("lowStock", lowStockFilter)

    const [productResponse, categoryResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/products?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }),
      fetch(`${API_BASE_URL}/api/categories?includeHidden=all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      }),
    ])

    const [productData, categoryData] = await Promise.all([
      productResponse.json(),
      categoryResponse.json(),
    ])

    if (!productResponse.ok || !productData?.success) {
      throw new Error(productData?.message || "Failed to refresh products")
    }

    if (!categoryResponse.ok || !categoryData?.success) {
      throw new Error(categoryData?.message || "Failed to refresh categories")
    }

    setProducts(productData.data.items)
    setCategories(categoryData.data.items)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!token) return

    try {
      setSaving(true)
      setError(null)

      const shippingFeeNum = Number(form.shippingFee)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.categories[0] || "",
        categories: form.categories,
        price: Number(form.price),
        shipping: {
          fee: Number.isNaN(shippingFeeNum) || shippingFeeNum < 0 ? 0 : shippingFeeNum,
        },
        stock: Number(form.stock),
        images: parseImageUrls(form.imageUrls),
        isActive: form.isActive,
      }

      if (payload.categories.length === 0) {
        throw new Error("카테고리를 하나 이상 선택해 주세요.")
      }

      const endpoint = editingProduct
        ? `${API_BASE_URL}/api/products/${editingProduct._id}`
        : `${API_BASE_URL}/api/products`

      const method = editingProduct ? "PUT" : "POST"

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save product")
      }

      toast.success(editingProduct ? "상품이 수정되었습니다." : "상품이 등록되었습니다.")
      await refreshProducts()
      setDialogOpen(false)
      setEditingProduct(null)
      setForm(emptyForm)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save product"
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (product: AdminProduct) => {
    setDeleteTarget(product)
  }

  const handleDeleteConfirm = async () => {
    if (!token || !deleteTarget) return
    const removedId = String(deleteTarget._id)
    const name = deleteTarget.name
    try {
      setDeleteApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/${deleteTarget._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "삭제에 실패했습니다.")
      }
      setDeleteTarget(null)
      setProducts((prev) => prev.filter((p) => String(p._id) !== removedId))
      setSelectedProductIds((prev) => {
        const next = new Set(prev)
        next.delete(removedId)
        return next
      })
      toast.success(`"${name}" 상품이 삭제되었습니다.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "삭제에 실패했습니다."
      setError(msg)
      toast.error(msg)
    } finally {
      setDeleteApplying(false)
    }
  }

  const toggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedProductIds.size >= products.length) {
      setSelectedProductIds(new Set())
    } else {
      setSelectedProductIds(new Set(products.map((p) => p._id)))
    }
  }

  const handleBulkApplyShippingFee = async () => {
    if (!token || selectedProductIds.size === 0) return
    const feeNum = Number(bulkShippingFee)
    if (Number.isNaN(feeNum) || feeNum < 0) {
      setError("배송비는 0 이상의 숫자를 입력해 주세요.")
      return
    }
    try {
      setBulkApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-shipping-fee`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          shippingFee: feeNum,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "배송비 일괄 적용에 실패했습니다.")
      }
      const n = selectedProductIds.size
      setSelectedProductIds(new Set())
      await refreshProducts()
      toast.success(`${n}개 상품 배송비 일괄 적용 완료`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply shipping fee"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkApplying(false)
    }
  }

  const handleBulkStock = async () => {
    if (!token || selectedProductIds.size === 0) return
    const stockNum = Number(bulkStock)
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("재고는 0 이상의 숫자를 입력해 주세요.")
      return
    }
    try {
      setBulkStockApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-stock`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          stock: stockNum,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "재고 일괄 적용에 실패했습니다.")
      }
      const n = selectedProductIds.size
      setSelectedProductIds(new Set())
      await refreshProducts()
      toast.success(`${n}개 상품 재고 일괄 적용 완료`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply stock"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkStockApplying(false)
    }
  }

  const handleBulkPriceDiscount = async () => {
    if (!token || selectedProductIds.size === 0) return
    const value = Number(bulkDiscountValue)
    if (Number.isNaN(value) || value < 0) {
      setError("할인 값은 0 이상으로 입력해 주세요.")
      return
    }
    if (bulkDiscountType === "percent" && value > 100) {
      setError("할인율은 100 이하여야 합니다.")
      return
    }
    try {
      setBulkDiscountApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-price-discount`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          discountType: bulkDiscountType,
          discountValue: value,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "가격 일괄 할인에 실패했습니다.")
      }
      const n = selectedProductIds.size
      setSelectedProductIds(new Set())
      await refreshProducts()
      toast.success(`${n}개 상품 가격 할인 적용 완료`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply discount"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkDiscountApplying(false)
    }
  }

  const handleBulkRemoveDiscount = async () => {
    if (!token || selectedProductIds.size === 0) return
    try {
      setBulkDiscountRemoveApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-discount-remove`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productIds: Array.from(selectedProductIds) }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "할인 해제에 실패했습니다.")
      }
      const n = selectedProductIds.size
      setSelectedProductIds(new Set())
      await refreshProducts()
      toast.success(`${n}개 상품 할인 해제 완료 (원가 복원)`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to remove discount"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkDiscountRemoveApplying(false)
    }
  }

  const handleBulkCategory = async () => {
    if (!token || selectedProductIds.size === 0) return
    const cat = bulkCategory.trim()
    if (!cat) {
      setError("카테고리를 선택해 주세요.")
      return
    }
    try {
      setBulkCategoryApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-category`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          categories: [cat],
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "카테고리 일괄 변경에 실패했습니다.")
      }
      const n = selectedProductIds.size
      setSelectedProductIds(new Set())
      await refreshProducts()
      toast.success(`${n}개 상품 카테고리 변경 완료`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to apply category"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkCategoryApplying(false)
    }
  }

  const openDuplicateDialog = (product: AdminProduct) => {
    setDuplicateTarget(product)
  }

  const handleDuplicateConfirm = async () => {
    if (!token || !duplicateTarget) return
    try {
      setDuplicateApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/${duplicateTarget._id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (!response.ok || !data?.success) throw new Error(data?.message || "복제에 실패했습니다.")
      const name = duplicateTarget.name
      setDuplicateTarget(null)
      toast.success(`"${name}" 복제 완료 — 비활성 상태로 추가되었습니다.`)
      await refreshProducts()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to duplicate product"
      setError(msg)
      toast.error(msg)
    } finally {
      setDuplicateApplying(false)
    }
  }

  const handleBulkActive = async (isActive: boolean) => {
    if (!token || selectedProductIds.size === 0) return
    try {
      setBulkActiveApplying(true)
      setError(null)
      const response = await fetch(`${API_BASE_URL}/api/products/bulk-active`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIds: Array.from(selectedProductIds),
          isActive,
        }),
      })
      const data = await response.json()
      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "상품 활성/비활성 처리에 실패했습니다.")
      }
      const n = selectedProductIds.size
      setSelectedProductIds(new Set())
      await refreshProducts()
      toast.success(`${n}개 상품 ${isActive ? "활성" : "비활성"} 처리 완료`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update active"
      setError(msg)
      toast.error(msg)
    } finally {
      setBulkActiveApplying(false)
    }
  }

  if (loading || (token && user?.role === "admin" && fetching)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 bg-secondary" />
            <div className="h-96 w-full bg-secondary" />
          </div>
        </div>
      </div>
    )
  }

  if (!loading && user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">관리자 상품 스튜디오</p>
            <h1 className="font-serif text-3xl md:text-4xl">상품 카탈로그 관리</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
              상품명, 대표 이미지 URL, 설명, 카테고리, 가격, 재고, 활성 상태를 여기서 등록하고 수정합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/content">콘텐츠 CMS</Link>
            </Button>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              상품 추가
            </Button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/40 px-4 py-3">
          <span className="text-xs tracking-widest uppercase text-muted-foreground">목록 관리</span>
          <Input
            type="search"
            placeholder="상품명 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applySearch()}
            className="h-9 w-40"
          />
          <Button variant="secondary" size="sm" onClick={applySearch} className="h-9">
            검색
          </Button>
          {searchQuery ? (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-9 text-muted-foreground">
              검색 초기화
            </Button>
          ) : null}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">전체 카테고리</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="createdAtDesc">최신순</option>
            <option value="createdAtAsc">오래된순</option>
            <option value="nameAsc">이름 가나다순</option>
            <option value="nameDesc">이름 가나다 역순</option>
            <option value="priceAsc">가격 낮은순</option>
            <option value="priceDesc">가격 높은순</option>
            <option value="stockAsc">재고 적은순</option>
            <option value="stockDesc">재고 많은순</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">재고</label>
            <Input
              type="number"
              min="0"
              placeholder="N개 이하"
              value={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.value)}
              className="h-9 w-24"
            />
            <span className="text-xs text-muted-foreground">개 이하만</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedProductIds(new Set())}
            disabled={selectedProductIds.size === 0}
            className="ml-auto"
          >
            전체 선택 해제
          </Button>
        </div>

        {products.length > 0 ? (
          <div className="mb-6 flex flex-col gap-4 rounded-md border-2 border-muted-foreground/25 bg-muted px-4 py-4 shadow-sm">
            {/* 배송비 일괄 적용 */}
            <div className="flex flex-wrap items-stretch justify-end gap-4">
              <p className="flex min-h-[48px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 text-[16px] shadow-sm tracking-widest uppercase text-muted-foreground">
                배송비 일괄 적용
              </p>
              <div className="flex min-h-[48px] items-center gap-2 rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 shadow-sm">
                <label className="text-[16px] text-muted-foreground">금액</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={bulkShippingFee}
                  onChange={(e) => setBulkShippingFee(e.target.value)}
                  placeholder="0"
                  className="h-9 w-28 border-0 bg-transparent text-[38px] font-medium focus-visible:ring-0"
                />
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={handleBulkApplyShippingFee}
                disabled={selectedProductIds.size === 0 || bulkApplying}
                className="min-h-[48px] rounded-md border-2 border-primary/80 px-5 text-[14px] shadow-md hover:opacity-90"
              >
                {bulkApplying ? "적용 중…" : `선택 상품(${selectedProductIds.size})에 일괄 적용`}
              </Button>
            </div>

            {/* 재고 일괄 적용 */}
            <div className="flex flex-wrap items-stretch justify-end gap-4">
              <p className="flex min-h-[48px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 text-[16px] shadow-sm tracking-widest uppercase text-muted-foreground">
                재고 일괄 적용
              </p>
              <div className="flex min-h-[48px] items-center gap-2 rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 shadow-sm">
                <label className="text-[16px] text-muted-foreground">수량</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={bulkStock}
                  onChange={(e) => setBulkStock(e.target.value)}
                  placeholder="0"
                  className="h-9 w-24 border-0 bg-transparent text-[22px] font-medium focus-visible:ring-0"
                />
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={handleBulkStock}
                disabled={selectedProductIds.size === 0 || bulkStockApplying}
                className="min-h-[48px] rounded-md border-2 border-primary/80 px-5 text-[14px] shadow-md hover:opacity-90"
              >
                {bulkStockApplying ? "적용 중…" : `선택 상품(${selectedProductIds.size})에 재고 적용`}
              </Button>
            </div>

            {/* 가격 일괄 할인 */}
            <div className="flex flex-wrap items-stretch justify-end gap-4">
              <p className="flex min-h-[48px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 text-[16px] shadow-sm tracking-widest uppercase text-muted-foreground">
                가격 일괄 할인
              </p>
              <div className="flex min-h-[48px] items-center gap-2 rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 shadow-sm">
                <select
                  value={bulkDiscountType}
                  onChange={(e) => setBulkDiscountType(e.target.value as "percent" | "fixed")}
                  className="h-9 rounded border-0 bg-transparent text-[16px] text-muted-foreground focus:ring-0"
                >
                  <option value="percent">% 할인</option>
                  <option value="fixed">고정 금액 할인</option>
                </select>
                <Input
                  type="number"
                  min="0"
                  max={bulkDiscountType === "percent" ? 100 : undefined}
                  step={bulkDiscountType === "percent" ? 1 : 100}
                  value={bulkDiscountValue}
                  onChange={(e) => setBulkDiscountValue(e.target.value)}
                  placeholder={bulkDiscountType === "percent" ? "10" : "1000"}
                  className="h-9 w-24 border-0 bg-transparent text-[22px] font-medium focus-visible:ring-0"
                />
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={handleBulkPriceDiscount}
                disabled={selectedProductIds.size === 0 || bulkDiscountApplying}
                className="min-h-[48px] rounded-md border-2 border-primary/80 px-5 text-[14px] shadow-md hover:opacity-90"
              >
                {bulkDiscountApplying ? "적용 중…" : `선택 상품(${selectedProductIds.size})에 할인 적용`}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBulkRemoveDiscount}
                disabled={selectedProductIds.size === 0 || bulkDiscountRemoveApplying}
                className="min-h-[48px] rounded-md border-2 border-muted-foreground/30 px-5 text-[14px] shadow-sm"
              >
                {bulkDiscountRemoveApplying ? "해제 중…" : `선택 상품(${selectedProductIds.size}) 할인 해제`}
              </Button>
            </div>

            {/* 카테고리 일괄 변경 */}
            <div className="flex flex-wrap items-stretch justify-end gap-4">
              <p className="flex min-h-[48px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 text-[16px] shadow-sm tracking-widest uppercase text-muted-foreground">
                카테고리 일괄 변경
              </p>
              <div className="flex min-h-[48px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 shadow-sm">
                <select
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  className="h-9 min-w-[120px] rounded border-0 bg-transparent text-[16px] text-foreground focus:ring-0"
                >
                  <option value="">카테고리 선택</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                variant="default"
                size="lg"
                onClick={handleBulkCategory}
                disabled={selectedProductIds.size === 0 || !bulkCategory.trim() || bulkCategoryApplying}
                className="min-h-[48px] rounded-md border-2 border-primary/80 px-5 text-[14px] shadow-md hover:opacity-90"
              >
                {bulkCategoryApplying ? "적용 중…" : `선택 상품(${selectedProductIds.size})에 카테고리 적용`}
              </Button>
            </div>

            {/* 상품 일괄 활성/비활성 */}
            <div className="flex flex-wrap items-stretch justify-end gap-4">
              <p className="flex min-h-[48px] items-center rounded border-2 border-muted-foreground/30 bg-background px-3 py-2 text-[16px] shadow-sm tracking-widest uppercase text-muted-foreground">
                상품 일괄 활성/비활성
              </p>
              <div className="flex min-h-[48px] items-center gap-2">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => handleBulkActive(true)}
                  disabled={selectedProductIds.size === 0 || bulkActiveApplying}
                  className="min-h-[48px] rounded-md border-2 border-primary/80 px-5 text-[14px] shadow-md hover:opacity-90"
                >
                  {bulkActiveApplying ? "처리 중…" : `선택 상품(${selectedProductIds.size}) 활성`}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={() => handleBulkActive(false)}
                  disabled={selectedProductIds.size === 0 || bulkActiveApplying}
                  className="min-h-[48px] rounded-md border-2 border-destructive/80 px-5 text-[14px] shadow-md hover:opacity-90"
                >
                  {bulkActiveApplying ? "처리 중…" : `선택 상품(${selectedProductIds.size}) 비활성`}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {selectedProductIds.size > 0 ? (
          <div className="mb-3 flex items-center gap-3 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5">
            <span className="inline-flex items-center justify-center rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              {selectedProductIds.size}
            </span>
            <span className="text-sm font-medium">
              {selectedProductIds.size}개 선택됨 — 아래 일괄 적용 패널에서 한 번에 처리하세요.
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedProductIds(new Set())}
              className="ml-auto h-7 text-xs text-muted-foreground"
            >
              선택 해제
            </Button>
          </div>
        ) : null}

        <div className="overflow-hidden border border-border bg-card/60 backdrop-blur-sm">
          <div className="grid grid-cols-[auto_1.6fr_1fr_0.7fr_0.7fr_0.8fr_0.8fr_1.4fr] gap-4 border-b border-border px-6 py-3 text-xs tracking-widest uppercase text-muted-foreground items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={products.length > 0 && selectedProductIds.size === products.length}
                onChange={toggleSelectAll}
                className="rounded border-border"
              />
              <span className="sr-only">전체 선택</span>
            </label>
            <span>상품</span>
            <span>카테고리</span>
            <span>재고</span>
            <span>금액</span>
            <span>배송비</span>
            <span>상태</span>
            <span className="text-right">관리</span>
          </div>

          {products.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              등록된 상품이 없습니다. 첫 상품을 추가해 주세요.
            </div>
          ) : (
            products.map((product) => (
              <div
                key={product._id}
                className="grid grid-cols-[auto_1.6fr_1fr_0.7fr_0.7fr_0.8fr_0.8fr_1.4fr] gap-4 border-b border-border px-6 py-4 last:border-0 items-center"
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product._id)}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="rounded border-border"
                  />
                  <span className="sr-only">{product.name} 선택</span>
                </label>
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-14 h-16 overflow-hidden rounded-sm border border-border bg-secondary flex-shrink-0">
                    {product.images?.[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-wider">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      {demoProductNameSet.has(product.name.trim().toLowerCase()) ? (
                        <span className="inline-flex flex-shrink-0 px-2 py-0.5 text-[10px] tracking-[0.2em] uppercase border border-border text-muted-foreground">
                          데모
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.description || "설명 없음"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">
                    {product.categories?.length ? product.categories.join(", ") : product.category || "-"}
                  </span>
                  {(product.categories?.length ? product.categories : product.category ? [product.category] : []).some((category) => hiddenCategoryNames.has(category)) ? (
                    <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                      숨김 카테고리
                    </span>
                  ) : null}
                </div>
                <span className="text-sm text-foreground">{product.stock}</span>
                <span className="text-sm text-foreground">
                  {formatKRW(getSellingPrice(product))}
                  {(product.discount?.value ?? 0) > 0 ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (원가 {formatKRW(product.price)})
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-foreground">{formatKRW(product.shipping?.fee ?? product.shippingFee ?? 0)}</span>
                <span
                  className={`inline-flex w-fit px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase border ${
                    product.isActive
                      ? "border-accent/40 text-accent"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  {product.isActive ? "활성" : "숨김"}
                </span>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                    <Pencil className="w-4 h-4" />
                    수정
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openDuplicateDialog(product)} title="복제">
                    <Copy className="w-4 h-4" />
                    복제
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => openDeleteDialog(product)}
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "상품 수정" : "상품 추가"}</DialogTitle>
            <DialogDescription>
              쇼핑몰 상품 등록 정보와 대표 이미지를 입력합니다. 이미지 URL은 여러 줄 또는 쉼표로 구분할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs tracking-widest uppercase text-muted-foreground">상품명</label>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="레더 재킷"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs tracking-widest uppercase text-muted-foreground">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => {
                    const isSelected = form.categories.includes(category)

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            categories: isSelected
                              ? current.categories.filter((item) => item !== category)
                              : [...current.categories, category],
                          }))
                        }
                        className={`inline-flex items-center gap-2 border px-3 py-2 text-xs tracking-[0.2em] uppercase transition-colors ${
                          isSelected
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        {category}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  카테고리는 하나 이상 선택해야 하며, 다시 클릭하면 해제됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs tracking-widest uppercase text-muted-foreground">금액</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="890"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs tracking-widest uppercase text-muted-foreground">재고</label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  placeholder="12"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs tracking-widest uppercase text-muted-foreground">배송비</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.shippingFee}
                  onChange={(event) => setForm((current) => ({ ...current, shippingFee: event.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">상품 설명</label>
              <Textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="상품 설명과 주요 포인트를 입력하세요."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">이미지 URL</label>
              <Textarea
                value={form.imageUrls}
                onChange={(event) => setForm((current) => ({ ...current, imageUrls: event.target.value }))}
                placeholder="https://example.com/image-1.jpg&#10;https://example.com/image-2.jpg"
                rows={4}
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
                className="h-4 w-4 rounded border-border bg-background"
              />
              활성 상품으로 표시
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                취소
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "저장 중..." : editingProduct ? "상품 수정" : "상품 등록"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!duplicateTarget} onOpenChange={(open) => !open && setDuplicateTarget(null)}>
        <AlertDialogContent className="sm:max-w-[400px] border-purple-950/50 p-0 overflow-hidden shadow-2xl !bg-purple-950 dark:!bg-purple-950">
          <div className="flex flex-col items-center text-center p-6 pb-4">
            <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <Copy className="h-7 w-7" aria-hidden />
            </div>
            <AlertDialogHeader className="gap-2">
              <AlertDialogTitle className="text-xl text-white">상품 복제</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-white/90">
                <span className="font-semibold text-white">&quot;{duplicateTarget?.name}&quot;</span>
                {" "}상품을 복제할까요? 복사본은 비활성 상태로 추가되며, 이름에 &quot;(복사본)&quot;이 붙습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-2 gap-3 sm:gap-3 px-6 pb-6">
            <AlertDialogCancel
              disabled={duplicateApplying}
              className="min-w-[80px] border-white/60 text-white hover:bg-white/15 hover:text-white"
            >
              취소
            </AlertDialogCancel>
            <Button
              onClick={handleDuplicateConfirm}
              disabled={duplicateApplying}
              className="min-w-[80px] bg-white text-purple-700 hover:bg-purple-50 hover:text-purple-800 active:bg-purple-100 active:text-purple-900 active:scale-[0.98] transition-transform"
            >
              {duplicateApplying ? "복제 중…" : "복제하기"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="sm:max-w-[400px] border-red-500/50 p-0 overflow-hidden shadow-2xl !bg-red-900 dark:!bg-red-900">
          <div className="flex flex-col items-center text-center p-6 pb-4">
            <div className="mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-white">
              <Trash2 className="h-7 w-7" aria-hidden />
            </div>
            <AlertDialogHeader className="gap-2">
              <AlertDialogTitle className="text-xl text-white">상품 삭제</AlertDialogTitle>
              <AlertDialogDescription className="text-center text-white/90">
                <span className="font-semibold text-white">&quot;{deleteTarget?.name}&quot;</span>
                {" "}상품을 삭제하겠습니까? 삭제된 상품은 쇼핑몰에 노출되지 않습니다.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="mt-2 gap-3 sm:gap-3 px-6 pb-6">
            <AlertDialogCancel
              disabled={deleteApplying}
              className="min-w-[80px] border-white/60 text-white hover:bg-white/15 hover:text-white"
            >
              취소
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteApplying}
              className="min-w-[80px] bg-white text-red-700 hover:bg-red-50 hover:text-red-800 active:bg-red-100 active:text-red-900 active:scale-[0.98] transition-transform"
            >
              {deleteApplying ? "삭제 중…" : "삭제하기"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
