import { createRemoteJWKSet, jwtVerify } from "jose"
import type { NextRequest } from "next/server"

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
const GOOGLE_ISSUER = "https://accounts.google.com"

const googleJwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL))

export function getRedirectUri(req: NextRequest): string {
  return `${new URL(req.url).origin}/api/auth/google/callback`
}

export function sanitizeCallbackUrl(value: string | null): string {
  if (!value) return "/"
  if (!value.startsWith("/")) return "/"
  if (value.startsWith("//")) return "/"
  if (value.includes("://")) return "/"
  return value
}

export function buildGoogleAuthUrl({ redirectUri, state }: { redirectUri: string; state: string }): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    access_type: "online",
    state,
  })
  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens({
  code,
  redirectUri,
}: {
  code: string
  redirectUri: string
}): Promise<{ id_token: string }> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`)
  return res.json()
}

export async function verifyGoogleIdToken(idToken: string): Promise<{ email: string; email_verified: boolean }> {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: GOOGLE_ISSUER,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID!,
  })
  if (!payload.email || typeof payload.email !== "string") throw new Error("Google ID token missing email")
  return { email: payload.email, email_verified: payload.email_verified === true }
}
