import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "For artists",
  description: "Find your earnings, claim them to a wallet, or list your own tracks to get paid per listen on-chain.",
}

export default function ArtistsLayout({ children }: { children: React.ReactNode }) {
  return children
}
