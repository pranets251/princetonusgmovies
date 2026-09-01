import { NextRequest, NextResponse } from "next/server"

export function proxy(req: NextRequest) {
  const sessionCookie = req.cookies.get("__session")?.value
  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/|login|unauthorized).*)"],
}
