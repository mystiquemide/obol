import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Connect a library, set your per-listen rate and daily cap, and watch the agent pay artists on-chain.",
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children
}
