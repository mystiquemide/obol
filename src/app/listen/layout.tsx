import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Listen",
  description: "Press play and pay the artist a USDC nanopayment on Arc, settled in about a second over HTTP 402.",
}

export default function ListenLayout({ children }: { children: React.ReactNode }) {
  return children
}
