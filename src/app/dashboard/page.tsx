import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="pt-24 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="mt-2 text-gray-400">Welcome. Customize this page with your data.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Users", value: "1,284" },
            { title: "Revenue", value: "$12.4k" },
            { title: "Uptime", value: "99.9%" },
            { title: "Projects", value: "47" },
          ].map((stat) => (
            <Card key={stat.title}>
              <CardHeader>
                <CardDescription>{stat.title}</CardDescription>
                <CardTitle className="text-2xl">{stat.value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
