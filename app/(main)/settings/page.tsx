"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { Camera } from "lucide-react"

async function resizeToSquare(file: File, size = 256): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext("2d")!
      const min = Math.min(img.width, img.height)
      const sx = (img.width - min) / 2
      const sy = (img.height - min) / 2
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size)
      resolve(canvas.toDataURL("image/jpeg", 0.82))
    }
    img.src = URL.createObjectURL(file)
  })
}

// Preserves original aspect ratio, caps longest edge at maxDim
async function resizeFullRes(file: File, maxDim = 1200): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", 0.92))
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function SettingsPage() {
  const [username, setUsername] = useState("")
  const [bio, setBio] = useState("")
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const sessionRes = await fetch("/api/auth/session")
      if (!sessionRes.ok) return
      const { username: u } = await sessionRes.json()
      if (!u) return

      const profileRes = await fetch(`/api/profile/${u}`)
      if (profileRes.ok) {
        const data = await profileRes.json()
        setUsername(data.profile.username ?? "")
        setBio(data.profile.bio ?? "")
        setPhotoUrl(data.profile.photo_url ?? null)
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const resized = await resizeToSquare(file)
    setPreviewUrl(resized)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const body: Record<string, string> = { bio }
    if (previewUrl) body.photo_url = previewUrl

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    setSaving(false)
    if (res.ok) {
      if (previewUrl) setPhotoUrl(previewUrl)
      setPreviewUrl(null)
      setMessage("Saved!")
      setTimeout(() => setMessage(""), 2500)
    } else {
      const data = await res.json()
      setMessage(data.error ?? "Failed to save.")
    }
  }

  const avatar = previewUrl ?? photoUrl

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-lg font-bold text-white mb-8">Edit Profile</h1>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* Photo */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center"
          >
            {avatar ? (
              <img src={avatar} alt="Profile photo" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">
                {username.slice(0, 2).toUpperCase()}
              </span>
            )}
            {/* Permanent camera badge */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-1.5 bg-black/50">
              <Camera size={14} className="text-white" />
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Username — read-only, locked to Princeton NetID */}
        <div>
          <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={username}
            readOnly
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-500 text-sm cursor-default select-none"
          />
          <p className="text-zinc-600 text-xs mt-1">Locked to your Princeton NetID</p>
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-1.5">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            maxLength={160}
            rows={4}
            placeholder="Tell people about yourself…"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 text-sm resize-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-white text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-40 text-sm"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {message && (
            <span className={`text-sm ${message === "Saved!" ? "text-zinc-400" : "text-red-400"}`}>
              {message}
            </span>
          )}
        </div>
      </form>
    </div>
  )
}
