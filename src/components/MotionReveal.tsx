import React from 'react'

export default function MotionReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div className="animate-float-in" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  )
}
