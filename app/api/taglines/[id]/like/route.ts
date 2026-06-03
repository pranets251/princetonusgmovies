import { NextResponse } from "next/server"
import { getSessionEmail } from "@/lib/session"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const ref = adminDb.collection("taglines").doc(id)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const data = snap.data() as any
  const liked = (data.likes ?? []).includes(email)

  await ref.update({
    likes: liked ? FieldValue.arrayRemove(email) : FieldValue.arrayUnion(email),
    like_count: liked ? FieldValue.increment(-1) : FieldValue.increment(1),
  })

  return NextResponse.json({ liked: !liked, like_count: (data.like_count ?? 0) + (liked ? -1 : 1) })
}
