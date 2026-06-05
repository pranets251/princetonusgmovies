"use client"

import { auth } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from "firebase/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function LoginInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        console.log("[auth] getRedirectResult:", result ? "got result" : "null")
        if (!result) return
        const idToken = await result.user.getIdToken()
        const res = await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }),
        })
        console.log("[auth] session POST status:", res.status)
        if (!res.ok) {
          const body = await res.text()
          console.error("[auth] session POST failed:", body)
          await auth.signOut()
          router.push("/unauthorized")
          return
        }
        const callbackUrl = sessionStorage.getItem("authCallbackUrl") ?? "/"
        sessionStorage.removeItem("authCallbackUrl")
        router.push(callbackUrl)
      })
      .catch((err) => {
        console.error("[auth] getRedirectResult error:", err?.code, err?.message, err)
        setError(true)
      })
      .finally(() => setChecking(false))
  }, [router])

  async function handleSignIn() {
    const callbackUrl = searchParams.get("callbackUrl") ?? "/"
    sessionStorage.setItem("authCallbackUrl", callbackUrl)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ hd: "princeton.edu" })
    await signInWithRedirect(auth, provider)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-white">Princeton USG Movies</h1>
        <p className="text-zinc-400 text-sm">Sign in with your @princeton.edu Google account</p>
        {error && (
          <p className="text-red-400 text-sm">Sign-in failed. Please try again.</p>
        )}
        <button
          onClick={handleSignIn}
          disabled={checking}
          className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {checking ? "Signing in..." : "Sign in with Google"}
        </button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  )
}
