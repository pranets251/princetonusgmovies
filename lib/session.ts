import { adminAuth } from "@/lib/firebase-admin"
import { cookies } from "next/headers"

export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("__session")?.value
  if (!sessionCookie) return null

  try {
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true)
    return decoded.email ?? null
  } catch {
    return null
  }
}
