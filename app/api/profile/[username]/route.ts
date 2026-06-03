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

  // Fetch this user's posts
  const postsSnap = await adminDb
    .collection("posts")
    .where("user_email", "==", profileEmail)
    .get()

  const posts = postsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a: any, b: any) => (b.created_at > a.created_at ? 1 : -1))

  // Enrich with likes
  const enriched = await Promise.all(
    posts.map(async (post: any) => {
      const [likesSnap, myLike] = await Promise.all([
        adminDb.collection("likes").where("post_id", "==", post.id).get(),
        adminDb.collection("likes").doc(`${post.id}_${email}`).get(),
      ])

      // Resolve original creator
      let original_creator_username = null
      let original_creator_photo = null
      if (post.original_creator_email) {
        const oc = await adminDb.collection("profiles").doc(post.original_creator_email).get()
        if (oc.exists) {
          original_creator_username = (oc.data() as any).username ?? null
          original_creator_photo = (oc.data() as any).photo_url ?? null
        }
      }

      return {
        ...post,
        username: profile.username,
        photo_url: profile.photo_url ?? null,
        like_count: likesSnap.size,
        liked_by_me: myLike.exists,
        original_creator_username,
        original_creator_photo,
      }
    })
  )

  return NextResponse.json({
    profile: {
      username: profile.username,
      bio: profile.bio ?? null,
      photo_url: profile.photo_url ?? null,
      email: profileEmail,
      is_self: profileEmail === email,
      post_count: posts.length,
    },
    posts: enriched,
  })
}
