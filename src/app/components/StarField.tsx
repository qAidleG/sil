'use client'

import { useEffect, useState } from 'react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
}

export const StarField = () => {
  const [stars, setStars] = useState<Star[]>([])
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    // Generate random stars
    const generateStars = () => {
      const newStars: Star[] = []
      for (let i = 0; i < 200; i++) {
        newStars.push({
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.8 + 0.2,
        })
      }
      setStars(newStars)
    }

    generateStars()

    // Animate the star field
    let animationFrame: number
    let time = 0
    const animate = () => {
      time += 0.001
      setOffset({
        x: Math.sin(time) * 10,
        y: Math.cos(time) * 10,
      })
      animationFrame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {stars.map((star, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white transition-transform duration-1000"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            opacity: star.opacity,
            transform: `translate(${offset.x}px, ${offset.y}px)`,
          }}
        />
      ))}
    </div>
  )
} 