"use client"

import Image from "next/image"
import Link from "next/link"
import { formatKRW } from "@/lib/format"

export type ProductItem = {
  id: string | number
  name: string
  category: string
  categories?: string[]
  price: number
  image: string
  tag?: string | null
}

export function ProductCard({ product, priority }: { product: ProductItem; priority?: boolean }) {
  return (
    <div className="group relative flex flex-col">
      <Link href={`/products/${product.id}`} className="relative aspect-[3/4] overflow-hidden rounded-sm bg-secondary block">
        <Image
          src={product.image?.trim() || "/images/product-1.jpg"}
          alt={product.name}
          fill
          priority={priority}
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {product.tag && (
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-background/80 backdrop-blur-sm text-foreground text-xs tracking-widest uppercase border border-border">
            {product.tag}
          </div>
        )}
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-xs text-muted-foreground tracking-wider uppercase">{product.category}</p>
        {product.categories && product.categories.length > 1 ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.categories.slice(1).map((category) => (
              <span
                key={`${product.id}-${category}`}
                className="inline-flex px-2 py-0.5 text-[10px] tracking-[0.18em] uppercase border border-border text-muted-foreground"
              >
                {category}
              </span>
            ))}
          </div>
        ) : null}
        <h3 className="text-sm font-medium text-foreground">{product.name}</h3>
        <p className="text-sm text-foreground">{formatKRW(product.price)}</p>
      </div>
    </div>
  )
}
