'use client'

import { Tldraw, Store } from '@tldraw/tldraw'
import '@tldraw/tldraw/tldraw.css'
import Link from 'next/link'
import { useCallback, useState } from 'react'

export default function TlDrawPage() {
  const [error, setError] = useState<boolean>(false)

  // Handle store changes
  const handlePersist = useCallback((store: Store) => {
    try {
      localStorage.setItem('tldraw', JSON.stringify(store.serialize()))
    } catch (e) {
      console.error('Failed to save TlDraw data:', e)
      setError(true)
    }
  }, [])

  // Load persisted state
  const loadInitialContent = useCallback(() => {
    if (typeof window === 'undefined') return undefined
    
    try {
      const persisted = localStorage.getItem('tldraw')
      if (persisted) {
        return JSON.parse(persisted)
      }
    } catch (e) {
      console.error('Failed to load TlDraw data:', e)
      setError(true)
    }
    return undefined
  }, [])

  // Error UI Component
  const ErrorDisplay = () => (
    <div className="h-full flex items-center justify-center bg-gray-800 text-white p-8">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">Something went wrong</h2>
        <p className="mb-4">There was an error loading your drawing.</p>
        <div className="space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('tldraw')
              setError(false)
            }}
            className="px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition-colors"
          >
            Reset Data
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <main className="h-screen flex flex-col bg-gray-900">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <Link 
          href="/" 
          className="text-white hover:text-blue-400 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          Back to Hub
        </Link>
        <h1 className="text-white font-semibold">TlDraw</h1>
      </nav>

      {/* TlDraw Canvas */}
      <div className="flex-1">
        {error ? (
          <ErrorDisplay />
        ) : (
          <Tldraw
            persistenceKey="sil-tldraw"
            store={loadInitialContent()}
            onMount={(editor) => {
              editor.store.listen(() => {
                handlePersist(editor.store)
              })
            }}
          />
        )}
      </div>
    </main>
  )
} 