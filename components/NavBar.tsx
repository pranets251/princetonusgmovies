"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/top4", label: "My Top 4" },
  { href: "/ratings", label: "Rate past screenings" },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="relative flex flex-col items-center gap-2 bg-black px-5 py-4 text-white xl:h-[88px] xl:flex-row xl:justify-between xl:py-0">
      <Link href="/" className="text-3xl font-bold tracking-wide sm:text-[40px]">
        MOVIEMASH
      </Link>

      <nav className="flex flex-wrap items-center justify-center text-[15px] font-bold sm:text-lg">
        {LINKS.map(({ href, label }, i) => (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1 hover:text-neutral-300 sm:px-4 ${i < LINKS.length - 1 ? "border-r border-white/40" : "xl:pr-0"} ${
              pathname === href ? "underline underline-offset-8" : ""
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
