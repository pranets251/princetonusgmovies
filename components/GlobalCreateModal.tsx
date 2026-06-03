"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import CreatePostModal from "@/components/CreatePostModal"

export default function GlobalCreateModal() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    function handle() { setOpen(true) }
    window.addEventListener("open-create-modal", handle)
    return () => window.removeEventListener("open-create-modal", handle)
  }, [])

  if (!open) return null

  return (
    <CreatePostModal
      onClose={() => setOpen(false)}
      onMovieSelected={movie => {
        setOpen(false)
        router.push(`/tagline/${movie.id}`)
      }}
    />
  )
}
