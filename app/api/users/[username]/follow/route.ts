import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { NextResponse } from "next/server"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { username } = await params

  const targetSnap = await adminDb
    .collection("profiles")
    .where("username", "==", username)
    .limit(1)
    .get()

  if (targetSnap.empty) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const targetEmail = targetSnap.docs[0].id
  if (targetEmail === email) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
  }

  const docId = `${email}_${targetEmail}`
  const ref = adminDb.collection("follows").doc(docId)
  const existing = await ref.get()

  if (existing.exists) {
    await ref.delete()
    return NextResponse.json({ following: false })
  } else {
    await ref.set({
      follower_email: email,
      following_email: targetEmail,
      created_at: new Date().toISOString(),
    })
    return NextResponse.json({ following: true })
  }
}
