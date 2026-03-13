"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowDown, ArrowUp, Eye, Plus, Trash2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { defaultSiteContent, type SiteContent } from "@/lib/site-content"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"

function linesToArray(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function arrayToLines(items: string[]) {
  return items.join("\n")
}

type CategoryItem = {
  _id: string
  name: string
  isVisible: boolean
  sortOrder: number
  productCount: number
  activeProductCount: number
}

export default function AdminContentPage() {
  const router = useRouter()
  const { user, token, loading } = useAuth()
  const [content, setContent] = useState<SiteContent>(defaultSiteContent)
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [newCategoryName, setNewCategoryName] = useState("")
  const [fetching, setFetching] = useState(true)
  const [saving, setSaving] = useState(false)
  const [categorySaving, setCategorySaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!token) {
      router.replace("/auth/login?next=/admin/content")
      return
    }

    if (user?.role !== "admin") {
      router.replace("/")
    }
  }, [loading, router, token, user])

  useEffect(() => {
    if (!token || user?.role !== "admin") return

    const fetchContent = async () => {
      try {
        setFetching(true)
        setError(null)

        const [contentResponse, categoryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/site-content/home`, {
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

        const [contentData, categoryData] = await Promise.all([
          contentResponse.json(),
          categoryResponse.json(),
        ])

        if (!contentResponse.ok || !contentData?.success) {
          throw new Error(contentData?.message || "Failed to load content")
        }

        if (!categoryResponse.ok || !categoryData?.success) {
          throw new Error(categoryData?.message || "Failed to load categories")
        }

        setContent(contentData.data.content)
        setCategories(categoryData.data.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content")
      } finally {
        setFetching(false)
      }
    }

    fetchContent()
  }, [token, user])

  const refreshCategories = async () => {
    if (!token) return

    const response = await fetch(`${API_BASE_URL}/api/categories?includeHidden=all`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
    const data = await response.json()

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || "Failed to load categories")
    }

    setCategories(data.data.items)
  }

  const updateHero = (field: keyof SiteContent["hero"], value: string | string[]) => {
    setContent((current) => ({
      ...current,
      hero: {
        ...current.hero,
        [field]: value,
      },
    }))
  }

  const updateCollections = (field: keyof SiteContent["collections"], value: string) => {
    setContent((current) => ({
      ...current,
      collections: {
        ...current.collections,
        [field]: value,
      },
    }))
  }

  const updateEditorial = (field: keyof SiteContent["editorial"], value: string | string[]) => {
    setContent((current) => ({
      ...current,
      editorial: {
        ...current.editorial,
        [field]: value,
      },
    }))
  }

  const updateTestimonials = (field: keyof SiteContent["testimonials"], value: string | SiteContent["testimonials"]["items"]) => {
    setContent((current) => ({
      ...current,
      testimonials: {
        ...current.testimonials,
        [field]: value,
      },
    }))
  }

  const updateCta = (field: keyof SiteContent["cta"], value: string) => {
    setContent((current) => ({
      ...current,
      cta: {
        ...current.cta,
        [field]: value,
      },
    }))
  }

  const updateStat = (index: number, field: "value" | "label", value: string) => {
    setContent((current) => ({
      ...current,
      stats: current.stats.map((stat, statIndex) =>
        statIndex === index ? { ...stat, [field]: value } : stat
      ),
    }))
  }

  const updateTestimonial = (index: number, field: keyof SiteContent["testimonials"]["items"][number], value: string | number) => {
    setContent((current) => ({
      ...current,
      testimonials: {
        ...current.testimonials,
        items: current.testimonials.items.map((item, itemIndex) =>
          itemIndex === index ? { ...item, [field]: value } : item
        ),
      },
    }))
  }

  const handleSave = async () => {
    if (!token) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/site-content/home`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(content),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Failed to save content")
      }

      setContent(data.data.content)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save content")
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async () => {
    if (!token) return

    const name = newCategoryName.trim()
    if (!name) {
      setError("카테고리명을 입력해 주세요.")
      return
    }

    try {
      setCategorySaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "카테고리 추가에 실패했습니다.")
      }

      setNewCategoryName("")
      await refreshCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 추가에 실패했습니다.")
    } finally {
      setCategorySaving(false)
    }
  }

  const handleHideCategory = async (category: CategoryItem) => {
    if (!token) return

    const confirmed = window.confirm(
      `"${category.name}" 카테고리를 숨길까요?\n연결된 상품은 삭제되지 않고 스토어프론트에서만 숨김 처리됩니다.`
    )
    if (!confirmed) return

    try {
      setCategorySaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/categories/${category._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "카테고리 숨김 처리에 실패했습니다.")
      }

      await refreshCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 숨김 처리에 실패했습니다.")
    } finally {
      setCategorySaving(false)
    }
  }

  const handleShowCategory = async (category: CategoryItem) => {
    if (!token) return

    try {
      setCategorySaving(true)
      setError(null)

      const response = await fetch(`${API_BASE_URL}/api/categories/${category._id}/show`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "카테고리 복원에 실패했습니다.")
      }

      await refreshCategories()
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 복원에 실패했습니다.")
    } finally {
      setCategorySaving(false)
    }
  }

  const handleReorderCategory = async (categoryId: string, direction: "up" | "down") => {
    if (!token) return

    const currentIndex = categories.findIndex((category) => category._id === categoryId)
    if (currentIndex === -1) return

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    const reordered = [...categories]
    const [moved] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, moved)

    try {
      setCategorySaving(true)
      setError(null)
      setCategories(reordered)

      const response = await fetch(`${API_BASE_URL}/api/categories/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderedIds: reordered.map((category) => category._id),
        }),
      })
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "카테고리 정렬 변경에 실패했습니다.")
      }

      setCategories(data.data.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : "카테고리 정렬 변경에 실패했습니다.")
      await refreshCategories()
    } finally {
      setCategorySaving(false)
    }
  }

  if (loading || (token && user?.role === "admin" && fetching)) {
    return (
      <div className="min-h-screen bg-background text-foreground pt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-72 bg-secondary" />
            <div className="h-[720px] w-full bg-secondary" />
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
      <div className="container mx-auto px-6 py-12 space-y-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-3">관리자 콘텐츠 스튜디오</p>
            <h1 className="font-serif text-3xl md:text-4xl">홈페이지 콘텐츠 관리</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
              히어로 배경 이미지, 주요 문구, 통계, 에디토리얼, 후기, CTA를 한 화면에서 편집합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/admin/products">상품 관리</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "홈페이지 저장"}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">카테고리 관리</h2>
              <p className="text-sm text-muted-foreground mt-2">
                카테고리를 삭제하면 DB 상품은 지워지지 않고 해당 카테고리 상품만 스토어프론트에서 숨겨집니다.
              </p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="새 카테고리명 입력"
            />
            <Button onClick={handleAddCategory} disabled={categorySaving} className="gap-2">
              <Plus className="w-4 h-4" />
              카테고리 추가
            </Button>
          </div>
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div
                key={category._id}
                className="flex flex-col gap-3 border border-border px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-foreground">{category.name}</p>
                    <span
                      className={`inline-flex w-fit px-2.5 py-1 text-[10px] tracking-[0.2em] uppercase border ${
                        category.isVisible
                          ? "border-accent/40 text-accent"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {category.isVisible ? "노출" : "숨김"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    전체 상품 {category.productCount}개 / 활성 상품 {category.activeProductCount}개
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderCategory(category._id, "up")}
                    disabled={categorySaving || index === 0}
                  >
                    <ArrowUp className="w-4 h-4" />
                    위로
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderCategory(category._id, "down")}
                    disabled={categorySaving || index === categories.length - 1}
                  >
                    <ArrowDown className="w-4 h-4" />
                    아래로
                  </Button>
                  {category.isVisible ? (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleHideCategory(category)}
                      disabled={categorySaving}
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowCategory(category)}
                      disabled={categorySaving}
                    >
                      <Eye className="w-4 h-4" />
                      다시 표시
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {categories.length === 0 ? (
              <div className="border border-border px-4 py-6 text-sm text-muted-foreground">
                등록된 카테고리가 없습니다.
              </div>
            ) : null}
          </div>
        </section>

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <h2 className="font-serif text-2xl">히어로 섹션</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">배경 이미지 URL</label>
              <Input value={content.hero.backgroundImage} onChange={(e) => updateHero("backgroundImage", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">상단 문구</label>
              <Input value={content.hero.eyebrow} onChange={(e) => updateHero("eyebrow", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">설명 문구</label>
              <Textarea value={content.hero.description} onChange={(e) => updateHero("description", e.target.value)} rows={4} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">제목 1행</label>
              <Input value={content.hero.titleLine1} onChange={(e) => updateHero("titleLine1", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">제목 2행</label>
              <Input value={content.hero.titleLine2} onChange={(e) => updateHero("titleLine2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">기본 버튼 문구</label>
              <Input value={content.hero.primaryLabel} onChange={(e) => updateHero("primaryLabel", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">기본 버튼 링크</label>
              <Input value={content.hero.primaryHref} onChange={(e) => updateHero("primaryHref", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">보조 버튼 문구</label>
              <Input value={content.hero.secondaryLabel} onChange={(e) => updateHero("secondaryLabel", e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">보조 버튼 링크</label>
              <Input value={content.hero.secondaryHref} onChange={(e) => updateHero("secondaryHref", e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">보조 안내 문구</label>
              <Textarea
                value={arrayToLines(content.hero.metaItems)}
                onChange={(e) => updateHero("metaItems", linesToArray(e.target.value))}
                rows={3}
              />
            </div>
          </div>
        </section>

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <h2 className="font-serif text-2xl">주요 통계</h2>
          <div className="grid gap-5 md:grid-cols-2">
            {content.stats.map((stat, index) => (
              <div key={`stat-${index}`} className="grid gap-4 md:grid-cols-2">
                <Input value={stat.value} onChange={(e) => updateStat(index, "value", e.target.value)} placeholder="2,400+" />
                <Input value={stat.label} onChange={(e) => updateStat(index, "label", e.target.value)} placeholder="Curated Pieces" />
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <h2 className="font-serif text-2xl">컬렉션 섹션</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Input value={content.collections.eyebrow} onChange={(e) => updateCollections("eyebrow", e.target.value)} placeholder="Curated For You" />
            <Input value={content.collections.title} onChange={(e) => updateCollections("title", e.target.value)} placeholder="Collections" />
            <Input value={content.collections.ctaLabel} onChange={(e) => updateCollections("ctaLabel", e.target.value)} placeholder="전체 상품 보기" />
            <Input value={content.collections.ctaHref} onChange={(e) => updateCollections("ctaHref", e.target.value)} placeholder="/products" />
          </div>
        </section>

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <h2 className="font-serif text-2xl">에디토리얼 섹션</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Input value={content.editorial.eyebrow} onChange={(e) => updateEditorial("eyebrow", e.target.value)} placeholder="AI 스타일링" />
            <Input value={content.editorial.title} onChange={(e) => updateEditorial("title", e.target.value)} placeholder="당신의 스타일을 지켜보는 개인 옵저버" />
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">설명 문구</label>
              <Textarea value={content.editorial.description} onChange={(e) => updateEditorial("description", e.target.value)} rows={4} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs tracking-widest uppercase text-muted-foreground">주요 포인트</label>
              <Textarea
                value={arrayToLines(content.editorial.features)}
                onChange={(e) => updateEditorial("features", linesToArray(e.target.value))}
                rows={5}
              />
            </div>
            <Input value={content.editorial.image} onChange={(e) => updateEditorial("image", e.target.value)} placeholder="/images/product-2.jpg" />
            <Input value={content.editorial.ctaLabel} onChange={(e) => updateEditorial("ctaLabel", e.target.value)} placeholder="자세히 보기" />
            <div className="md:col-span-2">
              <Input value={content.editorial.ctaHref} onChange={(e) => updateEditorial("ctaHref", e.target.value)} placeholder="#" />
            </div>
          </div>
        </section>

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <h2 className="font-serif text-2xl">후기 섹션</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Input value={content.testimonials.eyebrow} onChange={(e) => updateTestimonials("eyebrow", e.target.value)} placeholder="고객 후기" />
            <Input value={content.testimonials.title} onChange={(e) => updateTestimonials("title", e.target.value)} placeholder="고객이 말하는 우리의 가치" />
          </div>
          <div className="space-y-5">
            {content.testimonials.items.map((item, index) => (
              <div key={`testimonial-${index}`} className="grid gap-4 border border-border p-4 md:grid-cols-2">
                <Input value={item.name} onChange={(e) => updateTestimonial(index, "name", e.target.value)} placeholder="이름" />
                <Input value={item.title} onChange={(e) => updateTestimonial(index, "title", e.target.value)} placeholder="직함" />
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={String(item.rating)}
                  onChange={(e) => updateTestimonial(index, "rating", Number(e.target.value))}
                  placeholder="5"
                />
                <div className="md:col-span-2">
                  <Textarea value={item.quote} onChange={(e) => updateTestimonial(index, "quote", e.target.value)} rows={3} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-border bg-card/60 p-6 space-y-5">
          <h2 className="font-serif text-2xl">CTA 섹션</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <Input value={content.cta.eyebrow} onChange={(e) => updateCta("eyebrow", e.target.value)} placeholder="Begin Your Journey" />
            <Input value={content.cta.buttonLabel} onChange={(e) => updateCta("buttonLabel", e.target.value)} placeholder="Start Exploring" />
            <Input value={content.cta.titleLine1} onChange={(e) => updateCta("titleLine1", e.target.value)} placeholder="Let Your Style Be" />
            <Input value={content.cta.titleLine2} onChange={(e) => updateCta("titleLine2", e.target.value)} placeholder="Observed and Perfected" />
            <div className="md:col-span-2">
              <Textarea value={content.cta.description} onChange={(e) => updateCta("description", e.target.value)} rows={4} />
            </div>
            <div className="md:col-span-2">
              <Input value={content.cta.buttonHref} onChange={(e) => updateCta("buttonHref", e.target.value)} placeholder="/auth/signup" />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
