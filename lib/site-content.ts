export type SiteStat = {
  value: string
  label: string
}

export type SiteTestimonial = {
  quote: string
  name: string
  title: string
  rating: number
}

export type SiteContent = {
  hero: {
    backgroundImage: string
    eyebrow: string
    titleLine1: string
    titleLine2: string
    description: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel: string
    secondaryHref: string
    metaItems: string[]
  }
  stats: SiteStat[]
  collections: {
    eyebrow: string
    title: string
    ctaLabel: string
    ctaHref: string
  }
  editorial: {
    eyebrow: string
    title: string
    description: string
    features: string[]
    image: string
    ctaLabel: string
    ctaHref: string
  }
  testimonials: {
    eyebrow: string
    title: string
    items: SiteTestimonial[]
  }
  cta: {
    eyebrow: string
    titleLine1: string
    titleLine2: string
    description: string
    buttonLabel: string
    buttonHref: string
  }
}

export const defaultSiteContent: SiteContent = {
  hero: {
    backgroundImage: "/images/hero-fashion.jpg",
    eyebrow: "AI Curated Style",
    titleLine1: "취향을 읽고",
    titleLine2: "스타일을 완성하다",
    description:
      "당신의 시선과 선택을 바탕으로, 지금 어울리는 컬렉션을 더 빠르고 정교하게 제안합니다.",
    primaryLabel: "컬렉션 보기",
    primaryHref: "#collections",
    secondaryLabel: "",
    secondaryHref: "",
    metaItems: ["50만원 이상 무료배송", "AI 스타일 추천", "신규 상품 매주 업데이트"],
  },
  stats: [
    { value: "2,400+", label: "Curated Pieces" },
    { value: "180+", label: "Designer Brands" },
    { value: "50K+", label: "AI Recommendations" },
    { value: "98%", label: "Satisfaction Rate" },
  ],
  collections: {
    eyebrow: "Curated For You",
    title: "Collections",
    ctaLabel: "View All Products",
    ctaHref: "/products",
  },
  editorial: {
    eyebrow: "AI Styling",
    title: "Your Personal Observer, Always Watching Your Style",
    description:
      "Our AI companion silently observes your browsing patterns, understands your aesthetic preferences, and curates personalized recommendations.",
    features: [
      "Learns from your browsing behavior in real-time",
      "Curates collections matching your color palette preferences",
      "Suggests complementary pieces for complete outfits",
      "Adapts to seasonal trends while respecting your style",
    ],
    image: "/images/product-2.jpg",
    ctaLabel: "Learn More",
    ctaHref: "#",
  },
  testimonials: {
    eyebrow: "Testimonials",
    title: "What Our Clients Say",
    items: [
      {
        quote:
          "The AI stylist understood my preference for minimal silhouettes before I even articulated it myself.",
        name: "Mina Park",
        title: "Creative Director",
        rating: 5,
      },
      {
        quote:
          "I was skeptical about AI fashion recommendations, but the observer robot truly learns.",
        name: "James Chen",
        title: "Architect",
        rating: 5,
      },
      {
        quote:
          "The curated collections feel deeply personal. It is like having a world-class stylist.",
        name: "Sofia Laurent",
        title: "Gallery Owner",
        rating: 5,
      },
    ],
  },
  cta: {
    eyebrow: "Begin Your Journey",
    titleLine1: "Let Your Style Be",
    titleLine2: "Observed and Perfected",
    description:
      "Join the future of luxury fashion. Our AI observer will silently curate a world of elegance around your unique taste.",
    buttonLabel: "Start Exploring",
    buttonHref: "/auth/signup",
  },
}
