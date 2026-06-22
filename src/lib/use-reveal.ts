"use client"

import { useEffect, useRef, useState } from "react"

// Reveal-on-scroll: returns a ref to attach to an element and the fade-up style
// that animates once the element first enters the viewport. Replaces the
// IntersectionObserver boilerplate that was duplicated across page sections.
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(40px)",
    transition: "opacity 0.8s ease-out, transform 0.8s ease-out",
  }

  return { ref, style }
}
