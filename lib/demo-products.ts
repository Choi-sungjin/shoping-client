export type DemoProduct = {
  id: string
  name: string
  category: string
  price: number
  image: string
  tag?: string | null
  description: string
  stock: number
  images: string[]
}

export const demoProducts: DemoProduct[] = [
  {
    id: "1",
    name: "Leather Jacket",
    category: "Outerwear",
    price: 890,
    image: "/images/product-1.jpg",
    tag: "New",
    description: "정교한 구조감과 부드러운 광택이 살아 있는 프리미엄 레더 재킷입니다.",
    stock: 8,
    images: ["/images/product-1.jpg"],
  },
  {
    id: "2",
    name: "Silk Dress",
    category: "Dresses",
    price: 640,
    image: "/images/product-2.jpg",
    tag: "Bestseller",
    description: "유연한 실루엣과 은은한 드레이프가 돋보이는 실크 드레스입니다.",
    stock: 12,
    images: ["/images/product-2.jpg"],
  },
  {
    id: "3",
    name: "Wool Overcoat",
    category: "Outerwear",
    price: 1240,
    image: "/images/product-3.jpg",
    tag: null,
    description: "도시적인 테일러링과 묵직한 울 텍스처가 돋보이는 오버코트입니다.",
    stock: 4,
    images: ["/images/product-3.jpg"],
  },
  {
    id: "4",
    name: "Designer Sneakers",
    category: "Footwear",
    price: 520,
    image: "/images/product-4.jpg",
    tag: "Limited",
    description: "날렵한 비율과 세련된 컬러 블로킹이 특징인 디자이너 스니커즈입니다.",
    stock: 15,
    images: ["/images/product-4.jpg"],
  },
  {
    id: "5",
    name: "Cashmere Sweater",
    category: "Knitwear",
    price: 380,
    image: "/images/product-5.jpg",
    tag: null,
    description: "부드러운 캐시미어 질감과 절제된 라인이 어우러진 니트웨어입니다.",
    stock: 10,
    images: ["/images/product-5.jpg"],
  },
  {
    id: "6",
    name: "Silk Blouse",
    category: "Tops",
    price: 290,
    image: "/images/product-6.jpg",
    tag: "New",
    description: "가볍고 우아한 광택으로 포멀과 데일리 사이를 자연스럽게 잇는 블라우스입니다.",
    stock: 11,
    images: ["/images/product-6.jpg"],
  },
  {
    id: "7",
    name: "Structured Bag",
    category: "Accessories",
    price: 1180,
    image: "/images/product-7.jpg",
    tag: "Exclusive",
    description: "견고한 구조와 절제된 디테일이 조화를 이루는 시그니처 백입니다.",
    stock: 5,
    images: ["/images/product-7.jpg"],
  },
  {
    id: "8",
    name: "Tailored Trousers",
    category: "Bottoms",
    price: 440,
    image: "/images/product-8.jpg",
    tag: null,
    description: "매끈한 라인과 안정적인 핏을 동시에 잡은 테일러드 트라우저입니다.",
    stock: 9,
    images: ["/images/product-8.jpg"],
  },
]

export function getDemoProductById(id: string) {
  return demoProducts.find((product) => product.id === id) ?? null
}
