import { ImageResponse } from "next/og"

export const alt = "Obol — every listen pays the artist, on-chain"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0F0F0F",
          color: "#E1DDD6",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 700, letterSpacing: -2 }}>Obol</div>
        <div style={{ fontSize: 40, color: "#E1DDD6", marginTop: 16 }}>
          Every listen pays the artist.
        </div>
        <div style={{ fontSize: 28, color: "#10B981", marginTop: 28 }}>
          Per-listen USDC payments, settled on-chain.
        </div>
      </div>
    ),
    { ...size }
  )
}
