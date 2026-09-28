import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "MovieMash",
  description: "Which Princeton movie would you rather watch? Pick head to head and help rank them.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
