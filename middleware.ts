import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authRequiredPaths = ["/cart", "/checkout", "/my", "/order"]
const adminRequiredPaths = ["/admin"]
const guestOnlyPaths = ["/auth/login", "/auth/signup"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("accessToken")?.value

  const isAuthRequired = authRequiredPaths.some((p) => pathname.startsWith(p))
  const isAdminRequired = adminRequiredPaths.some((p) => pathname.startsWith(p))
  const isGuestOnly = guestOnlyPaths.some((p) => pathname.startsWith(p))

  if ((isAuthRequired || isAdminRequired) && !token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isGuestOnly && token) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/my/:path*",
    "/order/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
}
