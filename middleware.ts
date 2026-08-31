import { NextRequest, NextResponse } from "next/server"

const MOBILE_UA = /iPhone|Android|webOS|BlackBerry|IEMobile|Opera Mini/i

export function middleware(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? ""
  const pathname = req.nextUrl.pathname

  // Redirect mobile browsers to the app download page
  // Allow /get-app itself and all API/asset routes through
  if (
    MOBILE_UA.test(ua) &&
    !pathname.startsWith("/get-app") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/favicon")
  ) {
    return NextResponse.redirect(new URL("/get-app", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
