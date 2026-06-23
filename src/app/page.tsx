import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LivePaymentFeed } from "@/components/landing/live-payment-feed"
import { ForArtists } from "@/components/landing/for-artists"
import { AgentLog } from "@/components/landing/agent-log"
import { BuiltWith } from "@/components/landing/built-with"
import { FinalCta } from "@/components/landing/final-cta"
import { ScrollReveal } from "@/components/ui/scroll-reveal"

export default function Home() {
  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .hero-section { height: 100svh !important; }
        }
        @media (max-width: 480px) {
          .hero-section { padding-left: 24px !important; padding-right: 24px !important; }
          .hero-section h1 { font-size: 28px !important; }
          .hero-section .hero-subtext { font-size: 14px !important; }
          .hero-section .hero-ctas { flex-direction: column !important; gap: 16px !important; }

          /* All sections */
          section { padding: 60px 24px !important; }

          /* How It Works */
          .steps-container { flex-direction: column !important; gap: 40px !important; }
          .step-title { font-size: 24px !important; }
          .step-desc { font-size: 16px !important; }

          /* Live Feed */
          .feed-row { flex-direction: column !important; gap: 4px !important; }
          .feed-track { font-size: 16px !important; }
          .feed-artist { font-size: 12px !important; }
          .feed-stats { flex-direction: column !important; gap: 16px !important; }
          .feed-stat-num { font-size: 22px !important; }

          /* Built With — 4 cols to 2x2 grid */
          .built-with-grid { grid-template-columns: repeat(2, 1fr) !important; }

          /* Final CTA */
          .cta-buttons { flex-direction: column !important; gap: 16px !important; }
          .cta-headline { font-size: 24px !important; }

          /* Footer */
          footer {
            flex-direction: column !important;
            gap: 16px !important;
            padding: 24px !important;
            text-align: center !important;
          }
        }
      `}</style>
      <Hero />
      <HowItWorks />
      <LivePaymentFeed />
      <ScrollReveal>
        <ForArtists />
      </ScrollReveal>
      <ScrollReveal>
        <AgentLog />
      </ScrollReveal>
      <ScrollReveal>
        <BuiltWith />
      </ScrollReveal>
      <ScrollReveal>
        <FinalCta />
      </ScrollReveal>
    </>
  )
}
