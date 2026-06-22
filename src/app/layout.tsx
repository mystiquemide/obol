import type { Metadata } from "next"
import { IBM_Plex_Mono, Cormorant } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/layout/nav"
import { Footer } from "@/components/layout/footer"

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
})

// Stand-in for GT Alpina Light — swap out when /public/fonts/GTAlpina-Light.woff2 is available
const cormorant = Cormorant({
  variable: "--font-alpina-fallback",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Obol - Your music collection pays its creators",
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
  // Resolve the actual font-family string Next.js assigned to Cormorant
  const alpinaStack = `'GT Alpina', ${cormorant.style.fontFamily}`

  return (
    <html lang="en" className={`${ibmPlexMono.variable} ${cormorant.variable} h-full antialiased`}>
      <head>
        <style>{`:root { --font-alpina: ${alpinaStack}; }`}</style>
      </head>
      <body className="min-h-full bg-[#0F0F0F] text-[#E1DDD6] flex flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
