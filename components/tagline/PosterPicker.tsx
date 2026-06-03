"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, X } from "lucide-react"
import Image from "next/image"

const TMDB_IMG = "https://image.tmdb.org/t/p/original"

interface PosterPickerProps {
  tmdbId: number
  movieTitle: string
  onPosterSelected: (posterPath: string) => void
  onBack: () => void
  onExit: () => void
}

function ProgressTracker({ activeStep }: { activeStep: 1 | 2 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {/* Step 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: activeStep === 1 ? "#fff" : "#3f3f46",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: activeStep === 1 ? "#000" : "#a1a1aa" }}>1</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: activeStep === 1 ? 600 : 400, color: activeStep === 1 ? "#fff" : "#71717a", whiteSpace: "nowrap" }}>
          Choose a Poster
        </span>
      </div>

      {/* Connector */}
      <div style={{ width: 65, height: 1, background: "#3f3f46", flexShrink: 0 }} />

      {/* Step 2 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: activeStep === 2 ? "#fff" : "transparent",
          border: activeStep === 2 ? "none" : "2px solid #3f3f46",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: activeStep === 2 ? "#000" : "#52525b" }}>2</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: activeStep === 2 ? 600 : 400, color: activeStep === 2 ? "#fff" : "#52525b", whiteSpace: "nowrap" }}>
          Add your tagline
        </span>
      </div>
    </div>
  )
}

export { ProgressTracker }

export default function PosterPicker({ tmdbId, movieTitle, onPosterSelected, onBack, onExit }: PosterPickerProps) {
  const [posters, setPosters] = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/tmdb/movie/${tmdbId}/posters`)
      .then(r => r.json())
      .then(data => {
        const list: string[] = data.posters ?? []
        setPosters(list)
        setSelected(list[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [tmdbId])

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: "var(--bg)" }}>

      {/* ── Top bar ── */}
      <div
        className="flex items-center justify-between flex-shrink-0 border-b"
        style={{ height: 104, padding: "0 28px", borderColor: "var(--border)" }}
      >
        <button
          onClick={onBack}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, background: "#fff", border: "none", borderRadius: 12, color: "#000", cursor: "pointer" }}
        >
          <ArrowLeft size={25} />
        </button>

        <ProgressTracker activeStep={1} />

        <button
          onClick={onExit}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 50, height: 50, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, color: "#ef4444", cursor: "pointer" }}
        >
          <X size={25} />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Header text — center-aligned, scrolls away with content */}
        <div style={{ textAlign: "center", padding: "60px 32px 44px" }}>
          <h1 style={{ fontSize: 43, fontWeight: 700, color: "#fff", margin: "0 0 20px", lineHeight: 1.2 }}>
            You&apos;re the first person to make a tagline for this movie!
          </h1>
          <p style={{ fontSize: 18, color: "#a1a1aa", lineHeight: 1.75, maxWidth: 600, margin: "0 auto" }}>
            You get to choose the poster EVERY future tagline for this movie will have to be written on!
            Once you post your tagline, this choice is final...choose wisely!
          </p>
        </div>

        {/* Poster grid — centered, middle 50% of screen width */}
        <div style={{ width: "50%", margin: "0 auto", paddingBottom: 100 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : posters.length === 0 ? (
            <p style={{ textAlign: "center", color: "#71717a", fontSize: 18, padding: "80px 0" }}>
              No posters found for this movie.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
              {posters.map(path => (
                <button
                  key={path}
                  onClick={() => setSelected(path)}
                  style={{
                    position: "relative",
                    aspectRatio: "2/3",
                    border: "none",
                    padding: 0,
                    borderRadius: 14,
                    overflow: "hidden",
                    cursor: "pointer",
                    outline: selected === path ? "3px solid rgb(245,184,0)" : "3px solid transparent",
                    outlineOffset: "4px",
                    transition: "outline-color 0.15s",
                  }}
                >
                  <Image
                    src={`${TMDB_IMG}${path}`}
                    alt="Poster option"
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Floating Continue button ── */}
      <button
        onClick={() => selected && onPosterSelected(selected)}
        disabled={!selected}
        style={{
          position: "fixed",
          bottom: 32,
          right: 36,
          padding: "19px 42px",
          borderRadius: 14,
          border: "none",
          background: selected ? "#fff" : "#27272a",
          color: selected ? "#000" : "#52525b",
          fontWeight: 700,
          fontSize: 19,
          cursor: selected ? "pointer" : "not-allowed",
          transition: "background 0.15s, color 0.15s",
          zIndex: 50,
          boxShadow: selected ? "0 4px 24px rgba(0,0,0,0.5)" : "none",
        }}
      >
        Continue
      </button>
    </div>
  )
}
