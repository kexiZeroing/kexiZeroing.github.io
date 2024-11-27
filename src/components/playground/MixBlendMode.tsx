"use client"

import React, { useState, useRef, useEffect } from 'react'

export default function MixBlendModeDemo() {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleStart = (clientX: number) => {
    isDragging.current = true
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const newPosition = (x / rect.width) * 100
      setPosition(Math.max(0, Math.min(100, newPosition)))
    }
  }

  const handleEnd = () => {
    isDragging.current = false
  }

  const handleMove = (clientX: number) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const newPosition = (x / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, newPosition)))
  }

  const handleMouseDown = (e: React.MouseEvent) => handleStart(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => handleMove(e.clientX)

  useEffect(() => {
    const handleGlobalEnd = () => {
      isDragging.current = false
    }

    window.addEventListener('mouseup', handleGlobalEnd)
    window.addEventListener('touchend', handleGlobalEnd)

    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd)
      window.removeEventListener('touchend', handleGlobalEnd)
    }
  }, [])

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gray-100">
      <div
        ref={containerRef}
        className="relative w-full max-w-3xl h-full max-h-[70dvh] overflow-hidden cursor-ew-resize select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onTouchEnd={handleEnd}
      >
        <div
          className="absolute inset-0 bg-white"
          style={{ width: `${position}%` }}
        />
        <div className="absolute inset-0 bg-black" style={{ left: `${position}%` }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="text-4xl font-bold mix-blend-difference text-white">
            Mix Blend Mode
          </h1>
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 bg-blue-500 cursor-ew-resize"
          style={{ left: `calc(${position}% - 2px)` }}
          aria-hidden="true"
        />
      </div>
      <p className="absolute bottom-6 text-center text-gray-400 text-xs">
        Drag the blue line to move the background and see the effect
      </p>
    </div>
  )
}
