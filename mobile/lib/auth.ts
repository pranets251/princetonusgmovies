import { GoogleAuthProvider, signInWithCredential, signOut as firebaseSignOut } from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "./firebase"
import { PRINCETON_EMAIL_DOMAIN } from "@/constants/config"

export async function signInWithGoogleToken(idToken: string) {
  const credential = GoogleAuthProvider.credential(idToken)
  const result = await signInWithCredential(auth, credential)
  const email = result.user.email ?? ""

  if (!email.endsWith(PRINCETON_EMAIL_DOMAIN)) {
    await firebaseSignOut(auth)
    throw new Error("Only Princeton email addresses are allowed.")
  }

  return result.user
}

export async function getUserProfile(email: string) {
  const snap = await getDoc(doc(db, "profiles", email))
  return snap.exists() ? snap.data() : null
}

export async function createProfile(email: string, username: string) {
  await setDoc(doc(db, "profiles", email), {
    username,
    bio: "",
    photo_url: "",
    created_at: serverTimestamp(),
  })
}

export async function signOut() {
  await firebaseSignOut(auth)
}
