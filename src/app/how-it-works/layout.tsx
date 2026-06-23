import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "How it works",
  description: "From a listen to an on-chain USDC payment: how Obol matches artists, settles on Arc, and records the proof.",
}

export default function HowItWorksLayout({ children }: { children: React.ReactNode }) {
  return children
}
