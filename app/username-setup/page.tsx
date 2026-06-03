"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function UsernameSetupPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.email) setUsername(data.email.split("@")[0])
      })
  }, [])

  async function handleContinue() {
    setError("")
    setLoading(true)
    const res = await fetch("/api/username-setup", { method: "POST" })
    setLoading(false)
    if (res.ok) {
      router.push("/")
    } else {
      const data = await res.json()
      setError(data.error ?? "Something went wrong")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg)" }}>
      <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Princeton USG Movies</h1>
          <p className="text-zinc-400 text-sm">Your username will be your Princeton NetID</p>
        </div>

        {username && (
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-6 py-4 w-full">
            <p className="text-zinc-500 text-xs mb-1">Your username</p>
            <p className="text-white text-xl font-bold">{username}</p>
          </div>
        )}

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={loading || !username}
          className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "Setting up…" : "Continue"}
        </button>
      </div>
    </div>
  )
}
