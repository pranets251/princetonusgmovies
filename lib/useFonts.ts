"use client"

import { useEffect } from "react"
import { Tagline } from "./taglineTypes"

// Module-level set — persists across mounts, prevents duplicate <link> injections
// for the same font family even when multiple components are mounted simultaneously.
const loadedFamilies = new Set<string>()

export function useFonts(taglines: Tagline[]) {
  useEffect(() => {
    const newFamilies = [...new Set(taglines.map(t => t.font).filter(Boolean))]
      .filter(f => !loadedFamilies.has(f))
    if (!newFamilies.length) return
    newFamilies.forEach(f => loadedFamilies.add(f))
    const families = newFamilies.map(f => `family=${encodeURIComponent(f)}`).join("&")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`
    document.head.appendChild(link)
  }, [taglines])
}
