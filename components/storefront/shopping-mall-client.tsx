"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowRight, ChevronRight, Star } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { ObserverRobot } from "@/components/observer-robot"
import { HeroSection } from "@/components/storefront/HeroSection"
import { ProductCard } from "@/components/storefront/ProductCard"
import { Spotlight } from "@/components/ui/spotlight"
import { defaultSiteContent, type SiteContent } from "@/lib/site-content"
import { demoProducts } from "@/lib/demo-products"
import type { Product } from "@/lib/types"
import { getSellingPrice } from "@/lib/productPrice"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
const DEFAULT_CATEGORIES = ["All", "New Arrivals"]
const NEW_ARRIVALS_LIMIT = 4

type StorefrontProduct = {
  id: string
  name: string
  category: string
  categories: string[]
  price: number
  image: string
  tag?: string | null
}

const testimonialsFallback = defaultSiteContent.testimonials.items

const mapApiProductToStorefront = (product: Product, newArrivalIds: Set<string>): StorefrontProduct => {
  const categories = Array.from(
    new Set((product.categories?.length ? product.categories : [product.category || "Uncategorized"]).filter(Boolean))
  )

  return {
    id: product._id,
    name: product.name,
    category: categories[0] || "Uncategorized",
    categories,
    price: getSellingPrice(product),
    image: product.images?.[0] || "/images/product-1.jpg",
    tag: newArrivalIds.has(product._id) ? "New" : null,
  }
}

const mapDemoProductToStorefront = (product: (typeof demoProducts)[number]): StorefrontProduct => ({
  id: product.id,
  name: product.name,
  category: product.category,
  categories: [product.category],
  price: product.price,
  image: product.image,
  tag: product.tag,
})

export function ShoppingMallClient() {
  const searchParams = useSearchParams()
  const { isAuthenticated, user, loading } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [siteContent, setSiteContent] = useState<SiteContent>(defaultSiteContent)
  const [storefrontProducts, setStorefrontProducts] = useState<StorefrontProduct[]>([])

  const productSource = storefrontProducts.length
    ? storefrontProducts
    : demoProducts.map(mapDemoProductToStorefront)

  const availableCategories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(productSource.flatMap((product) => product.categories).filter(Boolean))
    )

    return [...DEFAULT_CATEGORIES, ...uniqueCategories]
  }, [productSource])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "All") return productSource

    if (selectedCategory === "New Arrivals") {
      return productSource.filter((product) => product.tag === "New")
    }

    return productSource.filter((product) => product.categories.includes(selectedCategory))
  }, [productSource, selectedCategory])

  useEffect(() => {
    let mounted = true

    const fetchSiteContent = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/site-content/home`, {
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok || !data?.success || !mounted) return
        setSiteContent(data.data.content)
      } catch {
        // 기본 콘텐츠 유지
      }
    }

    fetchSiteContent()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products?limit=24`, {
          cache: "no-store",
        })
        const data = await response.json()

        if (!response.ok || !data?.success || !mounted) return

        const items = Array.isArray(data?.data?.items) ? (data.data.items as Product[]) : []
        const newArrivalIds = new Set(items.slice(0, NEW_ARRIVALS_LIMIT).map((product) => product._id))

        setStorefrontProducts(items.map((product) => mapApiProductToStorefront(product, newArrivalIds)))
      } catch {
        // 데모 fallback 유지
      }
    }

    fetchProducts()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const categoryParam = searchParams.get("category")

    if (categoryParam && availableCategories.includes(categoryParam)) {
      setSelectedCategory(categoryParam)
      return
    }

    const applyHashFilter = () => {
      const hash = window.location.hash.replace("#", "")

      if (hash === "new-arrivals") {
        setSelectedCategory("New Arrivals")
        return
      }

      if (availableCategories.includes(hash)) {
        setSelectedCategory(hash)
        return
      }

      setSelectedCategory("All")
    }

    applyHashFilter()
    window.addEventListener("hashchange", applyHashFilter)

    return () => {
      window.removeEventListener("hashchange", applyHashFilter)
    }
  }, [availableCategories, searchParams])

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <ObserverRobot />

      <div className="relative z-20">
      {!loading && isAuthenticated && user?.name ? (
        <div className="pt-20">
          <div className="container mx-auto px-6">
            <div className="inline-flex items-center border border-border bg-card px-4 py-2 text-sm text-foreground">
              {user.name}님 환영합니다
            </div>
          </div>
        </div>
      ) : null}

      <HeroSection hero={siteContent.hero} />

      <section className="border-t border-border py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {siteContent.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-2">
                <span className="font-serif text-3xl text-foreground md:text-4xl">{stat.value}</span>
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="collections" className="relative border-t border-border py-20">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

        <div className="container relative z-10 mx-auto px-6">
          <div className="mb-12 flex flex-col gap-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {siteContent.collections.eyebrow}
            </p>
            <h2 className="font-serif text-4xl text-foreground md:text-5xl">
              {siteContent.collections.title}
            </h2>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3 md:gap-8 lg:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 8} />
              ))}
            </div>
          ) : (
            <div className="border border-border bg-card/50 px-6 py-12 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">No Products</p>
              <p className="text-sm text-muted-foreground">선택한 카테고리에 노출할 상품이 아직 없습니다.</p>
            </div>
          )}

          <div className="mt-16 flex justify-center">
            <Link
              href={siteContent.collections.ctaHref}
              className="inline-flex items-center gap-2 border-b border-border pb-1 text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              {siteContent.collections.ctaLabel}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="container mx-auto px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="space-y-8">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                {siteContent.editorial.eyebrow}
              </p>
              <h2 className="font-serif text-4xl leading-tight text-foreground text-balance md:text-5xl">
                {siteContent.editorial.title}
              </h2>
              <p className="leading-relaxed text-muted-foreground">{siteContent.editorial.description}</p>

              <div className="space-y-4">
                {siteContent.editorial.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-accent" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Link
                href={siteContent.editorial.ctaHref}
                className="inline-flex items-center gap-2 bg-foreground px-8 py-3.5 text-xs uppercase tracking-widest text-background transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
              >
                {siteContent.editorial.ctaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
              <Image
                src={siteContent.editorial?.image?.trim() || "/images/product-2.jpg"}
                alt="AI Fashion Styling"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border py-20">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <p className="mb-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              {siteContent.testimonials.eyebrow}
            </p>
            <h2 className="font-serif text-4xl text-foreground md:text-5xl">
              {siteContent.testimonials.title}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {(siteContent.testimonials.items.length ? siteContent.testimonials.items : testimonialsFallback).map((testimonial) => (
              <div
                key={testimonial.name}
                className="border border-border bg-card p-8 transition-colors duration-500 hover:bg-secondary/50"
              >
                <div className="mb-6 flex gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-accent text-accent" />
                  ))}
                </div>
                <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{`"${testimonial.quote}"`}</p>
                <div>
                  <p className="text-sm font-medium text-foreground">{testimonial.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{testimonial.title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-border py-32">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" />

        <div className="container relative z-10 mx-auto px-6 text-center">
          <p className="mb-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {siteContent.cta.eyebrow}
          </p>
          <h2 className="mb-8 font-serif text-4xl text-foreground text-balance md:text-6xl">
            {siteContent.cta.titleLine1}
            <br />
            {siteContent.cta.titleLine2}
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-sm leading-relaxed text-muted-foreground">
            {siteContent.cta.description}
          </p>
          <Link
            href={siteContent.cta.buttonHref}
            className="inline-flex items-center gap-2 bg-foreground px-10 py-4 text-xs uppercase tracking-widest text-background transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
          >
            {siteContent.cta.buttonLabel}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
      </div>
    </div>
  )
}
