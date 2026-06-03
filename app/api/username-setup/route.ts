import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST() {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Username is always the NetID — the part before @ in the Princeton email
  const username = email.split("@")[0]

  const existing = await adminDb.collection("profiles").doc(email).get()
  if (existing.exists) {
    return NextResponse.json({ ok: true, username })
  }

  await adminDb.collection("profiles").doc(email).set({
    email,
    username,
    created_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, username })
}
