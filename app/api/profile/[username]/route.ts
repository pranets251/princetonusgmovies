import { adminDb } from "@/lib/firebase-admin"
import { getSessionEmail } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const email = await getSessionEmail()
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { username } = await params

  const profileSnap = await adminDb
    .collection("profiles")
    .where("username", "==", username)
    .limit(1)
    .get()

  if (profileSnap.empty) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const profileDoc = profileSnap.docs[0]
  const profileEmail = profileDoc.id
  const profile = profileDoc.data() as any

  const [followersCount, followingCount, viewerFollowDoc] = await Promise.all([
    adminDb.collection("follows").where("following_email", "==", profileEmail).count().get(),
    adminDb.collection("follows").where("follower_email", "==", profileEmail).count().get(),
    adminDb.collection("follows").doc(`${email}_${profileEmail}`).get(),
  ])

  return NextResponse.json({
    profile: {
      username: profile.username,
      bio: profile.bio ?? null,
      photo_url: profile.photo_url ?? null,
      email: profileEmail,
      is_self: profileEmail === email,
      post_count: 0,
      followers: followersCount.data().count,
      following: followingCount.data().count,
      is_following: viewerFollowDoc.exists,
    },
    posts: [],
  })
}
