'use client'

import { motion } from 'framer-motion'
import React from 'react'

export default function MotionReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay }}
    >
      {children}
    </motion.div>
  )
}
