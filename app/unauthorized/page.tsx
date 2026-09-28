import Link from "next/link"

export default function UnauthorizedPage() {
  return (
    <div className="m-3 flex min-h-[calc(100dvh-24px)] flex-col border-2 border-black bg-white">
      <header className="flex h-[88px] items-center justify-center bg-black text-3xl font-bold tracking-wide text-white sm:text-[40px]">
        MOVIEMASH
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 pb-16 text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="max-w-xs text-neutral-600">
          You must sign in with a <b className="text-black">@princeton.edu</b> Google account to access this site.
        </p>
        <Link href="/login" className="mt-2 border-2 border-black bg-black px-6 py-2.5 font-bold text-white hover:bg-neutral-800">
          Go back to login
        </Link>
      </div>
    </div>
  )
}
