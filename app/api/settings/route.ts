import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bio, photo_url } = await req.json()
  const updates: Record<string, string> = {}

  if (bio !== undefined) {
    updates.bio = bio.trim().slice(0, 160)
  }

  if (photo_url !== undefined && typeof photo_url === "string") {
    updates.photo_url = photo_url
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
  }

  await adminDb.collection("profiles").doc(email).update(updates)
  return NextResponse.json({ ok: true })
}
