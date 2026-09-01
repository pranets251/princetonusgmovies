"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BarChart2, Search, User, Pencil } from "lucide-react"

interface BottomNavProps {
  username: string
}

export default function BottomNav({ username }: BottomNavProps) {
  const pathname = usePathname()

  const links = [
    { href: "/", icon: Home },
    { href: "/film-room", icon: BarChart2 },
    { href: "/search", icon: Search },
    { href: `/profile/${username}`, icon: User },
  ]

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links.slice(0, 2).map(({ href, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return (
          <Link key={href} href={href} className="flex items-center justify-center flex-1 py-3">
            <Icon size={22} color={active ? "#fff" : "#71717a"} />
          </Link>
        )
      })}

      <button
        onClick={() => window.dispatchEvent(new Event("open-create-modal"))}
        className="flex items-center justify-center w-11 h-11 rounded-full bg-white text-black flex-shrink-0"
        aria-label="Tagline a movie"
      >
        <Pencil size={20} strokeWidth={2.5} />
      </button>

      {links.slice(2).map(({ href, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href))
        return (
          <Link key={href} href={href} className="flex items-center justify-center flex-1 py-3">
            <Icon size={22} color={active ? "#fff" : "#71717a"} />
          </Link>
        )
      })}
    </nav>
  )
}
