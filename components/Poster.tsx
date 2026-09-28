"use client"

/* eslint-disable @next/next/no-img-element */
import { useState } from "react"
import { MovieSummary, posterUrl } from "@/lib/movieTypes"

// TMDB posters are served straight from their CDN (no Next image optimizer hop) so that
// rapid-fire matchups stay snappy. A movie with no poster (or one that fails to load) is a blank box.
export default function Poster({
  movie,
  size = "w342",
  className = "",
  eager = false,
}: {
  movie: Pick<MovieSummary, "title" | "poster_path">
  size?: "w185" | "w342" | "w500"
  className?: string
  eager?: boolean
}) {
  const src = posterUrl(movie.poster_path, size)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (!src || failedSrc === src) return <div className={`bg-neutral-200 ${className}`} />
  return (
    <img
      src={src}
      alt={`${movie.title} poster`}
      draggable={false}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailedSrc(src)}
      className={`object-cover ${className}`}
    />
  )
}
