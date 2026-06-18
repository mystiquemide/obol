import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-4">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Your Next Project Starts Here
        </h1>
        <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
          Pre-built with auth, database, AI integrations, and deploy configs.
          Clone and start building in minutes, not hours.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="https://github.com">
            <Button variant="outline" size="lg">View on GitHub</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
