"use client"

import { useEffect, useState } from "react"

// Module-level cache — fetched once per page load, shared across all BoardThumbnail instances
let cache: Set<number> | null = null
let fetchPromise: Promise<void> | null = null

export function useHighlightedMovies(): Set<number> {
  const [ids, setIds] = useState<Set<number>>(cache ?? new Set())

  useEffect(() => {
    if (cache) return
    if (!fetchPromise) {
      fetchPromise = fetch("/api/config/highlighted-movies")
        .then(r => r.json())
        .then(data => {
          cache = new Set((data.tmdb_ids ?? []) as number[])
          setIds(cache)
        })
        .catch(() => { cache = new Set() })
    } else {
      fetchPromise.then(() => { if (cache) setIds(cache) })
    }
  }, [])

  return ids
}
