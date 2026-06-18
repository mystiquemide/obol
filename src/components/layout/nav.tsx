import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Nav() {
  return (
    <nav className="fixed top-0 z-40 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold text-white tracking-tight">
          Boilerplate
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
          <Link href="/api/auth/signin">
            <Button size="sm">Sign In</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
