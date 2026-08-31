import { NextRequest, NextResponse } from "next/server"

const MOBILE_UA = /iPhone|Android|webOS|BlackBerry|IEMobile|Opera Mini/i

export function proxy(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? ""
  if (MOBILE_UA.test(ua)) {
    return NextResponse.redirect(new URL("/get-app", req.url))
  }

  const sessionCookie = req.cookies.get("__session")?.value
  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|login|unauthorized|get-app).*)"],
}
