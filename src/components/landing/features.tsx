import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Shield, Database, Cpu } from "lucide-react"

const items = [
  { icon: Zap, title: "AI Ready", description: "OpenAI and Anthropic SDKs pre-wired with streaming endpoints." },
  { icon: Shield, title: "Auth Built In", description: "NextAuth with GitHub and Google providers. JWT sessions." },
  { icon: Database, title: "Database Included", description: "Prisma with SQLite. Swap to Postgres in one line." },
  { icon: Cpu, title: "Deploy Instantly", description: "Vercel and Railway configs. Push to GitHub and go live." },
]

export function Features() {
  return (
    <section className="py-20 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-white text-center">Everything You Need</h2>
        <p className="mt-4 text-gray-400 text-center max-w-xl mx-auto">
          Stop wiring auth and databases from scratch. Start with the boring stuff done.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="h-8 w-8 text-white mb-3" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
