"use client"
import React, { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }: { message: string; type?: 'info' | 'success' | 'error'; onClose?: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3500)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-gray-700'

  return (
    <div className={`fixed right-4 top-4 z-50 ${bg} text-white px-4 py-2 rounded shadow`}>{message}</div>
  )
}
