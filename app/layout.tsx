import type { Metadata } from "next"
import { Raleway } from "next/font/google"
import "./globals.css"

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Princeton USG Movies",
  description: "Princeton campus movie edits, ranked and discussed.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={raleway.variable}>
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--bg)" }}>
        {children}
      </body>
    </html>
  )
}
