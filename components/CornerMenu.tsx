"use client"

import { useEffect, useRef, useState } from "react"
import { CirclePlus, LogOut, MoreHorizontal } from "lucide-react"
import MovieSearchModal from "@/components/MovieSearchModal"

// The three-dots menu in the bottom-right corner. Admin-only actions live in the same menu.
export default function CornerMenu({ isAdmin }: { isAdmin: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [screenedOpen, setScreenedOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [menuOpen])

  async function signOut() {
    await fetch("/api/auth/session", { method: "DELETE" })
    window.location.href = "/login"
  }

  function openScreened() {
    setMenuOpen(false)
    setScreenedOpen(true)
  }

  const itemClass = "flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-bold hover:bg-neutral-100"

  return (
    <>
      <div ref={menuRef} className="fixed bottom-6 right-6 z-30">
        {menuOpen && (
          <div className="pop-in absolute bottom-full right-0 mb-2 w-64 border-2 border-black bg-white shadow-xl">
            {isAdmin && (
              <button onClick={openScreened} className={`${itemClass} border-b border-neutral-200`}>
                <CirclePlus size={16} /> Add already-screened movie
              </button>
            )}
            <button onClick={signOut} className={`${itemClass} text-red-600`}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        )}
        <button
          onClick={() => setMenuOpen(v => !v)}
          aria-label="More options"
          aria-expanded={menuOpen}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white hover:bg-black hover:text-white"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      {screenedOpen && (
        <MovieSearchModal mode="screen" title="Add an already-screened movie" onClose={() => setScreenedOpen(false)} />
      )}
    </>
  )
}
