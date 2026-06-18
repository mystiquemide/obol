// Pre-seeded data for demo mode. Judges click around, everything feels real.
export const demoUser = {
  name: "Sarah Chen",
  email: "sarah@example.com",
  avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
}

export const demoData = {
  stats: { users: 1284, revenue: "$12.4k", uptime: "99.9%", projects: 47 },
  recentActivity: [
    { id: 1, action: "Created project", target: "Marketing Site", time: "2 min ago" },
    { id: 2, action: "Deployed", target: "API v2.1", time: "15 min ago" },
    { id: 3, action: "Resolved alert", target: "High CPU on prod-3", time: "1 hour ago" },
  ]
}

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true"
