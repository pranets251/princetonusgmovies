import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Get the App — Princeton USG Movies",
  description: "Download the Princeton USG Movies app for iPhone.",
}

export default function GetAppPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0f0f0f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ maxWidth: 360, width: "100%", textAlign: "center" }}>
        {/* Logo placeholder */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
            margin: "0 auto 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 40 }}>🎬</span>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.5px",
            margin: "0 0 12px",
          }}
        >
          Princeton USG Movies
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "#888",
            lineHeight: 1.6,
            margin: "0 0 36px",
          }}
        >
          Write taglines on movie posters.
          The best way to experience it is in the app.
        </p>

        {/* App Store button */}
        <a
          href="https://apps.apple.com/app/princeton-usg-movies/idXXXXXXXXX"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            backgroundColor: "#ffffff",
            color: "#000000",
            borderRadius: 14,
            padding: "14px 24px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: 16,
            marginBottom: 16,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#000">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Download on the App Store
        </a>

        <a
          href="/"
          style={{
            display: "block",
            color: "#555",
            textDecoration: "none",
            fontSize: 14,
            paddingTop: 8,
          }}
        >
          Continue in browser →
        </a>
      </div>
    </div>
  )
}
