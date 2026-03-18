import { useEffect, useRef, useState } from 'react'

interface ThumbnailImageProps {
  id: string
  alt: string
  className: string
}

export const ThumbnailImage = ({ id, alt, className }: ThumbnailImageProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [source, setSource] = useState<string | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '220px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) {
      return
    }

    let cancelled = false
    void window.mediaNotebook
      .getThumbnail(id)
      .then((payload) => {
        if (!cancelled) {
          setSource(payload.url)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSource(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [id, visible])

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {source ? (
        <img src={source} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,91,56,0.24),transparent_34%),linear-gradient(135deg,#121826,#060912)] text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
          Secure Thumb
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
    </div>
  )
}
