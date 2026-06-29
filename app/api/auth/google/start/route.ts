import { buildGoogleAuthUrl, getRedirectUri, sanitizeCallbackUrl } from "@/lib/google-oauth"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth/google",
  maxAge: 300,
}

export async function GET(req: NextRequest) {
  const state = crypto.randomUUID()
  const callbackUrl = sanitizeCallbackUrl(req.nextUrl.searchParams.get("callbackUrl"))
  const redirectUri = getRedirectUri(req)

  const cookieStore = await cookies()
  cookieStore.set("oauth_state", state, COOKIE_OPTS)
  cookieStore.set("oauth_callback", callbackUrl, COOKIE_OPTS)

  return NextResponse.redirect(buildGoogleAuthUrl({ redirectUri, state }))
}
