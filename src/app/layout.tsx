import type { Metadata } from "next"
import "./globals.css"
import { Nav } from "@/components/layout/nav"
import { Footer } from "@/components/layout/footer"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Obol — Your music collection pays its creators",
    template: "%s — Obol",
  },
  description: "Per-listen royalty payments for music. Reads your listening, pays artists in USDC on-chain. No subscriptions.",
  openGraph: {
    title: "Obol - Every listen pays the artist",
    description: "Per-listen USDC payments for music, settled on-chain.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Obol - Every listen pays the artist",
    description: "Per-listen USDC payments for music, settled on-chain.",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#0F0F0F] text-[#E1DDD6] flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
