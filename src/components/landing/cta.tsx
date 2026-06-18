import { Button } from "@/components/ui/button"
import Link from "next/link"

export function CTA() {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-3xl text-center rounded-2xl border border-gray-800 bg-gray-900/50 p-12">
        <h2 className="text-3xl font-bold text-white">Ready to Ship?</h2>
        <p className="mt-4 text-gray-400">
          Clone this repo. Strip what you don&apos;t need. Build your idea.
        </p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button size="lg">Start Building</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
