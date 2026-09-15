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
    <div className="flex items-center gap-2 sm:gap-3.5">
      {/* Step 1 */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div
          className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: activeStep === 1 ? "#fff" : "#3f3f46" }}
        >
          <span className="text-sm sm:text-base" style={{ fontWeight: 700, color: activeStep === 1 ? "#000" : "#a1a1aa" }}>1</span>
        </div>
        <span className="hidden sm:inline" style={{ fontSize: 16, fontWeight: activeStep === 1 ? 600 : 400, color: activeStep === 1 ? "#fff" : "#71717a", whiteSpace: "nowrap" }}>
          Choose a Poster
        </span>
      </div>

      {/* Connector */}
      <div className="w-6 sm:w-[65px]" style={{ height: 1, background: "#3f3f46", flexShrink: 0 }} />

      {/* Step 2 */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        <div
          className="w-8 h-8 sm:w-[38px] sm:h-[38px] rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: activeStep === 2 ? "#fff" : "transparent",
            border: activeStep === 2 ? "none" : "2px solid #3f3f46",
          }}
        >
          <span className="text-sm sm:text-base" style={{ fontWeight: 700, color: activeStep === 2 ? "#000" : "#52525b" }}>2</span>
        </div>
        <span className="hidden sm:inline" style={{ fontSize: 16, fontWeight: activeStep === 2 ? 600 : 400, color: activeStep === 2 ? "#fff" : "#52525b", whiteSpace: "nowrap" }}>
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
        className="flex items-center justify-between flex-shrink-0 border-b h-16 sm:h-[104px] px-3 sm:px-7"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 sm:w-[50px] sm:h-[50px]"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", border: "none", borderRadius: 12, color: "#000", cursor: "pointer", flexShrink: 0 }}
        >
          <ArrowLeft size={20} className="sm:hidden" />
          <ArrowLeft size={25} className="hidden sm:block" />
        </button>

        <ProgressTracker activeStep={1} />

        <button
          onClick={onExit}
          className="w-10 h-10 sm:w-[50px] sm:h-[50px]"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 12, color: "#ef4444", cursor: "pointer", flexShrink: 0 }}
        >
          <X size={20} className="sm:hidden" />
          <X size={25} className="hidden sm:block" />
        </button>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Header text — center-aligned, scrolls away with content */}
        <div className="text-center px-5 pt-8 pb-6 sm:px-8 sm:pt-[60px] sm:pb-11">
          <h1 className="text-2xl sm:text-[43px]" style={{ fontWeight: 700, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 }}>
            You&apos;re the first person to make a tagline for this movie!
          </h1>
          <p className="text-sm sm:text-lg" style={{ color: "#a1a1aa", lineHeight: 1.6, maxWidth: 600, margin: "0 auto" }}>
            You get to choose the poster EVERY future tagline for this movie will have to be written on!
            Once you post your tagline, this choice is final...choose wisely!
          </p>
        </div>

        {/* Poster grid — full width on mobile, centered middle 50% on larger screens */}
        <div className="w-full px-4 sm:w-1/2 sm:px-0 sm:mx-auto" style={{ paddingBottom: 100 }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            </div>
          ) : posters.length === 0 ? (
            <p style={{ textAlign: "center", color: "#71717a", fontSize: 18, padding: "80px 0" }}>
              No posters found for this movie.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-[18px]">
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
        className="px-6 py-3.5 text-base bottom-4 right-4 sm:px-[42px] sm:py-[19px] sm:text-lg sm:bottom-8 sm:right-9"
        style={{
          position: "fixed",
          borderRadius: 14,
          border: "none",
          background: selected ? "#fff" : "#27272a",
          color: selected ? "#000" : "#52525b",
          fontWeight: 700,
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
