"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil } from "lucide-react"
import { useHighlightedMovies } from "@/lib/useHighlightedMovies"

interface Props {
  tmdbId: number
  title: string
  year?: string
}

function dashedBorder(color: string): React.CSSProperties {
  const dash = `${color} 0, ${color} 20px, transparent 0, transparent 44px`
  return {
    backgroundImage: [
      `repeating-linear-gradient(90deg, ${dash})`,
      `repeating-linear-gradient(180deg, ${dash})`,
      `repeating-linear-gradient(90deg, ${dash})`,
      `repeating-linear-gradient(180deg, ${dash})`,
    ].join(", "),
    backgroundPosition: "top, right, bottom, left",
    backgroundSize: "44px 1.5px, 1.5px 44px, 44px 1.5px, 1.5px 44px",
    backgroundRepeat: "repeat-x, repeat-y, repeat-x, repeat-y",
  }
}

export default function DashedMovieCard({ tmdbId, title, year }: Props) {
  const router = useRouter()
  const [hovered, setHovered] = useState(false)
  const highlightedMovies = useHighlightedMovies()
  const isHighlighted = highlightedMovies.has(tmdbId)

  const baseColor = isHighlighted ? "#4EA832" : "#52525b"
  const color = hovered ? "#F5B800" : baseColor

  return (
    <div
      onClick={() => router.push(`/tagline/${tmdbId}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        aspectRatio: "2/3",
        background: "var(--bg)",
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        cursor: "pointer",
        ...dashedBorder(color),
        transition: "all 0.18s ease",
      }}
    >
      <Pencil size={36} strokeWidth={1.5} style={{ color, transition: "color 0.18s ease", flexShrink: 0 }} />
      <p style={{
        fontSize: 15, fontWeight: 600, color, textAlign: "center",
        margin: 0, padding: "0 10px", letterSpacing: "0.05em",
        textTransform: "uppercase", lineHeight: 1.5,
        transition: "color 0.18s ease",
      }}>
        make a tagline for<br />
        &ldquo;{title}&rdquo;{year ? ` (${year})` : ""}
      </p>
    </div>
  )
}
