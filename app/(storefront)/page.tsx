import { ShoppingMallClient } from "@/components/storefront/shopping-mall-client"
import { Suspense } from "react"

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ShoppingMallClient />
    </Suspense>
  )
}
