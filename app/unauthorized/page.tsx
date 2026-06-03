import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <h1 className="text-2xl font-bold text-white">Access Denied</h1>
        <p className="text-zinc-400 text-sm max-w-xs">
          You must sign in with a <span className="text-white font-medium">@princeton.edu</span> Google account to access this site.
        </p>
        <Link
          href="/login"
          className="mt-2 bg-white text-black px-6 py-2.5 rounded-lg font-medium hover:bg-zinc-100 transition-colors text-sm"
        >
          Go back to login
        </Link>
      </div>
    </div>
  )
}
