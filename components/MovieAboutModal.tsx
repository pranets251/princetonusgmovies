"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import Poster from "@/components/Poster"
import DirectorLine from "@/components/DirectorLine"
import { MovieSummary } from "@/lib/movieTypes"

// Popup with a movie's plot overview, opened from the "About" link under each title.
export default function MovieAboutModal({ movie, onClose }: { movie: MovieSummary; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div role="dialog" aria-label={`About ${movie.title}`} className="pop-in max-h-[85vh] w-full max-w-lg overflow-y-auto border-2 border-black bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-black px-4 py-3 text-white">
          <h2 className="text-base font-bold">About</h2>
          <button onClick={onClose} aria-label="Close" className="hover:text-neutral-300"><X size={20} /></button>
        </div>
        <div className="flex gap-4 p-5">
          <Poster movie={movie} size="w185" className="hidden h-[165px] w-[110px] shrink-0 border border-neutral-300 sm:block" />
          <div className="min-w-0 text-left">
            <h3 className="text-xl font-bold leading-tight">
              {movie.title}
              {movie.year ? <span className="font-normal text-neutral-600"> ({movie.year})</span> : null}
            </h3>
            <DirectorLine director={movie.director} className="mt-1 text-base" />
            {movie.cast && movie.cast.length > 0 && (
              <p className="mt-1 text-base text-neutral-600">
                <span className="font-bold text-neutral-800">Starring</span> {movie.cast.join(", ")}
              </p>
            )}
            <p className="mt-3 text-[15px] leading-relaxed text-neutral-800">
              {movie.overview || "No description is available for this movie."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
