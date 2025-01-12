'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const Home = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft)
    setScrollLeft(scrollContainerRef.current!.scrollLeft)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current!.offsetLeft
    const walk = (x - startX) * 2
    scrollContainerRef.current!.scrollLeft = scrollLeft - walk
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftArrow(scrollLeft > 0)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // Check initial state
    }
    return () => container?.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Super Cool Homepage Background</h1>
        
        {/* Scrollable Cards Container */}
        <div className="relative mb-8">
          {/* Scroll Arrows */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 p-2 rounded-full hover:bg-gray-700/80 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800/80 p-2 rounded-full hover:bg-gray-700/80 transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          
          <div
            ref={scrollContainerRef}
            className="flex gap-8 overflow-x-auto pb-4 px-4 cursor-grab active:cursor-grabbing snap-x snap-mandatory scrollbar-hide"
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* TlDraw Card */}
            <Link 
              href="/tldraw" 
              className="group flex-none w-[calc(33%-1rem)] min-w-[300px] block relative aspect-[4/3] border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-all duration-300 overflow-hidden snap-start"
              onClick={(e) => isDragging && e.preventDefault()}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <Image
                  src="/tldraw-preview.png"
                  alt="TlDraw Preview"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-contain object-center"
                  priority={true}
                  quality={90}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-gray-900/20" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                <h2 className="text-2xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">TLDraw</h2>
                <p className="text-gray-300">Interactive drawing and diagramming tool</p>
              </div>
            </Link>
            
            {/* AI Assistant Card */}
            <Link 
              href="/chatbot" 
              className="group flex-none w-[calc(33%-1rem)] min-w-[300px] block relative aspect-[4/3] border-2 border-gray-700 rounded-lg hover:border-blue-500 transition-all duration-300 overflow-hidden snap-start"
              onClick={(e) => isDragging && e.preventDefault()}
            >
              {/* Background Image */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
              </div>

              {/* Content */}
              <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                <h2 className="text-2xl font-semibold mb-2 text-white group-hover:text-blue-400 transition-colors">AI Assistant</h2>
                <p className="text-gray-300">Chat with Grok and generate images with Flux</p>
              </div>
            </Link>

            {/* Other project cards */}
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                className="flex-none w-[calc(33%-1rem)] min-w-[300px] aspect-[4/3] border-2 border-gray-700 rounded-lg flex flex-col justify-end p-4 relative snap-start"
              >
                <div className="absolute inset-0 bg-gray-800 rounded-lg" />
                <div className="relative z-10">
                  <h2 className="text-2xl font-semibold mb-2">Coming Soon</h2>
                  <p className="text-gray-400">More exciting features ahead...</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="w-full h-1 bg-gray-800 rounded-full mb-8 overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ 
              width: '33%',
              transform: `translateX(${scrollContainerRef.current ? (scrollContainerRef.current.scrollLeft / (scrollContainerRef.current.scrollWidth - scrollContainerRef.current.clientWidth)) * 100 : 0}%)`
            }}
          />
        </div>

        {/* Contact Section */}
        <div className="mt-auto">
          <h2 className="text-2xl font-semibold mb-4">Contact Dev...</h2>
          <a href="mailto:your-email@example.com" className="text-blue-400 hover:text-blue-300">
            email
          </a>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  )
}

export default Home 