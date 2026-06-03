import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const profileDoc = await adminDb.collection("profiles").doc(email).get()
  const username = profileDoc.exists ? (profileDoc.data() as any).username : null
  return NextResponse.json({ email, username })
}

const SESSION_DURATION_MS = 60 * 60 * 24 * 14 * 1000 // 14 days

export async function POST(req: Request) {
  const { idToken } = await req.json()

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    if (!decoded.email?.endsWith("@princeton.edu")) {
      return NextResponse.json(
        { error: "Only @princeton.edu accounts are allowed" },
        { status: 403 }
      )
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    })

    const cookieStore = await cookies()
    cookieStore.set("__session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("__session")
  return NextResponse.json({ ok: true })
}
