"use client"

import { auth } from "@/lib/firebase"
import { signInWithCustomToken } from "firebase/auth"
import { useEffect } from "react"

function sanitizeCallbackUrl(value: string | null): string {
  if (!value) return "/"
  if (!value.startsWith("/")) return "/"
  if (value.startsWith("//")) return "/"
  if (value.includes("://")) return "/"
  return value
}

export default function LoginFinishPage() {
  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const token = hash.get("token")
    const callbackUrl = sanitizeCallbackUrl(hash.get("callbackUrl"))

    if (!token) {
      window.location.href = "/unauthorized"
      return
    }

    signInWithCustomToken(auth, token)
      .then((result) => result.user.getIdToken())
      .then((idToken) =>
        fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })
      )
      .then(async (res) => {
        if (!res.ok) throw new Error("session creation failed")
        window.location.href = callbackUrl
      })
      .catch(async () => {
        await auth.signOut()
        window.location.href = "/unauthorized"
      })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <p className="text-zinc-400 text-sm">Signing in...</p>
    </div>
  )
}
