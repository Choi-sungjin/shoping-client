"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { CART_UPDATED_EVENT } from "@/components/layout/Navbar"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { demoProducts, getDemoProductById, type DemoProduct } from "@/lib/demo-products"
import { formatKRW } from "@/lib/format"
import { getSellingPrice } from "@/lib/productPrice"
import type { Product } from "@/lib/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

type ProductDetailPageProps = {
  params: {
    id: string
  }
}

type ProductViewModel = {
  id: string
  name: string
  category: string
  categories: string[]
  price: number
  stock: number
  description: string
  images: string[]
  source: "api" | "demo"
}

function normalizeProduct(product: Product | DemoProduct, source: "api" | "demo"): ProductViewModel {
  const firstImage = "image" in product ? product.image : product.images?.[0]
  const categories = "_id" in product
    ? (product.categories?.length ? product.categories : product.category ? [product.category] : [])
    : product.category ? [product.category] : []

  return {
    id: "_id" in product ? product._id : product.id,
    name: product.name,
    category: categories[0] || product.category || "Uncategorized",
    categories,
    price: "_id" in product ? getSellingPrice(product as Product) : product.price,
    stock: product.stock,
    description: product.description || "상품 설명이 아직 등록되지 않았습니다.",
    images: "_id" in product
      ? (product.images?.length ? product.images : firstImage ? [firstImage] : [])
      : (product.images?.length ? product.images : firstImage ? [firstImage] : []),
    source,
  }
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const router = useRouter()
  const { isAuthenticated, token } = useAuth()
  const [product, setProduct] = useState<ProductViewModel | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<DemoProduct[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cartMessage, setCartMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const loadProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        setCartMessage(null)

        const demoProduct = getDemoProductById(params.id)
        if (demoProduct) {
          const normalized = normalizeProduct(demoProduct, "demo")
          if (!mounted) return
          setProduct(normalized)
          setRelatedProducts(
            demoProducts
            .filter((item) => item.id !== demoProduct.id && item.category === demoProduct.category)
              .slice(0, 4)
          )
          return
        }

        const response = await fetch(`${API_BASE_URL}/api/products/${params.id}`, {
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok || !data?.success) {
          throw new Error(data?.message || "상품 정보를 불러오지 못했습니다.")
        }

        const normalized = normalizeProduct(data.data.product as Product, "api")

        if (!mounted) return

        setProduct(normalized)
        setRelatedProducts(
          demoProducts
            .filter((item) => normalized.categories.includes(item.category))
            .slice(0, 4)
        )
      } catch (err) {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "상품 정보를 불러오지 못했습니다.")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProduct()

    return () => {
      mounted = false
    }
  }, [params.id])

  useEffect(() => {
    setSelectedImage(0)
    setQuantity(1)
  }, [product?.id])

  const selectedImageSrc = useMemo(() => {
    if (!product) return ""
    return product.images[selectedImage] || product.images[0] || ""
  }, [product, selectedImage])

  const handleAddToCart = async () => {
    if (!product) return

    if (product.source === "demo") {
      setCartMessage("데모 상품은 장바구니에 담기지 않습니다. 관리자 상품으로 확인해 주세요.")
      return
    }

    if (!isAuthenticated || !token) {
      router.push(`/auth/login?next=/products/${product.id}`)
      return
    }

    try {
      setAddingToCart(true)
      setCartMessage(null)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          quantity,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "장바구니 담기에 실패했습니다.")
      }

      if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT))
      setCartMessage("장바구니에 상품을 담았습니다.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "장바구니 담기에 실패했습니다.")
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16">
            <Skeleton className="aspect-[4/5] w-full rounded-sm" />
            <div className="space-y-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-xl space-y-6">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">Product Detail</p>
            <h1 className="font-serif text-4xl">상품을 찾을 수 없습니다</h1>
            <p className="text-muted-foreground leading-relaxed">
              {error || "요청한 상품이 존재하지 않거나 더 이상 노출되지 않는 상태입니다."}
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                홈으로 돌아가기
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-24">
      <div className="container mx-auto px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-3 text-xs tracking-[0.28em] uppercase text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
          <span>/</span>
          <Link href="/#collections" className="hover:text-foreground transition-colors">Collections</Link>
          <span>/</span>
          <span>{product.category}</span>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-start">
          <div className="space-y-5">
            <div className="relative overflow-hidden rounded-sm border border-border bg-secondary/50">
              {selectedImageSrc ? (
                <img
                  src={selectedImageSrc}
                  alt={product.name}
                  className="block aspect-[4/5] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/5] items-center justify-center text-sm text-muted-foreground">
                  이미지가 없습니다
                </div>
              )}
            </div>

            {product.images.length > 1 ? (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setSelectedImage(index)}
                    className={`overflow-hidden rounded-sm border transition-colors ${
                      index === selectedImage ? "border-foreground" : "border-border"
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="aspect-[4/5] w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">{product.category}</p>
              {product.categories.length > 1 ? (
                <div className="flex flex-wrap gap-2">
                  {product.categories.slice(1).map((category) => (
                    <span
                      key={`${product.id}-${category}`}
                      className="inline-flex px-2.5 py-1 text-[10px] tracking-[0.18em] uppercase border border-border text-muted-foreground"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}
              <h1 className="font-serif text-4xl md:text-5xl leading-tight text-balance">{product.name}</h1>
              <p className="text-2xl md:text-3xl">{formatKRW(product.price)}</p>
              <div className="inline-flex items-center gap-2 border border-border px-3 py-1.5 text-[11px] tracking-[0.24em] uppercase text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${product.stock > 0 ? "bg-accent" : "bg-destructive"}`} />
                {product.stock > 0 ? `재고 ${product.stock}개` : "품절"}
              </div>
            </div>

            <div className="border-y border-border py-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{product.description}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-[0.28em] uppercase text-muted-foreground">수량</span>
                <div className="inline-flex items-center border border-border">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    disabled={quantity <= 1}
                    aria-label="수량 줄이기"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex h-11 min-w-14 items-center justify-center border-x border-border text-sm">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
                    onClick={() => setQuantity((current) => Math.min(product.stock || 1, current + 1))}
                    disabled={quantity >= product.stock || product.stock === 0}
                    aria-label="수량 늘리기"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Button
                  type="button"
                  className="h-12 gap-2 text-xs tracking-[0.24em] uppercase"
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock === 0}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {addingToCart ? "처리 중..." : product.stock === 0 ? "품절" : "장바구니 담기"}
                </Button>
                <Button type="button" variant="outline" className="h-12 px-5">
                  <Heart className="w-4 h-4" />
                </Button>
              </div>

              {cartMessage ? (
                <div className="border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
                  {cartMessage}
                </div>
              ) : null}

              {error ? (
                <div className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="grid gap-4 border border-border bg-card/60 p-5 text-sm text-muted-foreground">
              <div className="flex items-center justify-between gap-4">
                <span>배송 안내</span>
                <span>50만원 이상 무료배송</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>추천 대상</span>
                <span>{product.categories.join(", ")} 카테고리를 선호하는 고객</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>상품 타입</span>
                <span>{product.source === "demo" ? "데모 상품" : "실제 등록 상품"}</span>
              </div>
            </div>
          </div>
        </div>

        {relatedProducts.length > 0 ? (
          <section className="mt-24 border-t border-border pt-16">
            <div className="mb-10">
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">Related Selection</p>
              <h2 className="font-serif text-4xl">같이 보면 좋은 상품</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
