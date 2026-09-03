"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import PosterPicker from "./PosterPicker"
import TaglineCreateStep, { CreateTaglineData, ExistingMark } from "./TaglineCreateStep"

interface Board {
  tmdb_id: number
  movie_title: string
  poster_path: string
  composite_url?: string
}

export interface EditingTagline {
  id: string
  text: string
  html: string
  color: string
  x: number
  y: number
  fontSize?: number
}

interface TaglineFlowProps {
  tmdbId: number
  movieTitle: string
  initialBoard: Board | null
  existingMarks?: ExistingMark[]
  username?: string
  editingTagline?: EditingTagline | null
}

export default function TaglineFlow({ tmdbId, movieTitle, initialBoard, existingMarks = [], username, editingTagline }: TaglineFlowProps) {
  const router = useRouter()
  const [posterPath, setPosterPath] = useState<string | null>(initialBoard?.poster_path ?? null)

  const title = initialBoard?.movie_title || movieTitle

  // True when this movie has no board yet — user must pick the poster first
  const isFirstTaglineForMovie = !initialBoard

  const step: "poster" | "create" = !posterPath ? "poster" : "create"

  async function handlePost(data: CreateTaglineData) {
    const res = editingTagline
      ? await fetch(`/api/taglines/${editingTagline.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: data.text, html: data.html, color: data.color,
            x: data.x, y: data.y,
            fontSize: data.fontSize, bwf: data.bwf, bhf: data.bhf,
            creationBoxW: data.creationBoxW,
          }),
        })
      : await fetch("/api/taglines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tmdb_id: tmdbId,
            movie_title: title,
            poster_path: posterPath,
            x: data.x, y: data.y,
            text: data.text, html: data.html, font: data.font, color: data.color,
            fontSize: data.fontSize, bwf: data.bwf, bhf: data.bhf,
            creationBoxW: data.creationBoxW,
          }),
        })
    if (res.ok) {
      router.push(username ? `/profile/${username}` : "/")
    }
  }

  function handleCreateBack() {
    if (isFirstTaglineForMovie) {
      // Came from poster selection — go back to it
      setPosterPath(null)
    } else {
      router.back()
    }
  }

  if (step === "poster") {
    return (
      <PosterPicker
        tmdbId={tmdbId}
        movieTitle={title}
        onPosterSelected={setPosterPath}
        onBack={() => router.back()}
        onExit={() => router.back()}
      />
    )
  }

  return (
    <TaglineCreateStep
      posterPath={posterPath!}
      movieTitle={title}
      isFirstTagline={isFirstTaglineForMovie}
      existingMarks={existingMarks}
      initialData={editingTagline ? {
        text: editingTagline.text, html: editingTagline.html, color: editingTagline.color,
        x: editingTagline.x, y: editingTagline.y, fontSize: editingTagline.fontSize,
      } : undefined}
      postLabel={editingTagline ? "SAVE" : "POST"}
      onBack={handleCreateBack}
      onExit={() => router.back()}
      onPost={handlePost}
    />
  )
}
