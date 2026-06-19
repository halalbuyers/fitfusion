'use client'

import React, { useEffect, useRef, useState } from 'react'

type Size = {
  width: number
  height: number
}

export default function ChartFrame({
  children,
  className = 'h-56 min-h-[224px]'
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<Size>({ width: 0, height: 0 })

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const update = () => {
      const rect = node.getBoundingClientRect()
      setSize({
        width: Math.max(0, Math.floor(rect.width)),
        height: Math.max(0, Math.floor(rect.height))
      })
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const ready = size.width > 0 && size.height > 0

  return (
    <div ref={ref} className={`min-w-0 ${className}`}>
      {ready ? children : <div className="h-full min-h-[inherit] animate-pulse rounded-[8px] bg-white/7" />}
    </div>
  )
}
