"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, BarChart2, User, Pencil, LogOut, MoreHorizontal } from "lucide-react"
import { useState } from "react"

interface LeftNavProps {
  username: string
}

export default function LeftNav({ username }: LeftNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [showSignOut, setShowSignOut] = useState(false)

  async function handleSignOut() {
    await fetch("/api/auth/session", { method: "DELETE" })
    router.push("/login")
  }

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/film-room", label: "Rankings", icon: BarChart2 },
    { href: `/profile/${username}`, label: "Profile", icon: User },
  ]

  return (
    <nav className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 py-6 px-4">
      {/* Brand */}
      <div className="mb-8 px-2">
        <div className="text-sm font-bold text-white leading-tight">Princeton</div>
        <div className="text-sm font-bold text-white leading-tight">USG Movies</div>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}

        {/* Create button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-create-modal"))}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold mt-2 bg-white hover:bg-zinc-100 text-black transition-colors"
        >
          <Pencil size={18} />
          Tagline a Movie!
        </button>
      </div>

      {/* Bottom: greeting + three-dot menu */}
      <div className="flex items-center justify-between px-2 relative">
        <span className="text-zinc-500 text-xs select-none">Hello {username}!</span>

        <div className="relative">
          <button
            onClick={() => setShowSignOut(v => !v)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
          >
            <MoreHorizontal size={16} />
          </button>

          {showSignOut && (
            <div
              className="absolute bottom-8 right-0 rounded-lg border border-zinc-700 overflow-hidden shadow-xl"
              style={{ backgroundColor: "var(--card)", minWidth: "160px" }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors"
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
