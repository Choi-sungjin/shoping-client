import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { SiteContent } from "@/lib/site-content"

type HeroSectionProps = {
  hero: SiteContent["hero"]
}

const FALLBACK_HERO_IMAGE = "/images/hero-fashion.jpg"

export function HeroSection({ hero }: HeroSectionProps) {
  const heroSrc = hero?.backgroundImage?.trim() || FALLBACK_HERO_IMAGE

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <Image
          src={heroSrc}
          alt="Fashion editorial"
          fill
          className="object-cover opacity-90"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/75 via-background/35 to-background/5" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-transparent to-background/35" />
      </div>

      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-xl">
          <p className="mb-6 text-xs uppercase tracking-[0.4em] text-muted-foreground">{hero.eyebrow}</p>
          <h1 className="mb-8 font-serif text-5xl leading-[0.95] text-foreground text-balance md:text-7xl lg:text-8xl">
            {hero.titleLine1}
            <br />
            {hero.titleLine2}
          </h1>
          <p className="mb-10 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            {hero.description}
          </p>

          <div className="flex items-center gap-4">
            <Link
              href={hero.primaryHref}
              className="inline-flex items-center gap-2 bg-foreground px-8 py-3.5 text-xs uppercase tracking-widest text-background transition-colors duration-300 hover:bg-accent hover:text-accent-foreground"
            >
              {hero.primaryLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            {hero.secondaryLabel && hero.secondaryHref ? (
              <Link
                href={hero.secondaryHref}
                className="inline-flex items-center gap-2 border border-border px-8 py-3.5 text-xs uppercase tracking-widest text-foreground transition-colors duration-300 hover:bg-secondary"
              >
                {hero.secondaryLabel}
              </Link>
            ) : null}
          </div>

          {hero.metaItems.length > 0 ? (
            <div className="mt-16 flex flex-wrap items-center gap-8 text-xs tracking-wider text-muted-foreground">
              {hero.metaItems.map((item, index) => (
                <div key={`${item}-${index}`} className="contents">
                  {index > 0 ? <span className="h-4 w-px bg-border" /> : null}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Scroll</span>
        <div className="relative h-8 w-px overflow-hidden bg-border">
          <div className="absolute left-0 top-0 h-full w-full animate-pulse bg-foreground" />
        </div>
      </div>
    </section>
  )
}
