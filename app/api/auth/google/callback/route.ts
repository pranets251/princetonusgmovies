import { adminAuth } from "@/lib/firebase-admin"
import { exchangeCodeForTokens, getRedirectUri, verifyGoogleIdToken } from "@/lib/google-oauth"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const COOKIE_PATH = "/api/auth/google"

export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const storedState = cookieStore.get("oauth_state")?.value
  const callbackUrl = cookieStore.get("oauth_callback")?.value ?? "/"
  cookieStore.delete({ name: "oauth_state", path: COOKIE_PATH })
  cookieStore.delete({ name: "oauth_callback", path: COOKIE_PATH })

  const code = req.nextUrl.searchParams.get("code")
  const state = req.nextUrl.searchParams.get("state")

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  try {
    const { id_token } = await exchangeCodeForTokens({ code, redirectUri: getRedirectUri(req) })
    const { email, email_verified } = await verifyGoogleIdToken(id_token)

    if (!email_verified || !email.endsWith("@princeton.edu")) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }

    let uid: string
    try {
      uid = (await adminAuth.getUserByEmail(email)).uid
    } catch (err) {
      if ((err as { code?: string }).code !== "auth/user-not-found") throw err
      try {
        uid = (await adminAuth.createUser({ email })).uid
      } catch (createErr) {
        if ((createErr as { code?: string }).code !== "auth/email-already-exists") throw createErr
        uid = (await adminAuth.getUserByEmail(email)).uid
      }
    }

    const customToken = await adminAuth.createCustomToken(uid)
    const finishUrl = `${new URL(req.url).origin}/login/finish#token=${encodeURIComponent(customToken)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    return NextResponse.redirect(finishUrl)
  } catch {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }
}
